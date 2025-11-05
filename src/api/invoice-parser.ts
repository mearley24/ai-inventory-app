import * as FileSystem from "expo-file-system";
import { ParsedInvoice } from "../types/inventory";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * Parse an invoice image or PDF using AI to extract line items
 * @param imageUri - Local file URI of the invoice image or PDF
 * @param mimeTypeHint - Optional MIME type hint from the picker
 * @returns ParsedInvoice with vendor info and line items
 */
export async function parseInvoiceImage(
  imageUri: string,
  mimeTypeHint?: string
): Promise<ParsedInvoice> {
  try {
    console.log("Parsing invoice with URI:", imageUri);
    console.log("MIME type hint:", mimeTypeHint);

    // Check if this is a PDF file
    const isPDF =
      imageUri.toLowerCase().endsWith('.pdf') ||
      imageUri.includes('application/pdf') ||
      mimeTypeHint === 'application/pdf';

    if (isPDF) {
      console.log("Detected PDF, using Claude API");
      return await parseInvoicePDF(imageUri);
    }

    // Get file info to determine the actual file type
    let mimeType = "image/jpeg"; // Default fallback

    // First try to use the provided MIME type hint
    if (mimeTypeHint) {
      if (mimeTypeHint.includes('png')) {
        mimeType = "image/png";
      } else if (mimeTypeHint.includes('gif')) {
        mimeType = "image/gif";
      } else if (mimeTypeHint.includes('webp')) {
        mimeType = "image/webp";
      } else if (mimeTypeHint.includes('jpeg') || mimeTypeHint.includes('jpg')) {
        mimeType = "image/jpeg";
      }
    } else {
      // Fall back to URI-based detection
      const lowerUri = imageUri.toLowerCase();
      if (lowerUri.includes('.png') || lowerUri.includes('image/png')) {
        mimeType = "image/png";
      } else if (lowerUri.includes('.gif') || lowerUri.includes('image/gif')) {
        mimeType = "image/gif";
      } else if (lowerUri.includes('.webp') || lowerUri.includes('image/webp')) {
        mimeType = "image/webp";
      } else if (lowerUri.includes('.jpg') || lowerUri.includes('.jpeg') || lowerUri.includes('image/jpeg')) {
        mimeType = "image/jpeg";
      }
    }

    console.log("Using MIME type:", mimeType);

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    console.log("File exists:", fileInfo.exists);
    if (!fileInfo.exists) {
      throw new Error("Invoice file not found. Please try selecting the file again.");
    }

    // Read the image as base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("Base64 length:", base64Image.length);

    // Call OpenAI Vision API (using gpt-4o-mini for faster processing)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert invoice parser. Extract all line items from invoices with their descriptions, quantities, unit prices, and total prices. Also extract vendor name, invoice number, date, subtotal, tax, and total. Output ONLY valid JSON with no additional text.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Parse this invoice and extract all line items. Return JSON in this exact format: {"vendor": "string or null", "invoiceNumber": "string or null", "date": "string or null", "lineItems": [{"description": "string", "quantity": number, "unitPrice": number, "totalPrice": number, "sku": "string or null", "category": "string or null"}], "subtotal": number or null, "tax": number or null, "total": number or null}. Capture ALL rows from any product/line item tables. Use null for missing fields.',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.0,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsedInvoice: ParsedInvoice = JSON.parse(content);

    // Validate that we got line items
    if (!parsedInvoice.lineItems || parsedInvoice.lineItems.length === 0) {
      throw new Error("No line items found in invoice");
    }

    return parsedInvoice;
  } catch (error) {
    console.error("Invoice parsing error:", error);
    throw error;
  }
}

/**
 * Parse PDF invoice using Claude API (supports PDFs natively)
 * @param pdfUri - Local file URI of the PDF invoice
 * @returns ParsedInvoice with vendor info and line items
 */
export async function parseInvoicePDF(pdfUri: string): Promise<ParsedInvoice> {
  try {
    console.log("Parsing PDF invoice:", pdfUri);

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(pdfUri);
    if (!fileInfo.exists) {
      throw new Error("PDF file not found. Please try selecting the file again.");
    }

    // Read the PDF as base64
    const base64PDF = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("PDF base64 length:", base64PDF.length);

    const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

    // Use direct fetch to Claude API (more reliable in React Native)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64PDF,
                },
              },
              {
                type: "text",
                text: 'Parse this invoice PDF and extract all line items. Return ONLY valid JSON in this exact format (no markdown, no code blocks): {"vendor": "string or null", "invoiceNumber": "string or null", "date": "string or null", "lineItems": [{"description": "string", "quantity": number, "unitPrice": number, "totalPrice": number, "sku": "string or null", "category": "string or null"}], "subtotal": number or null, "tax": number or null, "total": number or null}. Capture ALL rows from any product/line item tables. Use null for missing fields.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Claude API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract the text content from Claude's response
    const textContent = data.content.find((block: any) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude API");
    }

    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json\n?|\n?```/g, "").trim();
    }

    console.log("Claude response:", jsonText);

    const parsedInvoice: ParsedInvoice = JSON.parse(jsonText);

    // Validate that we got line items
    if (!parsedInvoice.lineItems || parsedInvoice.lineItems.length === 0) {
      throw new Error("No line items found in PDF invoice");
    }

    return parsedInvoice;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw error;
  }
}

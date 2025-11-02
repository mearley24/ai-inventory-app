import * as FileSystem from "expo-file-system";
import { ParsedInvoice } from "../types/inventory";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

/**
 * Parse an invoice image using GPT-4o Vision to extract line items
 * @param imageUri - Local file URI of the invoice image
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
    if (
      imageUri.toLowerCase().endsWith('.pdf') ||
      imageUri.includes('application/pdf') ||
      mimeTypeHint === 'application/pdf'
    ) {
      throw new Error(
        "PDF files are not supported yet. Please take a photo or screenshot of your invoice instead."
      );
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

    // Call OpenAI Vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
        max_tokens: 4096,
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
 * Convert PDF to images and parse (for multi-page invoices)
 * Note: This is a placeholder - PDF conversion would require additional library
 * For now, user should take photo/screenshot of invoice
 */
export async function parseInvoicePDF(pdfUri: string): Promise<ParsedInvoice> {
  throw new Error(
    "PDF parsing not yet implemented. Please use an image of the invoice (photo or screenshot)."
  );
}

import * as FileSystem from "expo-file-system";
import { parseInvoiceImage } from "../api/invoice-parser";
import { useInventoryStore } from "../state/inventoryStore";
import { matchCategory } from "../utils/categories";

// Define the invoice folder path
export const INVOICE_FOLDER_PATH = `${FileSystem.documentDirectory}invoices/`;

/**
 * Initialize the invoice folder if it doesn't exist
 */
export async function initializeInvoiceFolder(): Promise<void> {
  try {
    const folderInfo = await FileSystem.getInfoAsync(INVOICE_FOLDER_PATH);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(INVOICE_FOLDER_PATH, {
        intermediates: true,
      });
      console.log("Invoice folder created at:", INVOICE_FOLDER_PATH);
    }
  } catch (error) {
    console.error("Error initializing invoice folder:", error);
    throw error;
  }
}

/**
 * Get all files from the invoice folder
 */
export async function getInvoiceFiles(): Promise<string[]> {
  try {
    await initializeInvoiceFolder();
    const files = await FileSystem.readDirectoryAsync(INVOICE_FOLDER_PATH);

    // Filter for supported file types
    const supportedFiles = files.filter((file) => {
      const lowerFile = file.toLowerCase();
      return (
        lowerFile.endsWith(".pdf") ||
        lowerFile.endsWith(".png") ||
        lowerFile.endsWith(".jpg") ||
        lowerFile.endsWith(".jpeg") ||
        lowerFile.endsWith(".gif") ||
        lowerFile.endsWith(".webp")
      );
    });

    return supportedFiles;
  } catch (error) {
    console.error("Error reading invoice folder:", error);
    return [];
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

/**
 * Track processed files to avoid re-processing
 */
const processedFiles = new Set<string>();

/**
 * Get the set of processed files
 */
export function getProcessedFiles(): Set<string> {
  return processedFiles;
}

/**
 * Mark a file as processed
 */
export function markFileAsProcessed(filename: string): void {
  processedFiles.add(filename);
}

/**
 * Clear all processed file tracking
 */
export function clearProcessedFiles(): void {
  processedFiles.clear();
}

/**
 * Scan the invoice folder and parse any new invoices
 * @param onProgress - Optional callback for progress updates
 * @returns Summary of scan results
 */
export async function scanAndParseInvoices(
  onProgress?: (message: string) => void
): Promise<{
  total: number;
  processed: number;
  skipped: number;
  errors: number;
  newItems: number;
}> {
  const results = {
    total: 0,
    processed: 0,
    skipped: 0,
    errors: 0,
    newItems: 0,
  };

  try {
    onProgress?.("Scanning invoice folder...");

    const files = await getInvoiceFiles();
    results.total = files.length;

    if (files.length === 0) {
      onProgress?.("No invoices found in folder");
      return results;
    }

    onProgress?.(`Found ${files.length} invoice files`);

    // Get the addItems function from the store
    const addItems = useInventoryStore.getState().addItems;

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filePath = `${INVOICE_FOLDER_PATH}${filename}`;

      // Skip if already processed
      if (processedFiles.has(filename)) {
        results.skipped++;
        onProgress?.(`Skipping ${filename} (already processed)`);
        continue;
      }

      try {
        onProgress?.(`Parsing ${filename} (${i + 1}/${files.length})...`);

        const mimeType = getMimeTypeFromExtension(filename);
        const parsed = await parseInvoiceImage(filePath, mimeType);

        // Convert to inventory items
        const itemsToAdd = parsed.lineItems.map((lineItem) => ({
          name: lineItem.description,
          quantity: lineItem.quantity,
          price: lineItem.unitPrice,
          category: lineItem.category
            ? matchCategory(lineItem.category)
            : "Other",
          barcode: lineItem.sku || undefined,
          description: `From ${parsed.vendor || "invoice"} - Invoice #${parsed.invoiceNumber || "N/A"}`,
        }));

        addItems(itemsToAdd);
        results.newItems += itemsToAdd.length;
        results.processed++;

        // Mark as processed
        markFileAsProcessed(filename);

        onProgress?.(
          `✓ Parsed ${filename}: ${itemsToAdd.length} items added`
        );
      } catch (error) {
        results.errors++;
        console.error(`Error parsing ${filename}:`, error);
        onProgress?.(
          `✗ Failed to parse ${filename}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    onProgress?.("Scan complete!");
    return results;
  } catch (error) {
    console.error("Error scanning invoices:", error);
    throw error;
  }
}

/**
 * Move or copy an invoice file to the invoice folder
 */
export async function addInvoiceToFolder(
  sourceUri: string,
  filename?: string
): Promise<string> {
  try {
    await initializeInvoiceFolder();

    // Generate filename if not provided
    const finalFilename =
      filename || `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;

    const destinationUri = `${INVOICE_FOLDER_PATH}${finalFilename}`;

    // Copy the file to the invoice folder
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    console.log("Invoice added to folder:", destinationUri);
    return destinationUri;
  } catch (error) {
    console.error("Error adding invoice to folder:", error);
    throw error;
  }
}

/**
 * Delete an invoice file from the folder
 */
export async function deleteInvoiceFromFolder(filename: string): Promise<void> {
  try {
    const filePath = `${INVOICE_FOLDER_PATH}${filename}`;
    await FileSystem.deleteAsync(filePath);
    processedFiles.delete(filename);
    console.log("Invoice deleted:", filePath);
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
}

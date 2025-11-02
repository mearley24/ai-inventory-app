import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { scanAndParseInvoices } from "./invoiceScanner";

const INVOICE_SCANNER_TASK = "invoice-scanner-task";

/**
 * Define the background task for scanning invoices
 */
TaskManager.defineTask(INVOICE_SCANNER_TASK, async () => {
  try {
    console.log("Running invoice scanner background task...");

    const results = await scanAndParseInvoices((message) => {
      console.log("Invoice scan:", message);
    });

    console.log("Invoice scan completed:", results);

    // Return success
    return results.processed > 0 || results.errors > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("Invoice scanner task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background task to run every hour
 */
export async function registerInvoiceScannerTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      INVOICE_SCANNER_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(INVOICE_SCANNER_TASK, {
        minimumInterval: 60 * 60, // 1 hour in seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Invoice scanner background task registered");
    } else {
      console.log("Invoice scanner task already registered");
    }
  } catch (error) {
    console.error("Error registering invoice scanner task:", error);
  }
}

/**
 * Unregister the background task
 */
export async function unregisterInvoiceScannerTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      INVOICE_SCANNER_TASK
    );

    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(INVOICE_SCANNER_TASK);
      console.log("Invoice scanner task unregistered");
    }
  } catch (error) {
    console.error("Error unregistering invoice scanner task:", error);
  }
}

/**
 * Check if the background task is registered
 */
export async function isInvoiceScannerTaskRegistered(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(INVOICE_SCANNER_TASK);
  } catch (error) {
    console.error("Error checking task registration:", error);
    return false;
  }
}

import * as FileSystem from "expo-file-system";
import { useInventoryStore } from "../state/inventoryStore";
import { parseDToolsFile } from "./dtoolsParser";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the D-Tools folder path
export const DTOOLS_FOLDER_PATH = `${FileSystem.documentDirectory}dtools/`;

// Key for storing processed files metadata
const PROCESSED_FILES_KEY = "dtools-processed-files";

/**
 * Initialize the D-Tools folder if it doesn't exist
 */
export async function initializeDToolsFolder(): Promise<void> {
  try {
    const folderInfo = await FileSystem.getInfoAsync(DTOOLS_FOLDER_PATH);
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(DTOOLS_FOLDER_PATH, {
        intermediates: true,
      });
      console.log("D-Tools folder created at:", DTOOLS_FOLDER_PATH);
    }
  } catch (error) {
    console.error("Error initializing D-Tools folder:", error);
    throw error;
  }
}

/**
 * Get all D-Tools files from the folder
 */
export async function getDToolsFiles(): Promise<string[]> {
  try {
    await initializeDToolsFolder();
    const files = await FileSystem.readDirectoryAsync(DTOOLS_FOLDER_PATH);

    // Filter for supported file types (CSV and Excel)
    const supportedFiles = files.filter((file) => {
      const lowerFile = file.toLowerCase();
      return (
        lowerFile.endsWith(".csv") ||
        lowerFile.endsWith(".xlsx") ||
        lowerFile.endsWith(".xls")
      );
    });

    return supportedFiles;
  } catch (error) {
    console.error("Error reading D-Tools folder:", error);
    return [];
  }
}

/**
 * Get list of processed files
 */
export async function getProcessedFiles(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(PROCESSED_FILES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return new Set(parsed);
    }
    return new Set();
  } catch (error) {
    console.error("Error loading processed files:", error);
    return new Set();
  }
}

/**
 * Mark a file as processed
 */
export async function markFileAsProcessed(filename: string): Promise<void> {
  try {
    const processed = await getProcessedFiles();
    processed.add(filename);
    await AsyncStorage.setItem(
      PROCESSED_FILES_KEY,
      JSON.stringify(Array.from(processed))
    );
  } catch (error) {
    console.error("Error marking file as processed:", error);
  }
}

/**
 * Clear processing history
 */
export async function clearProcessingHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROCESSED_FILES_KEY);
    console.log("D-Tools processing history cleared");
  } catch (error) {
    console.error("Error clearing processing history:", error);
  }
}

/**
 * Process a single D-Tools file
 */
export async function processDToolsFile(
  filename: string
): Promise<{ itemsAdded: number; projectsCreated: number }> {
  try {
    const filePath = `${DTOOLS_FOLDER_PATH}${filename}`;

    // Use existing D-Tools parser to extract items and projects
    const result = await parseDToolsFile(filePath);

    // Get store methods
    const { addItems } = useInventoryStore.getState();

    // Add items to inventory
    await addItems(result.items);

    // Mark as processed
    await markFileAsProcessed(filename);

    return {
      itemsAdded: result.items.length,
      projectsCreated: result.projects.length,
    };
  } catch (error) {
    console.error(`Error processing D-Tools file ${filename}:`, error);
    throw error;
  }
}

/**
 * Scan folder and process all new D-Tools files
 */
export async function scanAndProcessDToolsFiles(): Promise<{
  filesProcessed: number;
  totalItemsAdded: number;
  totalProjectsCreated: number;
}> {
  try {
    // Get all files in folder
    const allFiles = await getDToolsFiles();

    // Get already processed files
    const processedFiles = await getProcessedFiles();

    // Filter to only new files
    const newFiles = allFiles.filter((file) => !processedFiles.has(file));

    if (newFiles.length === 0) {
      console.log("No new D-Tools files to process");
      return { filesProcessed: 0, totalItemsAdded: 0, totalProjectsCreated: 0 };
    }

    console.log(`Found ${newFiles.length} new D-Tools files to process`);

    let totalItemsAdded = 0;
    let totalProjectsCreated = 0;

    // Process each new file
    for (const file of newFiles) {
      try {
        const result = await processDToolsFile(file);
        totalItemsAdded += result.itemsAdded;
        totalProjectsCreated += result.projectsCreated;
        console.log(
          `Processed ${file}: ${result.itemsAdded} items, ${result.projectsCreated} projects`
        );
      } catch (error) {
        console.error(`Failed to process ${file}:`, error);
        // Continue with next file even if one fails
      }
    }

    return {
      filesProcessed: newFiles.length,
      totalItemsAdded,
      totalProjectsCreated,
    };
  } catch (error) {
    console.error("Error scanning D-Tools folder:", error);
    throw error;
  }
}

/**
 * Delete a file from the D-Tools folder
 */
export async function deleteDToolsFile(filename: string): Promise<void> {
  try {
    const filePath = `${DTOOLS_FOLDER_PATH}${filename}`;
    await FileSystem.deleteAsync(filePath);
    console.log(`Deleted D-Tools file: ${filename}`);
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    throw error;
  }
}

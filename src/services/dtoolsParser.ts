import * as XLSX from "xlsx";
import { InventoryItem } from "../types/inventory";
import { Project } from "../types/inventory";

export interface DToolsImportResult {
  items: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "companyId">[];
  projects: Omit<Project, "id" | "createdAt" | "totalTime">[];
  errors: string[];
}

/**
 * Parse D-Tools BOM (Bill of Materials) export file
 * D-Tools typically exports with these columns:
 * - Item/Product Name, Manufacturer, Model, Category, Quantity, Unit Price, Extended Price, Location/Room, Notes
 */
export async function parseDToolsFile(fileUri: string): Promise<DToolsImportResult> {
  const result: DToolsImportResult = {
    items: [],
    projects: [],
    errors: [],
  };

  try {
    // Read file
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Parse with XLSX
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (jsonData.length === 0) {
      result.errors.push("File is empty or has no data");
      return result;
    }

    // Track unique projects/locations
    const projectMap = new Map<string, { name: string; items: number }>();

    // Parse items
    jsonData.forEach((row: any, index: number) => {
      try {
        // Common D-Tools column name variations
        const itemName =
          row["Item"] ||
          row["Product"] ||
          row["Product Name"] ||
          row["Item Name"] ||
          row["Description"] ||
          row["Item Description"] ||
          "";

        const manufacturer = row["Manufacturer"] || row["Mfg"] || row["Brand"] || "";
        const model = row["Model"] || row["Model Number"] || row["Part Number"] || "";

        const quantity =
          parseInt(row["Quantity"] || row["Qty"] || row["QTY"] || "0") || 0;

        const price =
          parseFloat(
            row["Unit Price"] ||
            row["Price"] ||
            row["Unit Cost"] ||
            row["Cost"] ||
            "0"
          ) || undefined;

        const category =
          row["Category"] ||
          row["Type"] ||
          row["Product Type"] ||
          row["System"] ||
          "Other";

        const location =
          row["Location"] ||
          row["Room"] ||
          row["Area"] ||
          row["Zone"] ||
          row["Project"] ||
          "";

        const notes =
          row["Notes"] ||
          row["Description"] ||
          row["Comments"] ||
          row["Remarks"] ||
          "";

        // Build item name with manufacturer and model if available
        let fullName = itemName.trim();
        if (manufacturer && !fullName.toLowerCase().includes(manufacturer.toLowerCase())) {
          fullName = `${manufacturer} ${fullName}`.trim();
        }
        if (model && !fullName.toLowerCase().includes(model.toLowerCase())) {
          fullName = `${fullName} ${model}`.trim();
        }

        if (!fullName) {
          result.errors.push(`Row ${index + 2}: Missing item name`);
          return;
        }

        // Track projects/locations
        if (location) {
          if (!projectMap.has(location)) {
            projectMap.set(location, { name: location, items: 0 });
          }
          projectMap.get(location)!.items++;
        }

        // Create inventory item
        const item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "companyId"> = {
          name: fullName,
          quantity,
          category: mapDToolsCategory(category),
          price,
          description: notes || undefined,
          barcode: model || undefined,
        };

        result.items.push(item);
      } catch (error) {
        result.errors.push(
          `Row ${index + 2}: ${error instanceof Error ? error.message : "Parse error"}`
        );
      }
    });

    // Create projects from unique locations
    const projectColors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];
    let colorIndex = 0;

    projectMap.forEach((projectData, location) => {
      if (location && projectData.items > 0) {
        result.projects.push({
          name: location,
          description: `Imported from D-Tools - ${projectData.items} items`,
          color: projectColors[colorIndex % projectColors.length],
        });
        colorIndex++;
      }
    });

    return result;
  } catch (error) {
    result.errors.push(
      `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return result;
  }
}

/**
 * Map D-Tools categories to app categories
 */
function mapDToolsCategory(dtoolsCategory: string): string {
  const normalized = dtoolsCategory.toLowerCase().trim();

  // Control systems
  if (
    normalized.includes("control") ||
    normalized.includes("automation") ||
    normalized.includes("processor")
  ) {
    return "Control4";
  }

  // Audio
  if (
    normalized.includes("audio") ||
    normalized.includes("speaker") ||
    normalized.includes("amplifier") ||
    normalized.includes("receiver")
  ) {
    return "Audio";
  }

  // Video/Display
  if (
    normalized.includes("video") ||
    normalized.includes("display") ||
    normalized.includes("tv") ||
    normalized.includes("television") ||
    normalized.includes("monitor") ||
    normalized.includes("projector")
  ) {
    return "Televisions";
  }

  // Networking
  if (
    normalized.includes("network") ||
    normalized.includes("switch") ||
    normalized.includes("router") ||
    normalized.includes("wifi") ||
    normalized.includes("access point")
  ) {
    return "Networking";
  }

  // Surveillance
  if (
    normalized.includes("camera") ||
    normalized.includes("surveillance") ||
    normalized.includes("security") ||
    normalized.includes("nvr") ||
    normalized.includes("dvr")
  ) {
    return "Surveillance";
  }

  // Lighting
  if (
    normalized.includes("light") ||
    normalized.includes("dimmer") ||
    normalized.includes("switch") ||
    normalized.includes("fixture")
  ) {
    return "Lighting";
  }

  // Cable/Wire
  if (
    normalized.includes("cable") ||
    normalized.includes("wire") ||
    normalized.includes("connector") ||
    normalized.includes("hdmi") ||
    normalized.includes("cat")
  ) {
    return "Cables";
  }

  // Mounts
  if (
    normalized.includes("mount") ||
    normalized.includes("bracket") ||
    normalized.includes("rack")
  ) {
    return "Mounts";
  }

  // Power
  if (
    normalized.includes("power") ||
    normalized.includes("ups") ||
    normalized.includes("battery") ||
    normalized.includes("surge")
  ) {
    return "Power";
  }

  return "Other";
}

/**
 * Validate D-Tools file structure
 */
export function validateDToolsFile(jsonData: any[]): {
  isValid: boolean;
  error?: string;
} {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return { isValid: false, error: "File is empty or invalid" };
  }

  const firstRow = jsonData[0];
  const hasItemColumn =
    firstRow["Item"] ||
    firstRow["Product"] ||
    firstRow["Product Name"] ||
    firstRow["Item Name"] ||
    firstRow["Description"];

  if (!hasItemColumn) {
    return {
      isValid: false,
      error: "Missing required column: Item/Product name",
    };
  }

  return { isValid: true };
}

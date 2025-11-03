import { InventoryItem } from "../types/inventory";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

// Category structure with subcategories
interface CategoryStructure {
  [category: string]: string[];
}

// Cancellation token for AI recategorization
export class CancellationToken {
  private _isCancelled = false;

  cancel() {
    this._isCancelled = true;
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  throwIfCancelled() {
    if (this._isCancelled) {
      throw new Error("Operation was cancelled");
    }
  }
}

// Predefined category sets for popular suppliers with subcategories
const SUPPLIER_CATEGORIES: { [key: string]: CategoryStructure } = {
  "snapav.com": {
    "Control4": [
      "Controllers",
      "Keypads",
      "Interfaces",
      "Dimmers & Switches",
      "Remotes",
      "Sensors",
      "Other Control4",
    ],
    "Audio": [
      "Amplifiers",
      "Receivers",
      "Speakers",
      "Subwoofers",
      "Audio Processors",
      "Media Streamers",
      "Other Audio",
    ],
    "Bulk Wire & Connectors": [
      "Speaker Wire",
      "Network Cable",
      "Coax Cable",
      "Connectors",
      "Patch Panels",
      "Other Wire",
    ],
    "Cables": [
      "HDMI Cables",
      "Network Cables",
      "Audio Cables",
      "Video Cables",
      "Power Cables",
      "Adapters",
      "Other Cables",
    ],
    "Conferencing": [
      "Cameras",
      "Microphones",
      "Speakers",
      "Control Systems",
      "Accessories",
      "Other Conferencing",
    ],
    "Control": [
      "Remotes",
      "Keypads",
      "Touch Panels",
      "Controllers",
      "Sensors",
      "Other Control",
    ],
    "Lighting": [
      "Dimmers",
      "Switches",
      "LED Fixtures",
      "Controls",
      "Sensors",
      "Other Lighting",
    ],
    "Media Distribution": [
      "Matrices",
      "Extenders",
      "Scalers",
      "Distribution Amps",
      "Transmitters",
      "Receivers",
      "Other Distribution",
    ],
    "Mounts": [
      "TV Mounts",
      "Speaker Mounts",
      "Camera Mounts",
      "Ceiling Mounts",
      "Wall Plates",
      "Other Mounts",
    ],
    "Networking": [
      "Switches",
      "Routers",
      "Access Points",
      "Network Adapters",
      "PoE Injectors",
      "Network Tools",
      "Other Networking",
    ],
    "Power": [
      "UPS Systems",
      "Power Conditioners",
      "Surge Protectors",
      "PDUs",
      "Power Supplies",
      "Other Power",
    ],
    "Projectors & Screens": [
      "Projectors",
      "Screens",
      "Mounts",
      "Accessories",
      "Other Projection",
    ],
    "Racks": [
      "Equipment Racks",
      "Wall Mount Racks",
      "Rack Accessories",
      "Cable Management",
      "Other Racks",
    ],
    "Smart Security & Access": [
      "Door Locks",
      "Thermostats",
      "Sensors",
      "Access Control",
      "Intercoms",
      "Other Security",
    ],
    "Speakers": [
      "In-Ceiling",
      "In-Wall",
      "Outdoor",
      "Bookshelf",
      "Soundbars",
      "Subwoofers",
      "Other Speakers",
    ],
    "Surveillance": [
      "IP Cameras",
      "NVRs",
      "DVRs",
      "Camera Accessories",
      "Video Management",
      "Other Surveillance",
    ],
    "Televisions": [
      "Commercial Displays",
      "Residential TVs",
      "Outdoor TVs",
      "Accessories",
      "Other Displays",
    ],
    "Tools & Hardware": [
      "Installation Tools",
      "Test Equipment",
      "Hardware",
      "Connectors",
      "Other Tools",
    ],
    "Other": ["Uncategorized"],
  },
};

/**
 * Get flat list of all category + subcategory combinations
 */
function getFlatCategoryList(structure: CategoryStructure): string[] {
  const flat: string[] = [];
  for (const [category, subcategories] of Object.entries(structure)) {
    for (const subcategory of subcategories) {
      flat.push(`${category} > ${subcategory}`);
    }
  }
  return flat;
}

/**
 * Get categories for a website
 */
export async function getCategoriesForWebsite(
  websiteUrl: string
): Promise<CategoryStructure> {
  try {
    // Normalize URL
    const domain = websiteUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();

    console.log("Looking up categories for domain:", domain);

    // Check if we have predefined categories for this supplier
    for (const [key, structure] of Object.entries(SUPPLIER_CATEGORIES)) {
      if (domain.includes(key)) {
        console.log("Found predefined categories for:", key);
        return structure;
      }
    }

    // If no predefined categories, use generic structure
    console.log("No predefined categories, using generic structure");
    return {
      "Audio & Video": ["Speakers", "Amplifiers", "Players", "Accessories", "Other"],
      "Cables & Connectors": ["HDMI", "Network", "Audio", "Power", "Adapters", "Other"],
      "Cameras & Surveillance": ["IP Cameras", "NVRs", "Accessories", "Other"],
      "Computers & Networking": ["Switches", "Routers", "Accessories", "Other"],
      "Control Systems": ["Controllers", "Remotes", "Keypads", "Other"],
      "Lighting": ["Fixtures", "Controls", "Dimmers", "Other"],
      "Mounts & Hardware": ["TV Mounts", "Speaker Mounts", "Hardware", "Other"],
      "Power & Distribution": ["UPS", "Surge Protection", "PDUs", "Other"],
      "Security & Access": ["Locks", "Sensors", "Access Control", "Other"],
      "Tools & Equipment": ["Installation Tools", "Test Equipment", "Other"],
      "Other": ["Uncategorized"],
    };
  } catch (error) {
    console.error("Error getting categories:", error);
    return SUPPLIER_CATEGORIES["snapav.com"];
  }
}

/**
 * Use AI to recategorize items based on their names and descriptions
 */
export async function recategorizeItems(
  items: InventoryItem[],
  categoryStructure: CategoryStructure,
  onProgress?: (message: string, current: number, total: number) => void,
  cancellationToken?: CancellationToken
): Promise<{ id: string; oldCategory: string; newCategory: string; oldSubcategory?: string; newSubcategory: string }[]> {
  const results: { id: string; oldCategory: string; newCategory: string; oldSubcategory?: string; newSubcategory: string }[] = [];

  if (items.length === 0) {
    return results;
  }

  // Check for API key
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key is not configured");
    throw new Error("OpenAI API key is not configured. Please add EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY to your environment.");
  }

  // Check if cancelled before starting
  cancellationToken?.throwIfCancelled();

  onProgress?.("Analyzing items with AI...", 0, items.length);

  // Get flat list of category > subcategory combinations
  const flatCategories = getFlatCategoryList(categoryStructure);

  // SPEED OPTIMIZATION 1: Batch size of 30 (reduced from 50 to prevent JSON parse errors)
  // Larger batches can cause incomplete responses or parsing errors
  const batchSize = 30;
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  let processedCount = 0;

  // SPEED OPTIMIZATION 2: Process batches in parallel (3 at a time)
  const concurrentBatches = 3;
  const batchPromises: Promise<void>[] = [];

  const processBatch = async (batch: InventoryItem[], batchIndex: number) => {
    try {
      // Check for cancellation before processing each batch
      cancellationToken?.throwIfCancelled();

      // Only include id and name for faster processing (skip description for speed)
      const itemsForAI = batch.map((item) => ({
        id: item.id,
        name: item.name,
      }));

      // SPEED OPTIMIZATION 3: Shorter, more direct prompt
      const prompt = `Categorize these products into "Category > Subcategory" format.

Categories:
${flatCategories.slice(0, 50).join("\n")}

Products:
${itemsForAI.map(item => `${item.id}: ${item.name}`).join("\n")}

Return JSON array:
[{"id": "id", "category": "Main", "subcategory": "Sub"}]`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Fast model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.0,
            max_tokens: 1500, // Reduced for speed
          }),
        }
      );

      // Check for cancellation after API call
      cancellationToken?.throwIfCancelled();

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Batch ${batchIndex} error:`, errorText);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      // Parse JSON response with error handling
      let data;
      try {
        const responseText = await response.text();
        console.log(`Batch ${batchIndex} response length:`, responseText.length);

        if (!responseText || responseText.trim().length === 0) {
          throw new Error("Empty response from API");
        }

        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`Batch ${batchIndex} JSON parse error:`, jsonError);
        console.error(`Response may have been too large or incomplete`);
        throw new Error(`Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error(`Batch ${batchIndex} invalid response structure:`, JSON.stringify(data));
        throw new Error("Invalid response structure from API");
      }

      let content = data.choices[0].message.content.trim();

      // Log first batch response for debugging
      if (batchIndex === 0) {
        console.log("First batch AI response:", content.substring(0, 500));
      }

      // Remove markdown code blocks if present
      if (content.startsWith("```")) {
        content = content.replace(/```json\n?|\n?```/g, "").trim();
      }

      // Remove any text before the JSON array
      // AI sometimes adds explanatory text like "Here is the JSON:"
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']');

      if (jsonStart === -1 || jsonEnd === -1) {
        console.error(`Batch ${batchIndex} no JSON array found in response:`, content.substring(0, 300));
        throw new Error("No JSON array found in AI response");
      }

      // Extract just the JSON array
      content = content.substring(jsonStart, jsonEnd + 1).trim();

      // Parse categorizations with error handling
      let categorizations;
      try {
        categorizations = JSON.parse(content) as {
          id: string;
          category: string;
          subcategory: string;
        }[];
      } catch (parseError) {
        console.error(`Batch ${batchIndex} failed to parse categorizations:`, content.substring(0, 200));
        throw new Error(`Failed to parse categorization results: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      }

      if (!Array.isArray(categorizations)) {
        console.error(`Batch ${batchIndex} categorizations is not an array:`, typeof categorizations);
        throw new Error("Invalid categorization format - expected array");
      }

      // Process results
      for (const cat of categorizations) {
        const item = batch.find((i) => i.id === cat.id);
        if (item) {
          console.log(`Item "${item.name}": ${item.category} > ${item.subcategory || 'none'} → ${cat.category} > ${cat.subcategory}`);

          if (item.category !== cat.category || item.subcategory !== cat.subcategory) {
            console.log(`  ✓ Change detected for "${item.name}"`);
            results.push({
              id: item.id,
              oldCategory: item.category,
              newCategory: cat.category,
              oldSubcategory: item.subcategory,
              newSubcategory: cat.subcategory,
            });
          } else {
            console.log(`  - No change needed for "${item.name}"`);
          }
        }
      }

      processedCount += batch.length;
      onProgress?.(
        `Processed ${processedCount} of ${items.length} items...`,
        processedCount,
        items.length
      );
    } catch (error) {
      // If it's a cancellation error, re-throw it to stop processing
      if (error instanceof Error && error.message === "Operation was cancelled") {
        throw error;
      }

      console.error(`Error in batch ${batchIndex}:`, error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }

      // Mark these items as processed even though they failed
      // so progress counter is accurate
      processedCount += batch.length;

      onProgress?.(
        `Error in batch ${batchIndex}, skipping ${batch.length} items... (${processedCount}/${items.length})`,
        processedCount,
        items.length
      );
    }
  };

  // Process batches with controlled concurrency
  for (let i = 0; i < batches.length; i += concurrentBatches) {
    // Check for cancellation before each batch group
    cancellationToken?.throwIfCancelled();

    const currentBatchGroup = batches.slice(i, i + concurrentBatches);
    const promises = currentBatchGroup.map((batch, index) =>
      processBatch(batch, i + index)
    );
    await Promise.all(promises);
  }

  return results;
}

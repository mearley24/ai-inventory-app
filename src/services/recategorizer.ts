import { InventoryItem } from "../types/inventory";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

// Category structure with subcategories
interface CategoryStructure {
  [category: string]: string[];
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
  onProgress?: (message: string, current: number, total: number) => void
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

  onProgress?.("Analyzing items with AI...", 0, items.length);

  // Get flat list of category > subcategory combinations
  const flatCategories = getFlatCategoryList(categoryStructure);

  // Batch items for efficiency (process in chunks of 20)
  const batchSize = 20;
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  let processedCount = 0;

  for (const batch of batches) {
    try {
      const itemsForAI = batch.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        currentCategory: item.category,
        currentSubcategory: item.subcategory,
      }));

      const prompt = `You are a product categorization expert.

Given these inventory items, categorize each one into the most appropriate category and subcategory.

Available categories and subcategories:
${flatCategories.join("\n")}

Items to categorize:
${JSON.stringify(itemsForAI, null, 2)}

IMPORTANT: Each category is formatted as "Main Category > Subcategory".
You must split this into separate category and subcategory fields.

For example, "Audio > Amplifiers" becomes:
- category: "Audio"
- subcategory: "Amplifiers"

Return ONLY a JSON array with this exact format (no markdown, no code blocks):
[
  {
    "id": "item_id",
    "category": "Main Category",
    "subcategory": "Subcategory"
  }
]

Rules:
- Split the "Category > Subcategory" format into two separate fields
- Use the exact category and subcategory names from the list above
- Match based on product name and description
- Return valid JSON only`;

      console.log("Making OpenAI API request...");

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.0,
            max_tokens: 2000,
          }),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error response:", errorText);
        throw new Error(
          `OpenAI API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      let content = data.choices[0].message.content.trim();

      // Remove markdown code blocks if present
      if (content.startsWith("```")) {
        content = content.replace(/```json\n?|\n?```/g, "").trim();
      }

      const categorizations = JSON.parse(content) as {
        id: string;
        category: string;
        subcategory: string;
      }[];

      // Process results
      for (const cat of categorizations) {
        const item = batch.find((i) => i.id === cat.id);
        if (item && (item.category !== cat.category || item.subcategory !== cat.subcategory)) {
          results.push({
            id: item.id,
            oldCategory: item.category,
            newCategory: cat.category,
            oldSubcategory: item.subcategory,
            newSubcategory: cat.subcategory,
          });
        }
      }

      processedCount += batch.length;
      onProgress?.(
        `Processed ${processedCount} of ${items.length} items...`,
        processedCount,
        items.length
      );
    } catch (error) {
      console.error("Error in batch categorization:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      // Continue with next batch even if one fails
      onProgress?.(
        `Error processing batch, continuing... (${processedCount}/${items.length})`,
        processedCount,
        items.length
      );
    }
  }

  return results;
}

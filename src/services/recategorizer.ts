import { InventoryItem } from "../types/inventory";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

/**
 * Fetch categories from a website using AI
 */
export async function extractCategoriesFromWebsite(
  websiteUrl: string
): Promise<string[]> {
  try {
    console.log("Fetching categories from:", websiteUrl);

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: `Visit this website and extract all product categories: ${websiteUrl}

Return ONLY a JSON array of category names (no markdown, no code blocks):
["Category 1", "Category 2", "Category 3"]

Rules:
- Extract main product categories only
- Include subcategories if they are distinct product types
- Remove generic categories like "All Products" or "Home"
- Return at least 5-20 categories
- Add "Other" as the last category`,
            },
          ],
          temperature: 0.0,
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    if (content.startsWith("```")) {
      content = content.replace(/```json\n?|\n?```/g, "").trim();
    }

    const categories = JSON.parse(content) as string[];

    // Ensure "Other" is included
    if (!categories.includes("Other")) {
      categories.push("Other");
    }

    console.log("Extracted categories:", categories);
    return categories;
  } catch (error) {
    console.error("Error extracting categories:", error);
    // Fallback to default categories
    return [
      "Control4",
      "Audio",
      "Bulk Wire & Connectors",
      "Cables",
      "Conferencing",
      "Control",
      "Lighting",
      "Media Distribution",
      "Mounts",
      "Networking",
      "Power",
      "Projectors & Screens",
      "Racks",
      "Smart Security & Access",
      "Speakers",
      "Surveillance",
      "Televisions",
      "Tools & Hardware",
      "Other",
    ];
  }
}

/**
 * Use AI to recategorize items based on their names and descriptions
 */
export async function recategorizeItems(
  items: InventoryItem[],
  categories: string[],
  onProgress?: (message: string, current: number, total: number) => void
): Promise<{ id: string; oldCategory: string; newCategory: string }[]> {
  const results: { id: string; oldCategory: string; newCategory: string }[] = [];

  if (items.length === 0) {
    return results;
  }

  onProgress?.("Analyzing items with AI...", 0, items.length);

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
      }));

      const prompt = `You are a product categorization expert.

Given these inventory items, categorize each one into the most appropriate category from this list:
${categories.join(", ")}

Items to categorize:
${JSON.stringify(itemsForAI, null, 2)}

Return ONLY a JSON array with this format (no markdown, no code blocks):
[
  {
    "id": "item_id",
    "category": "Category Name"
  }
]

Rules:
- Use the exact category names from the list above
- Match based on product name and description
- If unsure, use "Other"
- Return valid JSON only`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenAI API error: ${errorData.error?.message || response.statusText}`
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
      }[];

      // Process results
      for (const cat of categorizations) {
        const item = batch.find((i) => i.id === cat.id);
        if (item && item.category !== cat.category) {
          results.push({
            id: item.id,
            oldCategory: item.category,
            newCategory: cat.category,
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
      // Continue with next batch even if one fails
    }
  }

  return results;
}

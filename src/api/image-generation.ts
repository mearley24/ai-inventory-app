/*
IMPORTANT NOTICE:
This service uses OpenAI's image generation API (gpt-image-1).
Note: Image generation requires additional setup and is not enabled by default.
To enable, you would need to implement direct OpenAI API calls.
*/

/**
 * Generate an image using OpenAI's image generation API
 * @param prompt The text prompt to generate an image from
 * @param options Optional parameters for image generation
 * @returns URL of the generated image
 */
export async function generateImage(
  prompt: string,
  options?: {
    size?: "1024x1024" | "1536x1024" | "1024x1536";
    quality?: "standard" | "hd";
  },
): Promise<string> {
  try {
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Make API request to OpenAI
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options?.size || "1024x1024",
        quality: options?.quality || "standard",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[ImageGeneration] Error response:", errorData);
      throw new Error(`Image generation API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("[ImageGeneration] Image generated successfully");

    // Return the image URL from the response
    if (result.data && result.data[0]?.url) {
      return result.data[0].url;
    } else {
      throw new Error("Invalid response format from API");
    }
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}

/**
 * Convert aspect ratio to size format
 * @param aspectRatio The aspect ratio to convert
 * @returns The corresponding size format
 */
export function convertAspectRatioToSize(aspectRatio: string): "1024x1024" | "1536x1024" | "1024x1536" | "auto" {
  switch (aspectRatio) {
    case "1:1":
      return "1024x1024";
    case "3:2":
      return "1536x1024";
    case "2:3":
      return "1024x1536";
    default:
      return "auto";
  }
}

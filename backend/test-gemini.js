import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function main() {
  const imagePath = "./WhatsApp Image 2025-07-17 at 11.20.30_8a312d2b.jpg";
  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

  const prompt = `Extract the following fields from this NET Meter Registration form. Provide the output as a JSON object with keys 'Registration Number', 'Registration Date', 'Name', 'Service No', 'Category', 'Existing Load', 'Proposed Solar Capacity', 'Application Status'. If a field is not present, use null.`;

  const contents = [
    {
      role: "user",
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-pro-vision",
    contents,
  });

  const text = response.response.candidates[0].content.parts[0].text;
  console.log("Gemini response:", text);

  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    console.log("Extracted JSON:", json);
  } catch {
    console.log("Could not parse JSON from response.");
  }
}

main(); 
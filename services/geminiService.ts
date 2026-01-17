
import { GoogleGenAI, Type } from "@google/genai";
import { NIDRecord, SourceType } from "../types.ts";

// Defensive check for process.env to prevent ReferenceError in browser environments
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const NID_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      fullNameEn: { type: Type.STRING, description: "Name in English." },
      fullNameBn: { type: Type.STRING, description: "Name in Bengali." },
      fatherNameEn: { type: Type.STRING, description: "Father's name in English." },
      fatherNameBn: { type: Type.STRING, description: "Father's name in Bengali." },
      motherNameEn: { type: Type.STRING, description: "Mother's name in English." },
      motherNameBn: { type: Type.STRING, description: "Mother's name in Bengali." },
      addressEn: { type: Type.STRING, description: "Address in English." },
      addressBn: { type: Type.STRING, description: "Address in Bengali." },
      bloodGroup: { type: Type.STRING, description: "Blood group (e.g. A+, B-)." },
      voterSerial: { type: Type.STRING, description: "Voter Serial Number or Serial No." },
      nidNumber: { type: Type.STRING, description: "NID Number (English digits)." },
      dateOfBirth: { type: Type.STRING, description: "DOB (YYYY-MM-DD)." },
    },
    required: ["fullNameEn", "fullNameBn", "nidNumber", "dateOfBirth"],
  },
};

export const extractNIDData = async (
  fileData: string,
  mimeType: string,
  fileName: string,
  sourceType: SourceType = 'LOCAL'
): Promise<NIDRecord[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("System configuration missing: API Key not detected.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: fileData.split(',')[1],
                mimeType: mimeType,
              },
            },
            {
              text: "SYSTEM INSTRUCTION: You are an Identity Record Extraction Engine.\n\n" +
                   "TASK: Extract identity details from the provided document. Many documents will be Bengali NIDs or Voter Lists.\n\n" +
                   "REQUIREMENTS:\n" +
                   "1. BILINGUAL EXTRACTION: For Name, Father, Mother, and Address, provide BOTH the original Bengali text and a transliterated English version.\n" +
                   "2. NUMBERS & DIGITS: Convert ALL Bengali digits (০-৯) found in NID numbers, Voter Serial numbers, and Dates to standard English digits (0-9).\n" +
                   "3. SERIAL NUMBERS: Explicitly look for 'Voter Serial', 'Serial No', or 'ক্রমিক নং' and extract it into the voterSerial field.\n" +
                   "4. BLOOD GROUP: Identify and extract blood group if visible.\n" +
                   "5. VOTER LISTS: If this is a list, extract every unique person as a separate object in the array.\n" +
                   "6. OUTPUT: Return a JSON array matching the schema.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: NID_SCHEMA,
      },
    });

    let jsonStr = response.text?.trim() || "[]";
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed: any[] = JSON.parse(jsonStr);

    return parsed.map((item, index) => ({
      id: `rec-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      fullNameEn: item.fullNameEn || "Unknown",
      fullNameBn: item.fullNameBn || "অজানা",
      fatherNameEn: item.fatherNameEn || "",
      fatherNameBn: item.fatherNameBn || "",
      motherNameEn: item.motherNameEn || "",
      motherNameBn: item.motherNameBn || "",
      addressEn: item.addressEn || "",
      addressBn: item.addressBn || "",
      bloodGroup: item.bloodGroup || "",
      voterSerial: String(item.voterSerial || "").replace(/\D/g, ''),
      nidNumber: String(item.nidNumber || "").replace(/\D/g, ''),
      dateOfBirth: item.dateOfBirth || "Unknown",
      sourceFile: fileName,
      sourceType: sourceType,
      rawText: JSON.stringify(item)
    }));
  } catch (error: any) {
    console.error("Extraction Error:", error);
    throw new Error("Processing failed: " + (error?.message || "Check document quality."));
  }
};

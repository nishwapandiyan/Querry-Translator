import { NextApiRequest, NextApiResponse } from "next";
import { designDatabase } from "../../src/designerAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ message: "A natural language prompt is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: "GEMINI_API_KEY not configured" });
  }

  try {
    const result = await designDatabase(prompt, process.env.GEMINI_API_KEY);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Designer error:", error);
    res.status(500).json({ message: error.message || "Failed to design database" });
  }
}

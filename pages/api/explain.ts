import { NextApiRequest, NextApiResponse } from "next";
import explainSQL from "../../src/explainSQL";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ message: "query is required" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: "GEMINI_API_KEY not configured" });

  try {
    const explanation = await explainSQL(query, process.env.GEMINI_API_KEY);
    res.status(200).json(explanation);
  } catch (error: any) {
    console.error("Explain error:", error);
    res.status(500).json({ message: error.message || "Error explaining query." });
  }
}

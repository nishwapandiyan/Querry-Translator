import { NextApiRequest, NextApiResponse } from "next";
import { optimizeQuery } from "../../src/optimizerAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "SQL query string is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: "GEMINI_API_KEY not configured" });
  }

  try {
    const result = await optimizeQuery(query, process.env.GEMINI_API_KEY);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Optimizer error:", error);
    res.status(500).json({ message: error.message || "Failed to optimize query" });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { recommendIndexes } from "../../src/indexRecommenderAgent";
import { openDb } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: "GEMINI_API_KEY not configured" });
  }

  try {
    const db = await openDb();
    
    // Fetch recent workload (last 20 unique optimized or successfully translated queries)
    // We filter out extremely short or invalid strings.
    const historyRows = await db.all(
      `SELECT DISTINCT outputText FROM TranslationHistory 
       WHERE outputText IS NOT NULL 
       AND length(outputText) > 10 
       ORDER BY id DESC 
       LIMIT 20`
    ) as { outputText: string }[];

    const workload = historyRows.map(r => r.outputText);

    if (workload.length === 0) {
      return res.status(200).json([]);
    }

    const recommendations = await recommendIndexes(workload, process.env.GEMINI_API_KEY);
    res.status(200).json(recommendations);
  } catch (error: any) {
    console.error("Index recommender error:", error);
    res.status(500).json({ message: error.message || "Failed to analyze workload for indexes" });
  }
}

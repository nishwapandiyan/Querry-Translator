import { NextApiRequest, NextApiResponse } from "next";
import { analyzeResults, ResultInsight } from "../../src/insightAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { sql, columns, rows } = req.body as {
    sql: string;
    columns: string[];
    rows: Record<string, unknown>[];
  };

  if (!sql || !columns || !rows) {
    return res.status(400).json({ message: "sql, columns, and rows are required" });
  }

  try {
    const insight = await analyzeResults(sql, columns, rows);
    res.status(200).json(insight);
  } catch (err: any) {
    console.error("Insight error:", err);
    res.status(500).json({ message: err.message || "Insight analysis failed" });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { openDb } from "../../lib/db";

export interface ExplainPlanRow {
  id: number;
  parent: number;
  notused: number;
  detail: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "SQL query string is required" });
  }

  // Very basic check to ensure it's a statement we can explain (SELECT, UPDATE, DELETE, INSERT)
  // SQLite EXPLAIN QUERY PLAN works best on DML.
  const sqlPattern = /^\s*(select|insert|update|delete|with)\s/i;
  if (!sqlPattern.test(query)) {
    return res.status(400).json({ message: "EXPLAIN QUERY PLAN only supports SELECT, INSERT, UPDATE, DELETE, or WITH statements." });
  }

  try {
    const db = await openDb();
    
    // EXPLAIN QUERY PLAN returns a result set with columns: id, parent, notused, detail
    const plan = await db.all(`EXPLAIN QUERY PLAN ${query}`) as ExplainPlanRow[];

    res.status(200).json({ plan });
  } catch (error: any) {
    console.error("Explain plan error:", error);
    res.status(500).json({ message: error.message || "Failed to generate execution plan." });
  }
}

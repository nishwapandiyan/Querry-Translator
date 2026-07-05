import { NextApiRequest, NextApiResponse } from "next";
import { openDb } from "../../lib/db";

// Reject any mutating or DDL statements
const BLOCKED_PATTERN = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE|ATTACH|DETACH)\s/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { query } = req.body as { query: string };
  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "query string is required" });
  }

  if (BLOCKED_PATTERN.test(query.trim())) {
    return res.status(403).json({
      message: "Only read-only SELECT queries are allowed. INSERT, UPDATE, DELETE, DROP, and other write operations are blocked.",
    });
  }

  try {
    const db = await openDb();
    const rows = await db.all(query);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    res.status(200).json({ columns, rows });
  } catch (error: any) {
    console.error("Run query error:", error);
    res.status(400).json({
      columns: [],
      rows: [],
      error: error.message || "Query execution failed.",
    });
  }
}

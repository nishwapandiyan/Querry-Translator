import { NextApiRequest, NextApiResponse } from "next";
import { openDb } from "../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const db = await openDb();
      const history = await db.all(`SELECT * FROM TranslationHistory ORDER BY timestamp DESC LIMIT 100`);
      res.status(200).json(history);
    } catch (error) {
      console.error("Failed to fetch history", error);
      res.status(500).json({ message: "Error fetching history" });
    }
  } else if (req.method === "DELETE") {
    const { id } = req.query;
    try {
      const db = await openDb();
      if (id) {
        await db.run(`DELETE FROM TranslationHistory WHERE id = ?`, [id]);
        res.status(200).json({ message: "Entry deleted" });
      } else {
        await db.run(`DELETE FROM TranslationHistory`);
        res.status(200).json({ message: "All history cleared" });
      }
    } catch (error) {
      console.error("Failed to delete history", error);
      res.status(500).json({ message: "Error deleting history" });
    }
  } else if (req.method === "PATCH") {
    // Task 5: Update tags on a history entry
    const { id } = req.query;
    const { tags } = req.body as { tags: string };
    if (!id) return res.status(400).json({ message: "id is required" });
    try {
      const db = await openDb();
      await db.run(`UPDATE TranslationHistory SET tags = ? WHERE id = ?`, [tags || "", id]);
      res.status(200).json({ message: "Tags updated" });
    } catch (error) {
      console.error("Failed to update tags", error);
      res.status(500).json({ message: "Error updating tags" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

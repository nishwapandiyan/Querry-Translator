import { NextApiRequest, NextApiResponse } from "next";
import callGemini from "../../src/chatAgent";
import { openDb } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { message, sessionId } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "message string is required" });
  }
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ message: "sessionId is required" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: "GEMINI_API_KEY not configured" });
  }

  try {
    const db = await openDb();

    // Ensure session exists
    await db.run(
      `INSERT OR IGNORE INTO chat_sessions (id) VALUES (?)`,
      [sessionId]
    );

    // Save user message
    await db.run(
      `INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)`,
      [sessionId, message]
    );

    // Load full session history from DB
    const history = await db.all(
      `SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`,
      [sessionId]
    ) as { role: string; content: string }[];

    // Call Gemini with full history (chatAgent handles trimming)
    const reply = await callGemini(history, process.env.GEMINI_API_KEY!);

    // Save assistant reply
    await db.run(
      `INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)`,
      [sessionId, reply]
    );

    // Update session timestamp
    await db.run(
      `UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [sessionId]
    );

    res.status(200).json({ reply, sessionId });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ message: error.message || "Error from AI agent." });
  }
}

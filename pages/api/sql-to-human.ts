import { NextApiRequest, NextApiResponse } from "next";
import translateToHuman from "../../src/translateToHuman";
import { openDb } from "../../lib/db";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not defined in .env file. Please add it there (see README.md for more details)."
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { inputText } = req.body;
  try {
    const outputText = await translateToHuman(
      inputText,
      process.env.GEMINI_API_KEY
    );

    // Save to SQLite Database
    const db = await openDb();
    await db.run(
      `INSERT INTO TranslationHistory (inputText, outputText, tableSchema, isHumanToSql) VALUES (?, ?, ?, ?)`,
      [inputText, outputText, "", false]
    );

    res.status(200).json({ outputText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error translating to natural language" });
  }
}

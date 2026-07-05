import { NextApiRequest, NextApiResponse } from "next";
import translateToSQL from "../../src/translateToSQL";
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
  const { inputText, tableSchema, dialect } = req.body;
  try {
    const result = await translateToSQL(
      inputText,
      process.env.GEMINI_API_KEY!,
      tableSchema,
      dialect || "PostgreSQL"
    );
    
    // Save to SQLite Database
    const db = await openDb();
    await db.run(
      `INSERT INTO TranslationHistory (inputText, outputText, tableSchema, isHumanToSql) VALUES (?, ?, ?, ?)`,
      [inputText, result, tableSchema || "", true]
    );

    res.status(200).json({ outputText: result });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || "Error translating to SQL" });
  }
}

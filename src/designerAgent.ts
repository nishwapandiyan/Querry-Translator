import fetch from "isomorphic-unfetch";

export interface DBColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}

export interface DBTable {
  name: string;
  description: string;
  columns: DBColumn[];
}

export interface DatabaseSchema {
  tables: DBTable[];
  relationships: string;
  create_statements: string;
  sample_data_statements: string;
}

export const designDatabase = async (prompt: string, apiKey: string): Promise<DatabaseSchema> => {
  if (!prompt || !apiKey) {
    throw new Error("Missing prompt or API key.");
  }

  const systemPrompt = `You are an elite Enterprise Data Architect and Database Designer.
Your task is to take a natural language description of a software system and design a complete, highly-optimized relational database schema.

Analyze the requirements and generate the appropriate tables, columns, primary keys, and foreign keys.

Return the response STRICTLY as a JSON object matching this schema:
{
  "tables": [
    {
      "name": "string (e.g. 'users')",
      "description": "string (brief purpose of the table)",
      "columns": [
        {
          "name": "string (e.g. 'id')",
          "type": "string (e.g. 'INTEGER' or 'VARCHAR(255)')",
          "isPrimaryKey": boolean,
          "isForeignKey": boolean,
          "references": "string (optional, e.g. 'users(id)')"
        }
      ]
    }
  ],
  "relationships": "string (A paragraph explaining how the core tables connect to one another)",
  "create_statements": "string (Raw SQL text containing all the CREATE TABLE statements, separated by newlines)",
  "sample_data_statements": "string (Raw SQL text containing INSERT statements with 2-3 realistic sample rows per table, separated by newlines)"
}

Ensure the SQL generated uses standard PostgreSQL dialect by default.
Do not include markdown blocks like \`\`\`json. Output ONLY the raw JSON object.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `System Instructions:\n${systemPrompt}\n\nSystem Description to Design:\n"${prompt}"` }] }
      ],
      generationConfig: { 
        temperature: 0.4, 
        maxOutputTokens: 3000,
        responseMimeType: "application/json"
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("API Error:", response.status, data);
    const errorMessage = data.error?.message || JSON.stringify(data.error) || "Error designing database.";
    throw new Error(errorMessage);
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleanText = resultText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  
  try {
    const parsed = JSON.parse(cleanText) as DatabaseSchema;
    return parsed;
  } catch (err) {
    console.error("Failed to parse DB schema result:", cleanText);
    throw new Error("AI returned invalid JSON.");
  }
};

import fetch from "isomorphic-unfetch";

const DIALECT_NOTES = {
  PostgreSQL: `Dialect: PostgreSQL.
- Use LIMIT for row limiting (not TOP).
- Use double quotes for identifiers if needed.
- Date functions: NOW(), CURRENT_DATE, DATE_TRUNC(), AGE().
- Use ILIKE for case-insensitive LIKE.
- Sequences for auto-increment: SERIAL or GENERATED ALWAYS AS IDENTITY.`,
  MySQL: `Dialect: MySQL.
- Use LIMIT for row limiting (not TOP).
- Use backticks (\`) for identifiers.
- Date functions: NOW(), CURDATE(), DATE_FORMAT(), DATEDIFF().
- Use AUTO_INCREMENT for primary keys.
- String concat: CONCAT() function.`,
  SQLite: `Dialect: SQLite.
- Use LIMIT for row limiting.
- No separate date type — store as TEXT (ISO 8601) or INTEGER (Unix timestamp).
- Date functions: date(), datetime(), strftime().
- No RIGHT JOIN support. Use LEFT JOIN instead.
- AUTOINCREMENT keyword for primary keys.`,
  BigQuery: `Dialect: Google BigQuery.
- Use LIMIT for row limiting.
- Use backticks for fully-qualified table names: \`project.dataset.table\`.
- Date functions: CURRENT_DATE(), DATE(), DATETIME(), DATE_DIFF(), DATE_ADD().
- Use SAFE_DIVIDE() instead of /.
- Use ARRAY_AGG, STRUCT for nested data.
- Standard SQL mode only — no MySQL-specific syntax.`,
};

const translateToSQL = async (query, apiKey, tableSchema = "", dialect = "PostgreSQL") => {
  if (!query || !apiKey) {
    throw new Error("Missing query or API key.");
  }

  const dialectNote = DIALECT_NOTES[dialect] || DIALECT_NOTES["PostgreSQL"];

  const promptText = `You are an expert SQL Database Administrator. Your task is to translate natural language queries into valid, optimized SQL statements.

${dialectNote}

Follow these strict rules:
1. Do not change the casing of any entries or values provided by the user.
2. Return ONLY the raw SQL query. Do not wrap it in markdown blockquotes or provide explanations.
3. If a table schema is provided, strictly adhere to the column names and data types defined in it.
4. Generate syntax that is 100% compatible with the specified dialect above.

Query to translate:
"${query}"

${tableSchema ? `Use this table schema:\n${tableSchema}\n\n` : ""}SQL Query:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("API Error:", response.status, data);
    const errorMessage = data.error?.message || JSON.stringify(data.error) || "Error translating to SQL.";
    throw new Error(errorMessage);
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return resultText.replace(/```sql\n?/g, "").replace(/```\n?/g, "").trim();
};

export default translateToSQL;

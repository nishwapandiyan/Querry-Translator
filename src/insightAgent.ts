import fetch from "isomorphic-unfetch";

export interface ResultInsight {
  summary: string;
  key_findings: string[];
  anomalies: string[];
  suggested_follow_up: string[];
}

export async function analyzeResults(
  sql: string,
  columns: string[],
  rows: Record<string, unknown>[]
): Promise<ResultInsight> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  // Limit to first 50 rows to keep prompt small
  const sampleRows = rows.slice(0, 50);

  const prompt = `You are an expert data analyst. A user ran the following SQL query against a SQLite database and got back a result set.

SQL Query:
${sql}

Column names: ${columns.join(", ")}

Row data (first ${sampleRows.length} of ${rows.length} rows):
${JSON.stringify(sampleRows, null, 2)}

Analyze this data and return a JSON object with EXACTLY these fields:
- "summary": A 1-2 sentence natural-language summary of what this data shows.
- "key_findings": An array of 3-5 strings, each being a bullet-point insight (patterns, trends, counts, extremes).
- "anomalies": An array of 0-3 strings highlighting data quality issues, nulls, outliers, or unexpected values. Use empty array [] if none.
- "suggested_follow_up": An array of 2-3 plain-English questions the user might want to investigate next.

Return ONLY the raw JSON object. No markdown, no code fences.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.error?.message || "Error analysing results.";
    throw new Error(errorMsg);
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleanText = resultText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  
  try {
    return JSON.parse(cleanText) as ResultInsight;
  } catch {
    throw new Error("AI returned invalid JSON for insights.");
  }
}

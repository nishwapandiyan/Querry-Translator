import fetch from "isomorphic-unfetch";

export interface IndexRecommendation {
  create_statement: string;
  why: string;
  expected_benefit: string;
  estimated_improvement: "Low" | "Medium" | "High";
}

export const recommendIndexes = async (workload: string[], apiKey: string): Promise<IndexRecommendation[]> => {
  if (!apiKey) {
    throw new Error("Missing API key.");
  }

  if (!workload || workload.length === 0) {
    return [];
  }

  const systemPrompt = `You are an elite Enterprise Database Administrator.
Your task is to analyze a batch of recently executed SQL queries (a "workload") and recommend a comprehensive indexing strategy.

Analyze the workload patterns (frequent WHERE clauses, JOIN conditions, ORDER BY clauses, etc.) and recommend the most impactful indexes.
Do NOT recommend basic primary key indexes if they are typically implied. Focus on secondary indexes, composite indexes, or covering indexes that would speed up this specific workload.

Return the response STRICTLY as a JSON array of objects, where each object matches this schema:
{
  "create_statement": "string (e.g. 'CREATE INDEX idx_user_status ON users(status)')",
  "why": "string (detailed explanation of the reasoning based on the provided queries)",
  "expected_benefit": "string (e.g. 'Speeds up filtering and sorting on the users table')",
  "estimated_improvement": "string (must be one of: 'Low', 'Medium', 'High')"
}

Do not include markdown blocks like \`\`\`json. Output ONLY the raw JSON array.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `System Instructions:\n${systemPrompt}\n\nRecent Query Workload:\n${workload.join("\n---\n")}` }] }
      ],
      generationConfig: { 
        temperature: 0.2, 
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("API Error:", response.status, data);
    const errorMessage = data.error?.message || JSON.stringify(data.error) || "Error recommending indexes.";
    throw new Error(errorMessage);
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleanText = resultText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  
  try {
    const parsed = JSON.parse(cleanText) as IndexRecommendation[];
    return parsed;
  } catch (err) {
    console.error("Failed to parse index recommendation result:", cleanText);
    throw new Error("AI returned invalid JSON.");
  }
};

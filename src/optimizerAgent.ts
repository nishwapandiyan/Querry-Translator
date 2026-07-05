import fetch from "isomorphic-unfetch";

export interface OptimizationResult {
  optimized_sql: string;
  explanation: string;
  complexity: "Simple" | "Moderate" | "Complex";
  estimated_performance_gain: string;
  index_suggestions: string[];
  potential_issues: string[];
}

export const optimizeQuery = async (query: string, apiKey: string): Promise<OptimizationResult> => {
  if (!query || !apiKey) {
    throw new Error("Missing query or API key.");
  }

  const systemPrompt = `You are an elite SQL Performance Tuning Expert and Database Architect.
Your task is to analyze the provided SQL query and optimize it for maximum performance.

Analyze the query and rewrite it to be as efficient as possible. Provide a detailed breakdown of the changes, complexity, performance estimates, index suggestions, and any potential side effects.

Return the response STRICTLY as a JSON object matching this schema:
{
  "optimized_sql": "string (the rewritten, optimized SQL)",
  "explanation": "string (detailed explanation of WHY it is faster and what was changed)",
  "complexity": "string (must be one of: 'Simple', 'Moderate', 'Complex')",
  "estimated_performance_gain": "string (e.g. 'High - removes full table scan', 'Medium - uses indexed JOIN')",
  "index_suggestions": ["string (e.g. 'CREATE INDEX idx_user_id ON orders(user_id)')"],
  "potential_issues": ["string (e.g. 'May lock rows if run during peak hours', 'Assumes email column is non-null')"]
}

Do not include markdown blocks like \`\`\`json. Output ONLY the raw JSON object.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `System Instructions:\n${systemPrompt}\n\nOriginal SQL to Optimize:\n${query}` }] }
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
    const errorMessage = data.error?.message || JSON.stringify(data.error) || "Error optimizing SQL.";
    throw new Error(errorMessage);
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleanText = resultText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  
  try {
    const parsed = JSON.parse(cleanText) as OptimizationResult;
    return parsed;
  } catch (err) {
    console.error("Failed to parse optimization result:", cleanText);
    throw new Error("AI returned invalid JSON.");
  }
};

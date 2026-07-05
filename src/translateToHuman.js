import fetch from "isomorphic-unfetch";

const translateToHuman = async (query, apiKey) => {
  if (!query || !apiKey) {
    throw new Error("Missing query or API key.");
  }

  const promptText = `You are a Data Analyst expert at explaining complex databases to non-technical business users. Your task is to translate an SQL query into clear, concise, and easy-to-understand natural language.

Follow these strict rules:
1. Explain what the query retrieves in plain English.
2. Do not use overly technical jargon.
3. Return ONLY the natural language explanation. Do not wrap it in quotes.

SQL Query to translate:
"${query}"

Natural language explanation:`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
      }
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("API Error:", response.status, data);
    const errorMessage = data.error?.message || JSON.stringify(data.error) || "Error translating to natural language.";
    throw new Error(errorMessage);
  }

  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return resultText.trim();
};

export default translateToHuman;

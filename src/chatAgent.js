import fetch from "isomorphic-unfetch";

const MAX_HISTORY_TURNS = 20; // Keep last 20 messages for context

/**
 * Call Gemini with full session history for context-aware multi-turn chat.
 * @param messages - Full conversation so far (from DB + new user message)
 * @param apiKey   - Gemini API key
 */
const callGemini = async (messages, apiKey) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are QueryGen AI AI Agent — an expert SQL assistant embedded in the QueryGen AI platform. You help users with:
1. Writing and optimizing SQL queries
2. Explaining what SQL queries do in plain English
3. Debugging SQL errors and suggesting fixes
4. Teaching SQL concepts with practical examples
5. Advising on database schema design and best practices

Rules:
- Always format SQL code in \`\`\`sql code blocks
- Keep explanations clear and concise
- When showing SQL examples, make them practical and ready to use
- If a query has performance issues, proactively mention optimization tips
- Remember the full conversation history: if a user says "now filter that by last month", refer back to the earlier query
- Be friendly and educational`;

  // Trim to last N turns to avoid token overflow
  const trimmedMessages = messages.slice(-MAX_HISTORY_TURNS);

  const contents = [
    { role: "user", parts: [{ text: systemPrompt + "\n\nPlease acknowledge you're ready to help." }] },
    { role: "model", parts: [{ text: "I'm QueryGen AI AI Agent, your expert SQL assistant! I'm ready to help you write, optimize, debug, and understand SQL queries. What would you like to work on?" }] },
    ...trimmedMessages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data.error?.message || "Error from AI agent.";
    throw new Error(errorMessage);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export default callGemini;

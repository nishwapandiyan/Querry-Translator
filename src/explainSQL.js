import fetch from "isomorphic-unfetch";

/**
 * Statically detect SQL anti-patterns BEFORE calling Gemini.
 * Returns an array of warning strings.
 */
function detectWarnings(query) {
  const warnings = [];
  const q = query.toUpperCase().trim();

  // 1. SELECT * usage
  if (/SELECT\s+\*/.test(q)) {
    warnings.push("SELECT * retrieves all columns — specify only the columns you need for better performance and maintainability.");
  }

  // 2. Missing WHERE on a JOIN (potential cartesian-like result)
  const hasJoin = /\bJOIN\b/.test(q);
  const hasWhere = /\bWHERE\b/.test(q);
  if (hasJoin && !hasWhere) {
    warnings.push("JOIN without a WHERE clause detected — this may return a very large result set. Consider adding a filter condition.");
  }

  // 3. Implicit cartesian join (multiple tables in FROM without JOIN keyword)
  const fromMatch = q.match(/\bFROM\b([\s\S]*?)(?:\bWHERE\b|\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/);
  if (fromMatch) {
    const tableList = fromMatch[1].trim();
    const tableCount = tableList.split(",").length;
    if (tableCount > 1 && !hasJoin) {
      warnings.push(`Implicit cartesian join: ${tableCount} tables listed in FROM without explicit JOIN syntax — always use explicit JOINs to avoid unintentional cross-products.`);
    }
  }

  // 4. No LIMIT on potentially large queries
  const hasLimit = /\bLIMIT\b|\bTOP\b|\bFETCH FIRST\b/.test(q);
  const hasAggregate = /\bCOUNT\s*\(|\bSUM\s*\(|\bAVG\s*\(|\bMAX\s*\(|\bMIN\s*\(/.test(q);
  if (!hasLimit && !hasAggregate && (hasJoin || /\bFROM\b/.test(q))) {
    warnings.push("No LIMIT clause — for large tables this query may return millions of rows. Add LIMIT during development.");
  }

  // 5. LIKE with leading wildcard (prevents index use)
  if (/LIKE\s+['"]%/.test(q)) {
    warnings.push("LIKE '%...' with a leading wildcard cannot use an index — consider full-text search or restructuring the query.");
  }

  // 6. OR in WHERE that may prevent index use
  if (/\bWHERE\b.*\bOR\b/.test(q)) {
    warnings.push("OR conditions in WHERE clauses can prevent index usage — consider using UNION or separate queries if performance is critical.");
  }

  // 7. NOT IN with subquery (can be slow and null-unsafe)
  if (/NOT\s+IN\s*\(SELECT/.test(q)) {
    warnings.push("NOT IN with a subquery can be slow and behaves unexpectedly with NULLs — consider NOT EXISTS instead.");
  }

  return warnings;
}

const explainSQL = async (query, apiKey) => {
  if (!query || !apiKey) throw new Error("Missing query or API key.");

  // Run static analysis first (instant, no API call)
  const staticWarnings = detectWarnings(query);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const promptText = `You are a senior SQL database expert and educator. Analyze the following SQL query and provide a structured, detailed explanation.

SQL Query:
\`\`\`sql
${query}
\`\`\`

Respond ONLY in the following JSON format (no markdown, no extra text):
{
  "summary": "One-sentence plain English summary of what this query does",
  "clauses": [
    { "clause": "SELECT", "explanation": "what this part selects" },
    { "clause": "FROM", "explanation": "which tables are used" }
  ],
  "complexity": "Simple | Moderate | Complex",
  "performance_tips": ["tip 1", "tip 2"],
  "potential_issues": ["issue 1"]
}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Error explaining SQL.");
  }

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = { summary: cleaned, clauses: [], complexity: "Unknown", performance_tips: [], potential_issues: [] };
  }

  // Merge static warnings into result as a separate field
  parsed.static_warnings = staticWarnings;

  return parsed;
};

export default explainSQL;

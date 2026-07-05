import { useState } from "react";

export type Dialect = "PostgreSQL" | "MySQL" | "SQLite" | "BigQuery";

interface RequestBody {
  inputText: string;
  tableSchema?: string;
  dialect?: Dialect;
}

export function useTranslate() {
  const [translating, setTranslating] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [translationError, setTranslationError] = useState("");

  const translate = async ({
    inputText,
    tableSchema,
    isHumanToSql,
    dialect,
  }: { inputText: string; tableSchema: string; isHumanToSql: boolean; dialect?: Dialect }) => {
    setTranslationError("");
    setTranslating(true);
    try {
      const requestBody: RequestBody = { inputText };
      if (tableSchema !== "") requestBody.tableSchema = tableSchema;
      if (dialect) requestBody.dialect = dialect;

      const response = await fetch(
        `/api/${isHumanToSql ? "translate" : "sql-to-human"}`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setOutputText(data.outputText);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTranslationError(
          errorData.message || `Error translating ${isHumanToSql ? "to SQL" : "to human"}.`
        );
      }
    } catch (error: any) {
      console.error(error);
      setTranslationError(
        error.message || `Error translating ${isHumanToSql ? "to SQL" : "to human"}.`
      );
    } finally {
      setTranslating(false);
    }
  };

  return { outputText, setOutputText, translate, translating, translationError };
}

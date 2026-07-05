import React, { useState } from "react";
import { X, Plus } from "lucide-react";

interface Column {
  name: string;
  type: string;
  constraints: string;
}

interface Props {
  onSchemaChange: (schema: string) => void;
}

const SQL_TYPES = ["INT", "VARCHAR(255)", "TEXT", "BOOLEAN", "FLOAT", "DECIMAL(10,2)", "DATE", "DATETIME", "BIGINT", "UUID"];

export default function SchemaBuilder({ onSchemaChange }: Props) {
  const [tableName, setTableName] = useState("my_table");
  const [columns, setColumns] = useState<Column[]>([
    { name: "id", type: "INT", constraints: "PRIMARY KEY AUTO_INCREMENT" },
    { name: "", type: "VARCHAR(255)", constraints: "" },
  ]);

  const generateSchema = (name: string, cols: Column[]) => {
    const validCols = cols.filter(c => c.name.trim());
    if (!name || !validCols.length) return "";
    const colDefs = validCols.map(c =>
      `  ${c.name} ${c.type}${c.constraints ? " " + c.constraints : ""}`
    ).join(",\n");
    return `CREATE TABLE ${name} (\n${colDefs}\n);`;
  };

  const updateColumn = (index: number, field: keyof Column, value: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value };
    setColumns(updated);
    onSchemaChange(generateSchema(tableName, updated));
  };

  const addColumn = () => {
    const updated = [...columns, { name: "", type: "VARCHAR(255)", constraints: "" }];
    setColumns(updated);
  };

  const removeColumn = (index: number) => {
    const updated = columns.filter((_, i) => i !== index);
    setColumns(updated);
    onSchemaChange(generateSchema(tableName, updated));
  };

  const handleTableNameChange = (value: string) => {
    setTableName(value);
    onSchemaChange(generateSchema(value, columns));
  };

  const schema = generateSchema(tableName, columns);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Table name */}
      <div>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
          Table Name
        </label>
        <input
          className="dl-input"
          value={tableName}
          onChange={e => handleTableNameChange(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Columns */}
      <div>
        <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
          Columns
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {columns.map((col, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", alignItems: "center" }}>
              <input
                className="dl-input"
                placeholder="column_name"
                value={col.name}
                onChange={e => updateColumn(i, "name", e.target.value)}
              />
              <select
                className="dl-select"
                value={col.type}
                onChange={e => updateColumn(i, "type", e.target.value)}
              >
                {SQL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                className="dl-input"
                placeholder="Constraints (e.g. UNIQUE)"
                value={col.constraints}
                onChange={e => updateColumn(i, "constraints", e.target.value)}
              />
              <button
                className="btn btn-outline"
                onClick={() => removeColumn(i)}
                style={{ color: "var(--accent-red)", padding: "8px 12px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Remove column"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addColumn} className="btn btn-secondary" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", width: "fit-content" }}>
          <Plus size={16} /> Add Column
        </button>
      </div>

      {/* Preview */}
      {schema && (
        <div style={{ marginTop: "8px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
            Generated Schema Preview
          </label>
          <pre style={{ 
            background: "var(--code-bg)", 
            border: "1px solid var(--border-color)", 
            borderRadius: "var(--radius-md)", 
            padding: "16px", 
            fontSize: "13px", 
            fontFamily: "'JetBrains Mono', monospace", 
            color: "var(--code-color)", 
            overflow: "auto", 
            whiteSpace: "pre-wrap" 
          }}>
            {schema}
          </pre>
        </div>
      )}
    </div>
  );
}

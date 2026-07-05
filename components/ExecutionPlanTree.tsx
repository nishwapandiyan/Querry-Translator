import React, { useMemo } from 'react';
import { ExplainPlanRow } from '../pages/api/explain-plan';
import { Search, ClipboardList, Target, Link as LinkIcon, ArrowDown, BarChart2, Sliders, Package, Settings } from "lucide-react";

interface TreeNode extends ExplainPlanRow {
  children: TreeNode[];
}

interface ExecutionPlanTreeProps {
  plan: ExplainPlanRow[];
}

const buildTree = (rows: ExplainPlanRow[]): TreeNode[] => {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  // Initialize
  rows.forEach(r => map.set(r.id, { ...r, children: [] }));

  // Wire up
  rows.forEach(r => {
    // SQLite's top-level parent is usually 0
    if (r.parent === 0) {
      roots.push(map.get(r.id)!);
    } else {
      const parentNode = map.get(r.parent);
      if (parentNode) {
        parentNode.children.push(map.get(r.id)!);
      } else {
        // Fallback just in case
        roots.push(map.get(r.id)!);
      }
    }
  });

  return roots;
};

const getIconForDetail = (detail: string) => {
  const lower = detail.toLowerCase();
  if (lower.includes('scan') && lower.includes('index')) return <Search size={16} />;
  if (lower.includes('scan')) return <ClipboardList size={16} />;
  if (lower.includes('search')) return <Target size={16} />;
  if (lower.includes('join') || lower.includes('merge')) return <LinkIcon size={16} />;
  if (lower.includes('order by') || lower.includes('sort')) return <ArrowDown size={16} />;
  if (lower.includes('group by') || lower.includes('aggregate')) return <BarChart2 size={16} />;
  if (lower.includes('filter')) return <Sliders size={16} />;
  if (lower.includes('subquery')) return <Package size={16} />;
  return <Settings size={16} />;
};

const PlanNode = ({ node, isLast }: { node: TreeNode, isLast: boolean }) => {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Node content */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '8px 12px',
        margin: '4px 0',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        width: 'fit-content',
        position: 'relative',
        zIndex: 2
      }}>
        <span style={{ display: 'flex', alignItems: 'center' }}>{getIconForDetail(node.detail)}</span>
        <span style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
          {node.detail}
        </span>
      </div>

      {/* Children container */}
      {node.children.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          marginLeft: '24px', 
          paddingLeft: '24px', 
          borderLeft: '2px solid var(--border-color)',
          position: 'relative'
        }}>
          {/* Connecting line to children */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-2px',
            width: '24px',
            height: '24px',
            borderBottom: '2px solid var(--border-color)',
            borderLeft: '2px solid var(--border-color)',
            borderBottomLeftRadius: '8px',
            zIndex: 1
          }} />

          {node.children.map((child, idx) => (
            <div key={child.id} style={{ position: 'relative' }}>
              {/* Horizontal connector for each child */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '-24px',
                width: '24px',
                height: '2px',
                background: 'var(--border-color)',
                zIndex: 1
              }} />
              <PlanNode node={child} isLast={idx === node.children.length - 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ExecutionPlanTree({ plan }: ExecutionPlanTreeProps) {
  const tree = useMemo(() => buildTree(plan), [plan]);

  if (!plan || plan.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No execution plan available for this query.
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      padding: '24px', 
      borderRadius: 'var(--radius-md)', 
      border: '1px solid var(--border-color)',
      overflowX: 'auto'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Execution Tree
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
        {tree.map((rootNode, idx) => (
          <PlanNode key={rootNode.id} node={rootNode} isLast={idx === tree.length - 1} />
        ))}
      </div>
    </div>
  );
}

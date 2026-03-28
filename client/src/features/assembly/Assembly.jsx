import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import SlideOver from '../../components/ui/SlideOver';
import { ChevronRight, File, Folder, Settings, Maximize, GitCommit, Layers, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '../../store';

function BomNode({ node, level, onSelect }) {
  const [expanded, setExpanded] = useState(level < 2);
  const isAssy = node.type === 'ASSEMBLY' || (node.children && node.children.length > 0);

  return (
    <div className="bom-row" style={{ paddingLeft: level * 20 }}>
      <div className="flex-start" style={{ flex: 1, gap: 8 }}>
        {isAssy ? (
          <button className="icon-btn" style={{ padding: 2, background: 'transparent' }} onClick={() => setExpanded(!expanded)}>
            <ChevronRight size={14} style={{ transform: expanded ? 'rotate(90deg)' : '', transition: '0.2s' }} />
          </button>
        ) : <span style={{ width: 18 }} />}
        
        {isAssy ? <Folder size={14} color="var(--primary)" /> : <File size={14} color="var(--text-muted)" />}
        
        <strong className="text-mono" style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => onSelect(node)}>
          {node.partNumber || node.pn}
        </strong>
        <span className="text-subtle" style={{ marginLeft: 8 }}>{node.name}</span>
      </div>
      
      <div style={{ width: 60 }}><span className="badge badge-outline">{node.currentRev || node.rev}</span></div>
      <div style={{ width: 40, textAlign: 'right' }} className="text-mono text-subtle">{node.qty || 1}</div>

      {isAssy && expanded && node.children?.map(child => (
        <div key={child.id} style={{ flexBasis: '100%', marginLeft: -(level * 20) }}>
          <BomNode node={child} level={level + 1} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

export default function Assembly() {
  const [activePart, setActivePart] = useState(null);
  const { fetchBomTree, partGraph, isLoading } = useAppStore();

  useEffect(() => {
    // Hardcoded to fetch Assembly 4 (GEAR-BOX) for demo purposes from seed DB
    fetchBomTree(4);
  }, [fetchBomTree]);

  return (
    <AppShell title="Assembly Viewer">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <Layers size={24} color="var(--primary)" /> Assembly Tree 
            <span className="badge badge-outline">Rev {partGraph?.currentRev || '?'}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary"><Maximize size={16} /> Expand All</button>
          <button className="btn btn-primary"><Settings size={16} /> Configure View</button>
        </div>
      </div>

      <div className="split-view">
        {/* BOM Tree Area */}
        <div className="split-main paper p-0" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="paper-header flex-between" style={{ padding: '16px 24px', background: 'var(--bg-hover)' }}>
            <span className="text-xs-caps">Structure</span>
            <div className="flex-start" style={{ gap: 24 }}>
              <span className="text-xs-caps">Rev</span>
              <span className="text-xs-caps" style={{ width: 40, textAlign: 'right' }}>Qty</span>
            </div>
          </div>
          <div style={{ padding: 16, overflowY: 'auto' }}>
            {isLoading ? (
              <p className="text-subtle p-4">Loading structure from Database...</p>
            ) : partGraph ? (
              <BomNode node={partGraph} level={0} onSelect={setActivePart} />
            ) : (
              <p className="text-subtle p-4">Assembly not found.</p>
            )}
          </div>
        </div>

        {/* 3D View Mock Area */}
        <div className="split-side paper" style={{ background: '#090a0b', border: '1px solid #1f2937', color: 'var(--text-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={64} style={{ opacity: 0.1, marginBottom: 16 }} />
          <h3 className="heading-3">CAD Viewer Uninitialized</h3>
          <p style={{ textAlign: 'center', maxWidth: 200, marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
            Select a Part from the Structure tree to inspect its metadata and 3D preview.
          </p>
        </div>
      </div>

      {/* Dynamic SlideOver for Part details */}
      <SlideOver isOpen={!!activePart} onClose={() => setActivePart(null)} title="Object Inspector">
        {activePart && (
          <div>
            <div className="flex-between mb-4">
              <h2 className="heading-1 text-mono" style={{ color: 'var(--primary)' }}>{activePart.partNumber || activePart.pn}</h2>
              <span className={`badge ${activePart.status === 'RELEASED' ? 'badge-green' : 'badge-amber'}`}>{activePart.status || 'DRAFT'}</span>
            </div>
            
            <h3 className="heading-3 mb-6">{activePart.name}</h3>

            <div className="data-table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td className="text-subtle" style={{ width: '40%' }}>Type</td>
                    <td style={{ fontWeight: 600 }}>{activePart.type || 'PART'}</td>
                  </tr>
                  <tr>
                    <td className="text-subtle">Material</td>
                    <td>{activePart.material || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-subtle">Weight</td>
                    <td>{activePart.weight || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-subtle">Est. Cost</td>
                    <td>{activePart.cost || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-subtle">Lock State</td>
                    <td>{activePart.isLocked ? <span className="flex-start" style={{gap: 6, color: 'var(--warning)'}}><Lock size={12}/> Locked</span> : 'Open'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex-start" style={{ gap: 12 }}>
              <button className="btn btn-secondary flex-1"><GitCommit size={16} /> History</button>
              <button className="btn btn-primary flex-1">Open in Vault</button>
            </div>
          </div>
        )}
      </SlideOver>

    </AppShell>
  );
}

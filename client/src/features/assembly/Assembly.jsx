import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import SlideOver from '../../components/ui/SlideOver';
import {
  ChevronRight, File, Folder, Settings, Maximize, Minimize,
  GitCommit, Layers, ExternalLink, X, Eye, EyeOff,
  AlignLeft
} from 'lucide-react';
import { useAppStore } from '../../store';

// ─── BOM Node (controlled expand state via prop) ───────────────────────────
function BomNode({ node, level, onSelect, expandAll }) {
  const [expanded, setExpanded] = useState(level < 2);
  const isAssy = node.type === 'ASSEMBLY' || (node.children && node.children.length > 0);

  // Sync with global expand-all toggle
  useEffect(() => {
    if (expandAll !== null) setExpanded(expandAll);
  }, [expandAll]);

  return (
    <div>
      <div className="bom-row" style={{ paddingLeft: level * 20 }}>
        <div className="flex-start" style={{ flex: 1, gap: 8 }}>
          {isAssy ? (
            <button
              className="icon-btn"
              style={{ padding: 2, background: 'transparent' }}
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronRight size={14} style={{ transform: expanded ? 'rotate(90deg)' : '', transition: '0.2s' }} />
            </button>
          ) : <span style={{ width: 18 }} />}

          {isAssy
            ? <Folder size={14} color="var(--primary)" />
            : <File size={14} color="var(--text-muted)" />
          }

          <strong
            className="text-mono"
            style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}
            onClick={() => onSelect(node)}
          >
            {node.partNumber || node.pn}
          </strong>
          <span className="text-subtle" style={{ marginLeft: 8 }}>{node.name}</span>
        </div>

        <div style={{ width: 60 }}>
          <span className="badge badge-outline">{node.currentRev || node.rev}</span>
        </div>
        <div style={{ width: 40, textAlign: 'right' }} className="text-mono text-subtle">
          {node.qty || 1}
        </div>
      </div>

      {isAssy && expanded && node.children?.map(child => (
        <BomNode
          key={child.id}
          node={child}
          level={level + 1}
          onSelect={onSelect}
          expandAll={expandAll}
        />
      ))}
    </div>
  );
}

// ─── Configure View Panel ──────────────────────────────────────────────────
function ConfigurePanel({ isOpen, onClose, config, onChange }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div
        className="paper"
        style={{ width: 400, padding: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-between" style={{ marginBottom: 24 }}>
          <h3 className="heading-3">Configure Assembly View</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {[
          { key: 'showRev',      label: 'Show Revision Column',     icon: <AlignLeft size={14} /> },
          { key: 'showQty',      label: 'Show Quantity Column',     icon: <AlignLeft size={14} /> },
          { key: 'showType',     label: 'Show Part Type Icon',      icon: <Eye size={14} /> },
          { key: 'flattenView',  label: 'Flatten to Flat List',     icon: <EyeOff size={14} /> },
        ].map(opt => (
          <div
            key={opt.key}
            className="flex-between"
            style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex-start" style={{ gap: 10 }}>
              {opt.icon}
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </div>
            <button
              onClick={() => onChange(opt.key, !config[opt.key])}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none',
                background: config[opt.key] ? 'var(--primary)' : 'var(--border-strong)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: config[opt.key] ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s'
              }} />
            </button>
          </div>
        ))}

        <button className="btn btn-primary w-full" style={{ marginTop: 24 }} onClick={onClose}>
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── Main Assembly Component ───────────────────────────────────────────────
export default function Assembly() {
  const navigate = useNavigate();
  const [activePart, setActivePart] = useState(null);
  const [expandAll, setExpandAll] = useState(null);   // null = default, true/false = forced
  const [allExpanded, setAllExpanded] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [viewConfig, setViewConfig] = useState({
    showRev: true, showQty: true, showType: true, flattenView: false
  });
  const { fetchBomTree, partsList, fetchPartsList, partGraph, isLoading } = useAppStore();

  useEffect(() => {
    fetchPartsList();
  }, [fetchPartsList]);

  // Load first assembly part automatically
  useEffect(() => {
    if (partsList?.length > 0) {
      const firstAssy = partsList.find(p => p.type === 'ASSEMBLY') || partsList[0];
      if (firstAssy) fetchBomTree(firstAssy.id);
    }
  }, [partsList, fetchBomTree]);

  const handleExpandAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpandAll(next);
    // Reset to null after propagation so individual toggles work again
    setTimeout(() => setExpandAll(null), 100);
  };

  const handleConfigChange = (key, value) => {
    setViewConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppShell title="Assembly Viewer">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <Layers size={24} color="var(--primary)" /> Assembly Tree
            {partGraph && <span className="badge badge-outline">Rev {partGraph.currentRev}</span>}
          </h1>
          {/* Assembly picker */}
          <select
            className="field-input m-0"
            style={{ width: 260, padding: '6px 12px' }}
            onChange={e => { if (e.target.value) fetchBomTree(parseInt(e.target.value)); }}
            defaultValue=""
          >
            <option value="" disabled>Switch Assembly…</option>
            {partsList?.filter(p => p.type === 'ASSEMBLY').map(p => (
              <option key={p.id} value={p.id}>{p.partNumber} – {p.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExpandAll}>
            {allExpanded
              ? <><Minimize size={16} /> Collapse All</>
              : <><Maximize size={16} /> Expand All</>
            }
          </button>
          <button className="btn btn-primary" onClick={() => setConfigOpen(true)}>
            <Settings size={16} /> Configure View
          </button>
        </div>
      </div>

      <div className="split-view">
        {/* BOM Tree Area */}
        <div className="split-main paper p-0" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="paper-header flex-between" style={{ padding: '16px 24px', background: 'var(--bg-hover)' }}>
            <span className="text-xs-caps">Structure</span>
            <div className="flex-start" style={{ gap: 24 }}>
              {viewConfig.showRev && <span className="text-xs-caps">Rev</span>}
              {viewConfig.showQty && <span className="text-xs-caps" style={{ width: 40, textAlign: 'right' }}>Qty</span>}
            </div>
          </div>
          <div style={{ padding: 16, overflowY: 'auto' }}>
            {isLoading ? (
              <p className="text-subtle p-4">Loading structure from Database...</p>
            ) : partGraph ? (
              <BomNode
                node={partGraph}
                level={0}
                onSelect={setActivePart}
                expandAll={expandAll}
              />
            ) : (
              <p className="text-subtle p-4">No assembly found. Add parts to the database first.</p>
            )}
          </div>
        </div>

        {/* 3D View Mock / Selected Part Preview */}
        <div
          className="split-side paper"
          style={{
            background: activePart ? 'var(--bg-surface)' : '#090a0b',
            border: '1px solid #1f2937',
            color: 'var(--text-subtle)',
            display: 'flex', flexDirection: 'column',
            alignItems: activePart ? 'stretch' : 'center',
            justifyContent: activePart ? 'flex-start' : 'center',
            padding: activePart ? 24 : 0
          }}
        >
          {activePart ? (
            <div>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h3 className="heading-3 text-mono" style={{ color: 'var(--primary)' }}>
                  {activePart.partNumber}
                </h3>
                <span className={`badge ${activePart.status === 'RELEASED' ? 'badge-green' : activePart.status === 'REVIEW' ? 'badge-amber' : 'badge-gray'}`}>
                  {activePart.status || 'DRAFT'}
                </span>
              </div>
              <p style={{ fontSize: 14, marginBottom: 20, color: 'var(--text-secondary)' }}>{activePart.name}</p>
              <div className="data-table-wrapper" style={{ border: 'none' }}>
                <table className="data-table">
                  <tbody>
                    <tr><td className="text-subtle" style={{ width: '40%' }}>Type</td><td style={{ fontWeight: 600 }}>{activePart.type || 'PART'}</td></tr>
                    <tr><td className="text-subtle">Material</td><td>{activePart.material || '-'}</td></tr>
                    <tr><td className="text-subtle">Weight</td><td>{activePart.weight || '-'}</td></tr>
                    <tr><td className="text-subtle">Est. Cost</td><td>{activePart.cost || '-'}</td></tr>
                    <tr><td className="text-subtle">Revision</td><td><span className="badge badge-outline">{activePart.currentRev || '-'}</span></td></tr>
                    <tr>
                      <td className="text-subtle">Lock State</td>
                      <td>{activePart.isLocked
                        ? <span style={{ color: 'var(--warning)' }}>🔒 Locked</span>
                        : <span style={{ color: 'var(--primary)' }}>✓ Open</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex-start" style={{ gap: 12 }}>
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => navigate(`/revision?partId=${activePart.id}`)}
                >
                  <GitCommit size={16} /> History
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => navigate('/files')}
                >
                  <ExternalLink size={16} /> Open in Vault
                </button>
              </div>
            </div>
          ) : (
            <>
              <Layers size={64} style={{ opacity: 0.08, marginBottom: 16 }} />
              <h3 className="heading-3" style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                No Part Selected
              </h3>
              <p style={{ textAlign: 'center', maxWidth: 220, fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                👈 Click any <strong style={{ color: 'var(--primary)' }}>part number</strong> in the tree on the left to inspect its metadata here.
              </p>
              <div style={{ marginTop: 24, padding: '10px 18px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 12, color: 'var(--primary)', textAlign: 'center' }}>
                💡 Use <strong>Expand All</strong> to reveal nested sub-assemblies
              </div>
            </>
          )}
        </div>
      </div>

      {/* Configure View Modal */}
      <ConfigurePanel
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        config={viewConfig}
        onChange={handleConfigChange}
      />

      {/* Part Details SlideOver (click from tree) */}
      <SlideOver isOpen={!!activePart} onClose={() => setActivePart(null)} title="Object Inspector">
        {activePart && (
          <div>
            <div className="flex-between mb-4">
              <h2 className="heading-1 text-mono" style={{ color: 'var(--primary)' }}>
                {activePart.partNumber || activePart.pn}
              </h2>
              <span className={`badge ${activePart.status === 'RELEASED' ? 'badge-green' : 'badge-amber'}`}>
                {activePart.status || 'DRAFT'}
              </span>
            </div>
            <h3 className="heading-3 mb-6">{activePart.name}</h3>
            <div className="data-table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <tbody>
                  <tr><td className="text-subtle" style={{ width: '40%' }}>Type</td><td style={{ fontWeight: 600 }}>{activePart.type || 'PART'}</td></tr>
                  <tr><td className="text-subtle">Material</td><td>{activePart.material || '-'}</td></tr>
                  <tr><td className="text-subtle">Weight</td><td>{activePart.weight || '-'}</td></tr>
                  <tr><td className="text-subtle">Est. Cost</td><td>{activePart.cost || '-'}</td></tr>
                  <tr><td className="text-subtle">Lock State</td>
                    <td>{activePart.isLocked
                      ? <span className="flex-start" style={{ gap: 6, color: 'var(--warning)' }}>🔒 Locked</span>
                      : 'Open'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex-start" style={{ gap: 12 }}>
              <button
                className="btn btn-secondary flex-1"
                onClick={() => { setActivePart(null); navigate(`/revision?partId=${activePart.id}`); }}
              >
                <GitCommit size={16} /> History
              </button>
              <button
                className="btn btn-primary flex-1"
                onClick={() => { setActivePart(null); navigate('/files'); }}
              >
                <ExternalLink size={16} /> Open in Vault
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  );
}

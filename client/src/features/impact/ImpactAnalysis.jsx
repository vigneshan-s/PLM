import React, { useEffect, useState, useRef, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import {
  Activity, AlertTriangle, CheckCircle, Zap, Shield,
  GitBranch, ChevronDown, RefreshCw, ArrowRight, Info
} from 'lucide-react';
import { useAppStore } from '../../store';

// ─── Animated SVG Graph ────────────────────────────────────────────────────
function ImpactGraph({ part, insights, onNodeClick, selectedNode }) {
  const svgRef = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  if (!part) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
      <Activity size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
      <p style={{ fontSize: 14 }}>Select a part above to run impact analysis</p>
    </div>
  );

  const W = 800, H = 520;
  const CX = W / 2, CY = H / 2;
  const ORBIT_R = 190;

  const riskColor = (risk) => risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#10b981';

  // Animated dashes offset
  const dashOffset = -(tick * 0.6) % 20;

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        {/* Dot grid */}
        <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.04)" />
        </pattern>
        {/* Glow filters */}
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Arrow markers */}
        <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" opacity="0.8" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" opacity="0.8" />
        </marker>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" opacity="0.8" />
        </marker>
        {/* Radial gradient for core node */}
        <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="#050709" />
      <rect width={W} height={H} fill="url(#dots)" />

      {/* Outer ambience ring */}
      <circle cx={CX} cy={CY} r={ORBIT_R + 50}
        fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="60" />

      {/* Orbit ring */}
      <circle cx={CX} cy={CY} r={ORBIT_R}
        fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1"
        strokeDasharray="4 8" strokeDashoffset={dashOffset * 0.3} />

      {/* Connection lines from core to satellites */}
      {insights.map((ins, idx) => {
        const total = insights.length;
        const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
        const nx = CX + Math.cos(angle) * ORBIT_R;
        const ny = CY + Math.sin(angle) * ORBIT_R;
        const color = riskColor(ins.risk);
        const markerId = ins.risk === 'high' ? 'arrow-red' : ins.risk === 'medium' ? 'arrow-amber' : 'arrow-green';
        const isSelected = selectedNode?.id === ins.id;

        // Curved bezier control point
        const cpx = CX + Math.cos(angle + 0.3) * (ORBIT_R * 0.5);
        const cpy = CY + Math.sin(angle + 0.3) * (ORBIT_R * 0.5);

        return (
          <g key={`line-${idx}`}>
            {/* Glow path (thicker, blurred) */}
            <path
              d={`M ${CX} ${CY} Q ${cpx} ${cpy} ${nx} ${ny}`}
              fill="none"
              stroke={color}
              strokeWidth={isSelected ? 3 : 1.5}
              opacity={isSelected ? 0.6 : 0.2}
              strokeDasharray="8 4"
              strokeDashoffset={dashOffset}
            />
            {/* Arrow path */}
            <path
              d={`M ${CX + Math.cos(angle) * 52} ${CY + Math.sin(angle) * 52} Q ${cpx} ${cpy} ${nx - Math.cos(angle) * 28} ${ny - Math.sin(angle) * 28}`}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              opacity={0.5}
              markerEnd={`url(#${markerId})`}
            />
          </g>
        );
      })}

      {/* Core node — the selected part */}
      <g style={{ cursor: 'default' }}>
        {/* Pulse rings */}
        {[0, 1, 2].map(i => (
          <circle key={i} cx={CX} cy={CY}
            r={44 + (((tick * 0.5 + i * 20) % 60))}
            fill="none"
            stroke="rgba(99,102,241,0.15)"
            strokeWidth="1"
            opacity={1 - ((tick * 0.5 + i * 20) % 60) / 60}
          />
        ))}
        <circle cx={CX} cy={CY} r={44} fill="url(#core-grad)" filter="url(#glow-green)" />
        <circle cx={CX} cy={CY} r={44} fill="rgba(13,14,17,0.9)" stroke="#6366f1" strokeWidth="2.5" />
        <circle cx={CX} cy={CY} r={52} fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="3 5" strokeDashoffset={-dashOffset} />

        <text x={CX} y={CY - 8} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="monospace">
          {part.partNumber}
        </text>
        <text x={CX} y={CY + 6} textAnchor="middle" fill="#9ca3af" fontSize="8.5" fontFamily="monospace">
          {part.currentRev}
        </text>
        <text x={CX} y={CY + 18} textAnchor="middle" fill="#6366f1" fontSize="8" fontFamily="monospace">
          ORIGIN
        </text>
      </g>

      {/* Satellite nodes */}
      {insights.map((ins, idx) => {
        const total = insights.length;
        const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
        const nx = CX + Math.cos(angle) * ORBIT_R;
        const ny = CY + Math.sin(angle) * ORBIT_R;
        const color = riskColor(ins.risk);
        const isSelected = selectedNode?.id === ins.id;
        const glowId = ins.risk === 'high' ? 'glow-red' : ins.risk === 'medium' ? 'glow-amber' : 'glow-green';

        // Label position (outside the node)
        const labelAngle = angle;
        const labelR = ORBIT_R + 42;
        const lx = CX + Math.cos(labelAngle) * labelR;
        const ly = CY + Math.sin(labelAngle) * labelR;

        return (
          <g key={`node-${idx}`} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(ins)}>
            {isSelected && (
              <circle cx={nx} cy={ny} r={28} fill={color} opacity={0.12} filter={`url(#${glowId})`} />
            )}
            <circle cx={nx} cy={ny} r={isSelected ? 22 : 18}
              fill="#0d0e10"
              stroke={color}
              strokeWidth={isSelected ? 3 : 2}
              filter={isSelected ? `url(#${glowId})` : undefined}
            />
            {/* Risk indicator dot */}
            <circle cx={nx + 12} cy={ny - 12} r="5" fill={color} stroke="#050709" strokeWidth="1.5" />

            <text x={nx} y={ny + 5} textAnchor="middle" fill="#e5e7eb" fontSize="8.5" fontWeight="700" fontFamily="monospace">
              {ins.partNumber?.split('-')[0] || 'ASM'}
            </text>

            {/* Label outside orbit */}
            <text x={lx} y={ly - 5} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
              {ins.partNumber}
            </text>
            <text x={lx} y={ly + 7} textAnchor="middle"
              fill={color} fontSize="8" fontFamily="monospace" fontWeight="600">
              {ins.risk?.toUpperCase()} RISK
            </text>
          </g>
        );
      })}

      {/* Center label when no impacts */}
      {insights.length === 0 && (
        <g>
          <circle cx={CX} cy={CY} r={90} fill="rgba(16,185,129,0.05)" stroke="#10b981" strokeWidth="1" strokeDasharray="4 8" />
          <text x={CX} y={CY + 70} textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace">
            ✓ NO UPSTREAM DEPENDENCIES
          </text>
        </g>
      )}

      {/* Legend */}
      <g transform={`translate(16, ${H - 70})`}>
        {[
          { color: '#ef4444', label: 'High Risk' },
          { color: '#f59e0b', label: 'Medium Risk' },
          { color: '#10b981', label: 'Low Risk' },
        ].map((l, i) => (
          <g key={i} transform={`translate(0, ${i * 18})`}>
            <circle r="4" fill={l.color} cx="6" cy="0" />
            <text x="16" y="4" fill="#6b7280" fontSize="10" fontFamily="monospace">{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Risk Score Ring ───────────────────────────────────────────────────────
function RiskRing({ score, label, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{score}</text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ImpactAnalysis() {
  const { fetchImpactGraph, impactData, isLoading, partsList, fetchPartsList } = useAppStore();
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => { fetchPartsList(); }, [fetchPartsList]);

  useEffect(() => {
    if (partsList.length > 0 && !selectedPartId) {
      // Auto-select a part that has upstream dependencies (e.g. PRT-010 Drive Shaft used in ASM-001)
      const first = partsList.find(p => p.type === 'PART') || partsList[0];
      setSelectedPartId(String(first.id));
      fetchImpactGraph(first.id);
    }
  }, [partsList]);

  const handlePartChange = (id) => {
    setSelectedPartId(id);
    setSelectedNode(null);
    setSimResult(null);
    if (id) fetchImpactGraph(parseInt(id));
  };

  const runSimulation = () => {
    if (!impactData?.part) return;
    setSimulating(true);
    setTimeout(() => {
      const highRisks = insights.filter(i => i.risk === 'high').length;
      const total = insights.length;
      setSimResult({
        ecnsRequired: highRisks,
        partsAffected: total,
        estimatedDays: highRisks * 3 + total,
        complianceFlag: highRisks > 0,
        recommendation: highRisks > 1
          ? 'Stage change in separate ECNs to limit blast radius.'
          : highRisks === 1
            ? 'Single ECO review required. Coordinate with assembly team.'
            : 'Safe to proceed. No high-risk parents detected.',
      });
      setSimulating(false);
    }, 1400);
  };

  const part = impactData?.part || null;
  const rawInsights = impactData?.insights || [];

  // Enrich insights with partNumber from parentBoms
  const insights = rawInsights.map((ins, i) => ({
    ...ins,
    partNumber: ins.partNumber || `ASSY-${ins.id}`,
    risk: ins.risk,
  }));

  // Compute risk scores
  const highCount  = insights.filter(i => i.risk === 'high').length;
  const lowCount   = insights.filter(i => i.risk === 'low').length;
  const totalRisk  = Math.min(100, highCount * 35 + lowCount * 10 + insights.length * 5);
  const changeImpact = Math.min(100, insights.length * 20);
  const compliance = Math.max(0, 100 - highCount * 25);

  return (
    <AppShell title="Impact Analysis">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 className="heading-1 flex-start" style={{ gap: 10 }}>
              <Activity size={22} color="var(--primary)" />
              Impact Graph
            </h1>
            <p className="text-subtle" style={{ marginTop: 2 }}>
              Where-used dependency mapping & change propagation analysis.
            </p>
          </div>

          {/* Part Picker */}
          <div style={{ position: 'relative' }}>
            <select
              className="field-input m-0"
              style={{ width: 280, padding: '8px 36px 8px 12px', appearance: 'none' }}
              value={selectedPartId}
              onChange={e => handlePartChange(e.target.value)}
            >
              <option value="">— Select Part to Analyse —</option>
              {partsList.map(p => (
                <option key={p.id} value={p.id}>{p.partNumber} · {p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Risk Score Rings */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <RiskRing score={totalRisk}    label="Risk Score"    color={totalRisk > 60 ? '#ef4444' : totalRisk > 30 ? '#f59e0b' : '#10b981'} />
          <RiskRing score={changeImpact} label="Change Impact" color="#6366f1" />
          <RiskRing score={compliance}   label="Compliance"    color={compliance > 70 ? '#10b981' : '#f59e0b'} />
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: 20, height: 560 }}>

        {/* SVG Graph — takes most space */}
        <div style={{
          flex: 2, borderRadius: 12, overflow: 'hidden',
          border: '1px solid #1a1f2e', position: 'relative',
          background: '#050709'
        }}>
          {/* Top badge */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 8 }}>
            <span className="badge badge-outline" style={{ fontFamily: 'monospace', fontSize: 10 }}>
              <Activity size={10} /> SmartPLM · Live Dependency Engine
            </span>
            {insights.length > 0 && (
              <span className="badge" style={{ background: highCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: highCount > 0 ? '#ef4444' : '#10b981', fontSize: 10 }}>
                {insights.length} upstream {insights.length === 1 ? 'dependency' : 'dependencies'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#4b5563', gap: 12 }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" />
              <span style={{ fontSize: 13, fontFamily: 'monospace' }}>Tracing dependency graph…</span>
            </div>
          ) : (
            <ImpactGraph
              part={part}
              insights={insights}
              onNodeClick={setSelectedNode}
              selectedNode={selectedNode}
            />
          )}
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          {/* Selected Node Inspector */}
          <div className="paper p-0" style={{ flexShrink: 0 }}>
            <div className="paper-header" style={{ padding: '12px 16px' }}>
              <h3 className="heading-3 flex-start" style={{ gap: 8, fontSize: 13 }}>
                <GitBranch size={14} color="var(--primary)" /> Node Inspector
              </h3>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {!selectedNode ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                  Click a node on the graph to inspect it
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="flex-between">
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {selectedNode.partNumber || `ID-${selectedNode.id}`}
                    </span>
                    <span className={`badge ${selectedNode.risk === 'high' ? 'badge-red' : selectedNode.risk === 'medium' ? 'badge-amber' : 'badge-green'}`}>
                      {selectedNode.risk?.toUpperCase()} RISK
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {selectedNode.msg}
                  </p>
                  {selectedNode.risk === 'high' && (
                    <div style={{ display: 'flex', gap: 6, padding: '8px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                      <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 11, color: '#ef4444', lineHeight: 1.5 }}>
                        This parent is RELEASED — any change to the origin part requires a mandatory ECO sign-off.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Risk Insights */}
          <div className="paper p-0" style={{ flex: 1, minHeight: 0 }}>
            <div className="paper-header" style={{ padding: '12px 16px' }}>
              <h3 className="heading-3 flex-start" style={{ gap: 8, fontSize: 13 }}>
                <Shield size={14} color="var(--primary)" /> Dependency Risk List
              </h3>
            </div>
            <div style={{ padding: '8px 12px', overflowY: 'auto', maxHeight: 200 }}>
              {insights.length === 0 ? (
                <div style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(16,185,129,0.07)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>No upstream dependencies found</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>This part can be safely modified without impacting other assemblies.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights.map((ins, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedNode(ins)}
                      style={{
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selectedNode?.id === ins.id ? 'var(--primary-50)' : 'var(--bg-hover)',
                        border: `1px solid ${selectedNode?.id === ins.id ? 'var(--primary-100)' : 'var(--border-light)'}`,
                        transition: 'all 0.12s'
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                          {ins.partNumber || `Node #${ins.id}`}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                          background: ins.risk === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: ins.risk === 'high' ? '#ef4444' : '#f59e0b'
                        }}>
                          {ins.risk?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{ins.msg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Change Propagation Simulator */}
          <div className="paper p-0" style={{ flexShrink: 0 }}>
            <div className="paper-header" style={{ padding: '12px 16px' }}>
              <h3 className="heading-3 flex-start" style={{ gap: 8, fontSize: 13 }}>
                <Zap size={14} color="var(--primary)" /> Propagation Simulator
              </h3>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {!simResult ? (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                    Simulate what happens across the BOM if <strong style={{ color: 'var(--text-primary)' }}>{part?.partNumber || '—'}</strong> is modified.
                  </p>
                  <button
                    className="btn btn-primary w-full"
                    style={{ fontSize: 12, padding: '8px 0' }}
                    onClick={runSimulation}
                    disabled={simulating || !part}
                  >
                    {simulating
                      ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Simulating…</>
                      : <><Zap size={13} /> Run Simulation</>}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Parts Affected',    value: simResult.partsAffected,   color: '#6366f1' },
                    { label: 'ECNs Required',     value: simResult.ecnsRequired,    color: '#f59e0b' },
                    { label: 'Est. Review Days',  value: `~${simResult.estimatedDays}d`, color: '#10b981' },
                  ].map((row, i) => (
                    <div key={i} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: 'monospace' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 6, marginTop: 4,
                    background: simResult.complianceFlag ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${simResult.complianceFlag ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}>
                    <Info size={13} color={simResult.complianceFlag ? '#ef4444' : '#10b981'} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: simResult.complianceFlag ? '#ef4444' : '#10b981', lineHeight: 1.5 }}>
                      {simResult.recommendation}
                    </p>
                  </div>
                  <button className="btn btn-secondary w-full" style={{ fontSize: 11, padding: '6px 0', marginTop: 4 }}
                    onClick={() => setSimResult(null)}>
                    <RefreshCw size={12} /> Reset
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

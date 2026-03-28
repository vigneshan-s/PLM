import React, { useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Activity, AlertTriangle, CheckCircle, Database, Server } from 'lucide-react';
import { useAppStore } from '../../store';

export default function ImpactAnalysis() {
  const { fetchImpactGraph, impactData, isLoading } = useAppStore();

  useEffect(() => {
    // Hardcoded to Part 1 for demo purposes (Gear Shaft)
    fetchImpactGraph(1);
  }, [fetchImpactGraph]);

  return (
    <AppShell title="AI Impact Insights">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <Activity size={24} color="var(--primary)" /> Predictive Graph
          </h1>
          <p className="text-subtle">Real-time Where-Used dependency mapping across the supplier network.</p>
        </div>
      </div>

      <div className="split-view">
        {/* SVG Visualization Area */}
        <div className="split-main paper p-0" style={{ background: '#090a0b', border: '1px solid #1f2937', minHeight: 600, position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <span className="badge badge-outline"><Database size={12} /> Live Scan: SmartPLM Engine</span>
          </div>

          <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.1))' }}>
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Core Node */}
            <g transform="translate(400, 300)">
              <circle r="40" fill="var(--bg-app)" stroke="var(--primary)" strokeWidth="3" />
              <circle r="60" fill="none" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" style={{ animation: 'spin 10s linear infinite' }} />
              <text y="5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{impactData?.part?.partNumber || 'SCAN'}</text>
              <text y="20" textAnchor="middle" fill="var(--text-muted)" fontSize="9">{impactData?.part?.currentRev || '...'}</text>
            </g>

            {/* Connecting Lines & Parent Nodes based on DB Data */}
            {impactData?.insights.map((insight, idx) => {
              // Mathematical layout for nodes in a circle
              const angle = (Math.PI * 2 / impactData.insights.length) * idx - Math.PI / 2;
              const r = 180;
              const x = 400 + Math.cos(angle) * r;
              const y = 300 + Math.sin(angle) * r;
              
              const isHigh = insight.risk === 'high';
              const color = isHigh ? 'var(--danger)' : 'var(--primary)';
              
              return (
                <g key={idx}>
                  <path d={`M 400 300 L ${x} ${y}`} stroke={color} strokeWidth="2" opacity="0.5" strokeDasharray={isHigh ? '' : '5 5'} />
                  <circle cx={x} cy={y} r="6" fill={color} />
                  <rect x={x - 40} y={y + 15} width="80" height="24" rx="12" fill="var(--bg-app)" stroke={color} strokeWidth="1" />
                  <text x={x} y={y + 31} textAnchor="middle" fill="#fff" fontSize="10">{insight.id}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* AI Analysis Panel */}
        <div className="split-side paper p-0" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="paper-header flex-start">
            <Server size={16} color="var(--primary)" />
            <h3 className="heading-3">Dependency Risk Analysis</h3>
          </div>
          
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <p className="text-subtle text-center">Tracing part dependencies...</p>
            ) : impactData?.insights?.length === 0 ? (
              <div className="flex-start" style={{ gap: 12, padding: 16, background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircle size={20} color="var(--primary)" />
                <p style={{ fontSize: 13, color: 'var(--primary-dark)', fontWeight: 600 }}>No downstream risks detected. Part can be safely modified.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {impactData?.insights.map((insight, i) => (
                  <div key={i} className="paper" style={{ padding: 16, background: 'var(--bg-app)' }}>
                    <div className="flex-between mb-2">
                      <span className={`badge ${insight.risk === 'high' ? 'badge-red' : 'badge-amber'}`} style={{ textTransform: 'uppercase' }}>
                        {insight.risk} Risk Constraint
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>{insight.msg}</strong>
                    </p>
                    <div className="mt-3 text-mono text-subtle" style={{ fontSize: 10 }}>Parent Assy DB-ID: {insight.id}</div>
                  </div>
                ))}

                <div className="mt-4 p-4" style={{ background: 'var(--danger-50)', border: '1px dashed var(--danger-100)', borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-xs-caps flex-start" style={{ color: 'var(--danger)', marginBottom: 8 }}><AlertTriangle size={14} /> Engineer Warning</p>
                  <p style={{ fontSize: 12, color: 'var(--danger-dark)' }}>
                    Modifying {impactData?.part?.partNumber} will trigger a mandatory ECO review cascade for all parent assemblies currently flagged "high risk" above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

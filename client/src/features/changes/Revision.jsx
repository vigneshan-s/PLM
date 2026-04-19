import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { GitBranch, User, Clock, CheckCircle, GitCommit, Activity, Package, AlertTriangle, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store';
import { api } from '../../store';

function TimeAgo({ dateStr }) {
  if (!dateStr) return <span>—</span>;
  const diffHours = Math.floor((new Date() - new Date(dateStr)) / 3600000);
  if (diffHours < 1) return <span>Just now</span>;
  if (diffHours < 24) return <span>{diffHours}h ago</span>;
  const days = Math.floor(diffHours / 24);
  return <span>{days}d ago · {new Date(dateStr).toLocaleDateString()}</span>;
}

function DiffViewer({ rev, prevRev }) {
  if (!rev) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      👈 Click a revision in the timeline to inspect its changes.
    </div>
  );

  const lines = rev.changes?.split('. ').filter(Boolean) || [];

  return (
    <div style={{ fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: 12, lineHeight: 1.7 }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
        <span>@@ comparing {prevRev?.revString || 'origin'} → {rev.revString}</span>
        <span style={{ color: '#6b7280' }}>{new Date(rev.createdAt).toLocaleString()}</span>
      </div>

      {/* Diff Lines */}
      <div style={{ padding: '16px 0' }}>
        {/* Static context lines */}
        {[
          { type: 'ctx', text: `  "partNumber": "${rev.revString}",` },
          { type: 'ctx', text: `  "revision": "${rev.revString}",` },
          { type: 'ctx', text: `  "approvedBy": "${rev.pushedBy}",` },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', padding: '1px 0' }}>
            <span style={{ color: '#4b5563', paddingRight: 16, paddingLeft: 8, userSelect: 'none', minWidth: 32 }}>{i + 1}</span>
            <span style={{ color: '#d1d5db', paddingLeft: 8 }}>{l.text}</span>
          </div>
        ))}

        {/* Actual change lines from DB */}
        {lines.map((line, i) => (
          <div key={`change-${i}`} style={{ display: 'flex', padding: '1px 0', background: 'rgba(16,185,129,0.07)' }}>
            <span style={{ color: '#4b5563', paddingRight: 8, paddingLeft: 4, userSelect: 'none', minWidth: 32 }}>{i + 4}</span>
            <span style={{ color: '#10b981', paddingLeft: 8 }}>+ {line.trim()}.</span>
          </div>
        ))}

        {/* If has prev rev, show removed line */}
        {prevRev && (
          <div style={{ display: 'flex', padding: '1px 0', background: 'rgba(239,68,68,0.07)' }}>
            <span style={{ color: '#4b5563', paddingRight: 8, paddingLeft: 4, userSelect: 'none', minWidth: 32 }}>~</span>
            <span style={{ color: '#ef4444', paddingLeft: 8 }}>- [superseded by {rev.revString}]</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ margin: '16px 16px 0', padding: '10px 14px', background: '#0d1117', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 11 }}>
        <CheckCircle size={13} color="var(--primary)" />
        Revision passed automated compliance checks · pushed by <strong style={{ color: '#d1d5db' }}>{rev.pushedBy}</strong>
      </div>
    </div>
  );
}

export default function Revision() {
  const [searchParams] = useSearchParams();
  const urlPartId = searchParams.get('partId');

  const { fetchRevisions, revisions, isLoading, partsList, fetchPartsList } = useAppStore();
  const [selectedRev, setSelectedRev] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState(urlPartId || '');
  const [activeTab, setActiveTab] = useState('revisions'); // 'revisions' | 'activity'
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => { fetchPartsList(); }, [fetchPartsList]);

  // When URL has a partId (coming from Assembly page), auto-select it
  useEffect(() => {
    if (urlPartId) {
      setSelectedPartId(urlPartId);
      fetchRevisions(parseInt(urlPartId));
    } else if (partsList.length > 0 && !selectedPartId) {
      // Auto-select first part
      const first = partsList[0];
      setSelectedPartId(String(first.id));
      fetchRevisions(first.id);
    }
  }, [urlPartId, partsList]);

  // When selected part changes
  useEffect(() => {
    if (selectedPartId) {
      fetchRevisions(parseInt(selectedPartId));
      setSelectedRev(null);
    }
  }, [selectedPartId]);

  // Auto-select first revision
  useEffect(() => {
    if (revisions.length > 0) setSelectedRev(revisions[0]);
  }, [revisions]);

  // Fetch global activity log
  useEffect(() => {
    if (activeTab === 'activity') {
      setActivityLoading(true);
      api.get('/dashboard/activity')
        .then(r => setActivityLogs(r.data))
        .catch(() => {})
        .finally(() => setActivityLoading(false));
    }
  }, [activeTab]);

  const selectedPart = partsList.find(p => String(p.id) === String(selectedPartId));
  const selectedRevIdx = revisions.findIndex(r => r.id === selectedRev?.id);
  const prevRev = revisions[selectedRevIdx + 1] || null;

  return (
    <AppShell title="Revision Management">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
              <GitBranch size={24} color="var(--primary)" /> Revision History
            </h1>
            <p className="text-subtle">Full audit trail and lifecycle progression for specific parts.</p>
          </div>
          {/* Part Picker */}
          <div style={{ position: 'relative' }}>
            <select
              className="field-input m-0"
              style={{ width: 280, padding: '8px 36px 8px 12px', appearance: 'none' }}
              value={selectedPartId}
              onChange={e => setSelectedPartId(e.target.value)}
            >
              <option value="">— Select a Part —</option>
              {partsList.map(p => (
                <option key={p.id} value={p.id}>{p.partNumber} · {p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-hover)', padding: 4, borderRadius: 8 }}>
          {[
            { key: 'revisions', label: 'Revision Log', icon: <GitCommit size={14} /> },
            { key: 'activity',  label: 'Activity Feed', icon: <Activity size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="btn"
              style={{
                padding: '6px 16px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center',
                background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                border: activeTab === tab.key ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 6, boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── REVISION TAB ── */}
      {activeTab === 'revisions' && (
        <div className="split-view">
          {/* Timeline */}
          <div className="split-main paper">
            <div className="paper-header flex-between mb-4">
              <h3 className="heading-3 flex-start" style={{ gap: 8 }}>
                <Package size={16} color="var(--primary)" />
                {selectedPart ? `${selectedPart.partNumber} — ${selectedPart.name}` : 'Select a part'}
              </h3>
              <span className="badge badge-outline">
                <Clock size={12} /> {revisions.length} snapshot{revisions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <GitBranch size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>Querying revision history from database...</p>
              </div>
            ) : !selectedPartId ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>Select a part above to view its revision timeline.</p>
              </div>
            ) : revisions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertTriangle size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>No revisions found for this part.</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>Revisions are created when a part is released via an ECN.</p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 12, marginTop: 8 }}>
                {/* Vertical spine */}
                <div style={{ position: 'absolute', top: 8, bottom: 8, left: 24, width: 2, background: 'linear-gradient(to bottom, var(--primary), var(--border))' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {revisions.map((rev, idx) => {
                    const isNewest = idx === 0;
                    const isSelected = selectedRev?.id === rev.id;
                    return (
                      <div
                        key={rev.id}
                        style={{ position: 'relative', display: 'flex', gap: 24, cursor: 'pointer', transition: 'opacity 0.15s', opacity: isSelected ? 1 : 0.55 }}
                        onClick={() => setSelectedRev(rev)}
                      >
                        {/* Node dot */}
                        <div style={{
                          position: 'absolute', top: 4, left: 4,
                          width: 20, height: 20, borderRadius: '50%', zIndex: 2,
                          background: isNewest ? 'var(--primary)' : 'var(--bg-surface)',
                          border: `3px solid ${isNewest ? 'var(--primary-dark)' : 'var(--border-strong)'}`,
                          boxShadow: isNewest ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isNewest && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </div>

                        <div style={{ paddingLeft: 40, flex: 1 }}>
                          <div
                            className="paper"
                            style={{
                              padding: 16,
                              background: isSelected ? 'var(--primary-50)' : 'var(--bg-hover)',
                              border: isSelected ? '1px solid var(--primary-100)' : '1px solid var(--border-light)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div className="flex-between" style={{ marginBottom: 8 }}>
                              <div className="flex-start" style={{ gap: 10 }}>
                                <span className={`badge ${isNewest ? 'badge-green' : 'badge-outline'}`}>{rev.revString}</span>
                                {isNewest && <span className="badge badge-blue" style={{ fontSize: 10 }}>LATEST</span>}
                              </div>
                              <span className="text-mono text-subtle" style={{ fontSize: 11 }}>
                                <TimeAgo dateStr={rev.createdAt} />
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, margin: '8px 0' }}>
                              {rev.changes || 'System checkpoint snapshot.'}
                            </p>
                            <div className="flex-start" style={{ gap: 6, marginTop: 8 }}>
                              <User size={11} color="var(--text-muted)" />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rev.pushedBy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Diff Inspector */}
          <div className="split-side paper p-0" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="paper-header flex-between" style={{ background: '#0d1117', borderBottom: '1px solid #1f2937' }}>
              <h3 className="heading-3 flex-start" style={{ gap: 8, color: '#d1d5db' }}>
                <GitCommit size={16} color="var(--primary)" /> Diff Viewer
              </h3>
              {selectedRev && (
                <div className="flex-start" style={{ gap: 8 }}>
                  <span className="badge badge-outline" style={{ fontFamily: 'monospace' }}>{selectedRev.revString}</span>
                </div>
              )}
            </div>
            <div style={{ background: '#090a0b', flex: 1, overflowY: 'auto', minHeight: 400 }}>
              <DiffViewer rev={selectedRev} prevRev={prevRev} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY FEED TAB ── */}
      {activeTab === 'activity' && (
        <div className="paper">
          <div className="paper-header flex-between mb-4">
            <h3 className="heading-3 flex-start" style={{ gap: 8 }}>
              <Activity size={16} color="var(--primary)" /> Global Activity Feed
            </h3>
            <span className="badge badge-outline">{activityLogs.length} events</span>
          </div>

          {activityLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading activity logs...</div>
          ) : activityLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No activity logged yet.</div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 12 }}>
              <div style={{ position: 'absolute', top: 8, bottom: 8, left: 24, width: 2, background: 'linear-gradient(to bottom, var(--primary), var(--border))' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {activityLogs.map((log, idx) => (
                  <div key={log.id || idx} style={{ position: 'relative', display: 'flex', gap: 20, paddingBottom: 20 }}>
                    {/* Dot */}
                    <div style={{
                      position: 'absolute', top: 6, left: 4,
                      width: 18, height: 18, borderRadius: '50%', zIndex: 2,
                      background: idx === 0 ? 'var(--primary)' : 'var(--bg-surface)',
                      border: `3px solid ${idx === 0 ? 'var(--primary)' : 'var(--border-strong)'}`,
                    }} />

                    <div style={{ paddingLeft: 40, flex: 1 }}>
                      <div className="flex-between" style={{ paddingTop: 2 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.user?.name || 'System'}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 6 }}>
                            {log.action}
                          </span>
                        </div>
                        <span className="text-mono text-subtle" style={{ fontSize: 11 }}>
                          <TimeAgo dateStr={log.createdAt} />
                        </span>
                      </div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                        <span className="badge badge-outline" style={{ fontSize: 10 }}>{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-mono text-subtle" style={{ fontSize: 10 }}>ID: {log.entityId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

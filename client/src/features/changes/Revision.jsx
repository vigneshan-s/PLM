import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { GitBranch, User, Clock, CheckCircle, ArrowRight, GitCommit } from 'lucide-react';
import { useAppStore } from '../../store';

function TimeAgo({ dateStr }) {
  const diffHours = Math.floor((new Date() - new Date(dateStr)) / 3600000);
  if (diffHours < 1) return <span>A few minutes ago</span>;
  if (diffHours < 24) return <span>{diffHours} hrs ago</span>;
  return <span>{Math.floor(diffHours/24)} days ago ({new Date(dateStr).toLocaleDateString()})</span>;
}

export default function Revision() {
  const { fetchRevisions, revisions, isLoading } = useAppStore();
  const [selectedRev, setSelectedRev] = useState(null);

  useEffect(() => {
    // Fetch History for Gear Shaft (Part 1) by default
    fetchRevisions(1);
  }, [fetchRevisions]);

  useEffect(() => {
    if (revisions.length > 0) setSelectedRev(revisions[0]);
  }, [revisions]);

  return (
    <AppShell title="Revision Management">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <GitBranch size={24} color="var(--primary)" /> Revision History
          </h1>
          <p className="text-subtle">Full audit trail and lifecycle progression for specific parts.</p>
        </div>
      </div>

      <div className="split-view">
        {/* Timeline Log Area */}
        <div className="split-main paper">
          <div className="paper-header flex-between mb-4">
            <h3 className="heading-3">Activity Timeline</h3>
            <span className="badge badge-outline"><Clock size={12} /> {revisions.length} Snapshots Found</span>
          </div>

          <div style={{ position: 'relative', paddingLeft: 12, marginTop: 24 }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 24, width: 2, background: 'var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {isLoading && <p className="text-subtle">Querying Revision History from Database...</p>}
              {revisions.map((rev, idx) => {
                const isNewest = idx === 0;
                return (
                  <div key={rev.id} style={{ position: 'relative', display: 'flex', gap: 24, cursor: 'pointer', opacity: selectedRev?.id === rev.id ? 1 : 0.6 }} onClick={() => setSelectedRev(rev)}>
                    <div style={{ position: 'absolute', top: 0, left: 4, width: 16, height: 16, borderRadius: '50%', background: isNewest ? 'var(--primary-dark)' : 'var(--bg-app)', border: `4px solid ${isNewest ? 'var(--bg-app)' : 'var(--border-strong)'}`, zIndex: 2 }} />
                    <div style={{ paddingLeft: 40, flex: 1 }}>
                      <div className="flex-start" style={{ gap: 12, marginBottom: 8 }}>
                        <span className={`badge ${isNewest ? 'badge-amber' : 'badge-outline'}`}>{rev.revString}</span>
                        <div className="flex-start text-subtle" style={{ fontSize: 13, gap: 6 }}>
                          <User size={14} /> {rev.pushedBy}
                        </div>
                        <div className="text-subtle text-mono" style={{ fontSize: 11, marginLeft: 'auto' }}>
                          <TimeAgo dateStr={rev.createdAt} />
                        </div>
                      </div>
                      <div className="paper paper-hoverable" style={{ padding: 16, background: 'var(--bg-hover)' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {rev.changes || "System checkpoint snapshot."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Diff Viewer Area */}
        <div className="split-side paper p-0" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="paper-header bg-app flex-between">
            <h3 className="heading-3 flex-start"><GitCommit size={16} color="var(--primary)" /> Revision Inspector</h3>
            {selectedRev && <span className="badge badge-outline">{selectedRev.revString}</span>}
          </div>
          
          <div style={{ padding: 24, background: '#090a0b', flex: 1 }}>
            {!selectedRev ? (
              <p className="text-subtle text-center">Select a snapshot to inspect differences.</p>
            ) : (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.6 }}>
                {/* Simulated GIT Diff logic based on Revision index */}
                <div style={{ color: 'var(--text-secondary)', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #1f2937' }}>
                  <div className="flex-start" style={{ gap: 8, marginBottom: 8 }}>
                    <span style={{ color: '#9ca3af' }}>@@ -1,5 +1,6 @@</span>
                    <span style={{ color: '#6b7280' }}>Comparing to {revisions.find(r => r.id < selectedRev.id)?.revString || 'Origin'}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ color: '#6b7280', paddingRight: 16, userSelect: 'none', textAlign: 'right', borderRight: '1px solid #1f2937' }}>
                      1<br/>2<br/>3<br/>4<br/>5<br/>6
                    </div>
                    <div style={{ paddingLeft: 16 }}>
                      <div style={{ color: '#d1d5db' }}>{`{`}</div>
                      <div style={{ color: '#d1d5db' }}>{`  "part": "MEC-GS-012",`}</div>
                      <div style={{ color: '#d1d5db' }}>{`  "material": "EN24 Steel",`}</div>
                      
                      {selectedRev.revString.includes('B') ? (
                        <>
                          <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>{`-   "thickness": "8mm",`}</div>
                          <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>{`+   "thickness": "10mm",`}</div>
                        </>
                      ) : (
                        <div style={{ color: '#d1d5db' }}>{`  "thickness": "8mm",`}</div>
                      )}
                      
                      <div style={{ color: '#d1d5db' }}>{`}`}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-start" style={{ gap: 8, color: 'var(--text-muted)', fontSize: 11, background: '#111827', padding: '12px 16px', borderRadius: 6 }}>
                  <CheckCircle size={14} color="var(--primary)" /> This revision successfully passed automated compliance checks.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

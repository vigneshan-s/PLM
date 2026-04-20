import React, { useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Settings, MessageSquare, User, Paperclip, Lock } from 'lucide-react';
import { useAppStore, useAuthStore } from '../../store';

const priColor = { CRITICAL:'bg-red-100 text-red-700', HIGH:'bg-amber-100 text-amber-700', MEDIUM:'bg-blue-100 text-blue-700', LOW:'bg-slate-100 text-slate-700' };

export default function ECOApproval() {
  const { fetchKanban, kanbanData, updateKanbanStatus, isLoading } = useAppStore();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  const handleDragStart = (e, targetId, originCol) => {
    e.dataTransfer.setData('targetId', targetId);
  };

  const handleDrop = (e, newCol) => {
    const targetId = e.dataTransfer.getData('targetId');
    if (targetId) updateKanbanStatus(targetId, newCol);
  };

  const cols = kanbanData || { pending: [], review: [], approved: [], rejected: [] };

  return (
    <AppShell title="Change Workflows">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>ECO Approvals {!isAdmin && <Lock size={18} color="var(--warning)" />}</h1>
          <p className="text-subtle mt-1">{isAdmin ? 'Review Engineering Change Orders across the approval lifecycle.' : 'Read-only view of Engineering Change Orders.'}</p>
        </div>
        {isAdmin && <button className="btn btn-secondary"><Settings size={16} /> Board Config</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, minHeight: 600 }}>
        {['pending', 'review', 'approved', 'rejected'].map(k => (
          <div 
            key={k} 
            onDragOver={e => e.preventDefault()} 
            onDrop={e => handleDrop(e, k)}
            style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div className="flex-between mb-4">
              <span className="text-xs-caps" style={{ color: 'var(--text-secondary)' }}>{k.toUpperCase()} ({cols[k]?.length || 0})</span>
            </div>
            
            {(cols[k] || []).map(Card => (
              <div 
                key={Card.id} 
                draggable={isAdmin} 
                onDragStart={(e) => isAdmin && handleDragStart(e, Card.id, k)}
                className="paper paper-hoverable" style={{ padding: 16, cursor: isAdmin ? 'grab' : 'default', opacity: isAdmin ? 1 : 0.95 }}
              >
                <div className="flex-between mb-4">
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)' }}>{Card.id}</span>
                  <span className="badge badge-outline" style={{ border: 'none', background: Card.pri === 'CRITICAL' ? 'var(--danger-100)' : Card.pri ==='HIGH'?'var(--warning-100)':'var(--bg-hover)' }}>{Card.pri}</span>
                </div>
                <h4 className="heading-3">{Card.p}</h4>
                <div className="text-subtle text-mono" style={{ fontSize: 11, marginBottom: 8 }}>{Card.r}</div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{Card.msg}</p>

                <div className="mt-4 pt-4 flex-between" style={{ borderTop: '1px solid var(--border-light)' }}>
                  <div className="flex-start text-subtle" style={{ gap: 12 }}>
                    <div className="flex-start" style={{ gap: 4 }}><Paperclip size={12}/> {Math.floor(Math.random()*3)}</div>
                    <div className="flex-start" style={{ gap: 4 }}><MessageSquare size={12}/> 0</div>
                  </div>
                  <User size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
            
            {(!cols[k] || !cols[k].length) && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 12, border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                {isLoading ? 'Loading...' : (isAdmin ? 'Drop items here' : 'No items')}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

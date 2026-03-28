import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Rocket, ShieldCheck, CheckCircle, AlertOctagon, Lock, Download, Printer } from 'lucide-react';
import { useAppStore } from '../../store';
import { useNavigate } from 'react-router-dom';

export default function FinalRelease() {
  const [stamp, setStamp] = useState(false);
  const { kanbanData, fetchKanban, releasePart } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  // Dynamically select the first APPROVED ECN from the Kanban DB to release
  const readyEcn = kanbanData?.approved?.[0];

  const handleRelease = async () => {
    if (!readyEcn) return;
    const ok = await releasePart(readyEcn.id);
    if (ok) setStamp(true);
    else alert('Failed to release. Check server logs.');
  };

  if (!kanbanData) return <AppShell title="Final Release Center"><div className="p-8 text-center text-subtle">Loading Release Queue...</div></AppShell>;

  return (
    <AppShell title="Final Release Center">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-1">Production Release</h1>
          <p className="text-subtle">Final verification gateway before committing parts to manufacturing.</p>
        </div>
      </div>

      {!readyEcn ? (
        <div className="paper flex-center" style={{ minHeight: 400, flexDirection: 'column', textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: 16 }} />
          <h2 className="heading-2 text-subtle">No Pending Releases</h2>
          <p className="text-muted mt-2 max-w-sm">There are currently no Change Orders in the 'APPROVED' state ready for production lock.</p>
          <button className="btn btn-primary mt-6" onClick={() => navigate('/eco')}>Go to Approvals Board</button>
        </div>
      ) : (
        <div className="split-view">
          <div className="split-main paper">
            <div className="paper-header flex-between p-4" style={{ padding: '24px 32px' }}>
              <div>
                <span className="text-xs-caps text-subtle" style={{ color: 'var(--text-muted)' }}>Release Candidate</span>
                <h2 className="heading-1 mt-1">{readyEcn.p} <span className="badge badge-green">Rev {readyEcn.r}</span></h2>
                <p className="text-subtle mt-2">Active Approval Workflow {readyEcn.id}</p>
                <div className="text-mono mt-1" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{readyEcn.msg}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="text-xs-caps text-subtle" style={{ color: 'var(--text-muted)' }}>Status</span>
                <h2 className="heading-2 mt-1 flex-start" style={{ color: stamp ? 'var(--primary)' : 'var(--warning)' }}>
                  {stamp ? <CheckCircle size={20} /> : <AlertOctagon size={20} />} {stamp ? 'Released' : 'Pending Stamp'}
                </h2>
              </div>
            </div>

            <div style={{ padding: '32px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-3 mb-4 flex-start"><ShieldCheck size={18} color="var(--primary)" /> Gateway Approval Chain</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                {['Design Engineer', 'Quality Control', 'Manufacturing', 'Release Mgmt'].map((phase, i) => (
                  <div key={phase} className="paper" style={{ padding: 16, flex: 1, border: stamp || i < 3 ? '1px solid var(--primary-light)' : '1px dashed var(--border-strong)', background: stamp || i < 3 ? 'var(--primary-50)' : 'transparent' }}>
                    <div className="flex-between">
                      <span className="text-xs-caps text-subtle" style={{ color: stamp || i < 3 ? 'var(--primary-dark)' : '' }}>Phase 0{i+1}</span>
                      {stamp || i < 3 ? <CheckCircle size={14} color="var(--primary)" /> : <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border-strong)' }} />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 8, color: stamp || i < 3 ? 'var(--primary-dark)' : 'var(--text-secondary)' }}>{phase}</div>
                    <div className="text-mono" style={{ fontSize: 11, color: stamp || i < 3 ? 'var(--primary)' : 'var(--text-muted)', marginTop: 4 }}>
                      {stamp || i < 3 ? 'Verified' : 'Awaiting'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              <h3 className="heading-3 mb-4">Export Capabilities</h3>
              <div className="flex-start" style={{ gap: 12 }}>
                <button className="btn btn-secondary"><Download size={16} /> ISO Release Package (.ZIP)</button>
                <button className="btn btn-secondary"><Download size={16} /> Flat BOM (.CSV)</button>
                <button className="btn btn-secondary"><Printer size={16} /> Certificate of Conformance</button>
              </div>
            </div>
          </div>

          <div className="split-side paper p-0">
            <div className="paper-header flex-start">
              <Lock size={16} color="var(--warning)" />
              <h3 className="heading-3">Commit Actions</h3>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p className="text-subtle" style={{ lineHeight: 1.5 }}>
                Pushing <strong>{readyEcn.p}</strong> to Production will irrevocably lock it. Any further modifications will require a formal Engineering Change Order (ECO) spinning up a newer Revision.
              </p>
            </div>
            <div style={{ padding: 24, marginTop: 'auto', borderTop: '1px solid var(--border)', background: 'var(--bg-app)' }}>
              <button 
                className={`btn w-full mb-4 ${stamp ? 'bg-green-100 text-green-800' : 'btn-primary'}`} 
                style={{ background: stamp ? 'var(--primary-50)' : '', color: stamp ? 'var(--primary-dark)' : '', borderColor: stamp ? 'var(--primary-100)' : '' }}
                onClick={handleRelease}
                disabled={stamp}
              >
                <Rocket size={16} /> {stamp ? 'Successfully Released' : `Release ${readyEcn.id}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

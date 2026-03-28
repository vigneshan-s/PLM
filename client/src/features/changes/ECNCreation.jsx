import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { FileText, Link, GitBranch, ArrowRight, Activity, Plus, Loader } from 'lucide-react';
import { useAppStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ECNCreation() {
  const [pri, setPri] = useState('Medium');
  const [partId, setPartId] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { fetchPartsList, partsList, createChangeOrder } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartsList();
  }, [fetchPartsList]);

  const targetPart = partsList.find(p => p.id === parseInt(partId));

  const handleSubmit = async () => {
    if (!partId || !title || !desc) {
      toast.error('Please fill out all required fields.');
      return;
    }
    
    setSubmitting(true);
    const res = await createChangeOrder({ partId, title, description: desc, priority: pri });
    setSubmitting(false);

    if (res.success) {
      toast.success(`Generated ${res.data.ecnNumber} successfully.`);
      navigate('/eco'); // Redirect to Kanban board
    } else {
      toast.error(res.error || 'Failed to generate ECN.');
    }
  };

  return (
    <AppShell title="Engineering Change Notification">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-1">Raise Change Order (ECN)</h1>
          <p className="text-subtle">Initiate formal design changes integrated with root cause analysis.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button className="btn btn-secondary" onClick={() => navigate('/eco')}>Discard</button>
           <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
             {submitting ? <Loader className="animate-spin" size={16} /> : <ArrowRight size={16} />} 
             Submit to CCB
           </button>
        </div>
      </div>

      <div className="split-view">
        <div className="split-main paper pt-0" style={{ padding: 32, overflowY: 'auto' }}>
          
          <section className="mb-4 pt-4">
            <h3 className="heading-3 mb-4 flex-start" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
              <FileText size={16} color="var(--primary)" /> Definition
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="field-group">
                <label className="field-label">Target Component ID</label>
                <div style={{ position: 'relative' }}>
                  <select className="field-input text-mono" value={partId} onChange={e => setPartId(e.target.value)} style={{ paddingRight: 32, appearance: 'none' }}>
                    <option value="">-- Select a Part from Vault --</option>
                    {partsList.map(p => (
                      <option key={p.id} value={p.id}>{p.partNumber} - {p.name}</option>
                    ))}
                  </select>
                  <Link size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Current Revision</label>
                <input type="text" className="field-input bg-gray-50" readOnly value={targetPart ? `Rev ${targetPart.currentRev}` : '-'} />
              </div>
            </div>

            <div className="field-group mt-4">
              <label className="field-label">Title</label>
              <input type="text" className="field-input" placeholder="Short description of the change..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="field-group mt-4">
              <label className="field-label">Root Cause Justification</label>
              <textarea className="field-textarea" placeholder="Detailed analysis..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
          </section>

          <section className="mb-4">
            <h3 className="heading-3 mb-4 flex-start" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
              <Activity size={16} color="var(--primary)" /> Risk & Priority Configuration
            </h3>

            <div className="field-group">
              <label className="field-label">Impact Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {['Critical', 'High', 'Medium', 'Low'].map(level => {
                  const colors = { Critical: 'red', High: 'amber', Medium: 'blue', Low: 'emerald' };
                  const c = colors[level];
                  return (
                    <div 
                      key={level} 
                      className="paper paper-hoverable text-center cursor-pointer" 
                      style={{ padding: 12, border: pri === level ? `2px solid var(--${c === 'emerald' ? 'primary' : c === 'amber' ? 'warning' : 'danger'})` : '1px solid var(--border-strong)', background: pri === level ? `var(--${c === 'emerald' ? 'primary-50' : c === 'amber' ? 'warning-100' : 'danger-100'})` : '' }}
                      onClick={() => setPri(level)}
                    >
                      <span className="text-xs-caps" style={{ color: pri === level ? `var(--${c === 'emerald' ? 'primary-dark' : c === 'amber' ? 'warning' : 'danger'})` : 'var(--text-secondary)' }}>{level}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="split-side">
          <div className="paper mb-4" style={{ padding: 24, background: 'var(--bg-app)' }}>
             <span className="text-xs-caps text-subtle" style={{ color: 'var(--text-muted)' }}>Auto-Generated</span>
             <h2 className="heading-1 mt-1 font-mono text-primary-dark tracking-tight">ECN-PENDING</h2>
             <span className="badge badge-gray mt-2">Draft</span>
          </div>

          <div className="paper" style={{ padding: 24 }}>
             <h3 className="heading-3 mb-4 flex-start"><GitBranch size={16}/> Link Attachments</h3>
             <button className="btn btn-secondary w-full flex-start mb-4" style={{ borderStyle: 'dashed' }}>
               <Plus size={14} /> Attach Analysis Report
             </button>
             
             <div className="text-subtle p-3 rounded" style={{ background: 'var(--bg-hover)', borderLeft: '3px solid var(--primary)' }}>
               <strong>CCB Routing Tip</strong><br/>
               Critical priority changes will automatically require sign-off from Quality & Manufacturing leads before Release.
             </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import React, { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { User, Mail, Shield, AlertTriangle, Save, Loader } from 'lucide-react';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [dept, setDept] = useState(user?.department || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateProfile(name, dept);
    setLoading(false);
    
    if (res.success) toast.success('Profile updated successfully!');
    else toast.error('Failed to update profile: ' + res.error);
  };

  return (
    <AppShell title="My Profile">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <User size={28} color="var(--primary)" /> User Identity
          </h1>
          <p className="text-subtle mt-1">Manage your enterprise engineering profile and display badge.</p>
        </div>
      </div>

      <div className="split-view">
        <div className="split-main paper p-0" style={{ maxWidth: 640 }}>
          <form onSubmit={handleSave} style={{ padding: 32 }}>
            <h3 className="heading-3 mb-6">Personal Details</h3>
            
            <div className="field-group">
              <label className="field-label">Full Legal Name</label>
              <input type="text" className="field-input w-full" value={name} onChange={e=>setName(e.target.value)} required />
            </div>

            <div className="field-group">
              <label className="field-label">Department / Title</label>
              <input type="text" className="field-input w-full" value={dept} onChange={e=>setDept(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label" style={{ opacity: 0.5 }}>Enterprise Email (Read Only)</label>
              <input type="text" className="field-input w-full text-subtle" value={user?.email || ''} readOnly disabled />
              <p className="mt-2 text-subtle" style={{ fontSize: 11 }}><AlertTriangle size={12} color="var(--warning)" style={{ display: 'inline', verticalAlign: '-2px' }}/> SSO synchronized fields cannot be modified here.</p>
            </div>

            <div className="flex-start gap-4 mt-8 pt-6 border-t border-gray-800" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: 8 }}>
                {loading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="split-side">
          <div className="paper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 40 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 36, fontWeight: 700, marginBottom: 20 }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h2 className="heading-2">{user?.name}</h2>
            <div className="flex-center text-subtle text-mono mt-2" style={{ fontSize: 13, gap: 8 }}>
              <Mail size={14} /> {user?.email}
            </div>
            
            <div className="mt-6">
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-amber' : 'badge-green'}`} style={{ padding: '6px 12px', fontSize: 12 }}>
                <Shield size={14} /> {user?.role} CLEARANCE
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

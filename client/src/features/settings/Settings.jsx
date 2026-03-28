import React from 'react';
import AppShell from '../../components/layout/AppShell';
import { Settings, Wrench, Shield, Server, Lock, Bell } from 'lucide-react';
import { useAuthStore } from '../../store';

export default function SystemSettings() {
  const user = useAuthStore(s => s.user);

  return (
    <AppShell title="System Preferences">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <Settings size={28} color="var(--primary)" /> Workspace Configuration
          </h1>
          <p className="text-subtle mt-1">Global settings for the SmartPLM deployment instance.</p>
        </div>
      </div>

      <div style={{ maxWidth: 800 }}>
        <h3 className="heading-3 mb-6 flex-start" style={{ gap: 8 }}><Wrench size={18} color="var(--primary)" /> Engineering Preferences</h3>
        
        <div className="paper mb-8" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="flex-between">
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Part Number Generation</h4>
              <p className="text-subtle" style={{ fontSize: 12 }}>Automatically assign hierarchical IDs like `MEC-XX-001` vs freeform.</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked disabled={user?.role !== 'ADMIN'} />
              <span className="slider round"></span>
            </label>
          </div>
          
          <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Require ECN for Drafts</h4>
              <p className="text-subtle" style={{ fontSize: 12 }}>Lock draft parts from being modified without a formal tracking order.</p>
            </div>
            <label className="switch">
              <input type="checkbox" disabled={user?.role !== 'ADMIN'} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <h3 className="heading-3 mb-6 flex-start" style={{ gap: 8 }}><Server size={18} color="var(--warning)" /> Infrastructure (Admin Only)</h3>
        
        <div className="paper mb-8" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="flex-between">
            <div className="flex-start" style={{ gap: 12 }}>
              <Lock size={20} color="var(--text-secondary)" />
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Strict JWT Validation</h4>
                <p className="text-subtle" style={{ fontSize: 12 }}>Enforce 15-minute token expiry & IP lock.</p>
              </div>
            </div>
            <button className="btn btn-secondary text-subtle" disabled={user?.role !== 'ADMIN'}>Configure</button>
          </div>
          
          <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div className="flex-start" style={{ gap: 12 }}>
              <Bell size={20} color="var(--text-secondary)" />
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>SMTP Email Webhooks</h4>
                <p className="text-subtle" style={{ fontSize: 12 }}>Route ECO approval notifications to company Microsoft Teams / Slack.</p>
              </div>
            </div>
            <button className="btn btn-secondary text-subtle" disabled={user?.role !== 'ADMIN'}>Configure</button>
          </div>
        </div>

        {user?.role !== 'ADMIN' && (
          <div className="badge badge-amber flex-center" style={{ padding: '12px', fontSize: 12 }}>
            You must be an Administrator to alter these system configurations.
          </div>
        )}
      </div>
    </AppShell>
  );
}

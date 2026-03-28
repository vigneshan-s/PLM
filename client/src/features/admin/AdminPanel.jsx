import React, { useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Shield, Users, Database, LayoutGrid, Key, Settings, AlertTriangle, UserCheck, HardDrive } from 'lucide-react';
import { useAppStore, useAuthStore } from '../../store';
import { Navigate } from 'react-router-dom';

function StatCard({ title, val, icon: Icon, color }) {
  return (
    <div className={`paper border-l-4 p-4`} style={{ borderLeftColor: color, padding: 20 }}>
      <div className="flex-between">
        <div>
          <span className="text-subtle text-xs-caps block mb-2">{title}</span>
          <h2 className="heading-1" style={{ fontSize: 28, lineHeight: 1 }}>{val}</h2>
        </div>
        <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 12 }}>
          <Icon size={24} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const user = useAuthStore(s => s.user);
  const { fetchAdminData, adminData, isLoading } = useAppStore();

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (user?.role !== 'ADMIN') {
    return (
      <AppShell title="Restricted Area">
        <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Shield size={64} color="var(--danger)" style={{ marginBottom: 24, opacity: 0.2 }} />
          <h2 className="heading-1" style={{ color: 'var(--danger-light)' }}>Access Denied</h2>
          <p className="text-subtle mt-4">You do not have System Administrator privileges.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin Console">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="heading-1 flex-start" style={{ gap: 12 }}>
            <Settings size={28} color="var(--primary)" /> System Administration
          </h1>
          <p className="text-subtle mt-1">Manage platform users, API keys, and server infrastructure.</p>
        </div>
        <button className="btn btn-primary"><UserCheck size={16} /> Invite User</button>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-subtle">Querying Administration Metrics...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
            <StatCard title="Total Users" val={adminData?.system?.users || 0} icon={Users} color="#3b82f6" />
            <StatCard title="Parts Managed" val={adminData?.system?.parts || 0} icon={LayoutGrid} color="#10b981" />
            <StatCard title="Active ECNs" val={adminData?.system?.ecns || 0} icon={AlertTriangle} color="#f59e0b" />
            <StatCard title="DB Storage" val="4.2 GB" icon={Database} color="#8b5cf6" />
          </div>

          <div className="paper p-0">
            <div className="paper-header flex-between">
              <h3 className="heading-3">Access Management</h3>
              <div className="flex-start gap-4">
                <span className="badge badge-green"><HardDrive size={12}/> DB Synced</span>
                <span className="text-subtle text-mono" style={{ fontSize: 11 }}>Active Directory integration disabled</span>
              </div>
            </div>
            
            <div className="data-table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Engineer Name</th>
                    <th>Email / SSO ID</th>
                    <th>Role Group</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData?.users?.map(u => (
                    <tr key={u.id} className="data-table-row-hoverable">
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td className="text-mono text-subtle">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-amber' : 'badge-outline'}`}>
                          {u.role === 'ADMIN' ? <Key size={12} /> : null} {u.role}
                        </span>
                      </td>
                      <td>{u.department || '-'}</td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 11 }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                  {!adminData?.users?.length && <tr><td colSpan={6} className="text-center p-4">No users found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </AppShell>
  );
}

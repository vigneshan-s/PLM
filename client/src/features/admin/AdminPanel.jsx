import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { Shield, Users, Database, LayoutGrid, Key, Settings, AlertTriangle, UserCheck, HardDrive, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore, useAuthStore } from '../../store';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
  const { fetchAdminData, adminData, fetchKanban, kanbanData, updateKanbanStatus, releasePart, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchAdminData();
    fetchKanban();
  }, [fetchAdminData, fetchKanban]);

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

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} style={activeTab === 'users' ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}} onClick={() => setActiveTab('users')}>Access Management</button>
            <button className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`} style={activeTab === 'approvals' ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}} onClick={() => setActiveTab('approvals')}>ECN Approvals Queue</button>
          </div>

          {activeTab === 'users' ? (
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
          ) : (
          <div className="paper p-0">
            <div className="paper-header flex-between">
              <h3 className="heading-3">Pending ECN Approvals</h3>
              <span className="badge badge-amber">{((kanbanData?.pending?.length || 0) + (kanbanData?.review?.length || 0))} Awaiting Action</span>
            </div>
            <div className="data-table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ECN Number</th>
                    <th>Target Part</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(kanbanData?.pending || []), ...(kanbanData?.review || [])].map(ecn => (
                    <tr key={ecn.id} className="data-table-row-hoverable">
                      <td style={{ fontWeight: 600 }} className="text-primary-dark">{ecn.id}</td>
                      <td className="text-mono">{ecn.p} <span className="text-subtle ml-1">({ecn.r})</span></td>
                      <td>
                        <span className="badge badge-outline" style={{ background: ecn.pri === 'CRITICAL' ? 'var(--danger-100)' : ecn.pri === 'HIGH' ? 'var(--warning-100)' : 'var(--bg-hover)', border: 'none' }}>
                          {ecn.pri}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-amber">
                          {kanbanData?.pending?.find(x=>x.id===ecn.id) ? 'PENDING' : 'REVIEW'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-subtle">{ecn.msg}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex-end" style={{ gap: 8 }}>
                          <button 
                            className="icon-btn text-success cursor-pointer" 
                            title="Approve" 
                            onClick={async () => {
                              const tId = toast.loading('Approving change order...');
                              await updateKanbanStatus(ecn.id, 'approved');
                              await releasePart(ecn.id);
                              toast.success(`${ecn.id} Approved & Released!`, { id: tId });
                            }}
                          >
                            <CheckCircle size={18} color="var(--success)" />
                          </button>
                          
                          <button 
                            className="icon-btn text-danger cursor-pointer" 
                            title="Reject" 
                            onClick={async () => {
                              const tId = toast.loading('Rejecting change order...');
                              await updateKanbanStatus(ecn.id, 'rejected');
                              toast.error(`${ecn.id} Rejected.`, { id: tId });
                            }}
                          >
                            <XCircle size={18} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!((kanbanData?.pending?.length || 0) + (kanbanData?.review?.length || 0)) && (
                    <tr><td colSpan={6} className="text-center p-8 text-subtle">No ECNs require your approval at this time.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      )}

    </AppShell>
  );
}

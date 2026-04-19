import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { Package, GitBranch, ShieldAlert, Zap, TrendingUp, MoreHorizontal, MousePointerClick, TrendingDown } from 'lucide-react';
import { useAppStore, useAuthStore } from '../../store';

function TimeAgo({ dateStr }) {
  const diffHours = Math.floor((new Date() - new Date(dateStr)) / 3600000);
  if (diffHours < 1) return <span>Just now</span>;
  if (diffHours < 24) return <span>{diffHours} hrs ago</span>;
  return <span>{Math.floor(diffHours/24)} days ago</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const { fetchDashboardData, dashboard, isLoading } = useAppStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const KPIS = [
    { k: 'My Parts', v: dashboard.kpis?.myParts || 0, change: '+12%', i: Package, c: 'badge-green', tc: 'var(--primary)' },
    { k: 'Pending Approvals', v: dashboard.kpis?.pendingApprovals || 0, change: '-3%', i: ShieldAlert, c: 'badge-amber', tc: 'var(--warning)' },
    { k: 'Active Changes', v: dashboard.kpis?.activeChanges || 0, change: '+2', i: GitBranch, c: 'badge-blue', tc: 'var(--accent)' },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="page-header">
        <div>
          <h1>Good morning, {user?.name.split(' ')[0]} ✨</h1>
          <p>Here’s what’s happening in your engineering workspace today.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/files')}><MousePointerClick size={14} /> Quick Create</button>
          <button className="btn btn-primary" onClick={() => navigate('/ecn')}><Zap size={14} /> Raise Change Order</button>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {KPIS.map((kpi, idx) => (
          <div key={idx} className="paper paper-hoverable" style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                {kpi.k}
              </span>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `var(${kpi.tc.match(/--.*?/)[0]}-50)`, color: kpi.tc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.i size={18} />
              </div>
            </div>
            <div className="flex-start" style={{ alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {isLoading ? <span style={{ opacity: 0.2 }}>...</span> : kpi.v}
              </span>
              <span className={`badge ${kpi.c}`} style={{ fontSize: 12 }}><TrendingUp size={12} /> {kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Recents Widget */}
        <div className="paper" style={{ flex: 2 }}>
          <div className="paper-header">
            <h3 className="heading-3">Recently Accessed Parts</h3>
            <button className="icon-btn" style={{ border: 'none', background: 'transparent' }}><MoreHorizontal size={16} /></button>
          </div>
          <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Database...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ background: 'transparent' }}>Part Number</th>
                    <th style={{ background: 'transparent' }}>Description</th>
                    <th style={{ background: 'transparent' }}>Rev</th>
                    <th style={{ background: 'transparent' }}>Status</th>
                    <th style={{ background: 'transparent' }}>Last Accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recents?.map((b) => (
                    <tr key={b.id}>
                      <td><strong className="text-mono">{b.partNumber}</strong></td>
                      <td style={{ fontWeight: 500 }}>{b.name}</td>
                      <td><span className="badge badge-outline">{b.currentRev}</span></td>
                      <td><span className={`badge ${b.status === 'RELEASED' ? 'badge-green' : b.status === 'REVIEW' ? 'badge-amber' : 'badge-gray'}`}>{b.status}</span></td>
                      <td className="text-subtle"><TimeAgo dateStr={b.updatedAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Activity Stream */}
        <div className="paper" style={{ flex: 1 }}>
          <div className="paper-header">
            <h3 className="heading-3">Telemetry Activity</h3>
          </div>
          <div className="paper-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isLoading && <p className="text-subtle text-center py-4">Loading Logs...</p>}
            {dashboard.activity?.map((feed, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-strong)', marginTop: 6 }} />
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    <strong>{feed.user.name === user?.name ? 'You' : feed.user.name}</strong> {feed.action}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}><TimeAgo dateStr={feed.createdAt} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, Package, Folder, LayoutDashboard, GitBranch, Activity, Shield, User } from 'lucide-react';
import { useAuthStore } from '../../store';

const MENU = [
  { group: 'Core', items: [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Assembly Viewer', to: '/assembly', icon: Package },
    { name: 'Files & Assets', to: '/files', icon: Folder },
  ]},
  { group: 'Workflow', items: [
    { name: 'Revisions', to: '/revision', icon: GitBranch },
    { name: 'Change Orders', to: '/ecn', icon: Settings, badge: '2' },
    { name: 'Approvals', to: '/eco', icon: Shield },
    { name: 'Release Center', to: '/release', icon: Package },
  ]},
  { group: 'Intelligence', items: [
    { name: 'Impact Graph', to: '/impact', icon: Activity },
  ]},
  { group: 'System', items: [
    { name: 'Admin Console', to: '/admin', icon: Shield },
    { name: 'Preferences', to: '/settings', icon: Settings },
  ]}
];

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand-zone" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon">S</div>
        <div className="brand-name">SmartPLM Lite</div>
      </div>
      <nav className="sidebar-nav">
        {MENU.map((g) => {
          // Hide System Configs if not Admin
          if (g.group === 'System' && user?.role !== 'ADMIN') {
            return null;
          }
          return (
            <div key={g.group} className="nav-group">
              <div className="nav-label">{g.group}</div>
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                  <i.icon size={16} /> {i.name}
                  {i.badge && <span className="nav-badge">{i.badge}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="user-zone" onClick={() => navigate('/profile')}>
        <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
        <div className="user-info">
          <h4>{user?.name || 'Engineer'}</h4>
          <p>{user?.department || 'User'}</p>
        </div>
        <button className="icon-btn" onClick={handleLogout} style={{ marginLeft: 'auto', padding: 4 }} title="Logout">
          <LogOut size={16} color="var(--danger)" />
        </button>
      </div>
    </aside>
  );
}

export function Header({ title }) {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  return (
    <header className="topbar">
      <div className="breadcrumb-trail">
        <span>SmartPLM</span> <span style={{color: 'var(--border-strong)'}}>/</span> <strong>{title}</strong>
      </div>
      <div className="search-bar">
        <Search className="search-icon" />
        <input type="text" placeholder="Search components, documents or ECNs..." />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="indicator" />
        </button>
        <button className="icon-btn" title="Settings" onClick={() => navigate('/settings')}><Settings size={18} /></button>
        <button className="icon-btn" title="Profile" onClick={() => navigate('/profile')} style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 32, height: 32, padding: 0 }}>
          {user?.name?.charAt(0) || <User size={16} />}
        </button>
      </div>
    </header>
  );
}

export default function AppShell({ children, title }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-canvas">
        <Header title={title} />
        <main className="page-container animate-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

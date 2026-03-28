import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, ArrowRight, Cog, HardDrive, BarChart, Lock, AlertTriangle, UserPlus, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const register = useAuthStore(s => s.register);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    
    let res;
    if (mode === 'login') {
      res = await login(email, password);
    } else {
      res = await register(name, email, password, role);
    }

    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErr(res.error || 'Connection failed. Verify your database and server.');
    }
  };

  return (
    <div className="login-split">
      <div className="login-art">
        <div className="login-art-content animate-enter">
          <div className="login-icon-box">S</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>SmartPLM</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 500, maxWidth: 300 }}>
            Next-generation Product Lifecycle Management for modern hardware teams.
          </p>

          <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'left', width: 320 }}>
            {[
              { i: Cog, t: 'Intelligent BOM Management', d: 'AI-assisted part resolution and recursive CAD tree visualization.' },
              { i: BarChart, t: 'Predictive Impact Analysis', d: 'See supply chain ripple effects before approving changes.' },
              { i: HardDrive, t: 'Cloud-Native PDM', d: 'Securely check-in/out massive CAD assemblies in seconds.' },
              { i: Lock, t: 'Enterprise Access Control', d: 'Strict role-based permissions and ISO-compliant audit logs.' },
            ].map((Feature, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                  <Feature.i size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{Feature.t}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{Feature.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-form-area">
        <div className="login-form-box">
          
          <div className="role-toggle-group" style={{ marginBottom: 40, background: 'var(--bg-app)', border: '1px solid var(--border)' }}>
            <button className={`role-toggle-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')} type="button" style={{ color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <LogIn size={16} /> Sign In
            </button>
            <button className={`role-toggle-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')} type="button" style={{ color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <UserPlus size={16} /> Create Account
            </button>
          </div>

          <h2 className="heading-1" style={{ marginBottom: 8 }}>
            {mode === 'login' ? 'Welcome back' : 'Join your workspace'}
          </h2>
          <p className="text-subtle" style={{ marginBottom: 32 }}>
            {mode === 'login' ? 'Enter your credentials to access your PLM vault.' : 'Register a new engineering or admin profile.'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input type="text" className="field-input" placeholder="e.g. Maya Patel" value={name} onChange={e=>setName(e.target.value)} required={mode==='register'} />
                </div>
              </>
            )}

            <div className="field-group">
              <label className="field-label">Work Email</label>
              <input type="email" className="field-input" placeholder="name@smartplm.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            
            <div className="field-group">
              <div className="flex-between">
                <label className="field-label" style={{ margin: 0 }}>Password</label>
                {mode === 'login' && <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Forgot?</span>}
              </div>
              <input type="password" className="field-input mt-4" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>

            {err && (
              <div className="badge badge-red mb-4 mt-2 p-2 w-full text-center flex-center" style={{ padding: '8px 12px', width: '100%', justifyContent: 'center', gap: 8 }}>
                <AlertTriangle size={14} /> <span style={{ textAlign: 'left', lineHeight: 1.4 }}>{err}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" style={{ padding: 12, fontSize: 14, marginTop: 12 }} disabled={loading}>
              {loading ? 'Processing...' : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
          
          

        </div>
      </div>
    </div>
  );
}

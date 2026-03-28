import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Configure Axios with Credentials to send JWT Cookies
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true,
});

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      login: async (email, password) => {
        try {
          const res = await api.post('/auth/login', { email, password });
          set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || error.message };
        }
      },

      register: async (name, email, password, role) => {
        try {
          const res = await api.post('/auth/register', { name, email, password, role });
          set({ user: res.data.user, token: res.data.token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || error.message };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false, token: null });
        }
      },

      updateProfile: async (name, department) => {
        try {
          const res = await api.put('/auth/profile', { name, department });
          set({ user: res.data.user });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || error.message };
        }
      }
    }),
    { name: 'smartplm-auth' }
  )
);

export const useAppStore = create((set) => ({
  dashboard: { kpis: null, recents: [], activity: [] },
  partGraph: null,
  kanbanData: null,
  files: [],
  partsList: [],
  revisions: [],
  impactData: { part: null, insights: [] },
  adminData: { users: [], system: null },
  isLoading: false,
  error: null,

  fetchPartsList: async () => {
    try {
      const res = await api.get('/parts');
      set({ partsList: res.data });
    } catch (e) { console.error(e); }
  },

  createChangeOrder: async (payload) => {
    try {
      const res = await api.post('/changes', payload);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.response?.data?.error || e.message };
    }
  },

  fetchDashboardData: async () => {
    set({ isLoading: true });
    try {
      const [kpis, recents, activity] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/recents'),
        api.get('/dashboard/activity')
      ]);
      set({
        dashboard: { kpis: kpis.data, recents: recents.data, activity: activity.data },
        isLoading: false, error: null
      });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  },

  fetchBomTree: async (partId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/parts/${partId}/bom`);
      set({ partGraph: res.data, isLoading: false });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  },

  fetchKanban: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/changes/kanban');
      set({ kanbanData: res.data, isLoading: false, error: null });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  },

  updateKanbanStatus: async (ecnId, newStatus) => {
    try {
      await api.put(`/changes/${ecnId}/status`, { status: newStatus });
      // Re-fetch to update state cleanly
      const res = await api.get('/changes/kanban');
      set({ kanbanData: res.data });
    } catch (e) { console.error('Kanban Update Failed', e); }
  },
  
  releasePart: async (ecnId) => {
    try {
      await api.post(`/changes/${ecnId}/release`);
      return true;
    } catch (e) { console.error(e); return false; }
  },

  fetchFiles: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/files');
      set({ files: res.data, isLoading: false });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  },

  uploadFile: async (formData) => {
    try {
      await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Fetch files immediately after completing upload to sync table
      const res = await api.get('/files');
      set({ files: res.data });
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.response?.data?.error || e.message };
    }
  },

  fetchRevisions: async (partId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/parts/${partId}/history`);
      set({ revisions: res.data, isLoading: false });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  },

  fetchImpactGraph: async (partId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/impact/${partId}`);
      set({ impactData: res.data, isLoading: false });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  },

  fetchAdminData: async () => {
    set({ isLoading: true });
    try {
      const [usersRes, systemRes] = await Promise.all([
        api.get('/admin/users'), api.get('/admin/system')
      ]);
      set({ adminData: { users: usersRes.data, system: systemRes.data }, isLoading: false });
    } catch (e) { set({ isLoading: false, error: e.message }); }
  }
}));

export { api };

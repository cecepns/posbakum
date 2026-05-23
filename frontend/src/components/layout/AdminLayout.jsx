import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, BookOpen, FileText, Building2,
  BarChart3, Bell, Menu, X, LogOut, Scale, Users, Layers, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';

const sidebarLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/tickets', icon: Ticket, label: 'Manajemen Tiket' },
  { to: '/admin/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/admin/layanan', icon: Layers, label: 'Jenis Layanan' },
  { to: '/admin/documents', icon: FileText, label: 'Permohonan Dokumen' },
  { to: '/admin/obh', icon: Building2, label: 'Direktori OBH' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/users', icon: Users, label: 'Pengguna' },
  { to: '/admin/settings', icon: Settings, label: 'Pengaturan Kontak' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { user, logout, isStaff, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isStaff) return;
    api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params: { unread_only: 'true', limit: 1 } })
      .then((res) => setUnread(res.data.unread_count || 0))
      .catch(() => {});
  }, [isStaff, location.pathname]);

  if (loading) return null;
  if (!user || !isStaff) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-primary-900 text-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 border-b border-primary-800 px-5 py-4">
          <Scale className="h-7 w-7 text-gold-400" />
          <div>
            <p className="font-bold">SAMBAT Admin</p>
            <p className="text-[10px] text-primary-300">Posbakum Panel</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-3">
          {sidebarLinks.filter((link) => link.to !== '/admin/settings' || isAdmin).map(({ to, icon: Icon, label, end }) => (
            <Link key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-800'}`}>
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-primary-800 p-3">
          <p className="truncate px-3 text-xs text-primary-400">{user.name}</p>
          <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-200 hover:bg-primary-800">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
          <h1 className="text-lg font-semibold text-slate-800">Panel Admin Posbakum</h1>
          <Link to="/admin/notifications" className="relative rounded-lg p-2 hover:bg-slate-100">
            <Bell size={20} />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

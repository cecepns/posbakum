import { Link, Outlet, useLocation } from 'react-router-dom';
import { Scale, Menu, X, User, LogOut, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/layanan', label: 'Layanan' },
  { to: '/konsultasi', label: 'Konsultasi' },
  { to: '/tracking', label: 'Lacak Tiket' },
  { to: '/obh', label: 'Direktori OBH' },
  { to: '/faq', label: 'FAQ' },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { user, logout, isStaff } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params: { unread_only: 'true', limit: 1 } })
      .then((res) => setUnread(res.data.unread_count || 0))
      .catch(() => setUnread(0));
  }, [user, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-primary-800 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-gold-400" />
            <div>
              <span className="text-lg font-bold leading-tight">SAMBAT</span>
              <span className="block text-[10px] text-primary-200">Posbakum Online</span>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to}
                className={`rounded-lg px-3 py-2 text-sm transition ${location.pathname === l.to ? 'bg-primary-700' : 'hover:bg-primary-700/50'}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {isStaff && <Link to="/admin" className="btn-header-outline !text-xs !py-1.5 !px-3">Admin</Link>}
                <Link to="/dashboard/notifications" className="relative rounded-lg p-2 hover:bg-primary-700" title="Notifikasi">
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <Link to="/dashboard" className="flex items-center gap-1 rounded-lg bg-primary-700 px-3 py-2 text-sm hover:bg-primary-600">
                  <User size={16} /> {user.name?.split(' ')[0]}
                </Link>
                <button onClick={logout} className="rounded-lg p-2 hover:bg-primary-700"><LogOut size={18} /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm hover:bg-primary-700">Masuk</Link>
                <Link to="/register" className="rounded-lg bg-gold-500 px-3 py-2 text-sm font-medium text-primary-900 hover:bg-gold-400">Daftar</Link>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-primary-700 px-4 py-3 md:hidden">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-primary-700">{l.label}</Link>
            ))}
            <div className="mt-2 border-t border-primary-700 pt-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm">Dashboard Saya</Link>
                  <Link to="/dashboard/notifications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm">
                    Notifikasi{unread > 0 ? ` (${unread})` : ''}
                  </Link>
                  {isStaff && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm">Admin Panel</Link>}
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-sm">Keluar</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm">Masuk</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gold-400">Daftar</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-primary-900 py-8 text-primary-100">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm">
          <p className="font-semibold text-white">SAMBAT - Sahabat Masyarakat Dalam Bantuan Hukum Terpercaya</p>
          <p className="mt-2 text-primary-200">Posbakum Online Pengadilan Negeri</p>
          <p className="mt-1 text-xs text-primary-300">© {new Date().getFullYear()} Posbakum. Layanan bantuan hukum gratis.</p>
        </div>
      </footer>
    </div>
  );
}

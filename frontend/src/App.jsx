import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';

import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';
import RegisterPage from '@/pages/public/RegisterPage';
import LayananPage from '@/pages/public/LayananPage';
import KonsultasiPage from '@/pages/public/KonsultasiPage';
import TrackingPage from '@/pages/public/TrackingPage';
import OBHPage from '@/pages/public/OBHPage';
import FAQPage from '@/pages/public/FAQPage';
import DokumenPage from '@/pages/public/DokumenPage';

import DashboardPage from '@/pages/citizen/DashboardPage';
import TicketDetailPage from '@/pages/citizen/TicketDetailPage';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTicketsPage from '@/pages/admin/AdminTicketsPage';
import AdminTicketDetailPage from '@/pages/admin/AdminTicketDetailPage';
import AdminKnowledgeBasePage from '@/pages/admin/AdminKnowledgeBasePage';
import AdminDocumentsPage from '@/pages/admin/AdminDocumentsPage';
import AdminOBHPage from '@/pages/admin/AdminOBHPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminLayananPage from '@/pages/admin/AdminLayananPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/layanan" element={<LayananPage />} />
            <Route path="/konsultasi" element={<KonsultasiPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/obh" element={<OBHPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/dokumen" element={<DokumenPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/tickets/:id" element={<TicketDetailPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tickets" element={<AdminTicketsPage />} />
            <Route path="tickets/:id" element={<AdminTicketDetailPage />} />
            <Route path="knowledge-base" element={<AdminKnowledgeBasePage />} />
            <Route path="layanan" element={<AdminLayananPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="documents" element={<AdminDocumentsPage />} />
            <Route path="obh" element={<AdminOBHPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

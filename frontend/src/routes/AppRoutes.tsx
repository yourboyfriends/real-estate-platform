import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { HomePage } from '../pages/HomePages';
import { RegisterPage } from '../pages/RegisterPage';
import { PropertiesPage } from '../pages/PropertiesPage';
import { PropertyDetailPage } from '../pages/PropertyDetailPage';
import { PropertyCreatePage } from '../pages/PropertyCreatePage';
import { MyPropertiesPage } from '../pages/MyPropertiesPage';
import { PropertyModerationPage } from '../pages/PropertyModerationPage';
import { BlogPage } from '../pages/BlogPage';
import { BlogDetailPage } from '../pages/BlogDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { MessagesPage } from '../pages/MessagesPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';

// Layout wrapper for main site (with Header + Footer)
const SiteLayout: React.FC = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin panel — full screen, own layout (no Header/Footer) */}
        <Route path="/admin/*" element={<AdminDashboardPage />} />

        {/* Legacy admin moderation standalone page */}
        <Route path="/admin/properties/pending" element={<PropertyModerationPage />} />

        {/* Main site with Header + Footer */}
        <Route element={<SiteLayout />}>
          <Route path="/"                     element={<HomePage />} />
          <Route path="/login"                element={<LoginPage />} />
          <Route path="/register"             element={<RegisterPage />} />
          <Route path="/properties"           element={<PropertiesPage />} />
          <Route path="/properties/create"    element={<PropertyCreatePage />} />
          <Route path="/properties/:id"       element={<PropertyDetailPage />} />
          <Route path="/my-properties"        element={<MyPropertiesPage />} />
          <Route path="/blog"                 element={<BlogPage />} />
          <Route path="/blog/:slug"           element={<BlogDetailPage />} />
          <Route path="/profile"              element={<ProfilePage />} />
          <Route path="/notifications"        element={<NotificationsPage />} />
          <Route path="/messages"             element={<MessagesPage />} />
          <Route path="/appointments"         element={<AppointmentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { HomePage } from '../pages/HomePages';
import { RegisterPage } from '../pages/RegisterPage';
import { PropertiesPage } from '../pages/PropertiesPage';
import { PropertyDetailPage } from '../pages/PropertyDetailPage';
import { PropertyCreatePage } from '../pages/PropertyCreatePage';
import { MyPropertiesPage } from '../pages/MyPropertiesPage';
import { AdminPendingPropertiesPage } from '../pages/AdminPendingPropertiesPage';
import { BlogPage } from '../pages/BlogPage';
import { BlogDetailPage } from '../pages/BlogDetailPage';
import { LoginPage } from '@/pages/Loginpage';


export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/create" element={<PropertyCreatePage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/my-properties" element={<MyPropertiesPage />} />
            <Route path="/admin/properties/pending" element={<AdminPendingPropertiesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};
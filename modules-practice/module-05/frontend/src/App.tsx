import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/Layout';
import Home from '@/pages/Home';
import FundDetail from '@/pages/FundDetail';
import Analysis from '@/pages/Analysis';
import History from '@/pages/History';

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fund/:fundCode" element={<FundDetail />} />
          <Route path="/analysis/:fundCode" element={<Analysis />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default AppRoutes;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AgencyLayout } from './components/AgencyLayout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Projects } from './pages/Projects';
import { Deliverables } from './pages/Deliverables';
import { Proposals } from './pages/Proposals';
import { Invoices } from './pages/Invoices';
import { Documents } from './pages/Documents';
import { ClientPortal } from './pages/ClientPortal';
import { PublicProposal } from './pages/PublicProposal';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/proposal/:token" element={<PublicProposal />} />

        {/* Client Portal Dedicated View */}
        <Route path="/portal" element={<ClientPortal />} />

        {/* Agency Team Authenticated Workspace */}
        <Route path="/app" element={<AgencyLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="projects" element={<Projects />} />
          <Route path="deliverables" element={<Deliverables />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="documents" element={<Documents />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

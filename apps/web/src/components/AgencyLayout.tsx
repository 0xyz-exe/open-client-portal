import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { getAuthToken, getStoredUser, apiRequest } from '../lib/api';

export const AgencyLayout: React.FC = () => {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('Vortex Creative Agency');

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.global_role === 'client') {
      navigate('/portal');
      return;
    }

    apiRequest<any[]>('/auth/organizations')
      .then(orgs => {
        if (orgs && orgs.length > 0) {
          setOrgName(orgs[0].name);
        }
      })
      .catch(() => {});
  }, [navigate]);

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-100 overflow-hidden">
      <Sidebar currentOrgName={orgName} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet context={{ orgName }} />
      </div>
    </div>
  );
};

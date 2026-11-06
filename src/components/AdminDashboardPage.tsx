import React from 'react';
import { Outlet } from 'react-router-dom';

export const AdminDashboardPage: React.FC<{
  theme: any;
  setTheme: any;
  onNavigateHome: () => void;
  currentUniversity: any;
}> = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Welcome to the unified Admin CMS.</p>
      {/* Existing modules will be integrated here */}
      <Outlet />
    </div>
  );
};

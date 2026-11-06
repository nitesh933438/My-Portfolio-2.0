import React from 'react';
import { AdminOverview } from './admin/AdminOverview';

export const AdminDashboardPage: React.FC<{
  theme: any;
  setTheme: any;
  onNavigateHome: () => void;
  currentUniversity: any;
}> = () => {
  return <AdminOverview />;
};

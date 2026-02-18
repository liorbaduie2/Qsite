//app\admin\page.tsx
"use client";

import { AdminRoute } from '../components/AuthProvider';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
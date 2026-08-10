import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

import '../../admin.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <div className="admin-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-area">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className="content-area">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

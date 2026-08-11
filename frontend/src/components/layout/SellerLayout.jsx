import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { FiGrid, FiPackage, FiShoppingBag, FiDollarSign, FiMenu, FiX } from 'react-icons/fi';

const navItems = [
  { path: '/seller/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/seller/products', label: 'My Products', icon: FiPackage },
  { path: '/seller/orders', label: 'Orders', icon: FiShoppingBag },
  { path: '/seller/earnings', label: 'Earnings', icon: FiDollarSign },
];

const SellerLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <button
        className="btn btn-dark d-lg-none position-fixed top-0 start-0 m-2 z-3"
        style={{ zIndex: 1050 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {sidebarOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark"
          style={{ opacity: 0.5, zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`d-flex flex-column flex-shrink-0 text-white position-fixed position-lg-static h-100`}
        style={{
          width: 250,
          zIndex: 1045,
          backgroundColor: 'var(--sidebar-bg)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="p-3 border-bottom border-secondary">
          <h5 className="mb-0 text-white fw-bold">Seller Panel</h5>
        </div>
        <Nav className="flex-column flex-grow-1 py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Nav.Link
              key={path}
              as={Link}
              to={path}
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${
                isActive(path) ? 'text-white border-start border-3' : 'text-white-50'
              }`}
              style={{
                transition: 'all 0.2s',
                borderColor: 'var(--accent) !important',
                background: isActive(path) ? 'linear-gradient(135deg, var(--brand-light), #0d9488)' : 'transparent',
                borderRadius: '10px',
                margin: '2px 8px',
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} className="me-3" />
              <span>{label}</span>
            </Nav.Link>
          ))}
        </Nav>
        <div className="p-3 border-top border-secondary">
          <small className="text-white-50">Handmade Store &copy; 2026</small>
        </div>
      </aside>

      <main className="flex-grow-1" style={{ minHeight: '100%', backgroundColor: 'var(--bg-primary)', transition: 'background-color var(--transition)' }}>
        <div className="p-3 p-md-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;

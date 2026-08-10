import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaTachometerAlt,
  FaBox,
  FaTags,
  FaUsers,
  FaClipboardList,
  FaCreditCard,
  FaTicketAlt,
  FaStar,
  FaWarehouse,
  FaChartLine,
  FaFileDownload,
  FaSignOutAlt,
  FaTimes,
} from 'react-icons/fa';
import { selectCurrentUser, logoutUser } from '../../../redux/slices/authSlice';
import Logo from '../../../components/common/Logo';

const NAV = [
  {
    section: 'Main',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt }],
  },
  {
    section: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: FaBox },
      { to: '/admin/categories', label: 'Categories', icon: FaTags },
      { to: '/admin/inventory', label: 'Inventory', icon: FaWarehouse },
    ],
  },
  {
    section: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: FaClipboardList },
      { to: '/admin/payments', label: 'Payments', icon: FaCreditCard },
      { to: '/admin/coupons', label: 'Coupons', icon: FaTicketAlt },
    ],
  },
  {
    section: 'People',
    items: [
      { to: '/admin/users', label: 'Users', icon: FaUsers },
      { to: '/admin/reviews', label: 'Reviews', icon: FaStar },
    ],
  },
  {
    section: 'Insights',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: FaChartLine },
      { to: '/admin/reports', label: 'Reports', icon: FaFileDownload },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <Logo size={38} showWordmark={false} />
        <div className="flex-1 min-w-0">
          <div className="sidebar-logo-text">Handmade Store</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
        <button className="btn-ghost menu-toggle-inline" onClick={onClose} style={{ display: 'none' }}>
          <FaTimes />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="sidebar-section">{group.section}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials || 'A'}</div>
          <div className="min-w-0">
            <div className="sidebar-user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm btn-block" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleLogout}>
          <FaSignOutAlt /> Sign out
        </button>
      </div>
    </aside>
  );
}

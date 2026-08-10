import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../redux/slices/authSlice";
import {
  FiGrid,
  FiUsers,
  FiPackage,
  FiTag,
  FiShoppingBag,
  FiPercent,
  FiStar,
  FiBell,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronDown,
  FiShield,
  FiUser,
} from "react-icons/fi";

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 60;

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: <FiGrid size={18} /> },
  { label: "Users", path: "/admin/users", icon: <FiUsers size={18} /> },
  { label: "Products", path: "/admin/products", icon: <FiPackage size={18} /> },
  { label: "Categories", path: "/admin/categories", icon: <FiTag size={18} /> },
  { label: "Orders", path: "/admin/orders", icon: <FiShoppingBag size={18} /> },
  { label: "Coupons", path: "/admin/coupons", icon: <FiPercent size={18} /> },
  { label: "Reviews", path: "/admin/reviews", icon: <FiStar size={18} /> },
];

const sidebarStyle = {
  width: SIDEBAR_WIDTH,
  minHeight: "100vh",
  backgroundColor: "var(--sidebar-bg)",
  color: "#e0e0e0",
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 1040,
  transition: "transform 0.3s ease",
  overflowY: "auto",
};

const topbarStyle = {
  height: TOPBAR_HEIGHT,
  backgroundColor: "var(--card-bg)",
  borderBottom: "1px solid var(--border-color)",
  position: "fixed",
  top: 0,
  left: SIDEBAR_WIDTH,
  right: 0,
  zIndex: 1030,
  transition: "left 0.3s ease",
};

const contentStyle = {
  marginLeft: SIDEBAR_WIDTH,
  marginTop: TOPBAR_HEIGHT,
  minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
  backgroundColor: "var(--bg-tertiary)",
  transition: "margin-left 0.3s ease",
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const pageTitle = navItems.find((item) => location.pathname.startsWith(item.path))?.label || "Admin";

  const isCollapsed = window.innerWidth <= 768 ? false : !sidebarOpen;

  return (
    <>
      <style>{`
        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          color: #a0a0b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          margin: 2px 12px;
          transition: all 0.2s ease;
        }
        .admin-nav-link:hover {
          color: #fff;
          background-color: rgba(255,255,255,0.08);
        }
        .admin-nav-link.active {
          color: #fff;
          background: linear-gradient(135deg, var(--brand-light), #0d9488);
          box-shadow: 0 4px 14px -4px rgba(20, 184, 166, 0.5);
        }
        .admin-nav-link .nav-label {
          transition: opacity 0.3s ease;
        }
        .sidebar-collapsed .admin-nav-link .nav-label {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }
        .topbar-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          min-width: 200px;
          z-index: 1050;
          overflow: hidden;
        }
        .topbar-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          color: var(--text-primary);
          font-size: 14px;
          text-decoration: none;
          transition: background 0.2s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .topbar-dropdown-item:hover {
          background-color: var(--bg-tertiary);
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: ${mobileOpen ? "translateX(0)" : "translateX(-100%)"};
          }
          .admin-topbar {
            left: 0 !important;
          }
          .admin-content {
            margin-left: 0 !important;
          }
          .admin-sidebar-overlay {
            display: ${mobileOpen ? "block" : "none"};
          }
        }
      `}</style>

      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1035,
          }}
        />
      )}

      <aside
        className={`admin-sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}
        style={{
          ...sidebarStyle,
          transform:
            window.innerWidth <= 768
              ? mobileOpen
                ? "translateX(0)"
                : "translateX(-100%)"
              : "translateX(0)",
          width: isCollapsed ? 72 : SIDEBAR_WIDTH,
        }}
      >
        <div
          className="d-flex align-items-center justify-content-between px-3 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <FiShield size={24} color="var(--brand-light)" />
            {!isCollapsed && (
              <span className="fw-bold text-white" style={{ fontSize: 16 }}>
                Admin Panel
              </span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="btn btn-link text-white p-0 d-md-none"
            style={{ textDecoration: "none" }}
          >
            {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {user && !isCollapsed && (
          <div
            className="px-3 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                alt={user.name}
                className="rounded-circle"
                width={36}
                height={36}
              />
              <div>
                <div className="text-white fw-semibold" style={{ fontSize: 13 }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: "#a0a0b8" }} className="text-capitalize">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            className="admin-nav-link w-100"
            onClick={handleLogout}
            style={{ border: "none", cursor: "pointer" }}
          >
            <FiLogOut size={18} />
            {!isCollapsed && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      <header
        className="admin-topbar"
        style={{
          ...topbarStyle,
          left: isCollapsed ? 72 : SIDEBAR_WIDTH,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="btn btn-link d-none d-md-flex p-0"
            style={{ textDecoration: "none", color: "var(--text-primary)" }}
          >
            <FiMenu size={22} />
          </button>
          <h5 className="mb-0 fw-bold">{pageTitle}</h5>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light position-relative rounded-circle" style={{ width: 40, height: 40 }}>
            <FiBell size={18} />
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: 10 }}
            >
              3
            </span>
          </button>

          <div className="position-relative">
            <button
              className="btn btn-light d-flex align-items-center gap-2 rounded-pill px-3"
              onClick={() => setUserDropdown(!userDropdown)}
            >
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || "Admin"}&background=random`}
                alt="avatar"
                className="rounded-circle"
                width={32}
                height={32}
              />
              <span className="d-none d-md-inline fw-semibold" style={{ fontSize: 14 }}>
                {user?.name || "Admin"}
              </span>
              <FiChevronDown size={14} />
            </button>

            {userDropdown && (
              <div className="topbar-dropdown">
                <div className="px-3 py-2 border-bottom">
                  <div className="fw-semibold" style={{ fontSize: 14 }}>{user?.name}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
                <button className="topbar-dropdown-item" onClick={() => { navigate("/profile"); setUserDropdown(false); }}>
                  <FiUser size={16} /> My Profile
                </button>
                <button className="topbar-dropdown-item text-danger" onClick={handleLogout}>
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {userDropdown && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1039 }}
          onClick={() => setUserDropdown(false)}
        />
      )}

      <main
        className="admin-content"
        style={{
          ...contentStyle,
          marginLeft: isCollapsed ? 72 : SIDEBAR_WIDTH,
        }}
      >
        <Outlet />
      </main>
    </>
  );
};

export default AdminLayout;

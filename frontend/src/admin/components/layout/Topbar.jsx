import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaBox, FaUser, FaClipboardList, FaTags, FaTicketAlt, FaStore } from 'react-icons/fa';
import { searchApi, notificationApi } from '../../api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { formatDate, fullName } from '../../utils/helpers';

const TYPE_ICONS = {
  products: FaBox,
  users: FaUser,
  orders: FaClipboardList,
  categories: FaTags,
  coupons: FaTicketAlt,
};

export default function Topbar({ onMenuToggle }) {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user?.email) {
      notificationApi
        .list(user.email)
        .then((res) => setNotifications(res.data || []))
        .catch(() => {});
    }
  }, [user]);

  const runSearch = useCallback(
    async (term) => {
      if (!term.trim()) {
        setResults(null);
        setOpen(false);
        return;
      }
      setSearching(true);
      try {
        const res = await searchApi.global(term.trim(), 8);
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) {
        runSearch(query);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navigateTo = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const renderGroup = (type, title, list, pathBuilder, labelFn) => {
    if (!list || list.length === 0) return null;
    const Icon = TYPE_ICONS[type] || FaStore;
    return (
      <>
        <div className="search-group-title">{title}</div>
        {list.map((item) => (
          <div
            key={`${type}-${item.id}`}
            className="search-item"
            onClick={() => navigateTo(pathBuilder(item))}
          >
            <div className="search-item-avatar">
              <Icon />
            </div>
            <div className="search-item-text">
              <div className="search-item-title">{item.name || item.title || fullName(item)}</div>
              <div className="search-item-sub">{labelFn(item)}</div>
            </div>
          </div>
        ))}
      </>
    );
  };

  const unread = (notifications || []).filter((n) => !n.isRead).length;

  return (
    <header className="topbar glass-panel" style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--glass-bg)' }}>
      <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
        ☰
      </button>

      <div className="search-box" ref={searchRef}>
        <FaSearch />
        <input
          type="text"
          placeholder="Search products, orders, customers, coupons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
        />
        {open && (
          <div className="search-dropdown glass-panel animate-slide-down">
            {searching && <div className="search-empty">Searching…</div>}
            {!searching && results && results.totalResults === 0 && (
              <div className="search-empty">No results for “{query}”.</div>
            )}
            {!searching &&
              results &&
              renderGroup(
                'products',
                'Products',
                results.products,
                (p) => `/admin/products?highlight=${p.id}`,
                (p) => p.category?.name || ''
              )}
            {!searching &&
              results &&
              renderGroup(
                'orders',
                'Orders',
                results.orders,
                (o) => `/admin/orders/${o.id}`,
                (o) => `#${o.id} · ${o.user?.email || ''}`
              )}
            {!searching &&
              results &&
              renderGroup(
                'users',
                'Users',
                results.users,
                (u) => `/admin/users/${u.id}`,
                (u) => u.email
              )}
            {!searching &&
              results &&
              renderGroup(
                'categories',
                'Categories',
                results.categories,
                () => '/admin/categories',
                (c) => c.description || ''
              )}
            {!searching &&
              results &&
              renderGroup(
                'coupons',
                'Coupons',
                results.coupons,
                () => '/admin/coupons',
                (c) => `${c.code} · ${c.discountPercentage}% off`
              )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
            <FaClipboardList />
            {unread > 0 && <span className="badge-dot">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {notifOpen && (
            <div className="notif-panel glass-panel animate-slide-down">
              <div className="notif-panel-header">
                <span>Notifications</span>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => navigate('/admin/orders')}
                >
                  View all
                </button>
              </div>
              {notifications.length === 0 && (
                <div className="search-empty">No notifications.</div>
              )}
              {notifications.slice(0, 12).map((n) => (
                <div
                  key={n.id}
                  className="notif-item"
                  onClick={() => n.link && navigate(n.link)}
                >
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {formatDate(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

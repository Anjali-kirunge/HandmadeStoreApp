import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBan, FaCheckCircle, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { userApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { formatPrice, formatDateTime, getErrorMessage, fullName } from '../utils/helpers';
import { ROLES } from '../utils/constants';

const PAGE_SIZE = 8;

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [roleModal, setRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([userApi.get(id), userApi.orders(id, page, PAGE_SIZE)])
      .then(([u, o]) => {
        setUser(u.data);
        setOrders(o.data);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, page]);

  if (loading) return <Loading text="Loading user…" />;
  if (!user) return <EmptyState title="User not found" />;

  const spent = (orders?.content || []).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const saveRole = async () => {
    try {
      await userApi.updateRole(user.id, selectedRole);
      toast.success('Role updated');
      setRoleModal(false);
      const res = await userApi.get(id);
      setUser(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const saveProfile = async () => {
    try {
      await userApi.update(user.id, editForm);
      toast.success('Profile updated');
      setEditModal(false);
      const res = await userApi.get(id);
      setUser(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openEdit = () => {
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || ''
    });
    setEditModal(true);
  };

  const handleToggle = async () => {
    const action = user.enabled ? 'deactivate' : 'activate';
    const result = await Swal.fire({
      title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} user?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      confirmButtonColor: action === 'deactivate' ? '#ef4444' : '#10b981',
    });
    if (!result.isConfirmed) return;
    try {
      await userApi.toggle(user.id);
      const res = await userApi.get(id);
      setUser(res.data);
      toast.success(`User ${action}d`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title={fullName(user)}
        subtitle={user.email}
      >
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/users')}>
          <FaArrowLeft /> Back
        </button>
      </PageHeader>

      <div className="grid-cols grid-cols-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">Profile</h3>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={openEdit}>
                <FaEdit /> Edit profile
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setRoleModal(true)}>
                <FaEdit /> Change role
              </button>
              <button className={`btn btn-sm ${user.enabled ? 'btn-danger' : 'btn-success'}`} onClick={handleToggle}>
                {user.enabled ? <FaBan /> : <FaCheckCircle />}
                {user.enabled ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Full name</div>
                <div className="detail-value">{fullName(user)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{user.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{user.phone || '—'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Role</div>
                <div className="detail-value">
                  <StatusBadge type="role" value={user.role} />
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Status</div>
                <div className="detail-value">
                  <span
                    className="badge"
                    style={{
                      background: user.enabled ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: user.enabled ? '#059669' : '#dc2626',
                    }}
                  >
                    {user.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Joined</div>
                <div className="detail-value">{formatDateTime(user.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Summary</h3>
          </div>
          <div className="card-body">
            <div className="flex justify-between mb-3">
              <span className="muted">Total orders</span>
              <span style={{ fontWeight: 700 }}>{orders?.totalElements ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="muted">Spent (page)</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(spent)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Order History</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(orders?.content || []).map((o) => (
                <tr key={o.id} className="clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                  <td className="mono">#{o.id}</td>
                  <td>{formatPrice(o.totalAmount)}</td>
                  <td>
                    <StatusBadge type="order" value={o.orderStatus} />
                  </td>
                  <td>
                    <StatusBadge type="payment" value={o.paymentStatus} />
                  </td>
                  <td>{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!orders?.content || orders.content.length === 0) && (
            <EmptyState title="No orders yet" />
          )}
        </div>
        {orders && (
          <div style={{ padding: '0 20px 12px' }}>
            <Pagination page={page} totalPages={orders.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {roleModal && (
        <Modal
          title="Change user role"
          onClose={() => setRoleModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRoleModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveRole} disabled={!selectedRole}>
                Save role
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-control"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Select role…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace('ROLE_', '').toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal
          title="Edit user profile"
          onClose={() => setEditModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveProfile}>
                Save changes
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-control"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-control"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-control"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

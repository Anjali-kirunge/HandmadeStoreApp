import { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { couponApi } from '../api';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import {
  formatPrice,
  formatDateTime,
  toDatetimeLocalInput,
  fromDatetimeLocal,
  getErrorMessage,
} from '../utils/helpers';

const emptyForm = {
  code: '',
  discountPercentage: '',
  maxDiscount: '',
  minPurchase: '',
  usageLimit: 100,
  validFrom: '',
  validUntil: '',
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    couponApi
      .list()
      .then((res) => setCoupons(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code || '',
      discountPercentage: c.discountPercentage != null ? String(c.discountPercentage) : '',
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : '',
      minPurchase: c.minPurchase != null ? String(c.minPurchase) : '',
      usageLimit: c.usageLimit != null ? c.usageLimit : 100,
      validFrom: toDatetimeLocalInput(c.validFrom),
      validUntil: toDatetimeLocalInput(c.validUntil),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (form.discountPercentage === '' || Number(form.discountPercentage) <= 0) {
      toast.error('Discount percentage must be greater than 0');
      return;
    }
    if (form.maxDiscount === '' || Number(form.maxDiscount) <= 0) {
      toast.error('Max discount must be greater than 0');
      return;
    }
    if (form.minPurchase === '' || Number(form.minPurchase) <= 0) {
      toast.error('Min purchase must be greater than 0');
      return;
    }
    if (form.usageLimit === '' || Number(form.usageLimit) < 1) {
      toast.error('Usage limit must be at least 1');
      return;
    }
    if (!form.validFrom) {
      toast.error('Valid from date is required');
      return;
    }
    if (!form.validUntil) {
      toast.error('Valid until date is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountPercentage: Number(form.discountPercentage),
        maxDiscount: Number(form.maxDiscount),
        minPurchase: Number(form.minPurchase),
        usageLimit: Number(form.usageLimit),
        validFrom: fromDatetimeLocal(form.validFrom),
        validUntil: fromDatetimeLocal(form.validUntil),
      };
      if (editing) {
        await couponApi.update(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await couponApi.create(payload);
        toast.success('Coupon created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c) => {
    try {
      await couponApi.toggle(c.id);
      toast.success(c.active ? 'Coupon deactivated' : 'Coupon activated');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    try {
      await couponApi.remove(c.id);
      toast.success('Coupon deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div>
      <PageHeader title="Coupons" subtitle={`${coupons.length} coupons`}>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <FaPlus /> New coupon
        </button>
      </PageHeader>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Max discount</th>
                <th>Min purchase</th>
                <th>Usage</th>
                <th>Valid</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="mono" style={{ fontWeight: 700, letterSpacing: 0.5 }}>
                    {c.code}
                  </td>
                  <td>{c.discountPercentage}%</td>
                  <td>{formatPrice(c.maxDiscount)}</td>
                  <td>{formatPrice(c.minPurchase)}</td>
                  <td>
                    {c.usedCount}/{c.usageLimit ?? '∞'}
                  </td>
                  <td>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {formatDateTime(c.validFrom)}
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      → {formatDateTime(c.validUntil)}
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: c.active ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: c.active ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-icon" title="Toggle active" onClick={() => handleToggle(c)}>
                      {c.active ? <span style={{ color: 'var(--danger)' }}>Deactivate</span> : <span style={{ color: 'var(--success)' }}>Activate</span>}
                    </button>
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(c)}>
                      <FaEdit />
                    </button>
                    <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(c)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <Loading text="Loading coupons…" />}
          {!loading && coupons.length === 0 && <EmptyState title="No coupons yet" />}
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={editing ? 'Edit coupon' : 'New coupon'} footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
            </button>
          </>
        }>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input className="form-control" value={form.code} onChange={set('code')} placeholder="e.g. SUMMER10" />
          </div>
          <div className="grid-cols grid-cols-2">
            <div className="form-group">
              <label className="form-label">Discount %</label>
              <input className="form-control" type="number" min="0" max="100" value={form.discountPercentage} onChange={set('discountPercentage')} placeholder="10" />
            </div>
            <div className="form-group">
              <label className="form-label">Usage limit</label>
              <input className="form-control" type="number" min="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="100" />
            </div>
            <div className="form-group">
              <label className="form-label">Max discount (₹)</label>
              <input className="form-control" type="number" min="0" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="500" />
            </div>
            <div className="form-group">
              <label className="form-label">Min purchase (₹)</label>
              <input className="form-control" type="number" min="0" value={form.minPurchase} onChange={set('minPurchase')} placeholder="1000" />
            </div>
          </div>
          <div className="grid-cols grid-cols-2">
            <div className="form-group">
              <label className="form-label">Valid from</label>
              <input className="form-control" type="datetime-local" value={form.validFrom} onChange={set('validFrom')} />
            </div>
            <div className="form-group">
              <label className="form-label">Valid until</label>
              <input className="form-control" type="datetime-local" value={form.validUntil} onChange={set('validUntil')} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

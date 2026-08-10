import { useState } from 'react';
import { FaFileAlt, FaFileExcel, FaFileCsv, FaFilePdf, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { reportApi } from '../api';
import PageHeader from '../components/PageHeader';
import { toLocalDateInput, getErrorMessage } from '../utils/helpers';
import { ORDER_STATUSES, PRODUCT_STATUSES, PAYMENT_STATUSES, ROLES } from '../utils/constants';

const FORMATS = [
  { key: 'csv', label: 'CSV', icon: FaFileCsv, color: '#16a34a' },
  { key: 'excel', label: 'Excel', icon: FaFileExcel, color: '#059669' },
  { key: 'pdf', label: 'PDF', icon: FaFilePdf, color: '#dc2626' },
];

const REPORTS = [
  {
    key: 'orders',
    title: 'Orders report',
    desc: 'All orders with items, customer and totals. Filter by keyword, status and date range.',
    filters: [
      { name: 'keyword', type: 'text', label: 'Order ID / customer', placeholder: 'e.g. 12' },
      { name: 'status', type: 'select', label: 'Order status', options: ORDER_STATUSES },
      { name: 'from', type: 'date', label: 'From' },
      { name: 'to', type: 'date', label: 'To' },
    ],
  },
  {
    key: 'products',
    title: 'Products report',
    desc: 'Catalogue with pricing, stock and status. Filter by keyword, status or low stock only.',
    filters: [
      { name: 'keyword', type: 'text', label: 'Product name / SKU', placeholder: 'e.g. vase' },
      { name: 'status', type: 'select', label: 'Product status', options: PRODUCT_STATUSES },
      { name: 'lowStockOnly', type: 'boolean', label: 'Low stock only' },
    ],
  },
  {
    key: 'users',
    title: 'Users report',
    desc: 'Customer and seller accounts. Filter by keyword or role.',
    filters: [
      { name: 'keyword', type: 'text', label: 'Name / email', placeholder: 'e.g. john' },
      { name: 'role', type: 'select', label: 'Role', options: ROLES },
    ],
  },
  {
    key: 'payments',
    title: 'Payments report',
    desc: 'All payment records with method and status. Filter by status and date range.',
    filters: [
      { name: 'status', type: 'select', label: 'Payment status', options: PAYMENT_STATUSES },
      { name: 'from', type: 'date', label: 'From' },
      { name: 'to', type: 'date', label: 'To' },
    ],
  },
  {
    key: 'analytics',
    title: 'Analytics report',
    desc: 'Revenue, orders, top products/customers and category breakdown. Filter by date range.',
    filters: [
      { name: 'from', type: 'date', label: 'From' },
      { name: 'to', type: 'date', label: 'To' },
    ],
  },
];

export default function Reports() {
  const [filters, setFilters] = useState({});
  const [busy, setBusy] = useState(null);

  const setFilter = (reportKey, name) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value === ''
          ? undefined
          : e.target.type === 'date'
            ? e.target.value
            : e.target.value;
    setFilters((prev) => ({ ...prev, [`${reportKey}.${name}`]: value }));
  };

  const download = async (reportKey, format) => {
    setBusy(`${reportKey}:${format}`);
    try {
      const report = REPORTS.find((r) => r.key === reportKey);
      const f = {};
      report.filters.forEach((fl) => {
        const v = filters[`${reportKey}.${fl.name}`];
        if (v !== undefined && v !== '') f[fl.name] = v;
      });
      await reportApi.download(reportKey, format, f);
      toast.success(`${report.title} downloaded`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Export data in CSV, Excel or PDF" />

      <div className="grid-cols grid-cols-2">
        {REPORTS.map((report) => (
          <div className="card" key={report.key}>
            <div className="card-header">
              <h3 className="card-title">
                <FaFileAlt style={{ marginRight: 8, color: 'var(--brand-light)' }} />
                {report.title}
              </h3>
            </div>
            <div className="card-body">
              <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
                {report.desc}
              </p>
              <div className="grid-cols grid-cols-2">
                {report.filters.map((fl) =>
                  fl.type === 'boolean' ? (
                    <label key={fl.name} className="flex items-center gap-2" style={{ fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!filters[`${report.key}.${fl.name}`]}
                        onChange={setFilter(report.key, fl.name)}
                      />
                      {fl.label}
                    </label>
                  ) : fl.type === 'select' ? (
                    <div className="form-group" key={fl.name}>
                      <label className="form-label">{fl.label}</label>
                      <select
                        className="form-control"
                        value={filters[`${report.key}.${fl.name}`] || ''}
                        onChange={setFilter(report.key, fl.name)}
                      >
                        <option value="">All</option>
                        {fl.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group" key={fl.name}>
                      <label className="form-label">{fl.label}</label>
                      <input
                        className="form-control"
                        type={fl.type === 'date' ? 'date' : 'text'}
                        value={filters[`${report.key}.${fl.name}`] || ''}
                        onChange={setFilter(report.key, fl.name)}
                        placeholder={fl.placeholder || ''}
                        max={fl.name === 'from' ? filters[`${report.key}.to`] || undefined : undefined}
                        min={fl.name === 'to' ? filters[`${report.key}.from`] || undefined : undefined}
                      />
                    </div>
                  )
                )}
              </div>
              <div className="mt-4 flex gap-2" style={{ flexWrap: 'wrap' }}>
                {FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  const isBusy = busy === `${report.key}:${fmt.key}`;
                  return (
                    <button
                      key={fmt.key}
                      className="btn btn-outline btn-sm"
                      onClick={() => download(report.key, fmt.key)}
                      disabled={!!busy}
                    >
                      {isBusy ? <FaDownload className="spin" /> : <Icon style={{ color: fmt.color }} />}
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS, PRODUCT_STATUS_COLORS, ROLE_COLORS } from '../utils/constants';
import { titleCase } from '../utils/helpers';

const COLOR_MAPS = {
  order: ORDER_STATUS_COLORS,
  payment: PAYMENT_STATUS_COLORS,
  product: PRODUCT_STATUS_COLORS,
  role: ROLE_COLORS,
};

export default function StatusBadge({ type = 'order', value }) {
  if (!value) return null;
  const colors = COLOR_MAPS[type] || ORDER_STATUS_COLORS;
  const color = colors[value] || '#64748b';
  return (
    <span className="badge" style={{ background: `${color}1a`, color }}>
      <span className="badge-dot-inline" style={{ background: color }} />
      {titleCase(value)}
    </span>
  );
}

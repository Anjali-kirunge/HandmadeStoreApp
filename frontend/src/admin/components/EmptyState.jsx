import { FaInbox } from 'react-icons/fa';

export default function EmptyState({ title = 'No records found', description, action }) {
  return (
    <div className="empty-state">
      <FaInbox />
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

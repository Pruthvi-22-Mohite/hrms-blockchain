/**
 * EmptyState - Shown when a data list has no items.
 *
 * Props:
 *   title: string
 *   description: string
 *   action?: React.ReactNode - Optional action button
 */
export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 20h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M29 6v8M19 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="empty-title">{title}</div>
      {description && (
        <div className="empty-description">{description}</div>
      )}
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}

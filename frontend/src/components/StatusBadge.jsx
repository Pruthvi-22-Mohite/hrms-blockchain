/**
 * StatusBadge - Displays record or access status with appropriate color.
 *
 * Props:
 *   status: 'authorized' | 'granted' | 'revoked' | 'denied' | 'pending' | string
 */
export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  const classMap = {
    authorized: 'badge badge-authorized',
    granted: 'badge badge-granted',
    revoked: 'badge badge-revoked',
    denied: 'badge badge-denied',
    'access denied': 'badge badge-denied',
    pending: 'badge badge-pending',
  };

  const labelMap = {
    authorized: 'Authorized',
    granted: 'Granted',
    revoked: 'Revoked',
    denied: 'Access Denied',
    'access denied': 'Access Denied',
    pending: 'Pending',
  };

  const className = classMap[normalized] || 'badge badge-neutral';
  const label = labelMap[normalized] || status;

  return <span className={className}>{label}</span>;
}

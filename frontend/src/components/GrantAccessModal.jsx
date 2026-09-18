import { useState } from 'react';
import Modal from './Modal';
import { grantAccess } from '../api/records';
import { useToast } from '../context/ToastContext';

/**
 * GrantAccessModal - Modal for granting a doctor access to a specific record.
 *
 * Props:
 *   record: { recordId, label } - The record to grant access to
 *   onSuccess: function - Called after successful grant
 *   trigger: React.ReactNode - The element that triggers the modal
 */
export default function GrantAccessModal({ record, onSuccess }) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [grantResult, setGrantResult] = useState(null);

  function handleOpen() {
    setIsOpen(true);
    setDoctorAddress('');
    setError('');
    setGrantResult(null);
  }

  function handleClose() {
    if (loading) return;
    setIsOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmed = doctorAddress.trim();
    if (!trimmed) {
      setError('Please enter the doctor\'s wallet address.');
      return;
    }

    setLoading(true);
    try {
      const result = await grantAccess(record.recordId, trimmed);
      setGrantResult(result);
      showToast({
        type: 'success',
        title: 'Access granted',
        message: `Doctor can now access: ${record.label}`,
      });
      onSuccess();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to grant access. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-secondary"
        onClick={handleOpen}
        id={`grant-access-${record.recordId}`}
      >
        Grant Access
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Grant Doctor Access">
        {grantResult ? (
          <div className="modal-body">
            <div className="success-block">
              <div className="success-title">Access granted successfully</div>
              <div className="success-detail">
                <strong>Transaction Hash:</strong>
                <div className="hash-value">{grantResult.txHash}</div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Authorize a doctor to access this healthcare record.
              </p>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '20px', padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                Record: <strong style={{ color: 'var(--color-text-primary)' }}>{record.label}</strong> ({record.recordId})
              </div>

              {error && (
                <div className="error-state" role="alert">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="doctor-wallet-address">
                  Doctor Wallet Address <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="doctor-wallet-address"
                  type="text"
                  className="form-control"
                  placeholder="0xDef456..."
                  value={doctorAddress}
                  onChange={(e) => setDoctorAddress(e.target.value)}
                  disabled={loading}
                  spellCheck="false"
                  autoComplete="off"
                />
                <div className="form-hint">Enter the Ethereum wallet address of the doctor.</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                id={`grant-submit-${record.recordId}`}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" aria-hidden="true" />
                    Granting...
                  </>
                ) : (
                  'Grant Access'
                )}
              </button>
            </div>
          </form>
        )}

        {grantResult && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>
              Done
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

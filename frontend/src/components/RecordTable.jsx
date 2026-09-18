import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import GrantAccessModal from './GrantAccessModal';
import RevokeAccessModal from './RevokeAccessModal';

/**
 * RecordTable - Patient's record list as a professional data table.
 *
 * Props:
 *   records: array of record objects
 *   loading: boolean
 *   error: string
 *   onRecordUpdate: function - Called when a record is updated (grant/revoke)
 */
export default function RecordTable({ records, loading, error, onRecordUpdate }) {
  function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (loading) {
    return <LoadingState message="Loading records..." />;
  }

  if (error) {
    return (
      <div className="error-state" role="alert">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {error}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        title="No records found"
        description="Upload your first medical record to get started."
      />
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table" aria-label="Patient medical records">
        <thead>
          <tr>
            <th scope="col">Record</th>
            <th scope="col">Uploaded</th>
            <th scope="col">Authorized Doctors</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.recordId}>
              {/* Record info */}
              <td>
                <div className="table-cell-primary">{record.label}</div>
                <div className="table-cell-secondary" style={{ fontFamily: 'Courier New, monospace' }}>
                  {record.recordId}
                </div>
              </td>

              {/* Upload date */}
              <td>
                <div className="table-cell-primary">{formatDate(record.uploadedAt)}</div>
              </td>

              {/* Authorized doctors */}
              <td>
                {record.authorizedDoctors && record.authorizedDoctors.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {record.authorizedDoctors.map((doc) => (
                      <div key={doc.walletAddress} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span className="doctor-chip">{doc.name}</span>
                        <RevokeAccessModal
                          record={record}
                          doctor={doc}
                          onSuccess={() => onRecordUpdate()}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="no-doctors">No doctors authorized</span>
                )}
              </td>

              {/* Actions */}
              <td>
                <div className="table-actions">
                  <GrantAccessModal
                    record={record}
                    onSuccess={() => onRecordUpdate()}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

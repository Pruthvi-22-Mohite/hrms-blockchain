import { useState, useRef } from 'react';
import Modal from './Modal';
import { uploadRecord } from '../api/records';
import { useToast } from '../context/ToastContext';

/**
 * UploadRecord - Upload section with file + label fields.
 * Triggers onSuccess(uploadResult) after successful upload.
 *
 * Props:
 *   onSuccess: function(result) - Called after successful upload
 */
export default function UploadRecord({ onSuccess }) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  function handleOpen() {
    setIsOpen(true);
    setLabel('');
    setFile(null);
    setError('');
    setUploadResult(null);
  }

  function handleClose() {
    if (loading) return;
    setIsOpen(false);
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!label.trim()) {
      setError('Please enter a label for this record.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', label.trim());

      const result = await uploadRecord(formData);
      setUploadResult(result);
      showToast({
        type: 'success',
        title: 'Record uploaded',
        message: `Record ID: ${result.recordId}`,
      });
      onSuccess(result);
    } catch (err) {
      const message = err?.response?.data?.message || 'Upload failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={handleOpen} id="upload-record-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v8M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Upload Record
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Upload Medical Record">
        {uploadResult ? (
          // Success state
          <div className="modal-body">
            <div className="success-block">
              <div className="success-title">Record uploaded successfully</div>
              <div className="success-detail">
                <strong>Record ID:</strong>
                <div className="hash-value">{uploadResult.recordId}</div>
              </div>
              <div className="success-detail" style={{ marginTop: '8px' }}>
                <strong>Transaction Hash:</strong>
                <div className="hash-value">{uploadResult.txHash}</div>
              </div>
              {uploadResult.cid && (
                <div className="success-detail" style={{ marginTop: '8px' }}>
                  <strong>IPFS CID:</strong>
                  <div className="hash-value">{uploadResult.cid}</div>
                </div>
              )}
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '12px' }}>
              Uploaded: {new Date(uploadResult.uploadedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          // Upload form
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
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
                <label className="form-label" htmlFor="record-label">
                  Record Label <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="record-label"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Blood Test Report - Sept"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="record-file">
                  Medical Record File <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div
                  className="file-input-wrapper"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Select file to upload"
                >
                  <input
                    ref={fileInputRef}
                    id="record-file"
                    type="file"
                    onChange={handleFileChange}
                    disabled={loading}
                    accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                  />
                  {file ? (
                    <div className="file-selected-name">{file.name}</div>
                  ) : (
                    <div className="file-input-text">
                      <strong>Click to browse</strong> or drag a file here<br />
                      <span style={{ fontSize: 'var(--font-size-xs)', marginTop: '4px', display: 'block' }}>
                        PDF, JPG, PNG, TXT, DOC
                      </span>
                    </div>
                  )}
                </div>
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
                id="upload-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" aria-hidden="true" />
                    Uploading...
                  </>
                ) : (
                  'Upload Record'
                )}
              </button>
            </div>
          </form>
        )}

        {uploadResult && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>
              Close
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

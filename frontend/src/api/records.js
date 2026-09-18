import api from './axios';
import {
  mockGetMyRecords,
  mockUploadRecord,
  mockGrantAccess,
  mockRevokeAccess,
  mockCheckAccess,
  mockViewRecord,
} from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * GET /records/mine
 * Returns the authenticated patient's record list.
 */
export async function getMyRecords() {
  if (USE_MOCK) {
    return mockGetMyRecords();
  }
  const response = await api.get('/records/mine');
  return response.data;
}

/**
 * POST /records/upload
 * @param {FormData} formData - Contains 'file' (binary) and 'label' (string)
 */
export async function uploadRecord(formData) {
  if (USE_MOCK) {
    return mockUploadRecord(formData);
  }
  const response = await api.post('/records/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * POST /records/:id/grant
 * @param {string} recordId
 * @param {string} doctorAddress - Doctor's wallet address
 */
export async function grantAccess(recordId, doctorAddress) {
  if (USE_MOCK) {
    return mockGrantAccess(recordId, doctorAddress);
  }
  const response = await api.post(`/records/${recordId}/grant`, { doctorAddress });
  return response.data;
}

/**
 * POST /records/:id/revoke
 * @param {string} recordId
 * @param {string} doctorAddress - Doctor's wallet address
 */
export async function revokeAccess(recordId, doctorAddress) {
  if (USE_MOCK) {
    return mockRevokeAccess(recordId, doctorAddress);
  }
  const response = await api.post(`/records/${recordId}/revoke`, { doctorAddress });
  return response.data;
}

/**
 * GET /records/:id/access-check
 * @param {string} recordId
 * @returns {{ authorized: boolean }}
 */
export async function checkAccess(recordId) {
  if (USE_MOCK) {
    return mockCheckAccess(recordId);
  }
  const response = await api.get(`/records/${recordId}/access-check`);
  return response.data;
}

/**
 * GET /records/:id/view
 * Should only be called after checkAccess returns true.
 * @param {string} recordId
 * @returns {{ recordId, label, content }}
 */
export async function viewRecord(recordId) {
  if (USE_MOCK) {
    return mockViewRecord(recordId);
  }
  const response = await api.get(`/records/${recordId}/view`);
  return response.data;
}

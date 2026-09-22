import api from './axios';
import { mockLogin } from './mock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * POST /auth/login
 * @param {string} name - User's full name
 * @param {string} role - 'patient' | 'doctor'
 * @returns {{ token, role, walletAddress, userId, name }}
 */
export async function login(name, role) {
  if (USE_MOCK) {
    return mockLogin(name, role);
  }
  const response = await api.post('/auth/login', { name, role });
  return response.data;
}

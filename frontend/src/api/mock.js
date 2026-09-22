/**
 * Mock data for development before the real backend is available.
 * Matches the exact API contract specified in the project requirements.
 *
 * Toggle mock mode via: VITE_USE_MOCK=true in .env
 */

// Simulate network delay
const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// In-memory store for mock state
let mockRecords = [
  {
    recordId: 'rec_101',
    label: 'Blood Test Report - Sept',
    uploadedAt: '2026-09-18T10:22:00Z',
    authorizedDoctors: [
      {
        walletAddress: '0xDef456...',
        name: 'Dr. Kapoor',
      },
    ],
    cid: 'bafybeigd6z3s...',
    content:
      'Hemoglobin: 13.8 g/dL, WBC: 6.2k/uL, all values within normal range.',
  },
  {
    recordId: 'rec_102',
    label: 'X-Ray - Left Wrist',
    uploadedAt: '2026-09-10T09:00:00Z',
    authorizedDoctors: [],
    cid: 'bafybeih8x1q...',
    content: 'No fracture detected. Mild soft tissue swelling.',
  },
];

let recordCounter = 103;

// ---- Auth Mock ----

export async function mockLogin(name, role) {
  await delay(800);

  if (role === 'patient') {
    return {
      token: 'mock-jwt-patient-token',
      role: 'patient',
      walletAddress: '0xAbc123...',
      userId: 'u_01',
      name: name || 'Riya Sharma',
    };
  }

  if (role === 'doctor') {
    return {
      token: 'mock-jwt-doctor-token',
      role: 'doctor',
      walletAddress: '0xDef456...',
      userId: 'u_02',
      name: name || 'Dr. Kapoor',
    };
  }

  throw new Error('Invalid role');
}

// ---- Records Mock ----

export async function mockGetMyRecords() {
  await delay(700);
  // Return a copy without the content field (content is returned only on /view)
  return mockRecords.map(({ content: _content, ...rec }) => rec);
}

export async function mockUploadRecord(formData) {
  await delay(1200);
  const label = formData.get('label') || 'Uploaded Record';
  const newRecord = {
    recordId: `rec_${recordCounter++}`,
    label,
    uploadedAt: new Date().toISOString(),
    authorizedDoctors: [],
    cid: `bafybeig${Math.random().toString(36).slice(2, 10)}...`,
    content: 'Record content uploaded by patient.',
  };
  mockRecords.push(newRecord);
  return {
    recordId: newRecord.recordId,
    cid: newRecord.cid,
    txHash: `0x${Math.random().toString(16).slice(2, 12)}...`,
    uploadedAt: newRecord.uploadedAt,
  };
}

export async function mockGrantAccess(recordId, doctorAddress) {
  await delay(900);
  const record = mockRecords.find((r) => r.recordId === recordId);
  if (!record) throw new Error('Record not found');

  const alreadyGranted = record.authorizedDoctors.some(
    (d) => d.walletAddress === doctorAddress
  );
  if (!alreadyGranted) {
    // Infer doctor name from known addresses
    const doctorName =
      doctorAddress === '0xDef456...' ? 'Dr. Kapoor' : 'Dr. Unknown';
    record.authorizedDoctors.push({
      walletAddress: doctorAddress,
      name: doctorName,
    });
  }

  return {
    txHash: `0x${Math.random().toString(16).slice(2, 12)}...`,
    status: 'granted',
  };
}

export async function mockRevokeAccess(recordId, doctorAddress) {
  await delay(900);
  const record = mockRecords.find((r) => r.recordId === recordId);
  if (!record) throw new Error('Record not found');
  record.authorizedDoctors = record.authorizedDoctors.filter(
    (d) => d.walletAddress !== doctorAddress
  );
  return {
    txHash: `0x${Math.random().toString(16).slice(2, 12)}...`,
    status: 'revoked',
  };
}

export async function mockCheckAccess(recordId) {
  await delay(600);
  const record = mockRecords.find((r) => r.recordId === recordId);
  if (!record) {
    // In mock, unknown record IDs return false
    return { authorized: false };
  }
  // Doctor wallet is hardcoded as 0xDef456... in mock
  const authorized = record.authorizedDoctors.some(
    (d) => d.walletAddress === '0xDef456...'
  );
  return { authorized };
}

export async function mockViewRecord(recordId) {
  await delay(800);
  const record = mockRecords.find((r) => r.recordId === recordId);
  if (!record) {
    const err = new Error('Access denied');
    err.response = { status: 403, data: { error: 'ACCESS_DENIED' } };
    throw err;
  }
  const isAuthorized = record.authorizedDoctors.some(
    (d) => d.walletAddress === '0xDef456...'
  );
  if (!isAuthorized) {
    const err = new Error('Access denied');
    err.response = { status: 403, data: { error: 'ACCESS_DENIED' } };
    throw err;
  }
  return {
    recordId: record.recordId,
    label: record.label,
    content: record.content,
  };
}

// End-to-end rehearsal of the demo: upload -> grant -> view -> revoke -> deny.
// Needs a running Hardhat node with contracts deployed, and the backend running.
const BASE = process.env.API_URL || "http://localhost:4000";

async function call(method, path, { token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, { method, headers, body: json ? JSON.stringify(json) : form });
  return { status: res.status, body: await res.json() };
}

function check(label, condition, detail) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`, detail ? `-> ${JSON.stringify(detail)}` : "");
  if (!condition) process.exitCode = 1;
}

async function main() {
  const suffix = Date.now();
  const patient = (await call("POST", "/auth/login", { json: { name: `Riya ${suffix}`, role: "patient" } })).body;
  const doctor = (await call("POST", "/auth/login", { json: { name: `Dr Kapoor ${suffix}`, role: "doctor" } })).body;
  check("patient and doctor logged in", patient.token && doctor.token);

  const secret = "Hemoglobin: 13.8 g/dL, WBC: 6.2k/uL. Confidential.";
  const form = new FormData();
  form.append("file", new Blob([secret]), "blood-test.txt");
  form.append("label", "Blood Test Report");
  const uploaded = await call("POST", "/records/upload", { token: patient.token, form });
  check("1. patient uploads record (encrypted, pinned, logged on-chain)", uploaded.status === 200, uploaded.body);
  const id = uploaded.body.recordId;

  let r = await call("GET", `/records/${id}/access-check`, { token: doctor.token });
  check("2. doctor has no access before grant", r.body.authorized === false);
  r = await call("GET", `/records/${id}/view`, { token: doctor.token });
  check("   doctor view denied before grant", r.status === 403, r.body);

  r = await call("POST", `/records/${id}/grant`, { token: patient.token, json: { doctorAddress: doctor.walletAddress } });
  check("3. patient grants doctor access", r.body.status === "granted", r.body);

  r = await call("GET", `/records/${id}/view`, { token: doctor.token });
  check("4. doctor views record, content decrypted intact", r.status === 200 && r.body.content === secret, r.body);

  r = await call("GET", "/records/mine", { token: patient.token });
  check("   patient's list shows the doctor as authorized", r.body[0]?.authorizedDoctors?.[0]?.walletAddress === doctor.walletAddress, r.body);

  r = await call("POST", `/records/${id}/revoke`, { token: patient.token, json: { doctorAddress: doctor.walletAddress } });
  check("5. patient revokes access", r.body.status === "revoked", r.body);

  r = await call("GET", `/records/${id}/access-check`, { token: doctor.token });
  check("6. doctor access-check now false", r.body.authorized === false);
  r = await call("GET", `/records/${id}/view`, { token: doctor.token });
  check("   doctor view denied after revoke", r.status === 403 && r.body.error === "ACCESS_DENIED", r.body);

  r = await call("GET", "/records/mine");
  check("no token -> 401", r.status === 401);
  r = await call("GET", "/records/mine", { token: doctor.token });
  check("doctor cannot list patient-only endpoint -> 403", r.status === 403);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

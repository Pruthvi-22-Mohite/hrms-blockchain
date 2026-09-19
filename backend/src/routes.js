const express = require("express");
const multer = require("multer");
const { ethers } = require("ethers");
const { recordRegistry } = require("./chain");
const { login, requireAuth } = require("./auth");
const { encrypt, decrypt, sha256Hex } = require("./crypto");
const ipfs = require("./ipfs");
const store = require("./store");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const CONTRACT_ERRORS = {
  NotAPatient: [403, "NOT_A_PATIENT"],
  NotADoctor: [400, "NOT_A_DOCTOR"],
  NotRecordOwner: [403, "NOT_RECORD_OWNER"],
  RecordDoesNotExist: [404, "RECORD_NOT_FOUND"],
};

function contractFailure(err) {
  if (err?.reason === "RecordRegistry: caller not authorized") return [403, "ACCESS_DENIED"];
  return CONTRACT_ERRORS[err?.revert?.name] || null;
}

function parseRecordId(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: "RECORD_NOT_FOUND" });
  req.recordId = BigInt(req.params.id);
  next();
}

function requireDoctorAddress(req, res, next) {
  const { doctorAddress } = req.body || {};
  if (!ethers.isAddress(doctorAddress)) {
    return res.status(400).json({ error: "INVALID_ADDRESS", message: "doctorAddress must be a wallet address" });
  }
  req.doctorAddress = doctorAddress;
  next();
}

// The contract can only answer "does X have access?", so rebuild the list of
// doctors from the AccessGranted event log and confirm each against the current state.
async function authorizedDoctors(recordId) {
  const grants = await recordRegistry.queryFilter(recordRegistry.filters.AccessGranted(recordId));
  const candidates = [...new Set(grants.map((e) => e.args.doctor))];
  const current = [];
  for (const doctor of candidates) {
    if (await recordRegistry.checkAccess(doctor, recordId)) {
      current.push({ walletAddress: doctor, name: store.getName(doctor) });
    }
  }
  return current;
}

router.post("/auth/login", wrap(login));

router.post("/records/upload", requireAuth("patient"), upload.single("file"), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "FILE_REQUIRED" });

  const plaintext = req.file.buffer;
  const fileHash = sha256Hex(plaintext);
  const cid = await ipfs.pin(encrypt(plaintext), req.file.originalname);

  const tx = await recordRegistry.connect(req.wallet).addRecord(cid, fileHash);
  const receipt = await tx.wait();
  const added = receipt.logs
    .map((log) => recordRegistry.interface.parseLog(log))
    .find((parsed) => parsed?.name === "RecordAdded");
  const recordId = added.args.recordId.toString();

  store.setLabel(recordId, (req.body.label || "").trim() || req.file.originalname);
  res.json({
    recordId,
    cid,
    txHash: tx.hash,
    uploadedAt: new Date(Number(added.args.timestamp) * 1000).toISOString(),
  });
}));

router.get("/records/mine", requireAuth("patient"), wrap(async (req, res) => {
  const ids = await recordRegistry.getRecordsByOwner(req.wallet.address);
  const asOwner = recordRegistry.connect(req.wallet);
  const records = [];
  for (const id of ids) {
    const record = await asOwner.getRecord(id);
    records.push({
      recordId: id.toString(),
      label: store.getLabel(id.toString()),
      uploadedAt: new Date(Number(record.timestamp) * 1000).toISOString(),
      authorizedDoctors: await authorizedDoctors(id),
      cid: record.cid,
    });
  }
  res.json(records);
}));

router.post("/records/:id/grant", requireAuth("patient"), parseRecordId, requireDoctorAddress, wrap(async (req, res) => {
  const tx = await recordRegistry.connect(req.wallet).grantAccess(req.recordId, req.doctorAddress);
  await tx.wait();
  res.json({ txHash: tx.hash, status: "granted" });
}));

router.post("/records/:id/revoke", requireAuth("patient"), parseRecordId, requireDoctorAddress, wrap(async (req, res) => {
  const tx = await recordRegistry.connect(req.wallet).revokeAccess(req.recordId, req.doctorAddress);
  await tx.wait();
  res.json({ txHash: tx.hash, status: "revoked" });
}));

router.get("/records/:id/access-check", requireAuth(), parseRecordId, wrap(async (req, res) => {
  try {
    const authorized = await recordRegistry.checkAccess(req.wallet.address, req.recordId);
    res.json({ authorized });
  } catch (err) {
    if (err?.revert?.name === "RecordDoesNotExist") return res.json({ authorized: false });
    throw err;
  }
}));

// The contract itself gates this call (getRecord reverts for anyone not authorized),
// so the backend cannot hand out a file the chain has not approved.
router.get("/records/:id/view", requireAuth(), parseRecordId, wrap(async (req, res) => {
  const record = await recordRegistry.connect(req.wallet).getRecord(req.recordId);
  const plaintext = decrypt(await ipfs.fetchByCid(record.cid));
  if (sha256Hex(plaintext) !== record.fileHash) {
    return res.status(500).json({ error: "INTEGRITY_CHECK_FAILED" });
  }
  res.json({
    recordId: req.recordId.toString(),
    label: store.getLabel(req.recordId.toString()),
    content: plaintext.toString("utf8"),
  });
}));

router.use((err, req, res, next) => {
  const known = contractFailure(err);
  if (known) return res.status(known[0]).json({ error: known[1] });
  if (err instanceof multer.MulterError) return res.status(400).json({ error: "UPLOAD_ERROR", message: err.message });
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: err.shortMessage || err.message });
});

module.exports = router;

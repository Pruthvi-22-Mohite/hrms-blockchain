const path = require("path");
const { ethers } = require("ethers");
const cfg = require("./config");

function abiOf(name) {
  return require(path.join(cfg.artifactsDir, "contracts", `${name}.sol`, `${name}.json`)).abi;
}

// cacheTimeout -1: ethers otherwise caches RPC answers for 250ms, so back-to-back
// transactions from one wallet reuse a stale nonce and fail with "nonce has already been used".
const provider = new ethers.JsonRpcProvider(cfg.rpcUrl, undefined, { cacheTimeout: -1 });
const admin = new ethers.Wallet(cfg.adminPrivateKey, provider);

const userRegistry = new ethers.Contract(cfg.userRegistryAddress, abiOf("UserRegistry"), provider);
const recordRegistry = new ethers.Contract(cfg.recordRegistryAddress, abiOf("RecordRegistry"), provider);

// Admin transactions are queued one at a time so concurrent logins can't collide on the nonce.
let adminQueue = Promise.resolve();
function runAsAdmin(task) {
  const result = adminQueue.then(task);
  adminQueue = result.catch(() => {});
  return result;
}

// Demo simplification: the backend holds each user's wallet. The key is derived
// deterministically from name + role, so the same login always maps to the same address.
function walletFor(name, role) {
  const seed = `${cfg.jwtSecret}|${role}|${name.trim().toLowerCase()}`;
  return new ethers.Wallet(ethers.keccak256(ethers.toUtf8Bytes(seed)), provider);
}

const MIN_BALANCE = ethers.parseEther("0.1");

// Simultaneous first logins for the same wallet share one registration attempt.
const registrations = new Map();
function ensureRegistered(wallet, role) {
  const key = `${role}:${wallet.address}`;
  if (!registrations.has(key)) {
    const attempt = register(wallet, role).finally(() => registrations.delete(key));
    registrations.set(key, attempt);
  }
  return registrations.get(key);
}

async function register(wallet, role) {
  if (role === "patient") {
    if (await userRegistry.isPatient(wallet.address)) return;
    if ((await provider.getBalance(wallet.address)) < MIN_BALANCE) {
      await runAsAdmin(async () => {
        const tx = await admin.sendTransaction({ to: wallet.address, value: ethers.parseEther("1") });
        await tx.wait();
      });
    }
    await (await userRegistry.connect(wallet).registerAsPatient()).wait();
  } else {
    if (await userRegistry.isDoctor(wallet.address)) return;
    await runAsAdmin(async () => {
      await (await userRegistry.connect(admin).registerDoctor(wallet.address)).wait();
    });
  }
}

module.exports = { provider, userRegistry, recordRegistry, walletFor, ensureRegistered };

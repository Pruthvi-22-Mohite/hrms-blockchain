const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see backend/.env.example)`);
  return value;
}

const encryptionKey = Buffer.from(required("ENCRYPTION_KEY"), "hex");
if (encryptionKey.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  userRegistryAddress: required("USER_REGISTRY_ADDRESS"),
  recordRegistryAddress: required("RECORD_REGISTRY_ADDRESS"),
  adminPrivateKey: required("ADMIN_PRIVATE_KEY"),
  jwtSecret: required("JWT_SECRET"),
  encryptionKey,
  pinataJwt: process.env.PINATA_JWT || "",
  pinataGateway: (process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud").replace(/\/$/, ""),
  artifactsDir: process.env.ARTIFACTS_DIR || path.join(__dirname, "..", "..", "contracts", "artifacts"),
};

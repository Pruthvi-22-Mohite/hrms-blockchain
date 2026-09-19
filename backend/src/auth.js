const jwt = require("jsonwebtoken");
const { jwtSecret } = require("./config");
const { walletFor, ensureRegistered } = require("./chain");
const store = require("./store");

const ROLES = ["patient", "doctor"];

async function login(req, res) {
  const { name, role } = req.body || {};
  if (typeof name !== "string" || !name.trim() || !ROLES.includes(role)) {
    return res.status(400).json({ error: "INVALID_LOGIN", message: "name and role ('patient' | 'doctor') are required" });
  }
  const cleanName = name.trim();
  const wallet = walletFor(cleanName, role);
  await ensureRegistered(wallet, role);
  store.setName(wallet.address, cleanName);

  const token = jwt.sign({ name: cleanName, role }, jwtSecret, { expiresIn: "8h" });
  res.json({
    token,
    role,
    walletAddress: wallet.address,
    userId: `u_${wallet.address.slice(2, 8).toLowerCase()}`,
    name: cleanName,
  });
}

function requireAuth(...allowedRoles) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    let claims;
    try {
      claims = jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }
    if (allowedRoles.length && !allowedRoles.includes(claims.role)) {
      return res.status(403).json({ error: "WRONG_ROLE" });
    }
    req.user = claims;
    req.wallet = walletFor(claims.name, claims.role);
    next();
  };
}

module.exports = { login, requireAuth };

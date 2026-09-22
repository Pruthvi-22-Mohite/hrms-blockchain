# Healthcare Record Management System using Blockchain

Course project (Blockchain) — patient medical records secured via Ethereum smart contracts, with encrypted files stored off-chain on IPFS and on-chain consent management for doctor access.

## Team

- **Contracts + Backend:** Raghav
- **Frontend:** Pruthviraj
- **Research paper + patent prior-art:** Khushi, Pranjal

## What this is

Patients upload records → files are encrypted and pinned to IPFS → only the file hash + access permissions are written on-chain. A doctor can view a record only if the smart contract confirms they've been granted access, and the patient can revoke that access at any time — enforced on-chain, not just in the UI.

**Demo flow:** patient uploads a record → grants a doctor access → doctor retrieves it (access checked on-chain) → patient revokes access → doctor's next request is denied, live.

## Folder structure

```
hrms-blockchain/
├── contracts/    # Solidity contracts + Hardhat project (UserRegistry, RecordRegistry)
├── backend/      # Express API — wraps ethers.js calls, IPFS upload/retrieve, auth
├── frontend/     # React app — patient & doctor dashboards
├── docs/         # architecture notes, API contract, meeting notes
└── README.md
```

## Getting started

Each folder is an independent project — install and run separately.

### Contracts

```bash
cd contracts
npm install
npx hardhat test
npx hardhat node          # local chain, keep running in its own terminal
npx hardhat run scripts/deploy.js --network localhost
```

### Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in contract addresses, Pinata keys, etc.
npm run dev
```

#### Setting up a Pinata account (IPFS pinning)

Records are encrypted and pinned to IPFS via [Pinata](https://pinata.cloud). To get a JWT for `.env`:

1. Sign up at [app.pinata.cloud](https://app.pinata.cloud) (free tier is enough for the demo).
2. Go to **API Keys** (left sidebar) → **New Key**.
3. Give it **Admin** permissions (or at least `pinFileToIPFS` / files write access), name it something like `hrms-dev`, and create it.
4. Copy the **JWT** shown — it's only displayed once, so save it now.
5. Paste it into `backend/.env` as `PINATA_JWT`.
6. `PINATA_GATEWAY` can stay as the default public gateway (`https://gateway.pinata.cloud`) unless you set up a dedicated gateway on Pinata.

If `PINATA_JWT` is left empty, the backend falls back to storing files in a local folder instead of IPFS — useful for quick local testing without a Pinata account.

#### Filling in `backend/.env`

| Variable | Where it comes from |
| --- | --- |
| `PORT` | Leave as `4000` unless it's taken. |
| `RPC_URL` | `http://127.0.0.1:8545` for a local Hardhat node. |
| `USER_REGISTRY_ADDRESS` / `RECORD_REGISTRY_ADDRESS` | Printed by `npx hardhat run scripts/deploy.js --network localhost` in `contracts/` — redeploy and re-copy these any time you restart the Hardhat node. |
| `ADMIN_PRIVATE_KEY` | Hardhat account #0's key, printed by `npx hardhat node` (already filled in `.env.example` — it's a well-known test key, never use it outside a local chain). |
| `JWT_SECRET` | Any long random string, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ENCRYPTION_KEY` | 32 random bytes as hex: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `PINATA_JWT` / `PINATA_GATEWAY` | From the Pinata setup above. |

Keep `contracts/`, `backend/`, and `frontend/` running in separate terminals (`npx hardhat node`, backend `npm run dev`, frontend `npm run dev`) — the backend and frontend both depend on the local chain staying up.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env.local` to point at the backend (or a mock server while the backend is still in progress).

## Docs

- `docs/PRD.md` — requirements, scope, success criteria for the midsem demo
- `docs/architecture.md` — full technical architecture, build order, and API contract
- API contract for the frontend — also see the shared frontend brief (linked in the team chat)

## Branching

- `main` is always demo-able — don't push broken code straight to it.
- Work on feature branches (`feature/record-registry-contract`, `feature/patient-dashboard`) and merge into `main` once working.

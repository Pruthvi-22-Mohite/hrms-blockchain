# Healthcare Record Management System using Blockchain

Course project (Blockchain) — patient medical records secured via Ethereum smart contracts, with encrypted files stored off-chain on IPFS and on-chain consent management for doctor access.

## Team

- **Contracts + Backend:** Raghav
- **Frontend:** Pruthviraj
- **Research paper + patent prior-art:** two other teammates

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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `frontend/.env.local` to point at the backend (or a mock server while the backend is still in progress).

## Docs

- `docs/architecture.md` — full technical architecture and build order
- API contract for the frontend — see the shared frontend brief (linked in the team chat)

## Branching

- `main` is always demo-able — don't push broken code straight to it.
- Work on feature branches (`feature/record-registry-contract`, `feature/patient-dashboard`) and merge into `main` once working.

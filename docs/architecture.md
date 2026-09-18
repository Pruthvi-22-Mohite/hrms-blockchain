# Healthcare Record Management System using Blockchain — Technical Architecture & Build Plan

Stack decision: Ethereum (Solidity + Hardhat/Ganache local network). Target: end-to-end working demo for midsem review.

## Architecture layers

1. **Blockchain layer (Solidity, local Hardhat network)**
   - `UserRegistry.sol` — maps wallet addresses to roles (Patient, Doctor, Hospital Admin). Use OpenZeppelin `AccessControl` for role management.
   - `RecordRegistry.sol` — for each medical record: owner (patient address), IPFS CID, file hash (SHA-256), timestamp, list of addresses currently authorized to access it. Emits events (`RecordAdded`, `AccessGranted`, `AccessRevoked`) for the audit trail — this event log is your "immutability" selling point in the demo.
   - Consent functions: `grantAccess(doctorAddress, recordId)`, `revokeAccess(doctorAddress, recordId)`, `checkAccess(address, recordId)`. All access checks happen on-chain so no one can bypass consent from the backend.

2. **Off-chain file storage (IPFS)**
   - Blockchain never stores the actual file (too expensive/slow) — only the hash + CID pointer.
   - Use Pinata's free tier (hosted IPFS pinning) instead of running your own IPFS daemon — much faster to get working before midsem than self-hosting.
   - Encrypt the file (AES, symmetric key) before upload, so even if someone finds the CID they can't read the record.

3. **Backend (Node.js + Express)**
   - Wraps `ethers.js` calls to the deployed contracts.
   - Handles: file upload → encrypt → push to IPFS → write CID+hash to `RecordRegistry` → return tx hash.
   - Simple JWT-based login mapping user accounts to wallet addresses (for demo, backend can hold/manage wallets so you don't need every panel member to install MetaMask).

4. **Frontend (React)**
   - Patient dashboard: upload record, view own records, grant/revoke doctor access.
   - Doctor dashboard: request access, view authorized records only.
   - Keep it functional over polished — the guide is assessing the flow and blockchain logic, not UI design.

5. **Off-chain database (MongoDB or Postgres, optional but recommended)**
   - Non-sensitive indexing only: user profile info, appointment metadata, which records exist for quick listing. Keeps the chain lean — chain holds hash/consent/audit trail, DB holds convenience lookups.

## Data flow (this is your demo script)

1. Patient logs in, uploads a record → backend encrypts it → uploads to IPFS (Pinata) → gets CID → backend calls `RecordRegistry.addRecord(cid, hash)` → tx confirmed, record now immutably logged.
2. Patient grants a specific doctor access via `grantAccess()`.
3. Doctor logs in, requests the record → backend calls `checkAccess()` on-chain → if authorized, fetches from IPFS, decrypts, returns to doctor.
4. Patient revokes access via `revokeAccess()` → doctor's next request is denied on-chain → show this live, it's the clearest proof the system works.

## Build order

1. `npx hardhat init` — set up project, install OpenZeppelin contracts.
2. Write `UserRegistry.sol` and `RecordRegistry.sol`, write Hardhat tests (mocha/chai) for grant/revoke/access-check logic before touching the frontend — get the contract logic solid first.
3. Deploy to local Hardhat network (or Ganache), confirm via Hardhat console.
4. Set up Pinata account, wire up `ipfs-http-client` (or Pinata's SDK) in the backend for upload/retrieve.
5. Build Express backend: auth, upload endpoint, grant/revoke endpoints, retrieve endpoint — all calling the contract via ethers.js.
6. Build React frontend: two dashboards (patient, doctor), wire to backend API.
7. Add AES encryption for files before IPFS upload (flag key management as a "future work" item — proper solution would be threshold/proxy re-encryption, out of scope for midsem).
8. Rehearse the demo flow above end-to-end at least twice before the review.

## Points to explicitly flag to the guide as future work / discussion points

- Key management for encryption (currently simplified for demo).
- Gas costs / scalability if moved to a public chain (mainnet vs. permissioned network like Hyperledger Fabric).
- Compliance mapping (HIPAA-style / India's DPDP Act) — good material for the research paper's discussion section.
- Interoperability with healthcare data standards (HL7/FHIR) — also strong paper material and possibly patent angle (novelty could center on the consent-revocation audit trail design).

## Team split

- 2 members on implementation: contracts + backend (Person A), frontend (Person B).
- 2 members on research paper: lit review, methodology write-up, patent prior-art search — their output should reference this same architecture so the paper and implementation stay consistent.

## API contract (frontend <-> backend)

See the shared frontend brief for the full contract with request/response bodies. Summary of endpoints:

- `POST /auth/login`
- `POST /records/upload` (patient)
- `GET /records/mine` (patient)
- `POST /records/:id/grant` (patient)
- `POST /records/:id/revoke` (patient)
- `GET /records/:id/access-check` (doctor)
- `GET /records/:id/view` (doctor, if authorized)

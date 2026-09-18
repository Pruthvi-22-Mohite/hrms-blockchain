# PRD — Healthcare Record Management System using Blockchain

## Overview

A system that lets patients store medical records securely and control exactly who can access them, using a blockchain to enforce consent instead of relying on a central authority to honor access rules. Built as a course project for the Blockchain subject; also the basis for a research paper and, potentially, a patent.

## Problem statement

Medical records today live in siloed hospital systems. Patients have little visibility or control over who has accessed their data, and there's no tamper-evident audit trail of access grants and revocations. A blockchain-backed access-control layer can make consent enforceable and auditable without a single trusted intermediary controlling it.

## Users

- **Patient** — owns their records, uploads them, decides which doctors can view them, can revoke access at any time.
- **Doctor** — requests/receives access to a specific patient's record, can only view what's been explicitly granted.
- **(Future) Hospital Admin** — manages doctor accounts/roles. Out of scope for the midsem demo.

## Goals

- **Midsem review**: a working end-to-end demo proving the core mechanism — upload, grant, view, revoke, deny — running on a local blockchain network.
- **End of semester**: research paper covering the architecture, related work, and evaluation; patent prior-art search and (if it holds up) a filing centered on the consent/audit-trail mechanism.

## Core features (MVP — required for midsem)

1. Patient uploads a medical record (file), which is encrypted and stored off-chain (IPFS); its hash and metadata are written on-chain.
2. Patient views their own list of uploaded records and who currently has access to each.
3. Patient grants a specific doctor access to a specific record.
4. Patient revokes a doctor's access to a specific record.
5. Doctor requests to view a record; access is checked on-chain before anything is returned.
6. All grant/revoke/upload actions are logged as on-chain events (the audit trail).

## Non-functional requirements

- **Consent enforcement must happen on-chain**, not just in application logic — the whole point is that access control can't be silently bypassed by the backend.
- **Files are encrypted before leaving the patient's control path** — the chain and IPFS never hold a readable record.
- **Every access grant/revoke is auditable** — event logs, not just current state, so "who could see this and when" is answerable later.

## Explicitly out of scope for midsem

- Real hospital-system integration / HL7 / FHIR interoperability.
- Production-grade key management (demo uses a simplified encryption key flow).
- Mainnet deployment or gas-cost optimization — local Hardhat network is sufficient.
- Hospital Admin role and multi-hospital support.

## Success criteria (demo acceptance)

The reviewing guide sees, live: a patient uploading a record, granting a doctor access, the doctor successfully viewing it, the patient revoking access, and the doctor being denied on their next attempt — with the grant/revoke visibly happening via blockchain transactions, not just database flags.

## Open questions / discussion points for the guide

- Key management approach for production (current: simplified for demo).
- Public chain vs. permissioned network (e.g. Hyperledger Fabric) trade-offs at scale.
- Compliance mapping (HIPAA-style / India's DPDP Act) — feeds the paper's discussion section.
- Patent novelty angle: likely centers on the consent-revocation audit trail design rather than blockchain-for-healthcare generally (that's well-trodden prior art).

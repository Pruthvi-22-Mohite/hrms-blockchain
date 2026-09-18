// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./UserRegistry.sol";

/// @title RecordRegistry
/// @notice Stores pointers (IPFS CID + file hash) to encrypted medical records
///         and enforces on-chain consent for who may access each one. The
///         blockchain never holds the file itself — only the hash/CID and the
///         access-control state, plus an immutable event log of every grant,
///         revoke, and upload as the audit trail.
contract RecordRegistry {
    UserRegistry public immutable userRegistry;

    struct Record {
        address owner; // patient who owns this record
        string cid; // IPFS content identifier of the encrypted file
        bytes32 fileHash; // SHA-256 hash of the (unencrypted) file, for integrity checks
        uint256 timestamp; // block timestamp the record was added
        bool exists;
    }

    // recordId => Record
    mapping(uint256 => Record) private records;
    // recordId => doctor address => authorized?
    mapping(uint256 => mapping(address => bool)) private authorizedAccess;
    // patient address => list of record IDs they own (for listing "my records")
    mapping(address => uint256[]) private recordsByOwner;

    uint256 private nextRecordId = 1;

    event RecordAdded(uint256 indexed recordId, address indexed owner, string cid, bytes32 fileHash, uint256 timestamp);
    event AccessGranted(uint256 indexed recordId, address indexed owner, address indexed doctor);
    event AccessRevoked(uint256 indexed recordId, address indexed owner, address indexed doctor);

    error NotAPatient(address account);
    error NotADoctor(address account);
    error RecordDoesNotExist(uint256 recordId);
    error NotRecordOwner(uint256 recordId, address caller);

    modifier onlyPatient() {
        if (!userRegistry.isPatient(msg.sender)) revert NotAPatient(msg.sender);
        _;
    }

    modifier onlyDoctor() {
        if (!userRegistry.isDoctor(msg.sender)) revert NotADoctor(msg.sender);
        _;
    }

    modifier recordExists(uint256 recordId) {
        if (!records[recordId].exists) revert RecordDoesNotExist(recordId);
        _;
    }

    modifier onlyRecordOwner(uint256 recordId) {
        if (records[recordId].owner != msg.sender) revert NotRecordOwner(recordId, msg.sender);
        _;
    }

    constructor(address userRegistryAddress) {
        userRegistry = UserRegistry(userRegistryAddress);
    }

    /// @notice Adds a new record pointer for the calling patient. The actual
    ///         file must already be encrypted and pinned to IPFS by the caller
    ///         (backend) before this is called — this only logs the pointer.
    function addRecord(string calldata cid, bytes32 fileHash) external onlyPatient returns (uint256 recordId) {
        recordId = nextRecordId++;
        records[recordId] = Record({
            owner: msg.sender,
            cid: cid,
            fileHash: fileHash,
            timestamp: block.timestamp,
            exists: true
        });
        recordsByOwner[msg.sender].push(recordId);

        emit RecordAdded(recordId, msg.sender, cid, fileHash, block.timestamp);
    }

    /// @notice Patient grants a doctor access to one of their records.
    function grantAccess(uint256 recordId, address doctor)
        external
        onlyPatient
        recordExists(recordId)
        onlyRecordOwner(recordId)
    {
        if (!userRegistry.isDoctor(doctor)) revert NotADoctor(doctor);
        authorizedAccess[recordId][doctor] = true;
        emit AccessGranted(recordId, msg.sender, doctor);
    }

    /// @notice Patient revokes a doctor's access to one of their records.
    ///         After this, checkAccess(doctor, recordId) returns false immediately —
    ///         there is no grace period or cached permission.
    function revokeAccess(uint256 recordId, address doctor)
        external
        onlyPatient
        recordExists(recordId)
        onlyRecordOwner(recordId)
    {
        authorizedAccess[recordId][doctor] = false;
        emit AccessRevoked(recordId, msg.sender, doctor);
    }

    /// @notice Returns whether `account` currently has access to `recordId`.
    ///         The record owner always has access to their own record.
    function checkAccess(address account, uint256 recordId) public view recordExists(recordId) returns (bool) {
        if (records[recordId].owner == account) return true;
        return authorizedAccess[recordId][account];
    }

    /// @notice Returns the record's pointer data, if the caller is authorized.
    ///         Reverts if the caller (owner or granted doctor) is not authorized —
    ///         this is the on-chain gate the backend must pass before it will
    ///         fetch/decrypt the file from IPFS.
    function getRecord(uint256 recordId)
        external
        view
        recordExists(recordId)
        returns (address owner, string memory cid, bytes32 fileHash, uint256 timestamp)
    {
        require(checkAccess(msg.sender, recordId), "RecordRegistry: caller not authorized");
        Record storage r = records[recordId];
        return (r.owner, r.cid, r.fileHash, r.timestamp);
    }

    /// @notice Lists the record IDs owned by `patient` (for the patient's own dashboard).
    function getRecordsByOwner(address patient) external view returns (uint256[] memory) {
        return recordsByOwner[patient];
    }
}

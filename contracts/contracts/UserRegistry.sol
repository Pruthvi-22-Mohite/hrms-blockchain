// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title UserRegistry
/// @notice Maps wallet addresses to roles (Patient, Doctor, Hospital Admin)
///         for the Healthcare Record Management System. Role membership here
///         is what RecordRegistry consults before allowing any record action.
contract UserRegistry is AccessControl {
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant HOSPITAL_ADMIN_ROLE = keccak256("HOSPITAL_ADMIN_ROLE");

    /// @notice Emitted whenever a role is granted or revoked via this registry's
    ///         convenience functions (in addition to AccessControl's own events).
    event PatientRegistered(address indexed account);
    event DoctorRegistered(address indexed account);
    event HospitalAdminRegistered(address indexed account);

    /// @param admin Address that receives DEFAULT_ADMIN_ROLE and HOSPITAL_ADMIN_ROLE
    ///        at deployment (the deployer, for the demo).
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(HOSPITAL_ADMIN_ROLE, admin);
    }

    /// @notice Self-registration as a patient. Anyone can register themselves
    ///         as a patient — patients own their own data, no gatekeeping needed.
    function registerAsPatient() external {
        _grantRole(PATIENT_ROLE, msg.sender);
        emit PatientRegistered(msg.sender);
    }

    /// @notice Registers `account` as a doctor. Restricted to hospital admins
    ///         so not just anyone can claim to be a doctor.
    function registerDoctor(address account) external onlyRole(HOSPITAL_ADMIN_ROLE) {
        _grantRole(DOCTOR_ROLE, account);
        emit DoctorRegistered(account);
    }

    /// @notice Registers `account` as an additional hospital admin.
    function registerHospitalAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(HOSPITAL_ADMIN_ROLE, account);
        emit HospitalAdminRegistered(account);
    }

    function isPatient(address account) external view returns (bool) {
        return hasRole(PATIENT_ROLE, account);
    }

    function isDoctor(address account) external view returns (bool) {
        return hasRole(DOCTOR_ROLE, account);
    }

    function isHospitalAdmin(address account) external view returns (bool) {
        return hasRole(HOSPITAL_ADMIN_ROLE, account);
    }
}

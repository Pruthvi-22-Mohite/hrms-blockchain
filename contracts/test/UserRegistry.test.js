const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry", function () {
  let userRegistry;
  let admin, patient, doctor, other;

  beforeEach(async function () {
    [admin, patient, doctor, other] = await ethers.getSigners();
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy(admin.address);
  });

  it("grants the deployer admin DEFAULT_ADMIN_ROLE and HOSPITAL_ADMIN_ROLE", async function () {
    const defaultAdminRole = await userRegistry.DEFAULT_ADMIN_ROLE();
    expect(await userRegistry.hasRole(defaultAdminRole, admin.address)).to.equal(true);
    expect(await userRegistry.isHospitalAdmin(admin.address)).to.equal(true);
  });

  it("lets anyone self-register as a patient", async function () {
    await expect(userRegistry.connect(patient).registerAsPatient())
      .to.emit(userRegistry, "PatientRegistered")
      .withArgs(patient.address);
    expect(await userRegistry.isPatient(patient.address)).to.equal(true);
  });

  it("lets a hospital admin register a doctor", async function () {
    await expect(userRegistry.connect(admin).registerDoctor(doctor.address))
      .to.emit(userRegistry, "DoctorRegistered")
      .withArgs(doctor.address);
    expect(await userRegistry.isDoctor(doctor.address)).to.equal(true);
  });

  it("rejects doctor registration from a non-admin", async function () {
    await expect(userRegistry.connect(other).registerDoctor(doctor.address)).to.be.reverted;
    expect(await userRegistry.isDoctor(doctor.address)).to.equal(false);
  });

  it("lets the default admin register a new hospital admin", async function () {
    await expect(userRegistry.connect(admin).registerHospitalAdmin(other.address))
      .to.emit(userRegistry, "HospitalAdminRegistered")
      .withArgs(other.address);
    expect(await userRegistry.isHospitalAdmin(other.address)).to.equal(true);
  });

  it("rejects hospital admin registration from a non-default-admin", async function () {
    await expect(userRegistry.connect(doctor).registerHospitalAdmin(other.address)).to.be.reverted;
    expect(await userRegistry.isHospitalAdmin(other.address)).to.equal(false);
  });
});

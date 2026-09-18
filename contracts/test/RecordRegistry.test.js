const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RecordRegistry", function () {
  let userRegistry, recordRegistry;
  let admin, patient, doctor, otherDoctor, stranger;

  const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const fileHash = ethers.keccak256(ethers.toUtf8Bytes("test file contents"));

  beforeEach(async function () {
    [admin, patient, doctor, otherDoctor, stranger] = await ethers.getSigners();

    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy(admin.address);

    const RecordRegistry = await ethers.getContractFactory("RecordRegistry");
    recordRegistry = await RecordRegistry.deploy(await userRegistry.getAddress());

    await userRegistry.connect(patient).registerAsPatient();
    await userRegistry.connect(admin).registerDoctor(doctor.address);
    await userRegistry.connect(admin).registerDoctor(otherDoctor.address);
  });

  describe("addRecord", function () {
    it("lets a registered patient add a record and emits RecordAdded", async function () {
      const tx = await recordRegistry.connect(patient).addRecord(cid, fileHash);
      await expect(tx).to.emit(recordRegistry, "RecordAdded");

      const ids = await recordRegistry.getRecordsByOwner(patient.address);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1n);
    });

    it("rejects addRecord from a non-patient", async function () {
      await expect(recordRegistry.connect(stranger).addRecord(cid, fileHash)).to.be.revertedWithCustomError(
        recordRegistry,
        "NotAPatient"
      );
    });
  });

  describe("grantAccess / checkAccess", function () {
    let recordId;

    beforeEach(async function () {
      await recordRegistry.connect(patient).addRecord(cid, fileHash);
      recordId = 1n;
    });

    it("owner always has access to their own record", async function () {
      expect(await recordRegistry.checkAccess(patient.address, recordId)).to.equal(true);
    });

    it("doctor has no access before being granted", async function () {
      expect(await recordRegistry.checkAccess(doctor.address, recordId)).to.equal(false);
    });

    it("lets the owner grant a doctor access and emits AccessGranted", async function () {
      await expect(recordRegistry.connect(patient).grantAccess(recordId, doctor.address))
        .to.emit(recordRegistry, "AccessGranted")
        .withArgs(recordId, patient.address, doctor.address);

      expect(await recordRegistry.checkAccess(doctor.address, recordId)).to.equal(true);
    });

    it("rejects granting access to an address that is not a registered doctor", async function () {
      await expect(recordRegistry.connect(patient).grantAccess(recordId, stranger.address)).to.be.revertedWithCustomError(
        recordRegistry,
        "NotADoctor"
      );
    });

    it("rejects grantAccess from a different patient who does not own the record", async function () {
      await userRegistry.connect(stranger).registerAsPatient();
      await expect(recordRegistry.connect(stranger).grantAccess(recordId, doctor.address)).to.be.revertedWithCustomError(
        recordRegistry,
        "NotRecordOwner"
      );
    });

    it("rejects grantAccess for a record that does not exist", async function () {
      await expect(recordRegistry.connect(patient).grantAccess(999, doctor.address)).to.be.revertedWithCustomError(
        recordRegistry,
        "RecordDoesNotExist"
      );
    });
  });

  describe("revokeAccess — the grant then deny flow", function () {
    let recordId;

    beforeEach(async function () {
      await recordRegistry.connect(patient).addRecord(cid, fileHash);
      recordId = 1n;
      await recordRegistry.connect(patient).grantAccess(recordId, doctor.address);
    });

    it("doctor can access the record once granted", async function () {
      expect(await recordRegistry.checkAccess(doctor.address, recordId)).to.equal(true);
      const record = await recordRegistry.connect(doctor).getRecord(recordId);
      expect(record.cid).to.equal(cid);
    });

    it("revoking access emits AccessRevoked and immediately denies the doctor", async function () {
      await expect(recordRegistry.connect(patient).revokeAccess(recordId, doctor.address))
        .to.emit(recordRegistry, "AccessRevoked")
        .withArgs(recordId, patient.address, doctor.address);

      expect(await recordRegistry.checkAccess(doctor.address, recordId)).to.equal(false);
      await expect(recordRegistry.connect(doctor).getRecord(recordId)).to.be.revertedWith(
        "RecordRegistry: caller not authorized"
      );
    });

    it("rejects revokeAccess from a different patient who does not own the record", async function () {
      await userRegistry.connect(stranger).registerAsPatient();
      await expect(recordRegistry.connect(stranger).revokeAccess(recordId, doctor.address)).to.be.revertedWithCustomError(
        recordRegistry,
        "NotRecordOwner"
      );
    });
  });

  describe("getRecord", function () {
    it("reverts for an unauthorized caller", async function () {
      await recordRegistry.connect(patient).addRecord(cid, fileHash);
      await expect(recordRegistry.connect(stranger).getRecord(1)).to.be.revertedWith(
        "RecordRegistry: caller not authorized"
      );
    });

    it("returns full record data for the owner", async function () {
      await recordRegistry.connect(patient).addRecord(cid, fileHash);
      const record = await recordRegistry.connect(patient).getRecord(1);
      expect(record.owner).to.equal(patient.address);
      expect(record.cid).to.equal(cid);
      expect(record.fileHash).to.equal(fileHash);
    });
  });

  describe("getRecordsByOwner", function () {
    it("lists multiple records for the same owner in order added", async function () {
      await recordRegistry.connect(patient).addRecord(cid, fileHash);
      await recordRegistry.connect(patient).addRecord("secondcid", fileHash);
      const ids = await recordRegistry.getRecordsByOwner(patient.address);
      expect(ids).to.deep.equal([1n, 2n]);
    });

    it("returns an empty list for an address with no records", async function () {
      const ids = await recordRegistry.getRecordsByOwner(stranger.address);
      expect(ids.length).to.equal(0);
    });
  });
});

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pinataJwt, pinataGateway } = require("./config");

// With no PINATA_JWT set, files go to a local folder under a fake CID so the
// whole flow can be developed and tested offline.
const localDir = path.join(__dirname, "..", ".local-ipfs");
const usePinata = Boolean(pinataJwt);

async function pin(buffer, fileName) {
  if (!usePinata) {
    const cid = "localcid" + crypto.createHash("sha256").update(buffer).digest("hex");
    fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, cid), buffer);
    return cid;
  }
  const form = new FormData();
  form.append("file", new Blob([buffer]), fileName);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileWithMetadata", {
    method: "POST",
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Pinata upload failed: ${res.status} ${await res.text()}`);
  const { IpfsHash } = await res.json();
  return IpfsHash;
}

async function fetchByCid(cid) {
  if (!usePinata) {
    return fs.readFileSync(path.join(localDir, path.basename(cid)));
  }
  const res = await fetch(`${pinataGateway}/ipfs/${cid}`);
  if (!res.ok) throw new Error(`IPFS fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { pin, fetchByCid, usePinata };

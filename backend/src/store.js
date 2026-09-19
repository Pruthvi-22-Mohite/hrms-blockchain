const fs = require("fs");
const path = require("path");

// Off-chain index for non-sensitive convenience data the contract does not hold:
// record labels and wallet-address -> display-name lookups.
const file = path.join(__dirname, "..", "data", "store.json");

let data = { labels: {}, names: {} };
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {
  // first run: start empty
}

function save() {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  setLabel(recordId, label) {
    data.labels[recordId] = label;
    save();
  },
  getLabel(recordId) {
    return data.labels[recordId] || `Record ${recordId}`;
  },
  setName(address, name) {
    data.names[address.toLowerCase()] = name;
    save();
  },
  getName(address) {
    return data.names[address.toLowerCase()] || "Unknown";
  },
};

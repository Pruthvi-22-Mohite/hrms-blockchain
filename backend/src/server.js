const express = require("express");
const cors = require("cors");
const { port } = require("./config");
const routes = require("./routes");
const { usePinata } = require("./ipfs");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => res.json({ ok: true }));
app.use(routes);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port} (file storage: ${usePinata ? "Pinata/IPFS" : "local stub"})`);
});

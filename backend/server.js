const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express(); // ✅ initialize express app
const PORT = 5000;

app.use(cors());

app.get("/api/generate", (req, res) => {
  exec("node generateMenu.js", (error, stdout, stderr) => {
    if (error) {
      console.error("Generation error:", stderr);
      return res.status(500).json({ error: "Menu generation failed" });
    }
    res.json({ message: "Menu regenerated successfully" });
  });
});

app.get("/api/menu", (req, res) => {
  const outputFile = path.join(__dirname, "data", "output.json");

  fs.readFile(outputFile, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading output:", err);
      return res.status(500).json({ error: "Failed to read output" });
    }
    res.json(JSON.parse(data));
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});

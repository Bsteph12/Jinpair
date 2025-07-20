const express = require("express");
const startPairing = require("./pairing");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/pair", async (req, res) => {
  try {
    await startPairing();
    res.send("Pairing started. Check your WhatsApp to receive creds.json.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error during pairing.");
  }
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
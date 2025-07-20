const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const { Boom } = require("@hapi/boom");

async function startPairing() {
  const sessionFolder = path.join(__dirname, "..", "session");
  const credsPath = path.join(sessionFolder, "creds.json");
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

  const { state, saveState } = useSingleFileAuthState(credsPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Pairing-Bot", "Chrome", "1.0.0"],
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr, pairingCode }) => {
    if (connection === "open") {
      console.log("✅ Successfully paired.");

      const userJid = sock.user.id;
      const credsBuffer = fs.readFileSync(credsPath);

      await sock.sendMessage(userJid, {
        document: credsBuffer,
        mimetype: "application/json",
        fileName: "creds.json",
        caption: "Voici votre fichier creds.json. Déplacez-le dans le dossier 'session' de votre bot pour le démarrer."
      });

      await sock.logout();
    } else if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startPairing();
      }
    } else if (pairingCode) {
      console.log("🔗 Pairing code:", pairingCode);
    }
  });

  sock.ev.on("creds.update", saveState);
}

module.exports = startPairing;
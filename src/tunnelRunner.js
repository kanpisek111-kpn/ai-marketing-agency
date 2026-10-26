// src/tunnelRunner.js
// Rock-solid Cloudflare Tunnel Manager with auto-reconnection and URL persistence
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CLOUDFLARED_BIN = path.join(__dirname, "../cloudflared.exe");
const TUNNEL_FILE = path.join(__dirname, "../data/active_tunnel.txt");

let currentProcess = null;
let activeUrl = "";

function ensureDataDir() {
  const dir = path.dirname(TUNNEL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function startCloudflareTunnel() {
  ensureDataDir();
  console.log("🌐 [Cloudflare Tunnel] Starting Cloudflare Tunnel to http://localhost:3080...");

  currentProcess = spawn(CLOUDFLARED_BIN, [
    "tunnel",
    "--no-autoupdate",
    "--url", "http://localhost:3080"
  ]);

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      if (url !== activeUrl) {
        activeUrl = url;
        fs.writeFileSync(TUNNEL_FILE, activeUrl, "utf8");
        console.log(`\n============================================================`);
        console.log(`✅ [Cloudflare Ready] Rock-solid HTTPS Tunnel: ${activeUrl}`);
        console.log(`============================================================\n`);
      }
    }
  };

  currentProcess.stdout.on("data", handleOutput);
  currentProcess.stderr.on("data", handleOutput);

  currentProcess.on("close", (code) => {
    console.log(`⚠️ [Tunnel] Cloudflared exited (code ${code}). Restarting in 3s...`);
    setTimeout(startCloudflareTunnel, 3000);
  });

  currentProcess.on("error", (err) => {
    console.error("❌ [Tunnel Error]:", err.message);
  });
}

startCloudflareTunnel();

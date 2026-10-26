// server.js
// เซิร์ฟเวอร์หลักสำหรับระบบ AI Marketing Agency, แยกโปรเจกต์หลายเพจ (Multi-Project) & แจ้งเตือนความคืบหน้าผ่าน LINE OA

const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { ensureDB, saveDB, DEFAULT_AGENTS } = require("./src/store");
const { runAgentLLM } = require("./src/llmProvider");
const {
  formatPlatformPostingStatusLineMessage,
  formatCampaignStartLineMessage,
  formatStepProgressLineMessage,
  formatLiveStatusCheckLineMessage,
  formatCampaignLineSummary,
  sendLineReport,
  sendLineApprovalCard
} = require("./src/lineNotifier");
const {
  AGENT_TOOL_ECOSYSTEM,
  generateAutonomousBriefForBrand,
  generateCampaignVisualAssets,
  buildAgentConnectedToolsOutput
} = require("./src/agentIntegrations");
const {
  inspectChannelLinks,
  executeSocialPublish,
  extractFacebookPageIdFromUrl,
  extractCleanPostCaption
} = require("./src/socialPublisher");

const PORT = process.env.PORT || 3080;
const PUBLIC_DIR = path.join(__dirname, "public");

let db = ensureDB();
const sseClients = new Set();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

function broadcastEvent(type, payload) {
  const data = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(data);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// ฟังก์ชันช่วยส่งแจ้งเตือน LINE OA และบันทึกประวัติลง lineLogs พร้อม Broadcast SSE
async function pushLineNotificationAndLog({ campaign, titleSuffix, messageText }) {
  try {
    const lineResult = await sendLineReport({
      lineConfig: db.settings.line,
      messageText
    });

    const logEntry = {
      id: randomUUID(),
      campaignId: campaign?.id || null,
      brandId: campaign?.brandId || db.settings.activeBrandId,
      campaignTitle: `${campaign?.projectName ? `[${campaign.projectName}] ` : ""}${titleSuffix}`,
      timestamp: new Date().toISOString(),
      status: lineResult.success ? "sent" : "simulated",
      details: lineResult.message,
      preview: messageText
    };
    db.lineLogs.unshift(logEntry);
    saveDB(db);
    broadcastEvent("line_log_added", { logEntry, lineLogs: db.lineLogs });
    return lineResult;
  } catch (err) {
    const errEntry = {
      id: randomUUID(),
      campaignId: campaign?.id || null,
      brandId: campaign?.brandId || db.settings.activeBrandId,
      campaignTitle: `${campaign?.projectName ? `[${campaign.projectName}] ` : ""}${titleSuffix} (ขัดข้อง)`,
      timestamp: new Date().toISOString(),
      status: "error",
      details: err.message,
      preview: messageText
    };
    db.lineLogs.unshift(errEntry);
    saveDB(db);
    broadcastEvent("line_log_added", { logEntry: errEntry, lineLogs: db.lineLogs });
    return { success: false, message: err.message };
  }
}

function buildInitialPostingSteps(channels = {}, platforms = []) {
  const defaultTargets = [
    {
      platform: "Facebook",
      icon: "📘",
      targetUrl: channels.fbUrl || "https://facebook.com/YourPage"
    },
    {
      platform: "TikTok",
      icon: "🎵",
      targetUrl: channels.tiktokUrl || "https://tiktok.com/@yourchannel"
    },
    {
      platform: "Instagram",
      icon: "📸",
      targetUrl: channels.igUrl || "https://instagram.com/yourbrand"
    },
    {
      platform: "LINE OA",
      icon: "💬",
      targetUrl: channels.lineUrl || "https://lin.ee/yourbrand"
    }
  ];

  return defaultTargets.map((t) => ({
    platform: t.platform,
    icon: t.icon,
    targetUrl: t.targetUrl,
    status: "pending", // pending | posting | posted | error
    postedAt: null,
    note: "รอคิวโพสต์ลงเพจ"
  }));
}

// ฟังก์ชันสั่ง AI ไล่โพสต์ลงเพจทีละช่องทาง (FB -> TikTok -> IG -> LINE) พร้อมส่งแจ้งเตือนเข้า LINE OA ว่าเพจไหนโพสต์ไปแล้วบ้าง
async function executeSequentialPlatformPosting(campaignId, specificPlatform = null) {
  const campaign = db.campaigns.find((c) => c.id === campaignId);
  if (!campaign) return;

  if (!campaign.postingSteps || campaign.postingSteps.length === 0) {
    campaign.postingSteps = buildInitialPostingSteps(campaign.brief?.channels, campaign.brief?.platforms);
  }

  const brandProfile =
    db.brandProfiles.find((b) => b.id === (campaign.brandId || db.settings.activeBrandId)) ||
    db.brandProfiles[0];

  const copyStep =
    (campaign.steps || []).find((s) => s.agentId === "content_copywriter" && s.output) ||
    (campaign.steps || [])[0];
  const contentText = copyStep?.output || `โปรโมชันพิเศษจาก ${campaign.brief?.productName || "เพจของเรา"}`;

  const targetsToRun = specificPlatform
    ? campaign.postingSteps.filter((p) => p.platform === specificPlatform)
    : campaign.postingSteps;

  for (let i = 0; i < targetsToRun.length; i++) {
    const pStep = targetsToRun[i];
    pStep.status = "posting";
    pStep.note = `กำลังอัปโหลดและโพสต์ขึ้น ${pStep.platform}...`;

    // ถ้ามีช่องทางถัดไป ให้แสดงสถานะรอคิวชัดเจน
    campaign.logs.push({
      time: new Date().toLocaleTimeString("th-TH"),
      agentName: `Auto-Poster (${pStep.platform})`,
      avatar: pStep.icon,
      message: `⏳ กำลังโพสต์คอนเทนต์ลงช่องทาง ${pStep.platform} (${pStep.targetUrl || "-"})...`
    });
    saveDB(db);
    broadcastEvent("posting_updated", { campaignId: campaign.id, postingStep: pStep, campaign });

    // จำลองเวลาส่งขึ้นแพลตฟอร์มและเรียกใช้ Publisher
    await new Promise((r) => setTimeout(r, 900));

    try {
      const pubRes = await executeSocialPublish({
        brandProfile,
        platforms: [pStep.platform],
        contentText,
        campaignTitle: campaign.brief?.productName || "แคมเปญการตลาด",
        brief: campaign.brief,
        lineSettings: db.settings.line,
        visualAssets: campaign.visualAssets || generateCampaignVisualAssets(campaign, brandProfile)
      });

      const isSimulated = Boolean(pubRes?.[0]?.simulated);
      pStep.status = "posted";
      pStep.simulated = isSimulated;
      pStep.postedAt = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      pStep.note = pubRes?.[0]?.message || `โพสต์ลง ${pStep.platform} สำเร็จแล้ว`;

      if (!db.publishLogs) db.publishLogs = [];
      db.publishLogs.unshift({
        id: randomUUID(),
        brandId: campaign.brandId || db.settings.activeBrandId,
        timestamp: new Date().toISOString(),
        brandName: `${campaign.projectName || "เพจหลัก"} — ${pStep.platform}`,
        platforms: [pStep.platform],
        results: pubRes,
        contentPreview: extractCleanPostCaption(contentText, campaign.brief).slice(0, 350)
      });

      campaign.logs.push({
        time: new Date().toLocaleTimeString("th-TH"),
        agentName: `Auto-Poster (${pStep.platform})`,
        avatar: pStep.icon,
        message: isSimulated
          ? `⚠️ ${pStep.platform}: ${pStep.note} (เวลา ${pStep.postedAt})`
          : `✅ โพสต์ขึ้น ${pStep.platform} จริงสำเร็จเรียบร้อย! (เวลา ${pStep.postedAt})`
      });

      // ตั้งให้ตัวถัดไปขึ้นสถานะ "กำลังเตรียมโพสต์" เพื่อให้ในใบแจ้งเตือน LINE เห็นชัดว่ากำลังไปเพจไหนต่อ
      const nextPlatformStep = !specificPlatform ? targetsToRun[i + 1] : null;
      if (nextPlatformStep && nextPlatformStep.status === "pending") {
        nextPlatformStep.status = "posting";
      }

      saveDB(db);
      broadcastEvent("posting_updated", { campaignId: campaign.id, postingStep: pStep, campaign });

      // ส่งแจ้งเตือนเข้า LINE OA ทันทีว่าเพจนี้โพสต์เสร็จแล้ว และเพจอื่นโพสต์หรือยัง!
      if (db.settings.line?.enabled && db.settings.line?.notifyOnEachStep && nextPlatformStep) {
        const lineMsg = formatPlatformPostingStatusLineMessage({
          campaign,
          latestPlatform: pStep.platform,
          projectName: campaign.projectName,
          isFinal: false
        });
        await pushLineNotificationAndLog({
          campaign,
          titleSuffix: `📢 อัปเดตสถานะโพสต์ ${pStep.platform}`,
          messageText: lineMsg
        });
      }
    } catch (err) {
      pStep.status = "error";
      pStep.simulated = false;
      pStep.note = err.message;
      campaign.logs.push({
        time: new Date().toLocaleTimeString("th-TH"),
        agentName: `Auto-Poster (${pStep.platform})`,
        avatar: pStep.icon,
        message: `❌ โพสต์ลง ${pStep.platform} ไม่สำเร็จ: ${err.message}`
      });
      saveDB(db);
      broadcastEvent("posting_updated", { campaignId: campaign.id, postingStep: pStep, campaign });
    }
  }

  // เมื่อวิ่งครบทุกช่องทางแล้ว ส่งใบสรุปสถานะการโพสต์เข้า LINE OA เสมอ (เพื่อให้รู้ทันทีว่าเพจไหนโพสต์จริงสำเร็จ หรือเพจไหนติด Error)
  campaign.status = "completed";
  campaign.completedAt = new Date().toISOString();
  if (!specificPlatform && db.settings.line?.enabled && db.settings.line?.autoSendOnComplete) {
    const hasError = campaign.postingSteps.some((p) => p.status === "error");
    const finalPostMsg = formatPlatformPostingStatusLineMessage({
      campaign,
      latestPlatform: null,
      projectName: campaign.projectName,
      isFinal: true
    });
    const lineRes = await pushLineNotificationAndLog({
      campaign,
      titleSuffix: hasError
        ? `⚠️ สรุปผลโพสต์ลงเพจ (มีบางเพจติดปัญหาสิทธิ์ Token)`
        : `🎉 สรุปผลโพสต์ครบทุกช่องทาง (FB / TikTok / IG / LINE)`,
      messageText: finalPostMsg
    });
    campaign.lineReported = true;
    campaign.lineReportStatus = lineRes.message;
  }

  saveDB(db);
  broadcastEvent("campaign_completed", { campaign });
}
async function executeCampaignPipeline(campaignId) {
  const campaign = db.campaigns.find((c) => c.id === campaignId);
  if (!campaign) return;

  campaign.status = "running";
  campaign.updatedAt = new Date().toISOString();
  saveDB(db);
  broadcastEvent("campaign_updated", { campaign });

  // 1. แจ้งเตือนเข้า LINE OA เมื่อเริ่มรันแคมเปญ (0%)
  if (db.settings.line?.enabled && db.settings.line?.notifyOnStart) {
    const startMsg = formatCampaignStartLineMessage(campaign, campaign.projectName);
    await pushLineNotificationAndLog({
      campaign,
      titleSuffix: `🚀 เริ่มงาน (0/${campaign.steps.length} แผนก)`,
      messageText: startMsg
    });
    campaign.logs.push({
      time: new Date().toLocaleTimeString("th-TH"),
      agentName: "LINE Tracker",
      avatar: "📲",
      message: `ส่งแจ้งเตือน "เริ่มรันงานแคมเปญ (0%)" เข้า LINE OA เรียบร้อย`
    });
    saveDB(db);
    broadcastEvent("campaign_updated", { campaign });
  }

  const previousOutputs = [];
  const totalSteps = campaign.steps.length;

  for (let i = 0; i < totalSteps; i++) {
    if (campaign.status === "stopped") break;

    const step = campaign.steps[i];
    const agent = db.agents.find((a) => a.id === step.agentId) || {
      id: step.agentId,
      name: step.agentName,
      role: step.role,
      avatar: step.avatar,
      systemPrompt: "คุณคือผู้เชี่ยวชาญการตลาดออนไลน์ สรุปแผนงานเป็นภาษาไทย"
    };

    step.status = "working";
    step.startedAt = new Date().toISOString();
    campaign.activeAgentId = agent.id;
    campaign.logs.push({
      time: new Date().toLocaleTimeString("th-TH"),
      agentName: agent.name,
      avatar: agent.avatar,
      message: `[ขั้นตอน ${i + 1}/${totalSteps}] เริ่มวิเคราะห์ข้อมูลเพจและสร้างชิ้นงานในส่วนของ "${agent.role}"...`
    });
    saveDB(db);
    broadcastEvent("step_started", { campaignId: campaign.id, step, campaign });

    try {
      const result = await runAgentLLM({
        agent,
        settings: db.settings,
        brief: campaign.brief,
        previousOutputs
      });

      step.status = "completed";
      step.output = result.text;
      step.providerUsed = result.provider;
      step.modelUsed = result.model;
      step.completedAt = new Date().toISOString();

      previousOutputs.push({
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        output: result.text
      });

      const nextStep = campaign.steps[i + 1];
      const pct = Math.round(((i + 1) / totalSteps) * 100);
      const handoffMsg = nextStep
        ? `เสร็จขั้นตอนที่ ${i + 1}/${totalSteps} (${pct}%) ✅ ส่งต่อข้อมูลให้ ${nextStep.avatar} ${nextStep.agentName}`
        : `เสร็จขั้นตอนที่ ${i + 1}/${totalSteps} (100%) ✅ ครบทุกขั้นตอนของทีมการตลาด`;

      campaign.logs.push({
        time: new Date().toLocaleTimeString("th-TH"),
        agentName: agent.name,
        avatar: agent.avatar,
        message: handoffMsg
      });

      saveDB(db);
      broadcastEvent("step_completed", { campaignId: campaign.id, step, campaign });

      // 2. แจ้งเตือนความคืบหน้ารายแผนกเข้า LINE OA (เฉพาะขั้นตอนระหว่างทาง 1 ถึง N-1 เพราะตอนจบมีสรุป 100% อยู่แล้ว)
      if (db.settings.line?.enabled && db.settings.line?.notifyOnEachStep && nextStep) {
        const progressMsg = formatStepProgressLineMessage({
          campaign,
          step,
          stepIndex: i,
          totalSteps,
          nextStep,
          projectName: campaign.projectName
        });
        await pushLineNotificationAndLog({
          campaign,
          titleSuffix: `⏳ ความคืบหน้า ${i + 1}/${totalSteps} แผนก (${pct}%)`,
          messageText: progressMsg
        });
      }
    } catch (err) {
      step.status = "error";
      step.error = err.message;
      campaign.logs.push({
        time: new Date().toLocaleTimeString("th-TH"),
        agentName: agent.name,
        avatar: agent.avatar,
        message: `เกิดข้อผิดพลาด: ${err.message}`
      });
      saveDB(db);
      broadcastEvent("step_error", { campaignId: campaign.id, step, error: err.message, campaign });
    }
  }

  campaign.activeAgentId = null;

  const brandProfile =
    db.brandProfiles.find((b) => b.id === (campaign.brandId || db.settings.activeBrandId)) ||
    db.brandProfiles[0] ||
    {};

  // สร้างรูปโปสเตอร์ AI จริง (HTTPS) + ชุดเชื่อม Canva Studio + ลิงก์เครื่องมือครบทั้ง 7 Agents
  campaign.visualAssets = generateCampaignVisualAssets(campaign, brandProfile);
  campaign.connectedTools = buildAgentConnectedToolsOutput(campaign, brandProfile);

  const copyStep =
    (campaign.steps || []).find((s) => s.agentId === "content_copywriter" && s.output) ||
    (campaign.steps || [])[0];
  const rawCopy = copyStep?.output || `โปรโมชันพิเศษจาก ${campaign.brief?.productName || "เพจของเรา"}`;
  const cleanCaption = extractCleanPostCaption(rawCopy, campaign.brief);
  campaign.cleanCaption = cleanCaption;

  campaign.logs.push({
    time: new Date().toLocaleTimeString("th-TH"),
    agentName: "Maya (Canva & AI Visual Studio)",
    avatar: "🎨",
    message: `ออกแบบรูปโปสเตอร์โฆษณา AI (3 ขนาด FB/IG/TikTok) + ผูกลิงก์ Canva Template เสร็จสมบูรณ์!`
  });

  // ส่งการ์ดตรวจงาน (พร้อมรูปโปสเตอร์ + แคปชัน + ปุ่มกดยืนยันงาน) เข้า LINE OA เสมอ
  if (db.settings.line?.enabled) {
    try {
      const approvalRes = await sendLineApprovalCard({
        lineConfig: db.settings.line,
        campaign,
        brandProfile,
        visualAssets: campaign.visualAssets,
        cleanCaption,
        serverBaseUrl: `http://localhost:${PORT}`
      });
      db.lineLogs.unshift({
        id: randomUUID(),
        campaignId: campaign.id,
        brandId: campaign.brandId,
        campaignTitle: `${campaign.brief?.productName || "แคมเปญ"} — 🎨 ส่งการ์ดรูป+แคปชันให้กดยืนยันใน LINE`,
        timestamp: new Date().toISOString(),
        status: approvalRes.success ? "sent" : "simulated",
        details: approvalRes.message,
        preview: cleanCaption.slice(0, 500)
      });
      broadcastEvent("line_log_added", { lineLogs: db.lineLogs });
    } catch (e) {
      console.error("Failed to send LINE approval card:", e.message);
    }
  }

  // เช็กว่าต้องรอผู้ใช้กดยืนยันใน LINE ก่อนโพสต์ หรือโพสต์อัตโนมัติทันที
  if (campaign.requireLineApproval !== false) {
    campaign.status = "awaiting_approval";
    campaign.approvalStatus = "pending";
    if (campaign.postingSteps) {
      campaign.postingSteps.forEach((p) => {
        p.status = "pending";
        p.note = "🟡 ส่งรูป+แคปชันเข้า LINE แล้ว (รอคุณกด '✅ ยืนยัน' ใน LINE หรือหน้าเว็บ)";
      });
    }
    campaign.logs.push({
      time: new Date().toLocaleTimeString("th-TH"),
      agentName: "LINE Approval Gate",
      avatar: "📲",
      message: `ส่งการ์ดรูปโปสเตอร์ + แคปชันเข้า LINE OA ให้ตรวจแล้ว! กดปุ่ม "✅ ยืนยัน & โพสต์ทุกเพจ" ใน LINE หรือบนหน้าเว็บเพื่อปล่อยโพสต์ได้เลย`
    });
    saveDB(db);
    broadcastEvent("campaign_awaiting_approval", { campaign });
    return;
  }

  campaign.approvalStatus = "approved";
  campaign.logs.push({
    time: new Date().toLocaleTimeString("th-TH"),
    agentName: "Social Auto-Publisher",
    avatar: "📤",
    message: `ทีม AI เตรียมคอนเทนต์และรูปโปสเตอร์ครบ 7 แผนกแล้ว! เริ่มวิ่งไล่โพสต์ลงเพจทีละช่องทาง (Facebook -> TikTok -> Instagram -> LINE OA)...`
  });
  saveDB(db);
  broadcastEvent("campaign_updated", { campaign });

  // 3. เริ่มวิ่งไล่โพสต์ลงเพจทีละช่องทาง (FB -> TikTok -> IG -> LINE)
  await executeSequentialPlatformPosting(campaign.id);
}

// ฟังก์ชันสั่งรันเฉพาะ Agent รายตัว (Re-run / Refine)
async function executeSingleAgentStep(campaignId, agentId, customInstruction) {
  const campaign = db.campaigns.find((c) => c.id === campaignId);
  if (!campaign) throw new Error("ไม่พบแคมเปญนี้");

  const stepIndex = campaign.steps.findIndex((s) => s.agentId === agentId);
  if (stepIndex === -1) throw new Error("ไม่พบ Agent ในแคมเปญนี้");

  const step = campaign.steps[stepIndex];
  const agent = db.agents.find((a) => a.id === agentId);
  if (!agent) throw new Error("ไม่พบข้อมูล Agent");

  const previousOutputs = campaign.steps
    .slice(0, stepIndex)
    .filter((s) => s.output)
    .map((s) => ({
      agentId: s.agentId,
      agentName: s.agentName,
      role: s.role,
      output: s.output
    }));

  step.status = "working";
  campaign.activeAgentId = agent.id;
  campaign.logs.push({
    time: new Date().toLocaleTimeString("th-TH"),
    agentName: agent.name,
    avatar: agent.avatar,
    message: customInstruction
      ? `กำลังปรับปรุงผลงานตามคำสั่งเพิ่มเติม: "${customInstruction}"`
      : `กำลังประมวลผลและสร้างผลงานใหม่อีกครั้ง...`
  });
  saveDB(db);
  broadcastEvent("step_started", { campaignId: campaign.id, step, campaign });

  const result = await runAgentLLM({
    agent,
    settings: db.settings,
    brief: campaign.brief,
    previousOutputs,
    customInstruction
  });

  step.status = "completed";
  step.output = result.text;
  step.providerUsed = result.provider;
  step.modelUsed = result.model;
  step.completedAt = new Date().toISOString();
  campaign.activeAgentId = null;

  campaign.logs.push({
    time: new Date().toLocaleTimeString("th-TH"),
    agentName: agent.name,
    avatar: agent.avatar,
    message: `อัปเดตผลงานเรียบร้อยแล้ว ✅`
  });

  saveDB(db);
  broadcastEvent("step_completed", { campaignId: campaign.id, step, campaign });
  return { step, campaign };
}

function serveStaticFile(req, res) {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = path.join(PUBLIC_DIR, path.normalize(reqPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png"
    };
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  if (req.method === "OPTIONS") {
    return sendJSON(res, 200, { ok: true });
  }

  if (pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  try {
    // 1. ดึงข้อมูลเริ่มต้นทั้งหมดของระบบ
    if (pathname === "/api/state" && req.method === "GET") {
      return sendJSON(res, 200, {
        settings: db.settings,
        brandProfiles: db.brandProfiles || [],
        agents: db.agents,
        campaigns: db.campaigns,
        lineLogs: db.lineLogs,
        publishLogs: db.publishLogs || []
      });
    }

    // 2. จัดการโปรเจกต์/เพจที่ดูแล (Multi-Project / Multi-Page Workspace)
    if (pathname === "/api/brands" && req.method === "POST") {
      const body = await parseBody(req);

      if (body.action === "create" && body.profile) {
        const newProj = {
          id: `brand_${Date.now()}`,
          brandName: body.profile.brandName || "โปรเจกต์เพจใหม่",
          icon: body.profile.icon || "🌐",
          color: body.profile.color || "#6366f1",
          productDefault: body.profile.productDefault || "",
          goalDefault: body.profile.goalDefault || "สร้างยอดขายและขยายฐานลูกค้าใหม่",
          targetAudienceDefault: body.profile.targetAudienceDefault || "",
          budgetDefault: body.profile.budgetDefault || "20,000 บาท/เดือน",
          commandDefault: body.profile.commandDefault || "",
          fbUrl: body.profile.fbUrl || "",
          tiktokUrl: body.profile.tiktokUrl || "",
          igUrl: body.profile.igUrl || "",
          lineUrl: body.profile.lineUrl || "",
          websiteUrl: body.profile.websiteUrl || "",
          shopUrl: body.profile.shopUrl || "",
          contactPhone: body.profile.contactPhone || "",
          fbPageId: body.profile.fbPageId || "",
          fbPageAccessToken: body.profile.fbPageAccessToken || "",
          automationWebhookUrl: body.profile.automationWebhookUrl || ""
        };
        db.brandProfiles.push(newProj);
        db.settings.activeBrandId = newProj.id;
        saveDB(db);
        return sendJSON(res, 200, {
          ok: true,
          brandProfiles: db.brandProfiles,
          activeBrandId: db.settings.activeBrandId,
          project: newProj
        });
      }

      if (body.action === "save" && body.profile) {
        const p = body.profile;
        if (!p.id) {
          p.id = `brand_${Date.now()}`;
          db.brandProfiles.push(p);
        } else {
          const idx = db.brandProfiles.findIndex((b) => b.id === p.id);
          if (idx !== -1) {
            db.brandProfiles[idx] = { ...db.brandProfiles[idx], ...p };
          } else {
            db.brandProfiles.push(p);
          }
        }
        db.settings.activeBrandId = p.id;
        saveDB(db);
        return sendJSON(res, 200, {
          ok: true,
          brandProfiles: db.brandProfiles,
          activeBrandId: db.settings.activeBrandId
        });
      }

      if (body.action === "select" && body.brandId) {
        db.settings.activeBrandId = body.brandId;
        saveDB(db);
        return sendJSON(res, 200, {
          ok: true,
          activeBrandId: db.settings.activeBrandId,
          brandProfiles: db.brandProfiles
        });
      }

      if (body.action === "delete" && body.brandId) {
        if (db.brandProfiles.length <= 1) {
          return sendJSON(res, 400, { error: "ต้องมีโปรเจกต์เพจอย่างน้อย 1 รายการในระบบ" });
        }
        db.brandProfiles = db.brandProfiles.filter((b) => b.id !== body.brandId);
        if (db.settings.activeBrandId === body.brandId) {
          db.settings.activeBrandId = db.brandProfiles[0].id;
        }
        saveDB(db);
        return sendJSON(res, 200, {
          ok: true,
          brandProfiles: db.brandProfiles,
          activeBrandId: db.settings.activeBrandId
        });
      }

      return sendJSON(res, 400, { error: "Invalid brand action" });
    }

    // 2.1 วิเคราะห์ลิงก์เพจที่ผู้ใช้ใส่เข้ามา
    if (pathname === "/api/brands/inspect" && req.method === "POST") {
      const body = await parseBody(req);
      const info = await inspectChannelLinks(body.profile || {});
      return sendJSON(res, 200, { ok: true, info });
    }

    // 2.15 ตรวจสอบและดึง Facebook Page ID อัตโนมัติจาก Access Token
    if (pathname === "/api/brands/verify-fb" && req.method === "POST") {
      const body = await parseBody(req);
      const token = (body.accessToken || "").trim();
      if (!token) {
        return sendJSON(res, 400, { error: "กรุณาวาง Facebook Access Token ก่อนกดตรวจสอบ" });
      }
      try {
        // 1. ลองดึงรายการเพจทั้งหมดที่ Token นี้ดูแลอยู่ (/me/accounts) และเช็กสิทธิ์ (/me/permissions)
        const [accRes, permRes] = await Promise.all([
          fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,link&access_token=${encodeURIComponent(token)}`),
          fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${encodeURIComponent(token)}`)
        ]);
        const accData = await accRes.json();
        const permData = await permRes.json();
        const grantedPerms = (permData?.data || [])
          .filter((p) => p.status === "granted")
          .map((p) => p.permission);
        const hasManagePosts = grantedPerms.includes("pages_manage_posts");

        if (accData?.data && accData.data.length > 0) {
          const activeBrand =
            db.brandProfiles.find((b) => b.id === db.settings.activeBrandId) || db.brandProfiles[0];
          const urlPageId = extractFacebookPageIdFromUrl(activeBrand?.fbUrl || "");
          const matchedPage =
            accData.data.find((p) => p.id === urlPageId || p.id === activeBrand?.fbPageId) ||
            accData.data[0];

          if (activeBrand) {
            activeBrand.fbPageId = matchedPage.id;
            activeBrand.fbPageAccessToken = matchedPage.access_token || token;
            activeBrand.fbUrl = matchedPage.link || `https://facebook.com/${matchedPage.id}`;
            if (!activeBrand.brandName || activeBrand.brandName.includes("เพจใหม่ของคุณ")) {
              activeBrand.brandName = matchedPage.name;
            }
          }

          // นำเข้าเพจอื่นๆ ทั้งหมดที่อยู่ในบัญชีมาสร้างเป็นโปรเจกต์แยกให้อัตโนมัติ
          for (const page of accData.data) {
            const existing = db.brandProfiles.find(
              (b) => b.fbPageId === page.id || b.brandName === page.name
            );
            if (existing) {
              existing.fbPageId = page.id;
              existing.fbPageAccessToken = page.access_token || token;
              existing.fbUrl = page.link || `https://facebook.com/${page.id}`;
            } else {
              db.brandProfiles.push({
                id: `brand_fb_${page.id}`,
                brandName: page.name,
                icon: "📘",
                color: "#0ea5e9",
                productDefault: page.name,
                goalDefault: "สร้างยอดขายและขยายฐานลูกค้าใหม่",
                targetAudienceDefault: "ลูกค้ากลุ่มเป้าหมายบนโลกออนไลน์",
                budgetDefault: "1000",
                commandDefault: `โปรโมตเพจ ${page.name} เน้นจุดเด่นบริการคุณภาพ พร้อมให้คำปรึกษาฟรี`,
                fbUrl: page.link || `https://facebook.com/${page.id}`,
                fbPageId: page.id,
                fbPageAccessToken: page.access_token || token,
                lineUrl: activeBrand?.lineUrl || "",
                contactPhone: activeBrand?.contactPhone || ""
              });
            }
          }
          saveDB(db);

          return sendJSON(res, 200, {
            ok: true,
            pageId: matchedPage.id,
            pageName: matchedPage.name,
            pageAccessToken: matchedPage.access_token || token,
            pageLink: matchedPage.link || `https://facebook.com/${matchedPage.id}`,
            hasManagePosts,
            grantedPerms,
            allPages: accData.data.map((p) => ({
              id: p.id,
              name: p.name,
              access_token: p.access_token || token,
              link: p.link || `https://facebook.com/${p.id}`
            })),
            brandProfiles: db.brandProfiles
          });
        }

        // 2. ตรวจสอบว่า Token นี้เป็น Page Access Token โดยตรงหรือไม่ (ถ้าเป็นเพจจะมีฟิลด์ category)
        const meRes = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,link,category&access_token=${encodeURIComponent(token)}`
        );
        const meData = await meRes.json();
        if (meData?.id && meData?.category) {
          const activeBrand =
            db.brandProfiles.find((b) => b.id === db.settings.activeBrandId) || db.brandProfiles[0];
          if (activeBrand) {
            activeBrand.fbPageId = meData.id;
            activeBrand.fbPageAccessToken = token;
            activeBrand.fbUrl = meData.link || `https://facebook.com/${meData.id}`;
            if (!activeBrand.brandName || activeBrand.brandName.includes("เพจใหม่ของคุณ")) {
              activeBrand.brandName = meData.name;
            }
            saveDB(db);
          }
          return sendJSON(res, 200, {
            ok: true,
            pageId: meData.id,
            pageName: meData.name,
            pageAccessToken: token,
            pageLink: meData.link || `https://facebook.com/${meData.id}`,
            brandProfiles: db.brandProfiles
          });
        }

        // 3. ถ้าเป็น User Token (บัญชีเฟซส่วนตัว ไม่ใช่เพจ) และดึง /me/accounts ไม่ได้ แปลว่ายังไม่ได้เปิดสิทธิ์ pages_manage_posts / pages_show_list
        return sendJSON(res, 400, {
          error:
            `⚠️ Token ที่วางเป็น "User Token (บัญชีเฟซส่วนตัว)" ที่ยังไม่ได้เปิดสิทธิ์จัดการเพจ!\n` +
            `วิธีแก้ในหน้า Graph API Explorer:\n` +
            `1) ในช่อง Permissions ให้กดเพิ่มสิทธิ์: pages_show_list, pages_read_engagement และ pages_manage_posts\n` +
            `2) ช่อง User or Page ด้านบน ให้เปลี่ยนจาก User Token เป็น "ชื่อเพจของคุณ"\n` +
            `3) กด Generate Access Token แล้วคัดลอกมาวางใหม่อีกครั้งครับ`
        });
      } catch (err) {
        return sendJSON(res, 500, { error: err.message });
      }
    }

    // 2.2 สั่งโพสต์คอนเทนต์ลงเพจจริง
    if (pathname === "/api/social/publish" && req.method === "POST") {
      const body = await parseBody(req);
      const brandProfile =
        db.brandProfiles.find((b) => b.id === (body.brandId || db.settings.activeBrandId)) ||
        db.brandProfiles[0];

      const results = await executeSocialPublish({
        brandProfile,
        platforms: body.platforms || ["Facebook", "Instagram", "TikTok"],
        contentText: body.contentText || "",
        campaignTitle: body.campaignTitle || brandProfile?.brandName || "แคมเปญการตลาด",
        lineSettings: db.settings.line
      });

      const logItem = {
        id: randomUUID(),
        brandId: brandProfile?.id || db.settings.activeBrandId,
        timestamp: new Date().toISOString(),
        brandName: brandProfile?.brandName || "เพจหลัก",
        platforms: body.platforms || ["Facebook", "Instagram", "TikTok"],
        results,
        contentPreview: (body.contentText || "").slice(0, 500)
      };

      if (!db.publishLogs) db.publishLogs = [];
      db.publishLogs.unshift(logItem);
      saveDB(db);

      return sendJSON(res, 200, {
        ok: true,
        results,
        logItem,
        publishLogs: db.publishLogs
      });
    }

    // 3. บันทึกการตั้งค่า (API Keys, โมเดลหลัก, และการตั้งค่า LINE)
    if (pathname === "/api/settings" && req.method === "POST") {
      const body = await parseBody(req);
      db.settings = {
        ...db.settings,
        ...body,
        apiKeys: { ...db.settings.apiKeys, ...(body.apiKeys || {}) },
        models: { ...db.settings.models, ...(body.models || {}) },
        line: { ...db.settings.line, ...(body.line || {}) }
      };
      saveDB(db);
      return sendJSON(res, 200, { ok: true, settings: db.settings });
    }

    // 4. จัดการข้อมูล AI Agents
    if (pathname === "/api/agents" && req.method === "POST") {
      const body = await parseBody(req);
      if (body.action === "reset") {
        db.agents = JSON.parse(JSON.stringify(DEFAULT_AGENTS));
        saveDB(db);
        return sendJSON(res, 200, { ok: true, agents: db.agents });
      }
      if (body.action === "create" && body.agent) {
        const newAgent = {
          id: `custom_${Date.now()}`,
          stepOrder: db.agents.length + 1,
          name: body.agent.name || "New Marketing Agent",
          role: body.agent.role || "ผู้เชี่ยวชาญเฉพาะทาง",
          department: body.agent.department || "Custom Department",
          avatar: body.agent.avatar || "🤖",
          color: body.agent.color || "#6366f1",
          enabled: true,
          preferredProvider: body.agent.preferredProvider || "default",
          preferredModel: body.agent.preferredModel || "",
          temperature: Number(body.agent.temperature) || 0.7,
          description: body.agent.description || "Agent เสริมที่สร้างขึ้นใหม่สำหรับทีมการตลาด",
          skills: body.agent.skills || ["Custom Skill"],
          systemPrompt: body.agent.systemPrompt || "คุณคือผู้เชี่ยวชาญด้านการตลาดออนไลน์ ตอบเป็นภาษาไทย"
        };
        db.agents.push(newAgent);
        saveDB(db);
        return sendJSON(res, 200, { ok: true, agents: db.agents, agent: newAgent });
      }
      if (body.action === "update" && body.agent) {
        const idx = db.agents.findIndex((a) => a.id === body.agent.id);
        if (idx !== -1) {
          db.agents[idx] = { ...db.agents[idx], ...body.agent };
          saveDB(db);
        }
        return sendJSON(res, 200, { ok: true, agents: db.agents });
      }
      if (body.action === "delete" && body.agentId) {
        db.agents = db.agents.filter((a) => a.id !== body.agentId);
        saveDB(db);
        return sendJSON(res, 200, { ok: true, agents: db.agents });
      }
      return sendJSON(res, 400, { error: "Invalid action" });
    }

    // 5. สั่งการที่เดียว (Single Command Center) ผูกกับโปรเจกต์เพจที่เลือกอยู่
    if (pathname === "/api/campaigns/run" && req.method === "POST") {
      const body = await parseBody(req);
      const activeBrand =
        db.brandProfiles.find((b) => b.id === (body.brandId || db.settings.activeBrandId)) ||
        db.brandProfiles[0] ||
        {};

      const channels = body.channels || {
        fbUrl: activeBrand.fbUrl || "",
        tiktokUrl: activeBrand.tiktokUrl || "",
        igUrl: activeBrand.igUrl || "",
        lineUrl: activeBrand.lineUrl || "",
        websiteUrl: activeBrand.websiteUrl || "",
        shopUrl: activeBrand.shopUrl || "",
        contactPhone: activeBrand.contactPhone || ""
      };

      // บันทึกการอัปเดตลิงก์และโจทย์ล่าสุดลงในโปรเจกต์เพจที่เลือกอยู่โดยอัตโนมัติ
      if (activeBrand && activeBrand.id) {
        activeBrand.fbUrl = channels.fbUrl || activeBrand.fbUrl;
        activeBrand.tiktokUrl = channels.tiktokUrl || activeBrand.tiktokUrl;
        activeBrand.igUrl = channels.igUrl || activeBrand.igUrl;
        activeBrand.lineUrl = channels.lineUrl || activeBrand.lineUrl;
        activeBrand.websiteUrl = channels.websiteUrl || activeBrand.websiteUrl;
        activeBrand.shopUrl = channels.shopUrl || activeBrand.shopUrl;
        activeBrand.contactPhone = channels.contactPhone || activeBrand.contactPhone;
        if (body.productName) activeBrand.productDefault = body.productName;
        if (body.goal) activeBrand.goalDefault = body.goal;
        if (body.targetAudience) activeBrand.targetAudienceDefault = body.targetAudience;
        if (body.budget) activeBrand.budgetDefault = body.budget;
        if (body.commandText) activeBrand.commandDefault = body.commandText;
      }

      const brief = {
        productName: body.productName || "สินค้า/บริการใหม่",
        goal: body.goal || "สร้างยอดขายและขยายฐานลูกค้าใหม่",
        targetAudience: body.targetAudience || "ลูกค้ากลุ่มเป้าหมายบนโลกออนไลน์",
        budget: body.budget || "15,000 - 30,000 บาท/เดือน",
        platforms: body.platforms || ["Facebook", "TikTok", "Instagram", "LINE OA"],
        commandText: body.commandText || "",
        channels
      };

      const selectedAgentIds = Array.isArray(body.selectedAgentIds) && body.selectedAgentIds.length > 0
        ? body.selectedAgentIds
        : db.agents.filter((a) => a.enabled !== false).map((a) => a.id);

      const activeAgents = db.agents
        .filter((a) => selectedAgentIds.includes(a.id))
        .sort((a, b) => (a.stepOrder || 99) - (b.stepOrder || 99));

      const campaign = {
        id: randomUUID(),
        brandId: activeBrand.id || "brand_default_1",
        projectName: activeBrand.brandName || brief.productName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "starting",
        activeAgentId: null,
        requireLineApproval: body.requireLineApproval !== false,
        approvalStatus: "pending",
        brief,
        steps: activeAgents.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          role: a.role,
          department: a.department,
          avatar: a.avatar,
          color: a.color,
          status: "pending",
          output: "",
          providerUsed: "",
          modelUsed: ""
        })),
        postingSteps: buildInitialPostingSteps(channels, brief.platforms),
        logs: [
          {
            time: new Date().toLocaleTimeString("th-TH"),
            agentName: "Command Center",
            avatar: "⚡",
            message: `[โปรเจกต์: ${activeBrand.brandName || brief.productName}] รับคำสั่งแคมเปญเรียบร้อย เริ่มเดินเครื่องทีม AI ทั้ง ${activeAgents.length} แผนก และเตรียมโพสต์ลงเพจ (FB / TikTok / IG / LINE)!`
          }
        ]
      };

      db.campaigns.unshift(campaign);
      saveDB(db);

      executeCampaignPipeline(campaign.id);

      return sendJSON(res, 200, { ok: true, campaign, brandProfiles: db.brandProfiles });
    }

    // 5.5 สั่ง AI วิ่งไล่โพสต์ลงเพจ (ทั้งหมด หรือเลือกเฉพาะเพจ FB / TikTok / IG / LINE) พร้อมส่งแจ้งเตือน LINE OA
    if (pathname === "/api/campaigns/run-posting" && req.method === "POST") {
      const body = await parseBody(req);
      const { campaignId, platform } = body;
      const campaign = db.campaigns.find((c) => c.id === campaignId) || db.campaigns[0];
      if (!campaign) return sendJSON(res, 404, { error: "ไม่พบแคมเปญ" });

      if (!platform) {
        campaign.postingSteps = buildInitialPostingSteps(campaign.brief?.channels, campaign.brief?.platforms);
        saveDB(db);
      }

      executeSequentialPlatformPosting(campaign.id, platform || null);
      return sendJSON(res, 200, { ok: true, campaign });
    }

    // 5.6 ปุ่ม AI Autopilot: ให้ AI คิดหัวข้อแคมเปญเอง + ออกแบบรูป Canva/AI + ส่งตรวจใน LINE โดยไม่ต้องกรอกข้อมูล
    if (pathname === "/api/campaigns/autopilot" && req.method === "POST") {
      const body = await parseBody(req);
      const activeBrand =
        db.brandProfiles.find((b) => b.id === (body.brandId || db.settings.activeBrandId)) ||
        db.brandProfiles[0] ||
        {};

      const autoBrief = generateAutonomousBriefForBrand(activeBrand);
      const channels = {
        fbUrl: activeBrand.fbUrl || "",
        tiktokUrl: activeBrand.tiktokUrl || "",
        igUrl: activeBrand.igUrl || "",
        lineUrl: activeBrand.lineUrl || "",
        websiteUrl: activeBrand.websiteUrl || "",
        shopUrl: activeBrand.shopUrl || "",
        contactPhone: activeBrand.contactPhone || ""
      };
      const brief = {
        ...autoBrief,
        channels
      };

      const activeAgents = db.agents
        .filter((a) => a.enabled !== false)
        .sort((a, b) => (a.stepOrder || 99) - (b.stepOrder || 99));

      const campaign = {
        id: randomUUID(),
        brandId: activeBrand.id || "brand_default_1",
        projectName: activeBrand.brandName || brief.productName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "starting",
        activeAgentId: null,
        isAutopilot: true,
        requireLineApproval: body.requireLineApproval !== false,
        approvalStatus: "pending",
        brief,
        postingSteps: buildInitialPostingSteps(channels, brief.platforms),
        steps: activeAgents.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          role: a.role,
          department: a.department,
          avatar: a.avatar,
          color: a.color,
          status: "pending",
          output: "",
          providerUsed: "",
          modelUsed: ""
        })),
        logs: [
          {
            time: new Date().toLocaleTimeString("th-TH"),
            agentName: "Aria (AI Autopilot CMO)",
            avatar: "🤖",
            message: `[AI Autopilot] คิดหัวข้อแคมเปญให้เพจ "${activeBrand.brandName}" อัตโนมัติ: "${brief.autonomousAngle}" — เริ่มเดินเครื่องทั้ง 7 แผนก + ออกแบบ Canva/AI + ส่งเข้า LINE!`
          }
        ]
      };

      campaign.visualAssets = generateCampaignVisualAssets(campaign, activeBrand);
      campaign.connectedTools = buildAgentConnectedToolsOutput(campaign, activeBrand);

      db.campaigns.unshift(campaign);
      saveDB(db);

      executeCampaignPipeline(campaign.id);
      return sendJSON(res, 200, { ok: true, campaign, brandProfiles: db.brandProfiles });
    }

    // 5.7 กดยืนยันอนุมัติงาน (จากปุ่มบนหน้าเว็บ Dashboard) เพื่อปล่อยโพสต์ลงทุกแพลตฟอร์มทันที
    if (pathname === "/api/campaigns/approve" && req.method === "POST") {
      const body = await parseBody(req);
      const campaign = db.campaigns.find((c) => c.id === body.campaignId) || db.campaigns[0];
      if (!campaign) return sendJSON(res, 404, { error: "ไม่พบแคมเปญ" });

      campaign.approvalStatus = "approved";
      campaign.status = "posting";
      campaign.logs.push({
        time: new Date().toLocaleTimeString("th-TH"),
        agentName: "Owner Approval",
        avatar: "✅",
        message: "คุณกดยืนยันอนุมัติงานแล้ว! เริ่มปล่อยโพสต์ + รูปโปสเตอร์ลง Facebook, Instagram, TikTok (Make.com) และ LINE OA ทันที..."
      });
      saveDB(db);
      broadcastEvent("campaign_updated", { campaign });

      executeSequentialPlatformPosting(campaign.id, null);
      return sendJSON(res, 200, { ok: true, campaign });
    }

    // 5.8 ลิงก์กดยืนยันงานในคลิกเดียวจากปุ่มในการ์ด LINE OA (GET /api/campaigns/approve-get)
    if (pathname === "/api/campaigns/approve-get" && req.method === "GET") {
      const campaignId = parsedUrl.searchParams.get("campaignId");
      const campaign = db.campaigns.find((c) => c.id === campaignId) || db.campaigns[0];
      if (!campaign) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end("<h2>ไม่พบแคมเปญนี้</h2>");
      }

      campaign.approvalStatus = "approved";
      campaign.status = "posting";
      campaign.logs.push({
        time: new Date().toLocaleTimeString("th-TH"),
        agentName: "LINE Approval",
        avatar: "✅",
        message: "ได้รับการกดยืนยันงานผ่านการ์ด LINE OA แล้ว! กำลังปล่อยโพสต์ลงทุกแพลตฟอร์มอัตโนมัติ..."
      });
      saveDB(db);
      broadcastEvent("campaign_updated", { campaign });

      executeSequentialPlatformPosting(campaign.id, null);

      const htmlPage = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ยืนยันอนุมัติโพสต์สำเร็จ — AI Marketing Agency</title>
  <style>
    body { background:#090d16; color:#f8fafc; font-family:'Prompt',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; }
    .box { background:#111827; border:2px solid #10b981; border-radius:18px; max-width:540px; width:100%; padding:28px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.6); }
    .icon { font-size:56px; margin-bottom:10px; }
    h1 { font-size:22px; color:#34d399; margin:0 0 10px; }
    p { font-size:14px; color:#cbd5e1; line-height:1.6; }
    img { width:100%; border-radius:12px; margin:14px 0; border:1px solid rgba(255,255,255,0.15); }
    .btn { display:inline-block; margin-top:14px; padding:12px 24px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; text-decoration:none; border-radius:10px; font-weight:600; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✅</div>
    <h1>ยืนยันงานเรียบร้อย! กำลังปล่อยโพสต์ทุกแพลตฟอร์ม</h1>
    <p>โปรเจกต์: <strong>${campaign.projectName || ""}</strong><br/>ระบบกำลังส่งรูปโปสเตอร์และแคปชันไปยัง <strong>Make.com (Facebook / IG / TikTok)</strong> และ <strong>LINE OA</strong> อัตโนมัติ และจะส่งใบสรุปผลเข้า LINE เมื่อครบ 100% ครับ</p>
    ${campaign.visualAssets?.fbBannerImageUrl ? `<img src="${campaign.visualAssets.fbBannerImageUrl}" alt="AI Poster" />` : ""}
    <a class="btn" href="/">🚀 เปิดดูสถานะสดบน Dashboard</a>
  </div>
</body>
</html>`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(htmlPage);
    }

    // 5.9 ลิงก์สั่ง AI ออกแบบรูปและคิดแคปชันใหม่จากปุ่มในการ์ด LINE OA (GET /api/campaigns/regenerate-get)
    if (pathname === "/api/campaigns/regenerate-get" && req.method === "GET") {
      const campaignId = parsedUrl.searchParams.get("campaignId");
      const oldCampaign = db.campaigns.find((c) => c.id === campaignId) || db.campaigns[0];
      const activeBrand =
        db.brandProfiles.find((b) => b.id === (oldCampaign?.brandId || db.settings.activeBrandId)) ||
        db.brandProfiles[0] ||
        {};

      const autoBrief = generateAutonomousBriefForBrand(activeBrand);
      const channels = oldCampaign?.brief?.channels || {
        fbUrl: activeBrand.fbUrl || "",
        tiktokUrl: activeBrand.tiktokUrl || "",
        igUrl: activeBrand.igUrl || "",
        lineUrl: activeBrand.lineUrl || "",
        websiteUrl: activeBrand.websiteUrl || "",
        shopUrl: activeBrand.shopUrl || "",
        contactPhone: activeBrand.contactPhone || ""
      };
      const brief = { ...autoBrief, channels };
      const activeAgents = db.agents
        .filter((a) => a.enabled !== false)
        .sort((a, b) => (a.stepOrder || 99) - (b.stepOrder || 99));

      const newCampaign = {
        id: randomUUID(),
        brandId: activeBrand.id || "brand_default_1",
        projectName: activeBrand.brandName || brief.productName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "starting",
        activeAgentId: null,
        isAutopilot: true,
        requireLineApproval: true,
        approvalStatus: "pending",
        brief,
        postingSteps: buildInitialPostingSteps(channels, brief.platforms),
        steps: activeAgents.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          role: a.role,
          department: a.department,
          avatar: a.avatar,
          color: a.color,
          status: "pending",
          output: "",
          providerUsed: "",
          modelUsed: ""
        })),
        logs: [
          {
            time: new Date().toLocaleTimeString("th-TH"),
            agentName: "Aria (AI Autopilot CMO)",
            avatar: "🔄",
            message: `รับคำสั่งจาก LINE ให้คิดแคมเปญและออกแบบโปสเตอร์ชุดใหม่: "${brief.autonomousAngle}"`
          }
        ]
      };

      newCampaign.visualAssets = generateCampaignVisualAssets(newCampaign, activeBrand);
      newCampaign.connectedTools = buildAgentConnectedToolsOutput(newCampaign, activeBrand);

      db.campaigns.unshift(newCampaign);
      saveDB(db);
      executeCampaignPipeline(newCampaign.id);

      res.writeHead(302, { Location: "/" });
      return res.end();
    }

    // 6. สั่งรันหรือสั่งแก้ไขงานเฉพาะ Agent รายตัว
    if (pathname === "/api/campaigns/rerun-step" && req.method === "POST") {
      const body = await parseBody(req);
      const { campaignId, agentId, customInstruction } = body;
      const result = await executeSingleAgentStep(campaignId, agentId, customInstruction);
      return sendJSON(res, 200, { ok: true, ...result });
    }

    // 7. ลบแคมเปญ
    if (pathname === "/api/campaigns/delete" && req.method === "POST") {
      const body = await parseBody(req);
      db.campaigns = db.campaigns.filter((c) => c.id !== body.campaignId);
      saveDB(db);
      return sendJSON(res, 200, { ok: true, campaigns: db.campaigns });
    }

    if (pathname === "/api/campaigns/clear-all" && req.method === "POST") {
      const body = await parseBody(req);
      if (body.brandId) {
        db.campaigns = db.campaigns.filter((c) => c.brandId !== body.brandId);
      } else {
        db.campaigns = [];
      }
      saveDB(db);
      return sendJSON(res, 200, { ok: true, campaigns: db.campaigns });
    }

    // 7.5 ปุ่มเซต 0 เริ่มเพจใหม่
    if (pathname === "/api/system/reset-zero" && req.method === "POST") {
      const body = await parseBody(req);
      const clearCampaigns = body.clearCampaigns !== false;
      if (clearCampaigns) {
        db.campaigns = [];
        db.lineLogs = [];
        db.publishLogs = [];
      }
      const blankBrand = {
        id: `brand_${Date.now()}`,
        brandName: "โปรเจกต์เพจใหม่ (พร้อมเริ่มงาน)",
        icon: "🚀",
        color: "#6366f1",
        productDefault: "",
        goalDefault: "",
        targetAudienceDefault: "",
        budgetDefault: "",
        commandDefault: "",
        fbUrl: "",
        tiktokUrl: "",
        igUrl: "",
        lineUrl: "",
        websiteUrl: "",
        shopUrl: "",
        contactPhone: "",
        brandTone: "",
        fbPageId: "",
        fbPageAccessToken: "",
        igAccountId: "",
        automationWebhookUrl: ""
      };
      db.brandProfiles = [blankBrand];
      db.settings.activeBrandId = blankBrand.id;
      saveDB(db);
      return sendJSON(res, 200, {
        ok: true,
        settings: db.settings,
        brandProfiles: db.brandProfiles,
        campaigns: db.campaigns,
        lineLogs: db.lineLogs,
        publishLogs: db.publishLogs
      });
    }

    // 7.9 ตรวจสอบความถูกต้องของ LINE Channel Access Token
    if (pathname === "/api/line/verify" && req.method === "POST") {
      const body = await parseBody(req);
      const token = (body.channelAccessToken || "").trim();
      if (!token) {
        return sendJSON(res, 400, { error: "กรุณาวาง Channel Access Token ในช่องก่อนกดตรวจสอบครับ" });
      }
      try {
        const resBot = await fetch("https://api.line.me/v2/bot/info", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const botData = await resBot.json();
        if (!resBot.ok) {
          return sendJSON(res, 400, {
            error: botData?.message || "Token ไม่ถูกต้อง หรือหมดอายุ กรุณาตรวจสอบอีกครั้ง"
          });
        }
        return sendJSON(res, 200, {
          ok: true,
          displayName: botData.displayName,
          basicId: botData.basicId || "",
          userId: botData.userId || ""
        });
      } catch (err) {
        return sendJSON(res, 500, { error: err.message });
      }
    }

    // 8. ส่งรายงานสรุปผล หรือ ส่งเช็กสถานะความคืบหน้าปัจจุบันเข้า LINE OA ทันที
    if (pathname === "/api/line/send" && req.method === "POST") {
      const body = await parseBody(req);
      let messageText = body.customMessage || "";
      let campaignTitle = "ทดสอบระบบแจ้งเตือน LINE OA";
      let campaign = null;

      if (body.campaignId) {
        campaign = db.campaigns.find((c) => c.id === body.campaignId);
        if (campaign) {
          if (body.mode === "status_check") {
            messageText = formatLiveStatusCheckLineMessage(campaign, campaign.projectName);
            campaignTitle = `📡 เช็กสถานะงาน: ${campaign.brief?.productName || "แคมเปญ"}`;
          } else {
            messageText = formatCampaignLineSummary(campaign, campaign.projectName);
            campaignTitle = `🎉 สรุปแคมเปญ: ${campaign.brief?.productName || "แคมเปญ"}`;
          }
        }
      }

      if (!messageText) {
        messageText = [
          `🤖 [ทดสอบระบบติดตามงาน AI Marketing Team]`,
          `━━━━━━━━━━━━━━━━━━`,
          `✅ เชื่อมต่อ Dashboard กับ LINE OA สำเร็จ!`,
          `ระบบพร้อมแจ้งเตือนความคืบหน้า:`,
          `• 🚀 แจ้งเมื่อเริ่มรับคำสั่ง (0%)`,
          `• ⏳ แจ้งเมื่อแต่ละแผนกส่งต่องาน (1/7 ถึง 7/7)`,
          `• 🎉 แจ้งสรุปผลเมื่อเสร็จสมบูรณ์ (100%)`,
          `⏰ ${new Date().toLocaleString("th-TH")}`
        ].join("\n");
      }

      const lineConfig = body.lineConfig || db.settings.line;
      const result = await sendLineReport({ lineConfig, messageText });

      const logEntry = {
        id: randomUUID(),
        campaignId: body.campaignId || null,
        brandId: campaign?.brandId || db.settings.activeBrandId,
        campaignTitle,
        timestamp: new Date().toISOString(),
        status: result.success ? "sent" : "simulated",
        details: result.message,
        preview: messageText
      };
      db.lineLogs.unshift(logEntry);
      saveDB(db);

      return sendJSON(res, 200, {
        ok: true,
        result,
        logEntry,
        lineLogs: db.lineLogs
      });
    }

    // 9. LINE Webhook Endpoint (รองรับการพิมพ์ "สถานะ" หรือ "เช็คงาน" ใน LINE OA เพื่อดูความคืบหน้า)
    if (pathname === "/api/line/webhook" && req.method === "POST") {
      const body = await parseBody(req);
      const events = body.events || [];
      for (const ev of events) {
        const sourceId = ev.source?.groupId || ev.source?.roomId || ev.source?.userId || "";
        if (sourceId && !db.settings.line.targetId) {
          db.settings.line.targetId = sourceId;
        }
        const userText = (ev.message?.text || "").trim();
        db.lineLogs.unshift({
          id: randomUUID(),
          campaignId: null,
          campaignTitle: "LINE Webhook Event",
          timestamp: new Date().toISOString(),
          status: "webhook",
          details: `ได้รับข้อความจาก LINE (${sourceId}): "${userText}"`,
          preview: userText || JSON.stringify(ev.source)
        });

        // หากผู้ใช้พิมพ์ถามสถานะใน LINE ให้ส่งความคืบหน้าของแคมเปญล่าสุดกลับไปทันที
        if (userText.includes("ยืนยัน") || userText.includes("อนุมัติ") || userText.toLowerCase().includes("approve")) {
          const pendingCampaign = db.campaigns.find((c) => c.status === "awaiting_approval") || db.campaigns[0];
          if (pendingCampaign) {
            pendingCampaign.approvalStatus = "approved";
            pendingCampaign.status = "posting";
            saveDB(db);
            broadcastEvent("campaign_updated", { campaign: pendingCampaign });
            executeSequentialPlatformPosting(pendingCampaign.id, null);
          }
        }
        if (userText.includes("สถานะ") || userText.includes("เช็คงาน") || userText.toLowerCase().includes("status")) {
          const latestCampaign = db.campaigns[0];
          if (latestCampaign) {
            const statusText = formatLiveStatusCheckLineMessage(latestCampaign, latestCampaign.projectName);
            await sendLineReport({
              lineConfig: { ...db.settings.line, targetId: sourceId, sendMode: sourceId ? "push" : "broadcast" },
              messageText: statusText
            });
          }
        }
      }
      saveDB(db);
      return sendJSON(res, 200, { ok: true });
    }

    // 9.5 ทดสอบและบันทึก Make.com / Automation Webhook URL
    if (pathname === "/api/social/test-webhook" && req.method === "POST") {
      const body = await parseBody(req);
      const webhookUrl = (body.webhookUrl || "").trim();
      if (!webhookUrl || !webhookUrl.startsWith("http")) {
        return sendJSON(res, 400, { error: "กรุณาวางลิงก์ Webhook URL จาก Make.com (ขึ้นต้นด้วย https://hook...)" });
      }

      const activeBrand =
        db.brandProfiles.find((b) => b.id === (body.brandId || db.settings.activeBrandId)) ||
        db.brandProfiles[0];

      if (body.applyToAll !== false) {
        db.brandProfiles.forEach((b) => {
          b.automationWebhookUrl = webhookUrl;
        });
      } else if (activeBrand) {
        activeBrand.automationWebhookUrl = webhookUrl;
      }
      saveDB(db);

      const sampleCaption = [
        `🔥 โปรโมชันพิเศษจาก ${activeBrand?.brandName || "KPN บิ้วอิน เชียงใหม่"}!`,
        `✨ รับออกแบบและติดตั้งงานบิ้วอินครบวงจร งานเนี้ยบ งบไม่บานปลาย`,
        `📌 สนใจประเมินราคาฟรี ทักแชทเพจหรือแอด LINE: ${activeBrand?.lineUrl || ""}`,
        `📞 โทร: ${activeBrand?.contactPhone || "089-xxx-xxxx"}`,
        `#KPNบิ้วอิน #บิ้วอินเชียงใหม่ #ตกแต่งภายใน`
      ].join("\n");

      const samplePayload = {
        platform: "Facebook",
        platforms: ["Facebook", "Instagram", "TikTok"],
        brandName: activeBrand?.brandName || "KPN บิ้วอิน เชียงใหม่",
        fbPageId: activeBrand?.fbPageId || "1226235303916599",
        campaignTitle: "ทดสอบเชื่อมต่อระบบ AI Marketing -> Make.com",
        message: sampleCaption,
        caption: sampleCaption,
        content: sampleCaption,
        fbUrl: activeBrand?.fbUrl || "https://www.facebook.com/1226235303916599",
        igUrl: activeBrand?.igUrl || "",
        tiktokUrl: activeBrand?.tiktokUrl || "",
        lineUrl: activeBrand?.lineUrl || "",
        websiteUrl: activeBrand?.websiteUrl || activeBrand?.shopUrl || "",
        contactPhone: activeBrand?.contactPhone || "",
        timestamp: new Date().toISOString()
      };

      const whRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samplePayload)
      });

      const resText = await whRes.text();
      if (!whRes.ok) {
        if (whRes.status === 410) {
          return sendJSON(res, 200, {
            ok: true,
            listening: false,
            message: "✅ บันทึกลิงก์ Make.com ให้ครบทั้ง 5 เพจแล้ว! (ตอนนี้ไปที่หน้า Make.com กดปุ่ม 'Redetermine data structure' หรือกดปุ่ม '▶️ Run once' มุมซ้ายล่าง แล้วกดปุ่มทดสอบนี้อีกครั้งครับ)",
            brandProfiles: db.brandProfiles
          });
        }
        return sendJSON(res, 400, {
          error: `Make.com ตอบกลับสถานะ ${whRes.status}: ${resText}`
        });
      }

      return sendJSON(res, 200, {
        ok: true,
        message: "✅ ยิงข้อมูลตัวอย่างเข้า Make.com สำเร็จ! และบันทึกลิงก์ Webhook ให้ทุกโปรเจกต์เรียบร้อยแล้ว",
        brandProfiles: db.brandProfiles
      });
    }

    return serveStaticFile(req, res);
  } catch (err) {
    console.error("Server Error:", err);
    return sendJSON(res, 500, { error: err.message || "Internal Server Error" });
  }
});

server.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🚀 AI Marketing Agency Command Dashboard is running!`);
  console.log(`👉 Open in browser: http://localhost:${PORT}`);
  console.log(`============================================================\n`);
});

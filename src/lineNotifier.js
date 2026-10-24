// src/lineNotifier.js
// ระบบส่งแจ้งเตือนติดตามสถานะงาน และติดตามสถานะการโพสต์ลงเพจต่างๆ (FB / TikTok / IG / LINE โพสต์ไปหรือยัง) เข้า LINE OA

function buildProgressBar(completed, total) {
  const safeTotal = Math.max(total || 4, 1);
  const safeDone = Math.min(Math.max(completed || 0, 0), safeTotal);
  const filled = "🟩".repeat(safeDone);
  const empty = "⬜".repeat(safeTotal - safeDone);
  const pct = Math.round((safeDone / safeTotal) * 100);
  return `${filled}${empty} (${safeDone}/${safeTotal} ช่องทาง • ${pct}%)`;
}

// ฟอร์แมตใบเช็กสถานะว่า AI โพสต์ลงเพจไหนไปแล้วบ้าง (FB / TikTok / IG / LINE OA)
function formatPlatformPostingStatusLineMessage({ campaign, latestPlatform, projectName, isFinal }) {
  const brief = campaign?.brief || {};
  const postingSteps = campaign?.postingSteps || [];
  const postedCount = postingSteps.filter((p) => p.status === "posted").length;
  const totalCount = postingSteps.length || 4;

  const headerTitle = isFinal
    ? `🎉 [โพสต์ครบทุกเพจ 100% เรียบร้อยแล้ว!]`
    : latestPlatform
    ? `📢 [อัปเดต: โพสต์ลง ${latestPlatform} สำเร็จแล้ว!]`
    : `📡 [เช็กสถานะการโพสต์ลงเพจต่างๆ]`;

  const statusLines = postingSteps.map((p) => {
    if (p.status === "posted") {
      if (p.simulated) {
        return `${p.icon} ${p.platform}: ⚠️ โหมดจำลอง (${p.postedAt || "เตรียมเนื้อหาแล้ว"})\n   💡 ยังไม่ได้เชื่อม Token/Webhook เพจจริง\n   🔗 ${p.targetUrl || "-"}`;
      }
      return `${p.icon} ${p.platform}: ✅ โพสต์ขึ้นเพจจริงแล้ว (${p.postedAt || "สำเร็จ"})\n   🔗 ${p.targetUrl || "-"}`;
    }
    if (p.status === "posting") {
      return `${p.icon} ${p.platform}: ⏳ กำลังอัปโหลดและโพสต์ลงเพจ...\n   🔗 ${p.targetUrl || "-"}`;
    }
    if (p.status === "error") {
      return `${p.icon} ${p.platform}: ❌ โพสต์ไม่ผ่าน (${p.note || "ตรวจสอบสิทธิ์ Token"})`;
    }
    return `${p.icon} ${p.platform}: ⬜ ยังไม่ได้โพสต์ (รอคิว)\n   🔗 ${p.targetUrl || "-"}`;
  });

  // เช็กสถานะฝั่งการคิดคอนเทนต์ของ Agent ทั้ง 7 แผนกด้วยสั้นๆ
  const agentSteps = campaign?.steps || [];
  const agentDone = agentSteps.filter((s) => s.status === "completed").length;
  const agentTotal = agentSteps.length || 7;

  return [
    headerTitle,
    `━━━━━━━━━━━━━━━━━━`,
    `📁 โปรเจกต์: ${projectName || campaign?.projectName || brief.productName || "เพจหลัก"}`,
    `📌 แคมเปญ: ${brief.productName || "-"}`,
    `🤖 งานเตรียมคอนเทนต์: เสร็จ ${agentDone}/${agentTotal} แผนก`,
    `📊 ความคืบหน้าการโพสต์ลงเพจ:`,
    `${buildProgressBar(postedCount, totalCount)}`,
    `━━━━━━━━━━━━━━━━━━`,
    `📋 สถานะแยกตามเพจ (โพสต์ไปหรือยัง?):`,
    ...statusLines,
    `━━━━━━━━━━━━━━━━━━`,
    `⏰ อัปเดตเมื่อ: ${new Date().toLocaleTimeString("th-TH")}`
  ].join("\n");
}

function formatCampaignStartLineMessage(campaign, projectName) {
  const brief = campaign.brief || {};
  const postingSteps = campaign.postingSteps || [];
  const channelList = postingSteps.map((p) => `• ${p.icon} ${p.platform}: ⬜ รอคิวโพสต์ (${p.targetUrl || "-"})`).join("\n");

  return [
    `🚀 [เริ่มงานแคมเปญ & เตรียมโพสต์ลงเพจ]`,
    `━━━━━━━━━━━━━━━━━━`,
    `📁 โปรเจกต์/เพจ: ${projectName || brief.productName || "เพจหลัก"}`,
    `📌 แคมเปญ: ${brief.productName || "-"}`,
    `🤖 สถานะตอนนี้: ทีม AI กำลังผลิตคอนเทนต์เพื่อนำไปโพสต์ลงเพจ`,
    `━━━━━━━━━━━━━━━━━━`,
    `🌐 เพจเป้าหมายที่เข้าคิวรอโพสต์:`,
    channelList,
    `⏰ เวลาเริ่ม: ${new Date().toLocaleTimeString("th-TH")}`
  ].join("\n");
}

function formatStepProgressLineMessage({ campaign, step, stepIndex, totalSteps, nextStep, projectName }) {
  const doneCount = stepIndex + 1;
  const brief = campaign.brief || {};
  return [
    `⏳ [ความคืบหน้าเตรียมคอนเทนต์ก่อนโพสต์]`,
    `📁 โปรเจกต์: ${projectName || brief.productName || "เพจหลัก"}`,
    `🤖 เตรียมงานเสร็จแล้ว: ${doneCount}/${totalSteps} แผนก`,
    `✅ ล่าสุด: ${step.avatar || "🤖"} ${step.agentName}`,
    nextStep ? `👉 ถัดไป: ${nextStep.avatar || "🤖"} ${nextStep.agentName}` : `👉 เตรียมเริ่มไล่โพสต์ลงเพจ FB / TikTok / IG!`,
    `📌 สถานะการโพสต์ลงเพจ: ยังอยู่ในขั้นตอนเตรียมสื่อ (รอโพสต์หลังครบ 7 แผนก)`
  ].join("\n");
}

function formatLiveStatusCheckLineMessage(campaign, projectName) {
  return formatPlatformPostingStatusLineMessage({
    campaign,
    latestPlatform: null,
    projectName: projectName || campaign?.projectName,
    isFinal: false
  });
}

function formatCampaignLineSummary(campaign, projectName) {
  return formatPlatformPostingStatusLineMessage({
    campaign,
    latestPlatform: null,
    projectName: projectName || campaign?.projectName,
    isFinal: (campaign?.postingSteps || []).every((p) => p.status === "posted")
  });
}

async function sendLineReport({ lineConfig, messageText }) {
  const token = (lineConfig?.channelAccessToken || "").trim();
  const targetId = (lineConfig?.targetId || "").trim();
  const mode = lineConfig?.sendMode || (targetId ? "push" : "broadcast");

  if (!token) {
    return {
      success: false,
      simulated: true,
      message: "บันทึกแจ้งเตือนสถานะการโพสต์ลงระบบ Log เรียบร้อย (ใส่ LINE Channel Access Token เพื่อเด้งเข้ามือถือจริง)"
    };
  }

  const isPush = mode === "push" && targetId.length > 0;
  const endpoint = isPush
    ? "https://api.line.me/v2/bot/message/push"
    : "https://api.line.me/v2/bot/message/broadcast";

  const payload = isPush
    ? {
        to: targetId,
        messages: [{ type: "text", text: messageText }]
      }
    : {
        messages: [{ type: "text", text: messageText }]
      };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`LINE Messaging API Error (${response.status}): ${errBody}`);
  }

  return {
    success: true,
    simulated: false,
    mode: isPush ? `Push ไปยัง ${targetId}` : "Broadcast ไปยังผู้ติดตาม LINE OA",
    message: "ส่งแจ้งเตือนสถานะการโพสต์เข้า LINE OA สำเร็จ!"
  };
}

module.exports = {
  buildProgressBar,
  formatPlatformPostingStatusLineMessage,
  formatCampaignStartLineMessage,
  formatStepProgressLineMessage,
  formatLiveStatusCheckLineMessage,
  formatCampaignLineSummary,
  sendLineReport
};

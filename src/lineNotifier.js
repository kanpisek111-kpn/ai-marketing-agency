// src/lineNotifier.js
// ระบบส่งแจ้งเตือนติดตามสถานะงาน, ส่งการ์ดตรวจงานพร้อมรูปโปสเตอร์ (LINE Flex Approval Card) และรายงานการโพสต์เข้า LINE OA

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
    `🚀 [AI Autopilot เริ่มทำงาน 7 แผนกอัตโนมัติ]`,
    `━━━━━━━━━━━━━━━━━━`,
    `📁 โปรเจกต์/เพจ: ${projectName || brief.productName || "เพจหลัก"}`,
    `📌 หัวข้อแคมเปญ: ${brief.productName || "-"}`,
    `🎨 สิ่งที่กำลังทำ: วิเคราะห์ตลาด + เขียนแคปชัน + ออกแบบโปสเตอร์ Canva/AI`,
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
    `⏳ [ความคืบหน้าทีม AI (${doneCount}/${totalSteps} แผนก)]`,
    `📁 โปรเจกต์: ${projectName || brief.productName || "เพจหลัก"}`,
    `✅ เสร็จแล้ว: ${step.avatar || "🤖"} ${step.agentName}`,
    nextStep
      ? `👉 กำลังส่งต่อให้: ${nextStep.avatar || "🤖"} ${nextStep.agentName}`
      : `👉 เสร็จครบ 7 แผนก! กำลังส่งการ์ดรูปโปสเตอร์ + แคปชันให้คุณกดยืนยันใน LINE!`
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

async function sendLineReport({ lineConfig, messageText, flexMessages }) {
  const token = (lineConfig?.channelAccessToken || "").trim();
  const targetId = (lineConfig?.targetId || "").trim();
  const mode = lineConfig?.sendMode || (targetId ? "push" : "broadcast");

  if (!token) {
    return {
      success: false,
      simulated: true,
      message: "บันทึกแจ้งเตือนลงระบบ Log เรียบร้อย (ใส่ LINE Channel Access Token เพื่อเด้งเข้ามือถือจริง)"
    };
  }

  const isPush = mode === "push" && targetId.length > 0;
  const endpoint = isPush
    ? "https://api.line.me/v2/bot/message/push"
    : "https://api.line.me/v2/bot/message/broadcast";

  const messages = Array.isArray(flexMessages) && flexMessages.length > 0
    ? flexMessages
    : [{ type: "text", text: (messageText || "").slice(0, 4900) }];

  const payload = isPush
    ? { to: targetId, messages }
    : { messages };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    // หากส่ง Flex Message ไม่ผ่าน ให้ fallback ส่งข้อความ Text แทนอัตโนมัติ
    if (flexMessages && messageText) {
      const fallbackPayload = isPush
        ? { to: targetId, messages: [{ type: "text", text: messageText.slice(0, 4900) }] }
        : { messages: [{ type: "text", text: messageText.slice(0, 4900) }] };
      const retryRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fallbackPayload)
      });
      if (retryRes.ok) {
        return {
          success: true,
          simulated: false,
          message: "ส่งข้อความแจ้งเตือนเข้า LINE OA สำเร็จ!"
        };
      }
    }
    const errBody = await response.text();
    throw new Error(`LINE Messaging API Error (${response.status}): ${errBody}`);
  }

  return {
    success: true,
    simulated: false,
    mode: isPush ? `Push ไปยัง ${targetId}` : "Broadcast ไปยังผู้ติดตาม LINE OA",
    message: "ส่งการ์ดตรวจงานและแจ้งเตือนเข้า LINE OA สำเร็จ!"
  };
}

// ส่งการ์ดตรวจงานพร้อมรูปโปสเตอร์ที่ AI ออกแบบเสร็จแล้ว + ปุ่มกดยืนยันงาน (Approve & Auto-Post) เข้า LINE OA
async function sendLineApprovalCard({
  lineConfig,
  campaign,
  brandProfile,
  visualAssets,
  cleanCaption,
  serverBaseUrl = "http://localhost:3080"
}) {
  const brandName = brandProfile?.brandName || campaign?.projectName || "KPN บิ้วอิน เชียงใหม่";
  const approvePcUrl = `${serverBaseUrl}/api/campaigns/approve-get?campaignId=${encodeURIComponent(campaign.id)}`;
  const regeneratePcUrl = `${serverBaseUrl}/api/campaigns/regenerate-get?campaignId=${encodeURIComponent(campaign.id)}`;
  const canvaUrl = visualAssets?.canva?.fbTemplateUrl || "https://www.canva.com/";
  const heroImageUrl =
    visualAssets?.fbBannerImageUrl ||
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=90";

  // สร้างลิงก์ยิงเข้า Make.com โดยตรงกรณีผู้ใช้กดยืนยันจากมือถือผ่าน 4G/5G
  const makeWebhook = (brandProfile?.automationWebhookUrl || "").trim();
  const shortCaptionForQuery = (cleanCaption || "").slice(0, 420);
  const directMakeApproveUrl = makeWebhook
    ? `${makeWebhook}?platform=Facebook&brandName=${encodeURIComponent(brandName)}&fbPageId=${encodeURIComponent(
        brandProfile?.fbPageId || ""
      )}&message=${encodeURIComponent(shortCaptionForQuery)}`
    : approvePcUrl;

  const captionPreview = (cleanCaption || "").slice(0, 260) + ((cleanCaption || "").length > 260 ? "..." : "");

  const flexBubble = {
    type: "flex",
    altText: `🎨 ตรวจงานและกดยืนยันโพสต์: ${brandName}`,
    contents: {
      type: "bubble",
      size: "mega",
      hero: {
        type: "image",
        url: heroImageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
        action: {
          type: "uri",
          label: "ดูรูปขนาดเต็ม",
          uri: heroImageUrl
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "🎨 AI ออกแบบรูป & แคปชันเสร็จแล้ว!",
            weight: "bold",
            color: "#10b981",
            size: "xs"
          },
          {
            type: "text",
            text: brandName,
            weight: "bold",
            size: "lg",
            wrap: true
          },
          {
            type: "text",
            text: visualAssets?.headline || campaign?.brief?.productName || "แคมเปญใหม่พร้อมโพสต์",
            size: "sm",
            color: "#6366f1",
            weight: "bold",
            wrap: true
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "text",
            text: "📝 ตัวอย่างแคปชันที่จะโพสต์ลงเพจ:",
            size: "xs",
            color: "#64748b",
            margin: "md",
            weight: "bold"
          },
          {
            type: "text",
            text: captionPreview || "พร้อมโพสต์ลง Facebook, IG, TikTok และ LINE OA",
            size: "xs",
            color: "#334155",
            wrap: true
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "text",
            text: "🔗 เชื่อมครบ 7 Agents: Google Flow • Canva (ไร้ลายน้ำ 100%) • Make.com • Meta Ads",
            size: "xxs",
            color: "#94a3b8",
            wrap: true,
            margin: "sm"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#10b981",
            height: "sm",
            action: {
              type: "uri",
              label: "✅ ยืนยัน & โพสต์ทุกเพจ (บนคอม)",
              uri: approvePcUrl
            }
          },
          {
            type: "button",
            style: "primary",
            color: "#6366f1",
            height: "sm",
            action: {
              type: "uri",
              label: "📲 ยืนยันส่งเข้า Make.com (มือถือ)",
              uri: directMakeApproveUrl
            }
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "🎨 เปิดดู/แต่งต่อใน Canva",
              uri: canvaUrl
            }
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "🔄 สั่ง AI ออกแบบ & คิดใหม่",
              uri: regeneratePcUrl
            }
          }
        ]
      }
    }
  };

  const fullCaptionTextMsg = {
    type: "text",
    text: [
      `📋 [แคปชันฉบับเต็มสำหรับตรวจทาน — ${brandName}]`,
      `━━━━━━━━━━━━━━━━━━`,
      cleanCaption || "",
      `━━━━━━━━━━━━━━━━━━`,
      `🖼️ ลิงก์รูปโปสเตอร์ AI (FB 1200x630):\n${heroImageUrl}`,
      `🎨 ลิงก์แก้ไขใน Canva:\n${canvaUrl}`,
      `✅ กดปุ่มสีเขียวในการ์ดด้านบนเพื่อยืนยันและปล่อยโพสต์ลงทุกแพลตฟอร์มได้ทันที!`
    ].join("\n").slice(0, 4900)
  };

  return sendLineReport({
    lineConfig,
    messageText: fullCaptionTextMsg.text,
    flexMessages: [flexBubble, fullCaptionTextMsg]
  });
}

module.exports = {
  buildProgressBar,
  formatPlatformPostingStatusLineMessage,
  formatCampaignStartLineMessage,
  formatStepProgressLineMessage,
  formatLiveStatusCheckLineMessage,
  formatCampaignLineSummary,
  sendLineReport,
  sendLineApprovalCard
};

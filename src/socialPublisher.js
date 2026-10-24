// src/socialPublisher.js
// ระบบจัดการลิงก์เพจหลัก (FB / TikTok / IG / LINE / Web) และระบบสั่งโพสต์ลงเพจอัตโนมัติ (Social Auto-Publisher)

function parseSocialHandle(urlStr, platform) {
  if (!urlStr || !urlStr.trim()) return "";
  const clean = urlStr.trim();
  try {
    const u = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    if (platform === "facebook" && u.searchParams.get("id")) {
      return `ID:${u.searchParams.get("id")}`;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      return parts[0].startsWith("@") ? parts[0] : `@${parts[0]}`;
    }
    return u.hostname;
  } catch (e) {
    return clean;
  }
}

// ดึงรหัสเพจ (Page ID) จากลิงก์ Facebook อัตโนมัติ เช่น https://www.facebook.com/profile.php?id=61594100912936
function extractFacebookPageIdFromUrl(fbUrl = "") {
  if (!fbUrl || typeof fbUrl !== "string") return "";
  const clean = fbUrl.trim();
  try {
    const u = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
    const idParam = u.searchParams.get("id");
    if (idParam && /^\d+$/.test(idParam)) {
      return idParam;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1] || "";
    if (/^\d{8,}$/.test(lastPart)) {
      return lastPart;
    }
    const dashMatch = lastPart.match(/-(\d{8,})$/);
    if (dashMatch) return dashMatch[1];
  } catch (e) {
    // ignore
  }
  return "";
}

// สกัดเฉพาะข้อความแคปชันโพสต์ขายของล้วนๆ (ตัดหัวข้อรายงาน Markdown ### และตารางสคริปต์ออก) เพื่อนำไปโพสต์ลงเพจจริง
function extractCleanPostCaption(rawOutput = "", brief = {}) {
  if (!rawOutput || typeof rawOutput !== "string") {
    return `🔥 ${brief.productName || "โปรโมชันพิเศษ"} — ${brief.commandText || brief.goal || "ทักแชทสอบถามได้เลยครับ"}`;
  }

  // ถ้ารายงานมีบล็อกโควต (> ...) ของโพสต์ที่ 1 ให้ดึงเฉพาะบล็อกโควตแรกมาเป็นแคปชันโพสต์จริง
  const lines = rawOutput.split("\n");
  const quoteLines = [];
  let inFirstQuoteBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) {
      inFirstQuoteBlock = true;
      quoteLines.push(
        trimmed
          .replace(/^>\s?/, "")
          .replace(/\*\*/g, "")
      );
    } else if (inFirstQuoteBlock && trimmed === "---") {
      break;
    } else if (inFirstQuoteBlock && trimmed.startsWith("####")) {
      break;
    }
  }

  if (quoteLines.length >= 3) {
    return quoteLines.join("\n").trim();
  }

  // กรณี LLM เขียนแบบไม่มีเครื่องหมาย > ให้ตัดหัวข้อ ### และตารางออก
  const cleaned = lines
    .filter((l) => {
      const t = l.trim();
      if (t.startsWith("### ") || t.startsWith("#### ")) return false;
      if (t.startsWith("|") && t.endsWith("|")) return false;
      if (t === "---") return false;
      return true;
    })
    .join("\n")
    .replace(/\*\*/g, "")
    .trim();

  return cleaned || rawOutput;
}

// ดึงข้อมูลเบื้องต้นจากลิงก์เพจ/เว็บที่ผู้ใช้ใส่เข้ามา
async function inspectChannelLinks(brandProfile) {
  const autoPageId = extractFacebookPageIdFromUrl(brandProfile.fbUrl);
  const summary = {
    fbHandle: parseSocialHandle(brandProfile.fbUrl, "facebook"),
    detectedFbPageId: autoPageId || brandProfile.fbPageId || "",
    tiktokHandle: parseSocialHandle(brandProfile.tiktokUrl, "tiktok"),
    igHandle: parseSocialHandle(brandProfile.igUrl, "instagram"),
    lineHandle: brandProfile.lineUrl || "",
    websiteTitle: "",
    websiteDescription: ""
  };

  const targetUrl = brandProfile.websiteUrl || brandProfile.fbUrl || "";
  if (targetUrl && targetUrl.startsWith("http")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
        if (titleMatch) summary.websiteTitle = titleMatch[1].trim();
        if (descMatch) summary.websiteDescription = descMatch[1].trim();
      }
    } catch (e) {
      // ข้ามกรณีเว็บปลายทางบล็อกบอท
    }
  }

  return summary;
}

// พยายามสลับ User Access Token เป็น Page Access Token ของเพจอัตโนมัติ
async function resolvePageAccessToken(pageId, token) {
  try {
    // 1. ลองดึงจาก /me/accounts ก่อนว่ามีเพจไหนตรงกับ pageId หรือมีเพจแรกไหม
    const accRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`
    );
    const accData = await accRes.json();
    if (accData?.data && accData.data.length > 0) {
      const matched = accData.data.find((p) => String(p.id) === String(pageId)) || accData.data[0];
      if (matched && matched.access_token) {
        return {
          pageId: matched.id,
          pageName: matched.name,
          pageAccessToken: matched.access_token
        };
      }
    }

    // 2. ลองดึง access_token ของ pageId โดยตรง
    if (pageId) {
      const pageRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`
      );
      const pageData = await pageRes.json();
      if (pageData?.access_token) {
        return {
          pageId: pageData.id || pageId,
          pageName: pageData.name || "",
          pageAccessToken: pageData.access_token
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { pageId, pageAccessToken: token };
}

const { spawn } = require("child_process");

// คัดลอกแคปชันเข้า Windows Clipboard และเปิดหน้าเพจในเบราว์เซอร์ให้อัตโนมัติ (กรณีแอป FB ยังไม่ได้เปิด pages_manage_posts)
function triggerWindowsAssistedFacebookPost(pageId, message) {
  try {
    const pageUrl = `https://www.facebook.com/${encodeURIComponent(pageId)}`;
    const psScript = [
      `[Console]::InputEncoding = [System.Text.Encoding]::UTF8`,
      `$text = [Console]::In.ReadToEnd()`,
      `Set-Clipboard -Value $text`,
      `Start-Process "${pageUrl}"`
    ].join("; ");
    const child = spawn("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", psScript], {
      stdio: ["pipe", "ignore", "ignore"]
    });
    child.stdin.write(message, "utf8");
    child.stdin.end();
  } catch (e) {
    // ignore
  }
}

// โพสต์ลงเพจ Facebook จริงผ่าน Facebook Graph API
async function publishToFacebookPage({ pageId, pageAccessToken, message, link }) {
  // ลองแปลงเป็น Page Token อัตโนมัติหากผู้ใช้เผลอวาง User Token
  const resolved = await resolvePageAccessToken(pageId, pageAccessToken);
  const targetPageId = resolved.pageId || pageId;
  const targetToken = resolved.pageAccessToken || pageAccessToken;

  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(targetPageId)}/feed`;
  const bodyPayload = {
    message,
    access_token: targetToken
  };
  if (link && link.startsWith("http") && !link.includes("manager.line.biz")) {
    bodyPayload.link = link;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    if (errText.includes("(#200)") || errText.includes("pages_manage_posts")) {
      // เปิดโหมดช่วยโพสต์อัตโนมัติบน Windows: คัดลอกแคปชันเข้า Clipboard + เด้งเปิดหน้าเพจให้กด Ctrl+V ได้ทันที
      triggerWindowsAssistedFacebookPost(targetPageId, message);
      return {
        success: true,
        simulated: false,
        assisted: true,
        platform: "Facebook Page",
        targetUrl: `https://www.facebook.com/${targetPageId}`,
        message: `✅ คัดลอกแคปชันเข้า Clipboard + เปิดหน้าเพจ Facebook ให้แล้ว! (กด Ctrl+V วางโพสต์ได้เลย — หรือเพิ่มสิทธิ์ pages_manage_posts ในแอป FB เพื่อให้บอทโพสต์หลังบ้านเอง)`
      };
    }
    let friendlyError = `Facebook Graph API Error (${res.status}): ${errText}`;
    if (errText.includes("OAuthException") && errText.includes("190")) {
      friendlyError = `❌ Facebook Access Token หมดอายุหรือไม่ถูกต้อง (Error #190) กรุณากดรับ Token ใหม่จาก Graph API Explorer`;
    }
    throw new Error(friendlyError);
  }

  const data = await res.json();
  return {
    success: true,
    simulated: false,
    postId: data.id,
    platform: "Facebook Page",
    message: `✅ โพสต์ขึ้นเพจ Facebook จริงสำเร็จ! (Post ID: ${data.id})`
  };
}

// ส่งข้อมูลโพสต์ไปยัง Automation Webhook (Make.com / n8n / Zapier) เพื่อกระจายลง TikTok, IG, FB อัตโนมัติ
async function publishViaAutomationWebhook({ webhookUrl, payload }) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Automation Webhook Error (${res.status}): ${errText}`);
  }

  return {
    success: true,
    simulated: false,
    platform: "Multi-Platform Webhook (FB / IG / TikTok)",
    message: "✅ ส่งคำสั่งโพสต์จริงไปยังระบบ Automation Webhook สำเร็จ!"
  };
}

// ฟังก์ชันรวมสำหรับสั่งโพสต์ลงเพจที่ผูกไว้
async function executeSocialPublish({ brandProfile, platforms, contentText, campaignTitle, brief, lineSettings }) {
  const results = [];
  const targetPlatforms = platforms && platforms.length > 0 ? platforms : ["Facebook", "Instagram", "TikTok"];
  const cleanCaption = extractCleanPostCaption(contentText, brief);
  const webhookUrl = (brandProfile?.automationWebhookUrl || "").trim();

  // 1. ตรวจสอบการโพสต์ตรงเข้า Facebook Page (Direct Graph API)
  if (targetPlatforms.includes("Facebook")) {
    const autoPageId = extractFacebookPageIdFromUrl(brandProfile?.fbUrl);
    const pageId = (brandProfile?.fbPageId || autoPageId || "").trim();
    const pageToken = (brandProfile?.fbPageAccessToken || "").trim();
    if (pageId && pageToken) {
      const fbRes = await publishToFacebookPage({
        pageId,
        pageAccessToken: pageToken,
        message: cleanCaption,
        link: brandProfile?.websiteUrl || ""
      });
      results.push(fbRes);
    } else if (webhookUrl) {
      const whRes = await publishViaAutomationWebhook({
        webhookUrl,
        payload: {
          campaignTitle,
          brandName: brandProfile?.brandName,
          platforms: ["Facebook"],
          links: { fbUrl: brandProfile?.fbUrl },
          content: cleanCaption,
          timestamp: new Date().toISOString()
        }
      });
      results.push(whRes);
    } else {
      results.push({
        success: true,
        simulated: true,
        platform: "Facebook Page",
        targetUrl: brandProfile?.fbUrl || "ยังไม่ระบุลิงก์เพจ FB",
        message: `⚠️ โหมดจำลอง (ยังไม่ได้ใส่ Facebook Page Access Token สำหรับโพสต์ขึ้นเพจจริง)`
      });
    }
  }

  // 2. ตรวจสอบการส่งเข้า Instagram & TikTok ผ่าน Automation Webhook
  if (targetPlatforms.includes("Instagram") || targetPlatforms.includes("TikTok")) {
    if (webhookUrl) {
      const whRes = await publishViaAutomationWebhook({
        webhookUrl,
        payload: {
          campaignTitle,
          brandName: brandProfile?.brandName,
          platforms: targetPlatforms.filter((p) => p === "Instagram" || p === "TikTok"),
          links: {
            fbUrl: brandProfile?.fbUrl,
            tiktokUrl: brandProfile?.tiktokUrl,
            igUrl: brandProfile?.igUrl,
            lineUrl: brandProfile?.lineUrl,
            websiteUrl: brandProfile?.websiteUrl
          },
          content: cleanCaption,
          timestamp: new Date().toISOString()
        }
      });
      results.push(whRes);
    } else {
      if (targetPlatforms.includes("Instagram")) {
        results.push({
          success: true,
          simulated: true,
          platform: "Instagram",
          targetUrl: brandProfile?.igUrl || "ยังไม่ระบุลิงก์ IG",
          message: `⚠️ โหมดจำลอง (เตรียมแคปชัน IG เรียบร้อย — เชื่อม Webhook เพื่อโพสต์อัตโนมัติ)`
        });
      }
      if (targetPlatforms.includes("TikTok")) {
        results.push({
          success: true,
          simulated: true,
          platform: "TikTok",
          targetUrl: brandProfile?.tiktokUrl || "ยังไม่ระบุลิงก์ TikTok",
          message: `⚠️ โหมดจำลอง (เตรียมสคริปต์และแคปชัน TikTok เรียบร้อย — เชื่อม Webhook เพื่อโพสต์อัตโนมัติ)`
        });
      }
    }
  }

  // 3. ตรวจสอบการบรอดแคสต์โพสต์ขายของเข้า LINE OA จริง (ถ้าผู้ใช้ใส่ LINE Channel Access Token ไว้แล้ว)
  if (targetPlatforms.includes("LINE OA")) {
    const lineToken = (lineSettings?.channelAccessToken || "").trim();
    if (lineToken) {
      const targetUserId = (lineSettings?.targetUserId || "").trim();
      const endpoint = targetUserId
        ? "https://api.line.me/v2/bot/message/push"
        : "https://api.line.me/v2/bot/message/broadcast";
      const payload = targetUserId
        ? { to: targetUserId, messages: [{ type: "text", text: cleanCaption.slice(0, 4900) }] }
        : { messages: [{ type: "text", text: cleanCaption.slice(0, 4900) }] };

      const lineRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!lineRes.ok) {
        const errText = await lineRes.text();
        throw new Error(`LINE OA Broadcast Error (${lineRes.status}): ${errText}`);
      }

      results.push({
        success: true,
        simulated: false,
        platform: "LINE OA",
        targetUrl: brandProfile?.lineUrl || "LINE Official Account",
        message: `✅ บรอดแคสต์โพสต์ขายของเข้า LINE OA จริงสำเร็จ!`
      });
    } else {
      results.push({
        success: true,
        simulated: true,
        platform: "LINE OA",
        targetUrl: brandProfile?.lineUrl || "ยังไม่ระบุลิงก์ LINE OA",
        message: `⚠️ โหมดจำลอง (ยังไม่ได้ใส่ LINE Channel Access Token)`
      });
    }
  }

  return results;
}

module.exports = {
  inspectChannelLinks,
  executeSocialPublish,
  parseSocialHandle,
  extractFacebookPageIdFromUrl,
  extractCleanPostCaption
};

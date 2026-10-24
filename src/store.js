// src/store.js
const fs = require("fs");
const path = require("path");
const { DEFAULT_AGENTS } = require("./defaultAgents");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const DEFAULT_BRAND_PROFILES = [
  {
    id: "brand_default_1",
    brandName: "เพจ Lumina Glow (สกินแคร์)",
    icon: "✨",
    color: "#6366f1",
    productDefault: "Lumina Glow Serum (เซรั่มวิตซีญี่ปุ่นลดจุดด่างดำ)",
    goalDefault: "ปั้นยอดขาย 500 ขวดใน 30 วัน และดึงคนทักแชทเพจ/LINE",
    targetAudienceDefault: "ผู้หญิงและวัยทำงานอายุ 22-40 ปี ที่พักผ่อนน้อย ผิวหมองคล้ำ ชอบช้อปออนไลน์",
    budgetDefault: "25,000 บาท/เดือน",
    commandDefault: "จุดเด่นคือสารสกัดนำเข้าจากญี่ปุ่น ซึมไวใน 5 วินาที โปรเปิดตัว ซื้อ 1 แถมขนาดทดลอง ส่งฟรีทั่วประเทศ",
    fbUrl: "https://facebook.com/LuminaGlowThailand",
    tiktokUrl: "https://tiktok.com/@luminaglow.th",
    igUrl: "https://instagram.com/luminaglow.official",
    lineUrl: "https://lin.ee/luminaglow",
    websiteUrl: "https://luminaglow-th.com",
    shopUrl: "https://shopee.co.th/luminaglow",
    contactPhone: "099-123-4567",
    brandTone: "จริงใจ ป้ายยาสนุก ทันสมัย เน้นรีวิวจริง",
    fbPageId: "",
    fbPageAccessToken: "",
    igAccountId: "",
    automationWebhookUrl: ""
  },
  {
    id: "brand_default_2",
    brandName: "เพจ AuraPrime Clinic (คลินิกความงาม)",
    icon: "🏥",
    color: "#ec4899",
    productDefault: "AuraPrime Clinic (โปรแกรมปรับรูปหน้าและเลเซอร์ผิวใส)",
    goalDefault: "ดึงลูกค้าจองคิวปรึกษาคุณหมอและซื้อคอร์ส 120 เคสต่อเดือน",
    targetAudienceDefault: "วัยทำงานและผู้บริหารอายุ 25-48 ปี ที่ต้องการดูแลบุคลิกภาพแบบปลอดภัยเห็นผลจริง",
    budgetDefault: "45,000 บาท/เดือน",
    commandDefault: "ดูแลโดยแพทย์เฉพาะทางทุกเคส เครื่องแท้ผ่าน อย. โปรทดลองทำครั้งแรก ลด 40% เมื่อจองคิวผ่าน LINE",
    fbUrl: "https://facebook.com/AuraPrimeClinicTH",
    tiktokUrl: "https://tiktok.com/@auraprime.clinic",
    igUrl: "https://instagram.com/auraprimeclinic",
    lineUrl: "https://lin.ee/auraprime",
    websiteUrl: "https://auraprimeclinic.com",
    shopUrl: "https://auraprimeclinic.com/promotions",
    contactPhone: "02-555-8899",
    brandTone: "น่าเชื่อถือ พรีเมียม ให้ความรู้โดยผู้เชี่ยวชาญ",
    fbPageId: "",
    fbPageAccessToken: "",
    igAccountId: "",
    automationWebhookUrl: ""
  }
];

function getInitialDB() {
  return {
    settings: {
      activeProvider: "simulation", // "simulation" | "gemini" | "openai" | "claude"
      activeBrandId: "brand_default_1",
      apiKeys: {
        gemini: "",
        openai: "",
        claude: ""
      },
      models: {
        gemini: "gemini-2.5-flash",
        openai: "gpt-4o-mini",
        claude: "claude-3-7-sonnet-latest"
      },
      line: {
        enabled: true,
        notifyOnStart: true,
        notifyOnEachStep: true,
        autoSendOnComplete: true,
        sendMode: "broadcast", // "push" | "broadcast"
        channelAccessToken: "",
        targetId: ""
      }
    },
    brandProfiles: DEFAULT_BRAND_PROFILES,
    agents: DEFAULT_AGENTS,
    campaigns: [],
    lineLogs: [],
    publishLogs: []
  };
}

function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = getInitialDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.agents || parsed.agents.length === 0) {
      parsed.agents = DEFAULT_AGENTS;
    }
    if (!parsed.settings) {
      parsed.settings = getInitialDB().settings;
    }
    if (parsed.settings.line) {
      if (parsed.settings.line.notifyOnStart === undefined) parsed.settings.line.notifyOnStart = true;
      if (parsed.settings.line.notifyOnEachStep === undefined) parsed.settings.line.notifyOnEachStep = true;
      if (parsed.settings.line.autoSendOnComplete === undefined) parsed.settings.line.autoSendOnComplete = true;
    }
    if (!parsed.brandProfiles || parsed.brandProfiles.length === 0) {
      parsed.brandProfiles = DEFAULT_BRAND_PROFILES;
    }
    if (!parsed.settings.activeBrandId) {
      parsed.settings.activeBrandId = parsed.brandProfiles[0].id;
    }
    if (!parsed.campaigns) parsed.campaigns = [];
    if (!parsed.lineLogs) parsed.lineLogs = [];
    if (!parsed.publishLogs) parsed.publishLogs = [];
    return parsed;
  } catch (err) {
    const initial = getInitialDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
}

function saveDB(db) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

module.exports = {
  ensureDB,
  saveDB,
  DEFAULT_AGENTS,
  DEFAULT_BRAND_PROFILES
};

// src/store.js
const fs = require("fs");
const path = require("path");
const { DEFAULT_AGENTS } = require("./defaultAgents");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SEED_DB_PATH = path.join(DATA_DIR, "default_db.json");

const DEFAULT_BRAND_PROFILES = [
  {
    id: "brand_1792833736158",
    brandName: "KPN บิ้วอิน เชียงใหม่",
    icon: "🏠",
    color: "#6366f1",
    productDefault: "KPN บิ้วอิน เชียงใหม่",
    goalDefault: "10 งานใน 1 เดือน",
    targetAudienceDefault: "เจ้าของบ้าน คอนโด ร้านค้า เชียงใหม่ ที่ต้องการทำบิ้วอิน",
    budgetDefault: "1000",
    commandDefault: "รับออกแบบและติดตั้งเฟอร์นิเจอร์บิ้วอิน เชียงใหม่ งานคุณภาพมาตรฐานช่างมืออาชีพ ประเมินราคาฟรี งบไม่บานปลาย",
    fbUrl: "https://www.facebook.com/1226235303916599",
    tiktokUrl: "",
    igUrl: "",
    lineUrl: "https://manager.line.biz/account/@742srmne",
    websiteUrl: "",
    shopUrl: "",
    contactPhone: "088-7888-446",
    brandTone: "มืออาชีพ น่าเชื่อถือ เห็นผลงานจริง",
    fbPageId: "1226235303916599",
    fbPageAccessToken: "",
    igAccountId: "",
    automationWebhookUrl: ""
  },
  {
    id: "brand_fb_101163072466099",
    brandName: "รับสร้างบ้านเชียงใหม่ ลำพูน by KPN Construction",
    icon: "🏗️",
    color: "#0ea5e9",
    productDefault: "รับสร้างบ้านเชียงใหม่ ลำพูน by KPN Construction",
    goalDefault: "5 หลังใน 1 เดือน",
    targetAudienceDefault: "คนอยากสร้างบ้านในเชียงใหม่และลำพูน",
    budgetDefault: "5000",
    commandDefault: "รับสร้างบ้านเชียงใหม่ ลำพูน ครบวงจร ออกแบบฟรี ขออนุญาตฟรี คุมงบได้จริง ไม่ทิ้งงาน การันตีผลงาน",
    fbUrl: "https://www.facebook.com/101163072466099",
    lineUrl: "https://manager.line.biz/account/@742srmne",
    contactPhone: "088-7888-446",
    fbPageId: "101163072466099",
    fbPageAccessToken: ""
  },
  {
    id: "brand_fb_101149255150165",
    brandName: "KPN construction รับสร้างบ้านรีโนเวทราคาถูกภาคเหนือ",
    icon: "🔨",
    color: "#10b981",
    productDefault: "KPN construction รับสร้างบ้านและรีโนเวทภาคเหนือ",
    goalDefault: "10 งานรีโนเวท/สร้างบ้านใน 1 เดือน",
    targetAudienceDefault: "เจ้าของบ้าน อาคารพาณิชย์ ในภาคเหนือที่ต้องการสร้างบ้านหรือรีโนเวท",
    budgetDefault: "3000",
    commandDefault: "รับสร้างบ้าน ต่อเติม รีโนเวทบ้านราคาถูกภาคเหนือ โดยทีมวิศวกรและช่างมืออาชีพ ประเมินหน้างานฟรี",
    fbUrl: "https://www.facebook.com/101149255150165",
    lineUrl: "https://manager.line.biz/account/@742srmne",
    contactPhone: "088-7888-446",
    fbPageId: "101149255150165",
    fbPageAccessToken: ""
  },
  {
    id: "brand_fb_101125258093341",
    brandName: "AIR WASH บริการล้างติดตั้งแอร์ทั่วลำพูน",
    icon: "❄️",
    color: "#06b6d4",
    productDefault: "AIR WASH บริการล้างแอร์ ติดตั้งแอร์ ลำพูน",
    goalDefault: "ลูกค้าจองคิวล้าง/ติดตั้งแอร์ 50 คิวต่อเดือน",
    targetAudienceDefault: "เจ้าของบ้าน หอพัก ร้านค้า ในจังหวัดลำพูน",
    budgetDefault: "1000",
    commandDefault: "บริการล้างแอร์ ติดตั้งแอร์ ซ่อมแอร์ทั่วลำพูน แอร์เย็นฉ่ำ สะอาด ประหยัดไฟ บริการไว ราคาถูก",
    fbUrl: "https://www.facebook.com/101125258093341",
    lineUrl: "https://manager.line.biz/account/@742srmne",
    contactPhone: "088-7888-446",
    fbPageId: "101125258093341",
    fbPageAccessToken: ""
  },
  {
    id: "brand_fb_895532130501923",
    brandName: "Ave'Bag Shop",
    icon: "👜",
    color: "#ec4899",
    productDefault: "กระเป๋าแฟชั่น Ave'Bag Shop",
    goalDefault: "ยอดขาย 100 ใบต่อเดือน",
    targetAudienceDefault: "ผู้หญิงวัยเรียนและวัยทำงานที่ชอบกระเป๋าสวยคุ้มราคา",
    budgetDefault: "1000",
    commandDefault: "กระเป๋าแฟชั่นดีไซน์สวย วัสดุเกรดพรีเมียม จุของได้เยอะ แมตช์ง่ายทุกลุค พร้อมส่งทั่วไทย",
    fbUrl: "https://www.facebook.com/895532130501923",
    fbPageId: "895532130501923",
    fbPageAccessToken: ""
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
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
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
    const initial = fs.existsSync(SEED_DB_PATH)
      ? JSON.parse(fs.readFileSync(SEED_DB_PATH, "utf8"))
      : getInitialDB();
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
    const initial = fs.existsSync(SEED_DB_PATH)
      ? JSON.parse(fs.readFileSync(SEED_DB_PATH, "utf8"))
      : getInitialDB();
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

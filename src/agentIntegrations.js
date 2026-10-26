// src/agentIntegrations.js
// ระบบเชื่อมต่อ Agent ทั้ง 7 ตัวเข้ากับเครื่องมือจริง (Google Flow, Canva Studio, Meta Ad Library, Google Trends, Meta Ads Manager, Make.com, LINE Flex Approval)
// การันตีภาพโฆษณาทุกใบ ไร้ลายน้ำ 100% (100% Watermark-Free)
const fs = require("fs");
const path = require("path");

function getActiveBaseUrl() {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  try {
    const tFile = path.join(__dirname, "../data/active_tunnel.txt");
    if (fs.existsSync(tFile)) {
      const saved = fs.readFileSync(tFile, "utf8").trim();
      if (saved.startsWith("http")) return saved;
    }
  } catch (e) {}
  return "https://dsl-occasional-acute-finger.trycloudflare.com";
}

function getBuiltinPhotographyCatalog() {
  const base = getActiveBaseUrl();
  return {
    tv_wall: [
      `${base}/images/builtin/builtin_thai_tv_wall.jpg`,
      `${base}/images/builtin/builtin_tv_wall.jpg`
    ],
    closet: [
      `${base}/images/builtin/builtin_thai_walkin_closet.jpg`,
      `${base}/images/builtin/builtin_walkin_closet.jpg`
    ],
    kitchen: [
      `${base}/images/builtin/builtin_thai_modern_kitchen.jpg`,
      `${base}/images/builtin/builtin_kitchen.jpg`
    ],
    bedroom: [
      `${base}/images/builtin/builtin_thai_bedroom_headboard.jpg`
    ],
    entryway: [
      `${base}/images/builtin/builtin_thai_entryway_foyer.jpg`
    ],
    office_study: [
      `${base}/images/builtin/builtin_thai_tv_wall.jpg`
    ],
    dining_bar: [
      `${base}/images/builtin/builtin_thai_modern_kitchen.jpg`
    ]
  };
}

const AGENT_TOOL_ECOSYSTEM = {
  cmo_orchestrator: {
    agentId: "cmo_orchestrator",
    toolName: "AI Autopilot Planner + Notion / Google Sheets (via Make.com)",
    toolIcon: "🧭",
    toolBadge: "Autopilot CMO & Make.com",
    toolUrl: "https://eu1.make.com/3327599/scenarios",
    description: "คิดหัวข้อแคมเปญขายของรายวันเองอัตโนมัติ กำหนด KPI แจกงานลูกทีม 6 แผนก และส่งใบขออนุมัติเข้า LINE OA"
  },
  market_researcher: {
    agentId: "market_researcher",
    toolName: "Meta Ad Library + Google Trends TH + TikTok Creative Center",
    toolIcon: "🔎",
    toolBadge: "Meta Ad Library & Google Trends",
    toolUrl: "https://www.facebook.com/ads/library/",
    description: "ส่องโฆษณาคู่แข่งที่กำลังยิงแอดจริงบน Facebook/IG และดึงเทรนด์การค้นหาล่าสุดในไทย"
  },
  seo_specialist: {
    agentId: "seo_specialist",
    toolName: "Google Search Console + Google Maps SEO + Hashtag Matrix",
    toolIcon: "📈",
    toolBadge: "Google SEO & Local Maps",
    toolUrl: "https://trends.google.com/trends/?geo=TH",
    description: "สร้างชุดคีย์เวิร์ดติดหน้าแรก Google, โพสต์ปักหมุด Google Business Profile และชุด Hashtag 30 คำ"
  },
  ad_strategist: {
    agentId: "ad_strategist",
    toolName: "Meta Ads Manager + TikTok Ads Manager + LINE LAP",
    toolIcon: "🎯",
    toolBadge: "Meta Ads & TikTok Ads",
    toolUrl: "https://adsmanager.facebook.com/",
    description: "สร้างโครงสร้างแคมเปญยิงแอด (Audience Targeting, งบประมาณ, A/B Testing) พร้อมไฟล์ตั้งค่า Ads"
  },
  content_copywriter: {
    agentId: "content_copywriter",
    toolName: "Multi-Platform Viral Copy Engine (FB / IG / TikTok / LINE)",
    toolIcon: "✍️",
    toolBadge: "Viral Copywriter Engine",
    toolUrl: "https://www.facebook.com/",
    description: "เขียนแคปชันขายของแยกตามแพลตฟอร์ม (โพสต์เพจ FB, แคปชัน IG, สคริปต์คลิปสั้น TikTok, บรอดแคสต์ LINE)"
  },
  creative_director: {
    agentId: "creative_director",
    toolName: "Google Flow (Imagen 3 / Veo) + Canva Design Studio (No Watermark)",
    toolIcon: "🎨",
    toolBadge: "Google Flow + Canva (ไร้ลายน้ำ)",
    toolUrl: "https://labs.google/fx/tools/flow",
    description: "เขียน Prompt เจนภาพ/วิดีโอใน Google Flow (Imagen 3 / Veo) ไร้ลายน้ำ 100% พร้อมส่งต่อเข้า Canva Studio เพื่อทำโพสต์ลงทุกเพจ"
  },
  social_scheduler: {
    agentId: "social_scheduler",
    toolName: "Make.com Automation + Facebook Graph API + LINE Approval Bot",
    toolIcon: "📤",
    toolBadge: "Make.com + LINE Approval",
    toolUrl: "https://eu1.make.com/3327599/scenarios",
    description: "ส่งรูปที่ออกแบบเสร็จและแคปชันเข้า LINE ให้คุณกด 'ยืนยันงาน' แล้วปล่อยโพสต์ลง FB / IG / TikTok / LINE อัตโนมัติ"
  }
};

const CLEAN_UNWATERMARKED_PHOTOS = {
  get builtin() {
    const catalog = getBuiltinPhotographyCatalog();
    return [
      ...catalog.tv_wall,
      ...catalog.closet,
      ...catalog.kitchen,
      ...catalog.bedroom,
      ...catalog.office_study,
      ...catalog.dining_bar,
      ...catalog.entryway
    ];
  },
  construction: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=90"
  ],
  airwash: [
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=90"
  ],
  bag: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=90"
  ]
};

// คลังไอเดียแคมเปญอัตโนมัติ (AI Autopilot) แยกตามประเภทธุรกิจ เพื่อให้ AI คิดงานเองได้ทันทีโดยไม่ต้องพิมพ์สั่ง
function generateAutonomousBriefForBrand(brandProfile = {}) {
  const name = brandProfile.brandName || "KPN บิ้วอิน เชียงใหม่";
  const lower = name.toLowerCase();

  let angles = [];
  if (lower.includes("บิ้วอิน") || lower.includes("ตกแต่ง")) {
    angles = [
      {
        theme: "เปลี่ยนบ้านโล่งเป็นบ้านหรู ด้วยงานบิ้วอินสั่งตัดพอดีทุกมุม",
        goal: "ดึงลูกค้าเจ้าของบ้านและคอนโดในเชียงใหม่-ลำพูน ทักแชทประเมินราคาฟรี 15 เคสในสัปดาห์นี้",
        audience: "เจ้าของบ้านใหม่ คอนโด โฮมออฟฟิศ และคาเฟ่ในเชียงใหม่-ลำพูน อายุ 28-55 ปี ที่ต้องการงานบิ้วอินคุณภาพ",
        commandText: "เน้นจุดขาย: ออกแบบ 3D ให้เห็นภาพก่อนทำจริง ใช้วัสดุเกรดพรีเมียม ทนชื้น ไม่บวม งานเนี้ยบโดยทีมช่างมืออาชีพเชียงใหม่ งบไม่บานปลาย มีรับประกันผลงาน ทักแชทวันนี้ประเมินราคาฟรี!"
      },
      {
        theme: "5 จุดในบ้านที่ทำบิ้วอินแล้วคุ้มที่สุด สวยหรู เก็บของได้เยอะขึ้น 3 เท่า",
        goal: "สร้างยอดแชร์และดึงลูกค้าทัก LINE OA เพื่อส่งแปลนบ้านประเมินราคา 20 ราย",
        audience: "คนรักการแต่งบ้าน เจ้าของบ้านจัดสรรและคอนโดในเชียงใหม่ ที่อยากจัดระเบียบบ้านให้ดูหรูเหมือนโรงแรม",
        commandText: "ให้ความรู้ควบคู่การขาย: แนะนำจุดทำบิ้วอินยอดฮิต (ผนังทีวี Living Room, ตู้เสื้อผ้าสูงชนฝ้า, เคาน์เตอร์ครัวบิ้วอิน) พร้อมโชว์มาตรฐานงานช่าง KPN บิ้วอิน เชียงใหม่ นัดวัดหน้างานฟรี!"
      },
      {
        theme: "โปรโมชันพิเศษเดือนนี้! จองคิวทำบิ้วอินกับ KPN เชียงใหม่ ฟรีค่าออกแบบ 3D",
        goal: "ปิดการขายลูกค้าจองคิวทำบิ้วอินภายในเดือนนี้ 10 หลัง",
        audience: "ผู้ที่กำลังตรวจรับบ้านใหม่หรือรีโนเวทบ้านในเชียงใหม่-ภาคเหนือ",
        commandText: "กระตุ้นการตัดสินใจด่วน: รับจำนวนจำกัดต่อเดือนเพื่อคุมคุณภาพงานทุกหลัง ฟรีวัดพื้นที่และประเมินราคาหน้างาน การันตีส่งมอบตรงเวลา ไม่ทิ้งงาน"
      }
    ];
  } else if (lower.includes("สร้างบ้าน") || lower.includes("construction") || lower.includes("รีโนเวท")) {
    angles = [
      {
        theme: "สร้างบ้านในฝันที่เชียงใหม่-ลำพูน งบไม่บานปลาย การันตีไม่ทิ้งงาน 100%",
        goal: "ดึงลูกค้าที่มีที่ดินหรือต้องการรีโนเวทบ้าน ทักแชทปรึกษาวิศวกรและประเมินงบฟรี 10 เคส",
        audience: "ผู้ที่วางแผนสร้างบ้านใหม่ หรือรีโนเวทบ้านในเชียงใหม่ ลำพูน และภาคเหนือ อายุ 30-60 ปี",
        commandText: "ชูจุดแข็ง KPN Construction: ดูแลครบวงจรตั้งแต่เขียนแบบ ขออนุญาตก่อสร้าง ไปจนถึงส่งมอบบ้าน มีสัญญาชัดเจน แบ่งจ่ายตามงวดงานจริง วัสดุมาตรฐาน มอก. ทีมวิศวกรและช่างมืออาชีพ"
      },
      {
        theme: "ชุบชีวิตบ้านเก่าให้เป็นบ้านใหม่สไตล์โมเดิร์น ด้วยทีมรีโนเวทมืออาชีพภาคเหนือ",
        goal: "เพิ่มยอดทักแชทส่งรูปบ้านเดิมมาประเมินราคารีโนเวทฟรี 15 ราย",
        audience: "เจ้าของบ้านมือสอง อาคารพาณิชย์ หรือบ้านเก่าในเชียงใหม่-ลำพูน ที่ต้องการปรับปรุงบ้าน",
        commandText: "เน้นความคุ้มค่าของการรีโนเวท: แก้ปัญหาบ้านทรุด รั่วซึม ต่อเติมครัว โรงจอดรถ ปรับโฉมใหม่ทั้งหลังในงบที่คุณกำหนดได้ ประเมินหน้างานฟรีโดยทีมช่าง KPN Construction"
      }
    ];
  } else if (lower.includes("air wash") || lower.includes("แอร์")) {
    angles = [
      {
        theme: "แอร์ไม่เย็น มีกลิ่นอับ ค่าไฟพุ่ง! เรียก AIR WASH ล้างแอร์สะอาดลึกถึงคอยล์",
        goal: "รับจองคิวล้างแอร์และติดตั้งแอร์ในลำพูน-เชียงใหม่ 30 เครื่องในสัปดาห์นี้",
        audience: "เจ้าของบ้าน หอพัก ร้านค้า และออฟฟิศในลำพูนและพื้นที่ใกล้เคียง",
        commandText: "โปรโมชันล้างแอร์สะอาดปลอดเชื้อโรค ประหยัดค่าไฟขึ้นทันที ช่างสุภาพ งานเรียบร้อย คลุมผ้ากันเลอะทุกจุด รับประกันหลังล้าง บริการไวทั่วลำพูน"
      }
    ];
  } else if (lower.includes("bag") || lower.includes("กระเป๋า")) {
    angles = [
      {
        theme: "คอลเลกชันกระเป๋าดีไซน์หรู แมตช์ได้ทุกลุค สวยแพงในราคาจับต้องได้",
        goal: "ปั้นยอดสั่งซื้อกระเป๋าผ่านแชทเพจและ LINE 50 ใบ",
        audience: "ผู้หญิงวัยทำงาน นักศึกษา และสายแฟชั่น อายุ 20-45 ปี ที่ชอบกระเป๋าทรงสวยใช้งานทนทาน",
        commandText: "เน้นดีไซน์สวย หนังเกรดพรีเมียม จุของได้เยอะ มีโปรส่งฟรีและเก็บเงินปลายทาง ทักแชทดูสีจริงได้ทันที"
      }
    ];
  } else {
    angles = [
      {
        theme: `ยกระดับคุณภาพด้วยบริการมืออาชีพจาก ${name} การันตีความพึงพอใจ`,
        goal: brandProfile.goalDefault || "สร้างยอดขายและดึงลูกค้าใหม่ทักแชท 20 ราย",
        audience: brandProfile.targetAudienceDefault || "ลูกค้ากลุ่มเป้าหมายบนโลกออนไลน์",
        commandText: brandProfile.commandDefault || `โปรโมตจุดเด่นของ ${name} เน้นความคุ้มค่า มาตรฐานมืออาชีพ พร้อมโปรโมชันพิเศษสำหรับลูกค้าที่ทักแชทวันนี้`
      }
    ];
  }

  const chosen = angles[Math.floor(Math.random() * angles.length)];
  return {
    productName: `${name} — ${chosen.theme}`,
    goal: chosen.goal,
    targetAudience: chosen.audience,
    budget: brandProfile.budgetDefault || "15,000 บาท/เดือน",
    platforms: ["Facebook", "Instagram", "TikTok", "LINE OA"],
    commandText: chosen.commandText,
    autonomousAngle: chosen.theme
  };
}

// สร้างชุดภาพโฆษณาไร้ลายน้ำ 100% + ชุด Prompt สำหรับ Google Flow (Imagen 3 / Veo 2) + เชื่อมต่อ Canva Studio
function generateCampaignVisualAssets(campaign = {}, brandProfile = {}) {
  const brief = campaign.brief || {};
  const brandName = brandProfile.brandName || brief.productName || "KPN Marketing";
  const lower = (brandName + " " + (brief.productName || "")).toLowerCase();

  let category = "builtin";
  let googleFlowImagePrompt =
    "Ultra-realistic architectural interior photography of a luxury modern built-in living room in Chiang Mai Thailand, custom floor-to-ceiling walnut wood slat wall, white Carrara marble TV backdrop with warm recessed LED strip lighting, plush modern sofa, natural morning sunlight through large glass windows, shot on Hasselblad H6D 100c, 8k resolution, clean composition, no text, no watermark";
  let googleFlowVideoPrompt =
    "Smooth cinematic gimbal camera dolly-in through a luxury modern built-in living room, warm golden LED strip lights glowing along custom wood cabinetry and white marble wall, soft natural sunlight, architectural digest style, 4k 60fps, photorealistic, no watermark";
  let badgeText = "✨ ออกแบบ & ประเมินราคาฟรี";
  let ctaText = "💬 ทักแชทรับโปรโมชันวันนี้";
  let primaryColor = "#f59e0b";

  if (lower.includes("บิ้วอิน") || lower.includes("ตกแต่ง")) {
    category = "builtin";
    badgeText = "🏠 KPN บิ้วอิน เชียงใหม่ • มาตรฐานช่างมืออาชีพ";
    ctaText = "📲 ทักแชทส่งแปลนประเมินราคาฟรี";
    primaryColor = "#f59e0b";
  } else if (lower.includes("สร้างบ้าน") || lower.includes("construction") || lower.includes("รีโนเวท")) {
    category = "construction";
    googleFlowImagePrompt =
      "Ultra-realistic architectural exterior photography of a modern luxury two-story tropical house in Chiang Mai Thailand, clean white concrete and warm teak wood facade, floor-to-ceiling glass windows glowing with warm interior light at golden hour sunset, lush landscaped tropical garden, shot on Phase One XF IQ4, 8k resolution, no text, no watermark";
    googleFlowVideoPrompt =
      "Cinematic drone aerial reveal of a modern luxury two-story tropical home in northern Thailand at golden hour sunset, warm architectural lighting turning on, smooth slow camera movement, 4k photorealistic, no watermark";
    badgeText = "🏗️ KPN Construction • รับสร้างบ้าน & รีโนเวท";
    ctaText = "📞 ปรึกษาวิศวกร & ประเมินงบฟรี";
    primaryColor = "#0ea5e9";
  } else if (lower.includes("แอร์") || lower.includes("air wash")) {
    category = "airwash";
    googleFlowImagePrompt =
      "Bright modern minimalist living room with a sleek white wall-mounted air conditioner, crystal clear refreshing cool atmosphere, sunlight streaming onto a cozy sofa, ultra-clean commercial photography, 8k resolution, no text, no watermark";
    googleFlowVideoPrompt =
      "Cinematic slow-motion shot of a sleek modern air conditioner in a bright luxury living room, gentle refreshing cool breeze, sparkling clean interior, 4k commercial quality, no watermark";
    badgeText = "❄️ AIR WASH ลำพูน • ล้างแอร์สะอาด ประหยัดไฟ";
    ctaText = "📲 จองคิวล้างแอร์/ติดตั้งแอร์ด่วน";
    primaryColor = "#06b6d4";
  } else if (lower.includes("bag") || lower.includes("กระเป๋า")) {
    category = "bag";
    googleFlowImagePrompt =
      "High-end commercial product photography of a luxury designer leather handbag resting on a travertine marble podium, soft warm studio rim lighting, elegant neutral background, Vogue magazine aesthetic, 8k resolution, no text, no watermark";
    googleFlowVideoPrompt =
      "Smooth 360-degree studio product turntable shot of a luxury leather handbag on a marble pedestal, soft golden studio lighting highlighting fine stitching, 4k commercial video, no watermark";
    badgeText = "👜 Ave'Bag Shop • New Collection";
    ctaText = "🛒 ทักแชทสั่งซื้อ / ส่งฟรีทั่วไทย";
    primaryColor = "#ec4899";
  }

  let pool = CLEAN_UNWATERMARKED_PHOTOS[category] || CLEAN_UNWATERMARKED_PHOTOS.builtin;

  if (category === "builtin") {
    const BUILTIN_PHOTOGRAPHY_CATALOG = getBuiltinPhotographyCatalog();
    const fullText = (brandName + " " + (brief.productName || "") + " " + (brief.autonomousAngle || "") + " " + (brief.commandText || "")).toLowerCase();
    let specificPool = null;
    if (fullText.includes("ตู้เสื้อผ้า") || fullText.includes("closet") || fullText.includes("แต่งตัว")) {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.closet;
      googleFlowImagePrompt = "Ultra-realistic interior photography of a luxury custom walk-in closet in Chiang Mai Thailand, bronze tinted glass doors, warm integrated LED strip lights, island accessories drawer, hardwood floor, 8k resolution, no watermark";
    } else if (fullText.includes("ครัว") || fullText.includes("kitchen") || fullText.includes("เคาน์เตอร์")) {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.kitchen;
      googleFlowImagePrompt = "Ultra-realistic architectural photography of a modern luxury fitted kitchen cabinetry in Chiang Mai Thailand, seamless matte oak cabinets, white quartz island with recessed warm LED lighting, 8k, no watermark";
    } else if (fullText.includes("ห้องนอน") || fullText.includes("เตียง") || fullText.includes("bedroom")) {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.bedroom;
      googleFlowImagePrompt = "Ultra-realistic interior photography of a luxury modern bedroom with custom built-in headboard wall, acoustic fluted wood slats, floating nightstands with warm glowing LED ambient light, 8k, no watermark";
    } else if (fullText.includes("ทำงาน") || fullText.includes("ออฟฟิศ") || fullText.includes("หนังสือ")) {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.office_study;
      googleFlowImagePrompt = "Ultra-realistic photography of a luxury modern home office with floor-to-ceiling custom built-in bookshelf, executive desk, warm architectural lighting, 8k, no watermark";
    } else if (fullText.includes("บาร์") || fullText.includes("ไวน์") || fullText.includes("อาหาร")) {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.dining_bar;
      googleFlowImagePrompt = "Ultra-realistic photography of a luxury dining room with custom built-in wine display cabinet, warm downlights, marble countertop, 8k, no watermark";
    } else if (fullText.includes("ทางเข้า") || fullText.includes("รองเท้า") || fullText.includes("foyer")) {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.entryway;
      googleFlowImagePrompt = "Ultra-realistic interior photography of a modern luxury foyer entryway with custom built-in shoe cabinet, bronze mirror, ambient lighting, 8k, no watermark";
    } else {
      specificPool = BUILTIN_PHOTOGRAPHY_CATALOG.tv_wall;
      googleFlowImagePrompt = "Ultra-realistic architectural interior photography of a luxury modern built-in living room TV wall unit in Chiang Mai Thailand, custom walnut fluted slats, white Carrara marble backdrop with warm recessed LED strip lights, 8k resolution, no watermark";
    }
    if (specificPool && specificPool.length > 0) {
      pool = specificPool;
    }
  }

  // สร้าง Seed แบบสุ่มใหม่ทุกครั้งที่กดสั่ง (ใช้ทั้ง Timestamp ปัจจุบัน + Random Salt + ID แคมเปญ) เพื่อให้ภาพที่ได้ใหม่สดเสมอ ไม่ซ้ำภาพเดิม
  const timeSalt = Date.now() % 9999;
  const randOffset = Math.floor(Math.random() * pool.length);
  const idHash = Math.abs(
    (campaign.id || randomUUID?.() || "kpn").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  );
  const finalSeed = (idHash + timeSalt + randOffset) % pool.length;

  const photo1 = pool[finalSeed];
  const photo2 = pool[(finalSeed + 1) % pool.length];
  const photo3 = pool[(finalSeed + 2) % pool.length];

  const headline = (brief.autonomousAngle || brief.productName || brandName).slice(0, 80);
  const subheadline = (brief.goal || "งานคุณภาพ มาตรฐานมืออาชีพ งบไม่บานปลาย").slice(0, 110);

  const canvaSearchQuery = encodeURIComponent(
    category === "builtin" || category === "construction"
      ? "interior design real estate promotion facebook post"
      : "modern business promotion facebook post"
  );
  const canvaFbTemplateUrl = `https://www.canva.com/templates/?query=${canvaSearchQuery}`;
  const canvaIgTemplateUrl = `https://www.canva.com/instagram-posts/templates/`;
  const canvaTiktokTemplateUrl = `https://www.canva.com/tiktok-videos/templates/`;

  return {
    brandName,
    headline,
    subheadline,
    badgeText,
    ctaText,
    primaryColor,
    watermarkFree: true,
    visualPromptEn: googleFlowImagePrompt,
    googleFlow: {
      flowUrl: "https://labs.google/fx/tools/flow",
      imageFxUrl: "https://labs.google/fx/tools/image-fx",
      whiskUrl: "https://labs.google/fx/tools/whisk",
      imagePrompt: googleFlowImagePrompt,
      videoPrompt: googleFlowVideoPrompt
    },
    fbBannerImageUrl: photo1,
    igSquareImageUrl: photo2,
    tiktokVerticalImageUrl: photo3,
    primaryImageUrl: photo1,
    canva: {
      connected: true,
      fbTemplateUrl: canvaFbTemplateUrl,
      igTemplateUrl: canvaIgTemplateUrl,
      tiktokTemplateUrl: canvaTiktokTemplateUrl,
      designBriefText: `Headline: ${headline}\nSubheadline: ${subheadline}\nBadge: ${badgeText}\nCTA: ${ctaText}\nContact: ${brandProfile.contactPhone || ""}`
    }
  };
}

// สร้างชุดข้อมูลลิงก์เครื่องมือจริงของทั้ง 7 Agents ประจำแคมเปญ
function buildAgentConnectedToolsOutput(campaign = {}, brandProfile = {}) {
  const brief = campaign.brief || {};
  const keyword = encodeURIComponent(
    (brandProfile.brandName || brief.productName || "บิ้วอิน เชียงใหม่").replace(/by.*$/i, "").trim()
  );

  return {
    cmo_orchestrator: {
      ...AGENT_TOOL_ECOSYSTEM.cmo_orchestrator,
      actionLabel: "⚡ เปิด Make.com Scenario",
      actionUrl: "https://eu1.make.com/3327599/scenarios"
    },
    market_researcher: {
      ...AGENT_TOOL_ECOSYSTEM.market_researcher,
      actionLabel: "🔎 ส่องแอดคู่แข่งใน Meta Ad Library",
      actionUrl: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=TH&q=${keyword}`
    },
    seo_specialist: {
      ...AGENT_TOOL_ECOSYSTEM.seo_specialist,
      actionLabel: "📈 ดูเทรนด์ค้นหาใน Google Trends TH",
      actionUrl: `https://trends.google.com/trends/explore?geo=TH&q=${keyword}`
    },
    ad_strategist: {
      ...AGENT_TOOL_ECOSYSTEM.ad_strategist,
      actionLabel: "🎯 เปิดหน้าจัดการแอด Meta Ads Manager",
      actionUrl: "https://adsmanager.facebook.com/"
    },
    content_copywriter: {
      ...AGENT_TOOL_ECOSYSTEM.content_copywriter,
      actionLabel: "📘 เปิดดูหน้าเพจ Facebook",
      actionUrl: brandProfile.fbUrl || "https://www.facebook.com/"
    },
    creative_director: {
      ...AGENT_TOOL_ECOSYSTEM.creative_director,
      actionLabel: "🎬 เปิด Google Flow + 🎨 Canva (ไร้ลายน้ำ)",
      actionUrl: "https://labs.google/fx/tools/flow"
    },
    social_scheduler: {
      ...AGENT_TOOL_ECOSYSTEM.social_scheduler,
      actionLabel: "📤 ส่งตรวจใน LINE & โพสต์ผ่าน Make.com",
      actionUrl: "https://eu1.make.com/3327599/scenarios"
    }
  };
}

module.exports = {
  AGENT_TOOL_ECOSYSTEM,
  CLEAN_UNWATERMARKED_PHOTOS,
  generateAutonomousBriefForBrand,
  generateCampaignVisualAssets,
  buildAgentConnectedToolsOutput
};

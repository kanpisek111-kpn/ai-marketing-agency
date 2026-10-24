// src/llmProvider.js
// ระบบเชื่อมต่อ Multi-LLM (Google Gemini, OpenAI GPT, Anthropic Claude) + Smart Simulation Mode พร้อมผูกข้อมูลลิงก์เพจหลัก (FB / TikTok / IG / LINE / Web)

async function callGemini({ apiKey, model, systemPrompt, userPrompt, temperature = 0.7 }) {
  const modelName = model || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: Number(temperature) || 0.7,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
  if (!text) throw new Error("Gemini API returned empty content");
  return { text, provider: "gemini", model: modelName };
}

async function callOpenAI({ apiKey, model, systemPrompt, userPrompt, temperature = 0.7 }) {
  const modelName = model || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      temperature: Number(temperature) || 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return { text, provider: "openai", model: modelName };
}

async function callClaude({ apiKey, model, systemPrompt, userPrompt, temperature = 0.7 }) {
  const modelName = model || "claude-3-7-sonnet-latest";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 4096,
      temperature: Number(temperature) || 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.content?.map((c) => c.text || "").join("\n") || "";
  return { text, provider: "claude", model: modelName };
}

// Smart Simulation Engine ที่ดึงลิงก์เพจจริง (FB, TikTok, IG, LINE, Web) มาวางแผนและใส่ท้ายโพสต์ให้อัตโนมัติ
async function generateSimulatedResponse({ agent, brief }) {
  await new Promise((r) => setTimeout(r, 950));

  const brand = brief.productName || "สินค้า/บริการของคุณ";
  const goal = brief.goal || "สร้างยอดขายและขยายฐานลูกค้าใหม่";
  const audience = brief.targetAudience || "กลุ่มลูกค้าวัยทำงานและผู้ที่สนใจสินค้าคุณภาพ";
  const budget = brief.budget || "15,000 - 30,000 บาท/เดือน";
  const platforms = (brief.platforms && brief.platforms.length > 0)
    ? brief.platforms.join(", ")
    : "Facebook, TikTok, Instagram, LINE OA";

  // ตรวจสอบว่า commandText เป็นข้อความตัวอย่างเซรั่มที่ค้างอยู่หรือไม่ ถ้าชื่อแบรนด์ไม่เกี่ยวกับเซรั่ม/ครีม ให้ใช้คำสั่งตามชื่อแบรนด์และเป้าหมายจริงแทน
  const rawCommand = (brief.commandText || "").trim();
  const isDefaultSkincareSample =
    rawCommand.includes("สารสกัดนำเข้าจากญี่ปุ่น ซึมไวใน 5 วินาที") &&
    !/(เซรั่ม|ครีม|สกินแคร์|ผิว|คลินิก|serum|skin)/i.test(brand);
  const details = isDefaultSkincareSample
    ? `โปรโมต ${brand} ให้บรรลุเป้าหมาย "${goal}" เน้นจุดเด่นคุณภาพงานมาตรฐานมืออาชีพ บริการครบวงจร คุ้มค่างบประมาณ พร้อมให้คำปรึกษาฟรี`
    : rawCommand || `โปรโมต ${brand} ให้บรรลุเป้าหมาย "${goal}"`;

  // สกัดจุดเด่นจากคำสั่งของผู้ใช้มาใส่ในแคปชันโพสต์ขายของโดยตรง
  const customBulletPoints = details
    .split(/[,\n•\-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4 && !s.startsWith("อยากได้"));
  const bullet1 = customBulletPoints[0] || `งานคุณภาพมาตรฐานมืออาชีพ ออกแบบและดูแลโดยทีมผู้เชี่ยวชาญจาก ${brand}`;
  const bullet2 = customBulletPoints[1] || `คุ้มค่าทุกงบประมาณ ตอบโจทย์ความต้องการของ ${audience} อย่างตรงจุด`;
  const bullet3 = customBulletPoints[2] || `ดูแลครบวงจร ปรึกษาฟรี ประเมินราคาชัดเจน มีผลงานจริงการันตี (เป้าหมายแคมเปญ: ${goal})`;

  const ch = brief.channels || {};
  const fbLink = ch.fbUrl || "https://facebook.com/YourBrandPage";
  const ttLink = ch.tiktokUrl || "https://tiktok.com/@yourbrand";
  const igLink = ch.igUrl || "https://instagram.com/yourbrand";
  const lineLink = ch.lineUrl || "https://lin.ee/yourbrand";
  const webLink = ch.websiteUrl || "";
  const shopLink = ch.shopUrl || "";
  const phone = ch.contactPhone || "";

  const channelSummaryBlock = [
    `- 📘 **Facebook Page:** ${fbLink}`,
    `- 🎵 **TikTok Channel:** ${ttLink}`,
    `- 📸 **Instagram:** ${igLink}`,
    `- 💬 **LINE OA (ปิดการขาย):** ${lineLink}`,
    webLink ? `- 🌐 **Website:** ${webLink}` : null,
    shopLink ? `- 🛒 **Shopee/Lazada:** ${shopLink}` : null,
    phone ? `- 📞 **เบอร์ติดต่อ:** ${phone}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const ctaFooterBlock = [
    `📌 **ช่องทางสั่งซื้อ / สอบถามโปรโมชันพิเศษ:**`,
    `💬 ทัก LINE OA ด่วน: ${lineLink}`,
    `📘 Inbox เพจ Facebook: ${fbLink}`,
    `🎵 ติดตามรีวิวบน TikTok: ${ttLink}`,
    `📸 Instagram: ${igLink}`,
    shopLink ? `🛒 ช้อปผ่าน Shopee/Lazada: ${shopLink}` : null,
    webLink ? `🌐 เว็บไซต์หลัก: ${webLink}` : null,
    phone ? `📞 โทรปรึกษาด่วน: ${phone}` : null
  ]
    .filter(Boolean)
    .join("\n> ");

  switch (agent.id) {
    case "cmo_orchestrator":
      return `### 👑 Master Campaign Brief โดย ${agent.name}
**แคมเปญ:** ปั้นยอดขายและสร้างแบรนด์ **${brand}** แบบครบวงจร
**คำสั่งหลักจากผู้บริหาร:** "${details || goal}"

---

#### 🌐 ช่องทางเพจเป้าหมายที่ทีม AI เข้าไปรับผิดชอบดูแล (Connected Target Channels)
${channelSummaryBlock}

---

#### 1. 🎯 เป้าหมายหลักของแคมเปญ (Core Objectives & KPIs)
* **วัตถุประสงค์หลัก:** ${goal}
* **กลุ่มเป้าหมายหลัก:** ${audience}
* **แพลตฟอร์มโฟกัส:** ${platforms}
* **งบประมาณการตลาดตั้งต้น:** ${budget}
* **กลยุทธ์เชื่อมโยงช่องทาง (Cross-Channel Ecosystem):**
  * ใช้ **TikTok (${ttLink})** และ **IG Reels (${igLink})** เป็นตัวดึงดูดสายตา (Organic Reach + Video Views)
  * ใช้ **Facebook Page (${fbLink})** เป็นฐานสร้างความน่าเชื่อถือ โพสต์รีวิว และยิงแอดทักแชท (Click to Messenger)
  * ดึงลูกค้าทั้งหมดมาปิดการขายและทำ CRM ซ้ำใน **LINE OA (${lineLink})**

#### 2. 📋 การจ่ายงานให้ลูกทีม AI ทั้ง 6 แผนก (Task Delegation)
1. 🔍 **Marcus (Market Research):** วิเคราะห์กลุ่มลูกค้าของเพจ ${fbLink} และช่อง ${ttLink} เพื่อหาจุดแข็งเหนือคู่แข่ง
2. 📈 **Sophia (SEO Specialist):** วางคีย์เวิร์ดติดหน้าแรก Google และ TikTok Search สำหรับช่อง ${ttLink}
3. 🚀 **Victor (Ad Strategist):** วางแผนยิงแอดเข้าเพจ ${fbLink} และดึงคนแอด LINE ${lineLink} ภายใต้งบ ${budget}
4. ✍️ **Chloe (Copywriter):** เขียนโพสต์พร้อมแนบลิงก์เพจจริงทุกช่องทาง + สคริปต์คลิป TikTok พร้อมถ่าย
5. 🎨 **Leo (Creative Director):** คิดคอนเซปต์ภาพโฆษณาประจำเพจและเขียน Prompt เจนรูป/วิดีโอ
6. 📲 **Namo (Scheduler & LINE Reporter):** จัดตารางโพสต์ลงเพจ FB / IG / TikTok อัตโนมัติ และส่งรายงานสรุปเข้า LINE`;

    case "market_researcher":
      return `### 🔍 รายงานวิเคราะห์ตลาดและเพจเป้าหมาย โดย ${agent.name}
**สำหรับแบรนด์:** ${brand}
**ช่องทางที่ตรวจสอบ:** FB (${fbLink}) | TikTok (${ttLink}) | IG (${igLink})

---

#### 1. 👥 วิเคราะห์กลุ่มเป้าหมายประจำเพจ (Buyer Personas)
* **กลุ่มที่ 1: สายดูคลิปสั้นป้ายยาบน TikTok (${ttLink}) — สัดส่วน 45%**
  * **โปรไฟล์:** ${audience} ชอบดูคลิปรีวิวสั้นกระชับ เห็นผลลัพธ์จริงใน 5 วินาทีแรก
  * **แนวทางดึงเข้าเพจ:** ใช้คลิปแก้ปัญหา + ปักตะกร้าหรือบอกให้กดลิงก์หน้าโปรไฟล์ไปที่ ${lineLink}
* **กลุ่มที่ 2: สายอ่านรีวิวละเอียดบน Facebook (${fbLink}) & IG (${igLink}) — สัดส่วน 35%**
  * **โปรไฟล์:** ชอบอ่านรายละเอียดเปรียบเทียบ ดูอัลบั้มรีวิวลูกค้าจริงในเพจก่อนตัดสินใจทักแชท
* **กลุ่มที่ 3: สายโปรโมชันด่วนใน LINE OA (${lineLink}) — สัดส่วน 20%**
  * **โปรไฟล์:** ลูกค้าที่เคยเห็นแอดแล้ว รอจังหวะโปรโมชันพิเศษปลายเดือนหรือ Flash Sale

#### 2. ⚡ Pain Points & Desires (ปัญหาที่ลูกค้าเจอ vs สิ่งที่ต้องการ)
* **Pain Points:** กลัวซื้อไปแล้วไม่ตรงปก เคยเจอเพจที่ตอบช้าหรือไม่มีรีวิวจริงยืนยัน
* **Desires:** อยากได้สินค้า/บริการจากเพจที่น่าเชื่อถือ ติดต่อได้จริงผ่าน ${fbLink} และ ${lineLink}

#### 3. 🔥 3 Winning Angles สำหรับปั้นเพจให้โตไว
1. **Angle #1 (TikTok Viral Hook):** *"ทำไมคนถึงแห่เปลี่ยนมาใช้ ${brand} กันเต็มฟีด TikTok!"*
2. **Angle #2 (Facebook Trust Post):** *"สรุปครบจบในโพสต์เดียว: 3 เหตุผลที่ลูกค้าเพจ ${fbLink} ซื้อซ้ำมากที่สุด"*
3. **Angle #3 (LINE VIP Exclusive):** *"โปรลับเฉพาะคนที่แอด LINE ${lineLink} วันนี้เท่านั้น!"*`;

    case "seo_specialist":
      return `### 📈 กลยุทธ์ SEO, Keywords & การตั้งค่าโปรไฟล์เพจ โดย ${agent.name}
**สำหรับแคมเปญ:** ${brand}

---

#### 1. 🛠️ คำแนะนำปรับแต่ง Bio & ชื่อเพจให้ติดการค้นหา (Social SEO Optimization)
* **Facebook Page (${fbLink}):** ตั้งชื่อเพจให้มีคำค้นหาหลัก และใส่ลิงก์ ${lineLink} ไว้ในปุ่ม Action และคำอธิบายเพจ
* **TikTok Bio (${ttLink}):** ใส่คีย์เวิร์ดหลักในบรรทัดแรกของ Bio พร้อมชี้ลูกศรลงไปที่ลิงก์ ${lineLink}
* **Instagram Bio (${igLink}):** ใช้ Highlight Stories แยกเป็นหมวด: \`รีวิวจริง\`, \`โปรเดือนนี้\`, \`วิธีสั่งซื้อ\`

#### 2. 🔑 คีย์เวิร์ดทำเงิน (High-Buying-Intent Keywords)
| ลำดับ | Keyword แนะนำ | ช่องทางที่ควรเน้น | โอกาสปิดการขาย |
| :--- | :--- | :--- | :--- |
| 1 | **${brand} รีวิว** | TikTok Search / Facebook | ⭐⭐⭐⭐⭐ (สูงมาก) |
| 2 | **${brand} ดีไหม** | Google / Lemon8 / Pantip | ⭐⭐⭐⭐⭐ (สูงมาก) |
| 3 | **${brand} โปรโมชัน** | Facebook Page / LINE OA | ⭐⭐⭐⭐⭐ (สูงมาก) |
| 4 | **แนะนำ ${brand} ยอดนิยม** | Website / TikTok | ⭐⭐⭐⭐ (สูง) |

#### 3. #️⃣ ชุด Hashtags ประจำเพจ (ใส่ท้ายโพสต์ทุกครั้ง)
* **TikTok (${ttLink}):** \`#${brand.replace(/\s+/g, "")}\` \`#รีวิวของดีบอกต่อ\` \`#ป้ายยาTikTok\` \`#ของมันต้องมี\`
* **Facebook (${fbLink}) & IG (${igLink}):** \`#${brand.replace(/\s+/g, "")}\` \`#โปรโมชันพิเศษ\` \`#รีวิวผู้ใช้จริง\``;

    case "ad_strategist":
      return `### 🚀 แผนยิงแอดโฆษณาเชื่อมทุกเพจ (Cross-Platform Ad Funnel) โดย ${agent.name}
**งบประมาณรวม:** ${budget}

---

#### 1. 🌪️ โครงสร้างการยิงแอดเข้าเพจของคุณโดยตรง
* **ขั้นที่ 1: TikTok Spark Ads & Reels Boost (ใช้งบ 35%)**
  * **ช่องทางที่ยิง:** บูสต์คลิปจากช่อง **${ttLink}** และ **${igLink}**
  * **เป้าหมาย:** ดึงยอดวิวคุณภาพ + เก็บ Audience คนที่ดูคลิปเกิน 50%
* **ขั้นที่ 2: Facebook Click-to-Messenger & LINE Conversion (ใช้งบ 45%)**
  * **ช่องทางที่ยิง:** ยิงจากเพจ **${fbLink}** ส่งคนเข้า Inbox เพจ และแนบลิงก์ด่วนเข้า **${lineLink}**
  * **กลุ่มเป้าหมาย:** ${audience}
* **ขั้นที่ 3: Retargeting ปิดการขายคนทักแชท (ใช้งบ 20%)**
  * **กลุ่มเป้าหมาย:** คนที่เคยเข้าชมเพจ **${fbLink}**, ดูคลิปใน **${ttLink}**, หรือทักแชทใน 14 วันล่าสุดแต่ยังไม่สั่งซื้อ

#### 2. 🎯 ลิงก์ปลายทางสำหรับตั้งค่าใน Ads Manager (Destination URLs)
* **Facebook Ad Destination:** Inbox ของเพจ \`${fbLink}\`
* **Call-to-Action Link เสริม:** \`${lineLink}\` ${shopLink ? `และ \`${shopLink}\`` : ""}`;

    case "content_copywriter":
      return `### ✍️ ชิ้นงานคอนเทนต์พร้อมลิงก์เพจของคุณ (คัดลอกหรือกดสั่งโพสต์ลงเพจได้ทันที!) โดย ${agent.name}
**สำหรับแคมเปญ:** ${brand}
**บรีฟคำสั่งหลัก:** ${details}

---

#### 1. 📱 โพสต์ขายของสำหรับเพจ Facebook & IG (สไตล์ป้ายยา + แนบลิงก์เพจครบ)
> 🔥 **มองหา "${brand}" ที่ตอบโจทย์ครบ จบในที่เดียวอยู่ใช่ไหม?** ✨
>
> ใครที่กำลังวางแผนหรือมองหาบริการ/สินค้าคุณภาพจาก **${brand}** ห้ามพลาดโพสต์นี้เลยครับ 👇
>
> 💡 **ทำไมลูกค้าถึงไว้วางใจเลือก ${brand}?**
> ✅ ${bullet1}
> ✅ ${bullet2}
> ✅ ${bullet3}
>
> 🎁 **โปรโมชันพิเศษเฉพาะลูกค้าที่ทักมาจากเพจวันนี้!**
> รับสิทธิ์ประเมินราคา/ปรึกษาฟรี พร้อมส่วนลดและสิทธิพิเศษประจำเดือนทันที!
>
> ${ctaFooterBlock}

---

#### 2. 📱 โพสต์โปรโมชันด่วน (Flash Sale สำหรับโพสต์ลงเพจ Facebook / บรอดแคสต์ LINE)
> ⚡ **โปรพิเศษจาก ${brand} — เปิดรับคิวด่วนจำนวนจำกัด!** ⚡
> 🎯 ไฮไลท์: ${details}
> • ต่อที่ 1: รับสิทธิ์ราคาโปรโมชันพิเศษเฉพาะเดือนนี้
> • ต่อที่ 2: ฟรี! ให้คำปรึกษาและดูแลโดยทีมงานมืออาชีพ
>
> 👉 ทักแชทรับสิทธิ์ด่วนที่ LINE: ${lineLink}
> 👉 หรือทัก Inbox เพจ: ${fbLink}

---

#### 3. 🎬 สคริปต์วิดีโอสั้นสำหรับช่อง TikTok (${ttLink}) & IG Reels (${igLink})
| วินาที | ภาพในคลิป (Visual) | บทพูด (Voiceover) | ข้อความขึ้นจอ (On-Screen Text) |
| :--- | :--- | :--- | :--- |
| **0:00-0:04 (Hook)** | ซูมเข้าหาตัวสินค้าพร้อมทำหน้าตื่นเต้น | "หยุดเลื่อนก่อน! ถ้าคุณกำลังมองหา ${brand} ที่คุ้มที่สุด ต้องดูคลิปนี้ให้จบ!" | อย่าเพิ่งตัดสินใจ ถ้ายังไม่เห็นสิ่งนี้! 🚨 |
| **0:04-0:15 (Pain & Solution)** | โชว์การใช้งานจริงของ ${brand} แบบชัดๆ | "บอกเลยว่าตัวนี้ตอบโจทย์สุดๆ ทั้งสะดวก คุ้มค่า และเห็นผลจริงจนลูกค้ากลับมาซื้อซ้ำ" | 3 เหตุผลที่คนเลือก ${brand} ✅ |
| **0:15-0:30 (CTA ชี้เข้าลิงก์)** | ชี้ไปที่ลิงก์หน้าโปรไฟล์ TikTok (${ttLink}) | "ใครอยากได้โปรลับเฉพาะคนดูคลิปนี้ กดลิงก์หน้าโปรไฟล์ทัก LINE ${lineLink} รับสิทธิ์ได้เลย!" | กดลิงก์หน้าโปรไฟล์รับโปรทันที! 🎁👇 |`;

    case "creative_director":
      return `### 🎨 คอนเซปต์ภาพโฆษณาประจำเพจ & AI Media Prompts โดย ${agent.name}
**สำหรับเพจ:** ${fbLink} | ${igLink} | ${ttLink}

---

#### 1. 🖼️ คอนเซปต์ Artwork โฆษณาแยกตามขนาดแพลตฟอร์ม
1. **Facebook & IG Feed (อัตราส่วน 4:5):** ภาพ Hero Banner โชว์จุดเด่นของ **${brand}** พร้อมป้ายชื่อเพจและ Call-to-Action ชัดเจน
2. **TikTok & Reels Cover (อัตราส่วน 9:16):** ภาพปกคลิปพาดหัวตัวหนังสือสีตัดกับพื้นหลัง อ่านออกง่ายบนมือถือ
3. **LINE OA Rich Message (อัตราส่วน 1:1):** ภาพโปรโมชันสำหรับส่งบรอดแคสต์ให้คนกดคลิกรับสิทธิ์

---

#### 2. ✨ AI Image Generation Prompts (คัดลอกไปใช้เจนภาพลงเพจได้เลย)

**Prompt ที่ 1: ภาพโฆษณา Hero Product สำหรับโพสต์ลงเพจ Facebook & IG**
\`\`\`text
Commercial studio photography representing "${brand}", ultra-modern clean aesthetic, dramatic rim lighting, luxury advertising campaign style, high contrast, shot on Phase One XF IQ4 150MP, 8k resolution, photorealistic, clean space at the top for Thai headline --ar 4:5 --v 6.1
\`\`\`

**Prompt ที่ 2: ภาพ Lifestyle กลุ่มเป้าหมายสำหรับทำแอด**
\`\`\`text
Authentic lifestyle photography of happy modern Thai professionals (${audience}) smiling with confidence while using "${brand}", natural golden hour sunlight, warm and trustworthy atmosphere, depth of field, cinematic commercial grade --ar 16:9 --v 6.1
\`\`\`

---

#### 3. 🎥 AI Video Generation Prompts (สำหรับทำคลิป B-Roll ลงช่อง TikTok ${ttLink})
\`\`\`text
Vertical 9:16 commercial video, smooth slow-motion orbital camera movement around "${brand}" on a sleek podium, soft volumetric studio lighting, dynamic light particles, high-end social media ad aesthetic, 4k 60fps.
\`\`\``;

    case "social_scheduler_line":
    default:
      return `### 📲 ตารางโพสต์ลงเพจ 7 วัน & ระบบสั่งโพสต์อัตโนมัติ โดย ${agent.name}
**ผูกกับช่องทางของคุณเรียบร้อย:**
* 📘 **Facebook:** ${fbLink}
* 🎵 **TikTok:** ${ttLink}
* 📸 **Instagram:** ${igLink}
* 💬 **LINE OA:** ${lineLink}

---

#### 1. 📅 ตารางโพสต์คอนเทนต์ 7 วันแยกตามลิงก์เพจของคุณ
| วัน | เวลาทอง | ช่องทางเพจที่จะโพสต์ | หัวข้อคอนเทนต์ | รูปแบบสื่อ |
| :--- | :--- | :--- | :--- | :--- |
| **วันที่ 1 (จันทร์)** | 11:30 น. | 📘 FB (${fbLink}) & 📸 IG | เปิดตัวจุดเด่น ${brand} พร้อมลิงก์ทักแชท | ภาพเดี่ยว Hero 4:5 |
| **วันที่ 2 (อังคาร)** | 19:30 น. | 🎵 TikTok (${ttLink}) | คลิปสั้น 30 วิ: 3 เหตุผลที่ต้องเลือก ${brand} | วิดีโอสั้น 9:16 |
| **วันที่ 3 (พุธ)** | 12:00 น. | 📘 FB (${fbLink}) | อัลบั้มความรู้ + ป้ายยา ${brand} | อัลบั้มภาพ 4 หน้า |
| **วันที่ 4 (พฤหัสบดี)** | 20:00 น. | 🎵 TikTok (${ttLink}) & 📸 IG Reels | คลิปเปรียบเทียบความคุ้มค่า + ชี้เข้า Bio | วิดีโอสั้น 9:16 |
| **วันที่ 5 (ศุกร์)** | 18:00 น. | 📘 FB & 📸 IG (${igLink}) | รวมรีวิวความประทับใจจากลูกค้าจริง | อัลบั้มรีวิว Social Proof |
| **วันที่ 6 (เสาร์)** | 10:30 น. | 💬 LINE OA (${lineLink}) & 📘 FB | 🔥 บรอดแคสต์โปรพิเศษเฉพาะสุดสัปดาห์ | Rich Message + โพสต์โปร |
| **วันที่ 7 (อาทิตย์)** | 20:00 น. | ทุกช่องทาง (FB / IG / TikTok) | โค้งสุดท้าย! ปิดรับสิทธิ์โปรพิเศษเดือนนี้ | ภาพ Flash Deal |

---

#### 2. 🚀 วิธีให้ระบบไปโพสต์ทำงานแทนบนเพจจริงของคุณ
* **กดปุ่ม "📤 สั่งโพสต์ลงเพจทันที (FB / IG / TikTok)" ด้านบนของหน้าต่างนี้** เพื่อส่งแคปชันและแผนงานไปโพสต์ที่เพจของคุณผ่าน Facebook Graph API หรือ Automation Webhook ได้ทันที!`;
  }
}

async function runAgentLLM({ agent, settings, brief, previousOutputs, customInstruction }) {
  const provider =
    agent.preferredProvider && agent.preferredProvider !== "default"
      ? agent.preferredProvider
      : settings.activeProvider || "simulation";

  const ch = brief.channels || {};
  const contextParts = [];
  contextParts.push(`=== ข้อมูลคำสั่งแคมเปญหลัก (Master Command) ===`);
  contextParts.push(`- สินค้า/บริการ/แบรนด์: ${brief.productName || "ไม่ระบุ"}`);
  contextParts.push(`- เป้าหมายแคมเปญ: ${brief.goal || "เพิ่มยอดขายและสร้างการรับรู้"}`);
  contextParts.push(`- กลุ่มเป้าหมาย: ${brief.targetAudience || "ลูกค้าทั่วไปที่สนใจสินค้า"}`);
  contextParts.push(`- งบประมาณ: ${brief.budget || "ตามความเหมาะสม"}`);
  contextParts.push(`- แพลตฟอร์มที่เน้น: ${(brief.platforms || []).join(", ") || "ทุกแพลตฟอร์มหลัก"}`);
  contextParts.push(`- รายละเอียดคำสั่งเพิ่มเติม: ${brief.commandText || "-"}`);

  contextParts.push(`\n=== ลิงก์เพจและช่องทางหลักของแบรนด์ที่ต้องนำไปใช้งานจริง ===`);
  if (ch.fbUrl) contextParts.push(`- เพจ Facebook: ${ch.fbUrl}`);
  if (ch.tiktokUrl) contextParts.push(`- ช่อง TikTok: ${ch.tiktokUrl}`);
  if (ch.igUrl) contextParts.push(`- บัญชี Instagram: ${ch.igUrl}`);
  if (ch.lineUrl) contextParts.push(`- ลิงก์ LINE OA (ปิดการขาย): ${ch.lineUrl}`);
  if (ch.websiteUrl) contextParts.push(`- เว็บไซต์: ${ch.websiteUrl}`);
  if (ch.shopUrl) contextParts.push(`- ลิงก์ร้าน Shopee/Lazada: ${ch.shopUrl}`);
  if (ch.contactPhone) contextParts.push(`- เบอร์ติดต่อ: ${ch.contactPhone}`);
  contextParts.push(`(สำคัญมาก: ให้ระบุลิงก์เพจเหล่านี้ลงในแผนงาน และใส่ไว้ท้ายแคปชันขายของเพื่อให้ลูกค้าคลิกได้จริง)`);

  if (previousOutputs && previousOutputs.length > 0) {
    contextParts.push(`\n=== ผลงานจากแผนกก่อนหน้าที่ส่งต่อมาให้คุณ ===`);
    for (const prev of previousOutputs) {
      contextParts.push(`\n--- [${prev.agentName} (${prev.role})] ---\n${prev.output}`);
    }
  }

  if (customInstruction) {
    contextParts.push(`\n=== คำสั่งแก้ไข/เน้นย้ำเพิ่มเติมจากผู้บริหาร ===\n${customInstruction}`);
  }

  const userPrompt = contextParts.join("\n");

  if (provider === "simulation") {
    const text = await generateSimulatedResponse({ agent, brief, previousOutputs });
    return { text, provider: "simulation", model: "Smart Marketing Simulator v2" };
  }

  if (provider === "gemini") {
    const key = settings.apiKeys?.gemini?.trim();
    if (!key) {
      const text = await generateSimulatedResponse({ agent, brief, previousOutputs });
      return {
        text: `> ℹ️ *[โหมดจำลองอัตโนมัติ: ยังไม่ได้ระบุ Gemini API Key ในหน้าตั้งค่า]*\n\n` + text,
        provider: "simulation (fallback)",
        model: "Smart Simulator"
      };
    }
    return await callGemini({
      apiKey: key,
      model: agent.preferredModel || settings.models?.gemini || "gemini-2.5-flash",
      systemPrompt: agent.systemPrompt,
      userPrompt,
      temperature: agent.temperature
    });
  }

  if (provider === "openai") {
    const key = settings.apiKeys?.openai?.trim();
    if (!key) {
      const text = await generateSimulatedResponse({ agent, brief, previousOutputs });
      return {
        text: `> ℹ️ *[โหมดจำลองอัตโนมัติ: ยังไม่ได้ระบุ OpenAI API Key ในหน้าตั้งค่า]*\n\n` + text,
        provider: "simulation (fallback)",
        model: "Smart Simulator"
      };
    }
    return await callOpenAI({
      apiKey: key,
      model: agent.preferredModel || settings.models?.openai || "gpt-4o-mini",
      systemPrompt: agent.systemPrompt,
      userPrompt,
      temperature: agent.temperature
    });
  }

  if (provider === "claude") {
    const key = settings.apiKeys?.claude?.trim();
    if (!key) {
      const text = await generateSimulatedResponse({ agent, brief, previousOutputs });
      return {
        text: `> ℹ️ *[โหมดจำลองอัตโนมัติ: ยังไม่ได้ระบุ Anthropic Claude API Key ในหน้าตั้งค่า]*\n\n` + text,
        provider: "simulation (fallback)",
        model: "Smart Simulator"
      };
    }
    return await callClaude({
      apiKey: key,
      model: agent.preferredModel || settings.models?.claude || "claude-3-7-sonnet-latest",
      systemPrompt: agent.systemPrompt,
      userPrompt,
      temperature: agent.temperature
    });
  }

  const text = await generateSimulatedResponse({ agent, brief, previousOutputs });
  return { text, provider: "simulation", model: "Smart Simulator" };
}

module.exports = { runAgentLLM };

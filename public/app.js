// public/app.js
// ระบบควบคุมหน้าจอ AI Marketing Agency Dashboard, ผูกลิงก์เพจหลัก (FB/TikTok/IG/LINE) & Live SSE Stream

let appState = {
  settings: {},
  brandProfiles: [],
  agents: [],
  campaigns: [],
  lineLogs: [],
  publishLogs: [],
  currentCampaignId: null,
  selectedStepAgentId: "cmo_orchestrator"
};

const PRESETS = {
  skincare: {
    productName: "Lumina Glow Serum (เซรั่มวิตซีญี่ปุ่นลดจุดด่างดำ)",
    goal: "ปั้นยอดขาย 500 ขวดใน 30 วันแรก และดึงลูกค้าทักแชทปิดการขายผ่าน LINE OA",
    targetAudience: "ผู้หญิงและวัยทำงานอายุ 22-40 ปี ที่มีปัญหาผิวหมองคล้ำ นอนดึก รอยสิว ชอบช้อปออนไลน์",
    budget: "25,000 บาท/เดือน",
    platforms: ["Facebook", "TikTok", "Instagram", "LINE OA", "Shopee / Lazada"],
    commandText: "จุดเด่นคือสารสกัดนำเข้าจากญี่ปุ่น ซึมไวใน 5 วินาที ผิวแพ้ง่ายใช้ได้ โปรโมชันเปิดตัว ซื้อ 1 แถมขนาดทดลอง ส่งฟรีทั่วประเทศ",
    fbUrl: "https://facebook.com/LuminaGlowThailand",
    tiktokUrl: "https://tiktok.com/@luminaglow.th",
    igUrl: "https://instagram.com/luminaglow.official",
    lineUrl: "https://lin.ee/luminaglow",
    shopUrl: "https://shopee.co.th/luminaglow",
    contactPhone: "099-123-4567"
  },
  clinic: {
    productName: "AuraPrime Clinic (คลินิกปรับรูปหน้าและเลเซอร์ผิวใส)",
    goal: "ดึงลูกค้าจองคิวปรึกษาคุณหมอและซื้อคอร์ส 120 เคสต่อเดือน",
    targetAudience: "วัยทำงานและผู้บริหารอายุ 25-48 ปี ในกรุงเทพฯ ที่ต้องการดูแลบุคลิกภาพแบบปลอดภัยเห็นผลจริง",
    budget: "45,000 บาท/เดือน",
    platforms: ["Facebook", "TikTok", "Instagram", "LINE OA", "Google Search / SEO"],
    commandText: "ดูแลโดยแพทย์เฉพาะทางทุกเคส เครื่องแท้ผ่าน อย. มีรีวิวเคสจริงกว่า 5,000 เคส โปรโมชันทดลองทำครั้งแรก ลด 40% เมื่อจองคิวผ่าน LINE",
    fbUrl: "https://facebook.com/AuraPrimeClinicTH",
    tiktokUrl: "https://tiktok.com/@auraprime.clinic",
    igUrl: "https://instagram.com/auraprimeclinic",
    lineUrl: "https://lin.ee/auraprime",
    shopUrl: "https://auraprimeclinic.com",
    contactPhone: "02-555-8899"
  },
  course: {
    productName: "AI Business Mastery (คอร์สเรียนและโปรแกรมช่วยงานธุรกิจด้วย AI)",
    goal: "รับสมัครนักเรียนรุ่นใหม่ 200 คน และสร้างฐานผู้ติดตามคุณภาพ",
    targetAudience: "เจ้าของธุรกิจ SME, พ่อค้าแม่ค้าออนไลน์ และฟรีแลนซ์อายุ 24-50 ปี ที่อยากลดเวลาทำงาน",
    budget: "30,000 บาท/เดือน",
    platforms: ["Facebook", "TikTok", "LINE OA", "Google Search / SEO"],
    commandText: "เรียนจบใช้งานได้จริงใน 1 วัน มี Template พร้อมใช้แจกฟรี โบนัสกลุ่ม VIP ถามตอบตลอดชีพ ราคาพิเศษ Early Bird เฉพาะสัปดาห์นี้",
    fbUrl: "https://facebook.com/AIBusinessMasteryTH",
    tiktokUrl: "https://tiktok.com/@aibusiness.th",
    igUrl: "https://instagram.com/aibusiness.th",
    lineUrl: "https://lin.ee/aibusiness",
    shopUrl: "https://aibusiness-th.com",
    contactPhone: "081-999-7788"
  },
  cafe: {
    productName: "Komo Matcha & Specialty Roasters (คาเฟ่มัทฉะเกรดพรีเมียม & เดลิเวอรี)",
    goal: "เพิ่มยอดสั่งเดลิเวอรีและลูกค้าหน้าร้านขึ้น 2 เท่าภายในเดือนนี้",
    targetAudience: "สายคาเฟ่ พนักงานออฟฟิศ และคนรักมัทฉะ/กาแฟพิเศษ อายุ 20-38 ปี",
    budget: "15,000 บาท/เดือน",
    platforms: ["Facebook", "TikTok", "Instagram", "LINE OA"],
    commandText: "ผงมัทฉะแท้เกรดพิธีการจากเมืองอูจิ ชงสดแก้วต่อแก้ว มีเมนูซิกเนเจอร์ถ่ายรูปสวย โปรสั่งผ่าน LINE แถมคุกกี้โฮมเมดฟรี",
    fbUrl: "https://facebook.com/KomoMatchaCafe",
    tiktokUrl: "https://tiktok.com/@komomatcha.bkk",
    igUrl: "https://instagram.com/komo.matcha",
    lineUrl: "https://lin.ee/komomatcha",
    shopUrl: "https://wongnai.com/komomatcha",
    contactPhone: "094-567-8900"
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialState();
  connectSSE();
});

async function loadInitialState() {
  try {
    const res = await fetch("/api/state");
    const data = await res.json();
    appState.settings = data.settings || {};
    appState.brandProfiles = data.brandProfiles || [];
    appState.agents = data.agents || [];
    appState.campaigns = data.campaigns || [];
    appState.lineLogs = data.lineLogs || [];
    appState.publishLogs = data.publishLogs || [];

    if (appState.campaigns.length > 0 && !appState.currentCampaignId) {
      appState.currentCampaignId = appState.campaigns[0].id;
    }

    populateCommandChannelLinksFromActiveBrand();
    renderAll();
  } catch (err) {
    showToast("ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้: " + err.message);
  }
}

function getActiveBrandProfile() {
  return (
    appState.brandProfiles.find((b) => b.id === appState.settings.activeBrandId) ||
    appState.brandProfiles[0] ||
    null
  );
}

function populateCommandChannelLinksFromActiveBrand() {
  const b = getActiveBrandProfile();
  if (!b) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };
  setVal("inputFbUrl", b.fbUrl || "");
  setVal("inputTiktokUrl", b.tiktokUrl || "");
  setVal("inputIgUrl", b.igUrl || "");
  setVal("inputLineUrl", b.lineUrl || "");
  setVal("inputShopUrl", b.shopUrl || b.websiteUrl || "");
  setVal("inputContactPhone", b.contactPhone || "");

  setVal("inputProductName", b.productDefault || b.brandName || "");
  setVal("inputGoal", b.goalDefault || "10 งานใน 1 เดือน");
  setVal("inputAudience", b.targetAudienceDefault || "ลูกค้ากลุ่มเป้าหมายบนโลกออนไลน์");
  setVal("inputBudget", b.budgetDefault || "1,000");
  setVal("inputCommandText", b.commandDefault || "");

  const formBadge = document.getElementById("currentProjectFormBadge");
  if (formBadge) {
    formBadge.textContent = `📁 โปรเจกต์ที่กำลังสั่งงาน: ${b.icon || "🌐"} ${b.brandName || "เพจหลัก"}`;
  }
}

function connectSSE() {
  const evtSource = new EventSource("/api/events");
  evtSource.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (!msg || !msg.type) return;

      if (msg.payload?.campaign) {
        upsertCampaign(msg.payload.campaign);
        if (msg.type === "campaign_awaiting_approval") {
          showToast("📲 AI ออกแบบรูป+แคปชันเสร็จแล้ว! ส่งการ์ดตรวจงานเข้า LINE ให้คุณกดยืนยันแล้วครับ");
        }
      }

      if (msg.type === "line_log_added" && msg.payload?.lineLogs) {
        appState.lineLogs = msg.payload.lineLogs;
        renderLineSettingsAndLogs();
      }

      if (msg.type === "step_started" && msg.payload?.step) {
        appState.selectedStepAgentId = msg.payload.step.agentId;
        renderCampaignViews();
      } else if (msg.type === "step_completed" && msg.payload?.step) {
        appState.selectedStepAgentId = msg.payload.step.agentId;
        renderCampaignViews();
      } else if (msg.type === "posting_updated") {
        renderCampaignViews();
      } else if (msg.type === "campaign_completed") {
        showToast("🎉 AI โพสต์ครบทุกเพจ (FB / TikTok / IG / LINE) และส่งแจ้งเตือนเข้า LINE OA แล้ว!");
        loadInitialState();
      }
    } catch (e) {
      console.error("SSE parse error:", e);
    }
  };
}

function upsertCampaign(campaign) {
  const idx = appState.campaigns.findIndex((c) => c.id === campaign.id);
  if (idx !== -1) {
    appState.campaigns[idx] = campaign;
  } else {
    appState.campaigns.unshift(campaign);
  }
  appState.currentCampaignId = campaign.id;
  renderProjectSwitcherBar();
  renderSidebarHistory();
  renderCampaignViews();
}

function getProjectCampaigns() {
  const activeBrandId = appState.settings.activeBrandId;
  if (!activeBrandId) return appState.campaigns;
  const filtered = appState.campaigns.filter((c) => !c.brandId || c.brandId === activeBrandId);
  return filtered;
}

function getCurrentCampaign() {
  const projCampaigns = getProjectCampaigns();
  return projCampaigns.find((c) => c.id === appState.currentCampaignId) || projCampaigns[0] || null;
}

function renderAll() {
  renderProjectSwitcherBar();
  renderHeaderBadges();
  renderSidebarHistory();
  renderCampaignViews();
  renderBrandChannelsAndPublishLogs();
  renderAgentStudio();
  renderLineSettingsAndLogs();
  renderLLMSettings();
}

function renderProjectSwitcherBar() {
  const container = document.getElementById("projectTabsList");
  if (!container) return;
  const activeId = appState.settings.activeBrandId;
  container.innerHTML = (appState.brandProfiles || [])
    .map((b) => {
      const isActive = b.id === activeId;
      const count = (appState.campaigns || []).filter((c) => c.brandId === b.id).length;
      return `
        <button type="button" class="project-tab-btn ${isActive ? "active" : ""}" onclick="handleSwitchProject('${b.id}')">
          <span>${b.icon || "🌐"}</span>
          <span>${escapeHtml(b.brandName || "โปรเจกต์เพจ")}</span>
          <small style="opacity:0.75;">(${count})</small>
        </button>
      `;
    })
    .join("");
}

async function handleSwitchProject(brandId) {
  try {
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "select", brandId })
    });
    const data = await res.json();
    if (data.activeBrandId) {
      appState.settings.activeBrandId = data.activeBrandId;
    }
    const projCampaigns = getProjectCampaigns();
    appState.currentCampaignId = projCampaigns[0]?.id || null;
    populateCommandChannelLinksFromActiveBrand();
    renderAll();
    const activeBrand = getActiveBrandProfile();
    showToast(`📁 สลับไปยังโปรเจกต์ "${activeBrand?.brandName || "เพจ"}" เรียบร้อยแล้ว`);
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการสลับโปรเจกต์: " + err.message);
  }
}

function openNewProjectModal() {
  document.getElementById("newProjName").value = "";
  document.getElementById("newProjIcon").value = "🌐";
  document.getElementById("newProjProduct").value = "";
  document.getElementById("newProjAudience").value = "";
  document.getElementById("newProjFbUrl").value = "";
  document.getElementById("newProjTiktokUrl").value = "";
  document.getElementById("newProjIgUrl").value = "";
  document.getElementById("newProjLineUrl").value = "";
  document.getElementById("newProjectModal").classList.remove("hidden");
}

function closeNewProjectModal() {
  document.getElementById("newProjectModal").classList.add("hidden");
}

async function handleConfirmCreateProject(e) {
  e.preventDefault();
  const profile = {
    brandName: document.getElementById("newProjName").value.trim(),
    icon: document.getElementById("newProjIcon").value.trim() || "🌐",
    productDefault: document.getElementById("newProjProduct").value.trim(),
    targetAudienceDefault: document.getElementById("newProjAudience").value.trim(),
    fbUrl: document.getElementById("newProjFbUrl").value.trim(),
    tiktokUrl: document.getElementById("newProjTiktokUrl").value.trim(),
    igUrl: document.getElementById("newProjIgUrl").value.trim(),
    lineUrl: document.getElementById("newProjLineUrl").value.trim()
  };

  try {
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", profile })
    });
    const data = await res.json();
    if (data.brandProfiles) {
      appState.brandProfiles = data.brandProfiles;
      appState.settings.activeBrandId = data.activeBrandId;
      appState.currentCampaignId = null;
      populateCommandChannelLinksFromActiveBrand();
      renderAll();
      closeNewProjectModal();
      showToast(`🎉 สร้างโปรเจกต์ใหม่ "${profile.brandName}" เรียบร้อยแล้ว!`);
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด: " + err.message);
  }
}

async function handleDeleteCurrentProject() {
  if ((appState.brandProfiles || []).length <= 1) {
    return showToast("⚠️ ต้องมีโปรเจกต์เพจอย่างน้อย 1 รายการ (สามารถใช้ปุ่ม เซต 0 เพื่อล้างข้อมูลได้ครับ)");
  }
  const activeBrand = getActiveBrandProfile();
  if (!activeBrand) return;

  try {
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", brandId: activeBrand.id })
    });
    const data = await res.json();
    if (data.brandProfiles) {
      appState.brandProfiles = data.brandProfiles;
      appState.settings.activeBrandId = data.activeBrandId;
      const projCampaigns = getProjectCampaigns();
      appState.currentCampaignId = projCampaigns[0]?.id || null;
      populateCommandChannelLinksFromActiveBrand();
      renderAll();
      showToast(`🗑️ ลบโปรเจกต์ "${activeBrand.brandName}" เรียบร้อยแล้ว`);
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด: " + err.message);
  }
}

function renderHeaderBadges() {
  const providerMap = {
    simulation: "⚡ Smart Simulator (พร้อมทดสอบ)",
    gemini: "✨ Google Gemini",
    openai: "🟢 OpenAI GPT",
    claude: "🟣 Anthropic Claude"
  };
  const activeProv = appState.settings.activeProvider || "simulation";
  const label = providerMap[activeProv] || activeProv;

  document.getElementById("activeProviderLabel").textContent = label;
  document.getElementById("sidebarProviderBadge").textContent = label;

  const activeBrand = getActiveBrandProfile();
  const brandLabelEl = document.getElementById("activeBrandHeaderLabel");
  if (brandLabelEl && activeBrand) {
    brandLabelEl.textContent = activeBrand.brandName || "เพจหลักของคุณ";
  }

  const lineToken = appState.settings.line?.channelAccessToken;
  const lineStatusEl = document.getElementById("lineStatusLabel");
  if (lineToken && lineToken.trim().length > 0) {
    lineStatusEl.textContent = "เชื่อมต่อ LINE OA แล้ว";
  } else {
    lineStatusEl.textContent = "โหมดบันทึก Log / พร้อมเชื่อม";
  }
}

function renderSidebarHistory() {
  const listEl = document.getElementById("campaignHistoryList");
  const projCampaigns = getProjectCampaigns();
  if (!projCampaigns || projCampaigns.length === 0) {
    listEl.innerHTML = `<div style="font-size:12px; color:#64748b; padding:8px;">ยังไม่มีประวัติแคมเปญในโปรเจกต์เพจนี้ กดสั่งการเพื่อเริ่มแคมเปญแรกได้เลย!</div>`;
    return;
  }

  listEl.innerHTML = projCampaigns
    .map((c) => {
      const isActive = c.id === appState.currentCampaignId;
      const doneSteps = (c.steps || []).filter((s) => s.status === "completed").length;
      const totalSteps = (c.steps || []).length || 7;
      const pct = Math.round((doneSteps / totalSteps) * 100);
      const statusIcon = c.status === "completed" ? "✅" : c.status === "running" ? "⏳" : "📌";
      return `
        <div class="history-item ${isActive ? "active" : ""}" onclick="selectCampaign('${c.id}')">
          <div class="history-item-row">
            <div class="history-item-title">${statusIcon} ${escapeHtml(c.brief?.productName || "แคมเปญการตลาด")}</div>
            <button type="button" class="btn-delete-item" onclick="handleDeleteCampaign(event, '${c.id}')" title="ลบแคมเปญนี้">🗑️</button>
          </div>
          <div class="history-item-meta">
            <span>สำเร็จ ${doneSteps}/${totalSteps} (${pct}%)</span>
            <span>${new Date(c.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

async function handleDeleteCampaign(event, campaignId) {
  if (event) event.stopPropagation();
  try {
    const res = await fetch("/api/campaigns/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId })
    });
    const data = await res.json();
    appState.campaigns = data.campaigns || [];
    if (appState.currentCampaignId === campaignId) {
      appState.currentCampaignId = appState.campaigns[0]?.id || null;
    }
    renderSidebarHistory();
    renderCampaignViews();
    showToast("🗑️ ลบแคมเปญออกจากประวัติเรียบร้อยแล้ว");
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการลบแคมเปญ: " + err.message);
  }
}

async function handleClearAllCampaigns() {
  if (!appState.campaigns || appState.campaigns.length === 0) {
    return showToast("ไม่มีประวัติแคมเปญให้ลบ");
  }
  try {
    const res = await fetch("/api/campaigns/clear-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await res.json();
    appState.campaigns = data.campaigns || [];
    appState.currentCampaignId = null;
    renderSidebarHistory();
    renderCampaignViews();
    showToast("🗑️ ล้างประวัติแคมเปญทั้งหมดเรียบร้อยแล้ว!");
  } catch (err) {
    showToast("เกิดข้อผิดพลาด: " + err.message);
  }
}

// เคลียร์ช่องกรอกทั้งหมดให้ว่างเปล่าเพื่อใส่ข้อมูลเพจใหม่ทันที
function handleClearFormOnly() {
  const fields = [
    "inputFbUrl",
    "inputTiktokUrl",
    "inputIgUrl",
    "inputLineUrl",
    "inputShopUrl",
    "inputContactPhone",
    "inputProductName",
    "inputGoal",
    "inputAudience",
    "inputBudget",
    "inputCommandText"
  ];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const badge = document.getElementById("linkInspectResult");
  if (badge) badge.classList.add("hidden");

  const firstInput = document.getElementById("inputFbUrl");
  if (firstInput) firstInput.focus();

  showToast("🧹 เคลียร์ช่องทั้งหมดให้ว่างแล้ว! วางลิงก์เพจใหม่ของคุณได้เลย");
}

// ปุ่มเซต 0 เริ่มเพจใหม่ทั้งหมด (ล้างประวัติแคมเปญ + ล้างเพจเก่า + เคลียร์ฟอร์มเริ่มเพจใหม่ตั้งแต่ศูนย์)
async function handleResetToZeroNewPage() {
  try {
    const res = await fetch("/api/system/reset-zero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearCampaigns: true })
    });
    const data = await res.json();
    appState.settings = data.settings || appState.settings;
    appState.brandProfiles = data.brandProfiles || [];
    appState.campaigns = [];
    appState.lineLogs = [];
    appState.publishLogs = [];
    appState.currentCampaignId = null;

    handleClearFormOnly();
    renderAll();

    // ล้างหน้าจอ Live Log กลับสู่สถานะเริ่มต้น
    const logContainer = document.getElementById("liveLogContainer");
    if (logContainer) {
      logContainer.innerHTML = `<div class="empty-log"><p>🔄 <strong>เซต 0 เรียบร้อย!</strong> วางลิงก์เพจใหม่ด้านซ้าย แล้วกดปุ่มเริ่มทำงานได้เลย</p></div>`;
    }

    switchMainTab("command");
    showToast("🔄 เซต 0 เริ่มเพจใหม่เรียบร้อย! พร้อมใส่ลิงก์เพจใหม่และสั่งทีม AI ทำงานได้ทันที");
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการเซต 0: " + err.message);
  }
}

function selectCampaign(campaignId) {
  appState.currentCampaignId = campaignId;
  renderSidebarHistory();
  renderCampaignViews();
}

function renderCampaignViews() {
  const campaign = getCurrentCampaign();
  renderPipelineVisualizer(campaign);
  renderLiveLogs(campaign);
  renderQuickPreview(campaign);
  renderDeliverablesWorkspace(campaign);
}

function renderPipelineVisualizer(campaign) {
  const container = document.getElementById("pipelineVisualizer");
  const steps = campaign?.steps || appState.agents.map((a) => ({
    agentId: a.id,
    agentName: a.name,
    role: a.role,
    department: a.department,
    avatar: a.avatar,
    status: "pending",
    output: ""
  }));

  container.innerHTML = steps
    .map((step, index) => {
      const isSelected = appState.selectedStepAgentId === step.agentId;
      const statusLabels = {
        pending: "รอรับช่วงงาน",
        working: "⚡ กำลังทำงาน...",
        completed: "✅ เสร็จสมบูรณ์",
        error: "⚠️ ขัดข้อง"
      };
      return `
        <div class="pipeline-node ${step.status} ${isSelected ? "active-selected" : ""}" onclick="selectAgentStep('${step.agentId}')">
          <div>
            <div class="node-step-num">STEP 0${index + 1}</div>
            <div class="node-avatar">${step.avatar || "🤖"}</div>
            <div class="node-title">${escapeHtml(step.agentName)}</div>
            <div class="node-dept">${escapeHtml(step.role)}</div>
          </div>
          <div style="font-size:10.5px; color:#67e8f9; margin-top:4px; background:rgba(15,23,42,0.75); padding:3px 7px; border-radius:6px; border:1px solid rgba(103,232,249,0.25);">
            ${getAgentConnectedToolBadge(step.agentId)}
          </div>
          <div class="node-status-pill ${step.status}">
            ${statusLabels[step.status] || "รอคิว"}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderPlatformPostingBoard(campaign) {
  const boardEl = document.getElementById("platformPostingBoard");
  if (!boardEl) return;

  const activeBrand = getActiveBrandProfile() || {};
  const defaultPostingSteps = [
    { platform: "Facebook", icon: "📘", targetUrl: activeBrand.fbUrl || "-", status: "pending", postedAt: null },
    { platform: "TikTok", icon: "🎵", targetUrl: activeBrand.tiktokUrl || "-", status: "pending", postedAt: null },
    { platform: "Instagram", icon: "📸", targetUrl: activeBrand.igUrl || "-", status: "pending", postedAt: null },
    { platform: "LINE OA", icon: "💬", targetUrl: activeBrand.lineUrl || "-", status: "pending", postedAt: null }
  ];

  const postingSteps =
    campaign?.postingSteps && campaign.postingSteps.length > 0
      ? campaign.postingSteps
      : defaultPostingSteps;

  boardEl.innerHTML = postingSteps
    .map((p) => {
      let badgeLabel = "❌ ยังไม่โพสต์";
      if (p.status === "posted") {
        badgeLabel = p.simulated
          ? `⚠️ โหมดจำลอง ${p.postedAt ? `(${p.postedAt})` : ""}`
          : `✅ โพสต์จริงแล้ว ${p.postedAt ? `(${p.postedAt})` : ""}`;
      } else if (p.status === "posting") {
        badgeLabel = "⏳ กำลังโพสต์...";
      } else if (p.status === "error") {
        badgeLabel = "❌ ติดปัญหา (คลิกลองใหม่)";
      }

      const subText =
        p.status === "error" && p.note
          ? `<small style="color:#fda4af; display:block; margin-top:2px;" title="${escapeHtml(p.note)}">${escapeHtml(p.note.slice(0, 95))}${p.note.length > 95 ? "..." : ""}</small>`
          : `<small title="${escapeHtml(p.targetUrl || "")}">${escapeHtml(p.targetUrl || "ยังไม่ระบุลิงก์")}</small>`;

      return `
        <div class="posting-card-item ${p.status}">
          <div class="posting-card-left">
            <span class="posting-card-icon">${p.icon || "🌐"}</span>
            <div class="posting-card-info">
              <strong>${escapeHtml(p.platform)}</strong>
              ${subText}
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="posting-badge-btn ${p.status}" onclick="handleTriggerSequentialPosting('${p.platform}')" title="${escapeHtml(p.note || "คลิกเพื่อสั่งโพสต์ลงช่องทางนี้ทันที")}">
              ${badgeLabel}
            </button>
            <button type="button" class="posting-badge-btn pending" style="background:rgba(99,102,241,0.18); border-color:rgba(99,102,241,0.45); color:#c7d2fe;" onclick="handleQuickCopyAndOpenPlatform('${p.platform}')" title="คัดลอกเฉพาะแคปชันขายของล้วนๆ และเปิดหน้าเพจเพื่อวางโพสต์ (Ctrl+V) ทันที">
              📋 คัดลอก+เปิดเพจ
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function extractCleanCaptionClient(rawText = "") {
  if (!rawText) return "";
  const lines = rawText.split("\n");
  const quoteLines = [];
  let inFirstQuote = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith(">")) {
      inFirstQuote = true;
      quoteLines.push(t.replace(/^>\s?/, "").replace(/\*\*/g, ""));
    } else if (inFirstQuote && (t === "---" || t.startsWith("####"))) {
      break;
    }
  }
  if (quoteLines.length >= 3) return quoteLines.join("\n").trim();
  return rawText.replace(/\*\*/g, "").trim();
}

async function handleQuickCopyAndOpenPlatform(platform) {
  const campaign = getCurrentCampaign();
  const activeBrand = getActiveBrandProfile() || {};
  const copyStep =
    (campaign?.steps || []).find((s) => s.agentId === "content_copywriter" && s.output) ||
    (campaign?.steps || [])[0];
  const rawText = copyStep?.output || activeBrand.commandDefault || `โปรโมชันพิเศษจาก ${activeBrand.brandName || "เพจของเรา"}`;
  const cleanCaption = extractCleanCaptionClient(rawText);

  try {
    await navigator.clipboard.writeText(cleanCaption);
    showToast(`📋 คัดลอกแคปชัน "${activeBrand.brandName || platform}" แล้ว! กด Ctrl+V วางโพสต์ได้เลย`);
  } catch (e) {
    showToast("คัดลอกแคปชันเรียบร้อย");
  }

  let url = activeBrand.fbUrl || "https://facebook.com";
  if (platform === "TikTok") url = activeBrand.tiktokUrl || "https://www.tiktok.com/creator-center/upload";
  if (platform === "Instagram") url = activeBrand.igUrl || "https://www.instagram.com";
  if (platform === "LINE OA") url = activeBrand.lineUrl || "https://manager.line.biz";
  if (url && url !== "-") {
    window.open(url, "_blank");
  }
}

async function handleTriggerSequentialPosting(platform = null) {
  const campaign = getCurrentCampaign();
  if (!campaign) {
    return showToast("⚠️ กรุณากดสั่งทีม AI เริ่มแคมเปญก่อนเริ่มโพสต์ลงเพจครับ");
  }
  showToast(
    platform
      ? `📤 กำลังสั่ง AI โพสต์ลง ${platform} และแจ้งเตือนเข้า LINE OA...`
      : `📤 กำลังสั่ง AI ไล่โพสต์ลงทุกเพจ (FB -> TikTok -> IG -> LINE) และรายงานเข้า LINE OA...`
  );
  try {
    const res = await fetch("/api/campaigns/run-posting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaign.id, platform })
    });
    const data = await res.json();
    if (data.campaign) {
      upsertCampaign(data.campaign);
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด: " + err.message);
  }
}

function renderLiveLogs(campaign) {
  const logContainer = document.getElementById("liveLogContainer");
  const badgeEl = document.getElementById("campaignStatusBadge");
  const stepTextEl = document.getElementById("progressStepText");
  const pctTextEl = document.getElementById("progressPercentText");
  const barFillEl = document.getElementById("progressBarFill");

  renderPlatformPostingBoard(campaign);
  renderApprovalGateBox(campaign);

  if (!campaign) {
    badgeEl.className = "status-tag idle";
    badgeEl.textContent = "พร้อมรับคำสั่ง";
    if (stepTextEl) stepTextEl.textContent = "📊 สถานะการโพสต์ลงเพจ: รอเริ่มงาน (0/4 ช่องทาง)";
    if (pctTextEl) pctTextEl.textContent = "0%";
    if (barFillEl) barFillEl.style.width = "0%";
    return;
  }

  const postingSteps = campaign.postingSteps || [];
  const postedCount = postingSteps.filter((p) => p.status === "posted").length;
  const totalPlatforms = postingSteps.length || 4;
  const postingNow = postingSteps.find((p) => p.status === "posting");

  const steps = campaign.steps || [];
  const totalSteps = Math.max(steps.length, 1);
  const doneSteps = steps.filter((s) => s.status === "completed").length;
  const workingStep = steps.find((s) => s.status === "working");

  // หากกำลังไล่โพสต์ลงเพจ หรือโพสต์เสร็จแล้ว ให้แสดง % ของการโพสต์ลงเพจ 4 ช่องทาง
  if (postedCount > 0 || postingNow || doneSteps === totalSteps) {
    const postPct = Math.round((postedCount / totalPlatforms) * 100);
    if (barFillEl) barFillEl.style.width = `${postPct}%`;
    if (pctTextEl) pctTextEl.textContent = `${postPct}%`;

    if (postedCount === totalPlatforms) {
      badgeEl.className = "status-tag completed";
      badgeEl.textContent = `✅ โพสต์ครบ ${postedCount}/${totalPlatforms} เพจ`;
      if (stepTextEl) {
        stepTextEl.textContent = `🎉 โพสต์ครบทุกเพจแล้ว (${postedCount}/${totalPlatforms}: FB ✅ / TikTok ✅ / IG ✅ / LINE ✅)`;
      }
    } else {
      badgeEl.className = "status-tag running";
      badgeEl.textContent = `📤 กำลังโพสต์ (${postedCount}/${totalPlatforms} เพจ)`;
      if (stepTextEl) {
        stepTextEl.textContent = postingNow
          ? `⏳ โพสต์แล้ว ${postedCount}/${totalPlatforms} เพจ — กำลังโพสต์ลง ${postingNow.icon} ${postingNow.platform}...`
          : `📊 โพสต์ลงเพจแล้ว ${postedCount}/${totalPlatforms} ช่องทาง`;
      }
    }
  } else {
    // ระหว่างที่ทีม AI 7 แผนกกำลังเตรียมคอนเทนต์ก่อนส่งไปโพสต์
    const prepPct = Math.round((doneSteps / totalSteps) * 100);
    if (barFillEl) barFillEl.style.width = `${prepPct}%`;
    if (pctTextEl) pctTextEl.textContent = `เตรียมสื่อ ${prepPct}%`;
    badgeEl.className = "status-tag running";
    badgeEl.textContent = `🤖 เตรียมสื่อ (${doneSteps}/${totalSteps})`;
    if (stepTextEl) {
      stepTextEl.textContent = workingStep
        ? `⏳ กำลังเตรียมคอนเทนต์ก่อนโพสต์ (${doneSteps + 1}/${totalSteps}: ${workingStep.agentName})...`
        : `⏳ กำลังเตรียมคอนเทนต์สำหรับโพสต์ลงเพจ...`;
    }
  }

  const logs = campaign.logs || [];
  if (logs.length === 0) {
    logContainer.innerHTML = `<div class="empty-log"><p>ยังไม่มีประวัติการทำงาน</p></div>`;
    return;
  }

  logContainer.innerHTML = logs
    .map(
      (l) => `
      <div class="log-item">
        <div class="log-avatar">${l.avatar || "🤖"}</div>
        <div>
          <div><strong>${escapeHtml(l.agentName)}</strong> <span class="log-meta">• ${l.time}</span></div>
          <div>${escapeHtml(l.message)}</div>
        </div>
      </div>
    `
    )
    .join("");

  logContainer.scrollTop = logContainer.scrollHeight;
}

function selectAgentStep(agentId) {
  appState.selectedStepAgentId = agentId;
  renderCampaignViews();
}

function renderQuickPreview(campaign) {
  const avatarEl = document.getElementById("previewAgentAvatar");
  const nameEl = document.getElementById("previewAgentName");
  const roleEl = document.getElementById("previewAgentRole");
  const contentEl = document.getElementById("quickOutputContent");

  if (!campaign) {
    const defaultAgent = appState.agents.find((a) => a.id === appState.selectedStepAgentId) || appState.agents[0];
    if (defaultAgent) {
      avatarEl.textContent = defaultAgent.avatar;
      nameEl.textContent = defaultAgent.name;
      roleEl.textContent = defaultAgent.role;
    }
    contentEl.innerHTML = `💡 วางลิงก์เพจของคุณ (FB / TikTok / IG / LINE) ด้านบน แล้วกดปุ่ม <strong>"🚀 สั่งทีม AI ทั้ง 7 แผนกเริ่มทำงานให้เพจของเราทันที"</strong> เพื่อดูผลงานครบวงจร!`;
    return;
  }

  const step =
    campaign.steps.find((s) => s.agentId === appState.selectedStepAgentId) ||
    campaign.steps.find((s) => s.status === "completed") ||
    campaign.steps[0];

  if (!step) return;

  avatarEl.textContent = step.avatar || "🤖";
  nameEl.textContent = `${step.agentName} — แคมเปญ "${campaign.brief?.productName || ""}"`;
  roleEl.textContent = `${step.role} ${step.modelUsed ? `(ขับเคลื่อนโดย: ${step.modelUsed})` : ""}`;

  if (step.status === "working") {
    contentEl.innerHTML = `⏳ <strong>${escapeHtml(step.agentName)}</strong> กำลังคิดวิเคราะห์ข้อมูลเพจและจัดทำชิ้นงานในส่วนของ "${escapeHtml(step.role)}" กรุณารอสักครู่...`;
  } else if (step.output) {
    contentEl.textContent = step.output;
  } else {
    contentEl.innerHTML = `⏳ รอรับช่วงต่องานจากแผนกก่อนหน้า...`;
  }

  renderAiGraphicStudio(campaign, step.agentId);
}

let currentGraphicTheme = "luxury_gold";
let cachedAiBgImage = null;
let cachedAiBgBrand = "";

const GRAPHIC_THEMES = {
  luxury_gold: {
    label: "✨ Luxury Gold (บิ้วอิน/พรีเมียม)",
    bgTop: "#0f172a",
    bgBottom: "#1e1b4b",
    cardBg: "rgba(15, 23, 42, 0.88)",
    accent: "#f59e0b",
    accentLight: "#fde68a",
    secondary: "#fbbf24",
    badgeBg: "#d97706",
    ctaBg: "#b45309"
  },
  modern_blue: {
    label: "💎 Royal Blue (ก่อสร้าง/แอร์/บริการ)",
    bgTop: "#082f49",
    bgBottom: "#0f172a",
    cardBg: "rgba(12, 34, 64, 0.88)",
    accent: "#38bdf8",
    accentLight: "#bae6fd",
    secondary: "#0ea5e9",
    badgeBg: "#0284c7",
    ctaBg: "#0369a1"
  },
  emerald_trust: {
    label: "🌿 Emerald (รีโนเวท/บ้านและสวน)",
    bgTop: "#064e3b",
    bgBottom: "#0f172a",
    cardBg: "rgba(6, 58, 44, 0.88)",
    accent: "#34d399",
    accentLight: "#a7f3d0",
    secondary: "#10b981",
    badgeBg: "#059669",
    ctaBg: "#047857"
  },
  crimson_sale: {
    label: "🔥 Flash Deal (โปรแรงด่วน)",
    bgTop: "#450a0a",
    bgBottom: "#18181b",
    cardBg: "rgba(45, 10, 10, 0.88)",
    accent: "#fbbf24",
    accentLight: "#fef08a",
    secondary: "#ef4444",
    badgeBg: "#dc2626",
    ctaBg: "#b91c1c"
  },
  rose_glam: {
    label: "🌸 Rose Glam (แฟชั่น/ความงาม)",
    bgTop: "#4c0519",
    bgBottom: "#1e1b4b",
    cardBg: "rgba(56, 12, 36, 0.88)",
    accent: "#f472b6",
    accentLight: "#fbcfe8",
    secondary: "#ec4899",
    badgeBg: "#db2777",
    ctaBg: "#be185d"
  }
};

function jumpToGraphicStudio() {
  appState.selectedStepAgentId = "creative_director";
  renderCampaignViews();
  const el = document.getElementById("aiGraphicStudioContainer");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setGraphicTheme(themeKey) {
  if (!GRAPHIC_THEMES[themeKey]) return;
  currentGraphicTheme = themeKey;
  const campaign = getCurrentCampaign();
  renderAiGraphicStudio(campaign, appState.selectedStepAgentId);
}

function getCampaignGraphicData(campaign) {
  const activeBrand = getActiveBrandProfile() || {};
  const brief = campaign?.brief || {};
  const brandName = brief.productName || activeBrand.brandName || "KPN บิ้วอิน เชียงใหม่";
  const goal = brief.goal || activeBrand.goalDefault || "รับประกันคุณภาพ มาตรฐานมืออาชีพ";
  const rawCmd = (brief.commandText || activeBrand.commandDefault || "").trim();
  const isSkincarePlaceholder =
    rawCmd.includes("สารสกัดนำเข้าจากญี่ปุ่น") &&
    !/(เซรั่ม|ครีม|ผิว|คลินิก|serum)/i.test(brandName);
  const cmdText = isSkincarePlaceholder
    ? `รับออกแบบและติดตั้งงานคุณภาพโดย ${brandName} ประเมินราคาฟรี งบไม่บานปลาย ส่งมอบงานตรงเวลา`
    : rawCmd || `บริการมาตรฐานมืออาชีพโดย ${brandName} ดูแลครบวงจร ปรึกษาและประเมินราคาฟรี`;

  const parts = cmdText
    .split(/[,\n•\-]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && !s.startsWith("อยากได้"));

  const b1 = parts[0] || `ออกแบบและดูแลโดยทีมงานมืออาชีพจาก ${brandName}`;
  const b2 = parts[1] || `งานเนี๊ยบ ตรงปก คุมงบได้จริง ไม่บานปลาย`;
  const b3 = parts[2] || `ปรึกษาและประเมินราคาฟรี! (${goal})`;

  const phone = brief.channels?.contactPhone || activeBrand.contactPhone || "088-7888-446";
  const lineRaw = brief.channels?.lineUrl || activeBrand.lineUrl || "@742srmne";
  const lineLabel = lineRaw.includes("@")
    ? "@" + lineRaw.split("@").pop()
    : lineRaw.replace(/^https?:\/\//, "");

  return { brandName, goal, b1, b2, b3, phone, lineLabel };
}

function renderAiGraphicStudio(campaign, selectedAgentId) {
  const container = document.getElementById("aiGraphicStudioContainer");
  if (!container) return;

  if (!campaign) {
    container.innerHTML = "";
    return;
  }

  const isGraphicStep = selectedAgentId === "creative_director";
  const data = getCampaignGraphicData(campaign);

  const themeButtonsHtml = Object.entries(GRAPHIC_THEMES)
    .map(
      ([k, v]) => `
      <button type="button" class="theme-pill-btn ${currentGraphicTheme === k ? "active" : ""}" onclick="setGraphicTheme('${k}')">
        ${v.label}
      </button>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="ai-graphic-studio-box">
      <div class="ai-graphic-header">
        <div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="background:#10b981; color:#052e16; font-weight:700; font-size:11px; padding:2px 8px; border-radius:99px;">✨ NO WATERMARK 100%</span>
            <h4 style="margin:0;">🎬 สตูดิโอ Maya (AI Creative): เชื่อม Google Flow + Canva Studio — แบรนด์ "${escapeHtml(data.brandName)}"</h4>
          </div>
          <small style="color:#94a3b8; font-size:12px; display:block; margin-top:4px;">
            ภาพทุกใบ <strong>ไร้ลายน้ำ 100%</strong> • กดเจนภาพใน <strong>Google Flow</strong> แล้วนำมาเชื่อมกับ <strong>Canva</strong> หรือคัดลอกไปโพสต์ลงเพจได้ทันที!
          </small>
        </div>
        <div class="ai-graphic-theme-bar">
          ${themeButtonsHtml}
          <button type="button" class="theme-pill-btn" style="border-color:#10b981; color:#6ee7b7;" onclick="loadAiPhotoIntoGraphics()">
            🔄 สลับภาพถ่ายสตูดิโอ 8K (ไร้ลายน้ำ)
          </button>
          <button type="button" class="theme-pill-btn ${cleanPhotoOnlyMode ? 'active' : ''}" style="border-color:#38bdf8; color:#bae6fd;" onclick="toggleCleanPhotoOnlyMode()">
            ${cleanPhotoOnlyMode ? '🧼 โหมดภาพเพียวๆ ไร้ตัวหนังสือ (เปิดอยู่)' : '🧼 สลับเป็นภาพเพียวๆ (ไม่ใส่ตัวหนังสือ)'}
          </button>
        </div>
      </div>

      <!-- Specific Built-in & Fit-in Furniture Style Selector Bar -->
      <div style="margin-bottom:12px; padding:10px 14px; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.4); border-radius:10px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="font-size:12.5px; font-weight:700; color:#fde68a;">
          🪵 เลือกประเภทงานบิ้วอิน-ฟิตอินสั่งทำ (ภาพตรงกับงานจริง 100% ไร้ลายน้ำ):
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="theme-pill-btn" style="background:rgba(15,23,42,0.85); border-color:#f59e0b; color:#fde68a; font-weight:600;" onclick="setBuiltinScene('tv_wall')">
            📺 1. ผนังทีวีบิ้วอิน + ตู้โชว์ซ่อนไฟ LED
          </button>
          <button type="button" class="theme-pill-btn" style="background:rgba(15,23,42,0.85); border-color:#f59e0b; color:#fde68a; font-weight:600;" onclick="setBuiltinScene('walkin_closet')">
            👗 2. ตู้เสื้อผ้าบิ้วอิน / Walk-in Closet
          </button>
          <button type="button" class="theme-pill-btn" style="background:rgba(15,23,42,0.85); border-color:#f59e0b; color:#fde68a; font-weight:600;" onclick="setBuiltinScene('kitchen')">
            🍳 3. ชุดครัวบิ้วอิน-ฟิตอินสั่งทำ สูงชนฝ้า
          </button>
        </div>
        </div>
      </div>

      <!-- Google Flow (Imagen 3 / Veo) + Canva Seamless Bridge Box -->
      <div style="margin-bottom:16px; padding:14px 16px; background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.14), rgba(125,42,232,0.14)); border:1px solid rgba(16,185,129,0.45); border-radius:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div style="flex:1; min-width:280px;">
            <div style="font-weight:700; font-size:13.5px; color:#6ee7b7; display:flex; align-items:center; gap:6px;">
              <span>🎬 เชื่อมต่อ Agent Maya ↔ Google Flow (Imagen 3 / Veo) + 🎨 Canva (ไร้ลายน้ำ 100%)</span>
            </div>
            <div style="font-size:11.5px; color:#cbd5e1; margin-top:4px;">
              Maya เขียน Prompt ระดับสตูดิโอ 8K (สั่งตัดลายน้ำออก <code>no watermark, no logo</code>) เตรียมไว้ให้แล้ว กดปุ่มด้านขวาเพื่อเปิด <strong>Google Flow</strong> เจนภาพ/วิดีโอ แล้วนำภาพเข้ามาแต่งต่อใน <strong>Canva</strong> หรือโพสต์ลงทุกแพลตฟอร์มได้เลย!
            </div>
            <div style="margin-top:8px;">
              <input type="text" id="googleFlowPromptInput" value="${escapeHtml(getGoogleFlowPromptForBrand(data.brandName))}" style="width:100%; padding:7px 10px; font-size:11.5px; border-radius:8px; border:1px solid rgba(16,185,129,0.4); background:rgba(9,13,22,0.9); color:#a7f3d0;" />
            </div>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
            <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,#10b981,#059669); border:none; color:#fff; font-weight:700; padding:9px 14px;" onclick="openGoogleFlowStudio('flow')">
              🎬 1. คัดลอก Prompt + เปิด Google Flow
            </button>
            <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,#3b82f6,#2563eb); border:none; color:#fff; font-weight:600; padding:9px 14px;" onclick="openGoogleFlowStudio('imagefx')">
              🖼️ 2. เปิด Google ImageFX (Imagen 3)
            </button>
            <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,#00c4cc,#7d2ae8); border:none; color:#fff; font-weight:700; padding:9px 14px;" onclick="document.getElementById('googleFlowFileInput').click()">
              📥 3. นำภาพจาก Google Flow เข้า Canva & แบนเนอร์
            </button>
            <input type="file" id="googleFlowFileInput" accept="image/*" style="display:none;" onchange="handleGoogleFlowImageSelected(event)" />
          </div>
        </div>
      </div>

      <div class="ai-graphic-grid">
        <!-- Card 1: Facebook / IG Square Ad Banner -->
        <div class="ai-graphic-card">
          <div class="ai-graphic-card-title">
            <span>📘 1. แบนเนอร์โพสต์เพจ FB / IG</span>
            <span style="font-size:11px; color:#94a3b8;">1080 × 1080 px</span>
          </div>
          <div class="ai-graphic-canvas-wrap">
            <canvas id="graphicCanvasFb" width="1080" height="1080"></canvas>
          </div>
          <div class="ai-graphic-card-actions">
            <button type="button" class="btn-graphic-action copy-img" onclick="copyGraphicCanvasToClipboard('graphicCanvasFb', true)">
              📘 คัดลอกรูป + เปิดเพจ FB
            </button>
            <button type="button" class="btn-graphic-action" onclick="downloadGraphicCanvas('graphicCanvasFb', 'FB-Banner')">
              ⬇️ ดาวน์โหลด PNG
            </button>
            <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,rgba(0,196,204,0.25),rgba(125,42,232,0.28)); border-color:#00c4cc; color:#a5f3fc;" onclick="openCanvaWithGraphic('graphicCanvasFb', 'facebook')">
              🎨 แต่งต่อใน Canva
            </button>
          </div>
        </div>

        <!-- Card 2: TikTok / Reels Vertical Cover -->
        <div class="ai-graphic-card">
          <div class="ai-graphic-card-title">
            <span>🎵 2. ปกคลิป TikTok / Reels / Story</span>
            <span style="font-size:11px; color:#94a3b8;">1080 × 1080 px (Viral Cover)</span>
          </div>
          <div class="ai-graphic-canvas-wrap">
            <canvas id="graphicCanvasTiktok" width="1080" height="1080"></canvas>
          </div>
          <div class="ai-graphic-card-actions">
            <button type="button" class="btn-graphic-action" onclick="copyGraphicCanvasToClipboard('graphicCanvasTiktok', false)">
              🖼️ คัดลอกรูป (Ctrl+V)
            </button>
            <button type="button" class="btn-graphic-action" onclick="downloadGraphicCanvas('graphicCanvasTiktok', 'TikTok-Cover')">
              ⬇️ ดาวน์โหลด PNG
            </button>
            <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,rgba(0,196,204,0.25),rgba(125,42,232,0.28)); border-color:#00c4cc; color:#a5f3fc;" onclick="openCanvaWithGraphic('graphicCanvasTiktok', 'tiktok')">
              🎨 แต่งต่อใน Canva
            </button>
          </div>
        </div>

        <!-- Card 3: Flash Deal / LINE OA Rich Card -->
        <div class="ai-graphic-card">
          <div class="ai-graphic-card-title">
            <span>💬 3. ป้ายโปรโมชัน Flash Sale / LINE OA</span>
            <span style="font-size:11px; color:#94a3b8;">1080 × 1080 px</span>
          </div>
          <div class="ai-graphic-canvas-wrap">
            <canvas id="graphicCanvasLine" width="1080" height="1080"></canvas>
          </div>
          <div class="ai-graphic-card-actions">
            <button type="button" class="btn-graphic-action copy-img" onclick="copyGraphicCanvasToClipboard('graphicCanvasLine', true)">
              📘 คัดลอกรูป + เปิดเพจ FB
            </button>
            <button type="button" class="btn-graphic-action" onclick="downloadGraphicCanvas('graphicCanvasLine', 'Promo-Card')">
              ⬇️ ดาวน์โหลด PNG
            </button>
            <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,rgba(0,196,204,0.25),rgba(125,42,232,0.28)); border-color:#00c4cc; color:#a5f3fc;" onclick="openCanvaWithGraphic('graphicCanvasLine', 'line')">
              🎨 แต่งต่อใน Canva
            </button>
          </div>
        </div>
      </div>

      <!-- Canva Integration & Bulk Create Studio Bar -->
      <div style="margin-top:16px; padding:14px 16px; background:linear-gradient(135deg, rgba(0, 196, 204, 0.12), rgba(125, 42, 232, 0.16)); border:1px solid rgba(0, 196, 204, 0.4); border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="flex:1; min-width:260px;">
          <div style="font-weight:700; font-size:13.5px; color:#67e8f9; display:flex; align-items:center; gap:6px;">
            <span>🎨 ระบบเชื่อมต่อ Canva Studio ประจำเพจ "${escapeHtml(data.brandName)}"</span>
          </div>
          <div style="font-size:11.5px; color:#cbd5e1; margin-top:3px;">
            • กด <strong>"🎨 แต่งต่อใน Canva"</strong> ระบบจะคัดลอกรูปกราฟิกให้คุณไปกด <strong>Ctrl+V</strong> วางแต่งต่อใน Canva ได้ทันที<br/>
            • หรือวาง <strong>ลิงก์แม่แบบ Canva (Template Link)</strong> ประจำเพจไว้ด้านล่าง / ดาวน์โหลดไฟล์ <strong>CSV สำหรับ Canva Bulk Create</strong> เพื่อเจนรูป 7 วันรวด!
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; align-items:center; flex-wrap:wrap;">
            <input type="text" id="canvaTemplateUrlInput" placeholder="วางลิงก์ไฟล์แม่แบบ Canva ประจำเพจนี้ (เช่น https://www.canva.com/design/xxxx/edit)" value="${escapeHtml((getActiveBrandProfile() || {}).canvaTemplateUrl || "")}" style="flex:1; min-width:240px; padding:6px 10px; font-size:12px; border-radius:8px; border:1px solid rgba(0,196,204,0.4); background:rgba(15,23,42,0.85); color:#fff;" />
            <button type="button" class="theme-pill-btn" style="border-color:#00c4cc; color:#67e8f9;" onclick="saveBrandCanvaTemplateUrl()">
              💾 บันทึกลิงก์แม่แบบ Canva
            </button>
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button type="button" class="btn-graphic-action" style="background:linear-gradient(135deg,#00c4cc,#7d2ae8); border:none; color:#fff; font-weight:600; padding:9px 14px;" onclick="openCanvaWithGraphic('graphicCanvasFb', 'template')">
            🚀 เปิดแม่แบบ Canva + คัดลอกรูป/ข้อความ
          </button>
          <button type="button" class="btn-graphic-action" style="background:rgba(15,23,42,0.85); border-color:#00c4cc; color:#a5f3fc; font-weight:600; padding:9px 14px;" onclick="exportCanvaBulkCsv()">
            📊 ดาวน์โหลด CSV สำหรับ Canva Bulk Create (7 รูป)
          </button>
        </div>
      </div>
    </div>
  `;

  if (!cachedAiBgImage) {
    const defaultScene = BUILTIN_SCENES.tv_wall;
    const preloadImg = new Image();
    preloadImg.crossOrigin = "anonymous";
    preloadImg.onload = () => {
      cachedAiBgImage = preloadImg;
      cachedAiBgBrand = data.brandName;
      drawAllMarketingCanvases(data);
    };
    preloadImg.src = defaultScene.img;
  } else {
    requestAnimationFrame(() => {
      drawAllMarketingCanvases(data);
    });
  }
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = (text || "").split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  // กรณีภาษาไทยติดกันยาวโดยไม่มีเว้นวรรค
  const finalLines = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxWidth) {
      finalLines.push(line);
    } else {
      let chunk = "";
      for (const ch of line) {
        if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
          finalLines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      if (chunk) finalLines.push(chunk);
    }
  }
  return finalLines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// วาดฉากกราฟิก 3D / สถาปัตยกรรม / สินค้า ตามประเภทธุรกิจของเพจ
function drawBusinessShowcaseIllustration(ctx, brandName, theme, x, y, w, h) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 24);
  ctx.clip();

  if (cachedAiBgImage && cachedAiBgBrand === brandName) {
    try {
      // ตัดขอบล่าง 6% ออกอัตโนมัติเพื่อป้องกันลายน้ำมุมล่างขวา 100%
      const srcW = cachedAiBgImage.naturalWidth || cachedAiBgImage.width || w;
      const srcH = Math.floor((cachedAiBgImage.naturalHeight || cachedAiBgImage.height || h) * 0.94);
      ctx.drawImage(cachedAiBgImage, 0, 0, srcW, srcH, x, y, w, h);
      const overlay = ctx.createLinearGradient(x, y, x, y + h);
      overlay.addColorStop(0, "rgba(15, 23, 42, 0.25)");
      overlay.addColorStop(1, "rgba(15, 23, 42, 0.7)");
      ctx.fillStyle = overlay;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      return;
    } catch (e) {
      // fallback to vector scene
    }
  }

  const sceneGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  sceneGrad.addColorStop(0, "#1e293b");
  sceneGrad.addColorStop(0.5, "#0f172a");
  sceneGrad.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = sceneGrad;
  ctx.fillRect(x, y, w, h);

  // แสงไฟ Warm Spotlight ด้านบน
  const glow = ctx.createRadialGradient(x + w * 0.5, y + 30, 10, x + w * 0.5, y + h * 0.5, w * 0.65);
  glow.addColorStop(0, "rgba(251, 191, 36, 0.35)");
  glow.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  if (/(บิ้วอิน|เฟอร์นิเจอร์|ตกแต่ง|คอนโด)/i.test(brandName)) {
    // วาดฉากห้องนั่งเล่น Luxury Built-in (ระแนงไม้ + หินอ่อน + ไฟซ่อน LED)
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#78350f" : "#92400e";
      ctx.fillRect(x + 40 + i * 22, y + 25, 14, h - 50);
    }
    // ผนังหินอ่อนตรงกลาง
    ctx.fillStyle = "#f8fafc";
    drawRoundedRect(ctx, x + 310, y + 30, 340, h - 75, 12);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.stroke();

    // จอทีวีโมเดิร์นบนผนังบิ้วอิน
    ctx.fillStyle = "#090d16";
    drawRoundedRect(ctx, x + 355, y + 60, 250, 115, 8);
    ctx.fill();
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 22px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LUXURY BUILT-IN DESIGN", x + 480, y + 125);

    // ตู้โชว์ไฟ LED ด้านขวา
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    drawRoundedRect(ctx, x + 675, y + 28, 220, h - 56, 10);
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (/(สร้างบ้าน|รีโนเวท|construction|บ้าน)/i.test(brandName)) {
    // วาดบ้านโมเดิร์น 2 ชั้นสุดหรู
    ctx.fillStyle = "#334155";
    ctx.fillRect(x + 180, y + 85, 580, 160);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x + 220, y + 45, 340, 110);
    ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
    ctx.fillRect(x + 250, y + 65, 180, 75);
    ctx.fillRect(x + 460, y + 125, 240, 95);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 220, y + 45, 340, 110);
  } else if (/(แอร์|AIR|ล้าง)/i.test(brandName)) {
    // วาดแอร์ติดผนังพร้อมคลื่นความเย็น
    ctx.fillStyle = "#f8fafc";
    drawRoundedRect(ctx, x + 260, y + 45, 420, 105, 22);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#0284c7";
    ctx.font = "bold 24px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("❄️ COOL & CLEAN AIRFLOW 100%", x + w / 2, y + 205);
  } else {
    // ฉากสตูดิโอพรีเมียมพร้อมป้ายแบรนด์
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    drawRoundedRect(ctx, x + 160, y + 40, w - 320, h - 80, 20);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = theme.accentLight;
    ctx.font = "bold 34px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`✨ ${brandName} ✨`, x + w / 2, y + h / 2 + 12);
  }

  ctx.restore();

  // กรอบเรืองแสงรอบรูป
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, w, h, 24);
  ctx.stroke();
}

let cleanPhotoOnlyMode = false;
let cleanPhotoIndex = 0;

function drawAllMarketingCanvases(data) {
  const theme = GRAPHIC_THEMES[currentGraphicTheme] || GRAPHIC_THEMES.luxury_gold;

  if (cleanPhotoOnlyMode && cachedAiBgImage) {
    ["graphicCanvasFb", "graphicCanvasTiktok", "graphicCanvasLine"].forEach((cid) => {
      const c = document.getElementById(cid);
      if (!c) return;
      const ctx = c.getContext("2d");
      const srcW = cachedAiBgImage.naturalWidth || cachedAiBgImage.width || 1080;
      const srcH = Math.floor((cachedAiBgImage.naturalHeight || cachedAiBgImage.height || 1080) * 0.95);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(cachedAiBgImage, 0, 0, srcW, srcH, 0, 0, c.width, c.height);
    });
    return;
  }

  // ================= 1. FACEBOOK / IG SQUARE AD BANNER (1080x1080) =================
  const fbCanvas = document.getElementById("graphicCanvasFb");
  if (fbCanvas) {
    const ctx = fbCanvas.getContext("2d");
    const W = 1080;
    const H = 1080;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, theme.bgTop);
    bg.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // กรอบทองหรูหรา
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 32);
    ctx.stroke();

    // ป้าย Badge ด้านบน
    ctx.fillStyle = theme.badgeBg;
    drawRoundedRect(ctx, 64, 58, 430, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("🔥 โปรโมชันพิเศษ • ปรึกษาและประเมินฟรี!", 92, 95);

    // ชื่อแบรนด์ขนาดใหญ่
    ctx.fillStyle = theme.accentLight;
    ctx.font = "bold 62px 'Prompt', 'Segoe UI', sans-serif";
    const titleLines = wrapCanvasText(ctx, data.brandName, 940);
    ctx.fillText(titleLines[0] || data.brandName, 64, 185);

    // คำโปรยเป้าหมาย
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "500 30px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(`🎯 การันตีคุณภาพ • ${data.goal}`, 64, 238);

    // ฉากภาพประกอบ 3D / ภาพถ่าย AI ตรงกลาง
    drawBusinessShowcaseIllustration(ctx, data.brandName, theme, 64, 268, 952, 275);

    // กล่องจุดเด่น 3 ข้อ
    const bullets = [data.b1, data.b2, data.b3];
    bullets.forEach((bText, idx) => {
      const by = 572 + idx * 102;
      ctx.fillStyle = theme.cardBg;
      drawRoundedRect(ctx, 64, by, 952, 86, 18);
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = theme.accent;
      ctx.font = "bold 32px 'Prompt', 'Segoe UI', sans-serif";
      ctx.fillText("✅", 90, by + 54);

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 28px 'Prompt', 'Segoe UI', sans-serif";
      const clipped = wrapCanvasText(ctx, bText, 830)[0] || bText;
      ctx.fillText(clipped, 148, by + 54);
    });

    // แถบ Call-to-Action ด้านล่างสุด
    ctx.fillStyle = theme.ctaBg;
    drawRoundedRect(ctx, 64, 898, 952, 122, 24);
    ctx.fill();
    ctx.strokeStyle = theme.accentLight;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(`📞 โทรด่วน: ${data.phone}`, 96, 952);
    ctx.fillStyle = theme.accentLight;
    ctx.font = "bold 28px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(`💬 ทักแชทรับสิทธิ์พิเศษ LINE: ${data.lineLabel}`, 96, 996);
  }

  // ================= 2. TIKTOK / REELS COVER GRAPHIC (1080x1080) =================
  const ttCanvas = document.getElementById("graphicCanvasTiktok");
  if (ttCanvas) {
    const ctx = ttCanvas.getContext("2d");
    const W = 1080;
    const H = 1080;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#090d16");
    bg.addColorStop(0.5, theme.bgTop);
    bg.addColorStop(1, "#090d16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ป้าย Hook สีสดด้านบน
    ctx.fillStyle = "#ef4444";
    drawRoundedRect(ctx, 90, 60, 900, 90, 45);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🚨 หยุดดูคลิปนี้! ถ้ากำลังมองหา...", W / 2, 118);

    // ชื่อแบรนด์ใหญ่กลางภาพ
    ctx.fillStyle = theme.accentLight;
    ctx.font = "bold 66px 'Prompt', 'Segoe UI', sans-serif";
    const tLines = wrapCanvasText(ctx, data.brandName, 920);
    ctx.fillText(tLines[0] || data.brandName, W / 2, 225);

    drawBusinessShowcaseIllustration(ctx, data.brandName, theme, 90, 265, 900, 310);

    // 3 เหตุผลสั้นกระชับ
    ctx.fillStyle = theme.cardBg;
    drawRoundedRect(ctx, 90, 605, 900, 265, 26);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(`⭐ 1. ${wrapCanvasText(ctx, data.b1, 800)[0]}`, 130, 670);
    ctx.fillText(`⭐ 2. ${wrapCanvasText(ctx, data.b2, 800)[0]}`, 130, 740);
    ctx.fillText(`⭐ 3. ${wrapCanvasText(ctx, data.b3, 800)[0]}`, 130, 810);

    // ปุ่มชี้เข้าโปรไฟล์
    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, 90, 905, 900, 110, 55);
    ctx.fill();
    ctx.fillStyle = "#090d16";
    ctx.font = "bold 36px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🎁 ทักแชทรับโปรทันที! โทร ${data.phone}`, W / 2, 972);
  }

  // ================= 3. FLASH DEAL / LINE OA RICH MESSAGE (1080x1080) =================
  const lineCanvas = document.getElementById("graphicCanvasLine");
  if (lineCanvas) {
    const ctx = lineCanvas.getContext("2d");
    const W = 1080;
    const H = 1080;

    const bg = ctx.createRadialGradient(W / 2, H / 3, 50, W / 2, H / 2, 750);
    bg.addColorStop(0, theme.bgTop);
    bg.addColorStop(1, "#090d16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, 42, 42, W - 84, H - 84, 36);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 36px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText("⚡ EXCLUSIVE VIP PROMOTION ⚡", W / 2, 120);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 64px 'Prompt', 'Segoe UI', sans-serif";
    const bLines = wrapCanvasText(ctx, data.brandName, 900);
    ctx.fillText(bLines[0] || data.brandName, W / 2, 205);

    drawBusinessShowcaseIllustration(ctx, data.brandName, theme, 90, 245, 900, 280);

    // กล่องคูปองสิทธิพิเศษ
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    drawRoundedRect(ctx, 90, 555, 900, 300, 28);
    ctx.fill();
    ctx.setLineDash([14, 10]);
    ctx.strokeStyle = theme.accentLight;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = theme.accentLight;
    ctx.font = "bold 42px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText("🎁 สิทธิพิเศษสำหรับลูกค้าที่ทักแชทวันนี้!", W / 2, 625);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 31px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(`• ต่อที่ 1: ${wrapCanvasText(ctx, data.b1, 800)[0]}`, W / 2, 695);
    ctx.fillText(`• ต่อที่ 2: ปรึกษาและประเมินราคาฟรี ไม่มีค่าใช้จ่าย!`, W / 2, 755);
    ctx.fillText(`• ต่อที่ 3: รับส่วนลดโปรโมชันพิเศษประจำเดือนทันที`, W / 2, 815);

    ctx.fillStyle = "#10b981";
    drawRoundedRect(ctx, 90, 890, 900, 118, 28);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(`💬 แอด LINE: ${data.lineLabel} | โทร ${data.phone}`, W / 2, 962);
  }
}

const CLIENT_WATERMARK_FREE_PHOTOS = {
  builtin: [
    "/images/builtin/builtin_tv_wall.jpg",
    "/images/builtin/builtin_walkin_closet.jpg",
    "/images/builtin/builtin_kitchen.jpg"
  ],
  construction: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=90"
  ],
  airwash: [
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=90"
  ],
  bag: [
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=90",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=90"
  ]
};

function getGoogleFlowPromptForBrand(brandName = "") {
  if (/(สร้างบ้าน|รีโนเวท|construction)/i.test(brandName)) {
    return "Ultra-realistic architectural exterior photography of a modern luxury two-story tropical house in Chiang Mai Thailand, warm teak wood and white concrete facade, golden hour sunset lighting, landscaped garden, 8k resolution, photorealistic, no text, no watermark";
  }
  if (/(แอร์|AIR)/i.test(brandName)) {
    return "Bright modern minimalist living room with a sleek white wall-mounted air conditioner, crystal clear refreshing cool atmosphere, sunlight streaming onto a cozy sofa, 8k commercial photography, no text, no watermark";
  }
  if (/(กระเป๋า|Bag)/i.test(brandName)) {
    return "High-end commercial product photography of a luxury designer leather handbag resting on a travertine marble podium, soft warm studio lighting, 8k resolution, no text, no watermark";
  }
  return "Ultra-realistic architectural interior photography of a luxury modern built-in living room in Chiang Mai Thailand, custom walnut wood slat wall, white Carrara marble TV backdrop with warm recessed LED strip lighting, 8k resolution, photorealistic, no text, no watermark";
}

function toggleCleanPhotoOnlyMode() {
  cleanPhotoOnlyMode = !cleanPhotoOnlyMode;
  const campaign = getCurrentCampaign();
  if (!cachedAiBgImage) {
    loadAiPhotoIntoGraphics();
  } else {
    renderAiGraphicStudio(campaign, appState.selectedStepAgentId);
  }
  showToast(
    cleanPhotoOnlyMode
      ? "🧼 เปิดโหมดภาพถ่ายเพียวๆ (ไร้ลายน้ำและไม่ใส่ตัวหนังสือทับภาพ) สำหรับนำไปแต่งใน Canva!"
      : "🎨 เปิดโหมดโปสเตอร์พร้อมกรอบข้อความโฆษณาภาษาไทย!"
  );
}

async function openGoogleFlowStudio(target = "flow") {
  const campaign = getCurrentCampaign();
  const data = getCampaignGraphicData(campaign);
  const promptEl = document.getElementById("googleFlowPromptInput");
  const promptText = (promptEl?.value || getGoogleFlowPromptForBrand(data.brandName)).trim();

  try {
    await navigator.clipboard.writeText(promptText);
    showToast("🎬 คัดลอก Prompt ไร้ลายน้ำเข้า Clipboard แล้ว! พอหน้า Google Flow เปิดขึ้นมา กด Ctrl+V เพื่อเจนภาพ/วิดีโอได้เลย!");
  } catch (e) {
    showToast("🎬 กำลังเปิดหน้า Google Flow...");
  }

  const url =
    target === "imagefx"
      ? "https://labs.google/fx/tools/image-fx"
      : "https://labs.google/fx/tools/flow";
  window.open(url, "_blank");
}

function handleGoogleFlowImageSelected(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const campaign = getCurrentCampaign();
  const data = getCampaignGraphicData(campaign);

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      cachedAiBgImage = img;
      cachedAiBgBrand = data.brandName;
      drawAllMarketingCanvases(data);
      showToast("✨ นำภาพจาก Google Flow (ไร้ลายน้ำ 100%) เข้ามาใส่ในแบนเนอร์ทั้ง 3 ขนาดเรียบร้อย! กด '🎨 แต่งต่อใน Canva' หรือคัดลอกไปโพสต์ได้เลย");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function loadAiPhotoIntoGraphics() {
  const campaign = getCurrentCampaign();
  const data = getCampaignGraphicData(campaign);
  showToast("✨ กำลังโหลดภาพถ่ายสตูดิโอ 8K (ไร้ลายน้ำ 100%) ลงในแบนเนอร์...");

  let cat = "builtin";
  if (/(สร้างบ้าน|รีโนเวท|construction)/i.test(data.brandName)) cat = "construction";
  else if (/(แอร์|AIR)/i.test(data.brandName)) cat = "airwash";
  else if (/(กระเป๋า|Bag)/i.test(data.brandName)) cat = "bag";

  const pool = CLIENT_WATERMARK_FREE_PHOTOS[cat] || CLIENT_WATERMARK_FREE_PHOTOS.builtin;
  cleanPhotoIndex = (cleanPhotoIndex + 1) % pool.length;
  const imgUrl = pool[cleanPhotoIndex];

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    cachedAiBgImage = img;
    cachedAiBgBrand = data.brandName;
    drawAllMarketingCanvases(data);
    showToast("✅ อัปเดตภาพสตูดิโอ 8K (ไร้ลายน้ำ 100%) ลงในแบนเนอร์ทั้ง 3 รูปเรียบร้อย!");
  };
  img.onerror = () => {
    const keys = Object.keys(GRAPHIC_THEMES);
    const nextIdx = (keys.indexOf(currentGraphicTheme) + 1) % keys.length;
    setGraphicTheme(keys[nextIdx]);
  };
  img.src = imgUrl;
}

async function copyGraphicCanvasToClipboard(canvasId, openFbAfter = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("🖼️ คัดลอกรูปภาพกราฟิกเข้า Clipboard แล้ว! กด Ctrl+V วางรูปในช่องโพสต์เพจได้เลย!");
    } else {
      downloadGraphicCanvas(canvasId, "Banner");
    }
  } catch (err) {
    downloadGraphicCanvas(canvasId, "Banner");
  }

  if (openFbAfter) {
    const activeBrand = getActiveBrandProfile() || {};
    const fbUrl = activeBrand.fbUrl || "https://facebook.com";
    window.open(fbUrl, "_blank");
  }
}

function downloadGraphicCanvas(canvasId, suffix = "Graphic") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const activeBrand = getActiveBrandProfile() || {};
  const cleanName = (activeBrand.brandName || "Campaign").replace(/\s+/g, "-");
  const link = document.createElement("a");
  link.download = `${cleanName}-${suffix}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast(`⬇️ ดาวน์โหลดไฟล์รูปภาพ ${cleanName}-${suffix}.png เรียบร้อยแล้ว!`);
}

async function openCanvaWithGraphic(canvasId, type = "facebook") {
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }
    } catch (e) {
      // ignore
    }
  }

  const activeBrand = getActiveBrandProfile() || {};
  const customTemplate = (
    document.getElementById("canvaTemplateUrlInput")?.value ||
    activeBrand.canvaTemplateUrl ||
    ""
  ).trim();

  let targetCanvaUrl = "https://www.canva.com/create/facebook-posts/";
  if (customTemplate && customTemplate.startsWith("http")) {
    targetCanvaUrl = customTemplate;
  } else if (type === "tiktok") {
    targetCanvaUrl = "https://www.canva.com/create/tiktok-videos/";
  } else if (type === "line") {
    targetCanvaUrl = "https://www.canva.com/create/instagram-posts/";
  }

  showToast("🎨 คัดลอกรูปกราฟิกเข้า Clipboard แล้ว! พอหน้า Canva เปิดขึ้นมา กด Ctrl+V วางรูปแต่งต่อได้ทันที!");
  window.open(targetCanvaUrl, "_blank");
}

async function saveBrandCanvaTemplateUrl() {
  const activeBrand = getActiveBrandProfile();
  if (!activeBrand) return;
  const urlVal = (document.getElementById("canvaTemplateUrlInput")?.value || "").trim();
  activeBrand.canvaTemplateUrl = urlVal;

  try {
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", profile: activeBrand })
    });
    const data = await res.json();
    if (data.brandProfiles) {
      appState.brandProfiles = data.brandProfiles;
    }
    showToast("💾 บันทึกลิงก์แม่แบบ Canva ประจำเพจเรียบร้อยแล้ว!");
  } catch (err) {
    showToast("เกิดข้อผิดพลาดในการบันทึกลิงก์ Canva: " + err.message);
  }
}

function exportCanvaBulkCsv() {
  const campaign = getCurrentCampaign();
  const data = getCampaignGraphicData(campaign);

  const rows = [
    ["Day", "Brand", "Headline", "Highlight_1", "Highlight_2", "Highlight_3", "Promo_Offer", "CTA_Contact"],
    [
      "Day 1",
      data.brandName,
      `เปิดตัวจุดเด่น ${data.brandName}`,
      data.b1,
      data.b2,
      data.b3,
      `ปรึกษาและประเมินราคาฟรี • ${data.goal}`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ],
    [
      "Day 2",
      data.brandName,
      `3 เหตุผลที่ลูกค้าเลือก ${data.brandName}`,
      data.b1,
      data.b2,
      data.b3,
      `รับประกันคุณภาพมาตรฐานมืออาชีพ`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ],
    [
      "Day 3",
      data.brandName,
      `รีวิวผลงานจริงจาก ${data.brandName}`,
      data.b2,
      data.b1,
      data.b3,
      `คุมงบได้จริง ไม่บานปลาย`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ],
    [
      "Day 4",
      data.brandName,
      `ทำไมต้องทำกับ ${data.brandName}?`,
      data.b3,
      data.b1,
      data.b2,
      `ดูแลครบวงจรโดยทีมช่างเชี่ยวชาญ`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ],
    [
      "Day 5",
      data.brandName,
      `โปรโมชันพิเศษประจำเดือน!`,
      data.b1,
      data.b2,
      data.b3,
      `จองคิววันนี้ รับส่วนลดพิเศษทันที`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ],
    [
      "Day 6",
      data.brandName,
      `FLASH DEAL เฉพาะสุดสัปดาห์นี้`,
      data.b2,
      data.b3,
      data.b1,
      `รับสิทธิ์ประเมินหน้างานฟรี!`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ],
    [
      "Day 7",
      data.brandName,
      `โค้งสุดท้าย! ปิดรับคิวโปรเดือนนี้`,
      data.b1,
      data.b2,
      data.b3,
      `ทักแชทล็อกคิวด่วนก่อนเต็ม`,
      `โทร ${data.phone} | LINE: ${data.lineLabel}`
    ]
  ];

  const escapeCsv = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
  const csvContent = "\uFEFF" + rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const cleanName = (data.brandName || "Campaign").replace(/\s+/g, "-");
  link.href = URL.createObjectURL(blob);
  link.download = `${cleanName}-Canva-Bulk-Create-7Days.csv`;
  link.click();
  showToast("📊 ดาวน์โหลดไฟล์ CSV สำหรับโยนเข้าเมนู Bulk Create (สร้างจำนวนมาก) ใน Canva เรียบร้อยแล้ว!");
}

function renderDeliverablesWorkspace(campaign) {
  const titleEl = document.getElementById("deliverablesCampaignTitle");
  const metaEl = document.getElementById("deliverablesCampaignMeta");
  const sidebarEl = document.getElementById("deliverablesSidebarTabs");
  const activeHeaderEl = document.getElementById("deliverablesActiveHeader");
  const contentAreaEl = document.getElementById("deliverablesContentArea");

  if (!campaign) {
    titleEl.textContent = "ยังไม่มีแคมเปญที่รันไว้";
    metaEl.textContent = "ไปที่แท็บ 'ศูนย์บัญชาการหลัก' เพื่อสั่งงานแคมเปญแรกของคุณ";
    sidebarEl.innerHTML = "";
    activeHeaderEl.innerHTML = "";
    contentAreaEl.textContent = "ยังไม่มีข้อมูลผลงาน";
    return;
  }

  const ch = campaign.brief?.channels || {};
  titleEl.textContent = `📂 คลังผลงาน: ${campaign.brief?.productName || "แคมเปญการตลาด"}`;
  metaEl.textContent = `เพจที่ผูกไว้: FB (${ch.fbUrl || "-"}) | TikTok (${ch.tiktokUrl || "-"}) | IG (${ch.igUrl || "-"}) | LINE (${ch.lineUrl || "-"})`;

  sidebarEl.innerHTML = (campaign.steps || [])
    .map((s, idx) => {
      const isSelected = s.agentId === appState.selectedStepAgentId;
      const badge = s.status === "completed" ? "✅" : s.status === "working" ? "⏳" : "⚪";
      return `
        <button class="deliverable-tab-btn ${isSelected ? "active" : ""}" onclick="selectAgentStep('${s.agentId}')">
          <span style="font-size:22px;">${s.avatar}</span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:600;">${idx + 1}. ${escapeHtml(s.agentName)}</div>
            <div style="font-size:11px; color:#94a3b8;">${escapeHtml(s.role)}</div>
          </div>
          <span>${badge}</span>
        </button>
      `;
    })
    .join("");

  const activeStep =
    campaign.steps.find((s) => s.agentId === appState.selectedStepAgentId) || campaign.steps[0];

  if (activeStep) {
    activeHeaderEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:24px;">${activeStep.avatar}</span>
        <div>
          <strong style="font-size:15px;">${escapeHtml(activeStep.agentName)}</strong>
          <div style="font-size:12px; color:#94a3b8;">${escapeHtml(activeStep.role)}</div>
        </div>
      </div>
    `;
    contentAreaEl.textContent = activeStep.output || "กำลังรอประมวลผล...";
  }
}

// ตรวจสอบลิงก์เพจที่ผู้ใช้ใส่ในหน้า Command Center
async function handleInspectLinks() {
  const badge = document.getElementById("linkInspectResult");
  badge.classList.remove("hidden");
  badge.textContent = "🔍 กำลังตรวจสอบลิงก์เพจของคุณ...";

  const profile = {
    fbUrl: document.getElementById("inputFbUrl").value.trim(),
    tiktokUrl: document.getElementById("inputTiktokUrl").value.trim(),
    igUrl: document.getElementById("inputIgUrl").value.trim(),
    lineUrl: document.getElementById("inputLineUrl").value.trim(),
    websiteUrl: document.getElementById("inputShopUrl").value.trim()
  };

  try {
    const res = await fetch("/api/brands/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile })
    });
    const data = await res.json();
    const info = data.info || {};
    badge.innerHTML = `✅ <strong>ผูกลิงก์เพจพร้อมใช้งานแล้ว:</strong> 📘 FB: <code>${escapeHtml(info.fbHandle || "-")}</code> | 🎵 TikTok: <code>${escapeHtml(info.tiktokHandle || "-")}</code> | 📸 IG: <code>${escapeHtml(info.igHandle || "-")}</code> | 💬 LINE: <code>${escapeHtml(info.lineHandle || "-")}</code> (ทีม AI จะนำลิงก์เหล่านี้ไปใส่ในแผนงานและท้ายโพสต์ทั้งหมด)`;
  } catch (err) {
    badge.textContent = "⚠️ ตรวจสอบลิงก์ไม่สำเร็จ: " + err.message;
  }
}

// สั่งรันแคมเปญใหม่จาก Single Command Center พร้อมส่งลิงก์เพจ
async function handleRunCampaign(e) {
  e.preventDefault();
  const btn = document.getElementById("btnRunCampaign");
  btn.disabled = true;
  btn.innerHTML = `<span>⚡ กำลังส่งคำสั่งและลิงก์เพจให้หัวหน้าทีม AI (CMO)...</span>`;

  try {
    const platforms = Array.from(
      document.querySelectorAll("#platformCheckboxes input[type='checkbox']:checked")
    ).map((cb) => cb.value);

    const channels = {
      fbUrl: document.getElementById("inputFbUrl").value.trim(),
      tiktokUrl: document.getElementById("inputTiktokUrl").value.trim(),
      igUrl: document.getElementById("inputIgUrl").value.trim(),
      lineUrl: document.getElementById("inputLineUrl").value.trim(),
      shopUrl: document.getElementById("inputShopUrl").value.trim(),
      websiteUrl: document.getElementById("inputShopUrl").value.trim(),
      contactPhone: document.getElementById("inputContactPhone").value.trim()
    };

    const payload = {
      productName: document.getElementById("inputProductName").value.trim(),
      goal: document.getElementById("inputGoal").value.trim(),
      targetAudience: document.getElementById("inputAudience").value.trim(),
      budget: document.getElementById("inputBudget").value.trim(),
      platforms,
      commandText: document.getElementById("inputCommandText").value.trim(),
      channels
    };

    const res = await fetch("/api/campaigns/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.brandProfiles) {
      appState.brandProfiles = data.brandProfiles;
      renderBrandChannelsAndPublishLogs();
    }
    if (data.campaign) {
      upsertCampaign(data.campaign);
      showToast("🚀 เริ่มเดินเครื่องทีม AI ทั้ง 7 แผนกสำหรับเพจของคุณแล้ว!");
    }
  } catch (err) {
    showToast("เกิดข้อผิดพลาด: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>🚀 สั่งทีม AI ทั้ง 7 แผนกเริ่มทำงานให้เพจของเราทันที</span>`;
  }
}

function fillPreset(presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;
  document.getElementById("inputProductName").value = p.productName;
  document.getElementById("inputGoal").value = p.goal;
  document.getElementById("inputAudience").value = p.targetAudience;
  document.getElementById("inputBudget").value = p.budget;
  document.getElementById("inputCommandText").value = p.commandText;

  if (p.fbUrl) document.getElementById("inputFbUrl").value = p.fbUrl;
  if (p.tiktokUrl) document.getElementById("inputTiktokUrl").value = p.tiktokUrl;
  if (p.igUrl) document.getElementById("inputIgUrl").value = p.igUrl;
  if (p.lineUrl) document.getElementById("inputLineUrl").value = p.lineUrl;
  if (p.shopUrl) document.getElementById("inputShopUrl").value = p.shopUrl;
  if (p.contactPhone) document.getElementById("inputContactPhone").value = p.contactPhone;

  document.querySelectorAll("#platformCheckboxes input[type='checkbox']").forEach((cb) => {
    cb.checked = p.platforms.includes(cb.value);
  });

  handleInspectLinks();
  showToast(`✨ เติมโจทย์และลิงก์เพจตัวอย่าง "${p.productName}" เรียบร้อย!`);
}

// ================= BRAND CHANNELS & AUTO-POST HUB =================
let detectedFbPagesList = [];

async function handleAutoDetectFbPage() {
  const token = document.getElementById("brandFbToken").value.trim();
  const banner = document.getElementById("fbConnectStatusBanner");
  if (!token) {
    return showToast("⚠️ กรุณาวางรหัส Facebook Access Token (EAA...) ในช่องก่อนกดปุ่มดึงเพจครับ");
  }
  if (banner) {
    banner.classList.remove("hidden");
    banner.textContent = "🔍 กำลังเชื่อมต่อกับ Facebook Graph API และดึงข้อมูลเพจของคุณ...";
  }
  try {
    const res = await fetch("/api/brands/verify-fb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      if (banner) {
        banner.innerHTML = `⚠️ <strong>เชื่อมต่อไม่สำเร็จ:</strong> ${escapeHtml(data.error || "ไม่สามารถดึง Page ID ได้")}`;
      }
      return showToast("⚠️ " + (data.error || "ไม่สามารถดึง Page ID ได้"));
    }

    if (data.brandProfiles) {
      appState.brandProfiles = data.brandProfiles;
    }

    if (data.pageId) {
      document.getElementById("brandFbPageId").value = data.pageId;
    }
    if (data.pageName) {
      document.getElementById("brandNameInput").value = data.pageName;
    }
    if (data.pageAccessToken) {
      document.getElementById("brandFbToken").value = data.pageAccessToken;
    }
    if (data.pageLink) {
      document.getElementById("brandFbUrl").value = data.pageLink;
    }

    // กรณีผู้ใช้เป็นแอดมินหลายเพจ แสดงตัวเลือกให้เลือกเพจได้
    const pickerRow = document.getElementById("fbPagesPickerRow");
    const selectEl = document.getElementById("fbPageSelectDropdown");
    if (data.allPages && data.allPages.length > 1 && pickerRow && selectEl) {
      detectedFbPagesList = data.allPages;
      pickerRow.classList.remove("hidden");
      selectEl.innerHTML = data.allPages
        .map((p) => `<option value="${escapeHtml(p.id)}">📘 ${escapeHtml(p.name)} (Page ID: ${escapeHtml(p.id)})</option>`)
        .join("");
    }

    if (banner) {
      banner.innerHTML = `✅ <strong>เชื่อมต่อเพจ Facebook สำเร็จแล้ว!</strong> เพจ: <strong>${escapeHtml(data.pageName || "")}</strong> (Page ID: <code>${escapeHtml(data.pageId)}</code>) — บันทึกเข้าสู่ระบบให้อัตโนมัติแล้ว พร้อมกดสั่งโพสต์ขึ้นเพจจริงได้ทันที!`;
    }
    populateCommandChannelLinksFromActiveBrand();
    renderHeaderBadges();
    showToast(`✅ เชื่อมต่อเพจ "${data.pageName || data.pageId}" สำเร็จและบันทึกอัตโนมัติแล้ว!`);
  } catch (err) {
    if (banner) banner.textContent = "⚠️ เกิดข้อผิดพลาด: " + err.message;
    showToast("⚠️ เกิดข้อผิดพลาด: " + err.message);
  }
}

function handleSelectDetectedFbPage(selectedPageId) {
  const found = detectedFbPagesList.find((p) => p.id === selectedPageId);
  if (!found) return;
  document.getElementById("brandFbPageId").value = found.id;
  document.getElementById("brandNameInput").value = found.name;
  document.getElementById("brandFbToken").value = found.access_token;
  document.getElementById("brandFbUrl").value = found.link;
  showToast(`📘 เลือกเพจ "${found.name}" แล้ว กดปุ่มบันทึกด้านล่างเพื่อยืนยันได้เลยครับ`);
}

function renderBrandChannelsAndPublishLogs() {
  const b = getActiveBrandProfile() || {};
  document.getElementById("brandProfileId").value = b.id || "brand_default_1";
  document.getElementById("brandNameInput").value = b.brandName || "";
  document.getElementById("brandPhoneInput").value = b.contactPhone || "";
  document.getElementById("brandFbUrl").value = b.fbUrl || "";
  document.getElementById("brandTiktokUrl").value = b.tiktokUrl || "";
  document.getElementById("brandIgUrl").value = b.igUrl || "";
  document.getElementById("brandLineUrl").value = b.lineUrl || "";
  document.getElementById("brandWebsiteUrl").value = b.websiteUrl || "";
  document.getElementById("brandShopUrl").value = b.shopUrl || "";
  document.getElementById("brandFbPageId").value = b.fbPageId || "";
  document.getElementById("brandFbToken").value = b.fbPageAccessToken || "";
  document.getElementById("brandWebhookUrl").value = b.automationWebhookUrl || "";

  const logContainer = document.getElementById("publishLogsContainer");
  if (!appState.publishLogs || appState.publishLogs.length === 0) {
    logContainer.innerHTML = `<div style="color:#64748b; font-size:13px; padding:12px;">ยังไม่มีประวัติการสั่งโพสต์ลงเพจ กดปุ่ม <strong>"📤 สั่งโพสต์ลงเพจ"</strong> เพื่อทดสอบส่งคอนเทนต์ขึ้นเพจได้ทันที!</div>`;
    return;
  }

  logContainer.innerHTML = appState.publishLogs
    .map((item) => {
      const resLines = (item.results || [])
        .map((r) => `<div>• <strong>${escapeHtml(r.platform)}:</strong> ${escapeHtml(r.message)}</div>`)
        .join("");
      return `
        <div class="line-log-card" style="border-left-color:#6366f1;">
          <div style="display:flex; justify-content:space-between;">
            <strong>📤 โพสต์ไปยังเพจ: ${escapeHtml(item.brandName)} (${(item.platforms || []).join(", ")})</strong>
            <span style="font-size:11px; color:#94a3b8;">${new Date(item.timestamp).toLocaleString("th-TH")}</span>
          </div>
          <div style="color:#a5b4fc; font-size:12px; margin-top:6px;">${resLines}</div>
          <div class="line-log-preview">${escapeHtml(item.contentPreview || "")}</div>
        </div>
      `;
    })
    .join("");
}

async function handleSaveBrandProfile(e) {
  e.preventDefault();
  const profile = {
    id: document.getElementById("brandProfileId").value || "brand_default_1",
    brandName: document.getElementById("brandNameInput").value.trim(),
    contactPhone: document.getElementById("brandPhoneInput").value.trim(),
    fbUrl: document.getElementById("brandFbUrl").value.trim(),
    tiktokUrl: document.getElementById("brandTiktokUrl").value.trim(),
    igUrl: document.getElementById("brandIgUrl").value.trim(),
    lineUrl: document.getElementById("brandLineUrl").value.trim(),
    websiteUrl: document.getElementById("brandWebsiteUrl").value.trim(),
    shopUrl: document.getElementById("brandShopUrl").value.trim(),
    fbPageId: document.getElementById("brandFbPageId").value.trim(),
    fbPageAccessToken: document.getElementById("brandFbToken").value.trim(),
    automationWebhookUrl: document.getElementById("brandWebhookUrl").value.trim()
  };

  const res = await fetch("/api/brands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", profile })
  });
  const data = await res.json();
  if (data.brandProfiles) {
    appState.brandProfiles = data.brandProfiles;
    appState.settings.activeBrandId = data.activeBrandId;
    populateCommandChannelLinksFromActiveBrand();
    renderHeaderBadges();
    renderBrandChannelsAndPublishLogs();
    showToast("💾 บันทึกข้อมูลเพจหลักและลิงก์ช่องทางเรียบร้อยแล้ว!");
  }
}

function openPublishModal() {
  const campaign = getCurrentCampaign();
  const copyStep =
    campaign?.steps?.find((s) => s.agentId === "content_copywriter" && s.output) ||
    campaign?.steps?.find((s) => s.agentId === appState.selectedStepAgentId && s.output);

  const defaultPostText =
    copyStep?.output ||
    `🔥 โปรโมชันพิเศษจาก ${document.getElementById("inputProductName")?.value || "เพจของเรา"}!\n\n✅ การันตีคุณภาพ คุ้มค่าทุกการใช้งาน\n💬 ทักแชทรับสิทธิ์พิเศษวันนี้ที่ LINE: ${document.getElementById("inputLineUrl")?.value || ""}\n📘 Facebook: ${document.getElementById("inputFbUrl")?.value || ""}`;

  document.getElementById("publishContentInput").value = defaultPostText;
  document.getElementById("publishModal").classList.remove("hidden");
}

function closePublishModal() {
  document.getElementById("publishModal").classList.add("hidden");
}

async function handleConfirmSocialPublish(e) {
  e.preventDefault();
  const btn = document.getElementById("btnConfirmPublish");
  btn.disabled = true;
  btn.textContent = "⏳ กำลังส่งโพสต์ไปยังเพจที่เชื่อมไว้...";

  try {
    const platforms = Array.from(
      document.querySelectorAll("#publishModalPlatforms input[type='checkbox']:checked")
    ).map((cb) => cb.value);

    const contentText = document.getElementById("publishContentInput").value.trim();
    const campaign = getCurrentCampaign();

    const res = await fetch("/api/social/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platforms,
        contentText,
        campaignTitle: campaign?.brief?.productName || "แคมเปญการตลาด"
      })
    });
    const data = await res.json();
    if (data.publishLogs) {
      appState.publishLogs = data.publishLogs;
      renderBrandChannelsAndPublishLogs();
    }
    closePublishModal();
    showToast("📤 สั่งโพสต์คอนเทนต์ไปยังเพจที่เลือกเรียบร้อยแล้ว!");
  } catch (err) {
    showToast("⚠️ เกิดข้อผิดพลาดในการโพสต์: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 ยืนยันส่งโพสต์เข้าเพจทันที";
  }
}

// คัดลอกผลงานของ Agent ที่เลือกอยู่
function copyCurrentPreviewOutput() {
  const campaign = getCurrentCampaign();
  if (!campaign) return showToast("ยังไม่มีผลงานให้คัดลอก");
  const step = campaign.steps.find((s) => s.agentId === appState.selectedStepAgentId);
  if (!step || !step.output) return showToast("แผนกนี้ยังไม่มีข้อความผลงาน");

  navigator.clipboard.writeText(step.output);
  showToast(`📋 คัดลอกผลงานของ ${step.agentName} เรียบร้อยแล้ว!`);
}

// ดาวน์โหลดรายงานทั้งหมดของแคมเปญเป็นไฟล์ Markdown (.md)
function exportFullCampaignMarkdown() {
  const campaign = getCurrentCampaign();
  if (!campaign) return showToast("ยังไม่มีแคมเปญให้ดาวน์โหลด");

  const ch = campaign.brief?.channels || {};
  const lines = [
    `# 🚀 รายงานแผนการตลาดออนไลน์ครบวงจร (AI Marketing Agency Report)`,
    `- **แบรนด์ / สินค้า:** ${campaign.brief?.productName}`,
    `- **เป้าหมายแคมเปญ:** ${campaign.brief?.goal}`,
    `- **กลุ่มเป้าหมาย:** ${campaign.brief?.targetAudience}`,
    `- **งบประมาณ:** ${campaign.brief?.budget}`,
    `- **เพจ Facebook:** ${ch.fbUrl || "-"}`,
    `- **ช่อง TikTok:** ${ch.tiktokUrl || "-"}`,
    `- **Instagram:** ${ch.igUrl || "-"}`,
    `- **LINE OA:** ${ch.lineUrl || "-"}`,
    `- **วันที่สร้างรายงาน:** ${new Date(campaign.createdAt).toLocaleString("th-TH")}`,
    `\n---\n`
  ];

  for (const step of campaign.steps || []) {
    lines.push(`## ${step.avatar} ${step.agentName} (${step.role})\n`);
    lines.push(step.output || "_ยังไม่มีข้อมูล_");
    lines.push(`\n---\n`);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AI-Marketing-Report-${(campaign.brief?.productName || "Campaign").replace(/\s+/g, "-")}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📥 ดาวน์โหลดไฟล์รายงานฉบับเต็ม (.md) เรียบร้อยแล้ว!");
}

// สั่งปรับแก้ผลงานเฉพาะ Agent (Refine Modal)
function openRefineModal() {
  const campaign = getCurrentCampaign();
  if (!campaign) return showToast("กรุณาสั่งรันแคมเปญก่อน");
  const step = campaign.steps.find((s) => s.agentId === appState.selectedStepAgentId);
  if (!step) return;

  document.getElementById("refineModalTitle").textContent = `✨ สั่งปรับแก้ผลงาน: ${step.avatar} ${step.agentName}`;
  document.getElementById("refineInstructionInput").value = "";
  document.getElementById("refineModal").classList.remove("hidden");
}

function closeRefineModal() {
  document.getElementById("refineModal").classList.add("hidden");
}

async function handleConfirmRefine(e) {
  e.preventDefault();
  const campaign = getCurrentCampaign();
  if (!campaign) return;

  const instruction = document.getElementById("refineInstructionInput").value.trim();
  const btn = document.getElementById("btnSubmitRefine");
  btn.disabled = true;
  btn.textContent = "⏳ กำลังประมวลผลใหม่...";

  try {
    const res = await fetch("/api/campaigns/rerun-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: campaign.id,
        agentId: appState.selectedStepAgentId,
        customInstruction: instruction
      })
    });
    const data = await res.json();
    if (data.campaign) {
      upsertCampaign(data.campaign);
      showToast("✅ อัปเดตผลงานของแผนกนี้เรียบร้อยแล้ว!");
    }
    closeRefineModal();
  } catch (err) {
    showToast("เกิดข้อผิดพลาด: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 สั่ง Agent ประมวลผลใหม่ทันที";
  }
}

// ================= AGENT STUDIO =================
function renderAgentStudio() {
  const grid = document.getElementById("agentStudioGrid");
  grid.innerHTML = appState.agents
    .map((agent, idx) => {
      const providerBadge =
        agent.preferredProvider && agent.preferredProvider !== "default"
          ? agent.preferredProvider.toUpperCase()
          : "ใช้ค่ายหลัก (Default)";
      return `
        <div class="agent-card">
          <div>
            <div class="agent-card-top">
              <div class="agent-identity">
                <div class="agent-avatar-lg" style="border: 1px solid ${agent.color || "#6366f1"}">${agent.avatar}</div>
                <div>
                  <span style="font-size:11px; color:#818cf8; font-weight:600;">ลำดับที่ ${idx + 1} • ${escapeHtml(agent.department || "")}</span>
                  <h4 style="font-size:15px;">${escapeHtml(agent.name)}</h4>
                  <p style="font-size:12px; color:#94a3b8;">${escapeHtml(agent.role)}</p>
                </div>
              </div>
            </div>
            <p style="font-size:12.5px; margin: 10px 0; color:#cbd5e1;">${escapeHtml(agent.description || "")}</p>
            <div class="agent-prompt-preview">
              <strong>System Prompt:</strong><br/>
              ${escapeHtml(agent.systemPrompt)}
            </div>
          </div>

          <div class="agent-card-footer">
            <span style="font-size:11.5px; color:#94a3b8;">🧠 โมเดล: <strong>${escapeHtml(providerBadge)}</strong></span>
            <div style="display:flex; gap:6px;">
              <button class="btn-secondary btn-sm" onclick="openAgentModal('${agent.id}')">⚙️ แก้ไข Prompt / หน้าที่</button>
              ${
                agent.id.startsWith("custom_")
                  ? `<button class="btn-secondary btn-sm" onclick="deleteCustomAgent('${agent.id}')">🗑️</button>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function openAgentModal(agentId = null) {
  const modal = document.getElementById("agentModal");
  if (agentId) {
    const agent = appState.agents.find((a) => a.id === agentId);
    if (!agent) return;
    document.getElementById("agentModalTitle").textContent = `⚙️ แก้ไขหน้าที่และคำสั่งของ ${agent.name}`;
    document.getElementById("editAgentId").value = agent.id;
    document.getElementById("editAgentName").value = agent.name;
    document.getElementById("editAgentAvatar").value = agent.avatar || "🤖";
    document.getElementById("editAgentColor").value = agent.color || "#6366f1";
    document.getElementById("editAgentRole").value = agent.role || "";
    document.getElementById("editAgentDept").value = agent.department || "";
    document.getElementById("editAgentProvider").value = agent.preferredProvider || "default";
    document.getElementById("editAgentTemp").value = agent.temperature ?? 0.7;
    document.getElementById("editAgentDesc").value = agent.description || "";
    document.getElementById("editAgentPrompt").value = agent.systemPrompt || "";
  } else {
    document.getElementById("agentModalTitle").textContent = "➕ สร้าง Agent ตำแหน่งใหม่เข้าทีมการตลาด";
    document.getElementById("editAgentId").value = "";
    document.getElementById("editAgentName").value = "";
    document.getElementById("editAgentAvatar").value = "🎯";
    document.getElementById("editAgentColor").value = "#ec4899";
    document.getElementById("editAgentRole").value = "";
    document.getElementById("editAgentDept").value = "Specialized Marketing";
    document.getElementById("editAgentProvider").value = "default";
    document.getElementById("editAgentTemp").value = 0.7;
    document.getElementById("editAgentDesc").value = "";
    document.getElementById("editAgentPrompt").value =
      "คุณคือผู้เชี่ยวชาญเฉพาะทางในทีมการตลาดออนไลน์ อ้างอิงจากโจทย์แคมเปญและข้อมูลของทีมก่อนหน้า ให้วิเคราะห์และสรุปแผนปฏิบัติการเป็นภาษาไทยในรูปแบบ Markdown";
  }
  modal.classList.remove("hidden");
}

function closeAgentModal() {
  document.getElementById("agentModal").classList.add("hidden");
}

async function handleSaveAgentModal(e) {
  e.preventDefault();
  const id = document.getElementById("editAgentId").value;
  const agentData = {
    id: id || undefined,
    name: document.getElementById("editAgentName").value.trim(),
    avatar: document.getElementById("editAgentAvatar").value.trim() || "🤖",
    color: document.getElementById("editAgentColor").value,
    role: document.getElementById("editAgentRole").value.trim(),
    department: document.getElementById("editAgentDept").value.trim(),
    preferredProvider: document.getElementById("editAgentProvider").value,
    temperature: Number(document.getElementById("editAgentTemp").value) || 0.7,
    description: document.getElementById("editAgentDesc").value.trim(),
    systemPrompt: document.getElementById("editAgentPrompt").value.trim()
  };

  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: id ? "update" : "create",
      agent: agentData
    })
  });
  const data = await res.json();
  if (data.agents) {
    appState.agents = data.agents;
    renderAgentStudio();
    renderPipelineVisualizer(getCurrentCampaign());
    closeAgentModal();
    showToast("💾 บันทึกข้อมูล Agent เรียบร้อยแล้ว!");
  }
}

async function deleteCustomAgent(agentId) {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", agentId })
  });
  const data = await res.json();
  if (data.agents) {
    appState.agents = data.agents;
    renderAgentStudio();
    showToast("🗑️ ลบ Agent เรียบร้อยแล้ว");
  }
}

async function resetDefaultAgents() {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset" })
  });
  const data = await res.json();
  if (data.agents) {
    appState.agents = data.agents;
    renderAgentStudio();
    showToast("🔄 คืนค่าเริ่มต้นของทีม AI ทั้ง 7 แผนกเรียบร้อยแล้ว");
  }
}

// ================= LINE REPORTING =================
async function handleVerifyLineToken() {
  const token = document.getElementById("lineChannelToken").value.trim();
  const badge = document.getElementById("lineVerifyBadge");
  if (!token) {
    return showToast("⚠️ กรุณาวางรหัส Channel Access Token ในช่องก่อนกดตรวจสอบครับ");
  }
  badge.classList.remove("hidden");
  badge.textContent = "🔍 กำลังตรวจสอบ Token กับ LINE Server...";
  try {
    const res = await fetch("/api/line/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelAccessToken: token })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      badge.innerHTML = `⚠️ <strong>ตรวจสอบไม่ผ่าน:</strong> ${escapeHtml(data.error || "Token ไม่ถูกต้อง")}`;
      return;
    }
    badge.innerHTML = `✅ <strong>เชื่อมต่อ LINE OA สำเร็จ!</strong> ชื่อบอท: <strong>${escapeHtml(data.displayName)}</strong> (${escapeHtml(data.basicId || "")}) — กดปุ่มบันทึกและทดสอบส่งข้อความได้เลย!`;
    showToast(`✅ เชื่อมต่อกับ LINE "${data.displayName}" สำเร็จ!`);
  } catch (err) {
    badge.textContent = "⚠️ เกิดข้อผิดพลาด: " + err.message;
  }
}

function renderLineSettingsAndLogs() {
  const line = appState.settings.line || {};
  const notifyStart = line.notifyOnStart !== false;
  const notifyStep = line.notifyOnEachStep !== false;
  const notifyDone = line.autoSendOnComplete !== false;

  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = val;
  };
  setCheck("lineNotifyOnStart", notifyStart);
  setCheck("lineNotifyOnStep", notifyStep);
  setCheck("lineAutoSend", notifyDone);

  setCheck("quickLineStart", notifyStart);
  setCheck("quickLineStep", notifyStep);
  setCheck("quickLineDone", notifyDone);

  document.getElementById("lineChannelToken").value = line.channelAccessToken || "";
  document.getElementById("lineSendMode").value = line.sendMode || "broadcast";
  document.getElementById("lineTargetId").value = line.targetId || "";

  const container = document.getElementById("lineLogsContainer");
  if (!appState.lineLogs || appState.lineLogs.length === 0) {
    container.innerHTML = `<div style="color:#64748b; font-size:13px; padding:12px;">ยังไม่มีประวัติการส่งรายงานเข้า LINE</div>`;
    return;
  }

  container.innerHTML = appState.lineLogs
    .map(
      (log) => `
      <div class="line-log-card">
        <div style="display:flex; justify-content:space-between;">
          <strong>📲 ${escapeHtml(log.campaignTitle || "รายงาน LINE")}</strong>
          <span style="font-size:11px; color:#94a3b8;">${new Date(log.timestamp).toLocaleString("th-TH")}</span>
        </div>
        <div style="color:#4ade80; font-size:12px; margin-top:4px;">สถานะ: ${escapeHtml(log.details)}</div>
        <div class="line-log-preview">${escapeHtml(log.preview || "")}</div>
      </div>
    `
    )
    .join("");
}

async function handleQuickToggleLineTrack() {
  const lineConfig = {
    ...(appState.settings.line || {}),
    enabled: true,
    notifyOnStart: document.getElementById("quickLineStart")?.checked !== false,
    notifyOnEachStep: document.getElementById("quickLineStep")?.checked !== false,
    autoSendOnComplete: document.getElementById("quickLineDone")?.checked !== false
  };
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ line: lineConfig })
  });
  const data = await res.json();
  if (data.settings) {
    appState.settings = data.settings;
    renderLineSettingsAndLogs();
    showToast("📲 อัปเดตการตั้งค่าแจ้งเตือนความคืบหน้า LINE OA แล้ว");
  }
}

async function handleSaveLineSettings(e) {
  e.preventDefault();
  const lineConfig = {
    enabled: true,
    notifyOnStart: document.getElementById("lineNotifyOnStart")?.checked !== false,
    notifyOnEachStep: document.getElementById("lineNotifyOnStep")?.checked !== false,
    autoSendOnComplete: document.getElementById("lineAutoSend").checked,
    channelAccessToken: document.getElementById("lineChannelToken").value.trim(),
    sendMode: document.getElementById("lineSendMode").value,
    targetId: document.getElementById("lineTargetId").value.trim()
  };

  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ line: lineConfig })
  });
  const data = await res.json();
  if (data.settings) {
    appState.settings = data.settings;
    renderHeaderBadges();
    renderLineSettingsAndLogs();
    showToast("💾 บันทึกการตั้งค่าติดตามงานผ่าน LINE OA เรียบร้อยแล้ว!");
  }
}

async function triggerSendLiveStatusToLine() {
  const campaign = getCurrentCampaign();
  if (!campaign) return showToast("กรุณาสั่งรันแคมเปญก่อนส่งเช็กสถานะเข้า LINE");

  try {
    const res = await fetch("/api/line/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaign.id, mode: "status_check" })
    });
    const data = await res.json();
    if (data.lineLogs) {
      appState.lineLogs = data.lineLogs;
      renderLineSettingsAndLogs();
    }
    showToast(`📡 ส่งอัปเดตสถานะความคืบหน้าปัจจุบันเข้า LINE OA แล้ว!`);
  } catch (err) {
    showToast("⚠️ เกิดข้อผิดพลาดในการส่ง LINE: " + err.message);
  }
}

async function handleTestLineSend() {
  const lineConfig = {
    enabled: true,
    autoSendOnComplete: document.getElementById("lineAutoSend").checked,
    channelAccessToken: document.getElementById("lineChannelToken").value.trim(),
    sendMode: document.getElementById("lineSendMode").value,
    targetId: document.getElementById("lineTargetId").value.trim()
  };

  try {
    const res = await fetch("/api/line/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineConfig })
    });
    const data = await res.json();
    if (data.lineLogs) {
      appState.lineLogs = data.lineLogs;
      renderLineSettingsAndLogs();
    }
    showToast(`📲 ${data.result?.message || "ส่งรายงานเรียบร้อย"}`);
  } catch (err) {
    showToast("⚠️ ส่ง LINE ไม่สำเร็จ: " + err.message);
  }
}

async function triggerSendCurrentCampaignToLine() {
  const campaign = getCurrentCampaign();
  if (!campaign) return showToast("กรุณาสั่งรันแคมเปญก่อนส่งรายงานเข้า LINE");

  try {
    const res = await fetch("/api/line/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: campaign.id })
    });
    const data = await res.json();
    if (data.lineLogs) {
      appState.lineLogs = data.lineLogs;
      renderLineSettingsAndLogs();
    }
    showToast(`📲 ${data.result?.message || "สร้างรายงานสรุปเข้า LINE สำเร็จ!"}`);
  } catch (err) {
    showToast("⚠️ เกิดข้อผิดพลาดในการส่ง LINE: " + err.message);
  }
}

// ================= MULTI-LLM SETTINGS =================
function renderLLMSettings() {
  const s = appState.settings || {};
  document.getElementById("settingActiveProvider").value = s.activeProvider || "simulation";
  document.getElementById("keyGemini").value = s.apiKeys?.gemini || "";
  document.getElementById("keyOpenAI").value = s.apiKeys?.openai || "";
  document.getElementById("keyClaude").value = s.apiKeys?.claude || "";
  document.getElementById("modelGemini").value = s.models?.gemini || "gemini-2.5-flash";
  document.getElementById("modelOpenAI").value = s.models?.openai || "gpt-4o-mini";
  document.getElementById("modelClaude").value = s.models?.claude || "claude-3-7-sonnet-latest";
}

async function handleSaveLLMSettings(e) {
  e.preventDefault();
  const payload = {
    activeProvider: document.getElementById("settingActiveProvider").value,
    apiKeys: {
      gemini: document.getElementById("keyGemini").value.trim(),
      openai: document.getElementById("keyOpenAI").value.trim(),
      claude: document.getElementById("keyClaude").value.trim()
    },
    models: {
      gemini: document.getElementById("modelGemini").value.trim() || "gemini-2.5-flash",
      openai: document.getElementById("modelOpenAI").value.trim() || "gpt-4o-mini",
      claude: document.getElementById("modelClaude").value.trim() || "claude-3-7-sonnet-latest"
    }
  };

  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.settings) {
    appState.settings = data.settings;
    renderHeaderBadges();
    showToast("💾 บันทึกการตั้งค่าค่าย AI & API Keys เรียบร้อยแล้ว!");
  }
}

// Navigation
function switchMainTab(tabName) {
  document.querySelectorAll(".tab-panel").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((el) => el.classList.remove("active"));

  const targetSection = document.getElementById(`tab-${tabName}`);
  if (targetSection) targetSection.classList.add("active");

  const navBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (navBtn) navBtn.classList.add("active");
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


async function handleTestMakeWebhook() {
  const urlInput = document.getElementById("brandWebhookUrl");
  const banner = document.getElementById("makeWebhookStatusBanner");
  const webhookUrl = (urlInput?.value || "").trim();
  if (!webhookUrl) {
    showToast("⚠️ กรุณาวางลิงก์ Webhook URL จาก Make.com ก่อนครับ");
    if (urlInput) urlInput.focus();
    return;
  }

  if (banner) {
    banner.classList.remove("hidden");
    banner.textContent = "⏳ กำลังบันทึกลิงก์และส่งข้อมูลตัวอย่างไปที่ Make.com...";
  }

  try {
    const res = await fetch("/api/social/test-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl,
        brandId: appState.settings.activeBrandId,
        applyToAll: true
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "ไม่สามารถส่งข้อมูลไปที่ Make.com ได้");
    }
    if (data.brandProfiles) {
      appState.brandProfiles = data.brandProfiles;
    }
    if (banner) {
      banner.innerHTML = `✅ <strong>เชื่อมต่อ Make.com สำเร็จ!</strong> ยิงข้อมูลตัวอย่าง (` + "<code>message</code>, <code>brandName</code>, <code>fbPageId</code>" + `) เข้า Make.com และบันทึกให้ทุกโปรเจกต์เรียบร้อยแล้ว`;
    }
    showToast(data.message || "✅ เชื่อมต่อ Make.com สำเร็จ!");
  } catch (err) {
    if (banner) {
      banner.textContent = "❌ เกิดข้อผิดพลาด: " + err.message;
    }
    showToast("❌ " + err.message);
  }
}


const CLIENT_AGENT_TOOLS = {
  cmo_orchestrator: "🧭 Autopilot + Make.com",
  market_researcher: "🔎 Meta Ad Library + Trends",
  seo_specialist: "📈 Google SEO & Maps",
  ad_strategist: "🎯 Meta Ads Manager",
  content_copywriter: "✍️ Viral Copy Engine",
  creative_director: "🎬 Google Flow + Canva (ไร้ลายน้ำ)",
  social_scheduler: "📤 LINE Approval + Make.com"
};

function getAgentConnectedToolBadge(agentId) {
  return CLIENT_AGENT_TOOLS[agentId] || "🔗 AI Connected";
}

function renderApprovalGateBox(campaign) {
  const box = document.getElementById("lineApprovalGateBox");
  if (!box) return;
  if (!campaign || (campaign.status !== "awaiting_approval" && !campaign.visualAssets)) {
    box.classList.add("hidden");
    return;
  }

  const isWaiting = campaign.status === "awaiting_approval";
  const imgUrl = campaign.visualAssets?.fbBannerImageUrl || "";
  const canvaUrl = campaign.visualAssets?.canva?.fbTemplateUrl || "https://www.canva.com/";

  box.classList.remove("hidden");
  box.innerHTML = `
    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
      ${imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="AI Poster" style="width:110px; height:64px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.2);" />` : ""}
      <div style="flex:1; min-width:200px;">
        <div style="font-weight:700; font-size:13px; color:#6ee7b7;">
          ${isWaiting ? "📲 ส่งการ์ดรูปโปสเตอร์ + แคปชันให้คุณตรวจใน LINE OA แล้ว!" : "🎨 รูปโปสเตอร์ AI + Canva ประจำแคมเปญพร้อมใช้งาน"}
        </div>
        <div style="font-size:11.5px; color:#e2e8f0; margin-top:2px;">
          ${isWaiting ? "กดปุ่มยืนยันในแชท LINE หรือกดปุ่มสีเขียวด้านล่างเพื่อปล่อยโพสต์ลง FB / IG / TikTok (Make.com) และ LINE OA ทันที" : "อนุมัติและส่งโพสต์ไปยังแพลตฟอร์มที่เชื่อมไว้เรียบร้อยแล้ว"}
        </div>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${isWaiting ? `
          <button type="button" class="btn-primary btn-sm" style="background:#10b981; border:none; font-weight:700;" onclick="handleApproveCampaignNow('${escapeHtml(campaign.id)}')">
            ✅ ยืนยันงาน & โพสต์ลงทุกเพจเดี๋ยวนี้
          </button>
        ` : ""}
        <a href="${escapeHtml(canvaUrl)}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; border-color:#00c4cc; color:#67e8f9;">
          🎨 เปิดแต่งใน Canva
        </a>
        <button type="button" class="btn-line btn-sm" onclick="handleResendLineApprovalCard('${escapeHtml(campaign.id)}')">
          📲 ส่งการ์ดเข้า LINE อีกครั้ง
        </button>
        <button type="button" class="btn-secondary btn-sm" onclick="jumpToGraphicStudio()">
          🖼️ ดูรูปทั้ง 3 ขนาด
        </button>
      </div>
    </div>
  `;
}

async function handleTriggerAutopilot(requireLineApproval = true) {
  const activeBrand = getActiveBrandProfile() || {};
  const btnApprove = document.getElementById("btnRunAutopilotApprove");
  const btnDirect = document.getElementById("btnRunAutopilotDirect");
  if (btnApprove) btnApprove.disabled = true;
  if (btnDirect) btnDirect.disabled = true;

  showToast(
    requireLineApproval
      ? `🤖 AI Autopilot กำลังคิดแคมเปญให้ "${activeBrand.brandName || "เพจ"}" + ออกแบบ Canva/AI + ส่งเข้า LINE ให้คุณกดยืนยัน...`
      : `⚡ AI Autopilot กำลังคิดแคมเปญ + ออกแบบรูป + เตรียมโพสต์ลงทุกเพจอัตโนมัติ...`
  );

  try {
    const res = await fetch("/api/campaigns/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: appState.settings.activeBrandId,
        requireLineApproval
      })
    });
    const data = await res.json();
    if (data.campaign) {
      appState.currentCampaignId = data.campaign.id;
      upsertCampaign(data.campaign);
      populateCommandChannelLinksFromActiveBrand();
    }
  } catch (err) {
    showToast("❌ เกิดข้อผิดพลาด: " + err.message);
  } finally {
    if (btnApprove) btnApprove.disabled = false;
    if (btnDirect) btnDirect.disabled = false;
  }
}

async function handleApproveCampaignNow(campaignId) {
  const targetId = campaignId || appState.currentCampaignId;
  showToast("✅ ยืนยันอนุมัติงานแล้ว! กำลังปล่อยโพสต์ลง Facebook, IG, TikTok (Make.com) และ LINE OA...");
  try {
    const res = await fetch("/api/campaigns/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: targetId })
    });
    const data = await res.json();
    if (data.campaign) {
      upsertCampaign(data.campaign);
    }
  } catch (err) {
    showToast("❌ เกิดข้อผิดพลาดในการอนุมัติโพสต์: " + err.message);
  }
}


const BUILTIN_SCENES = {
  tv_wall: {
    name: "📺 ผนังทีวีบิ้วอิน + ตู้โชว์กระจกซ่อนไฟ LED สูงชนฝ้า",
    img: "/images/builtin/builtin_tv_wall.jpg",
    headline: "งานบิ้วอินผนังทีวี Luxury Modern • ตู้โชว์ซ่อนไฟ LED สูงชนฝ้า",
    sub: "ระแนงไม้วอลนัทสลับหินอ่อนขาว สั่งทำพอดีผนังทุกองศา ไม่ทิ้งช่องว่าง",
    b1: "ระแนงไม้แท้สลับหินอ่อนขาว ผนังทีวีแขวนลอยซ่อนสายไฟ 100%",
    b2: "ตู้โชว์กระจกชาทองกรอบอลูมิเนียม พร้อมไฟเส้น Warm LED ทุกชั้น",
    b3: "ฟิตอินพอดีขนาดห้องเป๊ะๆ วัดพื้นที่และประเมินราคาฟรี!",
    prompt: "Floor-to-ceiling custom fitted walnut wood slat TV wall unit, white marble feature center slab, floating media console, and glass-door display cabinets with warm recessed interior LED strip shelf lighting, luxury Thai modern living room, 8k architectural photography, no text, no watermark"
  },
  walkin_closet: {
    name: "👗 ตู้เสื้อผ้าบิ้วอิน / Walk-in Closet หน้าบานกระจกชาทอง",
    img: "/images/builtin/builtin_walkin_closet.jpg",
    headline: "บิ้วอินตู้เสื้อผ้า Walk-in Closet • บานกระจกชาทองกรอบอลูมิเนียม",
    sub: "ฟังก์ชันจัดเต็ม ช่องเก็บของฟิตอินสั่งทำ พร้อมโต๊ะเครื่องแป้งบิ้วอินในตัว",
    b1: "ตู้เสื้อผ้าสูงชนฝ้าเต็มผนัง บานกระจกชาทองกรอบทอง Slim Profile",
    b2: "ไฟ Warm LED ส่องสว่างอัตโนมัติในตู้ แยกช่องกระเป๋าและเครื่องประดับ",
    b3: "โต๊ะเครื่องแป้งบิ้วอินเชื่อมต่อกระจกโค้งซ่อนไฟ สวยหรูตรงปก",
    prompt: "Bespoke floor-to-ceiling fitted wardrobe cabinetry with tinted bronze glass doors, slim gold aluminum frames, warm internal LED shelving lights, and an integrated built-in floating dressing table with an arched backlit vanity mirror, 8k luxury bedroom, no text, no watermark"
  },
  kitchen: {
    name: "🍳 เคาน์เตอร์ครัวบิ้วอิน-ฟิตอินสั่งทำ สูงชนฝ้า ท็อปหินควอตซ์",
    img: "/images/builtin/builtin_kitchen.jpg",
    headline: "ชุดครัวบิ้วอิน-ฟิตอินสั่งทำ • ตู้ลอยสูงชนฝ้า ท็อปหินควอตซ์แท้",
    sub: "ใช้วัสดุ HMR กันชื้นเกรดพรีเมียม ซ่อนไฟ LED ใต้ตู้ ทนทานใช้งานได้จริง",
    b1: "ตู้ครัวฟิตอินเต็มพื้นที่ชนฝ้า ไร้ซอกฝุ่นจับ เช็ดล้างทำความสะอาดง่าย",
    b2: "ท็อปหินควอตซ์กันรอย ทนกรด ทนด่าง ซ่อนไฟ LED ใต้ตู้ทำอาหาร",
    b3: "โครงสร้าง HMR เกรดกันชื้นพิเศษ มาตรฐานงานช่างเชียงใหม่ ประเมินฟรี!",
    prompt: "Seamless floor-to-ceiling fitted kitchen cabinetry combining matte cream upper cabinets, rich warm wood veneer lower cabinets, white quartz countertop, and warm concealed under-cabinet LED strip lighting, 8k custom carpentry, no text, no watermark"
  }
};

let currentBuiltinSceneKey = "tv_wall";

function setBuiltinScene(sceneKey) {
  const scene = BUILTIN_SCENES[sceneKey];
  if (!scene) return;
  currentBuiltinSceneKey = sceneKey;

  const campaign = getCurrentCampaign();
  const data = getCampaignGraphicData(campaign);
  data.b1 = scene.b1;
  data.b2 = scene.b2;
  data.b3 = scene.b3;

  const promptInput = document.getElementById("googleFlowPromptInput");
  if (promptInput) promptInput.value = scene.prompt;

  showToast(`🪵 เลือกงานบิ้วอิน: ${scene.name} (ภาพตรงกับงานจริง 100% ไร้ลายน้ำ)`);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    cachedAiBgImage = img;
    cachedAiBgBrand = data.brandName;
    drawAllMarketingCanvases(data);
  };
  img.src = scene.img;
}


async function handleResendLineApprovalCard(campaignId) {
  const targetId = campaignId || appState.currentCampaignId;
  showToast("📲 กำลังส่งการ์ดตรวจงานและปุ่มยืนยันเข้า LINE OA ของคุณ...");
  try {
    const res = await fetch("/api/campaigns/resend-line-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: targetId })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "ส่งเข้า LINE ไม่สำเร็จ");
    showToast(data.message || "✅ ส่งการ์ดตรวจงานเข้า LINE OA เรียบร้อยแล้ว!");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

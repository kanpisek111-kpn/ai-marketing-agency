# 🤖 AI Marketing Agency — Command Center & Multi-Page Auto-Publisher

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kanpisek111-kpn/ai-marketing-agency)

ระบบทีม AI การตลาดออนไลน์ครบวงจร (7 แผนกอัจฉริยะ) พร้อมระบบแยกโปรเจกต์ดูแลหลายเพจ (Multi-Project Workspace), ระบบสั่งโพสต์อัตโนมัติ (Facebook / TikTok / Instagram / LINE OA) และระบบแจ้งเตือนติดตามสถานะผ่าน **LINE Official Account (LINE OA)**

---

## ✨ ฟีเจอร์หลัก (Key Features)

1. **7 AI Marketing Agents ทำงานต่อกันอัตโนมัติ (Sequential Pipeline)**
   - 👑 **Aria** — AI CMO & Orchestrator (วางแผนกลยุทธ์หลัก)
   - 🔍 **Marcus** — Market & Competitor Researcher (วิเคราะห์กลุ่มลูกค้า & คู่แข่ง)
   - 📈 **Sophia** — SEO & Keyword Specialist (คีย์เวิร์ดทำเงิน & Social SEO)
   - 🚀 **Victor** — Ad Campaign & Funnel Strategist (วางแผนยิงแอด Full-Funnel)
   - ✍️ **Chloe** — Content Creator & Copywriter (เขียนแคปชันป้ายยา & สคริปต์คลิปสั้น)
   - 🎨 **Leo** — Creative & Media Prompt Generator (ออกแบบ AI Image/Video Prompts)
   - 📲 **Namo** — Social Scheduler & LINE Reporter (จัดตารางโพสต์ 7 วัน & รายงานผลเข้า LINE OA)

2. **Multi-Project Workspace (ดูแลหลายเพจในที่เดียว)**
   - สลับโปรเจกต์เพจด้านบนได้ทันที พร้อมจำค่าลิงก์เพจและ Token แยกแต่ละเพจ

3. **Real-Time 4-Platform Posting Status & LINE OA Tracker**
   - ติดตามสถานะว่าโพสต์ลง **Facebook / TikTok / Instagram / LINE OA** ไปหรือยัง พร้อมส่งแจ้งเตือนเข้า LINE OA ทันที

---

## 🚀 วิธีติดตั้งและใช้งานบนเครื่องอื่น (Quick Start)

ต้องมี [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป) ติดตั้งในเครื่อง

```bash
# 1. โคลนโปรเจกต์จาก GitHub
git clone <YOUR_GITHUB_REPO_URL>
cd ai-marketing-agency

# 2. รันเซิร์ฟเวอร์ทันที (ไม่ต้องลงแพ็กเกจเพิ่ม ใช้ Pure Node.js)
node server.js
```

หรือบน Windows สามารถดับเบิลคลิกไฟล์ **`start-agency.bat`** เพื่อเปิดโปรแกรมได้เลย
จากนั้นเปิดเบราว์เซอร์ไปที่: **`http://localhost:3080`**

---

## ☁️ วิธีนำไปรันบน Cloud (Render / Railway) เพื่อเปิดใช้ผ่านมือถือได้ทุกที่

1. สมัครและเข้าเว็บ [Render.com](https://render.com/) หรือ [Railway.app](https://railway.app/)
2. เลือก **New Web Service** -> เชื่อมต่อกับ Repository นี้บน GitHub
3. ตั้งค่า:
   - **Build Command:** *(เว้นว่าง หรือใส่ `echo "ready"`)*
   - **Start Command:** `node server.js`
4. กด **Deploy** จะได้ลิงก์ `https://....onrender.com` สามารถเปิดสั่งงานทีม AI จากมือถือหรือคอมเครื่องไหนก็ได้ทันที!

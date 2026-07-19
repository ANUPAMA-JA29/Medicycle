# 💊 MediCycle AI — Smart Medicine Expiry & Donation System

<div align="center">

![MediCycle Banner](https://img.shields.io/badge/MediCycle-AI%20Powered-2e7d32?style=for-the-badge&logo=leaf&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Redefining Medicine Disposal & Donation through AI-powered insights**

[Live Demo](#) · [Features](#-features) · [Getting Started](#-getting-started) · [Architecture](#-architecture)

</div>

---

## 📖 Overview

**MediCycle AI** is a full-stack web application that bridges the gap between medicine waste and healthcare access. It allows individual donors to track their medicine inventory, get smart expiry warnings, and safely donate unused medicines to verified NGOs — all powered by an intelligent automation engine and an AI chatbot assistant.

> Built as part of the **IBM SkillsBuild** project initiative.

---

## ✨ Features

### 👤 For Donors
| Feature | Description |
|---|---|
| 📦 **Medicine Inventory** | Add, edit, and delete medicines with full details (name, category, quantity, expiry date, manufacturer, image) |
| 🎨 **Dynamic Expiry Badges** | Color-coded warnings: 🔴 Expired · 🟠 < 30 days · 🟡 < 90 days · 🟢 Safe |
| 💊 **Mark for Donation** | One-click to list any medicine in the donation pool for NGOs to browse |
| 📊 **Smart Dashboard** | Charts and stats showing inventory health, expiry timelines, and donation activity |
| 🔔 **Automated Alerts** | Email notifications for expiring medicines, donation requests, and completions |
| 👤 **Profile Management** | Edit personal info and change password securely |

### 🏥 For NGOs
| Feature | Description |
|---|---|
| 🏢 **NGO Portal** | Dedicated dashboard separate from individual donor accounts |
| 🔍 **Browse Donations** | View all available medicines with full details and donor info |
| 📬 **Request Medicines** | One-click request to initiate a donation pickup workflow |
| 📋 **My Requests** | Track all active requests with donor contact details for pickup coordination |
| ✅ **Accepted Donations** | Full audit history of all successfully received medicine packages |

### 🤖 MediBot AI Assistant
| Feature | Description |
|---|---|
| 💬 **Floating Chat Widget** | Always-available chat bubble on every page |
| 🧠 **Context-Aware** | Personalized responses using the user's live inventory data |
| 🔄 **Hybrid Intelligence** | Tries Gemini API first; falls back to smart rule-based engine (works 100% offline) |
| ⚡ **Quick Suggestions** | Tap-to-ask chips for common questions |
| 📚 **15+ Topic Coverage** | Covers all platform features, workflows, and safe disposal guidance |

### ⚙️ Automation Workflows
- **Expiry Check** — Triggered on login; auto-flags medicines expiring within 30 and 90 days
- **Medicine Added** — Workflow event fired when a new medicine is registered
- **Donation Marked** — Notifies the system when a medicine enters the donation pool
- **Donation Requested** — Alerts when an NGO requests a donation
- **Donation Completed** — Final confirmation when pickup is confirmed

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Charts** | Chart.js + react-chartjs-2 |
| **Database** | Firebase Firestore |
| **Email Automation** | EmailJS Browser |
| **AI Chatbot** | Google Gemini API (with rule-based fallback) |
| **Build Tool** | Vite with HMR |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Google AI Studio API key (optional — chatbot works without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/ANUPAMA-JA29/Medicycle.git
cd Medicycle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see below)

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** The Gemini API key is optional. MediBot works with a smart rule-based engine even without it. Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey).

Firebase configuration is stored in `src/services/firebase.js`.

### Demo Credentials

Try the app instantly without registering:

| Role | Email | Password |
|---|---|---|
| 👤 Donor | `jane@example.com` | `Password123` |
| 🏥 NGO | `hope@ngo.org` | `Password123` |

---

## 📁 Project Structure

```
Medicycle/
├── src/
│   ├── components/
│   │   ├── ChatBot.jsx          # 🤖 AI Chatbot (Gemini + rule-based)
│   │   ├── Dashboard.jsx        # 📊 Donor analytics dashboard
│   │   ├── DonationPage.jsx     # 💚 NGO donation browsing page
│   │   ├── MedicineForm.jsx     # ➕ Add/Edit medicine form
│   │   ├── MedicineList.jsx     # 📋 Full inventory list with actions
│   │   ├── Navbar.jsx           # 🧭 Navigation + notifications
│   │   └── AutomationWorkflow.jsx # ⚙️ Workflow console
│   ├── services/
│   │   ├── firebase.js          # 🔥 Firestore CRUD operations
│   │   └── automation.js        # 📧 EmailJS automation triggers
│   ├── App.jsx                  # 🏠 Main app + routing + auth
│   ├── main.jsx                 # ⚡ React entry point
│   ├── App.css                  # 🎨 Component styles
│   └── index.css                # 🌐 Global styles + animations
├── public/                      # Static assets
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind theme config
└── package.json                 # Dependencies
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   React Frontend                │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │Dashboard │  │Medicine  │  │  Donation    │  │
│  │          │  │Inventory │  │  Portal      │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │            MediBot Chatbot               │   │
│  │  Gemini API → Rule-Based Fallback        │   │
│  └──────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
┌────▼─────┐      ┌───────▼──────┐
│ Firebase │      │   EmailJS    │
│Firestore │      │ Automation   │
└──────────┘      └──────────────┘
```

---

## 🎨 Color System

| Color | Hex | Usage |
|---|---|---|
| Primary Green | `#2e7d32` | Brand color, buttons, accents |
| Primary Light | `#e8f5e9` | Backgrounds, badges |
| Text Main | `#1a1a1a` | Primary text |
| Text Muted | `#6b7280` | Secondary text |

---

## 🤖 MediBot Chatbot

MediBot uses a **hybrid response strategy**:

1. **Gemini API** — Tries the Google Gemini API for dynamic, conversational AI responses
2. **Rule-Based Fallback** — If API quota is exceeded or unavailable, a smart pattern-matching engine provides instant answers

The chatbot is **context-aware** — it reads the user's live inventory data (medicine count, expired count, near-expiry count) to give personalized advice.

**Topics covered:** Adding medicines · Expiry colors · Donation process · NGO portal · Automation · Registration · Login · Profile · Safe disposal · Inventory stats

---

## 🔒 Authentication

MediCycle uses a **local session-based** authentication system:
- User accounts stored in `localStorage` for persistence
- Two roles: `donor` and `ngo` with separate views and dashboards
- Password validation: minimum 8 characters with at least one number
- Session auto-restored on page refresh

---

## 📜 Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run oxlint code linter
```

---

## 🙏 Acknowledgements

- **IBM SkillsBuild** — Project initiative and mentorship
- **Google AI** — Gemini API for the MediBot assistant
- **Firebase** — Firestore database infrastructure
- **Lucide** — Beautiful open-source icon set
- **Tailwind CSS** — Utility-first CSS framework

---

## 📄 License

This project is developed for educational purposes as part of the IBM SkillsBuild program.

---

<div align="center">
  <strong>Made with 💚 by Team MediCycle</strong><br/>
  <em>Every donated medicine could save a life.</em>
</div>

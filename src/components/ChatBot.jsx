import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader,
  Sparkles,
  Trash2,
  ChevronDown,
  Pill,
  HeartHandshake,
  AlertTriangle,
  Zap
} from "lucide-react";

// ─── Gemini API Config (used if quota is available) ─────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

// ─── System Prompt for Gemini ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are MediBot, the intelligent AI assistant for MediCycle AI — a smart medicine expiry tracking and donation management platform.

Your purpose:
- Help users understand and manage their medicine inventory
- Guide users on how to mark medicines for donation
- Explain expiry date warnings and what to do with near-expiry medicines
- Educate users about safe medicine disposal
- Help NGOs understand how to request and collect donated medicines
- Answer questions about using the MediCycle platform

Platform features you know about:
1. Medicine Inventory – Users can add medicines with name, category, quantity, expiry date, manufacturer, and image.
2. Expiry Warnings – Color-coded badges: red (expired), amber (< 30 days), yellow (< 90 days), green (safe).
3. Donation System – Donors mark medicines "Available for Donation"; NGOs browse and request them.
4. Automation Workflows – Automated email notifications for expiry warnings and donation events.
5. NGO Portal – NGOs register separately, browse donations, request medicines, and confirm pickups.
6. Roles – Two roles: "Donor" (individual) and "NGO" (organization).

Be warm, concise, and helpful. Use bullet points for steps. Never give medical diagnoses.`;

// ─── Rule-Based Response Engine ─────────────────────────────────────────────
const RULES = [
  {
    patterns: ["add medicine", "add a medicine", "register medicine", "how to add", "add new"],
    response: `To add a medicine to your inventory:\n\n- Click **"Add Medicine"** in the top navigation bar\n- Fill in the medicine name, category, quantity, and expiry date\n- Optionally add the manufacturer name and a photo\n- Click **"Save Medicine"** to register it\n\nYour medicine will appear in the **Inventory List** with a color-coded expiry badge!`
  },
  {
    patterns: ["expiry color", "color mean", "badge color", "red badge", "green badge", "yellow badge", "amber badge", "expiry warning", "color code", "what do the colors"],
    response: `MediCycle uses **color-coded expiry badges** to help you at a glance:\n\n- 🔴 **Red** — Medicine is already expired. Do not use or donate.\n- 🟠 **Amber/Orange** — Expiring within **30 days**. Consider donating urgently.\n- 🟡 **Yellow** — Expiring within **90 days**. Plan ahead.\n- 🟢 **Green** — Safe. More than 90 days until expiry.\n\nExpired medicines should be safely disposed of — never flush them or throw in regular trash.`
  },
  {
    patterns: ["donate", "donation", "mark for donation", "how to donate", "give medicine"],
    response: `To donate a medicine on MediCycle:\n\n- Go to **Inventory List** from the navigation\n- Find the medicine you want to donate\n- Click the **"Mark for Donation"** button on that medicine card\n- It will appear in the **Donation Pool** for NGOs to browse and request\n\n⚠️ Only donate medicines that are **not expired** and in their **original sealed packaging**. NGO staff will verify all donations.`
  },
  {
    patterns: ["ngo", "non-profit", "organization", "receive donation", "ngo portal", "ngo dashboard"],
    response: `NGOs on MediCycle can:\n\n- **Register** a separate NGO account using the "Continue as NGO" option\n- Browse all **Available Donations** from the NGO Dashboard\n- **Request** specific medicines they need\n- Track their **Active Requests** and confirm courier pickups\n- View **Accepted Donations** history\n\nNGO accounts show the **NGO Partner Portal** after login, separate from individual donor accounts.`
  },
  {
    patterns: ["how does medicycle work", "what is medicycle", "what can medicycle do", "tell me about", "explain medicycle", "platform"],
    response: `**MediCycle AI** is a smart medicine management platform with two main goals:\n\n1. 📦 **Track Expiry** — Add your medicines, and the system automatically warns you with color badges as they near expiry\n2. 💊 **Safe Donation** — Mark unused medicines for donation so verified NGOs can request and collect them\n\n**Two types of users:**\n- 👤 **Donors** — Individuals who track and donate medicines\n- 🏥 **NGOs** — Organizations that receive and distribute donated medicines\n\nThe platform also sends automated email notifications for expiry alerts and donation events.`
  },
  {
    patterns: ["automation", "workflow", "automated", "email notification", "alert"],
    response: `MediCycle's **Automation Workflows** handle notifications automatically:\n\n- 📧 **Expiry Alerts** — Email sent when medicines are expiring soon\n- ✅ **Donation Added** — Notification when you mark a medicine for donation\n- 📬 **Donation Requested** — Alert when an NGO requests your donation\n- 🎉 **Donation Completed** — Confirmation when a pickup is confirmed\n\nYou can view the full automation log in the **"Automation"** tab in the navbar.`
  },
  {
    patterns: ["register", "sign up", "create account", "new account"],
    response: `To create a MediCycle account:\n\n**As a Donor:**\n- Click **"Continue as Donor"** on the home page\n- Click **"Get Started"** and fill in your name, email, phone, address, and password\n\n**As an NGO:**\n- Click **"Continue as NGO"** on the home page\n- Click **"Register NGO"** and fill in your organization details and registration number\n\nMock credentials to try instantly:\n- Donor: **jane@example.com** / Password123\n- NGO: **hope@ngo.org** / Password123`
  },
  {
    patterns: ["login", "sign in", "log in", "password", "forgot password"],
    response: `To sign in to MediCycle:\n\n- Click **"Sign In"** on the home page\n- Enter your registered **email** and **password**\n\nDemo credentials you can use right now:\n- 👤 Donor: **jane@example.com** / Password123\n- 🏥 NGO: **hope@ngo.org** / Password123\n\nIf you forgot your password, click **"Forgot Password?"** on the login page.`
  },
  {
    patterns: ["delete medicine", "remove medicine", "delete", "remove"],
    response: `To remove a medicine from your inventory:\n\n- Go to **Inventory List** in the navigation\n- Find the medicine you want to delete\n- Click the **🗑️ Delete** button on the medicine card\n- Confirm the deletion in the popup\n\n⚠️ This action is permanent. If the medicine was marked for donation, it will also be removed from the donation pool.`
  },
  {
    patterns: ["edit medicine", "update medicine", "change medicine", "modify"],
    response: `To edit an existing medicine:\n\n- Go to **Inventory List**\n- Find the medicine and click the **✏️ Edit** button\n- Update any details — name, quantity, expiry date, etc.\n- Click **"Save Changes"** to update\n\nNote: The medicine category and expiry badge will automatically update based on your changes.`
  },
  {
    patterns: ["profile", "edit profile", "update profile", "change name", "change phone"],
    response: `To manage your profile:\n\n- Click **"Profile"** in the navigation bar\n- Click **"Edit Profile Details"** to update your name, phone, or address\n- Click **"Change Password"** to update your security credentials\n\nNote: Your email address cannot be changed as it's used as your unique login identifier.`
  },
  {
    patterns: ["safe disposal", "dispose", "throw away", "expired medicine", "what to do with expired"],
    response: `Safe medicine disposal is very important! Here's what to do:\n\n✅ **Do:**\n- Donate **unexpired, sealed** medicines via MediCycle\n- Use official medicine take-back programs\n- Check local pharmacy drop-off services\n\n❌ **Don't:**\n- Flush medicines down the toilet\n- Throw them in regular household trash\n- Give to others without a prescription\n\nFor expired medicines, MediCycle can connect you with certified disposal partners.`
  },
  {
    patterns: ["inventory", "stock", "medicine list", "my medicines", "view medicines"],
    response: `Your **Medicine Inventory** is the central hub of MediCycle:\n\n- View all your registered medicines in the **Inventory List** tab\n- Each card shows the name, category, quantity, expiry date, and color badge\n- Use the **filter/search** to find specific medicines quickly\n- Click **Edit** to update, **Delete** to remove, or **Donate** to share\n\nThe dashboard also shows your inventory summary with charts and statistics.`
  },
  {
    patterns: ["dashboard", "overview", "summary", "statistics", "stats"],
    response: `The **Dashboard** gives you a quick overview of your medicine inventory:\n\n- 📊 **Total Medicines** in your inventory\n- ⚠️ **Expiring Soon** — medicines needing attention\n- ❌ **Expired Count** — medicines past their date\n- 💚 **Donated** — medicines you've shared\n\nIt also shows charts for category distribution and expiry timeline to help you manage proactively.`
  },
  {
    patterns: ["hello", "hi", "hey", "greetings", "good morning", "good evening", "good afternoon"],
    response: `Hello! 👋 I'm **MediBot**, your AI assistant for **MediCycle AI**.\n\nI can help you with:\n- 💊 Adding and managing medicines\n- 🎨 Understanding expiry color badges\n- 🤝 Donating medicines to NGOs\n- 🏥 Using the NGO portal\n- 🔔 Setting up automation workflows\n\nWhat would you like to know?`
  },
  {
    patterns: ["thank", "thanks", "thank you", "helpful", "great", "awesome", "perfect"],
    response: `You're very welcome! 😊 I'm always here to help you make the most of MediCycle AI.\n\nRemember: every medicine you donate through MediCycle could be life-changing for someone in need. 💚\n\nIs there anything else I can help you with?`
  },
  {
    patterns: ["help", "what can you do", "options", "menu", "features"],
    response: `I'm **MediBot** and I can help you with:\n\n- 💊 **Add/Edit/Delete** medicines in your inventory\n- 🎨 **Expiry colors** — what each badge means\n- 🤝 **Donate medicines** to verified NGOs\n- 🏥 **NGO Portal** — how NGOs request donations\n- 🔔 **Automation** — email alerts and workflows\n- 👤 **Account** — register, login, profile management\n- ♻️ **Safe disposal** of expired medicines\n\nJust ask me anything about MediCycle!`
  }
];

// ─── Find best rule-based response ──────────────────────────────────────────
function getRuleBasedResponse(userText, medicines, currentUser) {
  const lower = userText.toLowerCase().trim();

  // Check for inventory-specific questions
  if (currentUser && medicines) {
    const today = new Date();
    const expired = medicines.filter(m => new Date(m.expiryDate) < today);
    const nearExpiry = medicines.filter(m => {
      const days = Math.ceil((new Date(m.expiryDate) - today) / 86400000);
      return days >= 0 && days <= 30;
    });
    const donated = medicines.filter(m => m.availableForDonation);

    if (/how many|count|total|number of/.test(lower) && /medicine|med|inventory/.test(lower)) {
      return `Based on your inventory, **${currentUser.name}**, here's your current status:\n\n- 📦 **Total medicines:** ${medicines.length}\n- ❌ **Expired:** ${expired.length}\n- ⚠️ **Expiring within 30 days:** ${nearExpiry.length}\n- 💚 **Available for donation:** ${donated.length}\n\n${expired.length > 0 ? "⚠️ You have expired medicines — please dispose of them safely!" : "✅ No expired medicines — great job!"}`;
    }

    if (/expired|expire/.test(lower) && /my|i have|check/.test(lower)) {
      if (expired.length === 0) {
        return `Great news, **${currentUser.name}**! 🎉 You have **no expired medicines** in your inventory.\n\nYou do have **${nearExpiry.length}** medicine(s) expiring within 30 days — consider donating them before they expire!`;
      }
      return `You have **${expired.length} expired medicine(s)** in your inventory:\n\n${expired.slice(0, 3).map(m => `- **${m.medicineName}** (expired ${m.expiryDate})`).join("\n")}${expired.length > 3 ? `\n- ...and ${expired.length - 3} more` : ""}\n\nPlease remove these and dispose of them safely. Do NOT donate expired medicines.`;
    }
  }

  // Match against rules
  for (const rule of RULES) {
    if (rule.patterns.some(p => lower.includes(p))) {
      return rule.response;
    }
  }

  // Default fallback
  return `I'm not sure I understood that. Here are some things I can help with:\n\n- "How do I add a medicine?"\n- "What do expiry colors mean?"\n- "How do I donate medicines?"\n- "How does MediCycle work?"\n- "How do NGOs request donations?"\n\nOr type **help** to see all my capabilities! 😊`;
}

// ─── Try Gemini, fall back to rules ─────────────────────────────────────────
async function getResponse(conversationHistory, userText, medicines, currentUser) {
  // Try Gemini first
  try {
    const contextLines = [];
    if (currentUser) {
      contextLines.push(`User: ${currentUser.name} (${currentUser.role === "ngo" ? "NGO Partner" : "Donor"})`);
      if (medicines?.length) {
        const today = new Date();
        contextLines.push(`Medicines in inventory: ${medicines.length}`);
        contextLines.push(`Expired: ${medicines.filter(m => new Date(m.expiryDate) < today).length}`);
        contextLines.push(`Expiring within 30 days: ${medicines.filter(m => { const d = Math.ceil((new Date(m.expiryDate) - today) / 86400000); return d >= 0 && d <= 30; }).length}`);
      }
    }

    const contents = conversationHistory.map(msg => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT + (contextLines.length ? `\n\nUser Context:\n${contextLines.join("\n")}` : "") }]
      },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
    };

    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });

    const data = await res.json();

    if (!res.ok) {
      // Quota / API error — silently fall back to rules
      throw new Error("quota");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return { text, source: "gemini" };
    throw new Error("empty");
  } catch {
    // Fall back to rule-based response
    return { text: getRuleBasedResponse(userText, medicines, currentUser), source: "rules" };
  }
}

// ─── Format markdown-ish text ────────────────────────────────────────────────
function formatMessage(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const lines = text.split("\n");
  let inList = false;
  const result = [];
  for (const line of lines) {
    const isBullet = /^[\-\*]\s/.test(line.trim());
    if (isBullet) {
      if (!inList) { result.push("<ul class='list-disc pl-4 space-y-1 my-1'>"); inList = true; }
      result.push(`<li>${line.replace(/^[\-\*]\s/, "")}</li>`);
    } else {
      if (inList) { result.push("</ul>"); inList = false; }
      if (line.trim()) result.push(`<p class='mb-1'>${line}</p>`);
    }
  }
  if (inList) result.push("</ul>");
  return result.join("");
}

// ─── Quick Suggestion Chips ──────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { icon: <Pill className="w-3.5 h-3.5" />, text: "How do I add a medicine?" },
  { icon: <AlertTriangle className="w-3.5 h-3.5" />, text: "What do expiry colors mean?" },
  { icon: <HeartHandshake className="w-3.5 h-3.5" />, text: "How to donate medicines?" },
  { icon: <Zap className="w-3.5 h-3.5" />, text: "How does MediCycle work?" },
];

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`flex gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col gap-1 ${isBot ? "items-start" : "items-end"}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isBot
            ? "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
            : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-sm"
        }`}>
          {msg.isTyping ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="chat-msg" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
          )}
        </div>
        {msg.timestamp && !msg.isTyping && (
          <span className="text-[10px] text-gray-400 px-1">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </div>
  );
}

// ─── Main ChatBot Component ──────────────────────────────────────────────────
export default function ChatBot({ currentUser, medicines }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = currentUser
        ? `Hello, **${currentUser.name}**! 👋 I'm **MediBot**, your AI medicine assistant. I can see you have ${medicines?.length ?? 0} medicine(s) in your inventory. How can I help you today?`
        : "Hello! 👋 I'm **MediBot**, your AI assistant for **MediCycle AI**. I can help you track medicine expiry, donate safely, and navigate the platform. What would you like to know?";
      setMessages([{ id: Date.now(), role: "bot", text: greeting, timestamp: new Date().toISOString() }]);
    }
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;
    setInput("");

    const userMsg = { id: Date.now(), role: "user", text: userText, timestamp: new Date().toISOString() };
    const typingMsg = { id: "typing", role: "bot", isTyping: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setIsLoading(true);

    // Small artificial delay for natural feel
    await new Promise(r => setTimeout(r, 600));

    try {
      const history = [...messages.filter(m => !m.isTyping), userMsg];
      const { text: reply } = await getResponse(history, userText, medicines, currentUser);

      setMessages(prev => [
        ...prev.filter(m => m.id !== "typing"),
        { id: Date.now() + 1, role: "bot", text: reply, timestamp: new Date().toISOString() }
      ]);
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== "typing"),
        { id: Date.now() + 1, role: "bot", text: "Sorry, something went wrong. Please try again!", timestamp: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, medicines, currentUser]);

  // Clear chat
  const handleClear = () => {
    setMessages([]);
    setTimeout(() => {
      const greeting = currentUser ? `Hello again, **${currentUser.name}**! 👋 How can I help you?` : "Hello! 👋 How can I help you today?";
      setMessages([{ id: Date.now(), role: "bot", text: greeting, timestamp: new Date().toISOString() }]);
    }, 80);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(p => !p); setIsMinimized(false); }}
        aria-label="Open MediBot Chat Assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-gray-700 hover:bg-gray-800" : "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800"
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-50 w-[370px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? "h-[58px]" : "h-[540px]"
          }`}
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-sm">MediBot</span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                </div>
                <p className="text-emerald-100 text-[10px] font-medium leading-none">
                  AI Medicine Assistant · Always Available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleClear} title="Clear conversation" className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all">
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => setIsMinimized(p => !p)} title={isMinimized ? "Expand" : "Minimize"} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all">
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${isMinimized ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/60">
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick chips (only on first message) */}
              {messages.length <= 1 && (
                <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-100 bg-white flex-shrink-0">
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s.text)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full transition-all disabled:opacity-50"
                    >
                      {s.icon}{s.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-3 border-t border-gray-100 bg-white flex-shrink-0">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask about medicines, donations..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 transition-all disabled:opacity-60"
                    style={{ minHeight: "40px", maxHeight: "96px" }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    {isLoading ? <Loader className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </form>
                <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">
                  MediBot may make mistakes. Always consult a pharmacist for medical advice.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .chat-msg ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
        .chat-msg li { margin-bottom: 0.15rem; }
        .chat-msg p { margin-bottom: 0.25rem; }
        .chat-msg strong { font-weight: 700; }
      `}</style>
    </>
  );
}

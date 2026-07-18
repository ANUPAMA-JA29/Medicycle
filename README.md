# MediCycle AI — Smart Medicine Expiry & Donation System

**MediCycle AI** is a responsive, modern frontend UI module built to solve medicine waste and bridge healthcare access gaps. The system tracks medicine expiry dates dynamically and allows donors to register, log in, and donate unused medications safely.

This project is built as a lightweight, interactive **Single Page Application (SPA)** using pure frontend web tech (HTML5, Vanilla CSS3, and Vanilla JS). It requires **no package managers, compile steps, or servers** to run; you can view the prototype immediately by opening the files in any modern web browser.

---

## 🚀 Getting Started

### Option 1: Direct Local View (No Setup)
Simply navigate to the project directory and double-click `index.html` to open it directly in Chrome, Edge, Firefox, or Safari:
* File location: [index.html](index.html)

### Option 2: Run a Simple Local Server
If you want to view the project through a port over HTTP (useful for staging/testing environments):
```bash
# Run with Python
python -m http.server 8000

# OR run with Node.js
npx serve .
```
Then visit: `http://localhost:8000` (or the port specified in your terminal).

---

## 🔑 Mock Credentials
To bypass the registration flow and test the authenticated profile panel directly:
* **Email**: `jane@example.com`
* **Password**: `Password123`

*Note: You can also register a brand new account through the Sign Up form, which will immediately save to the client session.*

---

## 🛠️ File Structure

The project has three core files:
```text
├── index.html   # Main SPA view templates (Landing, Register, Login, Profile)
├── style.css    # Responsive design system, CSS grids/flex layouts, and transition animations
├── app.js       # Session management, inline validations, and submission handlers
└── README.md    # Documentation (This file)
```

---

## ✨ Features & Component Implementation

### 1. Landing Hero View
* **Header**: Glassmorphic sticky bar that alters navigation options according to whether a user is logged in or guest.
* **Hero Content**: Introduction tagging details, CTA buttons redirecting to Register/Login forms.
* **Visual Grid**: Highlights active stats (e.g. `12,450+ medicines rescued`) and simulated expiration warnings.

### 2. Registration Page
Contains inputs for Full Name, Email, Phone Number, Residential Address, Password, and Confirm Password. Includes real-time validation checks:
* **Full Name**: Required, letters and spaces only.
* **Email**: Required, valid email format validation.
* **Phone Number**: Required, exactly 10 digits only.
* **Residential Address**: Required.
* **Password**: Minimum 8 characters with at least 1 number.
* **Confirm Password**: Must match Password exactly.

### 3. Login Page
* Inputs for Email and Password.
* Validation ensures inputs conform to structure checks.
* **Forgot Password?**: Dummy link triggers simulation notifications to verify UI logic.

### 4. Interactive User Profile Page
* **Left Card (Dashboard Details)**: Initials-based avatar generation, formatted phone layout (`(XXX) XXX-XXXX`), residential address indicator, and navigation commands.
* **Right Card (Dynamic Context Panel)**: Swaps active states dynamically:
  * **Edit Profile**: Pre-fills fields with state values. Saving immediately updates the user data and syncs details.
  * **Change Password**: Validates current credentials and replaces key structures securely.
  * **Logout**: Clears session cache and routes back to the Landing layout.

---

## 🎨 Healthcare Theme & Visual Aesthetics

* **Color Properties**:
  * Primary Green: `#2E7D32` (Emerald green for a clean clinical accent)
  * Hover Green: `#1B5E20` (Forest green)
  * Background Color: `#F4F7F5` (Clean, warm medical-grey background)
  * Font Family: `Outfit` (Modern, geometric sans-serif from Google Fonts)
* **Interactive Polish**:
  * Glassmorphism headers using `backdrop-filter: blur(12px)`.
  * Animated view transitions that slide up and fade in.
  * Form errors display smooth, sliding inline messaging.
  * Successful form actions dispatch animated toast alerts at the bottom-right of the viewport.

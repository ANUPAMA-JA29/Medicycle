import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import MedicineForm from "./components/MedicineForm";
import MedicineList from "./components/MedicineList";
import DonationPage from "./components/DonationPage";
import { 
  addMedicine, 
  getMedicines, 
  updateMedicine, 
  deleteMedicine, 
  getDonationMedicines, 
  updateDonationStatus 
} from "./services/firebase";
import { 
  Activity, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";

// Mock default user
const DEFAULT_MOCK_USER = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "9876543210",
  address: "123 Green Valley Road, Sector 4, Health City",
  password: "Password123"
};

export default function App() {
  // Session & Authentication state
  const [users, setUsers] = useState([DEFAULT_MOCK_USER]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState("landing");

  // Inventory & Donation Data State
  const [medicines, setMedicines] = useState([]);
  const [donationMedicines, setDonationMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingMedicine, setEditingMedicine] = useState(null);

  // Profile forms state
  const [profileSubState, setProfileSubState] = useState("placeholder"); // placeholder | edit | password
  const [editProfileForm, setEditProfileForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [editProfileErrors, setEditProfileErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Toast feedback state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Load session from local storage on mount
  useEffect(() => {
    try {
      const localData = localStorage.getItem("medicycle_state");
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.isLoggedIn && parsed.currentUser) {
          setCurrentUser(parsed.currentUser);
          setIsLoggedIn(true);
          setCurrentView("dashboard");
        }
      }
    } catch (e) {
      console.warn("Could not load local session.", e);
    }
  }, []);

  // Fetch medicines whenever currentUser changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchMedicinesData();
    } else {
      setMedicines([]);
    }
  }, [isLoggedIn, currentUser]);

  const fetchMedicinesData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userMeds = await getMedicines(currentUser.email);
      setMedicines(userMeds);
      
      const allDonations = await getDonationMedicines();
      setDonationMedicines(allDonations);
    } catch (e) {
      showToast("Error connecting to inventory database.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView("landing");
    setProfileSubState("placeholder");
    
    // Update local storage
    try {
      const localData = localStorage.getItem("medicycle_state");
      const parsed = localData ? JSON.parse(localData) : {};
      localStorage.setItem("medicycle_state", JSON.stringify({
        ...parsed,
        isLoggedIn: false,
        currentUser: null
      }));
    } catch (e) {}
    showToast("Logged out successfully.", "info");
  };

  // ==========================================
  // AUTHENTICATION FLOW (LOGIN & REGISTRATION)
  // ==========================================
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [registerErrors, setRegisterErrors] = useState({});

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!loginForm.email.trim()) errors.email = "Email is required.";
    if (!loginForm.password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    const foundUser = users.find(
      u => u.email.toLowerCase() === loginForm.email.toLowerCase() && u.password === loginForm.password
    );

    if (foundUser) {
      setIsLoggedIn(true);
      setCurrentUser(foundUser);
      setCurrentView("dashboard");
      setLoginForm({ email: "", password: "" });
      setLoginErrors({});
      
      // Save state to local storage
      localStorage.setItem("medicycle_state", JSON.stringify({
        users,
        isLoggedIn: true,
        currentUser: foundUser
      }));
      
      showToast(`Welcome back, ${foundUser.name}!`);
    } else {
      setLoginErrors({ general: "Invalid email or password. Use Jane's mock credentials." });
      showToast("Login failed. Check details.", "error");
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    
    if (!registerForm.name.trim()) errors.name = "Full name is required.";
    else if (!/^[A-Za-z\s]+$/.test(registerForm.name)) errors.name = "Name can only contain letters.";
    
    if (!registerForm.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(registerForm.email)) errors.email = "Invalid email format.";
    
    if (!registerForm.phone.trim()) errors.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(registerForm.phone)) errors.phone = "Phone must be exactly 10 digits.";
    
    if (!registerForm.address.trim()) errors.address = "Residential address is required.";
    
    if (!registerForm.password) errors.password = "Password is required.";
    else if (registerForm.password.length < 8 || !/\d/.test(registerForm.password)) {
      errors.password = "Password must be at least 8 characters and contain at least 1 number.";
    }
    
    if (registerForm.confirmPassword !== registerForm.password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === registerForm.email.toLowerCase());
    if (emailExists) {
      setRegisterErrors({ email: "Email is already registered." });
      showToast("Email already exists.", "error");
      return;
    }

    const newUser = {
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      address: registerForm.address,
      password: registerForm.password
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setIsLoggedIn(true);
    setCurrentUser(newUser);
    setCurrentView("dashboard");
    setRegisterForm({ name: "", email: "", phone: "", address: "", password: "", confirmPassword: "" });
    setRegisterErrors({});

    localStorage.setItem("medicycle_state", JSON.stringify({
      users: updatedUsers,
      isLoggedIn: true,
      currentUser: newUser
    }));

    showToast("Account created successfully!");
  };

  // ==========================================
  // INVENTORY OPERATIONS (CRUD)
  // ==========================================
  const handleAddOrEditMedicine = async (medData) => {
    try {
      if (editingMedicine) {
        // Edit flow
        await updateMedicine(editingMedicine.medicineId, medData);
        showToast("Medicine updated successfully.");
      } else {
        // Add flow
        await addMedicine(currentUser.email, medData);
        showToast("Medicine registered in inventory.");
      }
      setEditingMedicine(null);
      setCurrentView("medicine-list");
      fetchMedicinesData();
    } catch (e) {
      showToast("Failed to save medicine records.", "error");
    }
  };

  const handleStartEdit = (med) => {
    setEditingMedicine(med);
    setCurrentView("edit-medicine");
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(id);
        showToast("Medicine removed from inventory.", "info");
        fetchMedicinesData();
      } catch (e) {
        showToast("Failed to delete medicine.", "error");
      }
    }
  };

  const handleMarkDonate = async (id) => {
    try {
      await updateMedicine(id, { availableForDonation: true, status: "Available" });
      showToast("Medicine marked for donation!");
      fetchMedicinesData();
    } catch (e) {
      showToast("Failed to mark as donation.", "error");
    }
  };

  const handleUpdateDonationStatus = async (id, status) => {
    try {
      await updateDonationStatus(id, status);
      showToast(`Donation status updated to ${status}.`);
      fetchMedicinesData();
    } catch (e) {
      showToast("Failed to update donation status.", "error");
    }
  };

  // ==========================================
  // PROFILE SUB-FORM HANDLERS
  // ==========================================
  const startEditProfile = () => {
    setEditProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      address: currentUser.address
    });
    setEditProfileErrors({});
    setProfileSubState("edit");
  };

  const handleEditProfileSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!editProfileForm.name.trim()) errors.name = "Full name is required.";
    else if (!/^[A-Za-z\s]+$/.test(editProfileForm.name)) errors.name = "Name can only contain letters.";
    if (!editProfileForm.phone.trim()) errors.phone = "Phone is required.";
    else if (!/^\d{10}$/.test(editProfileForm.phone)) errors.phone = "Phone must be 10 digits.";
    if (!editProfileForm.address.trim()) errors.address = "Address is required.";

    if (Object.keys(errors).length > 0) {
      setEditProfileErrors(errors);
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: editProfileForm.name,
      phone: editProfileForm.phone,
      address: editProfileForm.address
    };

    const updatedUsers = users.map(u => u.email.toLowerCase() === currentUser.email.toLowerCase() ? updatedUser : u);
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    setProfileSubState("placeholder");
    showToast("Profile details updated.");

    localStorage.setItem("medicycle_state", JSON.stringify({
      users: updatedUsers,
      isLoggedIn: true,
      currentUser: updatedUser
    }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (passwordForm.oldPassword !== currentUser.password) {
      errors.oldPassword = "Old password matches incorrectly.";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (passwordForm.newPassword.length < 8 || !/\d/.test(passwordForm.newPassword)) {
      errors.newPassword = "New password must be at least 8 characters and contain 1 number.";
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const updatedUser = {
      ...currentUser,
      password: passwordForm.newPassword
    };

    const updatedUsers = users.map(u => u.email.toLowerCase() === currentUser.email.toLowerCase() ? updatedUser : u);
    setUsers(updatedUsers);
    setCurrentUser(updatedUser);
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    setProfileSubState("placeholder");
    showToast("Password updated successfully.");

    localStorage.setItem("medicycle_state", JSON.stringify({
      users: updatedUsers,
      isLoggedIn: true,
      currentUser: updatedUser
    }));
  };

  // Profile initials helper
  const getInitials = (name) => {
    if (!name) return "JD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-lg border text-sm font-semibold bg-white ${
            toast.type === "success" 
              ? "text-primary border-green-200 shadow-green-100" 
              : toast.type === "error" 
              ? "text-red-600 border-red-200 shadow-red-100" 
              : "text-blue-600 border-blue-200 shadow-blue-100"
          }`}>
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-primary" />}
            {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-red-500" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-blue-500" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar 
        isLoggedIn={isLoggedIn} 
        currentUser={currentUser} 
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === "profile") setProfileSubState("placeholder");
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 mt-[72px] px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto w-full">
        
        {/* ==========================================
            VIEW 1: LANDING PAGE
            ========================================== */}
        {currentView === "landing" && (
          <div className="animate-slideUp py-6 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column Text */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-block bg-primary-light border border-primary/20 text-primary font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                  Smart Medicine Expiry & Donation System
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-main leading-tight tracking-tight">
                  Redefining Medicine Disposal & <span className="text-gradient">Donation</span>
                </h1>
                <p className="text-text-muted text-lg sm:text-xl font-medium leading-relaxed max-w-2xl">
                  Track medicine expiry dynamically and donate unused medications safely. Bridge the gap between medicine waste and healthcare access using AI-powered insights.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => setCurrentView("register")}
                    className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group text-base"
                  >
                    Get Started
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => setCurrentView("login")}
                    className="px-6 py-3.5 border border-primary/45 hover:bg-primary-light text-primary font-extrabold rounded-md transition-all text-base"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Right Column Visual Card */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-lg border border-gray-100 shadow-lg p-6 space-y-6 relative overflow-hidden glass-card">
                  <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-400"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                      <span className="w-3 h-3 rounded-full bg-green-400"></span>
                    </div>
                    <span className="text-xs font-bold text-text-muted">MediCycle System Status</span>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-light/40 border border-primary/10 p-4 rounded-md">
                      <span className="text-2xl font-black text-primary block">12,450+</span>
                      <span className="text-xs text-text-muted font-semibold">Medicines Rescued</span>
                    </div>
                    <div className="bg-primary-light/40 border border-primary/10 p-4 rounded-md">
                      <span className="text-2xl font-black text-primary block">98%</span>
                      <span className="text-xs text-text-muted font-semibold">AI Expiry Prediction</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-3">
                    <div className="flex gap-3 bg-red-50/50 p-3.5 rounded-md border border-red-100">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-red-800">Dynamic Expiry Warning</h4>
                        <p className="text-xs text-red-700 mt-0.5">Automated color badge warnings as chemicals degrade.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 bg-emerald-50/50 p-3.5 rounded-md border border-emerald-100">
                      <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-800">Safe & Verified Donation</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">All items checked by qualified NGO pharmacy staff.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            VIEW 2: LOGIN PAGE
            ========================================== */}
        {currentView === "login" && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100 animate-slideUp">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-text-main">Welcome Back</h2>
              <p className="text-text-muted text-sm mt-1">
                Access your account or use mock credentials:
              </p>
              <div className="mt-2.5 inline-block bg-primary-light border border-primary/25 rounded px-2.5 py-1 text-xs text-primary font-bold">
                jane@example.com / Password123
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3 rounded text-center">
                  {loginErrors.general}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, email: e.target.value });
                    setLoginErrors(prev => ({ ...prev, email: "", general: "" }));
                  }}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {loginErrors.email && <span className="text-xs text-red-600 font-medium block">{loginErrors.email}</span>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast("Password reset link sent to your registered email (mock action)!", "info")}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    setLoginErrors(prev => ({ ...prev, password: "", general: "" }));
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {loginErrors.password && <span className="text-xs text-red-600 font-medium block">{loginErrors.password}</span>}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold rounded shadow-sm hover:shadow transition-all duration-200 text-sm mt-2"
              >
                Sign In
              </button>

              <p className="text-center text-xs text-text-muted pt-2">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("register");
                    setLoginErrors({});
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Register here
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ==========================================
            VIEW 3: REGISTER PAGE
            ========================================== */}
        {currentView === "register" && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100 animate-slideUp">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-text-main">Create Account</h2>
              <p className="text-text-muted text-sm mt-1">
                Join MediCycle AI to track expiry dates and donate verified medicines.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={registerForm.name}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, name: e.target.value });
                    setRegisterErrors(prev => ({ ...prev, name: "" }));
                  }}
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {registerErrors.name && <span className="text-xs text-red-600 font-medium block">{registerErrors.name}</span>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={registerForm.email}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, email: e.target.value });
                    setRegisterErrors(prev => ({ ...prev, email: "" }));
                  }}
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {registerErrors.email && <span className="text-xs text-red-600 font-medium block">{registerErrors.email}</span>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={registerForm.phone}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, phone: e.target.value });
                    setRegisterErrors(prev => ({ ...prev, phone: "" }));
                  }}
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {registerErrors.phone && <span className="text-xs text-red-600 font-medium block">{registerErrors.phone}</span>}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="123 Main St, City, State"
                  value={registerForm.address}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, address: e.target.value });
                    setRegisterErrors(prev => ({ ...prev, address: "" }));
                  }}
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {registerErrors.address && <span className="text-xs text-red-600 font-medium block">{registerErrors.address}</span>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Min 8 chars, 1 number"
                  value={registerForm.password}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, password: e.target.value });
                    setRegisterErrors(prev => ({ ...prev, password: "" }));
                  }}
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {registerErrors.password && <span className="text-xs text-red-600 font-medium block">{registerErrors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                    setRegisterErrors(prev => ({ ...prev, confirmPassword: "" }));
                  }}
                  className="w-full px-4 py-2.5 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                {registerErrors.confirmPassword && <span className="text-xs text-red-600 font-medium block">{registerErrors.confirmPassword}</span>}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold rounded shadow-sm hover:shadow transition-all duration-200 text-sm mt-2"
              >
                Create Account
              </button>

              <p className="text-center text-xs text-text-muted pt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("login");
                    setRegisterErrors({});
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Login here
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ==========================================
            VIEW 4: USER DASHBOARD (AUTHENTICATED)
            ========================================== */}
        {isLoggedIn && currentView === "dashboard" && (
          <Dashboard medicines={medicines} onViewChange={setCurrentView} />
        )}

        {/* ==========================================
            VIEW 5: ADD / EDIT MEDICINE FORM (AUTHENTICATED)
            ========================================== */}
        {isLoggedIn && (currentView === "add-medicine" || currentView === "edit-medicine") && (
          <MedicineForm 
            editingMedicine={currentView === "edit-medicine" ? editingMedicine : null}
            onSubmit={handleAddOrEditMedicine}
            onCancel={() => {
              setEditingMedicine(null);
              setCurrentView("medicine-list");
            }}
          />
        )}

        {/* ==========================================
            VIEW 6: MEDICINE INVENTORY LIST (AUTHENTICATED)
            ========================================== */}
        {isLoggedIn && currentView === "medicine-list" && (
          <MedicineList 
            medicines={medicines}
            onEdit={handleStartEdit}
            onDelete={handleDeleteMedicine}
            onMarkDonate={handleMarkDonate}
            onViewChange={setCurrentView}
          />
        )}

        {/* ==========================================
            VIEW 7: DONATION PAGE (AUTHENTICATED)
            ========================================== */}
        {isLoggedIn && currentView === "donation" && (
          <DonationPage 
            donationMedicines={donationMedicines}
            onUpdateStatus={handleUpdateDonationStatus}
            currentUser={currentUser}
          />
        )}

        {/* ==========================================
            VIEW 8: USER PROFILE PAGE (AUTHENTICATED)
            ========================================== */}
        {isLoggedIn && currentView === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slideUp">
            
            {/* Left Column Profile Summary */}
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-primary font-extrabold text-3xl shadow-sm border border-primary/10">
                {getInitials(currentUser.name)}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-text-main">{currentUser.name}</h2>
                <p className="text-sm font-semibold text-text-muted">{currentUser.email}</p>
                <div className="pt-2">
                  <span className="bg-primary-light text-primary border border-primary/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Verified Donor
                  </span>
                </div>
              </div>

              <hr className="w-full border-gray-100" />

              <div className="w-full text-left space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Phone Number
                  </span>
                  <span className="font-bold text-text-main">
                    {`(${currentUser.phone.slice(0,3)}) ${currentUser.phone.slice(3,6)}-${currentUser.phone.slice(6)}`}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Residential Address
                  </span>
                  <span className="font-semibold text-text-main text-xs leading-relaxed">
                    {currentUser.address}
                  </span>
                </div>
              </div>

              <hr className="w-full border-gray-100" />

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={startEditProfile}
                  className={`w-full py-2.5 rounded-md text-sm font-bold border transition-all ${
                    profileSubState === "edit"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-primary border-primary/45 hover:bg-primary-light"
                  }`}
                >
                  Edit Profile Details
                </button>
                <button
                  onClick={() => {
                    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                    setPasswordErrors({});
                    setProfileSubState("password");
                  }}
                  className={`w-full py-2.5 rounded-md text-sm font-bold border transition-all ${
                    profileSubState === "password"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-primary border-primary/45 hover:bg-primary-light"
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-md transition-all border border-transparent"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Right Column Action Workspace */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
              
              {/* Profile sub-state 1: Placeholder */}
              {profileSubState === "placeholder" && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center shadow-sm">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main">MediCycle AI Dashboard Workspace</h3>
                  <p className="text-text-muted text-sm max-w-md">
                    Choose an option from the profile actions menu on the left to edit your personal information or update security credentials.
                  </p>
                </div>
              )}

              {/* Profile sub-state 2: Edit Profile Form */}
              {profileSubState === "edit" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-text-main">Edit Personal Information</h3>
                    <p className="text-text-muted text-xs mt-1">Keep your details updated so donation pickups are routed correctly.</p>
                  </div>

                  <form onSubmit={handleEditProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted">Full Name</label>
                        <input
                          type="text"
                          value={editProfileForm.name}
                          onChange={(e) => {
                            setEditProfileForm({ ...editProfileForm, name: e.target.value });
                            setEditProfileErrors(prev => ({ ...prev, name: "" }));
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        />
                        {editProfileErrors.name && <span className="text-xs text-red-600 block">{editProfileErrors.name}</span>}
                      </div>

                      {/* Email (Read Only) */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted">Email (Username - Cannot Edit)</label>
                        <input
                          type="email"
                          value={editProfileForm.email}
                          disabled
                          className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-text-muted rounded text-sm focus:outline-none cursor-not-allowed"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted">Phone Number</label>
                        <input
                          type="tel"
                          value={editProfileForm.phone}
                          onChange={(e) => {
                            setEditProfileForm({ ...editProfileForm, phone: e.target.value });
                            setEditProfileErrors(prev => ({ ...prev, phone: "" }));
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        />
                        {editProfileErrors.phone && <span className="text-xs text-red-600 block">{editProfileErrors.phone}</span>}
                      </div>

                      {/* Address */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-text-muted">Residential Address</label>
                        <input
                          type="text"
                          value={editProfileForm.address}
                          onChange={(e) => {
                            setEditProfileForm({ ...editProfileForm, address: e.target.value });
                            setEditProfileErrors(prev => ({ ...prev, address: "" }));
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        />
                        {editProfileErrors.address && <span className="text-xs text-red-600 block">{editProfileErrors.address}</span>}
                      </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                      <button
                        type="button"
                        onClick={() => setProfileSubState("placeholder")}
                        className="px-4 py-2 border border-gray-200 text-text-main rounded text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-bold shadow-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Profile sub-state 3: Change Password Form */}
              {profileSubState === "password" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-text-main">Change Security Password</h3>
                    <p className="text-text-muted text-xs mt-1">Ensure your account remains secure by updating your credentials.</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Old Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-muted">Old Password</label>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, oldPassword: e.target.value });
                          setPasswordErrors(prev => ({ ...prev, oldPassword: "" }));
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                      />
                      {passwordErrors.oldPassword && <span className="text-xs text-red-600 block">{passwordErrors.oldPassword}</span>}
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-muted">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                          setPasswordErrors(prev => ({ ...prev, newPassword: "" }));
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                      />
                      {passwordErrors.newPassword && <span className="text-xs text-red-600 block">{passwordErrors.newPassword}</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-muted">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => {
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                          setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                      />
                      {passwordErrors.confirmPassword && <span className="text-xs text-red-600 block">{passwordErrors.confirmPassword}</span>}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                      <button
                        type="button"
                        onClick={() => setProfileSubState("placeholder")}
                        className="px-4 py-2 border border-gray-200 text-text-main rounded text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-bold shadow-sm"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-150 py-6 mt-12 text-center text-text-muted text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© {new Date().getFullYear()} MediCycle AI. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-all">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-all">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-all">Help & Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

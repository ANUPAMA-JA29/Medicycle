import React, { useState } from "react";
import { LogOut, User, PlusCircle, List, Gift, LayoutDashboard, Menu, X, Activity } from "lucide-react";

export default function Navbar({ isLoggedIn, currentUser, currentView, onViewChange, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "medicine-list", label: "Inventory List", icon: List },
    { id: "add-medicine", label: "Add Medicine", icon: PlusCircle },
    { id: "donation", label: "Donations", icon: Gift },
    { id: "profile", label: "Profile", icon: User },
  ];

  const ngoNavItems = [
    { id: "ngoDashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "browse-donations", label: "Browse Donations", icon: Gift },
    { id: "my-requests", label: "My Requests", icon: List },
    { id: "profile", label: "Profile", icon: User },
  ];

  const currentNavItems = currentUser?.role === "ngo" ? ngoNavItems : navItems;

  const handleNavClick = (viewId) => {
    onViewChange(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] glass-header z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleNavClick(isLoggedIn ? (currentUser?.role === "ngo" ? "ngoDashboard" : "dashboard") : "landing")}
        >
          <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-text-main">
            MediCycle <span className="text-primary font-black">AI</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-1 mr-4">
                {currentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${isActive
                          ? "bg-primary text-white shadow-sm"
                          : "text-text-main hover:text-primary hover:bg-primary-light"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="h-6 w-px bg-gray-200 mr-2"></div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-muted">
                  Hi, <span className="font-semibold text-text-main">{currentUser?.name}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewChange("login")}
                className="px-4 py-2 text-sm font-bold text-text-main hover:text-primary rounded-md transition-all"
              >
                Login
              </button>
              <button
                onClick={() => onViewChange("register")}
                className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm transition-all duration-200"
              >
                Register
              </button>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-text-main hover:text-primary p-2 rounded-md focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg px-4 py-4 space-y-2 animate-fadeIn z-40">
          {isLoggedIn ? (
            <>
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-base font-semibold transition-all ${isActive
                        ? "bg-primary text-white"
                        : "text-text-main hover:bg-primary-light hover:text-primary"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
              <div className="h-px bg-gray-150 my-2"></div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">
                  Logged in as <span className="font-semibold text-text-main">{currentUser?.name}</span>
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-2">
              <button
                onClick={() => handleNavClick("login")}
                className="px-4 py-2.5 text-center text-sm font-bold text-text-main bg-gray-100 hover:bg-gray-200 rounded-md transition-all"
              >
                Login
              </button>
              <button
                onClick={() => handleNavClick("register")}
                className="px-4 py-2.5 text-center text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm transition-all"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

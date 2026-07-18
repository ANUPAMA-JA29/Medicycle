import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, 
  User, 
  PlusCircle, 
  List, 
  Gift, 
  LayoutDashboard, 
  Menu, 
  X, 
  Activity, 
  Cpu, 
  Bell, 
  Trash2, 
  AlertTriangle, 
  Clock
} from "lucide-react";
import { getNotifications, markNotificationsAsRead, clearNotifications } from "../services/automation";

export default function Navbar({ isLoggedIn, currentUser, currentView, onViewChange, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "medicine-list", label: "Inventory List", icon: List },
    { id: "add-medicine", label: "Add Medicine", icon: PlusCircle },
    { id: "donation", label: "Donations", icon: Gift },
    { id: "automation", label: "Automation", icon: Cpu },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Load and subscribe to notifications change
  useEffect(() => {
    const loadNotifs = () => {
      setNotifications(getNotifications());
    };
    
    // Initial fetch
    loadNotifs();

    // Custom browser events to refresh
    window.addEventListener("medicycle_notif_refresh", loadNotifs);
    return () => {
      window.removeEventListener("medicycle_notif_refresh", loadNotifs);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
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

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      // Mark all as read when opening dropdown
      const updated = markNotificationsAsRead();
      setNotifications(updated);
    }
  };

  const handleClearAllNotifs = (e) => {
    e.stopPropagation();
    const updated = clearNotifications();
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              
              <div className="flex items-center gap-3 relative mr-2 text-left" ref={dropdownRef}>
                {/* Notifications Bell */}
                <button
                  onClick={handleBellClick}
                  className={`p-2 rounded-full hover:bg-gray-150 transition-all relative ${
                    showDropdown ? "bg-gray-100 text-primary" : "text-text-muted"
                  }`}
                  title="System Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showDropdown && (
                  <div className="absolute right-0 top-11 w-80 bg-white border border-gray-150 rounded-lg shadow-lg overflow-hidden flex flex-col z-50 animate-slideUp">
                    <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-black text-text-main">System Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAllNotifs}
                          className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear All
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-text-muted space-y-1">
                          <Bell className="w-8 h-8 text-gray-200 mx-auto" />
                          <p className="font-semibold">No alerts registered</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          let Icon = Clock;
                          let iconClass = "bg-blue-50 text-blue-600";
                          if (notif.type === "expiry") {
                            Icon = AlertTriangle;
                            iconClass = "bg-red-50 text-red-600";
                          } else if (notif.type === "donation") {
                            Icon = Gift;
                            iconClass = "bg-emerald-50 text-emerald-600";
                          } else if (notif.type === "added") {
                            Icon = PlusCircle;
                            iconClass = "bg-blue-50 text-blue-600";
                          }

                          return (
                            <div 
                              key={notif.id} 
                              className={`p-3 flex items-start gap-2.5 hover:bg-gray-50/50 transition-colors ${
                                !notif.isRead ? "bg-primary-light/10" : ""
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h4 className="text-xs font-black text-text-main leading-tight truncate">
                                  {notif.title}
                                </h4>
                                <p className="text-[11px] text-text-muted leading-snug">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-text-muted font-semibold block pt-0.5">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div 
                      onClick={() => { handleNavClick("automation"); setShowDropdown(false); }}
                      className="p-2.5 bg-gray-50 border-t border-gray-100 text-center text-[10px] font-bold text-primary hover:bg-primary-light cursor-pointer transition-colors"
                    >
                      Open Workflows Console
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-muted">
                  Hi, <span className="font-semibold text-text-main">{currentUser?.name}</span>
                </span>
                
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200 animate"
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

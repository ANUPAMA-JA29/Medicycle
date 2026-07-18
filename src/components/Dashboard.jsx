import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  AlertTriangle, 
  HeartHandshake, 
  ShieldCheck, 
  Plus, 
  List, 
  Gift, 
  ChevronRight, 
  Activity,
  Bell,
  Trash2,
  Cpu,
  PlusCircle,
  Clock,
  Sparkles,
  PieChart,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { getNotifications, clearNotifications } from "../services/automation";
import { db, isFirebaseConfigured } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard({ medicines: propMedicines, onViewChange, currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [localMedicines, setLocalMedicines] = useState(propMedicines || []);

  // Load and listen to notifications changes
  useEffect(() => {
    const loadNotifs = () => {
      setNotifications(getNotifications());
    };
    loadNotifs();
    window.addEventListener("medicycle_notif_refresh", loadNotifs);
    return () => window.removeEventListener("medicycle_notif_refresh", loadNotifs);
  }, []);

  // Real-time Firestore sync
  useEffect(() => {
    if (isFirebaseConfigured && db && currentUser?.email) {
      const colRef = collection(db, "Medicines");
      const q = query(colRef, where("userId", "==", currentUser.email));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            ...data,
            medicineId: docSnap.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
          });
        });
        setLocalMedicines(list);
      }, (error) => {
        console.error("Firestore onSnapshot error:", error);
      });
      return () => unsubscribe();
    } else {
      setLocalMedicines(propMedicines || []);
    }
  }, [currentUser, propMedicines]);

  // Helper: calculate days remaining until expiry
  const getDaysRemaining = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Metrics calculations
  const totalCount = localMedicines.length;
  
  const expiringSoon7Count = localMedicines.filter(m => {
    const days = getDaysRemaining(m.expiryDate);
    return days <= 7 && days >= 0;
  }).length;

  const expiredCount = localMedicines.filter(m => {
    const days = getDaysRemaining(m.expiryDate);
    return days < 0;
  }).length;

  const availableDonationsCount = localMedicines.filter(m => 
    m.availableForDonation && m.status === "Available"
  ).length;

  const completedDonatedCount = localMedicines.filter(m => 
    m.availableForDonation && m.status === "Completed"
  ).length;

  // Recent medications that need attention (expired or expiring in <= 30 days)
  const urgentMedicines = localMedicines
    .filter(m => getDaysRemaining(m.expiryDate) <= 30)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 4);

  const handleClearFeed = (e) => {
    e.stopPropagation();
    const updated = clearNotifications();
    setNotifications(updated);
  };

  // ==========================================
  // CHART DATA COMPILATION
  // ==========================================

  // 1. Pie Chart: Medicine Categories
  const categoryCounts = {};
  localMedicines.forEach(m => {
    const cat = m.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const pieLabels = Object.keys(categoryCounts);
  const pieDataValues = Object.values(categoryCounts);

  const pieData = {
    labels: pieLabels.length > 0 ? pieLabels : ["No Data"],
    datasets: [
      {
        data: pieDataValues.length > 0 ? pieDataValues : [1],
        backgroundColor: pieLabels.length > 0 ? [
          "#2e7d32", // primary green
          "#4caf50", // primary accent green
          "#0284c7", // sky-600
          "#8b5cf6", // violet-500
          "#f59e0b", // amber-500
          "#f43f5e", // rose-500
          "#0d9488", // teal-600
          "#4f46e5"  // indigo-650
        ] : ["#e5e7eb"], // gray fallback
        borderWidth: 1.5,
        borderColor: "#ffffff"
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            family: "Outfit",
            size: 11
          },
          boxWidth: 12
        }
      },
      tooltip: {
        titleFont: { family: "Outfit" },
        bodyFont: { family: "Outfit" }
      }
    }
  };

  // 2. Bar Chart: Monthly Donations
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dynamicDonations = Array(12).fill(0);
  
  localMedicines.forEach(m => {
    if (m.availableForDonation && m.status === "Completed") {
      const date = new Date(m.createdAt || Date.now());
      const monthIdx = date.getMonth();
      dynamicDonations[monthIdx] += 1;
    }
  });

  const barDataValues = dynamicDonations;

  const barData = {
    labels: months,
    datasets: [
      {
        label: "Donated Medicines",
        data: barDataValues,
        backgroundColor: "#2e7d32",
        borderRadius: 4,
        hoverBackgroundColor: "#1b5e20"
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        titleFont: { family: "Outfit" },
        bodyFont: { family: "Outfit" }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Outfit", size: 10 } }
      },
      y: {
        beginAtZero: true,
        ticks: { font: { family: "Outfit", size: 10 } }
      }
    }
  };

  // 3. Line Chart: Medicine Usage
  const dynamicUsage = Array(12).fill(0);
  localMedicines.forEach(m => {
    const date = new Date(m.createdAt || Date.now());
    const monthIdx = date.getMonth();
    dynamicUsage[monthIdx] += m.quantity || 0;
  });

  const lineDataValues = dynamicUsage;

  const lineData = {
    labels: months,
    datasets: [
      {
        label: "Stock & Usage Levels",
        data: lineDataValues,
        fill: true,
        backgroundColor: "rgba(46, 125, 50, 0.15)",
        borderColor: "#2e7d32",
        tension: 0.4,
        pointBackgroundColor: "#4caf50",
        pointBorderColor: "#ffffff",
        pointHoverRadius: 6
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        titleFont: { family: "Outfit" },
        bodyFont: { family: "Outfit" }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Outfit", size: 10 } }
      },
      y: {
        beginAtZero: true,
        ticks: { font: { family: "Outfit", size: 10 } }
      }
    }
  };

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
            Inventory <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-text-muted mt-1">
            Real-time analytics and medicine expiration tracker.
          </p>
        </div>
        <button
          onClick={() => onViewChange("add-medicine")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-md shadow-md transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add New Medicine
        </button>
      </div>

      {/* AI Summary Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-emerald-600/10 border border-primary/20 p-6 rounded-lg shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300 relative overflow-hidden glass-card">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 animate-pulse">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
            AI Assistant Insights
          </h3>
          <p className="text-text-main text-base font-semibold leading-relaxed">
            You currently have <span className="text-primary font-bold">{totalCount}</span> medicines.{" "}
            <span className={expiringSoon7Count > 0 ? "text-red-650 font-bold" : "text-text-main font-semibold"}>
              {expiringSoon7Count}
            </span>{" "}
            {expiringSoon7Count === 1 ? "medicine expires" : "medicines expire"} within 7 days.{" "}
            <span className="text-primary font-bold">{availableDonationsCount}</span>{" "}
            {availableDonationsCount === 1 ? "medicine is" : "medicines are"} available for donation.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Medicines */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Total Medicines</span>
            <h3 className="text-3xl font-extrabold text-text-main">{totalCount}</h3>
            <span className="text-xs text-text-muted">Active items in shelf</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Expiring Soon */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Expiring Soon (&le; 7 Days)</span>
            <h3 className="text-3xl font-extrabold text-orange-600">{expiringSoon7Count}</h3>
            {expiredCount > 0 ? (
              <span className="text-xs font-semibold text-red-650">{expiredCount} already expired</span>
            ) : (
              <span className="text-xs text-text-muted">Requires action soon</span>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Available Donations */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Available Donations</span>
            <h3 className="text-3xl font-extrabold text-primary">{availableDonationsCount}</h3>
            <span className="text-xs text-text-muted">Listed on marketplace</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Completed Donations */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Completed Donations</span>
            <h3 className="text-3xl font-extrabold text-emerald-700">{completedDonatedCount}</h3>
            <span className="text-xs text-text-muted">Successfully delivered</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics & Reports Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
          Visual <span className="text-primary">Analytics & Reports</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pie Chart: Categories */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Medicine Categories
              </h3>
              <p className="text-xs text-text-muted mt-1 mb-4">Distribution of items across different drug types.</p>
            </div>
            <div className="relative h-64 flex items-center justify-center">
              {pieLabels.length > 0 ? (
                <Pie data={pieData} options={pieOptions} />
              ) : (
                <div className="text-sm text-text-muted font-medium flex items-center justify-center h-full">No data available</div>
              )}
            </div>
          </div>

          {/* Bar Chart: Donations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Monthly Donations
              </h3>
              <p className="text-xs text-text-muted mt-1 mb-4">Tracking successfully completed medical donations.</p>
            </div>
            <div className="relative h-64 flex items-center justify-center">
              {barDataValues.some(val => val > 0) ? (
                <Bar data={barData} options={barOptions} />
              ) : (
                <div className="text-sm text-text-muted font-medium flex items-center justify-center h-full">No data available</div>
              )}
            </div>
          </div>

          {/* Line Chart: Usage */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Medicine Usage Levels
              </h3>
              <p className="text-xs text-text-muted mt-1 mb-4">Monthly dynamic stock levels in inventory.</p>
            </div>
            <div className="relative h-64 flex items-center justify-center">
              {lineDataValues.some(val => val > 0) ? (
                <Line data={lineData} options={lineOptions} />
              ) : (
                <div className="text-sm text-text-muted font-medium flex items-center justify-center h-full">No data available</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Expiry warnings and Notification Feed */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Box 1: Expiry warnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Critical Expiry Alerts
              </h3>
              <button
                onClick={() => onViewChange("medicine-list")}
                className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-1 transition-all"
              >
                View Full Inventory
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {urgentMedicines.length === 0 ? (
              <div className="py-8 text-center text-text-muted space-y-2">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto opacity-70" />
                <p className="font-medium text-text-main">All systems secure</p>
                <p className="text-sm">No medicines are expired or expiring in the next 30 days.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {urgentMedicines.map((m) => {
                  const days = getDaysRemaining(m.expiryDate);
                  let badgeColor = "bg-red-50 text-red-700 border-red-200";
                  let textStatus = `Expires in ${days} days`;

                  if (days < 0) {
                    badgeColor = "bg-red-100 text-red-800 border-red-300 font-bold";
                    textStatus = `EXPIRED (by ${Math.abs(days)} days)`;
                  } else if (days <= 7) {
                    badgeColor = "bg-red-50 text-red-700 border-red-100";
                    textStatus = `Expires in ${days} days (Urgent)`;
                  } else {
                    badgeColor = "bg-yellow-50 text-yellow-800 border-yellow-100";
                    textStatus = `Expires in ${days} days`;
                  }

                  return (
                    <div key={m.medicineId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {m.medicineImage ? (
                          <img 
                            src={m.medicineImage} 
                            alt={m.medicineName} 
                            className="w-12 h-12 rounded object-cover border border-gray-100 flex-shrink-0"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300" }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-text-muted flex-shrink-0">
                            <Activity className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-text-main">{m.medicineName}</h4>
                          <p className="text-xs text-text-muted">{m.manufacturer} • Batch: {m.batchNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeColor}`}>
                          {textStatus}
                        </span>
                        {days >= 0 && !m.availableForDonation && (
                          <button
                            onClick={() => onViewChange("medicine-list")}
                            className="px-3 py-1 text-xs font-bold text-primary border border-primary hover:bg-primary hover:text-white rounded transition-all"
                          >
                            Donate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Box 2: System Notifications Feed */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Automation Events Channel
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onViewChange("automation")}
                  className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-1 transition-all"
                  title="Configure Rules"
                >
                  <Cpu className="w-4 h-4" />
                  Workflows Config
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearFeed}
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Feed
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-text-muted space-y-2">
                <Bell className="w-12 h-12 text-primary mx-auto opacity-40" />
                <p className="font-medium text-text-main font-semibold">Feed is idle</p>
                <p className="text-xs">Incoming event triggers (Expiry Alerts, Donation Confirmation, Medicine Created) will render feeds in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {notifications.slice(0, 5).map((notif) => {
                  let Icon = Clock;
                  let cardClass = "bg-blue-50/50 border-blue-100 text-blue-800";
                  let iconClass = "bg-blue-105 text-blue-600";
                  
                  if (notif.type === "expiry") {
                    Icon = AlertTriangle;
                    cardClass = "bg-red-50/50 border-red-100 text-red-800";
                    iconClass = "bg-red-100 text-red-600";
                  } else if (notif.type === "donation") {
                    Icon = HeartHandshake;
                    cardClass = "bg-emerald-50/50 border-emerald-100 text-emerald-800";
                    iconClass = "bg-emerald-100 text-primary";
                  } else if (notif.type === "added") {
                    Icon = PlusCircle;
                    cardClass = "bg-blue-50/50 border-blue-100 text-blue-800";
                    iconClass = "bg-blue-100 text-blue-600";
                  }

                  return (
                    <div 
                      key={notif.id} 
                      className={`flex gap-3 p-4 rounded-md border text-xs items-start transition-all ${cardClass}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="font-extrabold text-sm truncate">{notif.title}</h4>
                          <span className="font-semibold text-[10px] text-text-muted whitespace-nowrap">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed opacity-90 mt-0.5">{notif.message}</p>
                      </div>
                    </div>
                  );
                })}
                {notifications.length > 5 && (
                  <p className="text-center text-[11px] text-text-muted font-bold pt-2">
                    Showing 5 of {notifications.length} notifications. Open Navbar Bell dropdown to view entire feed history.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Quick Actions & Guides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-bold text-text-main border-b border-gray-100 pb-4">
            Quick Actions
          </h3>

          <div className="space-y-4">
            
            {/* Action 1 */}
            <div 
              onClick={() => onViewChange("add-medicine")}
              className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:border-primary-accent hover:bg-primary-light cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-text-main group-hover:text-primary transition-all">Add Medicine</h4>
                <p className="text-xs text-text-muted">Insert details, expiry date, storage conditions and images.</p>
              </div>
            </div>

            {/* Action 2 */}
            <div 
              onClick={() => onViewChange("medicine-list")}
              className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:border-primary-accent hover:bg-primary-light cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <List className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-text-main group-hover:text-blue-600 transition-all">Manage Inventory</h4>
                <p className="text-xs text-text-muted">Search, edit, delete, and monitor your stocks.</p>
              </div>
            </div>

            {/* Action 3 */}
            <div 
              onClick={() => onViewChange("donation")}
              className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:border-primary-accent hover:bg-primary-light cursor-pointer group transition-all"
            >
              <div className="w-10 h-10 rounded bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-text-main group-hover:text-purple-600 transition-all">Donation Marketplace</h4>
                <p className="text-xs text-text-muted">Redistribute medicines by marking them available to NGOs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

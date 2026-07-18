import React from "react";
import { 
  ClipboardList, 
  AlertTriangle, 
  HeartHandshake, 
  ShieldCheck, 
  Plus, 
  List, 
  Gift, 
  ChevronRight, 
  Activity 
} from "lucide-react";

export default function Dashboard({ medicines, onViewChange }) {
  // Helper: calculate days remaining until expiry
  const getDaysRemaining = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Metrics
  const totalCount = medicines.length;
  
  const expiringSoonCount = medicines.filter(m => {
    const days = getDaysRemaining(m.expiryDate);
    return days <= 30 && days >= 0;
  }).length;

  const expiredCount = medicines.filter(m => {
    const days = getDaysRemaining(m.expiryDate);
    return days < 0;
  }).length;

  const activeDonationsCount = medicines.filter(m => 
    m.availableForDonation && (m.status === "Available" || m.status === "Requested")
  ).length;

  const completedDonatedCount = medicines.filter(m => 
    m.availableForDonation && m.status === "Completed"
  ).length;

  // Recent medications that need attention (expired or expiring in <= 30 days)
  const urgentMedicines = medicines
    .filter(m => getDaysRemaining(m.expiryDate) <= 30)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
    .slice(0, 4);

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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Total Stock</span>
            <h3 className="text-3xl font-extrabold text-text-main">{totalCount}</h3>
            <span className="text-xs text-text-muted">Active items in shelf</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Expiring &lt; 30 Days</span>
            <h3 className="text-3xl font-extrabold text-orange-600">{expiringSoonCount}</h3>
            {expiredCount > 0 ? (
              <span className="text-xs font-semibold text-red-600">{expiredCount} already expired</span>
            ) : (
              <span className="text-xs text-text-muted">Requires action soon</span>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Active Donations</span>
            <h3 className="text-3xl font-extrabold text-primary">{activeDonationsCount}</h3>
            <span className="text-xs text-text-muted">Listed on marketplace</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-text-muted">Donations Saved</span>
            <h3 className="text-3xl font-extrabold text-emerald-700">{completedDonatedCount + 12450}</h3>
            <span className="text-xs text-text-muted">Including benchmark data</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Expiry warnings */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
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

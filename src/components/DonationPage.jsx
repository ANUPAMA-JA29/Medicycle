import React, { useState } from "react";
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight, 
  FileCheck, 
  Truck 
} from "lucide-react";

const CATEGORIES = [
  "All Categories",
  "Antibiotics",
  "Analgesics",
  "Cardiac Care",
  "Diabetic Care",
  "Vitamins/Supplements",
  "First Aid",
  "Gastrointestinal",
  "Other"
];

export default function DonationPage({ donationMedicines, onUpdateStatus, currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Helper: calculate days remaining until expiry
  const getDaysRemaining = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter & Search Logic
  const filteredDonations = donationMedicines.filter((med) => {
    const matchesSearch = 
      med.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "All Categories" || 
      med.category === categoryFilter;
    
    // Do not show expired medicines on the donation platform for safety
    const isNotExpired = getDaysRemaining(med.expiryDate) >= 0;

    return matchesSearch && matchesCategory && isNotExpired;
  });

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary-accent p-6 sm:p-8 rounded-lg shadow-sm text-white space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Donation <span className="text-primary-light">Marketplace</span>
          </h1>
        </div>
        <p className="text-primary-light max-w-2xl text-sm sm:text-base leading-relaxed">
          Safely redistribute surplus medicines. NGOs and verified clinics can request listed medications. Donor pick-ups are automatically coordinated upon request approval.
        </p>
      </div>

      {/* Safety Alert Warning */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-800 text-sm">Regulatory Safety Disclaimer</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            All medications must be in their original packaging, unsealed, and have at least 15 days of valid shelf-life remaining. Narcotics, prescription stimulants, or temperature-critical biologics requiring continuous cold chain may be subject to additional verification.
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search donation listings by name or brand..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Category Selector */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-accent appearance-none cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid displaying donations */}
      {filteredDonations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-text-muted flex items-center justify-center mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-main">No donations available</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto">
              There are currently no active donation packages listed under this category. Mark a medicine in your inventory as "Donate" to list it here!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((med) => {
            const days = getDaysRemaining(med.expiryDate);
            
            // Status Styles
            let statusColor = "bg-primary-light text-primary border-primary/20";
            if (med.status === "Requested") {
              statusColor = "bg-amber-100 text-amber-800 border-amber-200";
            } else if (med.status === "Completed") {
              statusColor = "bg-purple-100 text-purple-800 border-purple-200";
            }

            return (
              <div 
                key={med.medicineId}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Visual */}
                <div className="relative h-44 bg-gray-50 border-b border-gray-100">
                  <img 
                    src={med.medicineImage || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"} 
                    alt={med.medicineName} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500" }}
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1 ${statusColor}`}>
                      {med.status === "Requested" && <Truck className="w-3.5 h-3.5" />}
                      {med.status === "Completed" && <CheckCircle className="w-3.5 h-3.5" />}
                      {med.status === "Available" && <HeartHandshake className="w-3.5 h-3.5" />}
                      Donation {med.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-lg text-text-main leading-tight line-clamp-1">
                        {med.medicineName}
                      </h3>
                      <span className="text-xs bg-gray-100 px-2 rounded-full font-semibold text-text-muted flex-shrink-0">
                        {med.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-text-muted">{med.manufacturer}</p>

                    <div className="grid grid-cols-2 gap-y-1.5 pt-2 border-t border-gray-50 text-xs text-text-muted">
                      <div>Quantity: <span className="font-bold text-text-main">{med.quantity} Units</span></div>
                      <div>Expiry: <span className="font-bold text-text-main">{med.expiryDate} ({days}d)</span></div>
                      <div className="col-span-2">Store: <span className="font-bold text-text-main">{med.storageCondition || "Room Temperature"}</span></div>
                      <div className="col-span-2 truncate">Listed by: <span className="font-medium text-text-main">{med.userId === currentUser?.email ? "You (Donor)" : med.userId}</span></div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="pt-4 border-t border-gray-100">
                    {med.status === "Available" && (
                      <button
                        onClick={() => onUpdateStatus(med.medicineId, "Requested")}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded shadow-sm transition-all duration-200"
                      >
                        Request Medication
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {med.status === "Requested" && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 flex-shrink-0" />
                          NGO requested package. Awaiting courier.
                        </div>
                        {(med.requestedBy === currentUser?.email || med.userId === currentUser?.email) ? (
                          <button
                            onClick={() => onUpdateStatus(med.medicineId, "Completed")}
                            className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded shadow-sm transition-all duration-200"
                          >
                            <FileCheck className="w-4 h-4" />
                            Confirm Pickup & Complete
                          </button>
                        ) : (
                          <div className="text-xs text-text-muted italic text-center">
                            Awaiting pickup confirmation.
                          </div>
                        )}
                      </div>
                    )}

                    {med.status === "Completed" && (
                      <div className="text-sm font-bold text-purple-700 bg-purple-50 p-2.5 rounded border border-purple-100 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 text-purple-600" />
                        Donation Completed Successfully
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

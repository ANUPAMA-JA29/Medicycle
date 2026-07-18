import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  HeartHandshake, 
  Clock, 
  Thermometer, 
  Calendar, 
  Layers, 
  AlertTriangle 
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

export default function MedicineList({ medicines, onEdit, onDelete, onMarkDonate, onViewChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [sortOrder, setSortOrder] = useState("asc"); // asc = expiring soonest first

  // Helper: calculate days remaining until expiry
  const getDaysRemaining = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: render expiry status badge
  const getExpiryBadge = (expiryDateStr) => {
    const days = getDaysRemaining(expiryDateStr);
    
    if (days < 0) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 animate-pulse">
          EXPIRED ({Math.abs(days)}d ago)
        </span>
      );
    } else if (days <= 7) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-100 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Critical ({days} days)
        </span>
      );
    } else if (days <= 30) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100">
          Warning ({days} days)
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-150">
          Safe ({days} days)
        </span>
      );
    }
  };

  // Filter & Search Logic
  const filteredMedicines = medicines
    .filter((med) => {
      const matchesSearch = 
        med.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = 
        categoryFilter === "All Categories" || 
        med.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    // Sort logic
    .sort((a, b) => {
      const dateA = new Date(a.expiryDate);
      const dateB = new Date(b.expiryDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
            Medicine <span className="text-primary">Inventory</span>
          </h1>
          <p className="text-text-muted mt-1">
            Search, filter, and track medicine batches in your inventory.
          </p>
        </div>
        <button
          onClick={() => onViewChange("add-medicine")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-md shadow-md transition-all"
        >
          Add New Medicine
        </button>
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
            placeholder="Search by name, manufacturer, or batch..."
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

          {/* Sort button */}
          <button
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-md text-sm font-semibold text-text-main transition-all"
            title="Sort by expiry date"
          >
            <ArrowUpDown className="w-4 h-4 text-text-muted" />
            Expiry: {sortOrder === "asc" ? "Earliest First" : "Latest First"}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted font-medium">
          Showing <span className="font-bold text-text-main">{filteredMedicines.length}</span> of {medicines.length} items
        </span>
      </div>

      {/* Cards Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 text-text-muted flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-main">No medicines found</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto">
              We couldn't find any medicines matching your search or filters. Try adjusting your inputs.
            </p>
          </div>
          <button
            onClick={() => { setSearchTerm(""); setCategoryFilter("All Categories"); }}
            className="px-4 py-2 bg-primary-light text-primary hover:bg-primary hover:text-white font-bold rounded-md transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((med) => {
            const days = getDaysRemaining(med.expiryDate);
            return (
              <div 
                key={med.medicineId} 
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Image & Badge Overlay */}
                <div className="relative h-48 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                  <img 
                    src={med.medicineImage || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"} 
                    alt={med.medicineName} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500" }}
                  />
                  <div className="absolute top-3 right-3">
                    {getExpiryBadge(med.expiryDate)}
                  </div>
                  {med.availableForDonation && (
                    <div className="absolute bottom-3 left-3">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm ${
                        med.status === "Completed" 
                          ? "bg-purple-100 text-purple-800 border-purple-200" 
                          : med.status === "Requested"
                          ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                          : "bg-primary-light text-primary border-primary/25"
                      }`}>
                        Donating: {med.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-lg text-text-main leading-tight line-clamp-1">
                        {med.medicineName}
                      </h3>
                      <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full font-semibold text-text-muted flex-shrink-0">
                        {med.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-muted">{med.manufacturer}</p>
                    
                    {/* Attributes */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-2 border-t border-gray-50 text-xs">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Qty: <span className="font-semibold text-text-main">{med.quantity} Units</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Expiry: <span className="font-semibold text-text-main">{med.expiryDate}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted col-span-2">
                        <Thermometer className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">Store: <span className="font-semibold text-text-main">{med.storageCondition || "Room Temp"}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted col-span-2">
                        <span className="font-semibold text-text-muted">Batch: <span className="font-bold text-text-main">{med.batchNumber}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(med)}
                        className="p-2 hover:bg-gray-100 rounded-md text-text-muted hover:text-text-main transition-all"
                        title="Edit medicine details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(med.medicineId)}
                        className="p-2 hover:bg-red-50 rounded-md text-red-500 hover:text-red-700 transition-all"
                        title="Delete from inventory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!med.availableForDonation && days >= 0 && (
                      <button
                        onClick={() => onMarkDonate(med.medicineId)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-light hover:bg-primary text-primary hover:text-white text-xs font-bold rounded transition-all duration-200 shadow-sm"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        Mark as Donate
                      </button>
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

import React, { useState, useEffect } from "react";
import { Plus, Save, X, Calendar, Package, Tag, Layers, HelpCircle, Info, Image } from "lucide-react";

const CATEGORIES = [
  "Antibiotics",
  "Analgesics",
  "Cardiac Care",
  "Diabetic Care",
  "Vitamins/Supplements",
  "First Aid",
  "Gastrointestinal",
  "Other"
];

const STORAGE_CONDITIONS = [
  "Room Temperature (15-25°C)",
  "Dry Cool Place (below 20°C)",
  "Refrigerate (2-8°C)",
  "Keep Frozen (below 0°C)",
  "Avoid Direct Sunlight"
];

// Presets for medical images depending on Category to make testing beautiful
const IMAGE_PRESETS = {
  "Antibiotics": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500",
  "Analgesics": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500",
  "Cardiac Care": "https://images.unsplash.com/photo-1607619056574-7b8d304b2b4f?w=500",
  "Diabetic Care": "https://images.unsplash.com/photo-1550572017-edd951b55104?w=500",
  "Vitamins/Supplements": "https://images.unsplash.com/photo-1577401230592-d304da09a586?w=500",
  "First Aid": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500",
  "Gastrointestinal": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500",
  "Other": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500"
};

export default function MedicineForm({ editingMedicine, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    medicineName: "",
    manufacturer: "",
    category: "",
    quantity: "",
    expiryDate: "",
    storageCondition: "",
    batchNumber: "",
    medicineImage: "",
    availableForDonation: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingMedicine) {
      setFormData({
        medicineName: editingMedicine.medicineName || "",
        manufacturer: editingMedicine.manufacturer || "",
        category: editingMedicine.category || "",
        quantity: editingMedicine.quantity || "",
        expiryDate: editingMedicine.expiryDate || "",
        storageCondition: editingMedicine.storageCondition || "",
        batchNumber: editingMedicine.batchNumber || "",
        medicineImage: editingMedicine.medicineImage || "",
        availableForDonation: editingMedicine.availableForDonation || false
      });
    } else {
      setFormData({
        medicineName: "",
        manufacturer: "",
        category: "",
        quantity: "",
        expiryDate: "",
        storageCondition: "",
        batchNumber: "",
        medicineImage: "",
        availableForDonation: false
      });
    }
    setErrors({});
  }, [editingMedicine]);

  // Set default category image if none is specified or when category changes
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const update = { category };
    
    // Auto-populate preset image if current image is empty or was a preset of previous category
    if (!formData.medicineImage || Object.values(IMAGE_PRESETS).includes(formData.medicineImage)) {
      update.medicineImage = IMAGE_PRESETS[category] || IMAGE_PRESETS["Other"];
    }
    
    setFormData(prev => ({ ...prev, ...update }));
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.medicineName.trim()) newErrors.medicineName = "Medicine Name is required.";
    if (!formData.manufacturer.trim()) newErrors.manufacturer = "Manufacturer is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    
    const qty = parseInt(formData.quantity);
    if (!formData.quantity) newErrors.quantity = "Quantity is required.";
    else if (isNaN(qty) || qty <= 0) newErrors.quantity = "Quantity must be a positive number.";
    
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry Date is required.";
    else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const expiry = new Date(formData.expiryDate);
      if (isNaN(expiry.getTime())) {
        newErrors.expiryDate = "Invalid date format.";
      }
    }
    
    if (!formData.batchNumber.trim()) newErrors.batchNumber = "Batch number is required.";
    if (!formData.storageCondition) newErrors.storageCondition = "Storage condition is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const preparedData = {
      ...formData,
      quantity: parseInt(formData.quantity, 10),
      // If no image is provided, use default preset for category
      medicineImage: formData.medicineImage || IMAGE_PRESETS[formData.category] || IMAGE_PRESETS["Other"]
    };
    
    onSubmit(preparedData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100 animate-slideUp">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main">
            {editingMedicine ? "Edit Medicine" : "Add Medicine Details"}
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {editingMedicine ? "Update the medicine specs below." : "Enter inventory specs to track and monitor."}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-text-muted hover:text-text-main p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Medicine Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              Medicine Name *
            </label>
            <input
              type="text"
              name="medicineName"
              value={formData.medicineName}
              onChange={handleChange}
              placeholder="e.g. Paracetamol 650mg, Metformin 500mg"
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent transition-all ${
                errors.medicineName ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {errors.medicineName && <span className="text-xs text-red-600 block font-medium">{errors.medicineName}</span>}
          </div>

          {/* Manufacturer */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-primary" />
              Manufacturer *
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              placeholder="e.g. Pfizer, GSK, Crocin Ltd"
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent transition-all ${
                errors.manufacturer ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {errors.manufacturer && <span className="text-xs text-red-600 block font-medium">{errors.manufacturer}</span>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent bg-white transition-all ${
                errors.category ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="text-xs text-red-600 block font-medium">{errors.category}</span>}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              Quantity (Units) *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g. 30"
              min="1"
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent transition-all ${
                errors.quantity ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {errors.quantity && <span className="text-xs text-red-600 block font-medium">{errors.quantity}</span>}
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent transition-all ${
                errors.expiryDate ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {errors.expiryDate && <span className="text-xs text-red-600 block font-medium">{errors.expiryDate}</span>}
          </div>

          {/* Storage Condition */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary" />
              Storage Condition *
            </label>
            <select
              name="storageCondition"
              value={formData.storageCondition}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent bg-white transition-all ${
                errors.storageCondition ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            >
              <option value="">Select Condition</option>
              {STORAGE_CONDITIONS.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
            {errors.storageCondition && <span className="text-xs text-red-600 block font-medium">{errors.storageCondition}</span>}
          </div>

          {/* Batch Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary" />
              Batch Number *
            </label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              placeholder="e.g. BT9827A"
              className={`w-full px-4 py-2.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent transition-all ${
                errors.batchNumber ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {errors.batchNumber && <span className="text-xs text-red-600 block font-medium">{errors.batchNumber}</span>}
          </div>

          {/* Medicine Image URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Image className="w-4 h-4 text-primary" />
              Medicine Image URL (Auto-prefilled from Category)
            </label>
            <input
              type="text"
              name="medicineImage"
              value={formData.medicineImage}
              onChange={handleChange}
              placeholder="Paste image web URL"
              className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent transition-all"
            />
            <p className="text-xs text-text-muted">A realistic placeholder image will be assigned based on the selected category if left blank.</p>
          </div>

          {/* Available for Donation */}
          <div className="md:col-span-2 flex items-center gap-3 bg-primary-light/40 p-4 rounded-md border border-primary-light mt-2">
            <input
              type="checkbox"
              id="availableForDonation"
              name="availableForDonation"
              checked={formData.availableForDonation}
              onChange={handleChange}
              className="w-5 h-5 rounded text-primary focus:ring-primary-accent border-gray-300 transition-all cursor-pointer"
            />
            <label htmlFor="availableForDonation" className="text-sm cursor-pointer select-none">
              <span className="font-bold text-primary block">Mark as Available for Donation</span>
              <span className="text-xs text-text-muted block">This makes the medicine visible to NGOs and donation distributors.</span>
            </label>
          </div>

        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-gray-200 text-text-main font-semibold rounded-md hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-md shadow-sm transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            {editingMedicine ? "Save Changes" : "Register Medicine"}
          </button>
        </div>
      </form>
    </div>
  );
}

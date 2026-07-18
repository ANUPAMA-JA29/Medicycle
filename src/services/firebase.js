import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

// Firebase configuration using Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase keys are provided
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "undefined";

export let db = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    console.log("Firebase initialized successfully. Using Firestore DB.");
  } catch (error) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", error);
  }
} else {
  console.log("Firebase environment variables not set. Using LocalStorage Mock DB.");
}

// ==========================================
// MOCK DATABASE LAYER (LOCAL STORAGE)
// ==========================================
const MOCK_STORAGE_KEY = "medicycle_medicines_db";

const getMockMedicines = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  return data ? JSON.parse(data) : [
    // Pre-populate with some realistic sample medicines for demo
    {
      medicineId: "mock-1",
      userId: "jane@example.com",
      medicineName: "Amoxicillin 500mg",
      manufacturer: "GlaxoSmithKline",
      category: "Antibiotics",
      quantity: 15,
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days in future
      storageCondition: "Room Temperature",
      batchNumber: "AMX9827",
      status: "Available",
      availableForDonation: true,
      createdAt: new Date().toISOString(),
      medicineImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"
    },
    {
      medicineId: "mock-2",
      userId: "jane@example.com",
      medicineName: "Paracetamol 650mg",
      manufacturer: "Crocin India",
      category: "Analgesics",
      quantity: 30,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days in future (yellow badge)
      storageCondition: "Dry Cool Place",
      batchNumber: "PCT1120",
      status: "None",
      availableForDonation: false,
      createdAt: new Date().toISOString(),
      medicineImage: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"
    },
    {
      medicineId: "mock-3",
      userId: "jane@example.com",
      medicineName: "Insulin Glargine",
      manufacturer: "Sanofi",
      category: "Diabetic Care",
      quantity: 3,
      expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days in future (red badge)
      storageCondition: "Refrigerate (2-8°C)",
      batchNumber: "INS5512",
      status: "Requested",
      availableForDonation: true,
      createdAt: new Date().toISOString(),
      medicineImage: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=300"
    }
  ];
};

const saveMockMedicines = (medicines) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(medicines));
};

// ==========================================
// DB SERVICE METHODS (FIRESTORE OR MOCK)
// ==========================================

/**
 * Add a new medicine document
 */
export const addMedicine = async (userId, medicineData) => {
  const newMed = {
    ...medicineData,
    userId,
    createdAt: new Date().toISOString(),
    status: medicineData.availableForDonation ? "Available" : "None"
  };

  if (db) {
    try {
      const colRef = collection(db, "Medicines");
      const docRef = await addDoc(colRef, {
        ...newMed,
        createdAt: serverTimestamp() // Use server timestamp in Firestore
      });
      // Update with generated ID
      await updateDoc(docRef, { medicineId: docRef.id });
      return { ...newMed, medicineId: docRef.id };
    } catch (e) {
      console.error("Firestore Add Error:", e);
      throw e;
    }
  } else {
    // Mock local storage
    const medicines = getMockMedicines();
    newMed.medicineId = "med_" + Math.random().toString(36).substring(2, 9);
    medicines.push(newMed);
    saveMockMedicines(medicines);
    return newMed;
  }
};

/**
 * Get all medicines for a specific user
 */
export const getMedicines = async (userId) => {
  if (db) {
    try {
      const colRef = collection(db, "Medicines");
      const q = query(colRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          ...data,
          medicineId: docSnap.id,
          // Convert Firestore Timestamp if present
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      });
      return list;
    } catch (e) {
      console.error("Firestore Get Error:", e);
      throw e;
    }
  } else {
    const medicines = getMockMedicines();
    return medicines.filter(m => m.userId === userId);
  }
};

/**
 * Update an existing medicine document
 */
export const updateMedicine = async (medicineId, updatedData) => {
  if (db) {
    try {
      const docRef = doc(db, "Medicines", medicineId);
      await updateDoc(docRef, updatedData);
      return { medicineId, ...updatedData };
    } catch (e) {
      console.error("Firestore Update Error:", e);
      throw e;
    }
  } else {
    const medicines = getMockMedicines();
    const index = medicines.findIndex(m => m.medicineId === medicineId);
    if (index !== -1) {
      medicines[index] = { ...medicines[index], ...updatedData };
      saveMockMedicines(medicines);
      return medicines[index];
    }
    throw new Error("Medicine not found in mock database.");
  }
};

/**
 * Delete a medicine document
 */
export const deleteMedicine = async (medicineId) => {
  if (db) {
    try {
      const docRef = doc(db, "Medicines", medicineId);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error("Firestore Delete Error:", e);
      throw e;
    }
  } else {
    const medicines = getMockMedicines();
    const filtered = medicines.filter(m => m.medicineId !== medicineId);
    saveMockMedicines(filtered);
    return true;
  }
};

/**
 * Get all medicines available for donation (for any user)
 */
export const getDonationMedicines = async () => {
  if (db) {
    try {
      const colRef = collection(db, "Medicines");
      const q = query(colRef, where("availableForDonation", "==", true));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          ...data,
          medicineId: docSnap.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      });
      return list;
    } catch (e) {
      console.error("Firestore Donation Query Error:", e);
      throw e;
    }
  } else {
    const medicines = getMockMedicines();
    return medicines.filter(m => m.availableForDonation === true);
  }
};

/**
 * Update donation status of a medicine (Available, Requested, Completed)
 */
export const updateDonationStatus = async (medicineId, status) => {
  const updateData = { status };
  // If completed, we can mark as no longer available for donation or keep it for records
  if (status === "Completed") {
    // Optional: we can set availableForDonation to false or keep it. Let's keep it but status is completed
  }
  return await updateMedicine(medicineId, updateData);
};

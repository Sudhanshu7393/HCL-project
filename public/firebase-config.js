/**
 * CareConnect360 - Firebase Configuration & Resilient Modular Service Instances
 * Dual-Mode Engine: Seamless Cloud Firebase with Zero-Latency Local Fallback
 * Prevents 400 Bad Request (API_KEY_INVALID) when running in development/demo mode
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword as fbCreateUser, 
  signInWithEmailAndPassword as fbSignIn, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile as fbUpdateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  collection as fbCollection, 
  doc as fbDoc, 
  getDoc as fbGetDoc, 
  getDocs as fbGetDocs, 
  setDoc as fbSetDoc, 
  addDoc as fbAddDoc, 
  updateDoc as fbUpdateDoc, 
  query as fbQuery, 
  where as fbWhere, 
  orderBy as fbOrderBy, 
  onSnapshot as fbOnSnapshot, 
  serverTimestamp as fbServerTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getStorage, 
  ref as fbRef, 
  uploadBytes as fbUploadBytes, 
  getDownloadURL as fbGetDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/**
 * Firebase Production Configuration
 * To connect to your live Firebase project, replace the apiKey and credentials below:
 * Firebase Console -> Project Settings -> General -> Your apps -> Web App
 */
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Check if using placeholder key to prevent Google Identity Toolkit 400 Bad Request error
const isPlaceholderKey = !firebaseConfig.apiKey || 
                         firebaseConfig.apiKey.includes("_Prod_ApiKey_") || 
                         firebaseConfig.apiKey.includes("DEMO") || 
                         firebaseConfig.apiKey.startsWith("YOUR_");

let app, auth, db, storage;
let createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile;
let collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, orderBy, onSnapshot, serverTimestamp;
let ref, uploadBytes, getDownloadURL;

if (!isPlaceholderKey) {
  // Live Cloud Firebase Mode
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    createUserWithEmailAndPassword = fbCreateUser;
    signInWithEmailAndPassword = fbSignIn;
    signOut = fbSignOut;
    onAuthStateChanged = fbOnAuthStateChanged;
    updateProfile = fbUpdateProfile;

    collection = fbCollection;
    doc = fbDoc;
    getDoc = fbGetDoc;
    getDocs = fbGetDocs;
    setDoc = fbSetDoc;
    addDoc = fbAddDoc;
    updateDoc = fbUpdateDoc;
    query = fbQuery;
    where = fbWhere;
    orderBy = fbOrderBy;
    onSnapshot = fbOnSnapshot;
    serverTimestamp = fbServerTimestamp;

    ref = fbRef;
    uploadBytes = fbUploadBytes;
    getDownloadURL = fbGetDownloadURL;
  } catch (err) {
    console.warn("Falling back to local reactive engine:", err);
  }
}

// Resilient In-Memory & LocalStorage Engine (Zero Network Latency & No 400 API_KEY_INVALID)
if (isPlaceholderKey || !auth) {
  app = { name: "CareConnect360-Local" };

  // Reactive Auth State Observers
  const authSubscribers = new Set();

  auth = {
    get currentUser() {
      try {
        const raw = localStorage.getItem("careconnect_auth_session");
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed.user || null;
        }
      } catch (e) {}
      return null;
    }
  };

  onAuthStateChanged = function(authObj, callback) {
    authSubscribers.add(callback);
    // Trigger immediately with current session
    setTimeout(() => {
      callback(auth.currentUser);
    }, 10);
    return () => authSubscribers.delete(callback);
  };

  signInWithEmailAndPassword = async function(authObj, email, password) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const rawUsers = localStorage.getItem("careconnect_registered_users");
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    let user = users.find(u => u.email === cleanEmail);

    if (!user) {
      user = {
        uid: "usr-" + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        displayName: cleanEmail.split("@")[0].replace(/[._]/g, " ")
      };
    }

    const session = {
      user: user,
      profile: {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName,
        role: user.role || (cleanEmail.includes("doc") ? "doctor" : "patient")
      }
    };
    localStorage.setItem("careconnect_auth_session", JSON.stringify(session));
    authSubscribers.forEach(cb => {
      try { cb(user); } catch (e) {}
    });
    return { user };
  };

  createUserWithEmailAndPassword = async function(authObj, email, password) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const user = {
      uid: "usr-" + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      displayName: cleanEmail.split("@")[0].replace(/[._]/g, " ")
    };

    const rawUsers = localStorage.getItem("careconnect_registered_users");
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    users.push(user);
    localStorage.setItem("careconnect_registered_users", JSON.stringify(users));

    const session = {
      user: user,
      profile: {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName,
        role: "patient"
      }
    };
    localStorage.setItem("careconnect_auth_session", JSON.stringify(session));
    authSubscribers.forEach(cb => {
      try { cb(user); } catch (e) {}
    });
    return { user };
  };

  signOut = async function(authObj) {
    localStorage.removeItem("careconnect_auth_session");
    authSubscribers.forEach(cb => {
      try { cb(null); } catch (e) {}
    });
  };

  updateProfile = async function(user, updates) {
    if (user && updates) {
      if (updates.displayName) user.displayName = updates.displayName;
      if (updates.photoURL) user.photoURL = updates.photoURL;
      try {
        const raw = localStorage.getItem("careconnect_auth_session");
        if (raw) {
          const session = JSON.parse(raw);
          if (session.user) {
            session.user.displayName = user.displayName;
            localStorage.setItem("careconnect_auth_session", JSON.stringify(session));
          }
        }
      } catch (e) {}
    }
  };

  // Local Reactive Database (Firestore compatible)
  db = { name: "CareConnect360-LocalDB" };

  doc = function(dbObj, collectionName, id) {
    return { _collection: collectionName, _id: String(id || "") };
  };

  collection = function(dbObj, collectionName) {
    return { _collection: collectionName, _filters: [] };
  };

  query = function(colRef, ...conditions) {
    const q = { _collection: colRef._collection, _filters: [] };
    conditions.forEach(cond => {
      if (cond && cond._isWhere) {
        q._filters.push(cond);
      }
    });
    return q;
  };

  where = function(field, op, val) {
    return { _isWhere: true, field, op, val };
  };

  orderBy = function(field, dir = "asc") {
    return { _isOrderBy: true, field, dir };
  };

  getDoc = async function(docRef) {
    try {
      const tableKey = `careconnect_${docRef._collection}`;
      const raw = localStorage.getItem(tableKey);
      const list = raw ? JSON.parse(raw) : [];
      const item = list.find(x => String(x.id || x.uid) === String(docRef._id));
      if (item) {
        return {
          exists: () => true,
          data: () => ({ ...item }),
          id: docRef._id
        };
      }
    } catch (e) {}
    return {
      exists: () => false,
      data: () => null,
      id: docRef._id
    };
  };

  getDocs = async function(queryRef) {
    const collectionName = queryRef._collection || "appointments";
    let items = [];
    try {
      const tableKey = `careconnect_${collectionName}`;
      const raw = localStorage.getItem(tableKey);
      items = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    // Apply where filters
    if (queryRef._filters && queryRef._filters.length > 0) {
      queryRef._filters.forEach(f => {
        items = items.filter(item => {
          if (f.op === "==") return String(item[f.field]) === String(f.val);
          return true;
        });
      });
    }

    return {
      empty: items.length === 0,
      size: items.length,
      docs: items.map(item => ({
        id: item.id || item.uid,
        data: () => ({ ...item })
      })),
      forEach: function(callback) {
        this.docs.forEach(callback);
      }
    };
  };

  setDoc = async function(docRef, data, options = {}) {
    const collectionName = docRef._collection || "appointments";
    const tableKey = `careconnect_${collectionName}`;
    let items = [];
    try {
      const raw = localStorage.getItem(tableKey);
      items = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    const id = docRef._id;
    const existingIdx = items.findIndex(x => String(x.id || x.uid) === String(id));
    const record = { ...(options.merge && existingIdx >= 0 ? items[existingIdx] : {}), ...data, id: id };
    
    if (existingIdx >= 0) {
      items[existingIdx] = record;
    } else {
      items.unshift(record);
    }
    localStorage.setItem(tableKey, JSON.stringify(items));

    // Dispatch custom storage event for in-tab real-time updates
    window.dispatchEvent(new CustomEvent("careconnect_db_update", { detail: { collection: collectionName } }));
  };

  addDoc = async function(colRef, data) {
    const id = "doc-" + Date.now().toString(36);
    const docRef = doc(db, colRef._collection, id);
    await setDoc(docRef, data);
    return docRef;
  };

  updateDoc = async function(docRef, data) {
    return setDoc(docRef, data, { merge: true });
  };

  onSnapshot = function(queryRef, callback) {
    // Initial fetch
    getDocs(queryRef).then(snapshot => {
      callback(snapshot);
    });

    // Listen to local DB updates
    const handler = (e) => {
      if (e.detail && e.detail.collection === queryRef._collection) {
        getDocs(queryRef).then(snapshot => callback(snapshot));
      }
    };
    window.addEventListener("careconnect_db_update", handler);
    return () => window.removeEventListener("careconnect_db_update", handler);
  };

  serverTimestamp = function() {
    return new Date().toISOString();
  };

  storage = { name: "CareConnect360-LocalStorage" };
  ref = function() { return {}; };
  uploadBytes = async function() { return {}; };
  getDownloadURL = async function() { return ""; };
}

// Export instances and modular methods for consumption across modules
export {
  app,
  auth,
  db,
  storage,
  // Auth Functions
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // Firestore Functions
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  // Storage Functions
  ref,
  uploadBytes,
  getDownloadURL
};

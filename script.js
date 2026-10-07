/* =====================================================================
   "ТҮРГЭН ХАЗАЛТ" — Үндсэн JavaScript файл (бүх глобал логик энд)
   ---------------------------------------------------------------------
   1. foods        — 100 төрлийн цэсний дата (id, name, category, price, img, desc)
   2. CONFIG       — тогтмол утгууд
   3. Хэрэглэгч    — localStorage дээр суурилсан Register / Login / Profile
   4. Сагс         — нэмэх, хасах, хадгалах, нийт дүн, хүргэлт
   5. Хайлт/Шүүлт  — нэр, тайлбар, үнэ, ангилал, эрэмбэ + debounce
   6. Захиалга     — checkout, orders массив, "Миний захиалгууд"
   7. UI           — Toast, Modal, Header, анимаци
   ===================================================================== */

/* ============================ 0. CLOUD BACKEND (FIREBASE REALTIME DATABASE) ============================
   ---------------------------------------------------------------------
   ЗОРИЛГО: localStorage зөвхөн 1 төхөөрөмж дээр ажилладаг тул өөр утас/ПК-аас
   хийсэн захиалга админ дээр харагддаггүй. Энэ хэсэг Firebase Realtime
   Database (үнэгүй) холбож, бүх төхөөрөмжөөс РЕАЛ-ТАЙМ синк хийнэ.

   АЛХАМ 1 — Firebase төсөл үүсгэх (1 удаа, ~3 минут):
     1) https://console.firebase.google.com → "Add project" → нэр: turgun-hazalt
        (Google Analytics унтрааж болно).
     2) Build → Realtime Database → "Create Database" → Location: Singapore
        → Start in TEST mode (дараа нь доорх Rules тавина).
     3) Project Settings (арааны дүрс) → "Your apps" → Web (</>) → App nickname:
        "turgun-hazalt-web" → Register → гарсан firebaseConfig-ийг хуулж аваад
        доорх FIREBASE_CONFIG-д буулгана.
     4) Build → Authentication → Sign-in method → Email/Password → Enable.
        (Энэ нь ямар ч төхөөрөмжөөс ижил имэйл/нууц үгээр нэвтрэх боломж олгоно.
        Auth persistence = LOCAL тул нэг удаа нэвтэрсэн төхөөрөмж дээр
        нэвтэрсэн төлөв ХЭВЭЭР хадгалагдана.)
     5) Realtime Database → Rules → доорх дүрмийг тавиад Publish:
        {
          "rules": {
            "turgun_hazalt": {
              "orders": { ".read": true, ".write": true },
              "users":  { ".read": true, ".write": true }
            }
          }
        }
        (Лабораторийн ажилд зориулсан нээлттэй дүрэм. Продакшнд Auth-тай
        дүрэм болгон чангална уу.)

   АЛХАМ 2 — Доорх FIREBASE_CONFIG-ийг бөглөж, хуудсаа refresh хийнэ.
   Тохируулаагүй үед сайт ХЭВИЙН localStorage горимоор ажиллана (эвдэрдэггүй).
   Тохируулсан үед: захиалга → Cloud-д бичигдэж → админ дээр 1-2 сек-д
   автоматаар гарч ирнэ. Төлөв өөрчлөхөд хэрэглэгчийн "Миний захиалгууд"
   дээр шууд шинэчлэгдэнэ.

   АЮУЛГҮЙ БАЙДЛЫН ТАЙЛБАР:
   - Нууц үг plaintext хадгалагдаж байгаа нь одоогийн лаб кодын логиктай
     нийцүүлсэн түр шийдэл. Продакшнд заавал Firebase Authentication-ийн
     createUserWithEmailAndPassword / signInWithEmailAndPassword ашиглана.
     Доорх код Firebase Auth-ийг илрүүлбэл автоматаар ашиглахыг оролдоно.
   - databaseURL заавал "https://<project-id>-default-rtdb..." хэлбэртэй байна.
   ===================================================================== */

/* >>> ЭНД ӨӨРИЙН FIREBASE CONFIG-ИЙГ БУУЛГАНА УУ (1 удаа) <<<
   Firebase Console (https://console.firebase.google.com) → Project Settings → Your apps → Web → firebaseConfig-ийг хуулж энд буулгана.
   Жишээ:
   const FIREBASE_CONFIG = {
     apiKey: "AIzaSy....", authDomain: "turgun-hazalt.firebaseapp.com",
     databaseURL: "https://turgun-hazalt-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "turgun-hazalt", storageBucket: "turgun-hazalt.appspot.com",
     messagingSenderId: "123456789", appId: "1:123:web:abc..."
   };
   Ижил утгыг admin/admin.js доторх ADMIN_FIREBASE_CONFIG-д хуулна.
   Realtime Database → Rules (лабораторийн нээлттэй дүрэм):
   { "rules": { "orders": { ".read": true, ".write": true }, "users": { ".read": true, ".write": true } } }
   HTML-д CDN аль хэдийн суусан (firebase-app-compat, database-compat, auth-compat v10.12.2).
   Config бөглөсний дараа: А утасны захиалга → db.ref('orders').push(orderData) → Б утасны админ дээр
   db.ref('orders').on('value', ...) -ээр reload-гүй 1-2 сек-д шууд харагдана. */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAc7Ycu-ASeXZ04_ds9_-XKzjcD1YfwwuI",
  authDomain: "turgen-hazalt.firebaseapp.com",
  databaseURL: "https://turgen-hazalt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "turgen-hazalt",
  storageBucket: "turgen-hazalt.firebasestorage.app",
  messagingSenderId: "178635818587",
  appId: "1:178635818587:web:680357f8c93fa685e6217e",
  measurementId: "G-6WV7TSNE06"
};

/* Онлайн өгөгдлийн сангийн үндсэн замууд (шаардлагын дагуу яг 'orders'/'users') */
const ORDERS_PATH = 'orders';
const USERS_PATH = 'users';

/* Cloud төлөв — гараас өөрчлөх шаардлагагүй */
const CLOUD = {
  enabled: false,      // config бөглөгдсөн + Firebase ачаалагдсан
  db: null,            // firebase.database()
  auth: null,          // firebase.auth()
  ordersCache: null,   // Cloud-аас ирсэн захиалгын кэш (бодит цагийн)
  usersCache: null,    // Cloud-аас ирсэн хэрэглэгчийн кэш
  listeners: [],       // ordersUpdated дахин дуудагдах callback-ууд
  status: "local",     // local | connecting | online | error
  _saveTimer: null
};

function isCloudConfigured() {
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL && FIREBASE_CONFIG.projectId);
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("CDN ачаалж чадсангүй: " + src));
    document.head.appendChild(s);
  });
}

/* Cloud статусыг консол + жижиг badge-ээр мэдээлнэ (онлайн/локал ялгах) */
function setCloudStatus(status, detail) {
  CLOUD.status = status;
  if (status === "online") {
    console.info("%c[Cloud] ONLINE — Realtime Database холбогдлоо" + (detail ? " (" + detail + ")" : ""), "color:#16a34a;font-weight:bold");
  } else if (status === "connecting") {
    console.info("[Cloud] Холбогдож байна...");
  } else if (status === "error") {
    console.warn("[Cloud] OFFLINE (localStorage горим):", detail || "");
  }
  try { renderCloudBadge(); } catch (e) {}
}

/* Толгой хэсэгт онлайн/локал badge + мобайл доод сагс (KFC апп маяг) */
function renderCloudBadge() {
  let badge = document.getElementById('cloud-status-badge');
  if (!badge) {
    const slot = document.getElementById('header-actions');
    if (!slot || !slot.parentElement) return;
    badge = document.createElement('span');
    badge.id = 'cloud-status-badge';
    badge.className = 'cloud-badge';
    badge.style.marginRight = '.4rem';
    slot.parentElement.insertBefore(badge, slot);
  }
  const map = {
    online: ['cloud-online', '● ONLINE'],
    connecting: ['cloud-connecting', '● Холбогдож…'],
    error: ['cloud-error', '● OFFLINE'],
    local: ['', '● LOCAL']
  };
  const [cls, txt] = map[CLOUD.status] || map.local;
  badge.className = 'cloud-badge ' + cls;
  badge.innerHTML = '<span class="cloud-dot"></span>' + txt;
  badge.title = CLOUD.status === 'online'
    ? 'Firebase Realtime Database холбогдсон — захиалга онлайнаар синк болно'
    : 'Firebase config хоосон — localStorage горим (төхөөрөмж хооронд синк болохгүй). script.js дэх FIREBASE_CONFIG-ийг бөглөнө үү.';
}

function ensureMobileCartBar() {
  if (document.getElementById('mobile-cart-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'mobile-cart-bar';
  bar.innerHTML = '<span id="mcb-info" style="font-weight:800"></span><button onclick="toggleCart()">Сагс үзэх</button>';
  document.body.appendChild(bar);
}

function updateMobileCartBar() {
  ensureMobileCartBar();
  const bar = document.getElementById('mobile-cart-bar');
  if (!bar) return;
  const c = cartCount();
  const t = cartTotals();
  if (c > 0) {
    bar.classList.add('show');
    const info = document.getElementById('mcb-info');
    if (info) info.textContent = c + ' хоол • ' + money(t.total);
  } else {
    bar.classList.remove('show');
  }
}

function notifyOrdersListeners(orders) {
  CLOUD.listeners.forEach((fn) => { try { fn(orders); } catch (e) { console.warn(e); } });
  window.dispatchEvent(new CustomEvent("ordersUpdated", { detail: { orders } }));
}

/* Firebase SDK (compat) ачаалж, Realtime Database-д холбогдоно. Алдаа гарвал local горимд үлдэнэ. */
async function initCloud() {
  if (!isCloudConfigured()) { setCloudStatus("local", "config хоосон"); return false; }
  if (CLOUD.enabled) return true;
  setCloudStatus("connecting");
  try {
    const V = "10.12.2";
    await loadScriptOnce(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
    await loadScriptOnce(`https://www.gstatic.com/firebasejs/${V}/firebase-database-compat.js`);
    try { await loadScriptOnce(`https://www.gstatic.com/firebasejs/${V}/firebase-auth-compat.js`); } catch (e) { /* auth заавал биш */ }
    if (!window.firebase) throw new Error("firebase SDK ачаалагдсангүй");
    if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(FIREBASE_CONFIG);
    CLOUD.db = firebase.database();
    try {
      if (firebase.auth) {
        CLOUD.auth = firebase.auth();
        // Нэвтэрсэн төлөв төхөөрөмж дээрээ хадгалагдана (LOCAL persistence)
        CLOUD.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
        CLOUD.auth.onAuthStateChanged(() => { /* session sync доор хийгдэнэ */ });
      }
    } catch (e) { console.warn("[Cloud] Auth init алгасав:", e); }
    CLOUD.enabled = true;

    // --- Бодит цагийн захиалгын сонсогч (ШААРДЛАГА: db.ref('orders').on('value', ...) reload-гүй) ---
    // А утас: db.ref('orders').push(orderData) → Б утас (админ): доорх сонсогчоор 1-2 сек-д шууд харагдана.
    CLOUD.db.ref('orders').on('value', (snap) => {
      try {
        const val = snap.val();
        const arr = val ? Object.values(val) : [];
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const first = CLOUD.ordersCache === null;
        CLOUD.ordersCache = arr;
        // Локал нөөц хуулбар (интернэт тасарсан ч сайт ажиллана)
        try { localStorage.setItem(CONFIG.keys.orders, JSON.stringify(arr)); } catch (e) {}
        setCloudStatus("online", arr.length + " захиалга синк болов");
        notifyOrdersListeners(arr.slice());
        // Нээлттэй хуудсыг автоматаар дахин зурна
        try {
          const page = document.body.dataset.page || "";
          if (page === "orders") initOrdersPage();
          if (page === "profile") { /* профайл дээрх сүүлийн захиалгыг шинэчлэх */ }
          if (page === "home") renderStats();
        } catch (e) {}
        if (!first && arr.length > 0) {
          // Шинэ захиалгын toast зөвхөн orders хуудсан дээр нэмэлтээр гарна
        }
      } catch (e) { console.warn("[Cloud] orders parse алдаа:", e); }
    }, (err) => {
      console.warn("[Cloud] orders listen алдаа:", err);
      setCloudStatus("error", String(err && err.message || err));
    });

    // --- Хэрэглэгчийн кэш (нэвтрэх шалгалтад, өөр төхөөрөмжөөс нэвтэрдэг) ---
    const usersRef = CLOUD.db.ref('users');
    usersRef.on('value', (snap) => {
      try {
        const val = snap.val();
        CLOUD.usersCache = val ? Object.values(val) : null;
        if (CLOUD.usersCache) {
          try { localStorage.setItem(CONFIG.keys.users, JSON.stringify(mergeUsersLocalAndCloud())); } catch (e) {}
        }
      } catch (e) {}
    });

    // Холболтын төлөв
    CLOUD.db.ref(".info/connected").on("value", (s) => {
      if (s.val() === true) { if (CLOUD.status !== "online") setCloudStatus("online"); }
    });

    return true;
  } catch (e) {
    setCloudStatus("error", e.message);
    CLOUD.enabled = false;
    return false;
  }
}

function isCloudReady() { return CLOUD.enabled && !!CLOUD.db; }

/* Локал + Cloud хэрэглэгчдийг нэгтгэнэ (давхардлыг имэйлээр арилгана) */
function mergeUsersLocalAndCloud() {
  const local = readJSON(CONFIG.keys.users, []);
  if (!CLOUD.usersCache) return local;
  const map = {};
  [...local, ...CLOUD.usersCache].forEach((u) => { if (u && u.email) map[String(u.email).toLowerCase()] = u; });
  // Админ заавал байх ёстой
  if (!Object.keys(map).some((k) => k === CONFIG.adminEmail)) {
    const localAdmin = local.find((u) => u.email === CONFIG.adminEmail);
    if (localAdmin) map[CONFIG.adminEmail] = localAdmin;
  }
  return Object.values(map);
}

/* Cloud руу нэг захиалга бичих (fire-and-forget — UI гацахгүй)
   ШААРДЛАГА: db.ref('orders').push(orderData) — шинэ захиалга онлайн санд шууд хадгалагдана. */
function cloudUpsertOrder(order) {
  if (!isCloudReady() || !order || !order.id) return;
  try {
    CLOUD.db.ref('orders/' + order.id).set(order).catch((e) => {
      console.warn("[Cloud] order бичихэд алдаа:", e);
    });
  } catch (e) { console.warn("[Cloud] order бичихэд алдаа:", e); }
}

function cloudRemoveOrder(orderId) {
  if (!isCloudReady() || !orderId) return;
  try { CLOUD.db.ref('orders/' + orderId).remove().catch(() => {}); } catch (e) {}
}

/* ============================ 0.1 ONLINE DB API (localStorage-ийг бүрэн орлоно) ============================
   saveOrder   — db.ref('orders').push(orderData) ашиглан онлайнаар хадгална (+local нөөц).
   getOrders   — Cloud кэш бэлэн бол түүнийг (реал-тайм), үгүй бол localStorage-ийг буцаана.
   deleteOrder — db.ref('orders/<id>').remove() + local-аас устгана.
   Эдгээр нь хуучин localStorage функцүүдийг 100% орлоно. */
function saveOrder(orderData) {
  if (!orderData || typeof orderData !== 'object') return Promise.reject(new Error('orderData хоосон'));
  const order = { ...orderData };
  if (!order.id) order.id = genId('ord');
  if (!order.code) order.code = orderCode();
  if (!order.createdAt) order.createdAt = new Date().toISOString();
  if (!order.updatedAt) order.updatedAt = order.createdAt;
  // 1) Локал нөөц (интернэт тасарсан ч ажиллана)
  try {
    const local = readJSON(CONFIG.keys.orders, []);
    const arr = Array.isArray(local) ? local : [];
    const i = arr.findIndex((o) => o && o.id === order.id);
    if (i > -1) arr[i] = order; else arr.unshift(order);
    writeJSON(CONFIG.keys.orders, arr);
    if (CLOUD.ordersCache !== null) {
      const ci = CLOUD.ordersCache.findIndex((o) => o && o.id === order.id);
      if (ci > -1) CLOUD.ordersCache[ci] = { ...order }; else CLOUD.ordersCache.unshift({ ...order });
    }
  } catch (e) {}
  // 2) Онлайн: db.ref('orders').push(orderData) зарчим — id-тай тул set, id-гүй бол push
  if (isCloudReady()) {
    try {
      const db = CLOUD.db;
      if (orderData.id) return db.ref('orders/' + order.id).set(order);
      return db.ref('orders').push(orderData);
    } catch (e) { return Promise.reject(e); }
  }
  return Promise.resolve(order);
}

function deleteOrder(orderId) {
  if (!orderId) return Promise.resolve(false);
  // 1) Local-аас устгана
  try {
    const local = readJSON(CONFIG.keys.orders, []);
    if (Array.isArray(local)) writeJSON(CONFIG.keys.orders, local.filter((o) => o && o.id !== orderId));
    if (CLOUD.ordersCache !== null) CLOUD.ordersCache = CLOUD.ordersCache.filter((o) => o && o.id !== orderId);
  } catch (e) {}
  // 2) Онлайн: db.ref('orders/<id>').remove()
  if (isCloudReady()) {
    try { return CLOUD.db.ref('orders/' + orderId).remove().then(() => true).catch(() => false); }
    catch (e) { return Promise.resolve(false); }
  }
  try {
    const bc = new BroadcastChannel('turgun-hazalt');
    bc.postMessage({ type: 'orders-updated', count: getOrders().length });
    bc.close();
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { orders: getOrders() } }));
  return Promise.resolve(true);
}

/* Cloud руу хэрэглэгч бичих (админ логин өөр төхөөрөмжөөс хадгалагдахад шаардлагатай) */
function cloudUpsertUser(user) {
  if (!isCloudReady() || !user || !user.id) return;
  try {
    const safe = { ...user };
    CLOUD.db.ref('users/' + safe.id).set(safe).catch((e) => {
      console.warn("[Cloud] user бичихэд алдаа:", e);
    });
  } catch (e) {}
}

/* Cloud-аас хэрэглэгчдийг нэг удаа татах (async login-д, өөр төхөөрөмжийн бүртгэл) */
function cloudFetchUsersOnce() {
  return new Promise((resolve) => {
    if (!isCloudReady()) return resolve(null);
    if (CLOUD.usersCache) return resolve(CLOUD.usersCache);
    try {
      CLOUD.db.ref('users').once('value').then((snap) => {
        const val = snap.val();
        const arr = val ? Object.values(val) : [];
        CLOUD.usersCache = arr;
        resolve(arr);
      }).catch(() => resolve(null));
      setTimeout(() => resolve(CLOUD.usersCache), 4000); // timeout хамгаалалт
    } catch (e) { resolve(null); }
  });
}

/* Async нэвтрэх: эхлээд Cloud шалгана (өөр төхөөрөмж дээр бүртгүүлсэн ч нэвтэрнэ) */
async function loginUserAsync(email, password) {
  const cleanEmail = String(email).trim().toLowerCase();
  // 1) Cloud оролдлого (хурдан timeout-той)
  if (isCloudReady()) {
    try {
      const users = await cloudFetchUsersOnce();
      const list = users || mergeUsersLocalAndCloud();
      const user = list.find((u) => String(u.email).toLowerCase() === cleanEmail);
      if (!user) return { ok: false, error: "Ийм имэйл хаягтай хэрэглэгч олдсонгүй." };
      if (user.password !== String(password)) return { ok: false, error: "Нууц үг буруу байна." };
      // Firebase Auth session (боломжтой бол) — төхөөрөмж дээр persistence
      try {
        if (CLOUD.auth) {
          await CLOUD.auth.signInWithEmailAndPassword(cleanEmail, String(password)).catch(() => {});
        }
      } catch (e) {}
      writeJSON(CONFIG.keys.session, { userId: user.id, email: user.email, at: new Date().toISOString(), via: "cloud" });
      // Локал кэшийг шинэчилнэ
      const local = readJSON(CONFIG.keys.users, []);
      if (!local.some((u) => u.id === user.id)) { local.push(user); saveUsersLocalOnly(local); }
      return { ok: true, user };
    } catch (e) { console.warn("[Cloud] login алдаа, local руу уналаа:", e); }
  }
  // 2) Local fallback (эх кодын логик хэвээр)
  return loginUser(email, password);
}

/* Async бүртгэл: Local + Cloud хоёуланд бичнэ */
async function registerUserAsync({ name, email, phone, password, address = "" }) {
  const cleanEmail = String(email).trim().toLowerCase();
  // Cloud давхардал шалгалт
  if (isCloudReady()) {
    try {
      const users = await cloudFetchUsersOnce();
      const list = users || mergeUsersLocalAndCloud();
      if (list.some((u) => String(u.email).toLowerCase() === cleanEmail)) {
        return { ok: false, error: "Энэ имэйл хаягаар бүртгэл аль хэдийн үүссэн байна." };
      }
    } catch (e) {}
  }
  const res = registerUser({ name, email, phone, password, address });
  if (res.ok) {
    cloudUpsertUser(res.user);
    // Firebase Auth-д давхар үүсгэх (боломжтой бол, алдаа гарвал зүгээр — RTDB нь гол эх сурвалж)
    try {
      if (CLOUD.auth) {
        await CLOUD.auth.createUserWithEmailAndPassword(cleanEmail, String(password)).catch(() => {});
      }
    } catch (e) {}
  }
  return res;
}

/* saveUsers-ийн local-only хувилбар (рекурсээс сэргийлэх) */
function saveUsersLocalOnly(users) {
  return writeJSON(CONFIG.keys.users, users);
}

/* ============================ 1. ЦЭСНИЙ ДАТА ============================ */
const foods = [
  { id: 1,   name: "Сонгодог Чизбургер",            category: "burger",  price: 12500, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", desc: "Шүүслэг үхрийн махан котлет, хайлсан чеддар бяслаг, гараар хийсэн тусгай сүмс — нэг хазалтад л амт нээгдэнэ." },
  { id: 2,   name: "Давхар Махтай Бургер",          category: "burger",  price: 16900, img: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=500&q=80", desc: "Хоёр давхар шүүслэг котлет, давхар бяслаг, шаржигнуур өргөст хэмх — өлсгөлөнг нэг мөрөнд шийднэ." },
  { id: 3,   name: "Халуун Ногоотой Чили Бургер",   category: "burger",  price: 14500, img: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=500&q=80", desc: "Халуун чили сүмс, халапеньо чинжүү, хайлсан бяслаг — амьсгал авах завсар ч үлдээхгүй." },
  { id: 4,   name: "BBQ Бейкон Бургер",             category: "burger",  price: 15900, img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=80", desc: "Утаатай шарсан бейкон, чихэрлэг исгэлэн BBQ сүмс, шүүслэг котлет." },
  { id: 5,   name: "Мөөгтэй Швейц Бургер",          category: "burger",  price: 16500, img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=500&q=80", desc: "Цөцгийд шарсан шантрэл мөөг, хайлсан швейцар бяслаг, зөөлөн талх." },
  { id: 6,   name: "Авокадо Веган Бургер",          category: "burger",  price: 14000, img: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=500&q=80", desc: "Ургамлын уурагтай котлет, шарсан авокадо, шинэхэн салат навч — хөнгөн ч дүүрэн." },
  { id: 7,   name: "Гавайн Ананастай Бургер",       category: "burger",  price: 15000, img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=80", desc: "Гриллдэж амталсан ананас, шүүслэг үхрийн мах — халуун ба чихэрлэгийн төгс зохицол." },
  { id: 8,   name: "Triple Делакс Бургер",          category: "burger",  price: 19900, img: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=500&q=80", desc: "Гурван давхар үхрийн котлет, гурвалсан чеддар, карамель сонгино — жинхэнэ баатар." },
  { id: 9,   name: "Шарсан Төмс (L)",               category: "burger",  price: 6500,  img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80", desc: "Гаднаа шаржигнуур, дотроо зөөлөн, амтлагч цацалтай зузаан шарсан төмс." },
  { id: 10,  name: "Сонгины Цагираг",               category: "burger",  price: 7500,  img: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=500&q=80", desc: "Алтан шаргал болтол шарсан чихэрлэг сонгины шаржигнуур цагираг." },
  { id: 11,  name: "Бяслагтай Шарсан Төмс",         category: "burger",  price: 8900,  img: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=500&q=80", desc: "Хайлсан чеддар бяслаганд живсэн, шаржигнуур шарсан төмс." },
  { id: 12,  name: "Бейконтой Чили Төмс",           category: "burger",  price: 9900,  img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80", desc: "Шаржигнуур бейкон, халуун чили соус, ногоон сонгино." },
  { id: 13,  name: "Моцарелла Бяслагтай Савх",      category: "burger",  price: 8900,  img: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?auto=format&fit=crop&w=500&q=80", desc: "Сунадаг моцарелла бяслаг, алтан шаржигнуур бүрхүүл, маринара соус." },
  { id: 14,  name: "Картофель по-деревенски",       category: "burger",  price: 7900,  img: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=500&q=80", desc: "Арьстайгаа том хэрчмээр шарсан, олон амтлагчийн холимогтой төмс." },
  { id: 15,  name: "Тар-Тар Соустай Бургер",        category: "burger",  price: 13900, img: "https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=500&q=80", desc: "Зөөлөн тар-тар соус, шүүслэг үхрийн мах, маринадласан өргөст хэмх." },
  { id: 16,  name: "Сонгинотой Дүүрэн Бургер",      category: "burger",  price: 13500, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500&q=80", desc: "Удаан карамельдсан улаан сонгино, бальзам соус, хайлсан бяслаг." },
  { id: 17,  name: "Фиш (Загасан) Бургер",          category: "burger",  price: 12900, img: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=500&q=80", desc: "Алтан шаржигнуур бүрээстэй загасны филе, лимон-дилл соус." },
  { id: 18,  name: "Бяслагтай Сүвэн Төмс",          category: "burger",  price: 8500,  img: "https://images.unsplash.com/photo-1630431341973-02e1b662ec35?auto=format&fit=crop&w=500&q=80", desc: "Вафли хэлбэрт зүссэн төмс, хайлсан бяслаган соус, ногоон сонгино." },
  { id: 19,  name: "Сорвитой Грилл Бургер",         category: "burger",  price: 15500, img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80", desc: "Ил гал дээр гриллдсэн үхрийн мах, утаатай амт, шарсан сонгино." },
  { id: 20,  name: "Мини Слайдер Бургер (3ш)",      category: "burger",  price: 14900, img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=500&q=80", desc: "Гурван жижиг бургер, гурван өөр амт — хуваалцахад тохиромжтой." },
  { id: 21,  name: "Шаржигнуур Далавч (6ш)",        category: "chicken", price: 15500, img: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=500&q=80", desc: "Халуун ногоотой хачиртай, гаднаа шаржигнуур тахианы далавч." },
  { id: 22,  name: "Шаржигнуур Далавч (12ш)",       category: "chicken", price: 28000, img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=500&q=80", desc: "Гэр бүлийн багц — 12ш далавч, хоёр төрлийн дип соустай." },
  { id: 23,  name: "Тахианы Страйпс (4ш)",          category: "chicken", price: 11000, img: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=500&q=80", desc: "Ясгүй цээж мах, тусгай амтлагчийн бүрхүүл, дип соустай." },
  { id: 24,  name: "Тахианы Наггетс (8ш)",          category: "chicken", price: 9500,  img: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=500&q=80", desc: "Бяцхан шаржигнуур хазалтууд — хүүхдүүдийн хамгийн дуртай сонголт." },
  { id: 25,  name: "Солонгос Чихэрлэг Тахиа",       category: "chicken", price: 18500, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=500&q=80", desc: "Солонгос чили-зөгийн балтай гялалзсан соус, шаржигнуур тахиа." },
  { id: 26,  name: "Сонгинотой Амталсан Тахиа",     category: "chicken", price: 19000, img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=500&q=80", desc: "Ногоон сонгино, цуутай соусанд амталсан зөөлөн тахиа." },
  { id: 27,  name: "BBQ Глейзтэй Тахианы Мөч",      category: "chicken", price: 16500, img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=500&q=80", desc: "BBQ сүмсээр гялалзсан 4ш тахианы мөч, кунжуттай." },
  { id: 28,  name: "Халуун Попкорн Тахиа",          category: "chicken", price: 10500, img: "https://images.unsplash.com/photo-1585325701165-351af916e581?auto=format&fit=crop&w=500&q=80", desc: "Баттермилк болон халуун чилитэй жижиг шаржигнуур хазалтууд." },
  { id: 29,  name: "Тахианы Цээж Махтай Сэндвич",   category: "chicken", price: 13000, img: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=500&q=80", desc: "Гриллдсэн цээж мах, айсберг салат, майонезат сүмс." },
  { id: 30,  name: "Бүтэн Шарсан Тахиа",            category: "chicken", price: 34500, img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500&q=80", desc: "Амтлагчаар нэвт норсон, арьс нь алтан шаржигнуур бүтэн тахиа." },
  { id: 31,  name: "Сармистай Шарсан Тахиа",        category: "chicken", price: 18900, img: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=500&q=80", desc: "Сармисны өтгөн соус, ногоон ургамлын үнэртэй шарсан тахиа." },
  { id: 32,  name: "Баффало Тахианы Далавч",        category: "chicken", price: 16000, img: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=500&q=80", desc: "Америк Баффало соус, цөцгийн диптэй халуун чили далавч." },
  { id: 33,  name: "Тахианы Махтай Цезарь Салат",   category: "chicken", price: 12500, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80", desc: "Грилл тахиа, пармезан, шаржигнуур сухари, цезарь соус." },
  { id: 34,  name: "Тахианы Махтай Бөгж (Rings)",   category: "chicken", price: 11500, img: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=500&q=80", desc: "Цээж махаар хийсэн шаржигнуур цагираг, дип соустай." },
  { id: 35,  name: "Амталсан Тахианы Тавхай",       category: "chicken", price: 14500, img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=500&q=80", desc: "Тусгай дорнод жороор удаан амталсан, зөөлөн болтол жигнэсэн тахианы тавхай." },
  { id: 36,  name: "Пепперони Пицца (30см)",        category: "pizza",   price: 24500, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80", desc: "Пепперони хиам, моцарелла, орегано — нимгэн зузаан талх." },
  { id: 37,  name: "Маргарита Пицца (30см)",        category: "pizza",   price: 21000, img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80", desc: "Шинэхэн базилик, моцарелла, улаан лоолийн томат соус." },
  { id: 38,  name: "BBQ Тахианы Пицца (30см)",      category: "pizza",   price: 26500, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80", desc: "BBQ соус, шарсан тахиа, улаан сонгино, моцарелла." },
  { id: 39,  name: "4 Бяслагтай Пицца (30см)",      category: "pizza",   price: 27000, img: "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=500&q=80", desc: "Моцарелла, чеддар, пармезан, дор блю — дөрвөн бяслагын найр." },
  { id: 40,  name: "Махтай Супер Пицца (30см)",     category: "pizza",   price: 28900, img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=500&q=80", desc: "Үхрийн мах, бейкон, пепперони — мах идэгчдийн сонголт." },
  { id: 41,  name: "Гавайн Пицца (30см)",           category: "pizza",   price: 23500, img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80", desc: "Ананас, гахайн мах, бяслаг — чихэрлэг ба давсалсан тэнцвэр." },
  { id: 42,  name: "Мөөгтэй Салями Пицца",          category: "pizza",   price: 25000, img: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=500&q=80", desc: "Шинэхэн мөөг, салями хиам, бяслаган давхарга." },
  { id: 43,  name: "Халуун Мексик Пицца",           category: "pizza",   price: 26000, img: "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=500&q=80", desc: "Чили чинжүү, үхрийн митбол, халапеньо — халуун амтлагчдад." },
  { id: 44,  name: "Клаб Сэндвич",                  category: "pizza",   price: 12900, img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80", desc: "Гурвалжин талх, гахайн мах, өндөг, шинэ ногоо." },
  { id: 45,  name: "Филадельфия Стейк Сэндвич",     category: "pizza",   price: 15900, img: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=500&q=80", desc: "Хэрчсэн үхрийн мах, хайлсан бяслаг, шарсан сонгино." },
  { id: 46,  name: "Туна Загастай Сэндвич",         category: "pizza",   price: 11500, img: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=500&q=80", desc: "Туна загасны салат, өргөст хэмх, майонез." },
  { id: 47,  name: "Мексик Буррито",                category: "pizza",   price: 13900, img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80", desc: "Тортиллад ороосон үхрийн мах, буурцаг, бяслаг, сальса." },
  { id: 48,  name: "Тахианы Твистер Ороомог",       category: "pizza",   price: 12500, img: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=500&q=80", desc: "Лаваш талханд ороосон шарсан тахиа, ногоо, соус." },
  { id: 49,  name: "Гриллдсэн Бяслагтай Тост",      category: "pizza",   price: 8900,  img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500&q=80", desc: "Гурван төрлийн бяслаг, цөцгийн тосонд гриллдсэн тост." },
  { id: 50,  name: "Бейкон Панини Сэндвич",         category: "pizza",   price: 13500, img: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=500&q=80", desc: "Итали панини талх, шарсан бейкон, хайлсан чеддар." },
  { id: 51,  name: "Вегетариан Тортилла",           category: "pizza",   price: 10900, img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80", desc: "Гриллдэж амталсан ногоо, хумус соус, ороомог." },
  { id: 52,  name: "Салмон Загастай Бэйгл",         category: "pizza",   price: 16900, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80", desc: "Утаатай салмон, крим чиз, капертай бэйгл." },
  { id: 53,  name: "Итали Капрезе Панини",          category: "pizza",   price: 12900, img: "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=500&q=80", desc: "Моцарелла, песто соус, улаан лооль, базилик." },
  { id: 54,  name: "BBQ Свиной Сэндвич",            category: "pizza",   price: 14500, img: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=500&q=80", desc: "Утсан гахайн мах, BBQ соус, коул слоу." },
  { id: 55,  name: "Мини Пицца Сет (3ш)",           category: "pizza",   price: 29900, img: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=500&q=80", desc: "Гурван өөр амттай 15см мини пицца — хамтдаа амтлах багц." },
  { id: 56,  name: "Рамен Гогцоотой Шөл",           category: "asian",   price: 14500, img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80", desc: "Япон маягийн гахайн махтай рамен, өндөг, ногоо." },
  { id: 57,  name: "Кимбап (Солонгос Ороомог)",     category: "asian",   price: 9900,  img: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=500&q=80", desc: "Үхрийн мах, ногоо, далайн замагтай солонгос ороомог." },
  { id: 58,  name: "Токпокки (Халуун Төртэй)",      category: "asian",   price: 12500, img: "https://images.unsplash.com/photo-1583224964978-2257b960c3d3?auto=format&fit=crop&w=500&q=80", desc: "Халуун чили соустай будааны боорцог, загасан бялуу." },
  { id: 59,  name: "Терияки Үхрийн Махтай Будаа",   category: "asian",   price: 16500, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80", desc: "Терияки соус, үхрийн мах, агшаасан цагаан будаа." },
  { id: 60,  name: "Пад Тай Гогцоо (Pad Thai)",     category: "asian",   price: 15900, img: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80", desc: "Тайланд гогцоо, сам хорхой, самхар, лимон." },
  { id: 61,  name: "Шарсан банш (Gyoza 8ш)",        category: "asian",   price: 11000, img: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=500&q=80", desc: "Япон шарсан банш, соя-цуутай соус." },
  { id: 62,  name: "Сам Хорхойтой Шарсан Будаа",    category: "asian",   price: 15500, img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=500&q=80", desc: "Тусгай амтлагчтай шарсан будаа, сам хорхой, өндөг." },
  { id: 63,  name: "Свиной Кацу Карри Будаа",       category: "asian",   price: 17500, img: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=500&q=80", desc: "Шаржигнуур гахайн мах, япон карри соус, ууртай будаа." },
  { id: 64,  name: "Якисоба Гогцоо",                category: "asian",   price: 14000, img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80", desc: "Шарсан ногоо, махтай япон соустай зузаан гогцоо." },
  { id: 65,  name: "Том Ям Шөл (Tom Yum)",          category: "asian",   price: 18900, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=80", desc: "Халуун исгэлэн Тайланд шөл, сам хорхой, лемонграсс." },
  { id: 66,  name: "Сам хорхойн Темпура (5ш)",      category: "asian",   price: 16900, img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80", desc: "Шаржигнуур бүрээстэй том сам хорхой, дип соус." },
  { id: 67,  name: "Халуун Ногоотой Булгоги",       category: "asian",   price: 17900, img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=80", desc: "Амталсан солонгос үхрийн мах, кимчи, будаа." },
  { id: 68,  name: "Дим Сам Банш (Dim Sum 6ш)",     category: "asian",   price: 13500, img: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=500&q=80", desc: "Ууранд жигнасан хятад банш, соя соус." },
  { id: 69,  name: "Вонтон Шөл (Wonton Soup)",      category: "asian",   price: 12900, img: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80", desc: "Жижиг банштай цэвэр шөл, ногоон сонгино." },
  { id: 70,  name: "Такояки Бөмбөлөг (6ш)",         category: "asian",   price: 11900, img: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=500&q=80", desc: "Далайн наймаалжтай япон боорцог, кацубуши цацалтай." },
  { id: 71,  name: "Шоколадтай Донат",              category: "dessert", price: 4500,  img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80", desc: "Зөөлөн кремтэй, шоколадан глазурьтай шинэ донат." },
  { id: 72,  name: "Гүзээлзгэнэтэй Донат",          category: "dessert", price: 4500,  img: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=500&q=80", desc: "Гүзээлзгэний глазурь, өнгөт чимэглэлтэй донат." },
  { id: 73,  name: "Нью-Йорк Чизкейк",              category: "dessert", price: 8500,  img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80", desc: "Зөөлөн сүүн бяслаган бялуу, жигнэмэг суурьтай." },
  { id: 74,  name: "Шоколадтай Лава Торт",          category: "dessert", price: 7900,  img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80", desc: "Дотор нь халуун шоколад урсах, дулаан тортик." },
  { id: 75,  name: "Алимны Чихэрлэг Пирог (Apple Pie)", category: "dessert", price: 6500, img: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=500&q=80", desc: "Шарах шүүгээнд жигнэсэн алимтай пирог, синамон үнэртэй." },
  { id: 76,  name: "Ванильтай Сүүн Зайрмаг",        category: "dessert", price: 3500,  img: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=500&q=80", desc: "Сүүн ванилийн амттай зөөлөн конусан зайрмаг." },
  { id: 77,  name: "Шоколадтай Чурос (6ш)",         category: "dessert", price: 7500,  img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=500&q=80", desc: "Синнамонтой шарсан испани чурос, шоколадан дип." },
  { id: 78,  name: "Тирамису Торт",                 category: "dessert", price: 8900,  img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80", desc: "Итали кофе, маскарпоне бяслаган торт, какао цацалтай." },
  { id: 79,  name: "Брауни (Brownie)",              category: "dessert", price: 5500,  img: "https://images.unsplash.com/photo-1607920591413-4ec007e70023?auto=format&fit=crop&w=500&q=80", desc: "Өтгөн шоколадтай, гаднаа нимгэн хальстай брауни." },
  { id: 80,  name: "Вафли ба Ваниль Зайрмаг",       category: "dessert", price: 9500,  img: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=500&q=80", desc: "Бельги вафли, шинэ жимс, ваниль зайрмагтай." },
  { id: 81,  name: "Франц Макарон (Macaron 5ш)",    category: "dessert", price: 11900, img: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=500&q=80", desc: "Төрөл бүрийн жимсний амттай, гаднаа хруст, дотроо зөөлөн франц макарон." },
  { id: 82,  name: "Круассан Шоколадтай",           category: "dessert", price: 5900,  img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80", desc: "Франц шоштой, давхаргатай зөөлөн круассан." },
  { id: 83,  name: "Панкейк ба Зөгийн Бал",         category: "dessert", price: 8900,  img: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=500&q=80", desc: "Давхар америк панкейк, зөгийн бал, цөцгийн тос." },
  { id: 84,  name: "Жимсний Тарт (Fruit Tart)",     category: "dessert", price: 7900,  img: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=500&q=80", desc: "Шинэхэн жимс, ванилийн кремтэй жигнэмэг." },
  { id: 85,  name: "Манго Пуддинг",                 category: "dessert", price: 6500,  img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=500&q=80", desc: "Амтат манго жимсний зөөлөн, сэрүүн пуддинг." },
  { id: 86,  name: "Кока Кола 0.5L",                category: "drink",   price: 3500,  img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80", desc: "Мөстэй хөргөсөн, хийтэй сонгодог ундаа." },
  { id: 87,  name: "Спрайт 0.5L",                   category: "drink",   price: 3500,  img: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=500&q=80", desc: "Лимоны амттай, мөстэй хийтэй ундаа." },
  { id: 88,  name: "Фанта 0.5L (Orange Fanta)",     category: "drink",   price: 3500,  img: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=500&q=80", desc: "Жүржийн амттай хийтэй ундаа." },
  { id: 89,  name: "Шоколадтай Шейк",               category: "drink",   price: 7900,  img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=80", desc: "Зайрмаг, шоколадтай өтгөн, хүйтэн шейк." },
  { id: 90,  name: "Гүзээлзгэний Шейк",             category: "drink",   price: 7900,  img: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=500&q=80", desc: "Гүзээлзгэний амттай сүүн шейк." },
  { id: 91,  name: "Американо Кофе",                category: "drink",   price: 5500,  img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80", desc: "Шинээр татсан эспрессо, халуун ус." },
  { id: 92,  name: "Латте (Iced/Hot Latte)",        category: "drink",   price: 6900,  img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=80", desc: "Зөөлөн сүү, эспрессо, гоёмсог латте урлаг." },
  { id: 93,  name: "Лимонтой Мөстэй Цай",           category: "drink",   price: 4500,  img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80", desc: "Лимонтой хүйтэн цай, мөсөн шоотой." },
  { id: 94,  name: "Тарвастай Мохито Смути",        category: "drink",   price: 8500,  img: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=80", desc: "Тарвас, гаатай сэргээштэй ундаа." },
  { id: 95,  name: "Цэвэр Ус (Mineral Water 0.5L)", category: "drink",   price: 1500,  img: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=500&q=80", desc: "Байгалийн цэвэр савласан ус." },
  { id: 96,  name: "Капучино Кофе",                 category: "drink",   price: 6500,  img: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=500&q=80", desc: "Өтгөн сүүн хөөс, эспрессо, какао цацалтай." },
  { id: 97,  name: "Мача Латте (Matcha Green Tea)", category: "drink",   price: 7500,  img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=500&q=80", desc: "Япон ногоон цай, сүүтэй латте." },
  { id: 98,  name: "Карамель Маккиато",             category: "drink",   price: 7500,  img: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=500&q=80", desc: "Карамель сироп, эспрессо, сүүн хөөс." },
  { id: 99,  name: "Жүржийн Шинэхэн Шүүс (Orange Juice)", category: "drink", price: 6900, img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=80", desc: "Шинээр шахсан 100% жүржийн шүүс." },
  { id: 100, name: "Ред Булл (Red Bull 0.25L)",     category: "drink",   price: 6500,  img: "https://images.unsplash.com/photo-1527960471264-932f39eb5846?auto=format&fit=crop&w=500&q=80", desc: "Эрчим хүч өгөх сэргээштэй ундаа." }
];

/* ============================ 1.2 БАГЦ ХООЛНУУД (COMBO / VALUE SETS) ============================
   Дангаар нь авахаас илүү хямд. `includes` дотор багтсан хоол тус бүрийн
   үнэ, тоо хэмжээ байх ба хэмнэлтийн хувийг автоматаар бодож харуулна. */
const comboSets = [
  {
    id: 1001, name: "Найзуудын багц", category: "combo", isCombo: true,
    tag: "Хамгийн эрэлттэй", serves: "3-4 хүн",
    price: 45900,
    img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80",
    desc: "Найзуудтайгаа хуваалцахад төгс: хоёр давхар бургер, шаржигнуур төмс, мөстэй кола — бүгд нэг багцад багтсан.",
    includes: [
      { name: "Давхар Махтай Бургер", qty: 2, price: 16900 },
      { name: "Шарсан Төмс (L)", qty: 2, price: 6500 },
      { name: "Кока Кола 0.5L", qty: 2, price: 3500 }
    ]
  },
  {
    id: 1002, name: "Гэр бүлийн багц", category: "combo", isCombo: true,
    tag: "Гэр бүлд", serves: "4-5 хүн",
    price: 55900,
    img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80",
    desc: "Гэр бүлийн оройн зоог: том пепперони пицца, 12ш шаржигнуур далавч, 1L ундаа болон шарсан төмс цугтаа.",
    includes: [
      { name: "Пепперони Пицца (30см)", qty: 1, price: 24500 },
      { name: "Шаржигнуур Далавч (12ш)", qty: 1, price: 28000 },
      { name: "Кока Кола 1L", qty: 1, price: 6900 },
      { name: "Шарсан Төмс (L)", qty: 1, price: 6500 }
    ]
  },
  {
    id: 1003, name: "Хосын багц", category: "combo", isCombo: true,
    tag: "Романтик", serves: "2 хүн",
    price: 40900,
    img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=500&q=80",
    desc: "Хоёр хүний амттай үдэш: хоёр чизбургер, шаржигнуур наггетс, хоёр сүүн шейк — хамтдаа хямдралтай.",
    includes: [
      { name: "Сонгодог Чизбургер", qty: 2, price: 12500 },
      { name: "Тахианы Наггетс (6ш)", qty: 1, price: 7500 },
      { name: "Гүзээлзгэний Шейк", qty: 2, price: 7900 }
    ]
  },
  {
    id: 1004, name: "Office Lunch Set", category: "combo", isCombo: true,
    tag: "Ажлын үдийн", serves: "4 хүн",
    price: 82900,
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80",
    desc: "Оффисын үдийн цайны хамгийн хэмнэлттэй шийдэл: 4 бургер, 4 шарсан төмс, 4 американо кофе.",
    includes: [
      { name: "Сонгодог Чизбургер", qty: 4, price: 12500 },
      { name: "Шарсан Төмс (L)", qty: 4, price: 6500 },
      { name: "Американо Кофе", qty: 4, price: 5500 }
    ]
  },
  {
    id: 1005, name: "Party Box", category: "combo", isCombo: true,
    tag: "Том багц", serves: "6-8 хүн",
    price: 93900,
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80",
    desc: "Төрсөн өдөр, баяр ёслолд зориулсан том багц: бүтэн шарсан тахиа, пицца, төмс, 6 кола болон амттан.",
    includes: [
      { name: "Бүтэн Шарсан Тахиа", qty: 1, price: 34500 },
      { name: "Пепперони Пицца (30см)", qty: 1, price: 24500 },
      { name: "Шарсан Төмс (L)", qty: 2, price: 6500 },
      { name: "Кока Кола 0.5L", qty: 6, price: 3500 },
      { name: "Шоколадтай Донат", qty: 4, price: 4500 }
    ]
  },
  {
    id: 1006, name: "Бургер & Кофе Сет", category: "combo", isCombo: true,
    tag: "Хурдан үдийн", serves: "1 хүн",
    price: 21900,
    img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=500&q=80",
    desc: "Ганцаараа хурдан үдэх хамгийн ашигтай сонголт: чизбургер, шарсан төмс, капучино кофе.",
    includes: [
      { name: "Сонгодог Чизбургер", qty: 1, price: 12500 },
      { name: "Шарсан Төмс (L)", qty: 1, price: 6500 },
      { name: "Капучино Кофе", qty: 1, price: 6500 }
    ]
  },
  {
    id: 1007, name: "Ази Хослол Багц", category: "combo", isCombo: true,
    tag: "Дорнодын амт", serves: "2 хүн",
    price: 25900,
    img: "https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&w=500&q=80",
    desc: "Дорнодын амтыг хосоор амтлаарай: рамен шөл, шарсан гёоза банш, лимонтой мөстэй цай.",
    includes: [
      { name: "Рамен Гогцоотой Шөл", qty: 1, price: 14500 },
      { name: "Шарсан банш (Gyoza 8ш)", qty: 1, price: 11000 },
      { name: "Лимонтой Мөстэй Цай", qty: 1, price: 4500 }
    ]
  },
  {
    id: 1008, name: "Амттан & Кофе Багц", category: "combo", isCombo: true,
    tag: "Амттанд", serves: "2 хүн",
    price: 18500,
    img: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=500&q=80",
    desc: "Амтат завсарлага: тирамису торт, латте кофе, шоколадтай круассан — кофе шопын мэдрэмж.",
    includes: [
      { name: "Тирамису Торт", qty: 1, price: 8900 },
      { name: "Латте (Iced/Hot Latte)", qty: 1, price: 6900 },
      { name: "Круассан Шоколадтай", qty: 1, price: 5900 }
    ]
  }
];

/* Бүх цэсний нэгдсэн жагсаалт: багц хоолнууд эхэндээ (тод харагдана) */
const allItems = [...comboSets, ...foods];

/* ============================ 2. ТОГТМОЛ / ТОХИРГОО ============================ */
const CONFIG = {
  brand: "Түргэн Хазалт",
  currency: "₮",
  deliveryFee: 4000,
  freeDeliveryFrom: 35000,
  fallbackImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80",
  keys: {
    users: "tz_users",
    session: "tz_session",
    orders: "tz_orders",
    cart: "tz_cart",
    profile: "tz_profile"
  },
  adminEmail: "admin@turgunhazalt.mn",
  adminPassword: "admin123"
};

/* Захиалгын төлөвийн тодорхойлолт */
const ORDER_STATUS = {
  pending:    { label: "Хүлээгдэж буй",     icon: "fa-hourglass-half",  color: "amber" },
  preparing:  { label: "Бэлтгэж байна",     icon: "fa-fire-burner",     color: "blue"  },
  delivering: { label: "Хүргэлтэнд гарсан", icon: "fa-motorcycle",      color: "indigo"},
  delivered:  { label: "Хүргэгдсэн",        icon: "fa-circle-check",    color: "green" },
  cancelled:  { label: "Цуцлагдсан",        icon: "fa-circle-xmark",    color: "red"   }
};

const CATEGORIES = [
  { id: "all",     label: "Бүгд",                icon: "fa-utensils" },
  { id: "combo",   label: "Багц хоол",           icon: "fa-box-open", featured: true },
  { id: "burger",  label: "Бургер & Хачир",      icon: "fa-burger" },
  { id: "chicken", label: "Тахианы мах",         icon: "fa-drumstick-bite" },
  { id: "pizza",   label: "Пицца & Сэндвич",     icon: "fa-pizza-slice" },
  { id: "asian",   label: "Ази & Түргэн хоол",   icon: "fa-bowl-food" },
  { id: "dessert", label: "Амттан",              icon: "fa-ice-cream" },
  { id: "drink",   label: "Ундаа & Кофе",        icon: "fa-mug-hot" }
];

/* Урамшууллын кодууд */
const PROMO_CODES = {
  FASTBURGER:    { type: "percent", value: 10, label: "10% хямдрал" },
  FREEDELIVERY:  { type: "delivery", value: 0, label: "Үнэгүй хүргэлт" },
  HAZALT2026:    { type: "amount",  value: 5000, label: "5,000₮ хямдрал" }
};

/* Нүүр хуудсанд харагдах "Хамгийн их борлуулалттай" хоолнууд */
const POPULAR_IDS = [1, 8, 21, 36, 74, 89, 40, 30];

/* ============================ 3. ТӨЛӨВ (STATE) ============================ */
let activeCategory = "all";
let searchQuery = "";
let priceMin = null;
let priceMax = null;
let sortBy = "default";
let activePromo = null;

/* ============================ 4. ТУСЛАХ ФУНКЦУУД ============================ */
function money(n) {
  const num = Number(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " " + CONFIG.currency;
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(fn, delay = 250) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (e) {
    console.warn("localStorage уншихад алдаа:", key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("localStorage бичихэд алдаа:", key, e);
    return false;
  }
}

function genId(prefix = "id") {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function orderCode() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return "TH-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" +
    String(Math.floor(1000 + Math.random() * 9000));
}

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (isNaN(diff)) return "";
  if (diff < 60) return "дөнгөж сая";
  if (diff < 3600) return Math.floor(diff / 60) + " мин өмнө";
  if (diff < 86400) return Math.floor(diff / 3600) + " цаг өмнө";
  return Math.floor(diff / 86400) + " өдөр өмнө";
}

function getFood(id) {
  return allItems.find((f) => f.id === Number(id));
}

/* ---------- Багц хоолны туслах функцууд ---------- */
function comboBasePrice(combo) {
  if (!combo || !Array.isArray(combo.includes)) return combo ? combo.price : 0;
  return combo.includes.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
}

function comboSavings(combo) {
  const base = comboBasePrice(combo);
  const save = Math.max(0, base - (Number(combo.price) || 0));
  return {
    base,
    save,
    percent: base > 0 ? Math.round((save / base) * 100) : 0
  };
}

function comboIncludesList(combo) {
  if (!combo || !Array.isArray(combo.includes)) return [];
  return combo.includes.map((i) => `${i.name} × ${i.qty}`);
}

function comboIncludesText(combo) {
  return comboIncludesList(combo).join(" + ");
}

/* Хайлтад ашиглах нэгдсэн текст (нэр, тайлбар, ангилал, багтын орц, үнэ) */
function searchTextFor(item) {
  const cat = CATEGORIES.find((c) => c.id === item.category);
  return [
    item.name,
    item.desc,
    cat ? cat.label : "",
    item.tag || "",
    item.serves || "",
    item.isCombo ? comboIncludesText(item) : "",
    item.isCombo ? "багц сет хослол combo set" : "",
    item.price
  ].join(" ").toLowerCase();
}

/* ============================ 5. TOAST (ПОП-АП МЭДЭГДЭЛ) ============================ */
function ensureToastHost() {
  let host = document.getElementById("toast-container");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-container";
    host.className = "toast-container";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type = "success", title = "") {
  const host = ensureToastHost();
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };
  const titles = {
    success: "Амжилттай",
    error: "Алдаа",
    warning: "Анхаар",
    info: "Мэдээлэл"
  };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
    <div class="toast-body">
      <p class="toast-title">${escapeHtml(title || titles[type] || titles.info)}</p>
      <p class="toast-message">${escapeHtml(message)}</p>
    </div>
    <button class="toast-close" aria-label="Хаах">&times;</button>
    <span class="toast-progress"></span>
  `;
  host.appendChild(el);
  const remove = () => {
    el.classList.add("toast-out");
    setTimeout(() => el.remove(), 320);
  };
  el.querySelector(".toast-close").addEventListener("click", remove);
  setTimeout(remove, 3400);
}

/* ============================ 6. ХЭРЭГЛЭГЧИЙН АККАУНТ (AUTH) ============================ */
function getUsers() {
  // Cloud кэш бэлэн бол локал+cloud нэгтгэлийг буцаана (өөр төхөөрөмжийн бүртгэл харагдана)
  try {
    if (CLOUD.usersCache && CLOUD.usersCache.length) return mergeUsersLocalAndCloud();
  } catch (e) {}
  return readJSON(CONFIG.keys.users, []);
}

function saveUsers(users) {
  const ok = saveUsersLocalOnly(users);
  // Шинэ/өөрчлөгдсөн хэрэглэгчдийг Cloud руу синк хийнэ
  try {
    if (isCloudReady() && Array.isArray(users)) {
      users.slice(-5).forEach((u) => cloudUpsertUser(u));
    }
  } catch (e) {}
  return ok;
}

/* Анхны админ аккаунтыг автоматаар үүсгэнэ (local + cloud) */
function seedAdmin() {
  const users = getUsers();
  if (!users.some((u) => u.email === CONFIG.adminEmail)) {
    users.push({
      id: "u_admin",
      name: "Систем Админ",
      email: CONFIG.adminEmail,
      phone: "77001122",
      address: "Улаанбаатар хот, Сүхбаатар дүүрэг",
      password: CONFIG.adminPassword,
      role: "admin",
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  } else if (isCloudReady()) {
    // Админ cloud-д байхгүй бол хуулна (өөр төхөөрөмжөөс нэвтрэхэд хэрэгтэй)
    try {
      const admin = users.find((u) => u.email === CONFIG.adminEmail);
      if (admin) cloudUpsertUser(admin);
    } catch (e) {}
  }
}

function registerUser({ name, email, phone, password, address = "" }) {
  const users = getUsers();
  const cleanEmail = String(email).trim().toLowerCase();
  if (users.some((u) => u.email === cleanEmail)) {
    return { ok: false, error: "Энэ имэйл хаягаар бүртгэл аль хэдийн үүссэн байна." };
  }
  const user = {
    id: genId("u"),
    name: String(name).trim(),
    email: cleanEmail,
    phone: String(phone).trim(),
    address: String(address).trim(),
    password: String(password),
    role: "customer",
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user };
}

function loginUser(email, password) {
  const cleanEmail = String(email).trim().toLowerCase();
  const user = getUsers().find((u) => u.email === cleanEmail);
  if (!user) return { ok: false, error: "Ийм имэйл хаягтай хэрэглэгч олдсонгүй." };
  if (user.password !== String(password)) return { ok: false, error: "Нууц үг буруу байна." };
  writeJSON(CONFIG.keys.session, { userId: user.id, email: user.email, at: new Date().toISOString() });
  return { ok: true, user };
}

function getCurrentUser() {
  const session = readJSON(CONFIG.keys.session, null);
  if (!session || !session.userId) return null;
  const user = getUsers().find((u) => u.id === session.userId);
  return user || null;
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function isAdmin() {
  const u = getCurrentUser();
  return !!(u && u.role === "admin");
}

function updateCurrentUser(patch) {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "Нэвтрээгүй байна." };
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) return { ok: false, error: "Хэрэглэгч олдсонгүй." };
  users[idx] = { ...users[idx], ...patch, password: patch.password || users[idx].password };
  saveUsers(users);
  cloudUpsertUser(users[idx]);
  return { ok: true, user: users[idx] };
}

function logoutUser(silent = false) {
  localStorage.removeItem(CONFIG.keys.session);
  try { if (CLOUD.auth) CLOUD.auth.signOut().catch(() => {}); } catch (e) {}
  if (!silent) {
    showToast("Та амжилттай гарлаа. Дахин тавтай морилно уу!", "info", "Гарц");
    setTimeout(() => { window.location.href = "index.html"; }, 700);
  }
}

/* ============================ 7. САГСНЫ СИСТЕМ ============================ */
function getCartRaw() {
  const raw = readJSON(CONFIG.keys.cart, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((i) => i && getFood(i.id)).map((i) => ({ id: Number(i.id), qty: Math.max(1, Number(i.qty) || 1) }));
}

function saveCart() {
  writeJSON(CONFIG.keys.cart, cart);
  try {
    const bc = new BroadcastChannel("turgun-hazalt");
    bc.postMessage({ type: "cart-updated", count: cartCount() });
    bc.close();
  } catch (e) { /* хуучин хөтөч дэмжихгүй бол алгасна */ }
}

let cart = getCartRaw();

function cartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function cartDetailed() {
  return cart.map((c) => {
    const f = getFood(c.id);
    return { ...f, qty: c.qty, lineTotal: f.price * c.qty };
  });
}

function cartSubtotal() {
  return cartDetailed().reduce((s, i) => s + i.lineTotal, 0);
}

function cartDeliveryFee(subtotal = cartSubtotal()) {
  if (subtotal <= 0) return 0;
  if (subtotal >= CONFIG.freeDeliveryFrom) return 0;
  return CONFIG.deliveryFee;
}

function cartDiscount(subtotal = cartSubtotal()) {
  if (!activePromo) return 0;
  if (activePromo.type === "percent") return Math.round((subtotal * activePromo.value) / 100);
  if (activePromo.type === "amount") return Math.min(activePromo.value, subtotal);
  return 0;
}

function cartTotals() {
  const subtotal = cartSubtotal();
  const discount = cartDiscount(subtotal);
  const deliveryFee = activePromo && activePromo.type === "delivery" ? 0 : cartDeliveryFee(subtotal);
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return { subtotal, discount, deliveryFee, total };
}

function addToCart(foodId, qty = 1, silent = false) {
  const food = getFood(foodId);
  if (!food) return;
  const existing = cart.find((i) => i.id === food.id);
  if (existing) existing.qty += qty;
  else cart.push({ id: food.id, qty });
  saveCart();
  updateCartUI();
  bounceCartIcon();
  if (!silent) {
    if (food.isCombo) {
      const s = comboSavings(food);
      showToast(`"${food.name}" багц сагсанд нэмэгдлээ — ${money(s.save)} хэмнэлээ (${s.percent}%).`, "success", "Багц нэмэгдлээ");
    } else {
      showToast(`"${food.name}" сагсанд нэмэгдлээ (${money(food.price)}).`, "success", "Хоол нэмэгдлээ");
    }
  }
}

function changeQty(foodId, change) {
  const item = cart.find((i) => i.id === Number(foodId));
  if (!item) return;
  item.qty += change;
  if (item.qty <= 0) {
    const food = getFood(foodId);
    cart = cart.filter((i) => i.id !== Number(foodId));
    if (food) showToast(`"${food.name}" сагснаас хасагдлаа.`, "warning", "Хасагдлаа");
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(foodId) {
  const food = getFood(foodId);
  cart = cart.filter((i) => i.id !== Number(foodId));
  saveCart();
  updateCartUI();
  if (food) showToast(`"${food.name}" сагснаас устгагдлаа.`, "warning", "Устгагдлаа");
}

function clearCart(silent = false) {
  cart = [];
  activePromo = null;
  saveCart();
  updateCartUI();
  if (!silent) showToast("Сагс бүрэн хоослогдлоо.", "info", "Сагс");
}

function bounceCartIcon() {
  document.querySelectorAll(".cart-icon-wrap").forEach((el) => {
    el.classList.remove("cart-bounce");
    void el.offsetWidth;
    el.classList.add("cart-bounce");
  });
}

function applyPromo(code) {
  const key = String(code || "").trim().toUpperCase();
  if (!key) { activePromo = null; updateCartUI(); return { ok: false, error: "Код оруулна уу." }; }
  const promo = PROMO_CODES[key];
  if (!promo) { activePromo = null; updateCartUI(); return { ok: false, error: "Урамшууллын код хүчингүй байна." }; }
  activePromo = { ...promo, code: key };
  updateCartUI();
  return { ok: true, promo: activePromo };
}

/* ============================ 8. САГСНЫ UI (DRAWER) ============================ */
function ensureCartUI() {
  if (document.getElementById("cart-modal")) return;

  const drawer = document.createElement("div");
  drawer.id = "cart-modal";
  drawer.className = "fixed inset-0 z-[60] hidden bg-black/50 backdrop-blur-sm flex justify-end";
  drawer.innerHTML = `
    <div class="bg-white w-full max-w-md h-full flex flex-col shadow-2xl modal-panel" onclick="event.stopPropagation()">
      <div class="flex items-center justify-between border-b border-gray-100 p-6 pb-4">
        <h2 class="text-xl font-black flex items-center gap-2 text-gray-900">
          <i class="fa-solid fa-bag-shopping text-red-600"></i> Таны сагс
          <span id="cart-modal-count" class="bg-amber-400 text-red-950 text-xs font-black px-2.5 py-1 rounded-full">0</span>
        </h2>
        <button onclick="toggleCart()" class="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition flex items-center justify-center" aria-label="Хаах">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div id="cart-items" class="divide-y divide-gray-100 px-6 py-2 overflow-y-auto cart-scroll flex-1"></div>

      <div class="border-t border-gray-100 p-6 pt-4 bg-white space-y-3">
        <div class="flex gap-2">
          <input id="promo-input" type="text" placeholder="Урамшууллын код (FASTBURGER)" class="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm">
          <button onclick="applyPromoFromUI()" class="bg-gray-900 hover:bg-red-600 text-white text-sm font-bold px-4 rounded-xl transition">Хэрэглэх</button>
        </div>
        <div id="promo-note" class="text-xs font-semibold text-green-600 hidden"></div>
        <div class="flex justify-between text-gray-600 text-sm">
          <span>Хоолны дүн:</span><span id="subtotal-price" class="font-semibold">0 ₮</span>
        </div>
        <div id="discount-row" class="justify-between text-green-600 text-sm hidden">
          <span>Хямдрал:</span><span id="discount-price" class="font-semibold">-0 ₮</span>
        </div>
        <div class="flex justify-between text-gray-600 text-sm">
          <span>Хүргэлтийн төлбөр:</span><span id="delivery-fee" class="font-semibold">0 ₮</span>
        </div>
        <div id="free-delivery-hint" class="hidden text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"></div>
        <div class="flex justify-between text-xl font-black text-gray-900 pt-1">
          <span>Нийт нийлбэр:</span><span id="total-price" class="text-red-600">0 ₮</span>
        </div>
        <button onclick="openCheckout()" class="btn-shine w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-200">
          <i class="fa-solid fa-credit-card mr-1"></i> Захиалга Баталгаажуулах
        </button>
      </div>
    </div>`;
  drawer.addEventListener("click", (e) => { if (e.target === drawer) toggleCart(); });
  document.body.appendChild(drawer);

  const checkout = document.createElement("div");
  checkout.id = "checkout-modal";
  checkout.className = "fixed inset-0 z-[70] hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
  checkout.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[92vh] overflow-y-auto cart-scroll modal-panel" onclick="event.stopPropagation()">
      <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
        <h3 class="text-xl font-black text-gray-900 flex items-center gap-2">
          <i class="fa-solid fa-truck-fast text-red-600"></i> Хүргэлтийн мэдээлэл
        </h3>
        <button onclick="closeCheckout()" class="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition flex items-center justify-center" aria-label="Хаах">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <form id="checkout-form" class="p-6 space-y-4" novalidate>
        <div id="checkout-login-hint"></div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Таны нэр <span class="text-red-600">*</span></label>
          <input id="co-name" type="text" required placeholder="Нэрээ оруулна уу" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition">
          <p class="field-error hidden text-xs text-red-600 mt-1"></p>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Утасны дугаар <span class="text-red-600">*</span></label>
          <input id="co-phone" type="tel" required placeholder="99112233" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition">
          <p class="field-error hidden text-xs text-red-600 mt-1"></p>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Хүргэлтийн хаяг <span class="text-red-600">*</span></label>
          <textarea id="co-address" required rows="2" placeholder="Дүүрэг, хороо, байр, орц, тоот" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition"></textarea>
          <p class="field-error hidden text-xs text-red-600 mt-1"></p>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Төлбөрийн хэлбэр</label>
          <div class="grid grid-cols-3 gap-2">
            <label class="pay-option"><input type="radio" name="payment" value="cash" class="hidden" checked><i class="fa-solid fa-money-bill-wave"></i><span>Бэлнээр</span></label>
            <label class="pay-option"><input type="radio" name="payment" value="card" class="hidden"><i class="fa-solid fa-credit-card"></i><span>Карт</span></label>
            <label class="pay-option"><input type="radio" name="payment" value="transfer" class="hidden"><i class="fa-solid fa-building-columns"></i><span>Дансаар</span></label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Нэмэлт тайлбар</label>
          <input id="co-note" type="text" placeholder="Жишээ: Хаалганы код 1234, сонгино хийхгүй" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition">
        </div>
        <div class="bg-gray-50 rounded-2xl p-4 space-y-1.5 text-sm">
          <div class="flex justify-between text-gray-600"><span>Хоолны дүн:</span><span id="co-subtotal" class="font-semibold">0 ₮</span></div>
          <div id="co-discount-row" class="justify-between text-green-600 hidden"><span>Хямдрал:</span><span id="co-discount" class="font-semibold">-0 ₮</span></div>
          <div class="flex justify-between text-gray-600"><span>Хүргэлт:</span><span id="co-delivery" class="font-semibold">0 ₮</span></div>
          <div class="flex justify-between text-lg font-black text-gray-900 pt-1 border-t border-gray-200"><span>Төлөх дүн:</span><span id="co-total" class="text-red-600">0 ₮</span></div>
        </div>
        <button type="submit" class="btn-shine w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-green-200">
          <i class="fa-solid fa-paper-plane mr-1"></i> Захиалга илгээх
        </button>
        <p class="text-center text-xs text-gray-400">Захиалга баталгаажсаны дараа бид тантай утсаар холбогдох болно.</p>
      </form>
    </div>`;
  checkout.addEventListener("click", (e) => { if (e.target === checkout) closeCheckout(); });
  document.body.appendChild(checkout);

  const form = document.getElementById("checkout-form");
  form.addEventListener("submit", handleOrderSubmit);
  form.querySelectorAll('input[name="payment"]').forEach((r) => {
    r.addEventListener("change", () => {
      form.querySelectorAll(".pay-option").forEach((l) => l.classList.remove("active"));
      r.closest(".pay-option").classList.add("active");
    });
  });
  form.querySelector(".pay-option").classList.add("active");

  const success = document.createElement("div");
  success.id = "success-modal";
  success.className = "fixed inset-0 z-[80] hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
  success.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-md p-8 text-center shadow-2xl modal-panel">
      <div class="success-check mx-auto mb-4"><i class="fa-solid fa-check"></i></div>
      <h3 class="text-2xl font-black text-gray-900 mb-2">Захиалга амжилттай!</h3>
      <p class="text-gray-500 text-sm mb-4">Таны захиалгыг хүлээн авлаа. Бид тун удахгүй бэлтгэж эхэлнэ.</p>
      <div class="bg-gray-50 rounded-2xl p-4 mb-5">
        <p class="text-xs text-gray-500 uppercase tracking-widest font-bold">Захиалгын код</p>
        <p id="success-code" class="text-2xl font-black text-red-600 tracking-wider">TH-0000-0000</p>
        <p id="success-total" class="text-sm text-gray-600 mt-1">0 ₮</p>
      </div>
      <div class="flex gap-3">
        <a href="orders.html" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">Миний захиалгууд</a>
        <button onclick="closeSuccess()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Үргэлжлүүлэх</button>
      </div>
    </div>`;
  document.body.appendChild(success);
}

function updateCartUI() {
  ensureCartUI();

  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = cartCount();
  const modalCount = document.getElementById("cart-modal-count");
  if (modalCount) modalCount.textContent = cartCount();

  const wrap = document.getElementById("cart-items");
  if (wrap) {
    if (cart.length === 0) {
      wrap.innerHTML = `
        <div class="text-center py-14">
          <div class="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-400 flex items-center justify-center text-3xl mb-4">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
          <p class="font-bold text-gray-700">Сагс хоосон байна</p>
          <p class="text-sm text-gray-400 mt-1">Цэснээс дуртай хоолоо сонгоод сагслаарай.</p>
          <a href="menu.html" class="inline-block mt-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition">Цэс рүү очих</a>
        </div>`;
    } else {
      wrap.innerHTML = cartDetailed().map((item) => `
        <div class="flex items-center justify-between py-4 cart-line">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${item.img}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='${CONFIG.fallbackImg}'" class="w-14 h-14 rounded-xl object-cover flex-shrink-0">
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-gray-900 truncate max-w-[170px]">${escapeHtml(item.name)}</h4>
              ${item.isCombo ? `<p class="text-[10px] text-amber-600 truncate max-w-[170px]"><i class="fa-solid fa-box-open mr-0.5"></i>${escapeHtml(comboIncludesText(item))}</p>` : ""}
              <p class="text-xs text-gray-500">${money(item.price)} × ${item.qty}</p>
              <p class="text-xs font-bold text-red-600">${money(item.lineTotal)}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1">
              <button onclick="changeQty(${item.id}, -1)" class="w-7 h-7 bg-white rounded-full font-bold text-gray-600 hover:bg-red-600 hover:text-white transition shadow-sm" aria-label="Хасах">−</button>
              <span class="font-bold text-sm w-6 text-center">${item.qty}</span>
              <button onclick="changeQty(${item.id}, 1)" class="w-7 h-7 bg-white rounded-full font-bold text-gray-600 hover:bg-red-600 hover:text-white transition shadow-sm" aria-label="Нэмэх">+</button>
            </div>
            <button onclick="removeFromCart(${item.id})" class="w-7 h-7 rounded-full text-gray-300 hover:text-red-600 hover:bg-red-50 transition" aria-label="Устгах">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>`).join("");
    }
  }

  const t = cartTotals();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("subtotal-price", money(t.subtotal));
  set("delivery-fee", t.deliveryFee === 0 && t.subtotal > 0 ? "Үнэгүй" : money(t.deliveryFee));
  set("total-price", money(t.total));
  set("co-subtotal", money(t.subtotal));
  set("co-delivery", t.deliveryFee === 0 && t.subtotal > 0 ? "Үнэгүй" : money(t.deliveryFee));
  set("co-total", money(t.total));

  const discRow = document.getElementById("discount-row");
  const discRowCo = document.getElementById("co-discount-row");
  const discVal = document.getElementById("discount-price");
  const discValCo = document.getElementById("co-discount");
  if (discVal) discVal.textContent = "-" + money(t.discount);
  if (discValCo) discValCo.textContent = "-" + money(t.discount);
  if (discRow) discRow.classList.toggle("hidden", t.discount <= 0);
  if (discRow) discRow.classList.toggle("flex", t.discount > 0);
  if (discRowCo) discRowCo.classList.toggle("hidden", t.discount <= 0);
  if (discRowCo) discRowCo.classList.toggle("flex", t.discount > 0);

  const note = document.getElementById("promo-note");
  if (note) {
    if (activePromo) {
      note.classList.remove("hidden");
      note.innerHTML = `<i class="fa-solid fa-tag mr-1"></i> "${activePromo.code}" код хэрэглэгдлээ — ${activePromo.label}`;
    } else {
      note.classList.add("hidden");
    }
  }

  const hint = document.getElementById("free-delivery-hint");
  if (hint) {
    if (t.subtotal > 0 && t.subtotal < CONFIG.freeDeliveryFrom) {
      const left = CONFIG.freeDeliveryFrom - t.subtotal;
      hint.classList.remove("hidden");
      hint.innerHTML = `<i class="fa-solid fa-truck-fast mr-1"></i> Үнэгүй хүргэлтэд ${money(left)} үлдлээ!`;
    } else {
      hint.classList.add("hidden");
    }
  }

  renderCartBadgeAll();
  try { updateMobileCartBar(); } catch (e) {}
  try { renderCloudBadge(); } catch (e) {}
}

function renderCartBadgeAll() {
  const c = cartCount();
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = c;
    el.classList.toggle("opacity-0", c === 0);
  });
}

function applyPromoFromUI() {
  const input = document.getElementById("promo-input");
  if (!input) return;
  const res = applyPromo(input.value);
  if (res.ok) showToast(`"${res.promo.code}" код амжилттай хэрэглэгдлээ — ${res.promo.label}`, "success", "Урамшуулал");
  else showToast(res.error, "error", "Урамшуулал");
}

function toggleCart() {
  ensureCartUI();
  const modal = document.getElementById("cart-modal");
  if (!modal) return;
  modal.classList.toggle("hidden");
  document.body.classList.toggle("overflow-hidden", !modal.classList.contains("hidden"));
  if (!modal.classList.contains("hidden")) updateCartUI();
}

function openCheckout() {
  ensureCartUI();
  if (cart.length === 0) {
    showToast("Сагс хоосон байна. Эхлээд хоол сонгоно уу!", "warning", "Сагс хоосон");
    return;
  }
  const modal = document.getElementById("cart-modal");
  if (modal && !modal.classList.contains("hidden")) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");

  const user = getCurrentUser();
  const nameEl = document.getElementById("co-name");
  const phoneEl = document.getElementById("co-phone");
  const addrEl = document.getElementById("co-address");
  if (user) {
    if (nameEl && !nameEl.value) nameEl.value = user.name || "";
    if (phoneEl && !phoneEl.value) phoneEl.value = user.phone || "";
    if (addrEl && !addrEl.value) addrEl.value = user.address || "";
  }
  const hint = document.getElementById("checkout-login-hint");
  if (hint) {
    hint.innerHTML = user
      ? `<div class="bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl px-3 py-2"><i class="fa-solid fa-circle-check mr-1"></i> ${escapeHtml(user.name)} нэрээр захиалга хийж байна.</div>`
      : `<div class="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl px-3 py-2">
           <i class="fa-solid fa-circle-info mr-1"></i> Зочноор захиалж байна.
           <a href="login.html" class="underline font-bold">Нэвтэрвэл</a> захиалгын түүх хадгалагдана.
         </div>`;
  }
  updateCartUI();
  const checkout = document.getElementById("checkout-modal");
  checkout.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeCheckout() {
  const checkout = document.getElementById("checkout-modal");
  if (checkout) checkout.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function closeSuccess() {
  const s = document.getElementById("success-modal");
  if (s) s.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const err = input.parentElement.querySelector(".field-error");
  if (message) {
    input.classList.add("border-red-500", "bg-red-50");
    if (err) { err.textContent = message; err.classList.remove("hidden"); }
  } else {
    input.classList.remove("border-red-500", "bg-red-50");
    if (err) { err.textContent = ""; err.classList.add("hidden"); }
  }
}

/* ============================ 9. ЗАХИАЛГА (ORDERS) — LOCAL + CLOUD SYNC ============================
   getOrders(): Cloud кэш бэлэн бол түүнийг буцаана (реал-тайм), үгүй бол localStorage.
   saveOrders()/createOrder()/updateOrderStatus(): local-д нэн даруй бичиж UI гацаахгүй,
   зэрэгцээ Cloud руу синк хийнэ. Админ самбар Cloud сонсогчоор 1-2 сек-д харна. */
function getOrders() {
  try {
    if (CLOUD.ordersCache !== null && Array.isArray(CLOUD.ordersCache)) return CLOUD.ordersCache.slice();
  } catch (e) {}
  const orders = readJSON(CONFIG.keys.orders, []);
  return Array.isArray(orders) ? orders : [];
}

function saveOrders(orders) {
  const ok = writeJSON(CONFIG.keys.orders, orders);
  // Cloud бэлэн + кэштэй үед бүх жагсаалтыг дахин бичихээс зайлсхийж,
  // зөвхөн ялгааг синк хийх нь зарчим. Энд энгийн байдлаар сүүлийн 20-г синк хийнэ.
  try {
    if (isCloudReady() && Array.isArray(orders)) {
      orders.slice(0, 20).forEach((o) => cloudUpsertOrder(o));
    }
  } catch (e) {}
  try {
    const bc = new BroadcastChannel("turgun-hazalt");
    bc.postMessage({ type: "orders-updated", count: orders.length });
    bc.close();
  } catch (e) { /* алгасна */ }
  window.dispatchEvent(new CustomEvent("ordersUpdated", { detail: { orders } }));
  return ok;
}

function getMyOrders() {
  const user = getCurrentUser();
  const orders = getOrders();
  if (!user) return [];
  return orders
    .filter((o) => o.userId === user.id || (o.userEmail && o.userEmail === user.email) || (o.customer && o.customer.phone === user.phone))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getOrdersByPhone(phone) {
  const clean = String(phone).replace(/\s/g, "");
  if (!clean) return [];
  return getOrders()
    .filter((o) => o.customer && String(o.customer.phone).replace(/\s/g, "") === clean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createOrder({ name, phone, address, note, payment }) {
  const user = getCurrentUser();
  const items = cartDetailed().map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    qty: i.qty,
    img: i.img,
    isCombo: !!i.isCombo,
    includes: i.isCombo ? comboIncludesList(i) : undefined
  }));
  const t = cartTotals();
  const order = {
    id: genId("ord"),
    code: orderCode(),
    userId: user ? user.id : null,
    userEmail: user ? user.email : null,
    customer: { name, phone, address, note: note || "" },
    items,
    subtotal: t.subtotal,
    discount: t.discount,
    promoCode: activePromo ? activePromo.code : null,
    deliveryFee: t.deliveryFee,
    total: t.total,
    payment: payment || "cash",
    status: "pending",
    statusHistory: [{ status: "pending", at: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  // >>> ONLINE SYNC: ямар ч төхөөрөмжийн админ дээр шууд харагдана
  cloudUpsertOrder(order);
  try { if (CLOUD.usersCache !== null) { /* хэрэггүй */ } } catch (e) {}
  return order;
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return { ok: false, error: "Захиалга олдсонгүй." };
  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  orders[idx].statusHistory = orders[idx].statusHistory || [];
  orders[idx].statusHistory.push({ status, at: orders[idx].updatedAt });
  saveOrders(orders);
  // >>> ONLINE SYNC: админ өөрчилсөн төлөв бүх төхөөрөмж дээр шууд шинэчлэгдэнэ
  cloudUpsertOrder(orders[idx]);
  // Cloud кэштэй үед кэшийг шууд шинэчилнэ (реал-тайм listener давхар ирнэ)
  try {
    if (CLOUD.ordersCache !== null) {
      const ci = CLOUD.ordersCache.findIndex((o) => o.id === orderId);
      if (ci > -1) CLOUD.ordersCache[ci] = { ...orders[idx] };
    }
  } catch (e) {}
  return { ok: true, order: orders[idx] };
}

function handleOrderSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("co-name").value.trim();
  const phone = document.getElementById("co-phone").value.trim();
  const address = document.getElementById("co-address").value.trim();
  const note = document.getElementById("co-note").value.trim();
  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const payment = paymentEl ? paymentEl.value : "cash";

  let valid = true;
  setFieldError("co-name", "");
  setFieldError("co-phone", "");
  setFieldError("co-address", "");

  if (name.length < 2) { setFieldError("co-name", "Нэрээ бүтэн оруулна уу (2+ тэмдэгт)."); valid = false; }
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 8) { setFieldError("co-phone", "Утасны дугаар 8 оронтой байх ёстой (жишээ: 99112233)."); valid = false; }
  if (address.length < 6) { setFieldError("co-address", "Хүргэлтийн хаягаа дэлгэрэнгүй бичнэ үү."); valid = false; }
  if (!valid) {
    showToast("Мэдээллээ бүрэн бөглөнө үү!", "error", "Алдаа");
    return;
  }

  const order = createOrder({ name, phone, address, note, payment });
  const user = getCurrentUser();
  if (user) updateCurrentUser({ address });

  clearCart(true);
  closeCheckout();

  const codeEl = document.getElementById("success-code");
  const totalEl = document.getElementById("success-total");
  if (codeEl) codeEl.textContent = order.code;
  if (totalEl) totalEl.textContent = `Нийт төлөх: ${money(order.total)} • ${ORDER_STATUS[order.status].label}`;
  const success = document.getElementById("success-modal");
  if (success) success.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");

  showToast(`Захиалга #${order.code} амжилттай баталгаажлаа!`, "success", "Захиалга илгээгдлээ");
}

/* ============================ 10. ХАЙЛТ & ФИЛЬТР ============================ */
function matchQuery(item, q) {
  if (!q) return true;
  const query = q.toLowerCase().trim();
  const text = searchTextFor(item);
  if (text.includes(query)) return true;
  const num = parseInt(query.replace(/[^\d]/g, ""), 10);
  const priceMatch = item.price.toString().includes(query.replace(/[,\s₮]/g, ""));
  const nearPrice = !isNaN(num) && num > 0 && Math.abs(item.price - num) <= 2000;
  return priceMatch || nearPrice;
}

function getFilteredFoods() {
  let list = allItems.slice();

  if (activeCategory !== "all") list = list.filter((f) => f.category === activeCategory);
  if (searchQuery) list = list.filter((f) => matchQuery(f, searchQuery));
  if (priceMin != null && !isNaN(priceMin)) list = list.filter((f) => f.price >= priceMin);
  if (priceMax != null && !isNaN(priceMax)) list = list.filter((f) => f.price <= priceMax);

  if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name, "mn"));
  else if (sortBy === "savings") {
    list.sort((a, b) => {
      const sa = a.isCombo ? comboSavings(a).percent : -1;
      const sb = b.isCombo ? comboSavings(b).percent : -1;
      return sb - sa;
    });
  }
  else if (sortBy === "popular") {
    list.sort((a, b) => {
      const ai = POPULAR_IDS.indexOf(a.id);
      const bi = POPULAR_IDS.indexOf(b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }
  return list;
}

function highlight(text, q) {
  const safe = escapeHtml(text);
  const query = String(q || "").trim();
  if (!query) return safe;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safe.replace(new RegExp(`(${escaped})`, "gi"), '<mark class="bg-amber-200 text-red-900 rounded px-0.5">$1</mark>');
  } catch (e) {
    return safe;
  }
}

function categoryLabel(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.label : id;
}

function comboCardHTML(combo, index = 0) {
  const s = comboSavings(combo);
  const includes = combo.includes.map((i) => `
    <li class="flex items-center gap-2 text-[12px] text-gray-600">
      <i class="fa-solid fa-circle-check text-green-500 text-[10px]"></i>
      <span class="truncate">${escapeHtml(i.name)}</span>
      <span class="ml-auto font-black text-gray-400 flex-shrink-0">×${i.qty}</span>
    </li>`).join("");

  return `
    <article class="food-card combo-card group bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col justify-between" style="--delay:${Math.min(index * 45, 600)}ms">
      <div>
        <div class="relative overflow-hidden">
          <img src="${combo.img}" alt="${escapeHtml(combo.name)}" loading="lazy"
               onerror="this.onerror=null;this.src='${CONFIG.fallbackImg}'"
               class="food-img w-full h-48 object-cover">
          <span class="absolute top-3 left-3 bg-amber-400 text-red-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md badge-pop">
            <i class="fa-solid fa-box-open mr-1"></i> Багц хоол
          </span>
          <span class="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md badge-pop">
            <i class="fa-solid fa-tags mr-1"></i> Хэмнэлт ${s.percent}%
          </span>
          <button onclick="openQuickView(${combo.id})" class="quick-view-btn absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition" aria-label="Дэлгэрэнгүй">
            <span class="bg-white text-gray-900 text-xs font-black px-4 py-2 rounded-full shadow-lg">
              <i class="fa-solid fa-eye mr-1"></i> Багцын дэлгэрэнгүй
            </span>
          </button>
        </div>
        <div class="p-5 pb-3">
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 class="font-bold text-lg text-gray-900 leading-snug">${highlight(combo.name, searchQuery)}</h3>
            ${combo.tag ? `<span class="combo-tag">${escapeHtml(combo.tag)}</span>` : ""}
          </div>
          <p class="text-sm text-gray-500 mb-3 leading-relaxed">${highlight(combo.desc, searchQuery)}</p>
          <div class="combo-includes">
            <p class="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-2">
              <i class="fa-solid fa-basket-shopping mr-1"></i> Багцад багтсан
            </p>
            <ul class="space-y-1.5">${includes}</ul>
          </div>
        </div>
      </div>
      <div class="p-5 pt-0">
        <div class="flex items-end justify-between gap-2 mb-3">
          <div>
            <p class="text-xs text-gray-400 line-through">${money(s.base)}</p>
            <p class="text-xl font-extrabold text-red-600">${money(combo.price)}</p>
          </div>
          <div class="text-right">
            <span class="savings-chip"><i class="fa-solid fa-piggy-bank mr-1"></i>${money(s.save)} хэмнэнэ</span>
            ${combo.serves ? `<p class="text-[11px] text-gray-400 mt-1"><i class="fa-solid fa-users mr-1"></i>${escapeHtml(combo.serves)}</p>` : ""}
          </div>
        </div>
        <button onclick="addToCart(${combo.id})" class="add-btn btn-shine w-full bg-red-600 text-white hover:bg-red-700 font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2">
          <i class="fa-solid fa-cart-plus text-xs"></i> Багц сагслах
        </button>
      </div>
    </article>`;
}

function foodCardHTML(food, index = 0) {
  if (food.isCombo) return comboCardHTML(food, index);

  const topIdx = POPULAR_IDS.indexOf(food.id);
  const badge = topIdx > -1
    ? `<span class="absolute top-3 left-3 bg-amber-400 text-red-950 text-[11px] font-black px-3 py-1 rounded-full shadow-md badge-pop">
         <i class="fa-solid fa-star mr-1"></i> Top #${topIdx + 1}
       </span>`
    : `<span class="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
         ${escapeHtml(categoryLabel(food.category))}
       </span>`;

  return `
    <article class="food-card group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between" style="--delay:${Math.min(index * 45, 600)}ms">
      <div>
        <div class="relative overflow-hidden">
          <img src="${food.img}" alt="${escapeHtml(food.name)}" loading="lazy"
               onerror="this.onerror=null;this.src='${CONFIG.fallbackImg}'"
               class="food-img w-full h-48 object-cover">
          ${badge}
          <button onclick="openQuickView(${food.id})" class="quick-view-btn absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition" aria-label="Дэлгэрэнгүй">
            <span class="bg-white text-gray-900 text-xs font-black px-4 py-2 rounded-full shadow-lg">
              <i class="fa-solid fa-eye mr-1"></i> Дэлгэрэнгүй
            </span>
          </button>
        </div>
        <div class="p-5">
          <h3 class="font-bold text-lg text-gray-900 mb-1 leading-snug">${highlight(food.name, searchQuery)}</h3>
          <p class="text-sm text-gray-500 mb-1 line-clamp-2 leading-relaxed">${highlight(food.desc, searchQuery)}</p>
        </div>
      </div>
      <div class="p-5 pt-0 flex items-center justify-between gap-2">
        <span class="text-xl font-extrabold text-red-600">${money(food.price)}</span>
        <button onclick="addToCart(${food.id})" class="add-btn bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 flex-shrink-0">
          <i class="fa-solid fa-cart-plus text-xs"></i> Сагслах
        </button>
      </div>
    </article>`;
}

function emptyStateHTML() {
  return `
    <div class="col-span-full text-center py-16 fade-in-up">
      <div class="w-24 h-24 mx-auto rounded-full bg-red-50 text-red-400 flex items-center justify-center text-4xl mb-5 float-slow">
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <h3 class="text-xl font-black text-gray-800 mb-2">Хайлтын илэрц олдсонгүй</h3>
      <p class="text-gray-500 max-w-md mx-auto mb-6">
        "${escapeHtml(searchQuery || "")}" гэсэн хайлтад тохирох хоол олдсонгүй. Өөр түлхүүр үг эсвэл үнийн хязгаар туршиж үзээрэй.
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <button onclick="resetFilters()" class="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition shadow-lg shadow-red-200">
          <i class="fa-solid fa-rotate-left mr-1"></i> Шүүлтүүр цэвэрлэх
        </button>
        <button onclick="filterCategory('combo'); scrollToGrid()" class="bg-amber-400 hover:bg-amber-500 text-red-950 font-bold px-6 py-3 rounded-full transition shadow-lg shadow-amber-200">
          <i class="fa-solid fa-box-open mr-1"></i> Багц хоол үзэх
        </button>
        <a href="menu.html" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-full transition">Бүх цэс харах</a>
      </div>
    </div>`;
}

function renderFoods(items) {
  const grid = document.getElementById("food-grid");
  if (!grid) return;
  if (!items || items.length === 0) {
    grid.innerHTML = emptyStateHTML();
    updateResultCount(0);
    return;
  }
  grid.innerHTML = items.map((f, i) => foodCardHTML(f, i)).join("");
  updateResultCount(items.length);
}

function updateResultCount(shown) {
  const el = document.getElementById("result-count");
  if (!el) return;
  const total = allItems.length;
  const combos = comboSets.length;
  el.innerHTML = shown === total
    ? `Нийт <span class="font-black text-red-600">${total}</span> төрлийн хоол байна <span class="text-gray-400">(${combos} багц хоолтой)</span>`
    : `<span class="font-black text-red-600">${shown}</span> хоол олдлоо (нийт ${total}-аас)`;
}

function applyFilters() {
  renderFoods(getFilteredFoods());
}

const debouncedSearch = debounce(() => applyFilters(), 260);

function onSearchInput(value) {
  searchQuery = value;
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) clearBtn.classList.toggle("hidden", !value);
  debouncedSearch();
}

function clearSearch() {
  const input = document.getElementById("search-input");
  if (input) input.value = "";
  searchQuery = "";
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) clearBtn.classList.add("hidden");
  applyFilters();
}

function filterCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll(".category-btn").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });
  const target = btn || document.querySelector(`.category-btn[data-cat="${cat}"]`);
  if (target) {
    target.classList.add("active");
    target.setAttribute("aria-pressed", "true");
    target.classList.remove("cat-pop");
    void target.offsetWidth;
    target.classList.add("cat-pop");
  }
  applyFilters();
}

/* Хоолны grid рүү зөөлөн гүйлгэх */
function scrollToGrid() {
  const grid = document.getElementById("food-grid");
  if (!grid) return;
  const top = grid.getBoundingClientRect().top + window.scrollY - 120;
  window.scrollTo({ top, behavior: "smooth" });
}

function setPriceFilter() {
  const minEl = document.getElementById("price-min");
  const maxEl = document.getElementById("price-max");
  priceMin = minEl && minEl.value !== "" ? Number(minEl.value) : null;
  priceMax = maxEl && maxEl.value !== "" ? Number(maxEl.value) : null;
  if (priceMin != null && priceMax != null && priceMin > priceMax) {
    const tmp = priceMin; priceMin = priceMax; priceMax = tmp;
    if (minEl) minEl.value = priceMin;
    if (maxEl) maxEl.value = priceMax;
    showToast("Хамгийн бага үнэ их үнээс том байсан тул сольж тохирууллаа.", "info", "Шүүлтүүр");
  }
  applyFilters();
}

function setSortBy(value) {
  sortBy = value;
  applyFilters();
}

function resetFilters() {
  activeCategory = "all";
  searchQuery = "";
  priceMin = null;
  priceMax = null;
  sortBy = "default";
  const input = document.getElementById("search-input");
  if (input) input.value = "";
  const minEl = document.getElementById("price-min");
  const maxEl = document.getElementById("price-max");
  if (minEl) minEl.value = "";
  if (maxEl) maxEl.value = "";
  const sortEl = document.getElementById("sort-select");
  if (sortEl) sortEl.value = "default";
  const clearBtn = document.getElementById("search-clear");
  if (clearBtn) clearBtn.classList.add("hidden");
  filterCategory("all");
  showToast("Бүх шүүлтүүр цэвэрлэгдлээ.", "info", "Шүүлтүүр");
}

function renderCategoryButtons() {
  const wrap = document.getElementById("category-bar");
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map((c) => {
    const count = c.id === "all" ? allItems.length : allItems.filter((f) => f.category === c.id).length;
    const active = c.id === activeCategory;
    return `<button data-cat="${c.id}" onclick="filterCategory('${c.id}', this)" aria-pressed="${active}"
      class="category-btn ${active ? "active" : ""} ${c.featured ? "category-btn-featured" : ""} bg-white text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full font-semibold border border-gray-200 transition text-sm flex items-center gap-1.5">
      <i class="fa-solid ${c.icon} text-xs"></i> ${escapeHtml(c.label)}
      <span class="cat-count">${count}</span>
    </button>`;
  }).join("");
}

/* Нүүр хуудсанд ангиллын плита (тоо автоматаар бодогдоно) */
function renderCategoryTiles() {
  const wrap = document.getElementById("category-tiles");
  if (!wrap) return;
  const icons = {
    combo: { icon: "fa-box-open", cls: "bg-amber-100 text-amber-600" },
    burger: { icon: "fa-burger", cls: "bg-red-50 text-red-600" },
    chicken: { icon: "fa-drumstick-bite", cls: "bg-amber-50 text-amber-500" },
    pizza: { icon: "fa-pizza-slice", cls: "bg-red-50 text-red-600" },
    asian: { icon: "fa-bowl-food", cls: "bg-amber-50 text-amber-500" },
    dessert: { icon: "fa-ice-cream", cls: "bg-red-50 text-red-600" },
    drink: { icon: "fa-mug-hot", cls: "bg-amber-50 text-amber-500" }
  };
  wrap.innerHTML = CATEGORIES.filter((c) => c.id !== "all").map((c) => {
    const count = allItems.filter((f) => f.category === c.id).length;
    const style = icons[c.id] || icons.burger;
    const featured = c.featured ? "category-tile-featured" : "";
    return `
      <a href="menu.html?cat=${c.id}" class="feature-card ${featured} bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center block">
        <div class="feature-icon w-12 h-12 mx-auto rounded-xl ${style.cls} flex items-center justify-center text-xl mb-3">
          <i class="fa-solid ${style.icon}"></i>
        </div>
        <p class="font-bold text-sm text-gray-800">${escapeHtml(c.label)}</p>
        <p class="text-xs text-gray-400">${count} төрөл</p>
      </a>`;
  }).join("");
}

/* Нүүр хуудсанд багц хоолнуудыг онцлох хэсэг */
function renderComboShowcase() {
  const wrap = document.getElementById("combo-grid");
  if (!wrap) return;
  const combos = comboSets.slice().sort((a, b) => comboSavings(b).percent - comboSavings(a).percent).slice(0, 3);
  wrap.innerHTML = combos.map((c, i) => comboCardHTML(c, i)).join("");
  const countEl = document.getElementById("combo-count");
  if (countEl) countEl.textContent = comboSets.length;
  const maxSave = document.getElementById("combo-max-save");
  if (maxSave) {
    const best = comboSets.reduce((m, c) => Math.max(m, comboSavings(c).save), 0);
    maxSave.textContent = money(best);
  }
}

/* ============================ 11. QUICK VIEW MODAL ============================ */
function openQuickView(foodId) {
  const food = getFood(foodId);
  if (!food) return;
  let modal = document.getElementById("quick-view-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quick-view-modal";
    modal.className = "fixed inset-0 z-[65] hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
    modal.addEventListener("click", (e) => { if (e.target === modal) closeQuickView(); });
    document.body.appendChild(modal);
  }
  const comboBlock = food.isCombo ? (() => {
    const s = comboSavings(food);
    const rows = food.includes.map((i) => `
      <div class="flex items-center justify-between text-sm py-1.5">
        <span class="text-gray-700"><i class="fa-solid fa-check text-green-500 text-[10px] mr-2"></i>${escapeHtml(i.name)} <span class="text-gray-400 font-bold">×${i.qty}</span></span>
        <span class="font-bold text-gray-500">${money(i.price * i.qty)}</span>
      </div>`).join("");
    return `
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] font-black uppercase tracking-wider text-amber-700">
            <i class="fa-solid fa-basket-shopping mr-1"></i> Багцад багтсан
          </p>
          <span class="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
            <i class="fa-solid fa-tags mr-1"></i> Хэмнэлт ${s.percent}%
          </span>
        </div>
        <div class="divide-y divide-amber-100">${rows}</div>
        <div class="flex items-center justify-between pt-2.5 mt-1 border-t border-amber-200">
          <span class="text-sm font-bold text-gray-600">Дангаар авбал:</span>
          <span class="text-sm font-black text-gray-400 line-through">${money(s.base)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-green-700">Та хэмнэнэ:</span>
          <span class="text-sm font-black text-green-700">${money(s.save)}</span>
        </div>
      </div>`;
  })() : "";

  const priceBlock = food.isCombo
    ? `<div>
         <p class="text-xs text-gray-400 line-through">${money(comboSavings(food).base)}</p>
         <span class="text-2xl font-black text-red-600">${money(food.price)}</span>
       </div>`
    : `<span class="text-2xl font-black text-red-600">${money(food.price)}</span>`;

  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden modal-panel">
      <div class="relative">
        <img src="${food.img}" alt="${escapeHtml(food.name)}" onerror="this.onerror=null;this.src='${CONFIG.fallbackImg}'" class="w-full h-64 object-cover">
        <button onclick="closeQuickView()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-red-600 hover:text-white text-gray-700 transition flex items-center justify-center shadow-lg" aria-label="Хаах">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <span class="absolute bottom-4 left-4 bg-amber-400 text-red-950 text-xs font-black px-3 py-1.5 rounded-full shadow">
          <i class="fa-solid ${food.isCombo ? "fa-box-open" : ((CATEGORIES.find((c) => c.id === food.category) || {}).icon || "fa-utensils")} mr-1"></i>
          ${escapeHtml(categoryLabel(food.category))}
        </span>
        ${food.isCombo && food.serves ? `<span class="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow"><i class="fa-solid fa-users mr-1"></i>${escapeHtml(food.serves)}</span>` : ""}
      </div>
      <div class="p-6">
        <h3 class="text-2xl font-black text-gray-900 mb-2">${escapeHtml(food.name)}</h3>
        <p class="text-gray-600 leading-relaxed mb-4">${escapeHtml(food.desc)}</p>
        ${comboBlock}
        <div class="flex items-center justify-between gap-4">
          ${priceBlock}
          <div class="flex items-center gap-2">
            <button onclick="quickQty(-1)" class="w-9 h-9 rounded-full bg-gray-100 font-bold hover:bg-gray-200 transition">−</button>
            <span id="qv-qty" class="font-black w-8 text-center">1</span>
            <button onclick="quickQty(1)" class="w-9 h-9 rounded-full bg-gray-100 font-bold hover:bg-gray-200 transition">+</button>
          </div>
        </div>
        <button onclick="addQuickToCart(${food.id})" class="btn-shine w-full mt-5 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-200">
          <i class="fa-solid fa-cart-plus mr-1"></i> ${food.isCombo ? "Багц сагслах" : "Сагсанд нэмэх"}
        </button>
      </div>
    </div>`;
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function quickQty(delta) {
  const el = document.getElementById("qv-qty");
  if (!el) return;
  let v = parseInt(el.textContent, 10) + delta;
  if (v < 1) v = 1;
  if (v > 30) v = 30;
  el.textContent = v;
}

function addQuickToCart(foodId) {
  const el = document.getElementById("qv-qty");
  const qty = el ? parseInt(el.textContent, 10) : 1;
  addToCart(foodId, qty || 1);
  closeQuickView();
}

function closeQuickView() {
  const modal = document.getElementById("quick-view-modal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

/* ============================ 12. HEADER / NAV ============================ */
function renderHeader() {
  const slot = document.getElementById("header-actions");
  if (slot) {
    const user = getCurrentUser();
    const count = cartCount();

    const cartBtn = `
      <button onclick="toggleCart()" class="cart-icon-wrap relative flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 py-2.5 rounded-full font-bold transition shadow-lg shadow-red-200">
        <i class="fa-solid fa-cart-shopping text-lg"></i>
        <span class="hidden sm:inline">Сагс</span>
        <span id="cart-count" data-cart-badge class="bg-amber-400 text-red-950 text-xs font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center ${count === 0 ? "opacity-0" : ""}">${count}</span>
      </button>`;

    const authArea = user
      ? `<div class="relative" id="user-menu-wrap">
           <button onclick="toggleUserMenu(event)" class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 sm:px-4 py-2.5 rounded-full font-bold transition">
             <span class="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-white text-xs font-black flex items-center justify-center">${escapeHtml((user.name || "?").trim().charAt(0).toUpperCase())}</span>
             <span class="hidden sm:inline max-w-[110px] truncate">${escapeHtml(user.name)}</span>
             <i class="fa-solid fa-chevron-down text-[10px] text-gray-400"></i>
           </button>
           <div id="user-menu" class="hidden absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 user-menu-panel">
             <div class="px-4 py-3 border-b border-gray-100">
               <p class="font-bold text-gray-900 text-sm truncate">${escapeHtml(user.name)}</p>
               <p class="text-xs text-gray-500 truncate">${escapeHtml(user.email)}</p>
               ${user.role === "admin" ? '<span class="inline-block mt-1 bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">АДМИН</span>' : ""}
             </div>
             <a href="profile.html" class="menu-link"><i class="fa-solid fa-user w-5 text-gray-400"></i> Профайл</a>
             <a href="orders.html" class="menu-link"><i class="fa-solid fa-receipt w-5 text-gray-400"></i> Миний захиалгууд</a>
             ${user.role === "admin" ? '<a href="admin/index.html" class="menu-link"><i class="fa-solid fa-shield-halved w-5 text-gray-400"></i> Админ панель</a>' : ""}
             <button onclick="logoutUser()" class="menu-link w-full text-left text-red-600 hover:bg-red-50"><i class="fa-solid fa-right-from-bracket w-5"></i> Гарц</button>
           </div>
         </div>`
      : `<a href="login.html" class="hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-full font-bold transition">
           <i class="fa-solid fa-right-to-bracket"></i> Нэвтрэх
         </a>
         <a href="register.html" class="hidden sm:flex items-center gap-2 bg-gray-900 hover:bg-red-600 text-white px-4 sm:px-5 py-2.5 rounded-full font-bold transition shadow-lg shadow-gray-200">
           <i class="fa-solid fa-user-plus"></i> Бүртгүүлэх
         </a>`;

    slot.innerHTML = `<div class="flex items-center gap-2">${authArea}${cartBtn}</div>`;
  }

  renderMobileNav();
  renderCartBadgeAll();
  try { updateMobileCartBar(); } catch (e) {}
  try { renderCloudBadge(); } catch (e) {}
}

function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("user-menu");
  if (menu) menu.classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("user-menu");
  if (menu && !menu.classList.contains("hidden") && !e.target.closest("#user-menu-wrap")) {
    menu.classList.add("hidden");
  }
});

function renderMobileNav() {
  const slot = document.getElementById("mobile-nav-slot");
  if (!slot) return;
  const user = getCurrentUser();
  const page = document.body.dataset.page || "";
  const links = [
    { href: "index.html", label: "Нүүр", icon: "fa-house", key: "home" },
    { href: "menu.html", label: "Цэс", icon: "fa-utensils", key: "menu" },
    { href: "promos.html", label: "Урамшуулал", icon: "fa-tags", key: "promos" },
    { href: "about.html", label: "Бидний тухай", icon: "fa-circle-info", key: "about" }
  ];
  slot.innerHTML = `
    <button onclick="toggleMobileNav()" class="md:hidden w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition flex items-center justify-center" aria-label="Цэс">
      <i class="fa-solid fa-bars"></i>
    </button>
    <div id="mobile-nav-panel" class="hidden md:hidden fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm">
      <div class="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6 flex flex-col gap-1 modal-panel">
        <div class="flex items-center justify-between mb-4">
          <span class="font-black text-red-600">ЦЭС</span>
          <button onclick="toggleMobileNav()" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" aria-label="Хаах"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${links.map((l) => `
          <a href="${l.href}" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${page === l.key ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-50"}">
            <i class="fa-solid ${l.icon} w-5"></i> ${l.label}
          </a>`).join("")}
        <div class="border-t border-gray-100 my-3"></div>
        ${user ? `
          <a href="profile.html" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50"><i class="fa-solid fa-user w-5"></i> Профайл</a>
          <a href="orders.html" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50"><i class="fa-solid fa-receipt w-5"></i> Миний захиалгууд</a>
          ${user.role === "admin" ? '<a href="admin/index.html" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50"><i class="fa-solid fa-shield-halved w-5"></i> Админ панель</a>' : ""}
          <button onclick="logoutUser()" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 text-left"><i class="fa-solid fa-right-from-bracket w-5"></i> Гарц</button>
        ` : `
          <a href="login.html" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50"><i class="fa-solid fa-right-to-bracket w-5"></i> Нэвтрэх</a>
          <a href="register.html" class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-white bg-red-600"><i class="fa-solid fa-user-plus w-5"></i> Бүртгүүлэх</a>
        `}
      </div>
    </div>`;
}

function toggleMobileNav() {
  const panel = document.getElementById("mobile-nav-panel");
  if (panel) panel.classList.toggle("hidden");
}

/* ============================ 13. НҮҮР ХУУДАСНЫ ХЭСГҮҮД ============================ */
function renderPopular() {
  const grid = document.getElementById("popular-grid");
  if (!grid) return;
  const items = POPULAR_IDS.map((id) => getFood(id)).filter(Boolean).slice(0, 6);
  grid.innerHTML = items.map((food, i) => foodCardHTML(food, i)).join("");
}

function renderStats() {
  const el = document.getElementById("hero-stats");
  if (!el) return;
  const orders = getOrders();
  el.innerHTML = `
    <div class="text-center"><p class="text-3xl font-black text-white">${foods.length}</p><p class="text-xs text-red-100 font-semibold uppercase tracking-wider">Төрлийн хоол</p></div>
    <div class="text-center"><p class="text-3xl font-black text-amber-300">${comboSets.length}</p><p class="text-xs text-red-100 font-semibold uppercase tracking-wider">Багц хоол</p></div>
    <div class="text-center"><p class="text-3xl font-black text-white">30</p><p class="text-xs text-red-100 font-semibold uppercase tracking-wider">Минут хүргэлт</p></div>
    <div class="text-center"><p class="text-3xl font-black text-white">${orders.length}</p><p class="text-xs text-red-100 font-semibold uppercase tracking-wider">Захиалга</p></div>`;
}

/* ============================ 14. НЭВТРЭХ / БҮРТГҮҮЛЭХ ХУУДАС ============================ */
function initAuthPage() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (!loginForm && !registerForm) return;

  if (getCurrentUser()) {
    showToast("Та аль хэдийн нэвтэрсэн байна.", "info", "Мэдээлэл");
    setTimeout(() => { window.location.href = "profile.html"; }, 900);
    return;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const errBox = document.getElementById("auth-error");
      const btn = loginForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = ".7"; }
      // ONLINE: Cloud бэлэн бол өөр төхөөрөмжийн бүртгэлээр ч нэвтэрнэ
      const res = await loginUserAsync(email, password);
      if (btn) { btn.disabled = false; btn.style.opacity = ""; }
      if (!res.ok) {
        errBox.textContent = res.error;
        errBox.classList.remove("hidden");
        showToast(res.error, "error", "Нэвтрэх боломжгүй");
        return;
      }
      errBox.classList.add("hidden");
      showToast(`Тавтай морилно уу, ${res.user.name}!`, "success", "Амжилттай нэвтэрлээ");
      setTimeout(() => {
        window.location.href = res.user.role === "admin" ? "admin/index.html" : "profile.html";
      }, 800);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();
      const password = document.getElementById("reg-password").value;
      const confirm = document.getElementById("reg-confirm").value;
      const errBox = document.getElementById("auth-error");
      const fail = (msg) => {
        errBox.textContent = msg;
        errBox.classList.remove("hidden");
        showToast(msg, "error", "Бүртгэл");
      };
      if (name.length < 2) return fail("Нэрээ бүтэн оруулна уу.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Имэйл хаяг буруу байна.");
      if (phone.replace(/\D/g, "").length !== 8) return fail("Утасны дугаар 8 оронтой байх ёстой.");
      if (password.length < 6) return fail("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      if (password !== confirm) return fail("Нууц үг давталт таарахгүй байна.");
      // ONLINE: local + Cloud хоёуланд бүртгэнэ (админ дурын төхөөрөмжөөс харна)
      const res = await registerUserAsync({ name, email, phone, password });
      if (!res.ok) return fail(res.error);
      errBox.classList.add("hidden");
      showToast("Бүртгэл амжилттай үүслээ. Одоо нэвтэрнэ үү!", "success", "Амжилттай");
      setTimeout(() => { window.location.href = "login.html"; }, 1100);
    });
  }
}

/* ============================ 15. ПРОФАЙЛ ХУУДАС ============================ */
function initProfilePage() {
  const root = document.getElementById("profile-root");
  if (!root) return;
  const user = getCurrentUser();
  if (!user) {
    root.innerHTML = `
      <div class="max-w-md mx-auto text-center bg-white rounded-3xl p-10 border border-gray-100 shadow-sm">
        <div class="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center text-3xl mb-4"><i class="fa-solid fa-lock"></i></div>
        <h2 class="text-2xl font-black text-gray-900 mb-2">Нэвтрэх шаардлагатай</h2>
        <p class="text-gray-500 mb-6">Профайл хэсгийг үзэхийн тулд эхлээд нэвтэрнэ үү.</p>
        <div class="flex gap-3 justify-center">
          <a href="login.html" class="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition">Нэвтрэх</a>
          <a href="register.html" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition">Бүртгүүлэх</a>
        </div>
      </div>`;
    return;
  }

  const myOrders = getMyOrders();
  const spent = myOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const active = myOrders.filter((o) => ["pending", "preparing", "delivering"].includes(o.status)).length;

  root.innerHTML = `
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
          <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-white text-3xl font-black flex items-center justify-center mb-4 shadow-lg shadow-red-200">
            ${escapeHtml((user.name || "?").charAt(0).toUpperCase())}
          </div>
          <h2 class="text-xl font-black text-gray-900">${escapeHtml(user.name)}</h2>
          <p class="text-sm text-gray-500">${escapeHtml(user.email)}</p>
          ${user.role === "admin" ? '<span class="inline-block mt-2 bg-red-100 text-red-700 text-[10px] font-black px-3 py-1 rounded-full">АДМИН ХЭРЭГЛЭГЧ</span>' : ""}
          <div class="grid grid-cols-3 gap-2 mt-6 text-center">
            <div class="bg-gray-50 rounded-2xl py-3"><p class="text-lg font-black text-red-600">${myOrders.length}</p><p class="text-[10px] text-gray-500 font-bold uppercase">Захиалга</p></div>
            <div class="bg-gray-50 rounded-2xl py-3"><p class="text-lg font-black text-amber-500">${active}</p><p class="text-[10px] text-gray-500 font-bold uppercase">Идэвхтэй</p></div>
            <div class="bg-gray-50 rounded-2xl py-3"><p class="text-lg font-black text-gray-900">${Math.round(spent / 1000)}k</p><p class="text-[10px] text-gray-500 font-bold uppercase">Зарцуулалт</p></div>
          </div>
          <div class="flex flex-col gap-2 mt-6">
            <a href="orders.html" class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"><i class="fa-solid fa-receipt mr-1"></i> Миний захиалгууд</a>
            ${user.role === "admin" ? '<a href="admin/index.html" class="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition"><i class="fa-solid fa-shield-halved mr-1"></i> Админ панель</a>' : ""}
            <button onclick="logoutUser()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"><i class="fa-solid fa-right-from-bracket mr-1"></i> Гарц</button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><i class="fa-solid fa-address-card text-red-600"></i> Хувийн мэдээлэл</h3>
          <form id="profile-form" class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Нэр</label>
              <input id="pf-name" type="text" value="${escapeHtml(user.name)}" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Утас</label>
              <input id="pf-phone" type="tel" value="${escapeHtml(user.phone || "")}" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-1">Хүргэлтийн хаяг</label>
              <textarea id="pf-address" rows="2" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">${escapeHtml(user.address || "")}</textarea>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-1">Имэйл (өөрчлөх боломжгүй)</label>
              <input type="email" value="${escapeHtml(user.email)}" disabled class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-400">
            </div>
            <div class="sm:col-span-2 flex gap-3">
              <button type="submit" class="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition"><i class="fa-solid fa-floppy-disk mr-1"></i> Хадгалах</button>
              <button type="button" onclick="togglePasswordForm()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition"><i class="fa-solid fa-key mr-1"></i> Нууц үг солих</button>
            </div>
          </form>
          <form id="password-form" class="hidden grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <input id="pw-old" type="password" placeholder="Хуучин нууц үг" class="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">
            <input id="pw-new" type="password" placeholder="Шинэ нууц үг" class="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">
            <button type="submit" class="bg-gray-900 hover:bg-red-600 text-white font-bold rounded-xl transition">Солих</button>
          </form>
        </div>

        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-black text-gray-900 flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left text-red-600"></i> Сүүлийн захиалгууд</h3>
            <a href="orders.html" class="text-sm font-bold text-red-600 hover:underline">Бүгдийг харах &rarr;</a>
          </div>
          ${myOrders.length === 0
            ? `<div class="text-center py-10">
                 <i class="fa-solid fa-receipt text-4xl text-gray-200 mb-3"></i>
                 <p class="text-gray-500">Одоогоор захиалга байхгүй байна.</p>
                 <a href="menu.html" class="inline-block mt-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-full transition">Хоол захиалах</a>
               </div>`
            : myOrders.slice(0, 4).map(orderCardHTML).join("")}
        </div>
      </div>
    </div>`;

  const form = document.getElementById("profile-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("pf-name").value.trim();
    const phone = document.getElementById("pf-phone").value.trim();
    const address = document.getElementById("pf-address").value.trim();
    if (name.length < 2) return showToast("Нэрээ зөв оруулна уу.", "error", "Алдаа");
    if (phone.replace(/\D/g, "").length !== 8) return showToast("Утасны дугаар 8 оронтой байх ёстой.", "error", "Алдаа");
    updateCurrentUser({ name, phone, address });
    renderHeader();
    showToast("Хувийн мэдээлэл амжилттай хадгалагдлаа.", "success", "Хадгалагдлаа");
  });

  const pwForm = document.getElementById("password-form");
  pwForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const oldPw = document.getElementById("pw-old").value;
    const newPw = document.getElementById("pw-new").value;
    const current = getCurrentUser();
    if (!current || current.password !== oldPw) return showToast("Хуучин нууц үг буруу байна.", "error", "Алдаа");
    if (newPw.length < 6) return showToast("Шинэ нууц үг 6+ тэмдэгт байх ёстой.", "error", "Алдаа");
    updateCurrentUser({ password: newPw });
    pwForm.reset();
    togglePasswordForm();
    showToast("Нууц үг амжилттай солигдлоо.", "success", "Амжилттай");
  });
}

function togglePasswordForm() {
  const f = document.getElementById("password-form");
  if (f) f.classList.toggle("hidden");
}

/* ============================ 16. ЗАХИАЛГЫН ТҮҮХ ХУУДАС ============================ */
function statusBadgeHTML(status) {
  const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
  const colors = {
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200"
  };
  return `<span class="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${colors[s.color]}">
    <i class="fa-solid ${s.icon}"></i> ${s.label}</span>`;
}

function orderCardHTML(order) {
  const items = (order.items || []).map((i) => `
    <div class="flex items-center gap-3 py-2">
      <img src="${i.img}" onerror="this.onerror=null;this.src='${CONFIG.fallbackImg}'" class="w-10 h-10 rounded-lg object-cover" alt="${escapeHtml(i.name)}">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">${escapeHtml(i.name)}
          ${i.isCombo ? '<span class="ml-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">БАГЦ</span>' : ""}
        </p>
        ${i.includes && i.includes.length ? `<p class="text-[11px] text-gray-400 truncate">${escapeHtml(i.includes.join(" + "))}</p>` : ""}
        <p class="text-xs text-gray-500">${money(i.price)} × ${i.qty}</p>
      </div>
      <span class="text-sm font-bold text-gray-700">${money(i.price * i.qty)}</span>
    </div>`).join("");

  const steps = ["pending", "preparing", "delivering", "delivered"];
  const currentIdx = steps.indexOf(order.status);
  const timeline = order.status === "cancelled"
    ? `<div class="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-3 py-2"><i class="fa-solid fa-circle-xmark mr-1"></i> Энэ захиалга цуцлагдсан.</div>`
    : `<div class="flex items-center gap-1 mt-4">
        ${steps.map((s, i) => `
          <div class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full h-1.5 rounded-full ${i <= currentIdx ? "bg-red-600" : "bg-gray-200"} transition"></div>
            <span class="text-[10px] font-bold ${i <= currentIdx ? "text-red-600" : "text-gray-400"} text-center leading-tight">${ORDER_STATUS[s].label}</span>
          </div>`).join("")}
      </div>`;

  return `
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 hover:shadow-md transition fade-in-up">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <p class="font-black text-gray-900">#${escapeHtml(order.code)}</p>
          <p class="text-xs text-gray-500"><i class="fa-regular fa-clock mr-1"></i>${formatDate(order.createdAt)} • ${timeAgo(order.createdAt)}</p>
        </div>
        <div class="flex items-center gap-2">
          ${statusBadgeHTML(order.status)}
          ${order.status === "pending" ? `<button onclick="cancelOrder('${order.id}')" class="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition border border-red-200">Цуцлах</button>` : ""}
        </div>
      </div>
      <div class="pt-2 divide-y divide-gray-50">${items}</div>
      <div class="pt-3 mt-2 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 text-sm">
        <div class="text-gray-500">
          <i class="fa-solid fa-location-dot mr-1 text-red-500"></i>${escapeHtml((order.customer && order.customer.address) || "-")}
        </div>
        <div class="text-right">
          ${order.discount > 0 ? `<span class="text-xs text-green-600 font-bold mr-2">Хямдрал -${money(order.discount)}</span>` : ""}
          <span class="text-xs text-gray-500">Хүргэлт ${order.deliveryFee === 0 ? "үнэгүй" : money(order.deliveryFee)}</span>
          <p class="text-lg font-black text-red-600">${money(order.total)}</p>
        </div>
      </div>
      ${timeline}
    </div>`;
}

function cancelOrder(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;
  if (order.status !== "pending") {
    showToast("Зөвхөн хүлээгдэж буй захиалгыг цуцлах боломжтой.", "warning", "Боломжгүй");
    return;
  }
  if (!confirm(`#${order.code} захиалгыг цуцлах уу?`)) return;
  updateOrderStatus(orderId, "cancelled");
  showToast("Захиалга цуцлагдлаа.", "info", "Цуцлагдлаа");
  initOrdersPage();
}

function initOrdersPage() {
  const root = document.getElementById("orders-root");
  if (!root) return;
  const user = getCurrentUser();

  if (!user) {
    root.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center mb-6">
          <div class="w-20 h-20 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-3xl mb-4"><i class="fa-solid fa-user-lock"></i></div>
          <h2 class="text-2xl font-black text-gray-900 mb-2">Нэвтэрч захиалгаа хянаарай</h2>
          <p class="text-gray-500 mb-6">Нэвтэрсэн тохиолдолд таны бүх захиалгын түүх энд харагдана.</p>
          <div class="flex gap-3 justify-center">
            <a href="login.html" class="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition">Нэвтрэх</a>
            <a href="register.html" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition">Бүртгүүлэх</a>
          </div>
        </div>
        <div class="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h3 class="font-black text-gray-900 mb-2"><i class="fa-solid fa-phone text-red-600 mr-1"></i> Зочноор хийсэн захиалгаа хайх</h3>
          <p class="text-sm text-gray-500 mb-4">Захиалга хийхдээ ашигласан утасны дугаараа оруулна уу.</p>
          <div class="flex gap-2">
            <input id="phone-lookup" type="tel" placeholder="99112233" class="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none">
            <button onclick="lookupOrders()" class="bg-gray-900 hover:bg-red-600 text-white font-bold px-6 rounded-xl transition">Хайх</button>
          </div>
          <div id="lookup-result" class="mt-6"></div>
        </div>
      </div>`;
    return;
  }

  const myOrders = getMyOrders();
  const active = myOrders.filter((o) => ["pending", "preparing", "delivering"].includes(o.status));

  root.innerHTML = `
    <div class="grid sm:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl"><i class="fa-solid fa-receipt"></i></div>
        <div><p class="text-2xl font-black text-gray-900">${myOrders.length}</p><p class="text-xs text-gray-500 font-bold uppercase">Нийт захиалга</p></div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl"><i class="fa-solid fa-motorcycle"></i></div>
        <div><p class="text-2xl font-black text-gray-900">${active.length}</p><p class="text-xs text-gray-500 font-bold uppercase">Идэвхтэй</p></div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl"><i class="fa-solid fa-wallet"></i></div>
        <div><p class="text-2xl font-black text-gray-900">${money(myOrders.reduce((s, o) => s + o.total, 0))}</p><p class="text-xs text-gray-500 font-bold uppercase">Нийт дүн</p></div>
      </div>
    </div>
    <div id="orders-list">
      ${myOrders.length === 0
        ? `<div class="text-center bg-white rounded-3xl border border-gray-100 py-16">
             <div class="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-400 flex items-center justify-center text-3xl mb-4"><i class="fa-solid fa-bowl-food"></i></div>
             <h3 class="text-xl font-black text-gray-800 mb-2">Захиалгын түүх хоосон байна</h3>
             <p class="text-gray-500 mb-6">Анхны захиалгаа хийгээд амттай хоолыг хүлээж аваарай!</p>
             <a href="menu.html" class="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition">Цэс рүү очих</a>
           </div>`
        : myOrders.map(orderCardHTML).join("")}
    </div>
    <p class="text-center text-xs text-gray-400 mt-6"><i class="fa-solid fa-rotate mr-1"></i> Хуудас автоматаар 5 секунд тутамд шинэчлэгдэнэ.</p>`;
}

function lookupOrders() {
  const input = document.getElementById("phone-lookup");
  const box = document.getElementById("lookup-result");
  if (!input || !box) return;
  const orders = getOrdersByPhone(input.value);
  if (orders.length === 0) {
    box.innerHTML = `<div class="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Энэ дугаараар захиалга олдсонгүй.</div>`;
    return;
  }
  box.innerHTML = `<p class="text-sm font-bold text-gray-700 mb-3">${orders.length} захиалга олдлоо:</p>` + orders.map(orderCardHTML).join("");
}

/* ============================ 17. ЕРӨНХИЙ INIT ============================ */
function initCommon() {
  seedAdmin();
  ensureCartUI();
  ensureToastHost();
  renderHeader();
  updateCartUI();

  // >>> ONLINE INIT (non-blocking): Firebase тохируулсан бол Cloud-д холбогдоно.
  // Тохируулаагүй бол localStorage горимоор чимээгүй үргэлжилнэ.
  try {
    initCloud().then((ok) => {
      if (ok) {
        seedAdmin(); // cloud бэлэн болсны дараа админыг cloud руу хуулна
        CLOUD.listeners.push(() => {
          try {
            renderHeader();
            const page = document.body.dataset.page || "";
            if (page === "home") renderStats();
            // orders/profile хуудсыг initCloud сонсогч автоматаар дахин зурна
          } catch (e) {}
        });
      }
    }).catch(() => {});
  } catch (e) {}

  // Cloud-аас ирсэн реал-тайм шинэчлэлээр хэрэглэгчийн хуудсыг шууд дахин зурна
  window.addEventListener("ordersUpdated", () => {
    try {
      const page = document.body.dataset.page || "";
      if (page === "home") renderStats();
    } catch (e) {}
  });

  // Нээлттэй таб дээр сагс/захиалга шинэчлэгдэхэд мэдээлэл авна
  window.addEventListener("storage", (e) => {
    if (e.key === CONFIG.keys.cart) {
      cart = getCartRaw();
      updateCartUI();
    }
    if (e.key === CONFIG.keys.session) {
      renderHeader();
    }
  });

  // Esc товчоор модалуудыг хаана
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const cartModal = document.getElementById("cart-modal");
    if (cartModal && !cartModal.classList.contains("hidden")) { toggleCart(); return; }
    const co = document.getElementById("checkout-modal");
    if (co && !co.classList.contains("hidden")) { closeCheckout(); return; }
    const qv = document.getElementById("quick-view-modal");
    if (qv && !qv.classList.contains("hidden")) { closeQuickView(); return; }
    const su = document.getElementById("success-modal");
    if (su && !su.classList.contains("hidden")) { closeSuccess(); return; }
    const mn = document.getElementById("mobile-nav-panel");
    if (mn && !mn.classList.contains("hidden")) toggleMobileNav();
  });

  // Дээш гарах товч
  if (!document.getElementById("scroll-top-btn")) {
    const btn = document.createElement("button");
    btn.id = "scroll-top-btn";
    btn.className = "scroll-top hidden";
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.setAttribute("aria-label", "Дээш");
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.appendChild(btn);
    window.addEventListener("scroll", () => {
      btn.classList.toggle("hidden", window.scrollY < 400);
    }, { passive: true });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initCommon();

  const page = document.body.dataset.page || "";

  if (page === "menu") {
    /* URL-аас ангилал уншина: menu.html?cat=combo */
    try {
      const params = new URLSearchParams((window.location && window.location.search) || "");
      const cat = params.get("cat");
      if (cat && CATEGORIES.some((c) => c.id === cat)) activeCategory = cat;
    } catch (e) { /* алгасна */ }
    renderCategoryButtons();
    applyFilters();
  }
  if (page === "home") {
    renderPopular();
    renderStats();
    renderCategoryTiles();
    renderComboShowcase();
  }
  if (page === "auth") initAuthPage();
  if (page === "profile") initProfilePage();
  if (page === "orders") initOrdersPage();

  // Хайлтын талбар байгаа бүх хуудсанд ажиллана
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => onSearchInput(e.target.value));
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); applyFilters(); }
    });
  }

  // Захиалгын түүх хуудсыг тогтмол шинэчлэх
  if (page === "orders" && getCurrentUser()) {
    setInterval(() => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;
      initOrdersPage();
    }, 5000);
  }
});

/* Глобал экспорт (admin.js болон бусад скриптэд хэрэгтэй) */
window.TH = {
  foods, comboSets, allItems, CONFIG, ORDER_STATUS, CATEGORIES, PROMO_CODES,
  money, escapeHtml, formatDate, timeAgo, getFood,
  comboBasePrice, comboSavings, comboIncludesList, comboIncludesText,
  getOrders, saveOrders, saveOrder, deleteOrder, updateOrderStatus, getCurrentUser, isAdmin, isLoggedIn,
  getMyOrders, addToCart, toggleCart, showToast, cartCount, renderHeader, logoutUser,
  // >>> ONLINE API (Firebase Realtime Database):
  FIREBASE_CONFIG, CLOUD, ORDERS_PATH, USERS_PATH, isCloudConfigured, isCloudReady, initCloud,
  loginUserAsync, registerUserAsync, cloudUpsertOrder, cloudRemoveOrder, cloudUpsertUser
};
/* =====================================================================
   "ТҮРГЭН ХАЗАЛТ" — АДМИН ПАНЕЛЬ (admin/admin.js)
   ---------------------------------------------------------------------
   Энэ файл нь үндсэн сайтаас ТУСДАА ажиллана. localStorage дээрх
   нийтлэг түлхүүрүүдийг (tz_orders, tz_users, tz_session) уншиж/бичиж,
   ирсэн захиалгыг бодит цагт харуулж, төлөвийг өөрчилнө.
   ===================================================================== */

/* ============================ ТОХИРГОО ============================ */
const ADMIN_CONFIG = {
  keys: { orders: "tz_orders", users: "tz_users", session: "tz_session", sound: "tz_admin_sound" },
  adminEmail: "admin@turgunhazalt.mn",
  adminPassword: "admin123",
  currency: "₮",
  fallbackImg: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80"
};

/* ============================ CLOUD BACKEND (FIREBASE RTDB) ============================
   Үндсэн сайтын script.js дэх FIREBASE_CONFIG-той ИЖИЛ утгыг энд буулгана.
   Ижил databaseURL ашигласнаар хэрэглэгчийн захиалга админ дээр РЕАЛ-ТАЙМ ирнэ:
     хэрэглэгч: db.ref('orders').push(orderData)
     админ:     db.ref('orders').on('value', ...) — reload-гүй секунд бүрд шууд харагдана.
   Тохируулаагүй үед localStorage горимоор хэвээр ажиллана (эвдэрдэггүй).
   HTML-д Firebase CDN (compat v10.12.2) аль хэдийн суусан.

   Firebase үүсгэх заавар script.js-ийн дээд хэсэгт (0-р бүлэг) бий.
   Rules жишээ:
   { "rules": { "orders": { ".read": true, ".write": true },
                "users":  { ".read": true, ".write": true } } }
*/
const ADMIN_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAc7Ycu-ASeXZ04_ds9_-XKzjcD1YfwwuI",
  authDomain: "turgen-hazalt.firebaseapp.com",
  databaseURL: "https://turgen-hazalt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "turgen-hazalt",
  storageBucket: "turgen-hazalt.firebasestorage.app",
  messagingSenderId: "178635818587",
  appId: "1:178635818587:web:680357f8c93fa685e6217e",
  measurementId: "G-6WV7TSNE06"
};

const ADMIN_CLOUD = { enabled: false, db: null, auth: null, ordersCache: null };

function adminCloudConfigured() {
  return !!(ADMIN_FIREBASE_CONFIG.apiKey && ADMIN_FIREBASE_CONFIG.databaseURL && ADMIN_FIREBASE_CONFIG.projectId);
}

function adminLoadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("CDN ачаалсангүй: " + src));
    document.head.appendChild(s);
  });
}

async function adminInitCloud() {
  if (!adminCloudConfigured() || ADMIN_CLOUD.enabled) return ADMIN_CLOUD.enabled;
  try {
    const V = "10.12.2";
    await adminLoadScriptOnce(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
    await adminLoadScriptOnce(`https://www.gstatic.com/firebasejs/${V}/firebase-database-compat.js`);
    try { await adminLoadScriptOnce(`https://www.gstatic.com/firebasejs/${V}/firebase-auth-compat.js`); } catch (e) {}
    if (!window.firebase) throw new Error("firebase SDK алдаа");
    if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(ADMIN_FIREBASE_CONFIG);
    ADMIN_CLOUD.db = firebase.database();
    try {
      if (firebase.auth) {
        ADMIN_CLOUD.auth = firebase.auth();
        ADMIN_CLOUD.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      }
    } catch (e) {}
    ADMIN_CLOUD.enabled = true;
    console.info("%c[Admin Cloud] ONLINE", "color:#16a34a;font-weight:bold");

    // Реал-тайм захиалгын сонсогч — ШААРДЛАГА: db.ref('orders').on('value', ...) reload-гүй
    // Шинэ захиалга 1-2 сек-д автоматаар гарч ирнэ (А утас → Б утасны админ).
    ADMIN_CLOUD.db.ref('orders').on('value', (snap) => {
      try {
        const val = snap.val();
        const arr = val ? Object.values(val) : [];
        const isFirst = ADMIN_CLOUD.ordersCache === null;
        ADMIN_CLOUD.ordersCache = arr;
        try { localStorage.setItem(ADMIN_CONFIG.keys.orders, JSON.stringify(arr)); } catch (e) {}
        ordersCache = arr.slice();
        detectNewOrders();
        renderAll();
      } catch (e) { console.warn("[Admin Cloud] parse алдаа:", e); }
    });
    return true;
  } catch (e) {
    console.warn("[Admin Cloud] OFFLINE (local горим):", e.message);
    return false;
  }
}

function adminCloudReady() { return ADMIN_CLOUD.enabled && !!ADMIN_CLOUD.db; }

function adminCloudUpsert(order) {
  if (!adminCloudReady() || !order || !order.id) return;
  try { ADMIN_CLOUD.db.ref('orders/' + order.id).set(order).catch(() => {}); } catch (e) {}
}

/* ШААРДЛАГА: db.ref('orders').push(orderData) — админаас тест захиалга нэмэхэд шууд Cloud-д орно */
function adminSaveOrder(orderData) {
  if (!orderData || typeof orderData !== 'object') return Promise.reject(new Error('orderData хоосон'));
  if (adminCloudReady()) {
    try {
      const db = ADMIN_CLOUD.db;
      if (orderData.id) return db.ref('orders/' + orderData.id).set(orderData);
      return db.ref('orders').push(orderData);
    } catch (e) { return Promise.reject(e); }
  }
  const arr = loadOrders(); arr.unshift({ ...orderData, id: orderData.id || ('ord_' + Date.now()) });
  saveOrders(arr); renderAll();
  return Promise.resolve(orderData);
}

/* ШААРДЛАГА: deleteOrder — db.ref('orders/<id>').remove() + local */
function adminDeleteOrder(orderId) {
  if (!orderId) return Promise.resolve(false);
  try {
    const arr = loadOrders().filter((o) => o && o.id !== orderId);
    saveOrders(arr);
    if (ADMIN_CLOUD.ordersCache !== null) ADMIN_CLOUD.ordersCache = ADMIN_CLOUD.ordersCache.filter((o) => o && o.id !== orderId);
  } catch (e) {}
  if (adminCloudReady()) {
    try { return ADMIN_CLOUD.db.ref('orders/' + orderId).remove().then(() => { renderAll(); return true; }).catch(() => false); }
    catch (e) {}
  }
  renderAll();
  return Promise.resolve(true);
}
// Хуучин нэртэй дуудалтуудтай нийцтэй байлгах alias-ууд:
const saveOrder = adminSaveOrder;
const deleteOrder = adminDeleteOrder;
const getOrders = loadOrders;

function adminCloudUpsertUser(user) {
  if (!adminCloudReady() || !user || !user.id) return;
  try { ADMIN_CLOUD.db.ref('users/' + user.id).set({ ...user }).catch(() => {}); } catch (e) {}
}

const ADMIN_STATUS = {
  pending:    { label: "Хүлээгдэж буй",     icon: "fa-hourglass-half",  cls: "pending"   },
  preparing:  { label: "Бэлтгэж байна",     icon: "fa-fire-burner",     cls: "preparing" },
  delivering: { label: "Хүргэлтэнд гарсан", icon: "fa-motorcycle",      cls: "delivering"},
  delivered:  { label: "Хүргэгдсэн",        icon: "fa-circle-check",    cls: "delivered" },
  cancelled:  { label: "Цуцлагдсан",        icon: "fa-circle-xmark",    cls: "cancelled" }
};

const PAYMENT_LABEL = { cash: "Бэлнээр", card: "Карт", transfer: "Дансаар" };

/* ============================ ТӨЛӨВ ============================ */
let adminFilter = "all";
let adminSearch = "";
let adminSort = "newest";
let ordersCache = [];
let knownOrderIds = new Set();
let firstLoadDone = false;
let refreshTimer = null;

/* ============================ ТУСЛАХ ============================ */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (e) { return fallback; }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { return false; }
}

function money(n) {
  return (Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " " + ADMIN_CONFIG.currency;
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

function isToday(iso) {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ============================ TOAST ============================ */
function adminToast(message, type = "success", title = "") {
  let host = document.getElementById("admin-toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "admin-toast-host";
    host.className = "toast-container";
    document.body.appendChild(host);
  }
  const icons = { success: "fa-circle-check", error: "fa-circle-exclamation", warning: "fa-triangle-exclamation", info: "fa-circle-info" };
  const titles = { success: "Амжилттай", error: "Алдаа", warning: "Анхаар", info: "Мэдээлэл" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
    <div class="toast-body">
      <p class="toast-title">${escapeHtml(title || titles[type])}</p>
      <p class="toast-message">${escapeHtml(message)}</p>
    </div>
    <button class="toast-close" aria-label="Хаах">&times;</button>
    <span class="toast-progress"></span>`;
  host.appendChild(el);
  const remove = () => { el.classList.add("toast-out"); setTimeout(() => el.remove(), 320); };
  el.querySelector(".toast-close").addEventListener("click", remove);
  setTimeout(remove, 3600);
}

/* Дуут мэдэгдэл */
function beep() {
  if (readJSON(ADMIN_CONFIG.keys.sound, true) === false) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1180, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.32);
    setTimeout(() => ctx.close(), 600);
  } catch (e) { /* алгасна */ }
}

function toggleSound() {
  const current = readJSON(ADMIN_CONFIG.keys.sound, true);
  writeJSON(ADMIN_CONFIG.keys.sound, !current);
  renderSoundButton();
  adminToast(!current ? "Дуут мэдэгдэл асаалттай." : "Дуут мэдэгдэл унтраалттай.", "info", "Тохиргоо");
}

function renderSoundButton() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  const on = readJSON(ADMIN_CONFIG.keys.sound, true) !== false;
  btn.innerHTML = `<i class="fa-solid ${on ? "fa-volume-high" : "fa-volume-xmark"}"></i>`;
  btn.title = on ? "Дуут мэдэгдэл асаалттай" : "Дуут мэдэгдэл унтраалттай";
}

/* ============================ ХАНДАЛТ (AUTH) ============================ */
function getAdminUser() {
  const session = readJSON(ADMIN_CONFIG.keys.session, null);
  if (!session || !session.userId) return null;
  const users = readJSON(ADMIN_CONFIG.keys.users, []);
  return users.find((u) => u.id === session.userId) || null;
}

function isAdminLoggedIn() {
  const u = getAdminUser();
  return !!(u && u.role === "admin");
}

function ensureAdminAccount() {
  const users = readJSON(ADMIN_CONFIG.keys.users, []);
  if (!users.some((u) => u.email === ADMIN_CONFIG.adminEmail)) {
    users.push({
      id: "u_admin",
      name: "Систем Админ",
      email: ADMIN_CONFIG.adminEmail,
      phone: "77001122",
      address: "Улаанбаатар хот, Сүхбаатар дүүрэг",
      password: ADMIN_CONFIG.adminPassword,
      role: "admin",
      createdAt: new Date().toISOString()
    });
    writeJSON(ADMIN_CONFIG.keys.users, users);
  }
  // Cloud бэлэн бол админыг cloud руу хуулна (ямар ч төхөөрөмжөөс нэвтрэхэд)
  try {
    const admin = (readJSON(ADMIN_CONFIG.keys.users, [])).find((u) => u.email === ADMIN_CONFIG.adminEmail);
    if (admin) adminCloudUpsertUser(admin);
  } catch (e) {}
}

async function adminLogin(e) {
  e.preventDefault();
  const email = document.getElementById("admin-email").value.trim().toLowerCase();
  const password = document.getElementById("admin-password").value;
  let users = readJSON(ADMIN_CONFIG.keys.users, []);
  // ONLINE: Cloud-аас хэрэглэгчдийг татаж шалгана (өөр төхөөрөмжийн бүртгэл/дэвсгэр)
  // Админ логин өөр өөр төхөөрөмжөөс нэвтэрсэн ч онлайн DB-ээр шалгагдаж хадгалагдана.
  if (adminCloudReady()) {
    try {
      const snap = await ADMIN_CLOUD.db.ref('users').once('value');
      const val = snap.val();
      if (val) {
        const cloudUsers = Object.values(val);
        users = cloudUsers;
        try { localStorage.setItem(ADMIN_CONFIG.keys.users, JSON.stringify(cloudUsers)); } catch (err) {}
      }
    } catch (err) { console.warn("[Admin] cloud users уншихад алдаа:", err); }
  }
  const user = users.find((u) => u.email === email);
  const errBox = document.getElementById("admin-login-error");
  const fail = (msg) => {
    errBox.textContent = msg;
    errBox.classList.remove("hidden");
    adminToast(msg, "error", "Нэвтрэх боломжгүй");
  };
  if (!user) return fail("Ийм имэйл хаягтай хэрэглэгч олдсонгүй.");
  if (user.password !== password) return fail("Нууц үг буруу байна.");
  if (user.role !== "admin") return fail("Танд админ эрх байхгүй байна.");
  writeJSON(ADMIN_CONFIG.keys.session, { userId: user.id, email: user.email, at: new Date().toISOString() });
  try { if (ADMIN_CLOUD.auth) ADMIN_CLOUD.auth.signInWithEmailAndPassword(email, password).catch(() => {}); } catch (e) {}
  adminToast(`Тавтай морилно уу, ${user.name}!`, "success", "Амжилттай нэвтэрлээ");
  setTimeout(() => window.location.reload(), 600);
}

function adminLogout() {
  localStorage.removeItem(ADMIN_CONFIG.keys.session);
  try { if (ADMIN_CLOUD.auth) ADMIN_CLOUD.auth.signOut().catch(() => {}); } catch (e) {}
  window.location.href = "../index.html";
}

/* ============================ ӨГӨГДӨЛ (LOCAL + CLOUD) ============================ */
function loadOrders() {
  // Cloud кэш бэлэн бол түүнийг ашиглана (реал-тайм)
  if (ADMIN_CLOUD.ordersCache !== null && Array.isArray(ADMIN_CLOUD.ordersCache)) {
    ordersCache = ADMIN_CLOUD.ordersCache.slice();
    return ordersCache;
  }
  const orders = readJSON(ADMIN_CONFIG.keys.orders, []);
  ordersCache = Array.isArray(orders) ? orders.slice() : [];
  return ordersCache;
}

function saveOrders(orders) {
  ordersCache = orders;
  writeJSON(ADMIN_CONFIG.keys.orders, orders);
  try {
    const bc = new BroadcastChannel("turgun-hazalt");
    bc.postMessage({ type: "orders-updated", count: orders.length });
    bc.close();
  } catch (e) { /* алгасна */ }
}

function setOrderStatus(orderId, status) {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) { adminToast("Захиалга олдсонгүй.", "error"); return; }
  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  orders[idx].statusHistory = orders[idx].statusHistory || [];
  orders[idx].statusHistory.push({ status, at: orders[idx].updatedAt });
  saveOrders(orders);
  // >>> ONLINE SYNC: төлөв өөрчлөлт Cloud-д бичигдэж, хэрэглэгчийн утсан дээр шууд шинэчлэгдэнэ
  adminCloudUpsert(orders[idx]);
  try {
    if (ADMIN_CLOUD.ordersCache !== null) {
      const ci = ADMIN_CLOUD.ordersCache.findIndex((o) => o.id === orderId);
      if (ci > -1) ADMIN_CLOUD.ordersCache[ci] = { ...orders[idx] };
    }
  } catch (e) {}
  adminToast(`#${orders[idx].code} захиалгын төлөв "${ADMIN_STATUS[status].label}" болж өөрчлөгдлөө.`, "success", "Төлөв шинэчлэгдлээ");
  renderAll();
}

/* ============================ ШҮҮЛТ ============================ */
function getFilteredOrders() {
  let list = loadOrders().slice();
  if (adminFilter !== "all") list = list.filter((o) => o.status === adminFilter);
  if (adminSearch) {
    const q = adminSearch.toLowerCase().trim();
    list = list.filter((o) => {
      const hay = [
        o.code, o.customer && o.customer.name, o.customer && o.customer.phone,
        o.customer && o.customer.address, o.userEmail,
        (o.items || []).map((i) => i.name).join(" ")
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }
  if (adminSort === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (adminSort === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (adminSort === "amount-desc") list.sort((a, b) => b.total - a.total);
  else if (adminSort === "amount-asc") list.sort((a, b) => a.total - b.total);
  return list;
}

function statusBadge(status) {
  const s = ADMIN_STATUS[status] || ADMIN_STATUS.pending;
  return `<span class="status-badge status-${s.cls}"><i class="fa-solid ${s.icon}"></i> ${s.label}</span>`;
}

/* ============================ СТАТИСТИК ============================ */
function computeStats() {
  const orders = loadOrders();
  const active = orders.filter((o) => ["pending", "preparing", "delivering"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const todayRevenue = todayOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const itemsSold = orders.filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.items || []).reduce((x, i) => x + i.qty, 0), 0);

  /* Хамгийн их борлуулалттай 5 хоол */
  const map = {};
  orders.filter((o) => o.status !== "cancelled").forEach((o) => {
    (o.items || []).forEach((i) => {
      if (!map[i.name]) map[i.name] = { name: i.name, img: i.img, qty: 0, revenue: 0 };
      map[i.name].qty += i.qty;
      map[i.name].revenue += i.price * i.qty;
    });
  });
  const top = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);

  return {
    total: orders.length,
    active: active.length,
    delivered: delivered.length,
    cancelled: cancelled.length,
    revenue, todayOrders: todayOrders.length, todayRevenue, itemsSold,
    avg: orders.length ? Math.round(revenue / Math.max(1, orders.filter((o) => o.status !== "cancelled").length)) : 0,
    top,
    byStatus: {
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      delivering: orders.filter((o) => o.status === "delivering").length,
      delivered: delivered.length,
      cancelled: cancelled.length
    }
  };
}

/* ============================ ДЭЛГЭРЭНГҮЙ МОДАЛ ============================ */
function openOrderDetail(orderId) {
  const order = loadOrders().find((o) => o.id === orderId);
  if (!order) return;
  let modal = document.getElementById("order-detail-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "order-detail-modal";
    modal.className = "fixed inset-0 z-[80] hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
    modal.addEventListener("click", (e) => { if (e.target === modal) closeOrderDetail(); });
    document.body.appendChild(modal);
  }
  const items = (order.items || []).map((i) => `
    <div class="flex items-center gap-3 py-2.5">
      <img src="${i.img}" onerror="this.onerror=null;this.src='${ADMIN_CONFIG.fallbackImg}'" class="w-11 h-11 rounded-lg object-cover" alt="">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-gray-800 truncate">${escapeHtml(i.name)}
          ${i.isCombo ? '<span class="ml-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">БАГЦ</span>' : ""}
        </p>
        ${i.includes && i.includes.length ? `<p class="text-[11px] text-gray-400 truncate">${escapeHtml(i.includes.join(" + "))}</p>` : ""}
        <p class="text-xs text-gray-500">${money(i.price)} × ${i.qty}</p>
      </div>
      <span class="text-sm font-black text-gray-800">${money(i.price * i.qty)}</span>
    </div>`).join("");

  const history = (order.statusHistory || []).map((h) => `
    <div class="flex items-center gap-3 text-xs">
      <span class="status-dot" style="background:${statusColor(h.status)}"></span>
      <span class="font-bold text-gray-700">${ADMIN_STATUS[h.status] ? ADMIN_STATUS[h.status].label : h.status}</span>
      <span class="text-gray-400">${formatDate(h.at)}</span>
    </div>`).join("");

  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto admin-scroll modal-panel">
      <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
        <div>
          <h3 class="text-xl font-black text-gray-900">#${escapeHtml(order.code)}</h3>
          <p class="text-xs text-gray-500">${formatDate(order.createdAt)} • ${timeAgo(order.createdAt)}</p>
        </div>
        <button onclick="closeOrderDetail()" class="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 transition flex items-center justify-center" aria-label="Хаах">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-3">
          ${statusBadge(order.status)}
          <div class="flex flex-wrap gap-2">
            ${Object.keys(ADMIN_STATUS).map((s) => `
              <button onclick="setOrderStatus('${order.id}','${s}');openOrderDetail('${order.id}')"
                class="text-xs font-bold px-3 py-1.5 rounded-full border transition ${order.status === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600"}">
                ${ADMIN_STATUS[s].label}
              </button>`).join("")}
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="bg-gray-50 rounded-2xl p-4">
            <p class="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Хэрэглэгч</p>
            <p class="font-bold text-gray-900">${escapeHtml(order.customer ? order.customer.name : "-")}</p>
            <p class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-phone text-red-500 mr-1"></i>${escapeHtml(order.customer ? order.customer.phone : "-")}</p>
            <p class="text-sm text-gray-600 mt-1"><i class="fa-solid fa-location-dot text-red-500 mr-1"></i>${escapeHtml(order.customer ? order.customer.address : "-")}</p>
            ${order.customer && order.customer.note ? `<p class="text-sm text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-2"><i class="fa-solid fa-note-sticky mr-1"></i>${escapeHtml(order.customer.note)}</p>` : ""}
          </div>
          <div class="bg-gray-50 rounded-2xl p-4">
            <p class="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Төлбөр &amp; Хугацаа</p>
            <p class="text-sm text-gray-600">Төлбөрийн хэлбэр: <span class="font-bold text-gray-900">${PAYMENT_LABEL[order.payment] || "Бэлнээр"}</span></p>
            <p class="text-sm text-gray-600">Бүртгэл: <span class="font-bold text-gray-900">${order.userEmail ? escapeHtml(order.userEmail) : "Зочин"}</span></p>
            <p class="text-sm text-gray-600">Сүүлд шинэчлэгдсэн: <span class="font-bold text-gray-900">${formatDate(order.updatedAt)}</span></p>
            ${order.promoCode ? `<p class="text-sm text-green-600 font-bold mt-1"><i class="fa-solid fa-tag mr-1"></i>${escapeHtml(order.promoCode)} код ашиглагдсан</p>` : ""}
          </div>
        </div>

        <div>
          <p class="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Захиалсан хоолнууд</p>
          <div class="divide-y divide-gray-50 border border-gray-100 rounded-2xl px-4">${items}</div>
        </div>

        <div class="bg-gray-900 text-white rounded-2xl p-4 space-y-1.5 text-sm">
          <div class="flex justify-between text-gray-300"><span>Хоолны дүн:</span><span>${money(order.subtotal)}</span></div>
          ${order.discount > 0 ? `<div class="flex justify-between text-green-400"><span>Хямдрал:</span><span>-${money(order.discount)}</span></div>` : ""}
          <div class="flex justify-between text-gray-300"><span>Хүргэлт:</span><span>${order.deliveryFee === 0 ? "Үнэгүй" : money(order.deliveryFee)}</span></div>
          <div class="flex justify-between text-xl font-black pt-2 border-t border-white/10"><span>Нийт:</span><span class="text-amber-400">${money(order.total)}</span></div>
        </div>

        <div>
          <p class="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Төлөвийн түүх</p>
          <div class="space-y-2">${history || '<p class="text-sm text-gray-400">Мэдээлэл байхгүй.</p>'}</div>
        </div>

        <div class="flex gap-2 no-print">
          <button onclick="printOrder('${order.id}')" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition"><i class="fa-solid fa-print mr-1"></i> Хэвлэх</button>
          <button onclick="copyOrderText('${order.id}')" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"><i class="fa-solid fa-copy mr-1"></i> Хуулах</button>
        </div>
      </div>
    </div>`;
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function statusColor(status) {
  return {
    pending: "#f59e0b", preparing: "#3b82f6", delivering: "#6366f1",
    delivered: "#16a34a", cancelled: "#dc2626"
  }[status] || "#94a3b8";
}

function closeOrderDetail() {
  const modal = document.getElementById("order-detail-modal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function orderToText(order) {
  const lines = (order.items || []).map((i) => {
    const inc = i.includes && i.includes.length ? `\n      ↳ Багтсан: ${i.includes.join(" + ")}` : "";
    return `  • ${i.name}${i.isCombo ? " (багц)" : ""} × ${i.qty} = ${money(i.price * i.qty)}${inc}`;
  }).join("\n");
  return `#${order.code}\nХарилцагч: ${order.customer ? order.customer.name : "-"} (${order.customer ? order.customer.phone : "-"})\nХаяг: ${order.customer ? order.customer.address : "-"}\nОгноо: ${formatDate(order.createdAt)}\nТөлөв: ${ADMIN_STATUS[order.status].label}\n---\n${lines}\n---\nХоолны дүн: ${money(order.subtotal)}\nХямдрал: ${money(order.discount || 0)}\nХүргэлт: ${money(order.deliveryFee)}\nНИЙТ: ${money(order.total)}`;
}

function copyOrderText(orderId) {
  const order = loadOrders().find((o) => o.id === orderId);
  if (!order) return;
  const text = orderToText(order);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => adminToast("Захиалгын мэдээлэл хуулагдлаа.", "success", "Хуулагдлаа"),
      () => adminToast("Хуулах боломжгүй байна.", "error")
    );
  } else {
    adminToast("Хөтөч хуулах функцийг дэмжихгүй байна.", "warning");
  }
}

function printOrder(orderId) {
  const order = loadOrders().find((o) => o.id === orderId);
  if (!order) return;
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) { adminToast("Popup хаагдсан байна. Зөвшөөрнө үү.", "warning"); return; }
  const rows = (order.items || []).map((i) => `
    <tr>
      <td>${escapeHtml(i.name)}${i.isCombo ? " <small>(багц)</small>" : ""}${i.includes && i.includes.length ? `<br><small style="color:#888">${escapeHtml(i.includes.join(" + "))}</small>` : ""}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">${money(i.price * i.qty)}</td>
    </tr>`).join("");
  win.document.write(`
    <html><head><meta charset="utf-8"><title>${order.code}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:18px;color:#111}
      h1{font-size:18px;margin:0 0 4px}
      .muted{color:#666;font-size:12px;margin:0 0 12px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}
      th,td{border-bottom:1px dashed #ccc;padding:6px 2px;text-align:left}
      .tot{font-size:16px;font-weight:800;text-align:right;margin-top:8px}
      .box{border:1px solid #eee;border-radius:8px;padding:10px;font-size:13px}
    </style></head><body>
      <h1>ТҮРГЭН ХАЗАЛТ</h1>
      <p class="muted">Захиалга #${order.code} • ${formatDate(order.createdAt)}</p>
      <div class="box">
        <div><b>${escapeHtml(order.customer ? order.customer.name : "-")}</b></div>
        <div>${escapeHtml(order.customer ? order.customer.phone : "-")}</div>
        <div>${escapeHtml(order.customer ? order.customer.address : "-")}</div>
      </div>
      <table><thead><tr><th>Хоол</th><th style="text-align:center">Тоо</th><th style="text-align:right">Дүн</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div>Хоолны дүн: ${money(order.subtotal)}</div>
      <div>Хямдрал: -${money(order.discount || 0)}</div>
      <div>Хүргэлт: ${money(order.deliveryFee)}</div>
      <div class="tot">НИЙТ: ${money(order.total)}</div>
      <p class="muted" style="margin-top:14px">Баярлалаа! Дахин захиалаарай.</p>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

/* ============================ CSV ЭКСПОРТ ============================ */
function exportCSV() {
  const orders = getFilteredOrders();
  if (orders.length === 0) { adminToast("Экспортлох захиалга байхгүй.", "warning"); return; }
  const head = ["Код", "Огноо", "Харилцагч", "Утас", "Хаяг", "Хоолнууд", "Хоолны дүн", "Хямдрал", "Хүргэлт", "Нийт", "Төлбөр", "Төлөв"];
  const rows = orders.map((o) => [
    o.code, formatDate(o.createdAt),
    o.customer ? o.customer.name : "", o.customer ? o.customer.phone : "", o.customer ? o.customer.address : "",
    (o.items || []).map((i) => `${i.name} x${i.qty}`).join(" | "),
    o.subtotal, o.discount || 0, o.deliveryFee, o.total,
    PAYMENT_LABEL[o.payment] || "Бэлнээр", ADMIN_STATUS[o.status].label
  ]);
  const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `turgun-hazalt-orders-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  adminToast(`${orders.length} захиалга CSV файлд экспортлогдлоо.`, "success", "Экспорт");
}

/* ============================ РЕНДЕР: DASHBOARD ============================ */
function renderDashboard() {
  const stats = computeStats();
  const statWrap = document.getElementById("stat-cards");
  if (statWrap) {
    statWrap.innerHTML = `
      <div class="stat-card stat-red">
        <div class="stat-icon"><i class="fa-solid fa-receipt"></i></div>
        <p class="stat-value">${stats.total}</p>
        <p class="stat-label">Нийт захиалга</p>
        <p class="stat-sub"><i class="fa-solid fa-clock mr-1"></i>Өнөөдөр ${stats.todayOrders}</p>
      </div>
      <div class="stat-card stat-amber">
        <div class="stat-icon"><i class="fa-solid fa-hourglass-half"></i></div>
        <p class="stat-value">${stats.byStatus.pending}</p>
        <p class="stat-label">Хүлээгдэж буй</p>
        <p class="stat-sub"><i class="fa-solid fa-fire-burner mr-1"></i>Бэлтгэж байна ${stats.byStatus.preparing}</p>
      </div>
      <div class="stat-card stat-indigo">
        <div class="stat-icon"><i class="fa-solid fa-motorcycle"></i></div>
        <p class="stat-value">${stats.byStatus.delivering}</p>
        <p class="stat-label">Хүргэлтэнд гарсан</p>
        <p class="stat-sub"><i class="fa-solid fa-circle-check mr-1"></i>Хүргэгдсэн ${stats.byStatus.delivered}</p>
      </div>
      <div class="stat-card stat-green">
        <div class="stat-icon"><i class="fa-solid fa-coins"></i></div>
        <p class="stat-value">${money(stats.revenue)}</p>
        <p class="stat-label">Нийт орлого</p>
        <p class="stat-sub"><i class="fa-solid fa-calendar-day mr-1"></i>Өнөөдөр ${money(stats.todayRevenue)}</p>
      </div>`;
  }

  const mini = document.getElementById("mini-stats");
  if (mini) {
    mini.innerHTML = `
      <div class="flex items-center justify-between py-2.5 border-b border-gray-100">
        <span class="text-sm text-gray-600"><i class="fa-solid fa-burger text-red-500 mr-2"></i>Борлуулагдсан хоол</span>
        <span class="font-black text-gray-900">${stats.itemsSold} ш</span>
      </div>
      <div class="flex items-center justify-between py-2.5 border-b border-gray-100">
        <span class="text-sm text-gray-600"><i class="fa-solid fa-chart-line text-amber-500 mr-2"></i>Дундаж захиалгын дүн</span>
        <span class="font-black text-gray-900">${money(stats.avg)}</span>
      </div>
      <div class="flex items-center justify-between py-2.5 border-b border-gray-100">
        <span class="text-sm text-gray-600"><i class="fa-solid fa-circle-xmark text-red-500 mr-2"></i>Цуцлагдсан</span>
        <span class="font-black text-gray-900">${stats.cancelled}</span>
      </div>
      <div class="flex items-center justify-between py-2.5">
        <span class="text-sm text-gray-600"><i class="fa-solid fa-motorcycle text-indigo-500 mr-2"></i>Идэвхтэй захиалга</span>
        <span class="font-black text-gray-900">${stats.active}</span>
      </div>`;
  }

  const topWrap = document.getElementById("top-foods");
  if (topWrap) {
    topWrap.innerHTML = stats.top.length === 0
      ? `<p class="text-sm text-gray-400 text-center py-6">Одоогоор борлуулалтын мэдээлэл байхгүй.</p>`
      : stats.top.map((t, i) => `
        <div class="flex items-center gap-3 py-2.5">
          <span class="w-6 h-6 rounded-lg ${i === 0 ? "bg-amber-400 text-red-950" : "bg-gray-100 text-gray-600"} text-xs font-black flex items-center justify-center">${i + 1}</span>
          <img src="${t.img}" onerror="this.onerror=null;this.src='${ADMIN_CONFIG.fallbackImg}'" class="w-9 h-9 rounded-lg object-cover" alt="">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-800 truncate">${escapeHtml(t.name)}</p>
            <p class="text-xs text-gray-500">${money(t.revenue)}</p>
          </div>
          <span class="text-sm font-black text-red-600">${t.qty} ш</span>
        </div>`).join("");
  }

  const recent = document.getElementById("recent-orders");
  if (recent) {
    const list = loadOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    recent.innerHTML = list.length === 0
      ? `<div class="text-center py-12">
           <div class="w-16 h-16 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-2xl mb-3"><i class="fa-solid fa-inbox"></i></div>
           <p class="font-bold text-gray-700">Одоогоор захиалга ирээгүй байна</p>
           <p class="text-sm text-gray-400 mt-1">Хэрэглэгч захиалга хиймэгц энд автоматаар харагдана.</p>
         </div>`
      : list.map(orderRowHTML).join("");
  }
}

/* ============================ РЕНДЕР: ЗАХИАЛГЫН МӨР ============================ */
function orderRowHTML(order) {
  const isNew = !knownOrderIds.has(order.id) && firstLoadDone;
  const items = (order.items || []).map((i) => `${escapeHtml(i.name)}${i.isCombo ? " (багц)" : ""} × ${i.qty}`).join(", ");
  return `
    <div class="order-row ${isNew ? "new-order-row" : ""}">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-receipt"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-black text-gray-900">#${escapeHtml(order.code)}</p>
              ${isNew ? '<span class="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">ШИНЭ</span>' : ""}
              ${statusBadge(order.status)}
            </div>
            <p class="text-xs text-gray-500 mt-1"><i class="fa-regular fa-clock mr-1"></i>${formatDate(order.createdAt)} • ${timeAgo(order.createdAt)}</p>
            <p class="text-sm text-gray-700 mt-1.5 font-semibold"><i class="fa-solid fa-user text-gray-400 mr-1"></i>${escapeHtml(order.customer ? order.customer.name : "-")}
              <span class="text-gray-400 font-normal mx-1">|</span>
              <i class="fa-solid fa-phone text-gray-400 mr-1"></i>${escapeHtml(order.customer ? order.customer.phone : "-")}</p>
            <p class="text-xs text-gray-500 mt-0.5 truncate max-w-md"><i class="fa-solid fa-location-dot text-gray-400 mr-1"></i>${escapeHtml(order.customer ? order.customer.address : "-")}</p>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2"><i class="fa-solid fa-utensils text-gray-400 mr-1"></i>${items}</p>
          </div>
        </div>

        <div class="text-right flex-shrink-0">
          <p class="text-xl font-black text-red-600">${money(order.total)}</p>
          <p class="text-[11px] text-gray-400">${(order.items || []).reduce((s, i) => s + i.qty, 0)} ширхэг • ${PAYMENT_LABEL[order.payment] || "Бэлнээр"}</p>
          <div class="flex flex-wrap gap-1.5 justify-end mt-2">
            ${Object.keys(ADMIN_STATUS).filter((s) => s !== order.status).map((s) => `
              <button onclick="setOrderStatus('${order.id}','${s}')" class="status-btn status-btn-${ADMIN_STATUS[s].cls}" title="${ADMIN_STATUS[s].label}">
                <i class="fa-solid ${ADMIN_STATUS[s].icon}"></i>
              </button>`).join("")}
            <button onclick="openOrderDetail('${order.id}')" class="status-btn status-btn-info" title="Дэлгэрэнгүй">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ============================ РЕНДЕР: ЗАХИАЛГЫН ЖАГСААЛТ ============================ */
function renderOrderList() {
  const wrap = document.getElementById("orders-list");
  if (!wrap) return;
  const list = getFilteredOrders();
  const countEl = document.getElementById("orders-count");
  if (countEl) countEl.textContent = `${list.length} захиалга харагдаж байна`;

  if (list.length === 0) {
    wrap.innerHTML = `
      <div class="text-center py-16 bg-white rounded-3xl border border-gray-100">
        <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mb-4"><i class="fa-solid fa-inbox"></i></div>
        <h3 class="text-xl font-black text-gray-800 mb-2">Захиалга олдсонгүй</h3>
        <p class="text-gray-500">Шүүлтүүр эсвэл хайлтын нөхцөлийг өөрчлөөд дахин үзээрэй.</p>
      </div>`;
    return;
  }
  wrap.innerHTML = list.map(orderRowHTML).join("");
}

/* ============================ ФИЛЬТРИЙН ТАБ ============================ */
function renderStatusTabs() {
  const wrap = document.getElementById("status-tabs");
  if (!wrap) return;
  const orders = loadOrders();
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    delivering: orders.filter((o) => o.status === "delivering").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length
  };
  const tabs = [{ id: "all", label: "Бүгд", icon: "fa-list" }, ...Object.keys(ADMIN_STATUS).map((s) => ({ id: s, label: ADMIN_STATUS[s].label, icon: ADMIN_STATUS[s].icon }))];
  wrap.innerHTML = tabs.map((t) => `
    <button onclick="setAdminFilter('${t.id}')" class="status-tab ${adminFilter === t.id ? "active" : ""}">
      <i class="fa-solid ${t.icon}"></i> ${t.label}
      <span class="tab-count">${counts[t.id] || 0}</span>
    </button>`).join("");
}

function setAdminFilter(filter) {
  adminFilter = filter;
  renderAll();
}

function onAdminSearch(value) {
  adminSearch = value;
  clearTimeout(window.__adminSearchTimer);
  window.__adminSearchTimer = setTimeout(() => renderOrderList(), 250);
}

function setAdminSort(value) {
  adminSort = value;
  renderOrderList();
}

/* ============================ НЭГДСЭН РЕНДЕР ============================ */
function updateNavBadge() {
  const badge = document.getElementById("nav-pending-badge");
  if (!badge) return;
  const pending = loadOrders().filter((o) => o.status === "pending").length;
  badge.textContent = pending;
  badge.style.display = pending > 0 ? "" : "none";
}

function renderAll() {
  renderSoundButton();
  updateNavBadge();
  if (document.getElementById("stat-cards")) renderDashboard();
  if (document.getElementById("orders-list")) {
    renderStatusTabs();
    renderOrderList();
  }
}

/* ============================ БОДИТ ЦАГИЙН ШИНЭЧЛЭЛ ============================ */
function detectNewOrders() {
  const orders = loadOrders();
  const newOnes = orders.filter((o) => !knownOrderIds.has(o.id));
  if (firstLoadDone && newOnes.length > 0) {
    newOnes.forEach((o) => {
      adminToast(`#${o.code} • ${o.customer ? o.customer.name : "Хэрэглэгч"} • ${money(o.total)}`, "warning", "Шинэ захиалга ирлээ!");
    });
    beep();
    document.title = `(${newOnes.length}) Шинэ захиалга — Түргэн Хазалт Админ`;
    setTimeout(() => { document.title = "Түргэн Хазалт — Админ панель"; }, 8000);
  }
  knownOrderIds = new Set(orders.map((o) => o.id));
  firstLoadDone = true;
  return newOnes.length;
}

function initRealtime() {
  window.addEventListener("storage", (e) => {
    if (e.key === ADMIN_CONFIG.keys.orders) {
      detectNewOrders();
      renderAll();
    }
    if (e.key === ADMIN_CONFIG.keys.session) {
      if (!isAdminLoggedIn()) window.location.reload();
    }
  });

  try {
    const bc = new BroadcastChannel("turgun-hazalt");
    bc.addEventListener("message", (ev) => {
      if (ev.data && ev.data.type === "orders-updated") {
        detectNewOrders();
        renderAll();
      }
    });
  } catch (e) { /* алгасна */ }

  /* Нөөц механизм: 4 секунд тутамд шалгана */
  refreshTimer = setInterval(() => {
    const before = ordersCache.length;
    const orders = loadOrders();
    if (orders.length !== before || JSON.stringify(orders) !== JSON.stringify(ordersCache)) {
      detectNewOrders();
      renderAll();
    }
  }, 4000);
}

/* ============================ LOGIN GATE ============================ */
function renderLoginGate() {
  const gate = document.getElementById("admin-gate");
  const app = document.getElementById("admin-app");
  if (!gate || !app) return;
  gate.classList.remove("hidden");
  app.classList.add("hidden");
}

function initAdminPage() {
  ensureAdminAccount();
  let booted = false;

  // Cloud тохируулсан бол эхлээд холбогдоод, дараа нь gate/app шийднэ.
  // (Cloud users татагдаж байж өөр төхөөрөмжийн сесс/бүртгэл танигдана.)
  const boot = () => {
    if (booted) return;
    booted = true;
    if (!isAdminLoggedIn()) {
      renderLoginGate();
      const form = document.getElementById("admin-login-form");
      if (form) form.addEventListener("submit", adminLogin);
      return;
    }

    const user = getAdminUser();
    const gate = document.getElementById("admin-gate");
    const app = document.getElementById("admin-app");
    if (gate) gate.classList.add("hidden");
    if (app) app.classList.remove("hidden");

    const nameEl = document.getElementById("admin-user-name");
    if (nameEl) nameEl.textContent = user ? user.name : "Админ";
    const avatarEl = document.getElementById("admin-avatar");
    if (avatarEl) avatarEl.textContent = user ? (user.name || "A").charAt(0).toUpperCase() : "A";

    loadOrders();
    knownOrderIds = new Set(ordersCache.map((o) => o.id));
    firstLoadDone = false;
    renderAll();
    detectNewOrders();
    initRealtime();

    const searchInput = document.getElementById("admin-search");
    if (searchInput) searchInput.addEventListener("input", (e) => onAdminSearch(e.target.value));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOrderDetail();
    });
  };

  if (adminCloudConfigured()) {
    // Login gate-ийг түр хүлээлгэж, cloud users-ийг синк хийнэ (max ~2.5s)
    adminInitCloud().then(() => {
      try {
        if (ADMIN_CLOUD.db) {
          ADMIN_CLOUD.db.ref('users').once('value').then((snap) => {
            const val = snap.val();
            if (val) {
              try { localStorage.setItem(ADMIN_CONFIG.keys.users, JSON.stringify(Object.values(val))); } catch (e) {}
              ensureAdminAccount();
            }
            boot();
          }).catch(() => boot());
          setTimeout(() => { try { boot(); } catch (e) {} }, 2500);
          return;
        }
      } catch (e) {}
      boot();
    }).catch(() => boot());
    // Хамгаалалт: cloud удааширвал local-оор шууд ачаална
    setTimeout(() => {
      try {
        const app = document.getElementById("admin-app");
        const gate = document.getElementById("admin-gate");
        if (app && gate && app.classList.contains("hidden") && gate.classList.contains("hidden")) boot();
      } catch (e) {}
    }, 3000);
  } else {
    boot();
  }
}

document.addEventListener("DOMContentLoaded", initAdminPage);

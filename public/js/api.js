/* ═══════════════════════════
   API.JS - Appwrite Version
═══════════════════════════ */

const { account, databases, Query, ID, DB_ID } = window.AppwriteService;

const API = {
  // --- AUTH ---
  async login(username, password) {
    try {
      // En Appwrite usamos email, así que convertimos el username a un email falso por compatibilidad
      const email = `${username}@finca.com`;
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      return { success: true, user: { id: user.$id, username: user.name, nombre: user.name, rol: 'admin' } };
    } catch (e) {
      console.error('Login error:', e);
      throw new Error('Usuario o contraseña incorrectos.');
    }
  },

  async logout() {
    try {
      await account.deleteSession('current');
      window.location.href = '/index.html';
    } catch (e) { console.error(e); }
  },

  async getUser() {
    try {
      const user = await account.get();
      return { id: user.$id, username: user.name, nombre: user.name, rol: 'admin' };
    } catch (e) { return null; }
  },

  // --- GENERIC DATABASE METHODS ---
  async get(endpoint) {
    const collectionId = this._getCollectionId(endpoint);
    try {
      const response = await databases.listDocuments(DB_ID, collectionId);
      return response.documents;
    } catch (e) {
      console.error(`Error fetching ${endpoint}:`, e);
      return [];
    }
  },

  async post(endpoint, data) {
    const collectionId = this._getCollectionId(endpoint);
    try {
      return await databases.createDocument(DB_ID, collectionId, ID.unique(), data);
    } catch (e) {
      console.error(`Error creating in ${endpoint}:`, e);
      throw e;
    }
  },

  async put(endpoint, data) {
    // Ejemplo endpoint: /api/clientes/123
    const parts = endpoint.split('/');
    const collectionId = this._getCollectionId(`/${parts[1]}/${parts[2]}`);
    const documentId = parts[parts.length - 1];
    try {
      return await databases.updateDocument(DB_ID, collectionId, documentId, data);
    } catch (e) {
      console.error(`Error updating ${endpoint}:`, e);
      throw e;
    }
  },

  async delete(endpoint) {
    const parts = endpoint.split('/');
    const collectionId = this._getCollectionId(`/${parts[1]}/${parts[2]}`);
    const documentId = parts[parts.length - 1];
    try {
      await databases.deleteDocument(DB_ID, collectionId, documentId);
      return { success: true };
    } catch (e) {
      console.error(`Error deleting ${endpoint}:`, e);
      throw e;
    }
  },

  _getCollectionId(endpoint) {
    if (endpoint.includes('produccion')) return window.AppwriteService.COLL_PRODUCCION;
    if (endpoint.includes('ventas')) return window.AppwriteService.COLL_VENTAS;
    if (endpoint.includes('clientes')) return window.AppwriteService.COLL_CLIENTES;
    if (endpoint.includes('inventario')) return window.AppwriteService.COLL_INVENTARIO;
    if (endpoint.includes('gastos')) return window.AppwriteService.COLL_GASTOS;
    if (endpoint.includes('configuracion')) return window.AppwriteService.COLL_CONFIG;
    return '';
  }
};

// --- HELPER FUNCTIONS ---
function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es-CO');
}

function fmtCurrency(n) {
  const symbol = window.APP_CONFIG?.moneda || '$';
  if (n === null || n === undefined) return symbol + ' 0';
  return symbol + ' ' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '—';
  const format = window.APP_CONFIG?.formato_fecha || 'DD/MM/YYYY';
  const parts = d.split('T')[0].split('-');
  const [y, m, d_val] = parts;
  if (format === 'YYYY-MM-DD') return `${y}-${m}-${d_val}`;
  if (format === 'MM/DD/YYYY') return `${m}/${d_val}/${y}`;
  return `${d_val}/${m}/${y}`;
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
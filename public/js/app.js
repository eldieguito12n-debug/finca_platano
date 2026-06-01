/* ═══════════════════════════════════════════
   APP.JS – SPA Router & App Shell Logic
═══════════════════════════════════════════ */

let currentUser = null;
let currentPage = 'dashboard';
let activeCharts = {};

// ─── Init ──────────────────────────────────────────────────────
async function initApp() {
  try {
    currentUser = await API.get('/api/auth/me');
    if (!currentUser) { window.location.href = '/'; return; }
  } catch {
    window.location.href = '/';
    return;
  }

  // Update sidebar user info
  document.getElementById('sidebar-username').textContent = currentUser.nombre;
  document.getElementById('sidebar-role').textContent =
    currentUser.rol === 'admin' ? '👑 Administrador' : '👷 Empleado';

  // Load farm name from config
  try {
    const cfg = await API.get('/api/configuracion');
    window.APP_CONFIG = cfg; // Guardar globalmente
    if (cfg && cfg.nombre_finca) {
      document.getElementById('sidebar-farm-name').textContent = cfg.nombre_finca;
      document.title = cfg.nombre_finca + ' – Administración';
    }
    // Apply primary color if customized
    if (cfg && cfg.color_primario && cfg.color_primario !== '#2d6a4f') {
      document.documentElement.style.setProperty('--primary', cfg.color_primario);
    }
  } catch (e) {}

  // Show admin-only items
  if (currentUser.rol === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }

  // Update header date
  const now = new Date();
  document.getElementById('header-date').textContent =
    now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Setup navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.page);
      closeSidebar();
    });
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Hamburger menu
  document.getElementById('hamburger').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

  // Load initial page
  navigateTo('dashboard');
}

// ─── Navigation ────────────────────────────────────────────────
function navigateTo(page) {
  currentPage = page;

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById(`nav-${page}`);
  if (navBtn) navBtn.classList.add('active');

  // Update page title
  const titles = {
    dashboard:    '🏠 Dashboard',
    cultivo:      '🌿 Mi Cultivo',
    produccion:   '📦 Producción',
    ventas:       '💰 Ventas',
    clientes:     '👥 Clientes',
    inventario:   '🎪 Inventario de Bodega',
    compras:      '🛒 Compras de Insumos',
    aplicaciones: '🌱 Aplicación de Insumos',
    gastos:       '💸 Gastos',
    reportes:     '📊 Reportes',
    usuarios:     '⚙️ Usuarios',
    configuracion: '🔧 Configuración'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  // Destroy previous charts
  Object.values(activeCharts).forEach(c => { try { c.destroy(); } catch {} });
  activeCharts = {};

  // Render page
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="empty-state"><div class="spinner" style="width:40px;height:40px;margin:0 auto"></div></div>';

  const pages = {
    dashboard:    renderDashboard,
    cultivo:      renderCultivo,
    produccion:   renderProduccion,
    ventas:       renderVentas,
    clientes:     renderClientes,
    inventario:   renderInventario,
    compras:      renderCompras,
    aplicaciones: renderAplicaciones,
    gastos:       renderGastos,
    reportes:     renderReportes,
    usuarios:     renderUsuarios,
    configuracion: renderConfiguracion
  };

  if (pages[page]) {
    pages[page]().catch(err => {
      content.innerHTML = `
        <div class="alert alert-danger">
          <span>❌</span>
          <span>Error al cargar la página: ${err.message}</span>
        </div>`;
    });
  }
}

// ─── Sidebar Mobile ───────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ─── Logout ────────────────────────────────────────────────────
async function logout() {
  try {
    await API.post('/api/auth/logout', {});
  } finally {
    window.location.href = '/';
  }
}

// ─── Start ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initApp);

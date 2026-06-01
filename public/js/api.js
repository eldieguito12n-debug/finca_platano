/* ═══════════════════════════════════════════
   API.JS – Centralized fetch helpers + Utilities
═══════════════════════════════════════════ */

const API = {
  async get(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/'; return null; }
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error del servidor'); }
    return res.json();
  },

  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { window.location.href = '/'; return null; }
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  },

  async put(url, body) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  },

  async delete(url) {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  }
};

/* ── Toast Notifications ─────────────────────── */
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '🔔'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── Modal Helpers ─────────────────────── */
function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  // ESC key
  document._modalEsc = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', document._modalEsc);
}

function closeModal() {
  const m = document.getElementById('active-modal');
  if (m) m.remove();
  if (document._modalEsc) { document.removeEventListener('keydown', document._modalEsc); delete document._modalEsc; }
}

/* ── Formatters ──────────────────────────── */
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

function getWeekNumber(d = new Date()) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getMonthRange() {
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${lastDay}` };
}

/* ── Confirm Dialog ──────────────────────── */
function confirmDialog(message) {
  return new Promise(resolve => {
    openModal(`
      <div class="modal-header">
        <div class="modal-title">⚠️ Confirmar acción</div>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-muted)">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal(); window._confirmResolve(false)">Cancelar</button>
        <button class="btn btn-danger" onclick="closeModal(); window._confirmResolve(true)">Eliminar</button>
      </div>
    `);
    window._confirmResolve = resolve;
  });
}

/* ── Export helpers ──────────────────────── */
function exportToExcel(data, columns, sheetName, fileName) {
  const rows = data.map(row => {
    const obj = {};
    columns.forEach(col => { obj[col.header] = row[col.key] ?? ''; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName + '.xlsx');
  showToast('Archivo Excel generado', 'success');
}

function exportToPDF(data, columns, title, fileName) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(27, 67, 50);
  doc.text('🍌 Finca de Plátano – ' + title, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Generado: ' + new Date().toLocaleString('es-CO'), 14, 25);

  const headers = columns.map(c => c.header);
  const rows = data.map(row => columns.map(col => {
    const v = row[col.key];
    if (col.format === 'currency') return fmtCurrency(v);
    if (col.format === 'date') return fmtDate(v);
    return v ?? '—';
  }));

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [45, 106, 79], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 247, 240] },
    margin: { top: 30, left: 14, right: 14 }
  });

  doc.save(fileName + '.pdf');
  showToast('Archivo PDF generado', 'success');
}

/* ── Badge helpers ──────────────────────── */
function estadoPagoBadge(estado) {
  const map = {
    pagado: '<span class="badge badge-success">✅ Pagado</span>',
    pendiente: '<span class="badge badge-warning">⏳ Pendiente</span>',
    parcial: '<span class="badge badge-info">💰 Parcial</span>'
  };
  return map[estado] || estado;
}

function stockBadge(cantidad, minimo) {
  if (cantidad <= minimo) return `<span class="stock-low">⚠️ ${cantidad}</span>`;
  return `<span class="stock-ok">${cantidad}</span>`;
}

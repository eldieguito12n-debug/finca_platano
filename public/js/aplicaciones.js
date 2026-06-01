/* ═══════════════════════════
   APLICACIONES.JS
═══════════════════════════ */

async function renderAplicaciones() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>🌱 Aplicación de Insumos</h2>
        <p>Registro de aplicaciones – el inventario se descuenta automáticamente</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-apl">+ Nueva Aplicación</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="a-desde">
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="a-hasta">
        </div>
        <button class="btn btn-secondary" id="btn-filtrar-a">🔍 Filtrar</button>
        <button class="btn btn-secondary" id="btn-limpiar-a">✕ Limpiar</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Historial de Aplicaciones</div>
        <button class="btn btn-sm btn-success" id="btn-export-excel-a">📊 Excel</button>
      </div>
      <div class="table-wrapper" id="a-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let aplData = [];
  let inventario = [];

  async function loadInventario() {
    inventario = await API.get('/api/inventario') || [];
  }

  async function loadApl(filters = {}) {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.desde) params.append('desde', filters.desde);
    if (filters.hasta) params.append('hasta', filters.hasta);

    aplData = await API.get('/api/aplicaciones?' + params.toString()) || [];
    renderAplTable(aplData);
  }

  function renderAplTable(rows) {
    const wrapper = document.getElementById('a-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">🌱</div><h3>Sin aplicaciones registradas</h3><p>Registre la primera aplicación de insumos</p></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Insumo utilizado</th>
            <th>Cantidad</th>
            <th>Responsable</th>
            <th>Observaciones</th>
            <th>Registrado por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(a => `
            <tr>
              <td>${fmtDate(a.fecha)}</td>
              <td>
                <strong>${a.insumo_nombre}</strong>
              </td>
              <td>${fmt(a.cantidad)} ${a.unidad_medida}</td>
              <td>👤 ${a.responsable}</td>
              <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.observaciones || '—'}</td>
              <td>${a.usuario_nombre || '—'}</td>
              <td>
                <div class="td-actions">
                  ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar (restaura inventario)" onclick="deleteApl(${a.id})">🗑️</button>` : '—'}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Events
  document.getElementById('btn-nueva-apl').addEventListener('click', () => openAplModal(inventario));
  document.getElementById('btn-filtrar-a').addEventListener('click', () => {
    loadApl({ desde: document.getElementById('a-desde').value, hasta: document.getElementById('a-hasta').value });
  });
  document.getElementById('btn-limpiar-a').addEventListener('click', () => {
    document.getElementById('a-desde').value = '';
    document.getElementById('a-hasta').value = '';
    loadApl();
  });

  document.getElementById('btn-export-excel-a').addEventListener('click', () => {
    exportToExcel(aplData, [
      { key: 'fecha', header: 'Fecha' },
      { key: 'insumo_nombre', header: 'Insumo' },
      { key: 'cantidad', header: 'Cantidad' },
      { key: 'unidad_medida', header: 'Unidad' },
      { key: 'responsable', header: 'Responsable' },
      { key: 'observaciones', header: 'Observaciones' }
    ], 'Aplicaciones', `Aplicaciones_${todayISO()}`);
  });

  window.deleteApl = async (id) => {
    if (!await confirmDialog('¿Eliminar esta aplicación? El insumo se restaurará al inventario.')) return;
    try {
      await API.delete(`/api/aplicaciones/${id}`);
      showToast('Aplicación eliminada y stock restaurado', 'success');
      loadApl();
    } catch (e) { showToast(e.message, 'error'); }
  };

  await loadInventario();
  await loadApl();
}

function openAplModal(inventario = []) {
  const invOptions = inventario.map(i =>
    `<option value="${i.id}" data-unidad="${i.unidad_medida}" data-stock="${i.cantidad}">${i.nombre} (${i.cantidad} ${i.unidad_medida} disponible)</option>`
  ).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">🌱 Registrar Aplicación</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="alert alert-warning">
        <span>⚠️</span>
        <span>La cantidad utilizada se descontará automáticamente del inventario.</span>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Fecha de aplicación *</label>
          <input type="date" id="aplf-fecha" value="${todayISO()}" required>
        </div>
        <div class="form-group full">
          <label>Insumo utilizado *</label>
          <select id="aplf-insumo" required>
            <option value="">Seleccione un insumo...</option>
            ${invOptions}
          </select>
        </div>
        <div id="aplf-stock-info" style="display:none;grid-column:1/-1">
          <div class="alert alert-success"><span>📦</span><span id="aplf-stock-text"></span></div>
        </div>
        <div class="form-group">
          <label>Cantidad utilizada *</label>
          <input type="number" id="aplf-cantidad" min="0.01" step="0.01" required placeholder="0">
        </div>
        <div class="form-group">
          <label>Unidad</label>
          <input type="text" id="aplf-unidad" readonly style="background:var(--bg)">
        </div>
        <div class="form-group full">
          <label>Responsable *</label>
          <input type="text" id="aplf-responsable" placeholder="Nombre del trabajador" required>
        </div>
        <div class="form-group full">
          <label>Observaciones</label>
          <textarea id="aplf-obs" style="min-height:60px" placeholder="Lote, área aplicada, condiciones..."></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-apl">💾 Registrar Aplicación</button>
    </div>
  `);

  document.getElementById('aplf-insumo').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    if (opt && opt.value) {
      document.getElementById('aplf-unidad').value = opt.dataset.unidad || '';
      const stockInfo = document.getElementById('aplf-stock-info');
      document.getElementById('aplf-stock-text').textContent = `Stock disponible: ${opt.dataset.stock} ${opt.dataset.unidad}`;
      stockInfo.style.display = 'block';
    }
  });

  document.getElementById('btn-save-apl').addEventListener('click', async () => {
    const body = {
      inventario_id: document.getElementById('aplf-insumo').value,
      fecha: document.getElementById('aplf-fecha').value,
      cantidad: parseFloat(document.getElementById('aplf-cantidad').value),
      responsable: document.getElementById('aplf-responsable').value.trim(),
      observaciones: document.getElementById('aplf-obs').value
    };
    if (!body.inventario_id || !body.cantidad || !body.responsable) {
      showToast('Complete todos los campos requeridos', 'error'); return;
    }
    try {
      const res = await API.post('/api/aplicaciones', body);
      showToast(`Aplicación registrada. Stock restante: ${res.nuevaCantidad}`, 'success');
      closeModal();
      renderAplicaciones();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

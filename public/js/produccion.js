/* ═══════════════════════════
   PRODUCCION.JS
═══════════════════════════ */

async function renderProduccion() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>📦 Producción</h2>
        <p>Registro semanal de cajas y bolsas cosechadas</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-prod">+ Nuevo Registro</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="prod-desde">
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="prod-hasta">
        </div>
        <div class="form-group">
          <label>Semana</label>
          <input type="number" id="prod-semana" placeholder="Ej: 22" min="1" max="53" style="width:100px">
        </div>
        <button class="btn btn-secondary" id="btn-filtrar-prod">🔍 Filtrar</button>
        <button class="btn btn-secondary" id="btn-limpiar-prod">✕ Limpiar</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Historial de Producción</div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-success" id="btn-export-excel-prod">📊 Excel</button>
          <button class="btn btn-sm btn-danger" id="btn-export-pdf-prod">📄 PDF</button>
        </div>
      </div>
      <div class="table-wrapper" id="prod-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let prodData = [];

  async function loadProd(filters = {}) {
    const params = new URLSearchParams();
    if (filters.desde) params.append('desde', filters.desde);
    if (filters.hasta) params.append('hasta', filters.hasta);
    if (filters.semana) params.append('semana', filters.semana);
    params.append('limit', '100');

    const result = await API.get('/api/produccion?' + params.toString());
    if (!result) return;
    prodData = result.data || [];
    renderProdTable(prodData);
  }

  function renderProdTable(rows) {
    const wrapper = document.getElementById('prod-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h3>Sin registros</h3><p>Agregue el primer registro de producción</p></div>`;
      return;
    }

    const totalCajas = rows.reduce((s, r) => s + (r.cajas || 0), 0);
    const totalBolsas = rows.reduce((s, r) => s + (r.bolsas || 0), 0);

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Semana</th>
            <th>Año</th>
            <th>Cajas</th>
            <th>Bolsas</th>
            <th>Observaciones</th>
            <th>Registrado por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${fmtDate(r.fecha)}</td>
              <td><span class="badge badge-info">Sem. ${r.semana}</span></td>
              <td>${r.anio}</td>
              <td><strong>${fmt(r.cajas)}</strong></td>
              <td><strong>${fmt(r.bolsas)}</strong></td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.observaciones || ''}">${r.observaciones || '—'}</td>
              <td>${r.usuario_nombre || '—'}</td>
              <td>
                <div class="td-actions">
                  <button class="btn-icon" title="Editar" onclick="editProduccion(${r.id})">✏️</button>
                  ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar" onclick="deleteProduccion(${r.id})">🗑️</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--primary-pale);font-weight:700">
            <td colspan="3">TOTALES</td>
            <td>${fmt(totalCajas)} cajas</td>
            <td>${fmt(totalBolsas)} bolsas</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Events
  document.getElementById('btn-nueva-prod').addEventListener('click', () => openProdModal());
  document.getElementById('btn-filtrar-prod').addEventListener('click', () => {
    loadProd({
      desde: document.getElementById('prod-desde').value,
      hasta: document.getElementById('prod-hasta').value,
      semana: document.getElementById('prod-semana').value
    });
  });
  document.getElementById('btn-limpiar-prod').addEventListener('click', () => {
    document.getElementById('prod-desde').value = '';
    document.getElementById('prod-hasta').value = '';
    document.getElementById('prod-semana').value = '';
    loadProd();
  });

  document.getElementById('btn-export-excel-prod').addEventListener('click', () => {
    exportToExcel(prodData, [
      { key: 'fecha', header: 'Fecha' },
      { key: 'semana', header: 'Semana' },
      { key: 'anio', header: 'Año' },
      { key: 'cajas', header: 'Cajas' },
      { key: 'bolsas', header: 'Bolsas' },
      { key: 'observaciones', header: 'Observaciones' }
    ], 'Producción', `Produccion_${todayISO()}`);
  });

  document.getElementById('btn-export-pdf-prod').addEventListener('click', () => {
    exportToPDF(prodData, [
      { key: 'fecha', header: 'Fecha', format: 'date' },
      { key: 'semana', header: 'Semana' },
      { key: 'anio', header: 'Año' },
      { key: 'cajas', header: 'Cajas' },
      { key: 'bolsas', header: 'Bolsas' },
      { key: 'observaciones', header: 'Observaciones' }
    ], 'Producción', `Produccion_${todayISO()}`);
  });

  await loadProd();

  // Expose for inline handlers
  window.editProduccion = async (id) => {
    const row = prodData.find(r => r.id === id);
    if (row) openProdModal(row);
  };

  window.deleteProduccion = async (id) => {
    if (!await confirmDialog('¿Está seguro de eliminar este registro de producción?')) return;
    try {
      await API.delete(`/api/produccion/${id}`);
      showToast('Registro eliminado', 'success');
      loadProd();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function openProdModal(row = null) {
  const today = todayISO();
  const weekNum = getWeekNumber();
  const year = new Date().getFullYear();

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${row ? '✏️ Editar' : '➕ Nuevo'} Registro de Producción</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <form id="prod-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Fecha de cosecha *</label>
            <input type="date" id="pf-fecha" value="${row ? row.fecha : today}" required>
          </div>
          <div class="form-group">
            <label>Semana *</label>
            <input type="number" id="pf-semana" value="${row ? row.semana : weekNum}" min="1" max="53" required>
          </div>
          <div class="form-group">
            <label>Año *</label>
            <input type="number" id="pf-anio" value="${row ? row.anio : year}" min="2020" max="2099" required>
          </div>
          <div class="form-group">
            <label>Cajas producidas</label>
            <input type="number" id="pf-cajas" value="${row ? row.cajas : 0}" min="0">
          </div>
          <div class="form-group">
            <label>Bolsas producidas</label>
            <input type="number" id="pf-bolsas" value="${row ? row.bolsas : 0}" min="0">
          </div>
          <div class="form-group full">
            <label>Observaciones</label>
            <textarea id="pf-obs">${row ? (row.observaciones || '') : ''}</textarea>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-prod">💾 Guardar</button>
    </div>
  `);

  // Auto-calculate week from date
  document.getElementById('pf-fecha').addEventListener('change', (e) => {
    const d = new Date(e.target.value + 'T12:00:00');
    document.getElementById('pf-semana').value = getWeekNumber(d);
    document.getElementById('pf-anio').value = d.getFullYear();
  });

  document.getElementById('btn-save-prod').addEventListener('click', async () => {
    const body = {
      fecha:        document.getElementById('pf-fecha').value,
      semana:       parseInt(document.getElementById('pf-semana').value),
      anio:         parseInt(document.getElementById('pf-anio').value),
      cajas:        parseInt(document.getElementById('pf-cajas').value) || 0,
      bolsas:       parseInt(document.getElementById('pf-bolsas').value) || 0,
      observaciones: document.getElementById('pf-obs').value
    };
    try {
      if (row) {
        await API.put(`/api/produccion/${row.id}`, body);
        showToast('Registro actualizado', 'success');
      } else {
        await API.post('/api/produccion', body);
        showToast('Registro guardado', 'success');
      }
      closeModal();
      renderProduccion();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

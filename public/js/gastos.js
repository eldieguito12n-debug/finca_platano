/* ═══════════════════════════
   GASTOS.JS
═══════════════════════════ */

async function renderGastos() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>💸 Gastos</h2>
        <p>Registro de gastos operativos: mano de obra, transporte, mantenimiento y más</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-gasto">+ Nuevo Gasto</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="g-desde">
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="g-hasta">
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <select id="g-cat">
            <option value="">Todas</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="btn-filtrar-g">🔍 Filtrar</button>
        <button class="btn btn-secondary" id="btn-limpiar-g">✕ Limpiar</button>
      </div>
    </div>

    <div id="g-summary" style="margin-bottom:1rem"></div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Historial de Gastos</div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-success" id="btn-export-excel-g">📊 Excel</button>
          <button class="btn btn-sm btn-danger" id="btn-export-pdf-g">📄 PDF</button>
        </div>
      </div>
      <div class="table-wrapper" id="g-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let gastosData = [];
  let categorias = [];

  async function loadCategorias() {
    categorias = await API.get('/api/gastos/categorias') || [];
    const sel = document.getElementById('g-cat');
    categorias.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  }

  async function loadGastos(filters = {}) {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.desde) params.append('desde', filters.desde);
    if (filters.hasta) params.append('hasta', filters.hasta);
    if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);

    const result = await API.get('/api/gastos?' + params.toString());
    if (!result) return;
    gastosData = result.data || [];

    // Summary by category
    const cats = {};
    gastosData.forEach(g => {
      const cat = g.categoria_nombre || 'Sin categoría';
      if (!cats[cat]) cats[cat] = 0;
      cats[cat] += g.valor;
    });

    const totalGastos = result.suma || gastosData.reduce((s, g) => s + g.valor, 0);

    const catIcons = { 'Mano de obra': '👷', 'Transporte': '🚛', 'Mantenimiento': '🔧', 'Servicios públicos': '💡', 'Otros': '📌' };

    document.getElementById('g-summary').innerHTML = `
      <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">
        <div class="kpi-card" style="background:linear-gradient(135deg,var(--primary),var(--primary-light));color:white;border:none">
          <div class="kpi-icon" style="background:rgba(255,255,255,0.2)">💸</div>
          <div class="kpi-info">
            <div class="kpi-value" style="color:white;font-size:1.1rem">${fmtCurrency(totalGastos)}</div>
            <div class="kpi-label" style="color:rgba(255,255,255,0.8)">Total gastos (${gastosData.length})</div>
          </div>
        </div>
        ${Object.entries(cats).map(([cat, total]) => `
          <div class="kpi-card">
            <div class="kpi-icon earth">${catIcons[cat] || '📌'}</div>
            <div class="kpi-info">
              <div class="kpi-value" style="font-size:0.95rem">${fmtCurrency(total)}</div>
              <div class="kpi-label">${cat}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    renderGastosTable(gastosData);
  }

  function renderGastosTable(rows) {
    const wrapper = document.getElementById('g-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><h3>Sin gastos registrados</h3><p>Registre el primer gasto</p></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Valor</th>
            <th>Registrado por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(g => `
            <tr>
              <td>${fmtDate(g.fecha)}</td>
              <td><span class="badge badge-earth">${g.categoria_nombre || 'Sin categoría'}</span></td>
              <td>${g.descripcion}</td>
              <td><strong style="color:var(--danger)">${fmtCurrency(g.valor)}</strong></td>
              <td>${g.usuario_nombre || '—'}</td>
              <td>
                <div class="td-actions">
                  <button class="btn-icon" title="Editar" onclick="editGasto(${g.id})">✏️</button>
                  ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar" onclick="deleteGasto(${g.id})">🗑️</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:rgba(230,57,70,0.05);font-weight:700">
            <td colspan="3">TOTAL</td>
            <td style="color:var(--danger)">${fmtCurrency(rows.reduce((s, g) => s + g.valor, 0))}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // Events
  document.getElementById('btn-nuevo-gasto').addEventListener('click', () => openGastoModal(null, categorias));
  document.getElementById('btn-filtrar-g').addEventListener('click', () => {
    loadGastos({
      desde: document.getElementById('g-desde').value,
      hasta: document.getElementById('g-hasta').value,
      categoria_id: document.getElementById('g-cat').value
    });
  });
  document.getElementById('btn-limpiar-g').addEventListener('click', () => {
    document.getElementById('g-desde').value = '';
    document.getElementById('g-hasta').value = '';
    document.getElementById('g-cat').value = '';
    loadGastos();
  });

  document.getElementById('btn-export-excel-g').addEventListener('click', () => {
    exportToExcel(gastosData, [
      { key: 'fecha', header: 'Fecha' },
      { key: 'categoria_nombre', header: 'Categoría' },
      { key: 'descripcion', header: 'Descripción' },
      { key: 'valor', header: 'Valor ($)' }
    ], 'Gastos', `Gastos_${todayISO()}`);
  });

  document.getElementById('btn-export-pdf-g').addEventListener('click', () => {
    exportToPDF(gastosData, [
      { key: 'fecha', header: 'Fecha', format: 'date' },
      { key: 'categoria_nombre', header: 'Categoría' },
      { key: 'descripcion', header: 'Descripción' },
      { key: 'valor', header: 'Valor', format: 'currency' }
    ], 'Gastos', `Gastos_${todayISO()}`);
  });

  window.editGasto = (id) => {
    const g = gastosData.find(r => r.id === id);
    if (g) openGastoModal(g, categorias);
  };

  window.deleteGasto = async (id) => {
    if (!await confirmDialog('¿Eliminar este gasto?')) return;
    try {
      await API.delete(`/api/gastos/${id}`);
      showToast('Gasto eliminado', 'success');
      loadGastos();
    } catch (e) { showToast(e.message, 'error'); }
  };

  await loadCategorias();
  await loadGastos();
}

function openGastoModal(row = null, categorias = []) {
  const catOptions = categorias.map(c =>
    `<option value="${c.id}" ${row && row.categoria_id === c.id ? 'selected' : ''}>${c.nombre}</option>`
  ).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${row ? '✏️ Editar' : '➕ Nuevo'} Gasto</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label>Fecha *</label>
          <input type="date" id="gf-fecha" value="${row ? row.fecha : todayISO()}" required>
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <select id="gf-categoria">
            <option value="">Sin categoría</option>
            ${catOptions}
          </select>
        </div>
        <div class="form-group full">
          <label>Descripción *</label>
          <input type="text" id="gf-desc" value="${row ? row.descripcion : ''}" placeholder="Detalle del gasto" required>
        </div>
        <div class="form-group">
          <label>Valor ($) *</label>
          <input type="number" id="gf-valor" value="${row ? row.valor : ''}" min="0" step="100" required placeholder="0">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-gasto">💾 Guardar</button>
    </div>
  `);

  document.getElementById('btn-save-gasto').addEventListener('click', async () => {
    const body = {
      categoria_id: document.getElementById('gf-categoria').value || null,
      descripcion: document.getElementById('gf-desc').value.trim(),
      valor: parseFloat(document.getElementById('gf-valor').value),
      fecha: document.getElementById('gf-fecha').value
    };
    if (!body.descripcion || !body.valor || !body.fecha) {
      showToast('Complete todos los campos requeridos', 'error'); return;
    }
    try {
      if (row) {
        await API.put(`/api/gastos/${row.id}`, body);
        showToast('Gasto actualizado', 'success');
      } else {
        await API.post('/api/gastos', body);
        showToast('Gasto registrado', 'success');
      }
      closeModal();
      renderGastos();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

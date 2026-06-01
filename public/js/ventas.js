/* ═══════════════════════════
   VENTAS.JS
═══════════════════════════ */

async function renderVentas() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>💰 Ventas</h2>
        <p>Registro y seguimiento de ventas de cajas y bolsas</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-venta">+ Nueva Venta</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="v-desde">
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="v-hasta">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="v-estado">
            <option value="">Todos</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="btn-filtrar-v">🔍 Filtrar</button>
        <button class="btn btn-secondary" id="btn-limpiar-v">✕ Limpiar</button>
      </div>
    </div>

    <!-- Summary -->
    <div id="v-summary" class="kpi-grid" style="margin-bottom:1rem"></div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Historial de Ventas</div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-success" id="btn-export-excel-v">📊 Excel</button>
          <button class="btn btn-sm btn-danger" id="btn-export-pdf-v">📄 PDF</button>
        </div>
      </div>
      <div class="table-wrapper" id="v-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let ventasData = [];
  let clientes = [];

  async function loadClientes() {
    clientes = await API.get('/api/clientes') || [];
  }

  async function loadVentas(filters = {}) {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.desde) params.append('desde', filters.desde);
    if (filters.hasta) params.append('hasta', filters.hasta);
    if (filters.estado_pago) params.append('estado_pago', filters.estado_pago);

    const result = await API.get('/api/ventas?' + params.toString());
    if (!result) return;
    ventasData = result.data || [];

    // Summary
    const pagado = ventasData.filter(v => v.estado_pago === 'pagado').reduce((s, v) => s + v.total, 0);
    const pendiente = ventasData.filter(v => v.estado_pago === 'pendiente').reduce((s, v) => s + v.total, 0);
    const total = ventasData.reduce((s, v) => s + v.total, 0);

    document.getElementById('v-summary').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon green">💵</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem">${fmtCurrency(total)}</div>
          <div class="kpi-label">Total ventas (${ventasData.length})</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon blue">✅</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem;color:var(--success)">${fmtCurrency(pagado)}</div>
          <div class="kpi-label">Cobrado</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon red">⏳</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem;color:var(--warning)">${fmtCurrency(pendiente)}</div>
          <div class="kpi-label">Por cobrar</div>
        </div>
      </div>
    `;

    renderVentasTable(ventasData);
  }

  function renderVentasTable(rows) {
    const wrapper = document.getElementById('v-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div><h3>Sin ventas registradas</h3><p>Registre la primera venta</p></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(v => `
            <tr>
              <td>${fmtDate(v.fecha)}</td>
              <td>${v.cliente_nombre || '<span style="color:var(--text-muted)">Sin cliente</span>'}</td>
              <td><span class="badge badge-earth">${v.producto === 'cajas' ? '📦 Cajas' : '🛍 Bolsas'}</span></td>
              <td>${fmt(v.cantidad)}</td>
              <td>${fmtCurrency(v.precio_unitario)}</td>
              <td><strong>${fmtCurrency(v.total)}</strong></td>
              <td>${estadoPagoBadge(v.estado_pago)}</td>
              <td>
                <div class="td-actions">
                  <button class="btn-icon" title="Editar" onclick="editVenta(${v.id})">✏️</button>
                  ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar" onclick="deleteVenta(${v.id})">🗑️</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Events
  document.getElementById('btn-nueva-venta').addEventListener('click', () => openVentaModal(null, clientes));
  document.getElementById('btn-filtrar-v').addEventListener('click', () => {
    loadVentas({
      desde: document.getElementById('v-desde').value,
      hasta: document.getElementById('v-hasta').value,
      estado_pago: document.getElementById('v-estado').value
    });
  });
  document.getElementById('btn-limpiar-v').addEventListener('click', () => {
    document.getElementById('v-desde').value = '';
    document.getElementById('v-hasta').value = '';
    document.getElementById('v-estado').value = '';
    loadVentas();
  });

  document.getElementById('btn-export-excel-v').addEventListener('click', () => {
    exportToExcel(ventasData.map(v => ({ ...v, total_fmt: v.total })), [
      { key: 'fecha', header: 'Fecha' },
      { key: 'cliente_nombre', header: 'Cliente' },
      { key: 'producto', header: 'Producto' },
      { key: 'cantidad', header: 'Cantidad' },
      { key: 'precio_unitario', header: 'Precio Unitario' },
      { key: 'total', header: 'Total' },
      { key: 'estado_pago', header: 'Estado' }
    ], 'Ventas', `Ventas_${todayISO()}`);
  });

  document.getElementById('btn-export-pdf-v').addEventListener('click', () => {
    exportToPDF(ventasData, [
      { key: 'fecha', header: 'Fecha', format: 'date' },
      { key: 'cliente_nombre', header: 'Cliente' },
      { key: 'producto', header: 'Producto' },
      { key: 'cantidad', header: 'Cant.' },
      { key: 'precio_unitario', header: 'Precio Unit.', format: 'currency' },
      { key: 'total', header: 'Total', format: 'currency' },
      { key: 'estado_pago', header: 'Estado' }
    ], 'Ventas', `Ventas_${todayISO()}`);
  });

  window.editVenta = (id) => {
    const v = ventasData.find(r => r.id === id);
    if (v) openVentaModal(v, clientes);
  };

  window.deleteVenta = async (id) => {
    if (!await confirmDialog('¿Eliminar esta venta?')) return;
    try {
      await API.delete(`/api/ventas/${id}`);
      showToast('Venta eliminada', 'success');
      loadVentas();
    } catch (e) { showToast(e.message, 'error'); }
  };

  await loadClientes();
  await loadVentas();
}

function openVentaModal(row = null, clientes = []) {
  const clienteOptions = clientes.map(c => `<option value="${c.id}" ${row && row.cliente_id === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${row ? '✏️ Editar' : '➕ Nueva'} Venta</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <form id="venta-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Fecha *</label>
            <input type="date" id="vf-fecha" value="${row ? row.fecha : todayISO()}" required>
          </div>
          <div class="form-group">
            <label>Cliente</label>
            <select id="vf-cliente">
              <option value="">Sin cliente</option>
              ${clienteOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Producto *</label>
            <select id="vf-producto" required>
              <option value="cajas" ${row && row.producto === 'cajas' ? 'selected' : ''}>📦 Cajas</option>
              <option value="bolsas" ${row && row.producto === 'bolsas' ? 'selected' : ''}>🛍 Bolsas</option>
            </select>
          </div>
          <div class="form-group">
            <label>Cantidad *</label>
            <input type="number" id="vf-cantidad" value="${row ? row.cantidad : ''}" min="0" step="0.01" required>
          </div>
          <div class="form-group">
            <label>Precio unitario ($) *</label>
            <input type="number" id="vf-precio" value="${row ? row.precio_unitario : ''}" min="0" step="100" required>
          </div>
          <div class="form-group">
            <label>Total calculado</label>
            <input type="text" id="vf-total" readonly style="background:#f0f7f0;font-weight:700;color:var(--primary)">
          </div>
          <div class="form-group">
            <label>Estado del pago</label>
            <select id="vf-estado">
              <option value="pendiente" ${!row || row.estado_pago === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
              <option value="pagado" ${row && row.estado_pago === 'pagado' ? 'selected' : ''}>✅ Pagado</option>
              <option value="parcial" ${row && row.estado_pago === 'parcial' ? 'selected' : ''}>💰 Parcial</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Observaciones</label>
            <textarea id="vf-obs">${row ? (row.observaciones || '') : ''}</textarea>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-venta">💾 Guardar</button>
    </div>
  `);

  // Auto-calculate total
  function calcTotal() {
    const cant = parseFloat(document.getElementById('vf-cantidad').value) || 0;
    const precio = parseFloat(document.getElementById('vf-precio').value) || 0;
    document.getElementById('vf-total').value = fmtCurrency(cant * precio);
  }
  document.getElementById('vf-cantidad').addEventListener('input', calcTotal);
  document.getElementById('vf-precio').addEventListener('input', calcTotal);
  calcTotal();

  document.getElementById('btn-save-venta').addEventListener('click', async () => {
    const body = {
      fecha: document.getElementById('vf-fecha').value,
      cliente_id: document.getElementById('vf-cliente').value || null,
      producto: document.getElementById('vf-producto').value,
      cantidad: parseFloat(document.getElementById('vf-cantidad').value),
      precio_unitario: parseFloat(document.getElementById('vf-precio').value),
      estado_pago: document.getElementById('vf-estado').value,
      observaciones: document.getElementById('vf-obs').value
    };
    try {
      if (row) {
        await API.put(`/api/ventas/${row.id}`, body);
        showToast('Venta actualizada', 'success');
      } else {
        await API.post('/api/ventas', body);
        showToast('Venta registrada', 'success');
      }
      closeModal();
      renderVentas();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

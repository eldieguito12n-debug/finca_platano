/* ═══════════════════════════
   COMPRAS.JS
═══════════════════════════ */

async function renderCompras() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>🛒 Compras de Insumos</h2>
        <p>Registro de compras – el inventario se actualiza automáticamente</p>
      </div>
      <button class="btn btn-primary" id="btn-nueva-compra">+ Nueva Compra</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="c-desde">
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="c-hasta">
        </div>
        <button class="btn btn-secondary" id="btn-filtrar-c">🔍 Filtrar</button>
        <button class="btn btn-secondary" id="btn-limpiar-c">✕ Limpiar</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Historial de Compras</div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-success" id="btn-export-excel-c">📊 Excel</button>
          <button class="btn btn-sm btn-danger" id="btn-export-pdf-c">📄 PDF</button>
        </div>
      </div>
      <div id="c-total-banner" style="display:none;padding:0.75rem 1rem;background:var(--primary-pale);border-radius:var(--radius-md);margin-bottom:1rem;font-weight:700;color:var(--primary)"></div>
      <div class="table-wrapper" id="c-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let comprasData = [];
  let inventario = [];

  async function loadInventario() {
    inventario = await API.get('/api/inventario') || [];
  }

  async function loadCompras(filters = {}) {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.desde) params.append('desde', filters.desde);
    if (filters.hasta) params.append('hasta', filters.hasta);

    comprasData = await API.get('/api/compras?' + params.toString()) || [];

    const total = comprasData.reduce((s, c) => s + c.total, 0);
    const banner = document.getElementById('c-total-banner');
    if (comprasData.length) {
      banner.style.display = 'block';
      banner.textContent = `💰 Total invertido en compras: ${fmtCurrency(total)} (${comprasData.length} registros)`;
    } else {
      banner.style.display = 'none';
    }

    renderComprasTable(comprasData);
  }

  function renderComprasTable(rows) {
    const wrapper = document.getElementById('c-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><h3>Sin compras registradas</h3><p>Registre la primera compra de insumos</p></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Insumo</th>
            <th>Proveedor</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(c => `
            <tr>
              <td>${fmtDate(c.fecha)}</td>
              <td>
                <strong>${c.insumo_nombre}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted)">${c.unidad_medida}</div>
              </td>
              <td>${c.proveedor || '—'}</td>
              <td>${fmt(c.cantidad)} ${c.unidad_medida}</td>
              <td>${fmtCurrency(c.precio_unitario)}</td>
              <td><strong>${fmtCurrency(c.total)}</strong></td>
              <td>
                <div class="td-actions">
                  ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar (revierte inventario)" onclick="deleteCompra(${c.id})">🗑️</button>` : '—'}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Events
  document.getElementById('btn-nueva-compra').addEventListener('click', () => openCompraModal(inventario));
  document.getElementById('btn-filtrar-c').addEventListener('click', () => {
    loadCompras({ desde: document.getElementById('c-desde').value, hasta: document.getElementById('c-hasta').value });
  });
  document.getElementById('btn-limpiar-c').addEventListener('click', () => {
    document.getElementById('c-desde').value = '';
    document.getElementById('c-hasta').value = '';
    loadCompras();
  });

  document.getElementById('btn-export-excel-c').addEventListener('click', () => {
    exportToExcel(comprasData, [
      { key: 'fecha', header: 'Fecha' },
      { key: 'insumo_nombre', header: 'Insumo' },
      { key: 'proveedor', header: 'Proveedor' },
      { key: 'cantidad', header: 'Cantidad' },
      { key: 'unidad_medida', header: 'Unidad' },
      { key: 'precio_unitario', header: 'Precio Unitario' },
      { key: 'total', header: 'Total' }
    ], 'Compras', `Compras_${todayISO()}`);
  });

  document.getElementById('btn-export-pdf-c').addEventListener('click', () => {
    exportToPDF(comprasData, [
      { key: 'fecha', header: 'Fecha', format: 'date' },
      { key: 'insumo_nombre', header: 'Insumo' },
      { key: 'proveedor', header: 'Proveedor' },
      { key: 'cantidad', header: 'Cantidad' },
      { key: 'precio_unitario', header: 'Precio Unit.', format: 'currency' },
      { key: 'total', header: 'Total', format: 'currency' }
    ], 'Compras de Insumos', `Compras_${todayISO()}`);
  });

  window.deleteCompra = async (id) => {
    if (!await confirmDialog('¿Eliminar esta compra? El inventario se revertirá automáticamente.')) return;
    try {
      await API.delete(`/api/compras/${id}`);
      showToast('Compra eliminada y stock revertido', 'success');
      loadCompras();
    } catch (e) { showToast(e.message, 'error'); }
  };

  await loadInventario();
  await loadCompras();
}

function openCompraModal(inventario = []) {
  const invOptions = inventario.map(i =>
    `<option value="${i.id}" data-unidad="${i.unidad_medida}">${i.nombre} (${i.cantidad} ${i.unidad_medida})</option>`
  ).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">🛒 Registrar Compra</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="alert alert-success">
        <span>✅</span>
        <span>El inventario se actualizará automáticamente al guardar.</span>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Fecha de compra *</label>
          <input type="date" id="compf-fecha" value="${todayISO()}" required>
        </div>
        <div class="form-group full">
          <label>Insumo *</label>
          <div style="display:flex;gap:0.5rem">
            <select id="compf-insumo" required style="flex:1">
              <option value="">Seleccione un insumo...</option>
              ${invOptions}
            </select>
            <button class="btn btn-secondary" id="btn-add-insumo-quick" title="Crear nuevo insumo" type="button">➕</button>
          </div>
        </div>
        <!-- Quick add insumo form (hidden) -->
        <div id="quick-insumo-form" style="display:none; grid-column: 1 / -1; background: var(--bg); padding: 1rem; border-radius: var(--radius-md); border: 1px dashed var(--primary)">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.75rem">
            <div class="form-group">
              <label>Nombre del nuevo insumo</label>
              <input type="text" id="qi-nombre" placeholder="Ej: Fertilizante X">
            </div>
            <div class="form-group">
              <label>Unidad de medida</label>
              <select id="qi-unidad">
                <option value="kg">Kilogramos (kg)</option>
                <option value="litro">Litros (L)</option>
                <option value="unidad">Unidades</option>
                <option value="bulto">Bultos</option>
              </select>
            </div>
            <div style="grid-column: 1 / -1; display:flex; gap:0.5rem; justify-content: flex-end">
              <button class="btn btn-sm btn-secondary" type="button" onclick="document.getElementById('quick-insumo-form').style.display='none'">Cancelar</button>
              <button class="btn btn-sm btn-primary" type="button" id="btn-save-qi">Guardar Insumo</button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Cantidad comprada *</label>
          <input type="number" id="compf-cantidad" min="0.01" step="0.01" required placeholder="0">
        </div>
        <div class="form-group">
          <label>Unidad</label>
          <input type="text" id="compf-unidad" readonly style="background:var(--bg)" placeholder="Auto">
        </div>
        <div class="form-group">
          <label>Precio unitario ($) *</label>
          <input type="number" id="compf-precio" min="0" step="100" required placeholder="0">
        </div>
        <div class="form-group">
          <label>Total calculado</label>
          <input type="text" id="compf-total" readonly style="background:#f0f7f0;font-weight:700;color:var(--primary)">
        </div>
        <div class="form-group full">
          <label>Proveedor</label>
          <input type="text" id="compf-proveedor" placeholder="Nombre del proveedor">
        </div>
        <div class="form-group full">
          <label>Observaciones</label>
          <textarea id="compf-obs" style="min-height:60px" placeholder="Notas adicionales..."></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-compra">💾 Registrar Compra</button>
    </div>
  `);

  document.getElementById('compf-insumo').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    document.getElementById('compf-unidad').value = opt ? (opt.dataset.unidad || '') : '';
  });

  // Quick add insumo logic
  document.getElementById('btn-add-insumo-quick').addEventListener('click', () => {
    const form = document.getElementById('quick-insumo-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btn-save-qi').addEventListener('click', async () => {
    const nombre = document.getElementById('qi-nombre').value.trim();
    const unidad = document.getElementById('qi-unidad').value;
    if (!nombre) return showToast('Ingrese el nombre del insumo', 'error');

    try {
      const res = await API.post('/api/inventario', { nombre, unidad_medida: unidad, cantidad: 0, stock_minimo: 0, categoria_id: 1 }); // Default cat
      showToast('Insumo creado correctamente', 'success');
      // Add to select and select it
      const select = document.getElementById('compf-insumo');
      const opt = document.createElement('option');
      opt.value = res.id;
      opt.textContent = `${nombre} (0 ${unidad})`;
      opt.dataset.unidad = unidad;
      select.appendChild(opt);
      select.value = res.id;
      document.getElementById('compf-unidad').value = unidad;
      document.getElementById('quick-insumo-form').style.display = 'none';
      // Update local inventory list for next time
      inventario.push(res);
    } catch (e) { showToast(e.message, 'error'); }
  });

  function calcTotal() {
    const cant = parseFloat(document.getElementById('compf-cantidad').value) || 0;
    const precio = parseFloat(document.getElementById('compf-precio').value) || 0;
    document.getElementById('compf-total').value = fmtCurrency(cant * precio);
  }
  document.getElementById('compf-cantidad').addEventListener('input', calcTotal);
  document.getElementById('compf-precio').addEventListener('input', calcTotal);

  document.getElementById('btn-save-compra').addEventListener('click', async () => {
    const body = {
      inventario_id: document.getElementById('compf-insumo').value,
      fecha: document.getElementById('compf-fecha').value,
      cantidad: parseFloat(document.getElementById('compf-cantidad').value),
      precio_unitario: parseFloat(document.getElementById('compf-precio').value),
      proveedor: document.getElementById('compf-proveedor').value,
      observaciones: document.getElementById('compf-obs').value
    };
    if (!body.inventario_id || !body.cantidad || !body.precio_unitario) {
      showToast('Complete todos los campos requeridos', 'error'); return;
    }
    try {
      const res = await API.post('/api/compras', body);
      showToast(`Compra registrada. Nuevo stock: ${res.nuevaCantidad}`, 'success');
      closeModal();
      renderCompras();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

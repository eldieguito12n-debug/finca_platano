/* ═══════════════════════════
   INVENTARIO.JS
═══════════════════════════ */

async function renderInventario() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>🏪 Inventario de Bodega</h2>
        <p>Control de insumos, herramientas y existencias</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-inv">+ Nuevo Insumo</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Categoría</label>
          <select id="inv-cat">
            <option value="">Todas</option>
          </select>
        </div>
        <div class="form-group">
          <label>Buscar</label>
          <input type="text" id="inv-search" placeholder="Nombre del insumo...">
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer">
            <input type="checkbox" id="inv-low-stock" style="width:auto;margin:0"> Solo bajo stock
          </label>
        </div>
        <button class="btn btn-secondary" id="btn-filtrar-inv">🔍 Filtrar</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Inventario Actual</div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-sm btn-success" id="btn-export-excel-inv">📊 Excel</button>
        </div>
      </div>
      <div class="table-wrapper" id="inv-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let invData = [];
  let categorias = [];

  async function loadCategorias() {
    categorias = await API.get('/api/inventario/categorias') || [];
    const sel = document.getElementById('inv-cat');
    categorias.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id; opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  }

  async function loadInv(filters = {}) {
    const params = new URLSearchParams();
    if (filters.categoria_id) params.append('categoria_id', filters.categoria_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.low_stock) params.append('low_stock', '1');

    invData = await API.get('/api/inventario?' + params.toString()) || [];

    // Update badge
    const lowCount = invData.filter(i => i.cantidad <= i.stock_minimo).length;
    const badge = document.getElementById('badge-stock');
    if (badge) { badge.textContent = lowCount; badge.style.display = lowCount > 0 ? 'inline' : 'none'; }

    renderInvTable(invData);
  }

  function renderInvTable(rows) {
    const wrapper = document.getElementById('inv-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">🏪</div><h3>Sin insumos registrados</h3><p>Agregue el primer insumo al inventario</p></div>`;
      return;
    }

    // Group by category
    const groups = {};
    rows.forEach(r => {
      const cat = r.categoria_nombre || 'Sin categoría';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });

    let html = '';
    Object.entries(groups).forEach(([cat, items]) => {
      html += `
        <tr>
          <td colspan="7" style="background:var(--primary-pale);font-weight:700;font-size:0.8rem;color:var(--primary);padding:0.5rem 1rem;text-transform:uppercase;letter-spacing:0.04em">
            ${getCategoryIcon(cat)} ${cat}
          </td>
        </tr>
        ${items.map(i => {
          const isLow = i.cantidad <= i.stock_minimo;
          return `
            <tr ${isLow ? 'style="background:rgba(230,57,70,0.04)"' : ''}>
              <td>
                <strong>${i.nombre}</strong>
                ${isLow ? '<span class="badge badge-danger" style="margin-left:0.4rem">⚠️ Stock bajo</span>' : ''}
              </td>
              <td>${stockBadge(i.cantidad, i.stock_minimo)}</td>
              <td>${i.unidad_medida}</td>
              <td>${i.stock_minimo}</td>
              <td>
                <div class="progress-bar-container" style="width:100%;max-width:100px;background:var(--border);border-radius:100px;height:6px">
                  <div style="width:${Math.min(100, Math.round((i.cantidad / Math.max(i.stock_minimo * 2, 1)) * 100))}%;height:100%;background:${isLow ? 'var(--danger)' : 'var(--success)'};border-radius:100px;transition:width 0.5s"></div>
                </div>
              </td>
              <td>
                <div class="td-actions">
                  <button class="btn-icon" title="Editar" onclick="editInsumo(${i.id})">✏️</button>
                  ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar" onclick="deleteInsumo(${i.id})">🗑️</button>` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      `;
    });

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Insumo</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Stock mínimo</th>
            <th>Nivel</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${html}</tbody>
      </table>
    `;
  }

  function getCategoryIcon(cat) {
    const icons = {
      'Fertilizantes': '🌿', 'Fungicidas': '🧪', 'Herbicidas': '🌾',
      'Insecticidas': '🐛', 'Herramientas': '🔧', 'Otros insumos': '📦'
    };
    return icons[cat] || '📦';
  }

  // Events
  document.getElementById('btn-nuevo-inv').addEventListener('click', () => openInsumoModal(null, categorias));
  document.getElementById('btn-filtrar-inv').addEventListener('click', () => {
    loadInv({
      categoria_id: document.getElementById('inv-cat').value,
      search: document.getElementById('inv-search').value,
      low_stock: document.getElementById('inv-low-stock').checked
    });
  });

  document.getElementById('btn-export-excel-inv').addEventListener('click', () => {
    exportToExcel(invData, [
      { key: 'nombre', header: 'Insumo' },
      { key: 'categoria_nombre', header: 'Categoría' },
      { key: 'cantidad', header: 'Cantidad' },
      { key: 'unidad_medida', header: 'Unidad' },
      { key: 'stock_minimo', header: 'Stock Mínimo' }
    ], 'Inventario', `Inventario_${todayISO()}`);
  });

  window.editInsumo = (id) => {
    const inv = invData.find(r => r.id === id);
    if (inv) openInsumoModal(inv, categorias);
  };

  window.deleteInsumo = async (id) => {
    if (!await confirmDialog('¿Eliminar este insumo del inventario?')) return;
    try {
      await API.delete(`/api/inventario/${id}`);
      showToast('Insumo eliminado', 'success');
      loadInv();
    } catch (e) { showToast(e.message, 'error'); }
  };

  await loadCategorias();
  await loadInv();
}

function openInsumoModal(row = null, categorias = []) {
  const catOptions = categorias.map(c => `<option value="${c.id}" ${row && row.categoria_id === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('');

  openModal(`
    <div class="modal-header">
      <div class="modal-title">${row ? '✏️ Editar' : '➕ Nuevo'} Insumo</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group full">
          <label>Nombre del insumo *</label>
          <input type="text" id="if-nombre" value="${row ? row.nombre : ''}" required>
        </div>
        <div class="form-group">
          <label>Categoría</label>
          <select id="if-categoria">
            <option value="">Sin categoría</option>
            ${catOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Unidad de medida</label>
          <select id="if-unidad">
            ${['kg','g','L','mL','unidad','bulto','bolsa','litro','galón'].map(u =>
              `<option value="${u}" ${row && row.unidad_medida === u ? 'selected' : ''}>${u}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Cantidad disponible</label>
          <input type="number" id="if-cantidad" value="${row ? row.cantidad : 0}" min="0" step="0.01">
        </div>
        <div class="form-group">
          <label>Stock mínimo</label>
          <input type="number" id="if-stock-min" value="${row ? row.stock_minimo : 0}" min="0" step="0.01">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-inv">💾 Guardar</button>
    </div>
  `);

  document.getElementById('btn-save-inv').addEventListener('click', async () => {
    const body = {
      nombre: document.getElementById('if-nombre').value.trim(),
      categoria_id: document.getElementById('if-categoria').value || null,
      unidad_medida: document.getElementById('if-unidad').value,
      cantidad: parseFloat(document.getElementById('if-cantidad').value) || 0,
      stock_minimo: parseFloat(document.getElementById('if-stock-min').value) || 0
    };
    if (!body.nombre) { showToast('El nombre es requerido', 'error'); return; }
    try {
      if (row) {
        await API.put(`/api/inventario/${row.id}`, body);
        showToast('Insumo actualizado', 'success');
      } else {
        await API.post('/api/inventario', body);
        showToast('Insumo registrado', 'success');
      }
      closeModal();
      renderInventario();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

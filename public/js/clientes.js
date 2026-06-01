/* ═══════════════════════════
   CLIENTES.JS
═══════════════════════════ */

async function renderClientes() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>👥 Clientes</h2>
        <p>Gestión de clientes e historial de compras</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-cliente">+ Nuevo Cliente</button>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div class="filter-bar">
        <div class="form-group">
          <label>Buscar</label>
          <input type="text" id="search-cliente" placeholder="Nombre o teléfono...">
        </div>
        <button class="btn btn-secondary" id="btn-buscar-cliente">🔍 Buscar</button>
        <button class="btn btn-secondary" id="btn-limpiar-cliente">✕ Limpiar</button>
      </div>
    </div>

    <div id="clientes-grid" class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
    </div>
  `;

  let clientesData = [];

  async function loadClientes(search = '') {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    clientesData = await API.get('/api/clientes' + params) || [];
    renderClientesGrid(clientesData);
  }

  function renderClientesGrid(rows) {
    const grid = document.getElementById('clientes-grid');
    if (!rows.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">👥</div><h3>Sin clientes</h3><p>Agregue el primer cliente</p></div>`;
      return;
    }

    grid.innerHTML = rows.map(c => `
      <div class="card" style="cursor:pointer;transition:all 0.2s" onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <div style="width:44px;height:44px;background:linear-gradient(135deg,var(--primary),var(--primary-light));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:white;font-weight:700;flex-shrink:0">
              ${c.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text)">${c.nombre}</div>
              <div style="font-size:0.78rem;color:var(--text-muted)">📞 ${c.telefono || 'Sin teléfono'}</div>
            </div>
          </div>
          <div style="display:flex;gap:0.3rem">
            <button class="btn-icon" title="Ver historial" onclick="verHistorialCliente(${c.id})">📋</button>
            <button class="btn-icon" title="Editar" onclick="editCliente(${c.id})">✏️</button>
            ${currentUser.rol === 'admin' ? `<button class="btn-icon" title="Eliminar" onclick="deleteCliente(${c.id})">🗑️</button>` : ''}
          </div>
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);display:flex;align-items:flex-start;gap:0.4rem">
          📍 <span>${c.direccion || 'Sin dirección registrada'}</span>
        </div>
      </div>
    `).join('');
  }

  // Events
  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => openClienteModal());
  document.getElementById('btn-buscar-cliente').addEventListener('click', () => {
    loadClientes(document.getElementById('search-cliente').value);
  });
  document.getElementById('btn-limpiar-cliente').addEventListener('click', () => {
    document.getElementById('search-cliente').value = '';
    loadClientes();
  });
  document.getElementById('search-cliente').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadClientes(e.target.value);
  });

  window.editCliente = (id) => {
    const c = clientesData.find(r => r.id === id);
    if (c) openClienteModal(c);
  };

  window.deleteCliente = async (id) => {
    if (!await confirmDialog('¿Desactivar este cliente?')) return;
    try {
      await API.delete(`/api/clientes/${id}`);
      showToast('Cliente eliminado', 'success');
      loadClientes();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.verHistorialCliente = async (id) => {
    const data = await API.get(`/api/clientes/${id}`);
    if (!data) return;

    openModal(`
      <div class="modal-header">
        <div class="modal-title">📋 Historial – ${data.nombre}</div>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="kpi-grid" style="margin-bottom:1rem">
          <div class="kpi-card">
            <div class="kpi-icon green">🛒</div>
            <div class="kpi-info">
              <div class="kpi-value">${data.stats.total_compras}</div>
              <div class="kpi-label">Total compras</div>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon earth">💰</div>
            <div class="kpi-info">
              <div class="kpi-value" style="font-size:1rem">${fmtCurrency(data.stats.total_gastado)}</div>
              <div class="kpi-label">Total gastado</div>
            </div>
          </div>
        </div>
        ${data.compras.length === 0
          ? '<div class="empty-state"><div class="empty-icon">📭</div><p>Sin compras registradas</p></div>'
          : `<div class="table-wrapper">
              <table>
                <thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>
                  ${data.compras.map(c => `
                    <tr>
                      <td>${fmtDate(c.fecha)}</td>
                      <td>${c.producto === 'cajas' ? '📦 Cajas' : '🛍 Bolsas'}</td>
                      <td>${fmt(c.cantidad)}</td>
                      <td>${fmtCurrency(c.total)}</td>
                      <td>${estadoPagoBadge(c.estado_pago)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`
        }
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
      </div>
    `);
  };

  await loadClientes();
}

function openClienteModal(row = null) {
  openModal(`
    <div class="modal-header">
      <div class="modal-title">${row ? '✏️ Editar' : '➕ Nuevo'} Cliente</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group full">
          <label>Nombre completo *</label>
          <input type="text" id="cf-nombre" value="${row ? row.nombre : ''}" placeholder="Nombre del cliente" required>
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="tel" id="cf-telefono" value="${row ? (row.telefono || '') : ''}" placeholder="300 123 4567">
        </div>
        <div class="form-group full">
          <label>Dirección</label>
          <textarea id="cf-direccion" style="min-height:60px" placeholder="Calle, carrera, municipio...">${row ? (row.direccion || '') : ''}</textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="btn-save-cliente">💾 Guardar</button>
    </div>
  `);

  document.getElementById('btn-save-cliente').addEventListener('click', async () => {
    const body = {
      nombre: document.getElementById('cf-nombre').value.trim(),
      telefono: document.getElementById('cf-telefono').value.trim(),
      direccion: document.getElementById('cf-direccion').value.trim()
    };
    if (!body.nombre) { showToast('El nombre es requerido', 'error'); return; }
    try {
      if (row) {
        await API.put(`/api/clientes/${row.id}`, body);
        showToast('Cliente actualizado', 'success');
      } else {
        await API.post('/api/clientes', body);
        showToast('Cliente registrado', 'success');
      }
      closeModal();
      renderClientes();
    } catch (e) { showToast(e.message, 'error'); }
  });
}

/* ═══════════════════════════
   USUARIOS.JS
═══════════════════════════ */

async function renderUsuarios() {
  if (!currentUser || currentUser.rol !== 'admin') {
    document.getElementById('page-content').innerHTML = `
      <div class="alert alert-danger">
        <span>🔒</span>
        <span>Acceso denegado. Solo el administrador puede gestionar usuarios.</span>
      </div>`;
    return;
  }

  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>⚙️ Gestión de Usuarios</h2>
        <p>Administrar cuentas de acceso al sistema</p>
      </div>
      <button class="btn btn-primary" id="btn-nuevo-user">+ Nuevo Usuario</button>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">👥 Usuarios del sistema</div></div>
      <div class="table-wrapper" id="u-table-wrapper">
        <div class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      </div>
    </div>
  `;

  let usersData = [];

  async function loadUsers() {
    usersData = await API.get('/api/auth/usuarios') || [];
    renderUsersTable(usersData);
  }

  function renderUsersTable(rows) {
    const wrapper = document.getElementById('u-table-wrapper');
    if (!rows.length) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><p>Sin usuarios registrados</p></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Fecha registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(u => `
            <tr>
              <td><code style="background:var(--bg);padding:0.2rem 0.5rem;border-radius:4px">${u.username}</code></td>
              <td>${u.nombre}</td>
              <td>${u.rol === 'admin'
                ? '<span class="badge badge-success">👑 Administrador</span>'
                : '<span class="badge badge-info">👷 Empleado</span>'}</td>
              <td>${u.activo
                ? '<span class="badge badge-success">✅ Activo</span>'
                : '<span class="badge badge-danger">❌ Inactivo</span>'}</td>
              <td>${fmtDate(u.created_at)}</td>
              <td>
                <div class="td-actions">
                  <button class="btn-icon" title="Editar" onclick="editUser(${u.id})">✏️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  document.getElementById('btn-nuevo-user').addEventListener('click', () => openUserModal());

  window.editUser = (id) => {
    const u = usersData.find(r => r.id === id);
    if (u) openUserModal(u);
  };

  function openUserModal(row = null) {
    openModal(`
      <div class="modal-header">
        <div class="modal-title">${row ? '✏️ Editar' : '➕ Nuevo'} Usuario</div>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group full">
            <label>Nombre completo *</label>
            <input type="text" id="uf-nombre" value="${row ? row.nombre : ''}" required>
          </div>
          <div class="form-group">
            <label>Nombre de usuario *</label>
            <input type="text" id="uf-username" value="${row ? row.username : ''}" ${row ? 'readonly style="background:var(--bg)"' : ''} required>
          </div>
          <div class="form-group">
            <label>Rol *</label>
            <select id="uf-rol">
              <option value="empleado" ${!row || row.rol === 'empleado' ? 'selected' : ''}>👷 Empleado</option>
              <option value="admin" ${row && row.rol === 'admin' ? 'selected' : ''}>👑 Administrador</option>
            </select>
          </div>
          <div class="form-group">
            <label>${row ? 'Nueva contraseña (dejar vacío = no cambiar)' : 'Contraseña *'}</label>
            <input type="password" id="uf-password" ${row ? '' : 'required'} placeholder="Mínimo 6 caracteres">
          </div>
          ${row ? `
          <div class="form-group">
            <label>Estado</label>
            <select id="uf-activo">
              <option value="1" ${row.activo ? 'selected' : ''}>✅ Activo</option>
              <option value="0" ${!row.activo ? 'selected' : ''}>❌ Inactivo</option>
            </select>
          </div>` : ''}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="btn-save-user">💾 Guardar</button>
      </div>
    `);

    document.getElementById('btn-save-user').addEventListener('click', async () => {
      const body = {
        nombre: document.getElementById('uf-nombre').value.trim(),
        rol: document.getElementById('uf-rol').value,
        activo: row ? (document.getElementById('uf-activo').value === '1') : true
      };
      if (!row) body.username = document.getElementById('uf-username').value.trim();

      const pwd = document.getElementById('uf-password').value;
      if (pwd) body.password = pwd;
      if (!row && !pwd) { showToast('La contraseña es requerida', 'error'); return; }

      try {
        if (row) {
          await API.put(`/api/auth/usuarios/${row.id}`, body);
          showToast('Usuario actualizado', 'success');
        } else {
          await API.post('/api/auth/usuarios', body);
          showToast('Usuario creado', 'success');
        }
        closeModal();
        loadUsers();
      } catch (e) { showToast(e.message, 'error'); }
    });
  }

  await loadUsers();
}

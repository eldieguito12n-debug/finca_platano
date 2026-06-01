/* ═══════════════════════════════════════════
   CONFIGURACION.JS – Módulo de Configuración
═══════════════════════════════════════════ */

async function renderConfiguracion() {
  if (currentUser.rol !== 'admin') {
    document.getElementById('page-content').innerHTML = `
      <div class="alert alert-danger">
        <span>🔒</span><span>Solo el administrador puede acceder a la configuración.</span>
      </div>`;
    return;
  }

  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="empty-state"><div class="spinner" style="margin:0 auto;width:40px;height:40px"></div></div>`;

  // Load current config
  const cfg = await API.get('/api/configuracion');
  if (!cfg) return;

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>🔧 Configuración</h2>
        <p>Personalice los datos de su finca y el sistema</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.25rem">

      <!-- Datos de la Finca -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🌿 Datos de la Finca</div>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label>Nombre de la finca *</label>
            <input type="text" id="cfg-nombre-finca" value="${esc(cfg.nombre_finca)}" placeholder="Ej: Finca La Esperanza">
          </div>
          <div class="form-group">
            <label>Propietario</label>
            <input type="text" id="cfg-propietario" value="${esc(cfg.propietario)}" placeholder="Nombre completo">
          </div>
          <div class="form-group">
            <label>Municipio</label>
            <input type="text" id="cfg-municipio" value="${esc(cfg.municipio)}" placeholder="Ej: Urabá">
          </div>
          <div class="form-group">
            <label>Departamento</label>
            <input type="text" id="cfg-departamento" value="${esc(cfg.departamento)}" placeholder="Ej: Antioquia">
          </div>
          <div class="form-group">
            <label>Variedad cultivada</label>
            <input type="text" id="cfg-variedad" value="${esc(cfg.variedad)}" placeholder="Ej: Dominico hartón">
          </div>
          <div class="form-group">
            <label>Hectáreas sembradas</label>
            <input type="number" id="cfg-hectareas" value="${esc(cfg.hectareas)}" placeholder="Ej: 25" min="0" step="0.1">
          </div>
        </div>
      </div>

      <!-- Datos de Contacto -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📞 Contacto y Legal</div>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="cfg-telefono" value="${esc(cfg.telefono)}" placeholder="Ej: 300 123 4567">
          </div>
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" id="cfg-email" value="${esc(cfg.email)}" placeholder="correo@ejemplo.com">
          </div>
          <div class="form-group">
            <label>NIT / Cédula</label>
            <input type="text" id="cfg-nit" value="${esc(cfg.nit)}" placeholder="Ej: 900.123.456-7">
          </div>
        </div>

        <!-- Ajustes del Sistema -->
        <div class="card-header" style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border)">
          <div class="card-title">⚙️ Ajustes del Sistema</div>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label>Símbolo de Moneda</label>
            <input type="text" id="cfg-moneda" value="${esc(cfg.moneda) || '$'}" placeholder="Ej: $, COP, USD">
          </div>
          <div class="form-group">
            <label>Meta de Producción Semanal (Cajas)</label>
            <input type="number" id="cfg-meta-cajas" value="${esc(cfg.meta_cajas) || '100'}" placeholder="Ej: 100">
          </div>
          <div class="form-group">
            <label>Formato de Fecha</label>
            <select id="cfg-formato-fecha">
              <option value="DD/MM/YYYY" ${cfg.formato_fecha === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
              <option value="YYYY-MM-DD" ${cfg.formato_fecha === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
              <option value="MM/DD/YYYY" ${cfg.formato_fecha === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
            </select>
          </div>
        </div>

        <!-- Apariencia -->
        <div class="card-header" style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border)">
          <div class="card-title">🎨 Apariencia</div>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label>Color principal</label>
            <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
              ${[
                { color: '#2d6a4f', label: 'Verde bosque' },
                { color: '#1b5e20', label: 'Verde oscuro' },
                { color: '#4a7c59', label: 'Verde campo' },
                { color: '#5c4033', label: 'Tierra café' },
                { color: '#1565c0', label: 'Azul agua' },
                { color: '#4a148c', label: 'Morado' },
              ].map(opt => `
                <button class="color-swatch ${cfg.color_primario === opt.color ? 'active' : ''}"
                        style="background:${opt.color}"
                        title="${opt.label}"
                        data-color="${opt.color}"
                        onclick="selectColor(this)">
                  ${cfg.color_primario === opt.color ? '✓' : ''}
                </button>
              `).join('')}
              <input type="color" id="cfg-color-custom" value="${esc(cfg.color_primario) || '#2d6a4f'}"
                     title="Color personalizado"
                     style="width:36px;height:36px;border:none;padding:0;border-radius:8px;cursor:pointer"
                     oninput="selectCustomColor(this.value)">
            </div>
            <input type="hidden" id="cfg-color-primario" value="${esc(cfg.color_primario) || '#2d6a4f'}">
          </div>
        </div>
      </div>

      <!-- Preview de la Finca -->
      <div class="card" style="grid-column:1/-1">
        <div class="card-header">
          <div class="card-title">👁 Vista Previa del Encabezado</div>
        </div>
        <div id="cfg-preview" style="
          background: linear-gradient(135deg, var(--primary, #2d6a4f), var(--primary-light, #52b788));
          border-radius: var(--radius-md);
          padding: 1.5rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 1rem;
        ">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.8rem">🍌</div>
          <div>
            <div id="preview-nombre" style="font-size:1.2rem;font-weight:800">${esc(cfg.nombre_finca) || 'Mi Finca'}</div>
            <div style="font-size:0.8rem;opacity:0.8" id="preview-sub">${[cfg.municipio, cfg.departamento].filter(Boolean).join(', ') || 'Sistema de Gestión'}</div>
            <div style="font-size:0.75rem;opacity:0.65;margin-top:0.2rem" id="preview-prop">${cfg.propietario ? '👤 ' + cfg.propietario : ''}</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Save Button -->
    <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;gap:0.75rem">
      <button class="btn btn-secondary" onclick="resetConfigForm()">↩ Restablecer</button>
      <button class="btn btn-primary" id="btn-save-cfg" style="padding:0.8rem 2rem">
        💾 Guardar Configuración
      </button>
    </div>

    <!-- Sección de Cambio de Contraseña -->
    <div class="card" style="margin-top:1.5rem">
      <div class="card-header">
        <div class="card-title">🔐 Cambiar mi contraseña</div>
      </div>
      <div class="form-grid" style="max-width:400px">
        <div class="form-group">
          <label>Nueva contraseña</label>
          <input type="password" id="cfg-new-pwd" placeholder="Mínimo 6 caracteres">
        </div>
        <div class="form-group">
          <label>Confirmar contraseña</label>
          <input type="password" id="cfg-confirm-pwd" placeholder="Repita la contraseña">
        </div>
      </div>
      <div style="margin-top:0.75rem">
        <button class="btn btn-secondary" id="btn-change-pwd">🔒 Cambiar Contraseña</button>
      </div>
    </div>
  `;

  // Live preview update
  function updatePreview() {
    const nombre = document.getElementById('cfg-nombre-finca').value || 'Mi Finca';
    const municipio = document.getElementById('cfg-municipio').value;
    const depto = document.getElementById('cfg-departamento').value;
    const prop = document.getElementById('cfg-propietario').value;
    document.getElementById('preview-nombre').textContent = nombre;
    document.getElementById('preview-sub').textContent = [municipio, depto].filter(Boolean).join(', ') || 'Sistema de Gestión';
    document.getElementById('preview-prop').textContent = prop ? '👤 ' + prop : '';
  }

  ['cfg-nombre-finca','cfg-municipio','cfg-departamento','cfg-propietario'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
  });

  // Save config
  document.getElementById('btn-save-cfg').addEventListener('click', async () => {
    const body = {
      nombre_finca:  document.getElementById('cfg-nombre-finca').value.trim(),
      propietario:   document.getElementById('cfg-propietario').value.trim(),
      municipio:     document.getElementById('cfg-municipio').value.trim(),
      departamento:  document.getElementById('cfg-departamento').value.trim(),
      variedad:      document.getElementById('cfg-variedad').value.trim(),
      hectareas:     document.getElementById('cfg-hectareas').value.trim(),
      telefono:      document.getElementById('cfg-telefono').value.trim(),
      email:         document.getElementById('cfg-email').value.trim(),
      nit:           document.getElementById('cfg-nit').value.trim(),
      moneda:        document.getElementById('cfg-moneda').value.trim(),
      meta_cajas:    document.getElementById('cfg-meta-cajas').value.trim(),
      formato_fecha: document.getElementById('cfg-formato-fecha').value,
      color_primario: document.getElementById('cfg-color-primario').value,
    };
    if (!body.nombre_finca) { showToast('El nombre de la finca es requerido', 'error'); return; }
    try {
      await API.put('/api/configuracion', body);
      showToast('✅ Configuración guardada correctamente', 'success');
      // Update sidebar name
      document.getElementById('sidebar-farm-name').textContent = body.nombre_finca;
      document.title = body.nombre_finca + ' – Administración';
      // Apply color
      document.documentElement.style.setProperty('--primary', body.color_primario);
    } catch (e) { showToast(e.message, 'error'); }
  });

  // Change password
  document.getElementById('btn-change-pwd').addEventListener('click', async () => {
    const pwd = document.getElementById('cfg-new-pwd').value;
    const confirm = document.getElementById('cfg-confirm-pwd').value;
    if (!pwd || pwd.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    if (pwd !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }
    try {
      await API.put(`/api/auth/usuarios/${currentUser.id}`, {
        nombre: currentUser.nombre, rol: currentUser.rol, activo: 1, password: pwd
      });
      showToast('Contraseña cambiada correctamente', 'success');
      document.getElementById('cfg-new-pwd').value = '';
      document.getElementById('cfg-confirm-pwd').value = '';
    } catch (e) { showToast(e.message, 'error'); }
  });

  // Store original values for reset
  window._cfgOriginal = cfg;
}

// Color swatch selection
window.selectColor = function(btn) {
  document.querySelectorAll('.color-swatch').forEach(s => { s.classList.remove('active'); s.textContent = ''; });
  btn.classList.add('active');
  btn.textContent = '✓';
  const color = btn.dataset.color;
  document.getElementById('cfg-color-primario').value = color;
  document.getElementById('cfg-color-custom').value = color;
  document.documentElement.style.setProperty('--primary', color);
};

window.selectCustomColor = function(color) {
  document.querySelectorAll('.color-swatch').forEach(s => { s.classList.remove('active'); s.textContent = ''; });
  document.getElementById('cfg-color-primario').value = color;
  document.documentElement.style.setProperty('--primary', color);
};

window.resetConfigForm = async function() {
  if (window._cfgOriginal) renderConfiguracion();
};

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── CSS for color swatches (injected once) ──────────────────
if (!document.getElementById('cfg-style')) {
  const style = document.createElement('style');
  style.id = 'cfg-style';
  style.textContent = `
    .color-swatch {
      width: 36px; height: 36px;
      border-radius: 8px;
      border: 3px solid transparent;
      cursor: pointer;
      font-size: 1rem;
      color: white;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.active { border-color: white; box-shadow: 0 0 0 3px rgba(0,0,0,0.3); transform: scale(1.1); }
  `;
  document.head.appendChild(style);
}

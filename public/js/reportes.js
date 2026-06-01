/* ═══════════════════════════
   REPORTES.JS
═══════════════════════════ */

async function renderReportes() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h2>📊 Reportes</h2>
        <p>Análisis de producción, ventas, gastos y ganancias</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.5rem">
      <div class="card-header"><div class="card-title">⚙️ Configuración del reporte</div></div>
      <div class="filter-bar">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" id="r-desde">
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" id="r-hasta">
        </div>
        <button class="btn btn-secondary" id="btn-esta-semana">Esta semana</button>
        <button class="btn btn-secondary" id="btn-este-mes">Este mes</button>
        <button class="btn btn-primary" id="btn-generar-reporte">📊 Generar Reporte</button>
      </div>
    </div>

    <div id="reportes-content" style="display:none">
      <!-- Ganancias resumen -->
      <div class="kpi-grid" style="margin-bottom:1.5rem" id="r-kpis"></div>

      <!-- Chart ganancias -->
      <div class="charts-grid" style="margin-bottom:1.5rem">
        <div class="card">
          <div class="card-header"><div class="card-title">📈 Ventas vs Gastos (mensual)</div></div>
          <canvas id="r-chart-ganancia" height="220"></canvas>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">🍩 Gastos por categoría</div></div>
          <canvas id="r-chart-gastos-cat" height="220"></canvas>
        </div>
      </div>

      <!-- Tabs: Producción | Ventas | Gastos -->
      <div class="card">
        <div class="tabs">
          <button class="tab-btn active" data-tab="r-prod">📦 Producción</button>
          <button class="tab-btn" data-tab="r-ventas">💰 Ventas</button>
          <button class="tab-btn" data-tab="r-gastos">💸 Gastos</button>
        </div>

        <!-- Producción tab -->
        <div id="r-prod" class="tab-content">
          <div class="card-header" style="padding:0 0 1rem">
            <div class="card-title">Producción por período</div>
            <div style="display:flex;gap:0.5rem">
              <select id="r-prod-agrup" style="padding:0.4rem 0.7rem;font-size:0.8rem">
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
              </select>
              <button class="btn btn-sm btn-success" id="r-export-prod-excel">📊 Excel</button>
              <button class="btn btn-sm btn-danger" id="r-export-prod-pdf">📄 PDF</button>
            </div>
          </div>
          <div class="table-wrapper" id="r-prod-table"></div>
        </div>

        <!-- Ventas tab -->
        <div id="r-ventas" class="tab-content" style="display:none">
          <div class="card-header" style="padding:0 0 1rem">
            <div class="card-title">Detalle de ventas</div>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-sm btn-success" id="r-export-ventas-excel">📊 Excel</button>
              <button class="btn btn-sm btn-danger" id="r-export-ventas-pdf">📄 PDF</button>
            </div>
          </div>
          <div class="table-wrapper" id="r-ventas-table"></div>
        </div>

        <!-- Gastos tab -->
        <div id="r-gastos" class="tab-content" style="display:none">
          <div class="card-header" style="padding:0 0 1rem">
            <div class="card-title">Detalle de gastos</div>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-sm btn-success" id="r-export-gastos-excel">📊 Excel</button>
              <button class="btn btn-sm btn-danger" id="r-export-gastos-pdf">📄 PDF</button>
            </div>
          </div>
          <div class="table-wrapper" id="r-gastos-table"></div>
        </div>
      </div>
    </div>

    <div id="reportes-placeholder" class="card" style="text-align:center;padding:3rem">
      <div style="font-size:4rem;margin-bottom:1rem">📊</div>
      <h3 style="color:var(--text);margin-bottom:0.5rem">Seleccione un período y genere el reporte</h3>
      <p style="color:var(--text-muted)">Elija las fechas de inicio y fin para analizar los datos.</p>
    </div>
  `;

  let reportData = { produccion: null, ventas: null, gastos: null, ganancias: null };

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).style.display = 'block';
    });
  });

  // Quick date ranges
  document.getElementById('btn-esta-semana').addEventListener('click', () => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now); monday.setDate(now.getDate() - day + 1);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    document.getElementById('r-desde').value = monday.toISOString().split('T')[0];
    document.getElementById('r-hasta').value = sunday.toISOString().split('T')[0];
  });

  document.getElementById('btn-este-mes').addEventListener('click', () => {
    const { desde, hasta } = getMonthRange();
    document.getElementById('r-desde').value = desde;
    document.getElementById('r-hasta').value = hasta;
  });

  document.getElementById('btn-generar-reporte').addEventListener('click', async () => {
    const desde = document.getElementById('r-desde').value;
    const hasta = document.getElementById('r-hasta').value;

    const btn = document.getElementById('btn-generar-reporte');
    btn.textContent = '⏳ Cargando...';
    btn.disabled = true;

    try {
      const params = new URLSearchParams();
      if (desde) params.append('desde', desde);
      if (hasta) params.append('hasta', hasta);
      const q = params.toString() ? '?' + params.toString() : '';

      const [prod, ventas, gastos, ganancias] = await Promise.all([
        API.get(`/api/reportes/produccion${q}&agrupacion=${document.getElementById('r-prod-agrup')?.value || 'semana'}`),
        API.get('/api/reportes/ventas' + q),
        API.get('/api/reportes/gastos' + q),
        API.get('/api/reportes/ganancias' + q)
      ]);

      reportData = { prod, ventas, gastos, ganancias };

      document.getElementById('reportes-placeholder').style.display = 'none';
      document.getElementById('reportes-content').style.display = 'block';

      renderKPIs(ganancias);
      renderChartGanancias(ganancias.mensual);
      renderChartGastosCat(gastos.porCategoria);
      renderProdTable(prod);
      renderVentasTable(ventas);
      renderGastosTable(gastos);
      setupExports(prod, ventas, gastos);

    } catch (e) {
      showToast('Error al generar reportes: ' + e.message, 'error');
    } finally {
      btn.textContent = '📊 Generar Reporte';
      btn.disabled = false;
    }
  });

  document.getElementById('r-prod-agrup')?.addEventListener('change', () => {
    document.getElementById('btn-generar-reporte').click();
  });

  function renderKPIs(g) {
    document.getElementById('r-kpis').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon green">💰</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem;color:var(--success)">${fmtCurrency(g.ventas)}</div>
          <div class="kpi-label">Total ventas</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon red">💸</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem;color:var(--danger)">${fmtCurrency(g.gastos + g.compras)}</div>
          <div class="kpi-label">Total egresos (gastos + compras)</div>
        </div>
      </div>
      <div class="kpi-card" style="${g.ganancia >= 0 ? '' : 'border-color:var(--danger)'}">
        <div class="kpi-icon ${g.ganancia >= 0 ? 'blue' : 'red'}">${g.ganancia >= 0 ? '📈' : '📉'}</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem;color:${g.ganancia >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmtCurrency(g.ganancia)}</div>
          <div class="kpi-label">Ganancia neta</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon earth">🛒</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.1rem;color:var(--warning)">${fmtCurrency(g.compras)}</div>
          <div class="kpi-label">Compras de insumos</div>
        </div>
      </div>
    `;
  }

  function renderChartGanancias(mensual) {
    // Aggregate by month
    const meses = [...new Set(mensual.map(r => r.mes))].sort();
    const ventasMap = {}, gastosMap = {};
    mensual.forEach(r => {
      if (r.ventas > 0) ventasMap[r.mes] = (ventasMap[r.mes] || 0) + r.ventas;
      if (r.gastos > 0) gastosMap[r.mes] = (gastosMap[r.mes] || 0) + r.gastos;
    });

    const ctx = document.getElementById('r-chart-ganancia').getContext('2d');
    if (activeCharts['r-ganancia']) activeCharts['r-ganancia'].destroy();
    activeCharts['r-ganancia'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: meses.map(formatMes),
        datasets: [
          { label: 'Ventas', data: meses.map(m => ventasMap[m] || 0), backgroundColor: 'rgba(45,106,79,0.75)', borderRadius: 6 },
          { label: 'Gastos', data: meses.map(m => gastosMap[m] || 0), backgroundColor: 'rgba(230,57,70,0.7)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtCurrency(ctx.raw)}` } } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => '$ ' + (v / 1000).toFixed(0) + 'k' } } }
      }
    });
  }

  function renderChartGastosCat(porCategoria) {
    if (!porCategoria || !porCategoria.length) return;
    const ctx = document.getElementById('r-chart-gastos-cat').getContext('2d');
    if (activeCharts['r-gastos-cat']) activeCharts['r-gastos-cat'].destroy();
    activeCharts['r-gastos-cat'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: porCategoria.map(c => c.categoria || 'Otros'),
        datasets: [{
          data: porCategoria.map(c => c.total),
          backgroundColor: ['#2d6a4f','#52b788','#d4a373','#e63946','#457b9d','#74c69d'],
          borderWidth: 2, borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtCurrency(ctx.raw)}` } }
        }
      }
    });
  }

  function renderProdTable(prod) {
    const wrapper = document.getElementById('r-prod-table');
    if (!prod || !prod.data.length) { wrapper.innerHTML = '<div class="empty-state"><p>Sin datos de producción</p></div>'; return; }
    wrapper.innerHTML = `
      <table>
        <thead><tr><th>Período</th><th>Total Cajas</th><th>Total Bolsas</th><th>Registros</th><th>Inicio</th><th>Fin</th></tr></thead>
        <tbody>
          ${prod.data.map(r => `
            <tr>
              <td><span class="badge badge-info">${r.periodo}</span></td>
              <td><strong>${fmt(r.total_cajas)}</strong></td>
              <td><strong>${fmt(r.total_bolsas)}</strong></td>
              <td>${r.registros}</td>
              <td>${fmtDate(r.fecha_inicio)}</td>
              <td>${fmtDate(r.fecha_fin)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--primary-pale);font-weight:700">
            <td>TOTAL</td>
            <td>${fmt(prod.totales?.total_cajas || 0)}</td>
            <td>${fmt(prod.totales?.total_bolsas || 0)}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  function renderVentasTable(ventas) {
    const wrapper = document.getElementById('r-ventas-table');
    if (!ventas || !ventas.data.length) { wrapper.innerHTML = '<div class="empty-state"><p>Sin datos de ventas</p></div>'; return; }

    const byEstado = ventas.porEstado || [];
    const byProd = ventas.porProducto || [];

    wrapper.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
        <div>
          <div style="font-weight:700;margin-bottom:0.5rem;font-size:0.85rem">Por estado de pago</div>
          ${byEstado.map(e => `<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border)">
            <span>${estadoPagoBadge(e.estado_pago)}</span>
            <strong>${fmtCurrency(e.total)}</strong>
          </div>`).join('')}
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:0.5rem;font-size:0.85rem">Por producto</div>
          ${byProd.map(p => `<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border)">
            <span>${p.producto === 'cajas' ? '📦 Cajas' : '🛍 Bolsas'} (${p.cantidad})</span>
            <strong>${fmtCurrency(p.total)}</strong>
          </div>`).join('')}
        </div>
      </div>
      <table>
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Cantidad</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
          ${ventas.data.slice(0, 50).map(v => `
            <tr>
              <td>${fmtDate(v.fecha)}</td>
              <td>${v.cliente_nombre || '—'}</td>
              <td>${v.producto}</td>
              <td>${fmt(v.cantidad)}</td>
              <td><strong>${fmtCurrency(v.total)}</strong></td>
              <td>${estadoPagoBadge(v.estado_pago)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderGastosTable(gastos) {
    const wrapper = document.getElementById('r-gastos-table');
    if (!gastos || !gastos.data.length) { wrapper.innerHTML = '<div class="empty-state"><p>Sin datos de gastos</p></div>'; return; }
    wrapper.innerHTML = `
      <table>
        <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Valor</th></tr></thead>
        <tbody>
          ${gastos.data.slice(0, 50).map(g => `
            <tr>
              <td>${fmtDate(g.fecha)}</td>
              <td>${g.categoria_nombre || '—'}</td>
              <td>${g.descripcion}</td>
              <td><strong style="color:var(--danger)">${fmtCurrency(g.valor)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight:700;background:rgba(230,57,70,0.05)">
            <td colspan="3">TOTAL</td>
            <td style="color:var(--danger)">${fmtCurrency(gastos.totales?.total || 0)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  function setupExports(prod, ventas, gastos) {
    document.getElementById('r-export-prod-excel').onclick = () => {
      if (!prod?.data?.length) return;
      exportToExcel(prod.data, [
        { key: 'periodo', header: 'Período' },
        { key: 'total_cajas', header: 'Cajas' },
        { key: 'total_bolsas', header: 'Bolsas' },
        { key: 'registros', header: 'Registros' }
      ], 'Producción', `Reporte_Prod_${todayISO()}`);
    };

    document.getElementById('r-export-prod-pdf').onclick = () => {
      if (!prod?.data?.length) return;
      exportToPDF(prod.data, [
        { key: 'periodo', header: 'Período' },
        { key: 'total_cajas', header: 'Cajas' },
        { key: 'total_bolsas', header: 'Bolsas' }
      ], 'Reporte de Producción', `Reporte_Prod_${todayISO()}`);
    };

    document.getElementById('r-export-ventas-excel').onclick = () => {
      if (!ventas?.data?.length) return;
      exportToExcel(ventas.data, [
        { key: 'fecha', header: 'Fecha' },
        { key: 'cliente_nombre', header: 'Cliente' },
        { key: 'producto', header: 'Producto' },
        { key: 'cantidad', header: 'Cantidad' },
        { key: 'total', header: 'Total' },
        { key: 'estado_pago', header: 'Estado' }
      ], 'Ventas', `Reporte_Ventas_${todayISO()}`);
    };

    document.getElementById('r-export-ventas-pdf').onclick = () => {
      if (!ventas?.data?.length) return;
      exportToPDF(ventas.data, [
        { key: 'fecha', header: 'Fecha', format: 'date' },
        { key: 'cliente_nombre', header: 'Cliente' },
        { key: 'producto', header: 'Producto' },
        { key: 'total', header: 'Total', format: 'currency' },
        { key: 'estado_pago', header: 'Estado' }
      ], 'Reporte de Ventas', `Reporte_Ventas_${todayISO()}`);
    };

    document.getElementById('r-export-gastos-excel').onclick = () => {
      if (!gastos?.data?.length) return;
      exportToExcel(gastos.data, [
        { key: 'fecha', header: 'Fecha' },
        { key: 'categoria_nombre', header: 'Categoría' },
        { key: 'descripcion', header: 'Descripción' },
        { key: 'valor', header: 'Valor' }
      ], 'Gastos', `Reporte_Gastos_${todayISO()}`);
    };

    document.getElementById('r-export-gastos-pdf').onclick = () => {
      if (!gastos?.data?.length) return;
      exportToPDF(gastos.data, [
        { key: 'fecha', header: 'Fecha', format: 'date' },
        { key: 'categoria_nombre', header: 'Categoría' },
        { key: 'descripcion', header: 'Descripción' },
        { key: 'valor', header: 'Valor', format: 'currency' }
      ], 'Reporte de Gastos', `Reporte_Gastos_${todayISO()}`);
    };
  }
}

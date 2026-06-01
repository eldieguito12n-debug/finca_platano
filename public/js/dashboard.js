/* ═══════════════════════════
   DASHBOARD.JS
═══════════════════════════ */

async function renderDashboard() {
  const content = document.getElementById('page-content');
  const data = await API.get('/api/dashboard/stats');
  if (!data) return;

  // Update low stock badge
  const badge = document.getElementById('badge-stock');
  if (data.lowStock && data.lowStock.length > 0) {
    badge.textContent = data.lowStock.length;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }

  // Build months labels for charts
  const prodMeses = data.charts.prodMensual.map(r => formatMes(r.mes));
  const prodCajas = data.charts.prodMensual.map(r => r.cajas || 0);
  const prodBolsas = data.charts.prodMensual.map(r => r.bolsas || 0);

  // Merge ventas and gastos by month
  const allMeses = [...new Set([
    ...data.charts.ventasMensual.map(r => r.mes),
    ...data.charts.gastosMensual.map(r => r.mes)
  ])].sort();
  const ventasMap = Object.fromEntries(data.charts.ventasMensual.map(r => [r.mes, r.total]));
  const gastosMap = Object.fromEntries(data.charts.gastosMensual.map(r => [r.mes, r.total]));

  const meta = parseInt(window.APP_CONFIG?.meta_cajas) || 100;
  const progreso = Math.min(100, Math.round((data.produccionSemana.cajas / meta) * 100));

  content.innerHTML = `
    <!-- Goal Progress -->
    <div class="card" style="margin-bottom:1.25rem">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
        <div style="font-weight:600; font-size:0.9rem">🎯 Meta de Producción Semanal (${fmt(data.produccionSemana.cajas)} / ${fmt(meta)} cajas)</div>
        <div style="font-weight:700; color:var(--primary)">${progreso}%</div>
      </div>
      <div style="width:100%; height:12px; background:var(--primary-pale); border-radius:10px; overflow:hidden">
        <div style="width:${progreso}%; height:100%; background:var(--primary); transition: width 1s ease-out"></div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon green">📦</div>
        <div class="kpi-info">
          <div class="kpi-value">${fmt(data.produccionSemana.cajas)}</div>
          <div class="kpi-label">Cajas producidas esta semana</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">🛍</div>
        <div class="kpi-info">
          <div class="kpi-value">${fmt(data.produccionSemana.bolsas)}</div>
          <div class="kpi-label">Bolsas producidas esta semana</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon earth">💰</div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.15rem">${fmtCurrency(data.ventasSemana.total)}</div>
          <div class="kpi-label">Ventas esta semana (${data.ventasSemana.cantidad} ventas)</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ${data.gananciasMes >= 0 ? 'blue' : 'red'}">
          ${data.gananciasMes >= 0 ? '📈' : '📉'}
        </div>
        <div class="kpi-info">
          <div class="kpi-value" style="font-size:1.15rem;color:${data.gananciasMes >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${fmtCurrency(data.gananciasMes)}
          </div>
          <div class="kpi-label">Ganancias netas del mes</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📦 Producción mensual</div>
        </div>
        <canvas id="chart-produccion" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">💹 Ventas vs Gastos</div>
        </div>
        <canvas id="chart-finanzas" height="200"></canvas>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="charts-grid">
      <!-- Low Stock Alerts -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚠️ Insumos con bajo stock</div>
          <button class="btn btn-sm btn-secondary" onclick="navigateTo('inventario')">Ver todos</button>
        </div>
        ${data.lowStock.length === 0
          ? '<div class="empty-state" style="padding:1.5rem"><div class="empty-icon">✅</div><p>¡Todos los insumos tienen stock suficiente!</p></div>'
          : `<div class="table-wrapper">
              <table>
                <thead><tr><th>Insumo</th><th>Categoría</th><th>Stock</th><th>Mínimo</th></tr></thead>
                <tbody>
                  ${data.lowStock.map(i => `
                    <tr>
                      <td><strong>${i.nombre}</strong></td>
                      <td>${i.categoria || '—'}</td>
                      <td class="stock-low">${i.cantidad} ${i.unidad_medida}</td>
                      <td>${i.stock_minimo} ${i.unidad_medida}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`
        }
      </div>

      <!-- Recent Sales -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🕐 Últimas ventas</div>
          <button class="btn btn-sm btn-secondary" onclick="navigateTo('ventas')">Ver todas</button>
        </div>
        ${data.ventasRecientes.length === 0
          ? '<div class="empty-state" style="padding:1.5rem"><div class="empty-icon">📭</div><p>Sin ventas registradas</p></div>'
          : `<div class="table-wrapper">
              <table>
                <thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>
                  ${data.ventasRecientes.map(v => `
                    <tr>
                      <td>${fmtDate(v.fecha)}</td>
                      <td>${v.cliente_nombre || 'Sin cliente'}</td>
                      <td>${fmtCurrency(v.total)}</td>
                      <td>${estadoPagoBadge(v.estado_pago)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`
        }
      </div>
    </div>
  `;

  // Render charts
  const chartDefaults = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 } } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Poppins', size: 10 } } }
    }
  };

  // Production chart
  const ctxP = document.getElementById('chart-produccion').getContext('2d');
  activeCharts.produccion = new Chart(ctxP, {
    type: 'bar',
    data: {
      labels: prodMeses,
      datasets: [
        { label: 'Cajas', data: prodCajas, backgroundColor: 'rgba(45,106,79,0.8)', borderRadius: 6 },
        { label: 'Bolsas', data: prodBolsas, backgroundColor: 'rgba(82,183,136,0.7)', borderRadius: 6 }
      ]
    },
    options: { ...chartDefaults }
  });

  // Finance chart
  const ctxF = document.getElementById('chart-finanzas').getContext('2d');
  activeCharts.finanzas = new Chart(ctxF, {
    type: 'line',
    data: {
      labels: allMeses.map(formatMes),
      datasets: [
        {
          label: 'Ventas',
          data: allMeses.map(m => ventasMap[m] || 0),
          borderColor: '#2d6a4f',
          backgroundColor: 'rgba(45,106,79,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#2d6a4f'
        },
        {
          label: 'Gastos',
          data: allMeses.map(m => gastosMap[m] || 0),
          borderColor: '#e63946',
          backgroundColor: 'rgba(230,57,70,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#e63946'
        }
      ]
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmtCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        ...chartDefaults.scales,
        y: {
          ...chartDefaults.scales.y,
          ticks: {
            ...chartDefaults.scales.y.ticks,
            callback: v => '$ ' + (v / 1000).toFixed(0) + 'k'
          }
        }
      }
    }
  });
}

function formatMes(mesStr) {
  if (!mesStr) return '';
  const [y, m] = mesStr.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${meses[parseInt(m) - 1]} ${y}`;
}

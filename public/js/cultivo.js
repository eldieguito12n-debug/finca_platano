/* ═══════════════════════════
   CULTIVO.JS - Visual Banana Farm Interface
═══════════════════════════ */

async function renderCultivo() {
  const content = document.getElementById('page-content');

  const data = await API.get('/api/dashboard/stats');
  if (!data) return;

  const semanaActual = data.produccionSemana;
  const totalCajas = semanaActual.cajas || 0;
  const totalBolsas = semanaActual.bolsas || 0;

  content.innerHTML = `
    <style>
      .cultivo-hero {
        background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%);
        border-radius: var(--radius-lg);
        padding: 2.5rem;
        margin-bottom: 1.5rem;
        position: relative;
        overflow: hidden;
        color: white;
      }
      .cultivo-hero::before {
        content: '';
        position: absolute;
        bottom: -20px;
        right: -20px;
        width: 300px;
        height: 200px;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Cpath d='M100 150 Q90 100 70 80 Q50 60 60 30 Q70 10 100 20 Q130 10 140 30 Q150 60 130 80 Q110 100 100 150Z' fill='%23228B22' opacity='0.3'/%3E%3Cpath d='M100 150 Q85 110 65 90 Q45 70 55 40 Q65 20 100 30 Q135 20 145 40 Q155 70 135 90 Q115 110 100 150Z' fill='%2332CD32' opacity='0.25'/%3E%3Cpath d='M100 150 Q92 120 80 105 Q60 85 70 55 Q80 35 100 42 Q120 35 130 55 Q140 85 120 105 Q108 120 100 150Z' fill='%23228B22' opacity='0.35'/%3E%3C/svg%3E") no-repeat bottom right;
        opacity: 0.6;
      }
      .cultivo-hero h2 {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }
      .cultivo-hero p {
        opacity: 0.9;
        font-size: 1rem;
      }
      .cultivo-stats {
        display: flex;
        gap: 1.5rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
      }
      .cultivo-stat {
        background: rgba(255,255,255,0.15);
        border-radius: var(--radius-md);
        padding: 1rem 1.5rem;
        backdrop-filter: blur(10px);
      }
      .cultivo-stat-value {
        font-size: 1.8rem;
        font-weight: 700;
      }
      .cultivo-stat-label {
        font-size: 0.85rem;
        opacity: 0.85;
      }

      .banana-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .banana-card {
        background: white;
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .banana-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      .banana-visual {
        height: 160px;
        background: linear-gradient(180deg, #87CEEB 0%, #90EE90 70%, #228B22 100%);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .banana-plant {
        position: relative;
        width: 80px;
        height: 140px;
      }
      .plant-tronco {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 70px;
        background: linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
        border-radius: 3px;
      }
      .plant-hoja {
        position: absolute;
        width: 60px;
        height: 30px;
        background: linear-gradient(90deg, #228B22, #32CD32, #228B22);
        border-radius: 50% 50% 50% 50% / 80% 80% 20% 20%;
        transform-origin: center bottom;
      }
      .plant-hoja.hoja-1 { top: 5px; left: 50%; transform: translateX(-50%) rotate(-30deg); }
      .plant-hoja.hoja-2 { top: 15px; left: 50%; transform: translateX(-50%) rotate(25deg); width: 55px; }
      .plant-hoja.hoja-3 { top: 25px; left: 50%; transform: translateX(-50%) rotate(-45deg); width: 50px; }
      .plant-hoja.hoja-4 { top: 35px; left: 50%; transform: translateX(-50%) rotate(40deg); width: 45px; }
      .plant-hoja.hoja-5 { top: 45px; left: 50%; transform: translateX(-50%) rotate(-20deg); width: 40px; }
      .plant-racimo {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        width: 35px;
        height: 45px;
        background: radial-gradient(ellipse at center, #FFD700 0%, #DAA520 60%, #8B4513 100%);
        border-radius: 50% 50% 40% 40%;
        box-shadow: inset 0 -5px 10px rgba(0,0,0,0.2);
      }
      .plant-racimo::before {
        content: '';
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 10px;
        background: #654321;
        border-radius: 2px;
      }
      .plant-racimo::after {
        content: '';
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 10px;
        background: #8B008B;
        border-radius: 50% 50% 0 0;
        opacity: 0.7;
      }
      .banana-info {
        padding: 1.25rem;
      }
      .banana-info h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 0.5rem;
      }
      .banana-meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      .banana-meta span {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .status-badge.active {
        background: #d8f3dc;
        color: #1b4332;
      }
      .status-badge.harvesting {
        background: #fff3cd;
        color: #856404;
      }
      .status-badge.growing {
        background: #cce5ff;
        color: #004085;
      }

      .finca-map {
        background: white;
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
        margin-bottom: 1.5rem;
      }
      .finca-map h3 {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .map-container {
        background: linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #228B22 100%);
        border-radius: var(--radius-md);
        height: 300px;
        position: relative;
        overflow: hidden;
        border: 3px solid #1b4332;
      }
      .map-parcela {
        position: absolute;
        background: rgba(34, 139, 34, 0.4);
        border: 2px solid rgba(34, 139, 34, 0.8);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      }
      .map-parcela:hover {
        background: rgba(34, 139, 34, 0.6);
        transform: scale(1.02);
      }
      .map-parcela.parcela-1 { top: 20px; left: 10%; width: 35%; height: 40%; }
      .map-parcela.parcela-2 { top: 20px; right: 10%; width: 35%; height: 40%; }
      .map-parcela.parcela-3 { bottom: 20px; left: 25%; width: 50%; height: 35%; }
      .map-sun {
        position: absolute;
        top: 15px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: radial-gradient(circle, #FFD700 0%, #FFA500 100%);
        border-radius: 50%;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
        animation: sunPulse 3s ease-in-out infinite;
      }
      @keyframes sunPulse {
        0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6); }
        50% { box-shadow: 0 0 50px rgba(255, 215, 0, 0.8); }
      }
      .map-cloud {
        position: absolute;
        background: white;
        border-radius: 50px;
        opacity: 0.9;
        animation: cloudFloat 20s linear infinite;
      }
      .map-cloud.cloud-1 { top: 30px; left: -100px; width: 80px; height: 30px; animation-duration: 25s; }
      .map-cloud.cloud-2 { top: 60px; left: -150px; width: 60px; height: 25px; animation-duration: 18s; animation-delay: 5s; }
      @keyframes cloudFloat {
        from { transform: translateX(0); }
        to { transform: translateX(calc(100vw + 200px)); }
      }

      .cultivo-timeline {
        background: white;
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
      }
      .cultivo-timeline h3 {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .timeline-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .timeline-item {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }
      .timeline-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
      }
      .timeline-icon.planting { background: #d8f3dc; }
      .timeline-icon.watering { background: #cce5ff; }
      .timeline-icon.fertilizing { background: #fff3cd; }
      .timeline-icon.harvest { background: #FFE4B5; }
      .timeline-content {
        flex: 1;
      }
      .timeline-content h4 {
        font-size: 0.95rem;
        font-weight: 600;
        margin-bottom: 0.2rem;
      }
      .timeline-content p {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      .timeline-date {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    </style>

    <!-- Hero Section -->
    <div class="cultivo-hero">
      <h2>🌿 Mi Cultivo de Plátano</h2>
      <p>Monitorea el estado de tus plantas y parcelas en tiempo real</p>
      <div class="cultivo-stats">
        <div class="cultivo-stat">
          <div class="cultivo-stat-value">${totalCajas}</div>
          <div class="cultivo-stat-label">📦 Cajas esta semana</div>
        </div>
        <div class="cultivo-stat">
          <div class="cultivo-stat-value">${totalBolsas}</div>
          <div class="cultivo-stat-label">🛍 Bolsas esta semana</div>
        </div>
        <div class="cultivo-stat">
          <div class="cultivo-stat-value">3</div>
          <div class="cultivo-stat-label">🌱 Parcelas activas</div>
        </div>
        <div class="cultivo-stat">
          <div class="cultivo-stat-value">~240</div>
          <div class="cultivo-stat-label">🌿 Plantas totales</div>
        </div>
      </div>
    </div>

    <!-- Finca Map -->
    <div class="finca-map">
      <h3>🗺️ Mapa de la Finca</h3>
      <div class="map-container">
        <div class="map-sun"></div>
        <div class="map-cloud cloud-1"></div>
        <div class="map-cloud cloud-2"></div>
        <div class="map-parcela parcela-1">
          <span>Parcela A<br><small>~80 plantas</small></span>
        </div>
        <div class="map-parcela parcela-2">
          <span>Parcela B<br><small>~75 plantas</small></span>
        </div>
        <div class="map-parcela parcela-3">
          <span>Parcela C<br><small>~85 plantas</small></span>
        </div>
      </div>
    </div>

    <!-- Banana Plants Grid -->
    <h3 style="margin-bottom: 1rem; font-size: 1.2rem;">🌱 Estado de Plantas</h3>
    <div class="banana-grid">
      <div class="banana-card">
        <div class="banana-visual">
          <div class="banana-plant">
            <div class="plant-hoja hoja-1"></div>
            <div class="plant-hoja hoja-2"></div>
            <div class="plant-hoja hoja-3"></div>
            <div class="plant-hoja hoja-4"></div>
            <div class="plant-hoja hoja-5"></div>
            <div class="plant-tronco"></div>
            <div class="plant-racimo"></div>
          </div>
        </div>
        <div class="banana-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3>Planta #001</h3>
            <span class="status-badge harvesting">🔴 Cosecha</span>
          </div>
          <div class="banana-meta">
            <span>📅 Edad: 8 meses</span>
            <span>📊 Altura: 3.2m</span>
          </div>
        </div>
      </div>

      <div class="banana-card">
        <div class="banana-visual">
          <div class="banana-plant">
            <div class="plant-hoja hoja-1"></div>
            <div class="plant-hoja hoja-2"></div>
            <div class="plant-hoja hoja-3"></div>
            <div class="plant-hoja hoja-4"></div>
            <div class="plant-hoja hoja-5"></div>
            <div class="plant-tronco"></div>
          </div>
        </div>
        <div class="banana-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3>Planta #002</h3>
            <span class="status-badge active">🟢 Activa</span>
          </div>
          <div class="banana-meta">
            <span>📅 Edad: 5 meses</span>
            <span>📊 Altura: 2.1m</span>
          </div>
        </div>
      </div>

      <div class="banana-card">
        <div class="banana-visual">
          <div class="banana-plant">
            <div class="plant-hoja hoja-1"></div>
            <div class="plant-hoja hoja-2"></div>
            <div class="plant-hoja hoja-3"></div>
            <div class="plant-tronco" style="height: 50px;"></div>
          </div>
        </div>
        <div class="banana-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3>Planta #003</h3>
            <span class="status-badge growing">🔵 Creciendo</span>
          </div>
          <div class="banana-meta">
            <span>📅 Edad: 2 meses</span>
            <span>📊 Altura: 0.8m</span>
          </div>
        </div>
      </div>

      <div class="banana-card">
        <div class="banana-visual">
          <div class="banana-plant">
            <div class="plant-hoja hoja-1"></div>
            <div class="plant-hoja hoja-2"></div>
            <div class="plant-hoja hoja-3"></div>
            <div class="plant-hoja hoja-4"></div>
            <div class="plant-hoja hoja-5"></div>
            <div class="plant-tronco"></div>
            <div class="plant-racimo"></div>
          </div>
        </div>
        <div class="banana-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3>Planta #004</h3>
            <span class="status-badge harvesting">🔴 Cosecha</span>
          </div>
          <div class="banana-meta">
            <span>📅 Edad: 9 meses</span>
            <span>📊 Altura: 3.5m</span>
          </div>
        </div>
      </div>

      <div class="banana-card">
        <div class="banana-visual">
          <div class="banana-plant">
            <div class="plant-hoja hoja-1"></div>
            <div class="plant-hoja hoja-2"></div>
            <div class="plant-hoja hoja-3"></div>
            <div class="plant-tronco" style="height: 45px;"></div>
          </div>
        </div>
        <div class="banana-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3>Planta #005</h3>
            <span class="status-badge growing">🔵 Creciendo</span>
          </div>
          <div class="banana-meta">
            <span>📅 Edad: 1.5 meses</span>
            <span>📊 Altura: 0.5m</span>
          </div>
        </div>
      </div>

      <div class="banana-card">
        <div class="banana-visual">
          <div class="banana-plant">
            <div class="plant-hoja hoja-1"></div>
            <div class="plant-hoja hoja-2"></div>
            <div class="plant-hoja hoja-3"></div>
            <div class="plant-hoja hoja-4"></div>
            <div class="plant-tronco"></div>
            <div class="plant-racimo"></div>
          </div>
        </div>
        <div class="banana-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3>Planta #006</h3>
            <span class="status-badge active">🟢 Activa</span>
          </div>
          <div class="banana-meta">
            <span>📅 Edad: 6 meses</span>
            <span>📊 Altura: 2.8m</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="cultivo-timeline">
      <h3>📅 Actividad Reciente del Cultivo</h3>
      <div class="timeline-items">
        <div class="timeline-item">
          <div class="timeline-icon harvest">🌾</div>
          <div class="timeline-content">
            <h4>Cosecha realizada - Parcela A</h4>
            <p>Se cosecharon 45 racimos, peso total aproximado 1,350 kg</p>
            <div class="timeline-date">Hace 3 días</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon fertilizing">🧪</div>
          <div class="timeline-content">
            <h4>Aplicación de fertilizante - Urea 46%</h4>
            <p>Se aplicaron 25 kg en Parcela B, supervisión de Juan Pérez</p>
            <div class="timeline-date">Hace 5 días</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon watering">💧</div>
          <div class="timeline-content">
            <h4>Riego por goteo - Todas las parcelas</h4>
            <p>Sistema de riego activado por 2 horas</p>
            <div class="timeline-date">Hace 1 semana</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon planting">🌱</div>
          <div class="timeline-content">
            <h4>Siembra de nuevas plantas</h4>
            <p>Se plantaron 15 nuevas plántulas en Parcela C</p>
            <div class="timeline-date">Hace 2 semanas</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
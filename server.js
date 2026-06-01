require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || 'finca-platano-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/produccion',   require('./routes/produccion'));
app.use('/api/ventas',       require('./routes/ventas'));
app.use('/api/clientes',     require('./routes/clientes'));
app.use('/api/inventario',   require('./routes/inventario'));
app.use('/api/compras',      require('./routes/compras'));
app.use('/api/aplicaciones', require('./routes/aplicaciones'));
app.use('/api/gastos',       require('./routes/gastos'));
app.use('/api/reportes',     require('./routes/reportes'));
app.use('/api/configuracion',require('./routes/configuracion'));


app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

// ─── Start ────────────────────────────────────────────────────────────────────
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const { initDB } = require('./database/db');
const serverless = require('serverless-http');

// Export for Netlify Functions
module.exports.handler = async (event, context) => {
  await initDB();
  const handler = serverless(app);
  return await handler(event, context);
};

// Local start
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      const ip = getLocalIP();
      console.log('\n╔════════════════════════════════════════════╗');
      console.log('║   🍌  FINCA DE PLÁTANO - SISTEMA ACTIVO   ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log(`\n📱  Local:     http://localhost:${PORT}`);
      console.log(`🌐  Red WiFi:  http://${ip}:${PORT}`);
      console.log('\n🔑  Usuario: admin  |  Contraseña: admin123');
      console.log('\nPresiona Ctrl+C para detener el servidor\n');
    });
  }).catch(err => {
    console.error('Error iniciando base de datos:', err);
    process.exit(1);
  });
}

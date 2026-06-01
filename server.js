const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const os = require('os');
const serverless = require('serverless-http');
const { initDB } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || 'finca-platano-secret-2024',
  resave: false,
  saveUninitialized: false
}));

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/produccion', require('./routes/produccion'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/compras', require('./routes/compras'));
app.use('/api/aplicaciones', require('./routes/aplicaciones'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/configuracion', require('./routes/configuracion'));

// Servir App Principal
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Redirección por defecto
app.get('/', (req, res) => {
  res.redirect('/app');
});

// Función para obtener la IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Export para Netlify Functions
module.exports.handler = async (event, context) => {
  try {
    await initDB();
    const handler = serverless(app);
    return await handler(event, context);
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error de servidor', details: err.message })
    };
  }
};

// Iniciar Servidor Local
if (require.main === module) {
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
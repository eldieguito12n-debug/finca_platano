const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Configuración para usar PostgreSQL (Supabase) o SQLite local
const isProduction = process.env.DATABASE_URL;

const sequelize = isProduction 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(dbDir, 'finca.db'),
      logging: false
    });

// ─── Models ───────────────────────────────────────────────────────────────────
const Usuario = sequelize.define('Usuario', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.STRING, defaultValue: 'empleado' },
  activo: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'usuarios', underscored: true });

const Produccion = sequelize.define('Produccion', {
  fecha: { type: DataTypes.STRING, allowNull: false },
  semana: { type: DataTypes.INTEGER, allowNull: false },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  cajas: { type: DataTypes.INTEGER, defaultValue: 0 },
  bolsas: { type: DataTypes.INTEGER, defaultValue: 0 },
  observaciones: { type: DataTypes.TEXT },
  usuario_id: { type: DataTypes.INTEGER }
}, { tableName: 'produccion', underscored: true });

const Cliente = sequelize.define('Cliente', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING },
  direccion: { type: DataTypes.TEXT },
  activo: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'clientes', underscored: true });

const Venta = sequelize.define('Venta', {
  cliente_id: { type: DataTypes.INTEGER },
  fecha: { type: DataTypes.STRING, allowNull: false },
  producto: { type: DataTypes.STRING, allowNull: false },
  cantidad: { type: DataTypes.REAL, allowNull: false },
  precio_unitario: { type: DataTypes.REAL, allowNull: false },
  total: { type: DataTypes.REAL, allowNull: false },
  estado_pago: { type: DataTypes.STRING, defaultValue: 'pendiente' },
  observaciones: { type: DataTypes.TEXT },
  usuario_id: { type: DataTypes.INTEGER }
}, { tableName: 'ventas', underscored: true });

const CategoriaInventario = sequelize.define('CategoriaInventario', {
  nombre: { type: DataTypes.STRING, unique: true, allowNull: false }
}, { tableName: 'categorias_inventario', underscored: true });

const Inventario = sequelize.define('Inventario', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  categoria_id: { type: DataTypes.INTEGER },
  cantidad: { type: DataTypes.REAL, defaultValue: 0 },
  unidad_medida: { type: DataTypes.STRING, defaultValue: 'unidad' },
  stock_minimo: { type: DataTypes.REAL, defaultValue: 0 },
  activo: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'inventario', underscored: true });

const Compra = sequelize.define('Compra', {
  inventario_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.REAL, allowNull: false },
  precio_unitario: { type: DataTypes.REAL, allowNull: false },
  total: { type: DataTypes.REAL, allowNull: false },
  fecha: { type: DataTypes.STRING, allowNull: false },
  proveedor: { type: DataTypes.STRING },
  observaciones: { type: DataTypes.TEXT },
  usuario_id: { type: DataTypes.INTEGER }
}, { tableName: 'compras', underscored: true });

const Aplicacion = sequelize.define('Aplicacion', {
  inventario_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.REAL, allowNull: false },
  fecha: { type: DataTypes.STRING, allowNull: false },
  responsable: { type: DataTypes.STRING, allowNull: false },
  observaciones: { type: DataTypes.TEXT },
  usuario_id: { type: DataTypes.INTEGER }
}, { tableName: 'aplicaciones', underscored: true });

const CategoriaGasto = sequelize.define('CategoriaGasto', {
  nombre: { type: DataTypes.STRING, unique: true, allowNull: false }
}, { tableName: 'categorias_gastos', underscored: true });

const Gasto = sequelize.define('Gasto', {
  categoria_id: { type: DataTypes.INTEGER },
  descripcion: { type: DataTypes.STRING, allowNull: false },
  valor: { type: DataTypes.REAL, allowNull: false },
  fecha: { type: DataTypes.STRING, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER }
}, { tableName: 'gastos', underscored: true });

const Configuracion = sequelize.define('Configuracion', {
  clave: { type: DataTypes.STRING, unique: true, allowNull: false },
  valor: { type: DataTypes.TEXT }
}, { tableName: 'configuracion', underscored: true });

// ─── Seed & Sync ─────────────────────────────────────────────────────────────
async function initDB() {
  await sequelize.sync({ alter: false, force: false });
  await sequelize.query('PRAGMA foreign_keys = ON;');

  // Create tables if not exist (more controlled than force sync)
  await sequelize.sync();

  // Seed users
  const adminExists = await Usuario.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    await Usuario.create({ username: 'admin', password_hash: bcrypt.hashSync('admin123', 10), nombre: 'Administrador', rol: 'admin' });
    await Usuario.create({ username: 'empleado', password_hash: bcrypt.hashSync('empleado123', 10), nombre: 'Empleado Finca', rol: 'empleado' });

    // Seed inventory categories
    const catInv = ['Fertilizantes', 'Fungicidas', 'Herbicidas', 'Insecticidas', 'Herramientas', 'Otros insumos'];
    for (const nombre of catInv) await CategoriaInventario.findOrCreate({ where: { nombre } });

    // Seed expense categories
    const catGas = ['Mano de obra', 'Transporte', 'Mantenimiento', 'Servicios públicos', 'Otros'];
    for (const nombre of catGas) await CategoriaGasto.findOrCreate({ where: { nombre } });

    // Seed clients
    await Cliente.bulkCreate([
      { nombre: 'Distribuidora El Plátano S.A.', telefono: '3001234567', direccion: 'Calle 10 # 5-20, Bogotá' },
      { nombre: 'Supermercado La Cosecha', telefono: '3109876543', direccion: 'Carrera 15 # 8-45, Medellín' },
      { nombre: 'Frutería El Buen Sabor', telefono: '3205551234', direccion: 'Av. Principal # 12-30, Cali' }
    ]);

    // Seed inventory
    const cat1 = await CategoriaInventario.findOne({ where: { nombre: 'Fertilizantes' } });
    const cat2 = await CategoriaInventario.findOne({ where: { nombre: 'Fungicidas' } });
    const cat5 = await CategoriaInventario.findOne({ where: { nombre: 'Herramientas' } });
    await Inventario.bulkCreate([
      { nombre: 'Urea 46%', categoria_id: cat1.id, cantidad: 50, unidad_medida: 'kg', stock_minimo: 10 },
      { nombre: 'DAP 18-46-0', categoria_id: cat1.id, cantidad: 30, unidad_medida: 'kg', stock_minimo: 5 },
      { nombre: 'Mancozeb 80%', categoria_id: cat2.id, cantidad: 15, unidad_medida: 'kg', stock_minimo: 3 },
      { nombre: 'Machetes', categoria_id: cat5.id, cantidad: 8, unidad_medida: 'unidad', stock_minimo: 2 },
      { nombre: 'Guadañadora', categoria_id: cat5.id, cantidad: 2, unidad_medida: 'unidad', stock_minimo: 1 }
    ]);

    // Seed sample data
    const today = new Date().toISOString().split('T')[0];
    const week = getWeekNumber(new Date());
    const year = new Date().getFullYear();

    await Produccion.create({ fecha: today, semana: week, anio: year, cajas: 120, bolsas: 45, observaciones: 'Cosecha en buen estado' });
    const c1 = await Cliente.findOne();
    const c2 = await Cliente.findOne({ offset: 1 });
    await Venta.create({ cliente_id: c1.id, fecha: today, producto: 'cajas', cantidad: 50, precio_unitario: 35000, total: 1750000, estado_pago: 'pagado' });
    await Venta.create({ cliente_id: c2.id, fecha: today, producto: 'cajas', cantidad: 30, precio_unitario: 34000, total: 1020000, estado_pago: 'pendiente' });

    const catMO = await CategoriaGasto.findOne({ where: { nombre: 'Mano de obra' } });
    await Gasto.create({ categoria_id: catMO.id, descripcion: 'Jornales semana de cosecha', valor: 450000, fecha: today });
  }

  // Seed default configuracion (always ensure these exist)
  const defaults = [
    { clave: 'nombre_finca',   valor: 'Mi Finca de Plátano' },
    { clave: 'propietario',    valor: 'Propietario' },
    { clave: 'municipio',      valor: '' },
    { clave: 'departamento',   valor: '' },
    { clave: 'telefono',       valor: '' },
    { clave: 'email',          valor: '' },
    { clave: 'nit',            valor: '' },
    { clave: 'hectareas',      valor: '' },
    { clave: 'variedad',       valor: 'Dominico hartón' },
    { clave: 'color_primario', valor: '#2d6a4f' },
  ];
  for (const d of defaults) {
    await Configuracion.findOrCreate({ where: { clave: d.clave }, defaults: { valor: d.valor } });
  }

  console.log('✅ Base de datos inicializada correctamente');
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  sequelize, Op,
  Usuario, Produccion, Cliente, Venta,
  CategoriaInventario, Inventario, Compra, Aplicacion,
  CategoriaGasto, Gasto, Configuracion,
  initDB
};

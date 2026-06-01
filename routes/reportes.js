const express = require('express');
const router = express.Router();
const { sequelize, Op, Produccion, Venta, Gasto, Compra, CategoriaGasto, Cliente } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

function buildDateWhere(desde, hasta, field = 'fecha') {
  const where = {};
  if (desde || hasta) {
    where[field] = {};
    if (desde) where[field][Op.gte] = desde;
    if (hasta) where[field][Op.lte] = hasta;
  }
  return where;
}

router.get('/produccion', requireAuth, async (req, res) => {
  const { desde, hasta, agrupacion = 'semana' } = req.query;
  const where = buildDateWhere(desde, hasta);
  try {
    let groupSQL, selectSQL;
    if (agrupacion === 'mes') {
      groupSQL = "substr(fecha,1,7)";
      selectSQL = "substr(fecha,1,7) as periodo";
    } else {
      groupSQL = "anio, semana";
      selectSQL = "(anio || '-S' || printf('%02d', semana)) as periodo, semana, anio";
    }

    const dateFilter = (desde ? `AND fecha >= '${desde}'` : '') + (hasta ? ` AND fecha <= '${hasta}'` : '');
    const rows = await sequelize.query(`
      SELECT ${selectSQL}, SUM(cajas) as total_cajas, SUM(bolsas) as total_bolsas,
             COUNT(*) as registros, MIN(fecha) as fecha_inicio, MAX(fecha) as fecha_fin
      FROM produccion WHERE 1=1 ${dateFilter}
      GROUP BY ${groupSQL} ORDER BY fecha_inicio DESC
    `, { type: sequelize.QueryTypes.SELECT });

    const totalesRows = await Produccion.findAll({ where, raw: true });
    const totales = { total_cajas: totalesRows.reduce((s,r) => s+r.cajas,0), total_bolsas: totalesRows.reduce((s,r) => s+r.bolsas,0) };
    res.json({ data: rows, totales });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/ventas', requireAuth, async (req, res) => {
  const { desde, hasta } = req.query;
  const where = buildDateWhere(desde, hasta);
  try {
    const ventasAll = await Venta.findAll({ where, order: [['fecha','DESC']], raw: true });
    const clientIds = [...new Set(ventasAll.map(v => v.cliente_id).filter(Boolean))];
    const clients = clientIds.length ? await Cliente.findAll({ where: { id: clientIds }, attributes: ['id','nombre'], raw: true }) : [];
    const clientMap = Object.fromEntries(clients.map(c => [c.id, c.nombre]));
    const data = ventasAll.map(v => ({ ...v, cliente_nombre: clientMap[v.cliente_id] || null }));

    const porEstado = {};
    const porProducto = {};
    data.forEach(v => {
      if (!porEstado[v.estado_pago]) porEstado[v.estado_pago] = { estado_pago: v.estado_pago, cantidad: 0, total: 0 };
      porEstado[v.estado_pago].cantidad++; porEstado[v.estado_pago].total += v.total;
      if (!porProducto[v.producto]) porProducto[v.producto] = { producto: v.producto, cantidad: 0, total: 0 };
      porProducto[v.producto].cantidad++; porProducto[v.producto].total += v.total;
    });

    res.json({ data, porEstado: Object.values(porEstado), porProducto: Object.values(porProducto),
      totales: { n: data.length, total: data.reduce((s,v) => s+v.total, 0) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/gastos', requireAuth, async (req, res) => {
  const { desde, hasta } = req.query;
  const where = buildDateWhere(desde, hasta);
  try {
    const gastosAll = await Gasto.findAll({ where, order: [['fecha','DESC']], raw: true });
    const catIds = [...new Set(gastosAll.map(g => g.categoria_id).filter(Boolean))];
    const cats = catIds.length ? await CategoriaGasto.findAll({ where: { id: catIds }, raw: true }) : [];
    const catMap = Object.fromEntries(cats.map(c => [c.id, c.nombre]));
    const data = gastosAll.map(g => ({ ...g, categoria_nombre: catMap[g.categoria_id] || null }));

    const porCat = {};
    data.forEach(g => {
      const cat = g.categoria_nombre || 'Sin categoría';
      if (!porCat[cat]) porCat[cat] = { categoria: cat, cantidad: 0, total: 0 };
      porCat[cat].cantidad++; porCat[cat].total += g.valor;
    });

    res.json({ data, porCategoria: Object.values(porCat),
      totales: { n: data.length, total: data.reduce((s,g) => s+g.valor, 0) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/ganancias', requireAuth, async (req, res) => {
  const { desde, hasta } = req.query;
  const where = buildDateWhere(desde, hasta);
  try {
    const [ventasAll, gastosAll, comprasAll] = await Promise.all([
      Venta.findAll({ where, raw: true }),
      Gasto.findAll({ where, raw: true }),
      Compra.findAll({ where: buildDateWhere(desde, hasta), raw: true })
    ]);
    const ventas = ventasAll.reduce((s,v) => s+v.total, 0);
    const gastos = gastosAll.reduce((s,g) => s+g.valor, 0);
    const compras = comprasAll.reduce((s,c) => s+c.total, 0);
    const ganancia = ventas - gastos - compras;

    // Monthly breakdown
    const mesesVentas = {}, mesesGastos = {};
    ventasAll.forEach(v => { const m = v.fecha.substring(0,7); mesesVentas[m] = (mesesVentas[m]||0)+v.total; });
    gastosAll.forEach(g => { const m = g.fecha.substring(0,7); mesesGastos[m] = (mesesGastos[m]||0)+g.valor; });
    const allMeses = [...new Set([...Object.keys(mesesVentas), ...Object.keys(mesesGastos)])].sort();
    const mensual = allMeses.flatMap(m => [
      { mes: m, ventas: mesesVentas[m]||0, gastos: 0 },
      { mes: m, ventas: 0, gastos: mesesGastos[m]||0 }
    ]);

    res.json({ ventas, gastos, compras, ganancia, mensual });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

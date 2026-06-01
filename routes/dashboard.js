const express = require('express');
const router = express.Router();
const { sequelize, Op, Produccion, Venta, Compra, Gasto, Inventario, CategoriaInventario, Cliente } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const weekNum = getWeekNumber(now);
    const year = now.getFullYear();
    const monthStart = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Production this week
    const prodRows = await Produccion.findAll({ where: { semana: weekNum, anio: year }, raw: true });
    const produccionSemana = {
      cajas: prodRows.reduce((s, r) => s + (r.cajas || 0), 0),
      bolsas: prodRows.reduce((s, r) => s + (r.bolsas || 0), 0)
    };

    // Sales this week – using subquery for week
    const ventasSemanaRows = await Venta.findAll({ where: { fecha: { [Op.gte]: getMondayISO(now) } }, raw: true });
    const ventasSemana = {
      total: ventasSemanaRows.reduce((s, v) => s + v.total, 0),
      cantidad: ventasSemanaRows.length
    };

    // Expenses this month
    const gastosRows = await Gasto.findAll({ where: { fecha: { [Op.gte]: monthStart } }, raw: true });
    const gastosMes = gastosRows.reduce((s, g) => s + g.valor, 0);

    // Month totals for net
    const ventasMesRows = await Venta.findAll({ where: { fecha: { [Op.gte]: monthStart } }, raw: true });
    const ventasMes = ventasMesRows.reduce((s, v) => s + v.total, 0);
    const comprasMesRows = await Compra.findAll({ where: { fecha: { [Op.gte]: monthStart } }, raw: true });
    const comprasMes = comprasMesRows.reduce((s, c) => s + c.total, 0);
    const gananciasMes = ventasMes - gastosMes - comprasMes;

    // Low stock
    const lowStock = await sequelize.query(`
      SELECT i.nombre, i.cantidad, i.unidad_medida, i.stock_minimo, c.nombre as categoria
      FROM inventario i LEFT JOIN categorias_inventario c ON i.categoria_id = c.id
      WHERE i.activo = 1 AND i.cantidad <= i.stock_minimo
      ORDER BY (i.cantidad - i.stock_minimo) ASC LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    // Charts - last 6 months
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsStr = sixMonthsAgo.toISOString().split('T')[0];

    const prodMensual = await sequelize.query(`
      SELECT substr(fecha,1,7) as mes, SUM(cajas) as cajas, SUM(bolsas) as bolsas
      FROM produccion WHERE fecha >= '${sixMonthsStr}'
      GROUP BY mes ORDER BY mes ASC
    `, { type: sequelize.QueryTypes.SELECT });

    const ventasMensual = await sequelize.query(`
      SELECT substr(fecha,1,7) as mes, SUM(total) as total
      FROM ventas WHERE fecha >= '${sixMonthsStr}'
      GROUP BY mes ORDER BY mes ASC
    `, { type: sequelize.QueryTypes.SELECT });

    const gastosMensual = await sequelize.query(`
      SELECT substr(fecha,1,7) as mes, SUM(valor) as total
      FROM gastos WHERE fecha >= '${sixMonthsStr}'
      GROUP BY mes ORDER BY mes ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Recent sales
    const ventasRecientes = await sequelize.query(`
      SELECT v.*, c.nombre as cliente_nombre
      FROM ventas v LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.created_at DESC LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ produccionSemana, ventasSemana, gastosMes, gananciasMes, lowStock,
      charts: { prodMensual, ventasMensual, gastosMensual }, ventasRecientes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getMondayISO(d) {
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  return monday.toISOString().split('T')[0];
}

module.exports = router;

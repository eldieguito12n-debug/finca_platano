const express = require('express');
const router = express.Router();
const { sequelize, Op, Venta, Cliente } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { desde, hasta, cliente_id, estado_pago, limit = 50, offset = 0 } = req.query;
  const where = {};
  if (desde || hasta) { where.fecha = {}; if (desde) where.fecha[Op.gte] = desde; if (hasta) where.fecha[Op.lte] = hasta; }
  if (cliente_id) where.cliente_id = cliente_id;
  if (estado_pago) where.estado_pago = estado_pago;

  const rows = await Venta.findAll({ where, order: [['fecha','DESC'],['created_at','DESC']], limit: parseInt(limit), offset: parseInt(offset), raw: true });
  const clientIds = [...new Set(rows.map(r => r.cliente_id).filter(Boolean))];
  const clients = clientIds.length ? await Cliente.findAll({ where: { id: clientIds }, attributes: ['id','nombre'], raw: true }) : [];
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.nombre]));
  const data = rows.map(r => ({ ...r, cliente_nombre: clientMap[r.cliente_id] || null }));
  res.json({ data, total: data.length });
});

router.get('/:id', requireAuth, async (req, res) => {
  const row = await Venta.findByPk(req.params.id, { raw: true });
  if (!row) return res.status(404).json({ error: 'Venta no encontrada.' });
  const client = row.cliente_id ? await Cliente.findByPk(row.cliente_id, { raw: true }) : null;
  res.json({ ...row, cliente_nombre: client?.nombre || null });
});

router.post('/', requireAuth, async (req, res) => {
  const { cliente_id, fecha, producto, cantidad, precio_unitario, estado_pago, observaciones } = req.body;
  if (!fecha || !producto || !cantidad || !precio_unitario) return res.status(400).json({ error: 'Fecha, producto, cantidad y precio requeridos.' });
  const total = parseFloat(cantidad) * parseFloat(precio_unitario);
  try {
    const row = await Venta.create({ cliente_id: cliente_id || null, fecha, producto, cantidad, precio_unitario, total, estado_pago: estado_pago || 'pendiente', observaciones: observaciones || '', usuario_id: req.session.userId });
    res.json({ success: true, id: row.id, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { cliente_id, fecha, producto, cantidad, precio_unitario, estado_pago, observaciones } = req.body;
  const total = parseFloat(cantidad) * parseFloat(precio_unitario);
  try {
    await Venta.update({ cliente_id: cliente_id || null, fecha, producto, cantidad, precio_unitario, total, estado_pago, observaciones: observaciones || '' }, { where: { id: req.params.id } });
    res.json({ success: true, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  await Venta.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;

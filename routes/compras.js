const express = require('express');
const router = express.Router();
const { sequelize, Op, Compra, Inventario } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { desde, hasta, limit = 50, offset = 0 } = req.query;
  const where = {};
  if (desde || hasta) { where.fecha = {}; if (desde) where.fecha[Op.gte] = desde; if (hasta) where.fecha[Op.lte] = hasta; }
  const rows = await Compra.findAll({ where, order: [['fecha','DESC'],['created_at','DESC']], limit: parseInt(limit), offset: parseInt(offset), raw: true });
  const invIds = [...new Set(rows.map(r => r.inventario_id))];
  const invItems = invIds.length ? await Inventario.findAll({ where: { id: invIds }, attributes: ['id','nombre','unidad_medida'], raw: true }) : [];
  const invMap = Object.fromEntries(invItems.map(i => [i.id, i]));
  const data = rows.map(r => ({ ...r, insumo_nombre: invMap[r.inventario_id]?.nombre || '—', unidad_medida: invMap[r.inventario_id]?.unidad_medida || '' }));
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const { inventario_id, cantidad, precio_unitario, fecha, proveedor, observaciones } = req.body;
  if (!inventario_id || !cantidad || !precio_unitario || !fecha) return res.status(400).json({ error: 'Insumo, cantidad, precio y fecha requeridos.' });
  const total = parseFloat(cantidad) * parseFloat(precio_unitario);
  try {
    await sequelize.transaction(async (t) => {
      await Compra.create({ inventario_id, cantidad: parseFloat(cantidad), precio_unitario: parseFloat(precio_unitario), total, fecha, proveedor: proveedor || '', observaciones: observaciones || '', usuario_id: req.session.userId }, { transaction: t });
      const inv = await Inventario.findByPk(inventario_id, { transaction: t });
      await inv.update({ cantidad: inv.cantidad + parseFloat(cantidad) }, { transaction: t });
    });
    const updated = await Inventario.findByPk(inventario_id, { raw: true });
    res.json({ success: true, total, nuevaCantidad: updated.cantidad });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  const compra = await Compra.findByPk(req.params.id, { raw: true });
  if (!compra) return res.status(404).json({ error: 'Compra no encontrada.' });
  try {
    await sequelize.transaction(async (t) => {
      await Compra.destroy({ where: { id: req.params.id }, transaction: t });
      const inv = await Inventario.findByPk(compra.inventario_id, { transaction: t });
      if (inv) await inv.update({ cantidad: Math.max(0, inv.cantidad - compra.cantidad) }, { transaction: t });
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

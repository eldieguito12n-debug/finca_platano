const express = require('express');
const router = express.Router();
const { sequelize, Op, Aplicacion, Inventario, Usuario } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { desde, hasta, limit = 50, offset = 0 } = req.query;
  const where = {};
  if (desde || hasta) { where.fecha = {}; if (desde) where.fecha[Op.gte] = desde; if (hasta) where.fecha[Op.lte] = hasta; }
  const rows = await Aplicacion.findAll({ where, order: [['fecha','DESC'],['created_at','DESC']], limit: parseInt(limit), offset: parseInt(offset), raw: true });
  const invIds = [...new Set(rows.map(r => r.inventario_id))];
  const userIds = [...new Set(rows.map(r => r.usuario_id).filter(Boolean))];
  const [invItems, users] = await Promise.all([
    invIds.length ? Inventario.findAll({ where: { id: invIds }, attributes: ['id','nombre','unidad_medida'], raw: true }) : [],
    userIds.length ? Usuario.findAll({ where: { id: userIds }, attributes: ['id','nombre'], raw: true }) : []
  ]);
  const invMap = Object.fromEntries(invItems.map(i => [i.id, i]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
  const data = rows.map(r => ({ ...r, insumo_nombre: invMap[r.inventario_id]?.nombre || '—', unidad_medida: invMap[r.inventario_id]?.unidad_medida || '', usuario_nombre: userMap[r.usuario_id] || null }));
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const { inventario_id, cantidad, fecha, responsable, observaciones } = req.body;
  if (!inventario_id || !cantidad || !fecha || !responsable) return res.status(400).json({ error: 'Insumo, cantidad, fecha y responsable requeridos.' });
  const inv = await Inventario.findByPk(inventario_id);
  if (!inv) return res.status(404).json({ error: 'Insumo no encontrado.' });
  if (inv.cantidad < parseFloat(cantidad)) return res.status(400).json({ error: `Stock insuficiente. Disponible: ${inv.cantidad}` });
  try {
    await sequelize.transaction(async (t) => {
      await Aplicacion.create({ inventario_id, cantidad: parseFloat(cantidad), fecha, responsable, observaciones: observaciones || '', usuario_id: req.session.userId }, { transaction: t });
      await inv.update({ cantidad: inv.cantidad - parseFloat(cantidad) }, { transaction: t });
    });
    const updated = await Inventario.findByPk(inventario_id, { raw: true });
    res.json({ success: true, nuevaCantidad: updated.cantidad });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  const apl = await Aplicacion.findByPk(req.params.id, { raw: true });
  if (!apl) return res.status(404).json({ error: 'Aplicación no encontrada.' });
  try {
    await sequelize.transaction(async (t) => {
      await Aplicacion.destroy({ where: { id: req.params.id }, transaction: t });
      const inv = await Inventario.findByPk(apl.inventario_id, { transaction: t });
      if (inv) await inv.update({ cantidad: inv.cantidad + apl.cantidad }, { transaction: t });
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { sequelize, Op, Produccion, Usuario } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { semana, anio, desde, hasta, limit = 50, offset = 0 } = req.query;
  const where = {};
  if (semana) where.semana = semana;
  if (anio) where.anio = anio;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = desde;
    if (hasta) where.fecha[Op.lte] = hasta;
  }
  const rows = await Produccion.findAll({ where, order: [['fecha','DESC']], limit: parseInt(limit), offset: parseInt(offset), raw: true });
  // Get user names
  const userIds = [...new Set(rows.map(r => r.usuario_id).filter(Boolean))];
  const users = userIds.length ? await Usuario.findAll({ where: { id: userIds }, attributes: ['id','nombre'], raw: true }) : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
  const data = rows.map(r => ({ ...r, usuario_nombre: userMap[r.usuario_id] || null }));
  res.json({ data, total: data.length });
});

router.get('/:id', requireAuth, async (req, res) => {
  const row = await Produccion.findByPk(req.params.id, { raw: true });
  if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });
  res.json(row);
});

router.post('/', requireAuth, async (req, res) => {
  const { fecha, semana, anio, cajas, bolsas, observaciones } = req.body;
  if (!fecha || semana === undefined || anio === undefined) return res.status(400).json({ error: 'Fecha, semana y año requeridos.' });
  try {
    const row = await Produccion.create({ fecha, semana, anio, cajas: cajas || 0, bolsas: bolsas || 0, observaciones: observaciones || '', usuario_id: req.session.userId });
    res.json({ success: true, id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { fecha, semana, anio, cajas, bolsas, observaciones } = req.body;
  try {
    await Produccion.update({ fecha, semana, anio, cajas: cajas || 0, bolsas: bolsas || 0, observaciones: observaciones || '' }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  await Produccion.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;

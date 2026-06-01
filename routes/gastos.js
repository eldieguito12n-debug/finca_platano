const express = require('express');
const router = express.Router();
const { Op, Gasto, CategoriaGasto, Usuario } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/categorias', requireAuth, async (req, res) => {
  const cats = await CategoriaGasto.findAll({ order: [['nombre','ASC']], raw: true });
  res.json(cats);
});

router.get('/', requireAuth, async (req, res) => {
  const { desde, hasta, categoria_id, limit = 50, offset = 0 } = req.query;
  const where = {};
  if (desde || hasta) { where.fecha = {}; if (desde) where.fecha[Op.gte] = desde; if (hasta) where.fecha[Op.lte] = hasta; }
  if (categoria_id) where.categoria_id = categoria_id;
  const rows = await Gasto.findAll({ where, order: [['fecha','DESC'],['created_at','DESC']], limit: parseInt(limit), offset: parseInt(offset), raw: true });
  const catIds = [...new Set(rows.map(r => r.categoria_id).filter(Boolean))];
  const userIds = [...new Set(rows.map(r => r.usuario_id).filter(Boolean))];
  const [cats, users] = await Promise.all([
    catIds.length ? CategoriaGasto.findAll({ where: { id: catIds }, raw: true }) : [],
    userIds.length ? Usuario.findAll({ where: { id: userIds }, attributes: ['id','nombre'], raw: true }) : []
  ]);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.nombre]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
  const data = rows.map(r => ({ ...r, categoria_nombre: catMap[r.categoria_id] || null, usuario_nombre: userMap[r.usuario_id] || null }));
  const suma = data.reduce((s, g) => s + g.valor, 0);
  res.json({ data, suma });
});

router.post('/', requireAuth, async (req, res) => {
  const { categoria_id, descripcion, valor, fecha } = req.body;
  if (!descripcion || !valor || !fecha) return res.status(400).json({ error: 'Descripción, valor y fecha requeridos.' });
  try {
    const row = await Gasto.create({ categoria_id: categoria_id || null, descripcion: descripcion.trim(), valor: parseFloat(valor), fecha, usuario_id: req.session.userId });
    res.json({ success: true, id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { categoria_id, descripcion, valor, fecha } = req.body;
  try {
    await Gasto.update({ categoria_id: categoria_id || null, descripcion, valor: parseFloat(valor), fecha }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  await Gasto.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;

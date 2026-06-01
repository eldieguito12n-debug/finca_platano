const express = require('express');
const router = express.Router();
const { Op, Inventario, CategoriaInventario } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/categorias', requireAuth, async (req, res) => {
  const cats = await CategoriaInventario.findAll({ order: [['nombre','ASC']], raw: true });
  res.json(cats);
});

router.get('/', requireAuth, async (req, res) => {
  const { categoria_id, low_stock, search } = req.query;
  const where = { activo: 1 };
  if (categoria_id) where.categoria_id = categoria_id;
  if (search) where.nombre = { [Op.like]: `%${search}%` };

  let rows = await Inventario.findAll({ where, order: [['nombre','ASC']], raw: true });
  if (low_stock === '1') rows = rows.filter(r => r.cantidad <= r.stock_minimo);

  const catIds = [...new Set(rows.map(r => r.categoria_id).filter(Boolean))];
  const cats = catIds.length ? await CategoriaInventario.findAll({ where: { id: catIds }, raw: true }) : [];
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.nombre]));
  const data = rows.map(r => ({ ...r, categoria_nombre: catMap[r.categoria_id] || null }));
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  const row = await Inventario.findByPk(req.params.id, { raw: true });
  if (!row) return res.status(404).json({ error: 'Insumo no encontrado.' });
  const cat = row.categoria_id ? await CategoriaInventario.findByPk(row.categoria_id, { raw: true }) : null;
  res.json({ ...row, categoria_nombre: cat?.nombre || null });
});

router.post('/', requireAuth, async (req, res) => {
  const { nombre, categoria_id, cantidad, unidad_medida, stock_minimo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido.' });
  try {
    const row = await Inventario.create({ nombre: nombre.trim(), categoria_id: categoria_id || null, cantidad: parseFloat(cantidad) || 0, unidad_medida: unidad_medida || 'unidad', stock_minimo: parseFloat(stock_minimo) || 0 });
    res.json({ success: true, id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { nombre, categoria_id, cantidad, unidad_medida, stock_minimo, activo } = req.body;
  try {
    await Inventario.update({ nombre, categoria_id: categoria_id || null, cantidad: parseFloat(cantidad) || 0, unidad_medida, stock_minimo: parseFloat(stock_minimo) || 0, activo: activo !== undefined ? (activo ? 1 : 0) : 1 }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  await Inventario.update({ activo: 0 }, { where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;

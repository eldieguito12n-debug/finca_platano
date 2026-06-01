const express = require('express');
const router = express.Router();
const { Op, Cliente, Venta } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const { search } = req.query;
  const where = { activo: 1 };
  if (search) where[Op.or] = [{ nombre: { [Op.like]: `%${search}%` } }, { telefono: { [Op.like]: `%${search}%` } }];
  const rows = await Cliente.findAll({ where, order: [['nombre','ASC']], raw: true });
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const cliente = await Cliente.findByPk(req.params.id, { raw: true });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  const compras = await Venta.findAll({ where: { cliente_id: req.params.id }, order: [['fecha','DESC']], limit: 20, raw: true });
  const allCompras = await Venta.findAll({ where: { cliente_id: req.params.id }, raw: true });
  const stats = { total_compras: allCompras.length, total_gastado: allCompras.reduce((s,c) => s + c.total, 0) };
  res.json({ ...cliente, compras, stats });
});

router.post('/', requireAuth, async (req, res) => {
  const { nombre, telefono, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido.' });
  try {
    const row = await Cliente.create({ nombre: nombre.trim(), telefono: telefono || '', direccion: direccion || '' });
    res.json({ success: true, id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { nombre, telefono, direccion, activo } = req.body;
  try {
    await Cliente.update({ nombre, telefono: telefono || '', direccion: direccion || '', activo: activo !== undefined ? (activo ? 1 : 0) : 1 }, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar.' });
  await Cliente.update({ activo: 0 }, { where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;

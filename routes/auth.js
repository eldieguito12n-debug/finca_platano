const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Usuario } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  try {
    const user = await Usuario.findOne({ where: { username: username.trim(), activo: 1 } });
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.nombre = user.nombre;
    req.session.rol = user.rol;
    res.json({ success: true, user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.session.userId, username: req.session.username, nombre: req.session.nombre, rol: req.session.rol });
});

router.get('/usuarios', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  const users = await Usuario.findAll({ attributes: ['id','username','nombre','rol','activo','created_at'], order: [['nombre','ASC']] });
  res.json(users);
});

router.post('/usuarios', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  const { username, password, nombre, rol } = req.body;
  if (!username || !password || !nombre || !rol) return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  try {
    const user = await Usuario.create({ username: username.trim(), password_hash: bcrypt.hashSync(password, 10), nombre: nombre.trim(), rol });
    res.json({ success: true, id: user.id });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/usuarios/:id', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
  const { nombre, rol, activo, password } = req.body;
  try {
    const updates = { nombre, rol, activo: activo ? 1 : 0 };
    if (password) updates.password_hash = bcrypt.hashSync(password, 10);
    await Usuario.update(updates, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

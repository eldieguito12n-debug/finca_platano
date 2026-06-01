const express = require('express');
const router = express.Router();
const { Configuracion } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/configuracion – devuelve todas las claves como objeto plano
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await Configuracion.findAll({ raw: true });
    const config = Object.fromEntries(rows.map(r => [r.clave, r.valor]));
    res.json(config);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/configuracion – guarda varias claves en una sola llamada
router.put('/', requireAuth, async (req, res) => {
  if (req.session.rol !== 'admin') return res.status(403).json({ error: 'Solo el administrador puede cambiar la configuración.' });
  try {
    const entries = Object.entries(req.body);
    for (const [clave, valor] of entries) {
      await Configuracion.upsert({ clave, valor: valor ?? '' });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

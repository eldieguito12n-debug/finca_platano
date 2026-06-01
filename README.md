# 🍌 Sistema de Administración – Finca de Plátano

Aplicación web completa para gestionar todos los aspectos operativos de una finca productora de plátano.

## 🚀 Cómo iniciar

### Opción 1 – Doble clic (más fácil)
```
Haga doble clic en el archivo: start.bat
```

### Opción 2 – Manual
```bash
npm install        # Solo la primera vez
node server.js     # Iniciar servidor
```

Luego abra el navegador en: **http://localhost:3000**

---

## 📱 Acceso desde otros dispositivos (celular/tablet)

1. Asegúrese de que el celular esté en la **misma red WiFi** que el computador
2. El sistema mostrará la dirección IP al iniciar, por ejemplo:
   ```
   🌐 Red WiFi: http://192.168.1.5:3000
   ```
3. Escriba esa dirección en el navegador del celular

---

## 🔑 Usuarios iniciales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `empleado` | `empleado123` | Empleado |

> ⚠️ **Cambie las contraseñas** después del primer inicio de sesión desde Usuarios > Editar.

---

## 📋 Módulos incluidos

| Módulo | Descripción |
|--------|-------------|
| 🏠 Dashboard | KPIs, gráficas de producción y ventas |
| 📦 Producción | Registro semanal de cajas y bolsas |
| 💰 Ventas | Ventas con estado de pago y totales |
| 👥 Clientes | CRUD + historial de compras |
| 🏪 Inventario | Stock por categorías con alertas |
| 🛒 Compras | Ingreso de insumos (auto-incrementa stock) |
| 🌱 Aplicaciones | Uso de insumos (auto-descuenta stock) |
| 💸 Gastos | Por categorías con resúmenes |
| 📊 Reportes | Excel + PDF + gráficas |
| ⚙️ Usuarios | Solo administradores |

---

## 🗄️ Base de datos

- Usa **SQLite** (sin instalación adicional)
- El archivo de datos es: `database/finca.db`
- **Haga copias de seguridad** de este archivo regularmente

---

## 💻 Requisitos

- **Node.js** versión 18 o superior
  - Descarga: https://nodejs.org (versión LTS)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

---

## 📂 Estructura de archivos

```
sofware_finca_platano/
├── server.js          # Servidor web
├── start.bat          # Iniciar en Windows
├── database/
│   └── finca.db       # Base de datos (se crea automáticamente)
├── routes/            # API endpoints
├── middleware/        # Autenticación
└── public/            # Archivos web (HTML, CSS, JS)
```

---

## 🔒 Seguridad

- Las contraseñas se almacenan cifradas (bcrypt)
- Las sesiones expiran después de 8 horas
- El empleado no puede eliminar registros (solo el administrador)

const { Client, Databases, ID } = require('node-appwrite');

const API_KEY = 'standard_65dd59bd7babc90b3ab6e10841e95f4fb7205337a93756be796da1773c226d3df0350af64dc374a2150f3996e32b830617abc723ed67d920cc38aee6c37b1b431160ae6ab5b22d35782533ef6e68854384bfb8e67fa0113a5604af84a4d59b96bb25f298ed3a9ca5ca73acbe9d02334ba9e9cf33142335ff8c7d1b4a3d9829fa';
const PROJECT_ID = 'finca-platano';
const DB_ID = 'finca_db';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function setup() {
    console.log('🚀 Iniciando configuración de Appwrite...');

    try {
        // 1. Crear Base de Datos
        try {
            await databases.create(DB_ID, 'Finca DB');
            console.log('✅ Base de datos creada');
        } catch (e) { console.log('ℹ️ La base de datos ya existe'); }

        const collections = [
            { id: 'produccion', name: 'Producción', attrs: [
                { key: 'fecha', type: 'string', size: 20, req: true },
                { key: 'semana', type: 'integer', req: true },
                { key: 'anio', type: 'integer', req: true },
                { key: 'cajas', type: 'integer', req: false, default: 0 },
                { key: 'bolsas', type: 'integer', req: false, default: 0 },
                { key: 'observaciones', type: 'string', size: 1000, req: false }
            ]},
            { id: 'ventas', name: 'Ventas', attrs: [
                { key: 'cliente_id', type: 'string', size: 50, req: false },
                { key: 'fecha', type: 'string', size: 20, req: true },
                { key: 'producto', type: 'string', size: 100, req: true },
                { key: 'cantidad', type: 'float', req: true },
                { key: 'precio_unitario', type: 'float', req: true },
                { key: 'total', type: 'float', req: true },
                { key: 'estado_pago', type: 'string', size: 20, req: false, default: 'pendiente' },
                { key: 'observaciones', type: 'string', size: 1000, req: false }
            ]},
            { id: 'clientes', name: 'Clientes', attrs: [
                { key: 'nombre', type: 'string', size: 255, req: true },
                { key: 'telefono', type: 'string', size: 50, req: false },
                { key: 'direccion', type: 'string', size: 500, req: false },
                { key: 'activo', type: 'integer', req: false, default: 1 }
            ]},
            { id: 'inventario', name: 'Inventario', attrs: [
                { key: 'nombre', type: 'string', size: 255, req: true },
                { key: 'unidad_medida', type: 'string', size: 50, req: true },
                { key: 'categoria_id', type: 'string', size: 50, req: false },
                { key: 'cantidad', type: 'float', req: false, default: 0 },
                { key: 'stock_minimo', type: 'float', req: false, default: 0 },
                { key: 'activo', type: 'integer', req: false, default: 1 }
            ]},
            { id: 'gastos', name: 'Gastos', attrs: [
                { key: 'categoria_id', type: 'string', size: 50, req: false },
                { key: 'descripcion', type: 'string', size: 500, req: true },
                { key: 'valor', type: 'float', req: true },
                { key: 'fecha', type: 'string', size: 20, req: true }
            ]},
            { id: 'configuracion', name: 'Configuración', attrs: [
                { key: 'clave', type: 'string', size: 100, req: true },
                { key: 'valor', type: 'string', size: 2000, req: false }
            ]}
        ];

        for (const col of collections) {
            try {
                await databases.createCollection(DB_ID, col.id, col.name, ["read('any')", "create('any')", "update('any')", "delete('any')"]);
                console.log(`✅ Colección ${col.name} creada`);
                
                for (const attr of col.attrs) {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(DB_ID, col.id, attr.key, attr.size, attr.req, attr.default);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(DB_ID, col.id, attr.key, attr.req, 0, 1000000, attr.default);
                    } else if (attr.type === 'float') {
                        await databases.createFloatAttribute(DB_ID, col.id, attr.key, attr.req, -1000000, 1000000000, attr.default);
                    }
                    console.log(`   - Atributo ${attr.key} creado`);
                }
            } catch (e) {
                console.log(`ℹ️ La colección ${col.name} ya existe o tuvo un error`);
            }
        }

        console.log('\n✨ ¡CONFIGURACIÓN COMPLETADA CON ÉXITO! ✨');
        console.log('Ya puedes usar tu aplicación en la nube.');

    } catch (error) {
        console.error('❌ Error fatal:', error);
    }
}

setup();

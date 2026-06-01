/* ═══════════════════════════
   APPWRITE CONFIGURATION
═══════════════════════════ */

const { Client, Account, Databases, Query, ID } = Appwrite;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('finca-platano');

const account = new Account(client);
const databases = new Databases(client);

// IDs de las colecciones en Appwrite Cloud
const DB_ID = 'finca_db';
const COLL_PRODUCCION = 'produccion';
const COLL_VENTAS = 'ventas';
const COLL_CLIENTES = 'clientes';
const COLL_INVENTARIO = 'inventario';
const COLL_GASTOS = 'gastos';
const COLL_CONFIG = 'configuracion';

window.AppwriteService = {
    client, account, databases, Query, ID,
    DB_ID, COLL_PRODUCCION, COLL_VENTAS, COLL_CLIENTES, 
    COLL_INVENTARIO, COLL_GASTOS, COLL_CONFIG
};
# @openfactu/sdk

SDK oficial para integrar **aplicaciones externas** (React, Node, workers, integraciones server-to-server) con un ERP [OpenFactu](https://github.com/OpenFactu/OpenFactu) por HTTP REST.

> **¿Desarrollas un plugin que corre _dentro_ del servidor?** Este no es tu paquete — usa [`@openfactu/plugin-sdk`](https://github.com/OpenFactu/plugin-sdk), que te da `FactuApi.transaction()` y acceso directo a Drizzle.

## Diferencia clave

| Paquete | Caso de uso | Transporte | Auth |
|---|---|---|---|
| `@openfactu/sdk` | Apps externas | HTTP REST | Token de API (`tk_`) |
| `@openfactu/plugin-sdk` | Plugins en el servidor | En proceso | Contexto del plugin |

## Instalación

```bash
npm install @openfactu/sdk
```

## Autenticación

Las operaciones de integración usan un **token de API**, no la contraseña ni el JWT de un usuario. Se genera desde el ERP:

**Configuración → Tokens de API → Crear token.** Elige un nombre y los *scopes* necesarios. El token (`tk_...`) se muestra **una sola vez** — guárdalo; si lo pierdes, revócalo y crea otro.

### Scopes

| Scope | Concede |
|---|---|
| `write:ventas` | Crear/asentar/cancelar facturas, pedidos y albaranes de **venta** (SINV/SO/SDN) |
| `write:compras` | Crear/asentar/cancelar facturas, pedidos y albaranes de **compra** (PINV/PO/PDN) |
| `read:maestros` | Leer clientes/proveedores y artículos (stock, lotes, unidades) |
| `write:maestros` | Crear/editar/borrar clientes/proveedores y artículos |
| `read:logistics` / `write:logistics` | API de logística |
| `*` | Todos los scopes |

`write:x` implica `read:x`. Un token solo tiene los scopes que marcaste al crearlo: si intentas una operación fuera de su alcance, el servidor responde **403** y el SDK lanza un `OpenFactuError` con `statusCode: 403`.

## Inicio rápido

```typescript
import { OpenFactuClient } from '@openfactu/sdk';

const client = new OpenFactuClient({
  baseUrl: 'https://mi-erp.example.com',
  token: 'tk_...',        // token de API (Configuración → Tokens de API)
  tenantId: 'abc-123',    // id de la empresa
});

// Crear una factura de venta en borrador (requiere scope write:ventas)
const invoice = await client.documents.create('SINV', {
  partnerId: 'partner-1',
  seriesId: 'series-1',
  periodId: 'period-1',
  lines: [
    { itemId: 'item-1', quantity: 2, price: 50, taxGroupId: 'tg-iva21' },
  ],
  customFields: { p_shipping_notes: 'Frágil' },
});

// Asentar el borrador (D → O)
await client.documents.post('SINV', invoice.id);
```

## Documentos

```typescript
// Crear (SINV, PINV, SO, PO, SDN, PDN)
const doc = await client.documents.create('SO', { partnerId, seriesId, periodId, lines });

// Asentar borrador — solo facturas
await client.documents.post('SINV', doc.id);

// Cancelar
await client.documents.cancel('SINV', doc.id);

// Leer / listar (endpoints nativos)
const detail = await client.documents.get('SINV', doc.id);
const all = await client.documents.list('SINV');
```

`documents.create/post/cancel` requieren `write:ventas` (SINV/SO/SDN) o `write:compras` (PINV/PO/PDN).

## Clientes y proveedores

```typescript
const partners = await client.partners.list();            // read:maestros
const partner = await client.partners.get('partner-1');   // read:maestros

const nuevo = await client.partners.create({              // write:maestros
  name: 'ACME S.L.',
  nif: 'B12345678',
  email: 'compras@acme.example',
});

await client.partners.update(nuevo.id, { phone: '+34600000000' });
await client.partners.delete(nuevo.id);
```

## Artículos

```typescript
const items = await client.items.list();                  // read:maestros
const stock = await client.items.getStock('item-1');      // read:maestros
const batches = await client.items.getBatches('item-1');  // read:maestros

const art = await client.items.create({                   // write:maestros
  name: 'Tornillo M6',
  uomId: 'uom-ud',
  basePrice: 0.12,
  manageBy: 'N',
});

// Unidades de medida alternativas
await client.items.addUom(art.id, { uomId: 'uom-caja', factor: 100 });
```

Los campos personalizados (`p_*`) se pasan y se leen como propiedades normales del objeto.

## Manejo de errores

Toda respuesta no-2xx lanza un `OpenFactuError`:

```typescript
import { OpenFactuError } from '@openfactu/sdk';

try {
  await client.documents.create('SINV', params);
} catch (err) {
  if (err instanceof OpenFactuError) {
    console.error(err.statusCode); // 400, 401, 403, 404, 500...
    console.error(err.message);    // mensaje del servidor
    console.error(err.path);       // endpoint que falló
    console.error(err.response);   // body crudo
  }
}
```

- **401** — falta el token o no es válido/está revocado.
- **403** — el token no tiene el scope requerido.

## Cambiar de empresa o token

Ambos métodos devuelven un cliente nuevo (inmutable):

```typescript
const otraEmpresa = client.withTenant('otro-tenant-id');
const otroToken = client.withToken('tk_otro...');
```

## Configuración

```typescript
new OpenFactuClient({
  baseUrl: string;    // URL del servidor
  token: string;      // token de API tk_ (recomendado) o JWT de usuario
  tenantId: string;   // id de la empresa
  timeout?: number;   // ms, default 30000
});
```

## Links

- [OpenFactu](https://github.com/OpenFactu/OpenFactu)
- [plugin-sdk](https://github.com/OpenFactu/plugin-sdk) — para plugins internos

## Licencia

MIT — Copyright (c) 2026 Keirost

# @openfactu/sdk

Cliente REST oficial para integración con **OpenFactu ERP** desde aplicaciones externas.

> **¿Desarrollas plugins?** Este no es tu paquete. Usa [`@openfactu/plugin-sdk`](https://github.com/OpenFactu/plugin-sdk) para acceso a FactuApi, transacciones atómicas y la base de datos directa.

## Diferencia clave

| Paquete | Caso de uso | Transacciones | DB directa |
|---|---|---|---|
| `@openfactu/sdk` | Apps externas (React, Node, etc.) | ❌ HTTP REST | ❌ |
| `@openfactu/plugin-sdk` | Plugins dentro del servidor | ✅ `FactuApi.transaction()` | ✅ Drizzle |

## Instalación

```bash
npm install @openfactu/sdk
```

## Configuración

```ts
import { OpenFactuClient } from '@openfactu/sdk';

const client = new OpenFactuClient({
  baseUrl: 'http://localhost:3000',
  token: 'eyJhbGci...',
  tenantId: 'abc-123',
  timeout: 30000,
});
```

## Documentos

### Crear factura

```ts
const invoice = await client.documents.create('SINV', {
  partnerId: '...',
  seriesId: '...',
  periodId: '...',
  lines: [{ itemId: '...', quantity: 2, price: 100, taxGroupId: '...' }],
});
```

### Asentar y cancelar

```ts
await client.documents.post('SINV', invoice.id);
await client.documents.cancel('SINV', invoice.id);
```

### Listar y consultar

```ts
const invoices = await client.documents.list('SINV');
const detail = await client.documents.get('SINV', invoice.id);
```

## Partners

```ts
const partners = await client.partners.list();
const partner = await client.partners.create({ name: 'Acme SL' });
await client.partners.update(partner.id, { email: 'info@acme.com' });
await client.partners.delete(partner.id);
```

## Items

```ts
const items = await client.items.list();
const item = await client.items.create({ name: 'Laptop', uomId: '...', basePrice: 999 });

// Stock, lotes y UOMs
const stock = await client.items.getStock(item.id);
const batches = await client.items.getBatches(item.id);
const uoms = await client.items.getUoms(item.id);
```

## Manejo de errores

```ts
import { OpenFactuError } from '@openfactu/sdk';

try {
  await client.documents.create('SINV', { ... });
} catch (err) {
  if (err instanceof OpenFactuError) {
    console.error(err.statusCode, err.message, err.path);
  }
}
```

## Referencia

| Recurso | Métodos |
|---|---|
| `client.documents` | `create`, `post`, `cancel`, `get`, `list` |
| `client.partners` | `list`, `get`, `create`, `update`, `delete` |
| `client.items` | `list`, `get`, `create`, `update`, `delete`, `getBatches`, `getStock`, `getUoms`, `addUom`, `removeUom` |

## Licencia

MIT — Copyright (c) 2026 Keirost

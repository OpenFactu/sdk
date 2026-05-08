# @openfactu/plugin-sdk

SDK oficial para desarrollar **plugins** de [OpenFactu](https://github.com/OpenFactu/OpenFactu).

> **¿Buscas integrar una app externa?** Este paquete es para plugins que corren **dentro del servidor**. Para apps externas usa [`@openfactu/sdk`](https://github.com/OpenFactu/sdk).

## Diferencia clave

| Paquete | Caso de uso | Transacciones | DB directa |
|---|---|---|---|
| `@openfactu/plugin-sdk` | Plugins dentro del servidor | ✅ `FactuApi.transaction()` | ✅ Drizzle |
| `@openfactu/sdk` | Apps externas (React, Node, etc.) | ❌ HTTP REST | ❌ |

## Instalación

```bash
npm install @openfactu/plugin-sdk
```

## Inicio rápido

```typescript
import type { PluginContext, HookContext } from '@openfactu/plugin-sdk';

const PLUGIN_ID = 'mi-plugin';

export const init = async ({ hooks, migration, documents, app, factuApi }: PluginContext) => {
  // Añadir campo a una tabla
  await migration.addCustomField({
    pluginId: PLUGIN_ID,
    tableName: 'BusinessPartner',
    fieldName: 'loyalty_points',
    type: 'INTEGER',
    label: 'Puntos de fidelidad',
  });

  // Hook antes de crear factura
  documents.onBeforeCreate('SalesInvoice', async (ctx: HookContext) => {
    if (ctx.data.total > 10000) {
      throw new Error('Limite excedido');
    }
  });

  // Ruta API personalizada
  app.get(`/api/plugins/${PLUGIN_ID}/status`, (req, res) => {
    res.json({ status: 'active' });
  });
};
```

## FactuApi — Crear documentos

```typescript
export const init = async ({ app, factuApi }: PluginContext) => {
  app.post('/api/plugins/mi-plugin/factura', async (req, res) => {
    const result = await factuApi.transaction(
      req.tenantId,
      req.tenantClient,
      req.user,
      async (tx) => {
        const invoice = tx.salesInvoice();
        invoice.partnerId = req.body.partnerId;
        invoice.addLine({
          itemId: req.body.itemId,
          quantity: 2,
          price: 100,
          taxGroupId: req.body.taxGroupId,
        });
        return tx.save(invoice);
      }
    );
    res.json(result);
  });
};
```

## Transacciones atómicas

```typescript
await factuApi.transaction(tenantId, db, user, async (tx) => {
  // Crear albarán
  const dn = tx.salesDeliveryNote();
  dn.partnerId = 'bp-001';
  dn.addLine({ itemId: 'item-001', quantity: 5, price: 50, taxGroupId: 'tg-iva21' });
  await tx.save(dn);

  // Crear factura referenciando el albarán
  const inv = tx.salesInvoice();
  inv.partnerId = 'bp-001';
  inv.addLine({
    itemId: 'item-001',
    quantity: 5,
    price: 50,
    taxGroupId: 'tg-iva21',
    baseType: 'SDN',
    baseId: dn.id, // ID pre-asignado
  });
  await tx.save(inv);

  return { dnId: dn.id, invId: inv.id };
});
// Si algo falla, todo se revierte automáticamente
```

## Consultas a maestros

```typescript
const partners = await tx.getPartners();
const items = await tx.getItems();
const warehouses = await tx.getWarehouses();
const series = await tx.getSeries('SINV');
const openPeriods = await tx.getOpenPeriods();
```

## Asientos contables

```typescript
const je = tx.journalEntry();
je.date = new Date();
je.periodId = 'period-001';
je.description = 'Asiento manual';
je.addLine({ accountId: '43000001', debit: 1210, partnerId: 'bp-001' });
je.addLine({ accountId: '70000001', credit: 1000 });
je.addLine({ accountId: '47700001', credit: 210 });

const { id } = await je.save(db, user.id);
await tx.postJournalEntry(id);
```

## RRHH

```typescript
const employees = await tx.getEmployees();
const contracts = await tx.getContracts({ employeeId: 'emp-001', activeOnly: true });
const payrolls = await tx.getPayrolls({ year: 2026, month: 5 });
```

## Tareas y proyectos

```typescript
const task = await tx.createTask({
  title: 'Implementar informe',
  status: 'todo',
  priority: 'high',
  assigneeId: 'emp-001',
});

const gantt = await tx.getGantt({ from: '2026-05-01', to: '2026-05-31' });
```

## Componentes UI

Los plugins pueden tener componentes React que se cargan en el ERP. Usa `@openfactu/ui` para los componentes:

```tsx
import React, { useState } from 'react';
import { Card, Button, Table } from '@openfactu/ui';

const Page = () => {
  return (
    <Card>
      <h2>Mi Plugin</h2>
      <Button onClick={() => alert('hola')}>Click</Button>
    </Card>
  );
};

export default Page;
```

## Manifest

```json
{
  "name": "Mi Plugin",
  "version": "1.0.0",
  "description": "Descripcion",
  "logo": "Puzzle",
  "ui": {
    "routes": [
      {
        "path": "/plugin/mi-plugin",
        "title": "Mi Plugin",
        "type": "custom",
        "config": { "component": "ui/Page.tsx" }
      }
    ],
    "menuItems": [
      { "label": "Mi Plugin", "path": "/plugin/mi-plugin", "icon": "Puzzle" }
    ]
  }
}
```

## Desarrollo remoto

Sube tu plugin a un servidor OpenFactu sin necesidad de acceso SSH:

```bash
# Subir una vez
openfactu plugin push --server http://mi-servidor:3000 --client-id ofk_... --client-secret ofs_...

# Auto-sync al guardar
openfactu plugin watch --server http://mi-servidor:3000 --client-id ofk_... --client-secret ofs_...
```

Las dev keys se generan desde la UI del ERP: Plugins > Desarrollo > Generar API Key.

## Links

- [Documentación](https://openfactuerp.org/plugins/crear-plugin/)
- [Template](https://github.com/OpenFactu/openfactu-plugin-template)
- [Marketplace](https://openfactuerp.org/marketplace/)
- [GitHub](https://github.com/OpenFactu/OpenFactu)

## Licencia

MIT — Copyright (c) 2026 Keirost

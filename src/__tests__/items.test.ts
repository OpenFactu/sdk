import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Items } from '../resources/items';
import { HttpClient } from '../http';

describe('Items', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let items: Items;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
    const http = new HttpClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk',
      tenantId: 't1',
    });
    items = new Items(http);
  });

  it('lists all items', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 'i1', code: 'PROD-000001', name: 'Laptop', uomId: 'u1', basePrice: 999, stock: 10, manageBy: 'N', kind: 'product' },
      ],
    });

    const result = await items.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Laptop');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items');
  });

  it('gets an item by id via list filter', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 'i1', code: 'PROD-000001', name: 'Laptop', uomId: 'u1', basePrice: 999, stock: 10, manageBy: 'N', kind: 'product' },
      ],
    });

    const result = await items.get('i1');
    expect(result?.name).toBe('Laptop');
  });

  it('creates an item', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'i2', code: 'PROD-000002', name: 'Mouse', uomId: 'u1', basePrice: 25, stock: 0, manageBy: 'N', kind: 'product' }),
    });

    const result = await items.create({ name: 'Mouse', uomId: 'u1', basePrice: 25 });
    expect(result.name).toBe('Mouse');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items');
  });

  it('updates an item', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'i1', code: 'PROD-000001', name: 'Gaming Laptop', uomId: 'u1', basePrice: 1299, stock: 10, manageBy: 'N', kind: 'product' }),
    });

    const result = await items.update('i1', { name: 'Gaming Laptop', basePrice: 1299 });
    expect(result.name).toBe('Gaming Laptop');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1');
  });

  it('deletes an item', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await items.delete('i1');
    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1');
  });

  it('gets batches', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 'b1', batchNum: 'LOT-001', quantity: 5, type: 'B' }],
    });

    const result = await items.getBatches('i1');
    expect(result).toHaveLength(1);
    expect(result[0].batchNum).toBe('LOT-001');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1/batches');
  });

  it('gets stock', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        warehouseStock: [{ warehouseId: 'w1', warehouseName: 'Main', stock: 10 }],
        zoneStock: [{ warehouseId: 'w1', zoneId: 'z1', zoneName: 'A1', stock: 5 }],
        batches: [],
      }),
    });

    const result = await items.getStock('i1');
    expect(result.warehouseStock).toHaveLength(1);
    expect(result.warehouseStock[0].stock).toBe(10);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1/stock');
  });

  it('gets UOMs', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ uomId: 'u1', code: 'UNT', name: 'Unidad', factor: '1.0000', isBase: true }],
    });

    const result = await items.getUoms('i1');
    expect(result).toHaveLength(1);
    expect(result[0].isBase).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1/uoms');
  });

  it('adds a UOM', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'alt1', itemId: 'i1', uomId: 'u2', factor: '12.0000' }),
    });

    const result = await items.addUom('i1', { uomId: 'u2', factor: 12 });
    expect(result.factor).toBe('12.0000');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1/uoms');
  });

  it('removes a UOM', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await items.removeUom('i1', 'alt1');
    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/items/i1/uoms/alt1');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Documents } from '../resources/documents';
import { HttpClient } from '../http';
import { OpenFactuError } from '../errors';

describe('Documents', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let documents: Documents;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
    const http = new HttpClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk',
      tenantId: 't1',
    });
    documents = new Documents(http);
  });

  it('creates a sales invoice', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, id: 'inv-1', docNum: 7, docType: 'SINV', label: 'Factura Venta' }),
    });

    const result = await documents.create('SINV', {
      partnerId: 'p1',
      seriesId: 's1',
      periodId: 'per1',
      lines: [{ itemId: 'i1', quantity: 2, price: 50 }],
    });

    expect(result.id).toBe('inv-1');
    expect(result.docNum).toBe(7);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/factuapi/documents/SINV');
  });

  it('posts a draft invoice', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, id: 'inv-1', status: 'O' }),
    });

    const result = await documents.post('SINV', 'inv-1');
    expect(result.status).toBe('O');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/factuapi/documents/SINV/inv-1/post');
  });

  it('cancels a document', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await documents.cancel('SO', 'so-1');
    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/factuapi/documents/SO/so-1/cancel');
  });

  it('gets a document detail', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'inv-1', docNum: 7, status: 'O', total: 100 }),
    });

    const result = await documents.get('SINV', 'inv-1');
    expect(result.id).toBe('inv-1');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/sales/invoices/inv-1');
  });

  it('lists documents', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 'inv-1', docNum: 7, total: 100 }],
    });

    const result = await documents.list('PINV');
    expect(result).toHaveLength(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/purchases/invoices');
  });

  it('throws OpenFactuError on API error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Serie no encontrada' }),
    });

    await expect(
      documents.create('SINV', {
        partnerId: 'p1',
        seriesId: 'bad',
        periodId: 'per1',
        lines: [],
      }),
    ).rejects.toThrow(OpenFactuError);
  });
});

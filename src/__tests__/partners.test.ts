import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Partners } from '../resources/partners';
import { HttpClient } from '../http';

describe('Partners', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let partners: Partners;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
    const http = new HttpClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk',
      tenantId: 't1',
    });
    partners = new Partners(http);
  });

  it('lists all partners', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 'p1', code: 'CLI-00001', name: 'Acme', addresses: [] },
        { id: 'p2', code: 'CLI-00002', name: 'Globex', addresses: [] },
      ],
    });

    const result = await partners.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Acme');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/partners');
  });

  it('gets a partner by id via list filter', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { id: 'p1', code: 'CLI-00001', name: 'Acme', addresses: [] },
        { id: 'p2', code: 'CLI-00002', name: 'Globex', addresses: [] },
      ],
    });

    const result = await partners.get('p2');
    expect(result?.name).toBe('Globex');
  });

  it('returns null when partner not found', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 'p1', code: 'CLI-00001', name: 'Acme', addresses: [] }],
    });

    const result = await partners.get('p99');
    expect(result).toBeNull();
  });

  it('creates a partner', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'p3', code: 'CLI-00003', name: 'New Partner' }),
    });

    const result = await partners.create({ name: 'New Partner' });
    expect(result.name).toBe('New Partner');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/partners');
  });

  it('updates a partner', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 'p1', code: 'CLI-00001', name: 'Updated' }),
    });

    const result = await partners.update('p1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/partners/p1');
  });

  it('deletes a partner', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await partners.delete('p1');
    expect(result.success).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/partners/p1');
  });
});

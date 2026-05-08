import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../http';
import { OpenFactuError } from '../errors';

describe('HttpClient', () => {
  const config = {
    baseUrl: 'http://localhost:3000',
    token: 'test-token',
    tenantId: 'tenant-1',
  };

  let client: HttpClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new HttpClient(config);
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send correct headers', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' }),
    });

    await client.get('/api/test');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/test');
    expect(options.headers).toEqual({
      Authorization: 'Bearer test-token',
      'x-tenant-id': 'tenant-1',
      'Content-Type': 'application/json',
    });
    expect(options.method).toBe('GET');
  });

  it('should perform GET request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    });

    const result = await client.get<{ id: string }>('/api/items');
    expect(result).toEqual({ id: '1' });
  });

  it('should perform POST request with body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: '2' }),
    });

    const result = await client.post<{ id: string }>('/api/items', { name: 'Product' });
    expect(result).toEqual({ id: '2' });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toBe(JSON.stringify({ name: 'Product' }));
  });

  it('should perform PATCH request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ updated: true }),
    });

    const result = await client.patch('/api/items/1', { name: 'Updated' });
    expect(result).toEqual({ updated: true });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('PATCH');
  });

  it('should perform DELETE request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await client.delete('/api/items/1');
    expect(result).toEqual({ success: true });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('DELETE');
  });

  it('should throw OpenFactuError on HTTP error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    await expect(client.get('/api/items/999')).rejects.toThrow('Not found');
  });

  it('should throw OpenFactuError with status code on generic error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    try {
      await client.get('/api/test');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(OpenFactuError);
      expect(err.statusCode).toBe(500);
      expect(err.path).toBe('/api/test');
    }
  });

  it('should abort request after timeout', async () => {
    fetchMock.mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Aborted')), 100);
      });
    });

    const shortClient = new HttpClient({ ...config, timeout: 10 });
    await expect(shortClient.get('/api/test')).rejects.toThrow();
  });
});

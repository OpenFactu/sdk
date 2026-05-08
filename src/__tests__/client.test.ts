import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenFactuClient } from '../client';
import { OpenFactuError } from '../errors';

describe('OpenFactuClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
  });

  it('constructs with config', () => {
    const client = new OpenFactuClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk',
      tenantId: 't1',
    });
    expect(client.documents).toBeDefined();
    expect(client.partners).toBeDefined();
    expect(client.items).toBeDefined();
  });

  it('creates a new instance with different token', () => {
    const client = new OpenFactuClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk1',
      tenantId: 't1',
    });
    const client2 = client.withToken('tk2');
    expect(client2).not.toBe(client);
    expect(client2).toBeInstanceOf(OpenFactuClient);
  });

  it('creates a new instance with different tenant', () => {
    const client = new OpenFactuClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk',
      tenantId: 't1',
    });
    const client2 = client.withTenant('t2');
    expect(client2).not.toBe(client);
    expect(client2).toBeInstanceOf(OpenFactuClient);
  });

  it('propagates errors as OpenFactuError', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });

    const client = new OpenFactuClient({
      baseUrl: 'http://localhost:3000',
      token: 'tk',
      tenantId: 't1',
    });

    await expect(client.partners.list()).rejects.toThrow(OpenFactuError);
  });
});

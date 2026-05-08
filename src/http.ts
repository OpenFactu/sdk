import type { ConnectionConfig, ApiError } from './types';
import { OpenFactuError } from './errors';

export class HttpClient {
  private baseUrl: string;
  private token: string;
  private tenantId: string;
  private timeout: number;

  constructor(config: ConnectionConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.token = config.token;
    this.tenantId = config.tenantId;
    this.timeout = config.timeout ?? 30000;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'x-tenant-id': this.tenantId,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.headers(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new OpenFactuError({
          message: (data as ApiError).error || `HTTP ${res.status}`,
          statusCode: res.status,
          response: data,
          path,
        });
      }
      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body: any): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

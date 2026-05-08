import { HttpClient } from '../http';
import type { Partner, PartnerCreateParams, PartnerUpdateParams } from '../types';

/**
 * Resource para gestionar socios de negocio (clientes y proveedores).
 *
 * Nota: la API no expone un endpoint GET individual. El método `get(id)`
 * realiza un `list()` y filtra por ID localmente.
 */
export class Partners {
  constructor(private http: HttpClient) {}

  /**
   * Lista todos los socios de negocio.
   */
  async list(): Promise<Partner[]> {
    return this.http.get<Partner[]>('/api/partners');
  }

  /**
   * Obtiene un socio por ID (vía list + filtro local).
   * Devuelve `null` si no se encuentra.
   */
  async get(id: string): Promise<Partner | null> {
    const all = await this.list();
    return all.find((p) => p.id === id) || null;
  }

  /**
   * Crea un nuevo socio de negocio.
   */
  async create(params: PartnerCreateParams): Promise<Partner> {
    return this.http.post<Partner>('/api/partners', params);
  }

  /**
   * Actualiza un socio existente.
   */
  async update(id: string, params: PartnerUpdateParams): Promise<Partner> {
    return this.http.patch<Partner>(`/api/partners/${id}`, params);
  }

  /**
   * Elimina un socio de negocio.
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/api/partners/${id}`);
  }
}

import { HttpClient } from '../http';
import type { Item, ItemCreateParams, ItemUpdateParams, ItemBatch, ItemStock, ItemUom } from '../types';

/**
 * Resource para gestionar artículos (maestro de productos).
 *
 * Nota: la API no expone un endpoint GET individual. El método `get(id)`
 * realiza un `list()` y filtra por ID localmente.
 */
export class Items {
  constructor(private http: HttpClient) {}

  /**
   * Lista todos los artículos.
   */
  async list(): Promise<Item[]> {
    return this.http.get<Item[]>('/api/items');
  }

  /**
   * Obtiene un artículo por ID (vía list + filtro local).
   * Devuelve `null` si no se encuentra.
   */
  async get(id: string): Promise<Item | null> {
    const all = await this.list();
    return all.find((i) => i.id === id) || null;
  }

  /**
   * Crea un nuevo artículo.
   */
  async create(params: ItemCreateParams): Promise<Item> {
    return this.http.post<Item>('/api/items', params);
  }

  /**
   * Actualiza un artículo existente.
   */
  async update(id: string, params: ItemUpdateParams): Promise<Item> {
    return this.http.patch<Item>(`/api/items/${id}`, params);
  }

  /**
   * Elimina un artículo.
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/api/items/${id}`);
  }

  /**
   * Obtiene los lotes/seriales de un artículo.
   */
  async getBatches(id: string): Promise<ItemBatch[]> {
    return this.http.get<ItemBatch[]>(`/api/items/${id}/batches`);
  }

  /**
   * Obtiene el stock por almacén y zona de un artículo.
   */
  async getStock(id: string): Promise<ItemStock> {
    return this.http.get<ItemStock>(`/api/items/${id}/stock`);
  }

  /**
   * Obtiene las unidades de medida alternativas de un artículo.
   */
  async getUoms(id: string): Promise<ItemUom[]> {
    return this.http.get<ItemUom[]>(`/api/items/${id}/uoms`);
  }

  /**
   * Añade una unidad de medida alternativa a un artículo.
   */
  async addUom(id: string, params: { uomId: string; factor: number }): Promise<ItemUom> {
    return this.http.post<ItemUom>(`/api/items/${id}/uoms`, params);
  }

  /**
   * Elimina una unidad de medida alternativa de un artículo.
   */
  async removeUom(itemId: string, uomRelationId: string): Promise<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/api/items/${itemId}/uoms/${uomRelationId}`);
  }
}

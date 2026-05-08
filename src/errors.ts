/**
 * Error específico del SDK de OpenFactu.
 * Incluye el código de estado HTTP, el body crudo de la respuesta
 * y el path del endpoint que falló.
 */
export class OpenFactuError extends Error {
  public readonly statusCode?: number;
  public readonly response?: any;
  public readonly path: string;

  constructor({
    message,
    statusCode,
    response,
    path,
  }: {
    message: string;
    statusCode?: number;
    response?: any;
    path: string;
  }) {
    super(message);
    this.name = 'OpenFactuError';
    this.statusCode = statusCode;
    this.response = response;
    this.path = path;
  }
}

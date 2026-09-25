import type { IncomingMessage, ServerResponse } from 'node:http';

/** Atiende /api/*. Devuelve false si la ruta no es de la API. */
export function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean>;

/** Appels à l'API admin du Worker (/api/admin/*, voir worker/index.ts). */
import type { StoredValue } from '../cms/fields';
import type { PublishResult, PublishStatus } from '../cms/publish';
import type { Workshop, WorkshopInput } from '../cms/workshops';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/admin${path}`, {
      credentials: 'same-origin',
      ...init,
      headers:
        init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json', ...init.headers }
          : init.headers,
    });
  } catch {
    throw new ApiError(
      'Impossible de joindre le serveur. Vérifie ta connexion internet.',
      0,
    );
  }
  const payload = (await response.json().catch(() => null)) as
    (T & { error?: string; fields?: Record<string, string> }) | null;
  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Erreur inattendue (${response.status}).`,
      response.status,
      payload?.fields ?? {},
    );
  }
  return payload as T;
}

export const api = {
  me: () => request<{ email: string }>('/me'),

  content: () => request<{ values: Record<string, StoredValue> }>('/content'),

  saveContent: (pageId: string, values: Record<string, StoredValue>) =>
    request<PublishResult>(`/content/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }),

  workshops: () => request<{ workshops: Workshop[] }>('/workshops'),

  workshop: (id: string) => request<{ workshop: Workshop }>(`/workshops/${id}`),

  createWorkshop: (input: WorkshopInput) =>
    request<PublishResult & { id: string }>('/workshops', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateWorkshop: (id: string, input: WorkshopInput) =>
    request<PublishResult & { id: string }>(`/workshops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteWorkshop: (id: string) =>
    request<PublishResult>(`/workshops/${id}`, { method: 'DELETE' }),

  uploadCover: (file: Blob, name: string) => {
    const form = new FormData();
    form.append('file', file, name);
    return request<{ key: string }>('/media', {
      method: 'POST',
      body: form,
    });
  },

  publishStatus: () => request<PublishStatus>('/publish'),

  republish: () => request<PublishResult>('/publish', { method: 'POST' }),
};

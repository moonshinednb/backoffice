/* API client: session cookie + CSRF header, errors as Error(message). */
let csrf = '';
export const setCsrf = (token: string) => { csrf = token; };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

type Options = { method?: string; body?: unknown; signal?: AbortSignal };

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (opts.method && opts.method !== 'GET') headers['X-CSRFToken'] = csrf;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }
  const response = await fetch('/api' + path, { method: opts.method || 'GET', headers, body, credentials: 'same-origin', signal: opts.signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('moonshine:logged-out'));
    throw new ApiError(data.error || data.detail || 'Handeling mislukt.', response.status);
  }
  return data as T;
}

/** Download a file endpoint through fetch, so errors become messages. */
export async function download(path: string, fallback = 'moonshine.pdf') {
  const response = await fetch('/api' + path, { credentials: 'same-origin' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Downloaden is niet gelukt.');
  }
  const disposition = response.headers.get('Content-Disposition') || '';
  const star = /filename\*=UTF-8''([^;]+)/.exec(disposition);
  const plain = /filename="([^"]+)"/.exec(disposition);
  saveBlob(await response.blob(), star ? decodeURIComponent(star[1]) : plain ? plain[1] : fallback);
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const INTERNAL_KEY = (import.meta.env.VITE_INTERNAL_PROXY_KEY || '').trim();

export async function bffFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    'x-internal-key': INTERNAL_KEY,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown API error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  get: (url: string) => bffFetch(url, { method: 'GET' }),
  post: (url: string, body: any) => bffFetch(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: (url: string, body: any) => bffFetch(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string) => bffFetch(url, { method: 'DELETE' }),
};

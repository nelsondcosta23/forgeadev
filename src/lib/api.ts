export async function bffFetch(url: string, options: RequestInit = {}) {
  const customHeaders: Record<string, string> = {};

  try {
    const rawAuth = localStorage.getItem('pb_auth');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed.token) {
        customHeaders['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // Ignore JSON parse error
  }

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
    ...options.headers,
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

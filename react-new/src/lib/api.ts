export function apiUrl(path: string) {
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  // ensure leading slash
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${p}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  const res = await fetch(url, init);
  return res;
}

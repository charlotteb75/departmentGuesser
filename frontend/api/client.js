const API_BASE_URL = "http://127.0.0.1:5000/api";
const ACCESS_TOKEN_KEY = "access_token";

export function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw data || new Error(`La requête a échoué (${response.status}).`);
  }

  return data;
}

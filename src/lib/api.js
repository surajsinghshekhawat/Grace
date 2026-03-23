import useStore from "../store";

/** Empty string = same origin (use Vite dev proxy to backend). */
const raw = import.meta.env.VITE_API_URL;
const API_URL =
  raw !== undefined && raw !== null && String(raw).trim() !== ""
    ? String(raw).replace(/\/$/, "")
    : "";

function formatErrorDetail(detail) {
  if (detail == null) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first && typeof first === "object" && first.msg) {
      return `Validation error: ${first.msg}`;
    }
    return `Validation error: ${JSON.stringify(detail)}`;
  }
  if (typeof detail === "object") {
    if (detail.msg) return String(detail.msg);
    return JSON.stringify(detail);
  }
  return String(detail);
}

function isAuthExemptPath(path) {
  return (
    path.includes("/api/login") ||
    path.includes("/api/register") ||
    path.includes("/api/auth/forgot-password") ||
    path.includes("/api/auth/reset-password")
  );
}

export async function apiFetch(path, options = {}) {
  const { authToken, authUser } = useStore.getState();

  const headers = {
    ...(options.headers || {}),
  };
  if (!headers["Content-Type"] && options.body != null) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (e) {
    throw new Error("Can't connect to server. Is the backend running?");
  }

  if (!res.ok) {
    if (res.status === 401 && authUser && !isAuthExemptPath(path)) {
      useStore.getState().logout();
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = formatErrorDetail(err.detail) || res.statusText || "Request failed";
    throw new Error(msg);
  }
  if (res.status === 204 || res.status === 205) {
    return null;
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

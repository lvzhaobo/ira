const BASE = "/api/v1";

export async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export async function postJson<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export async function deleteJson(path: string): Promise<void> {
  const r = await fetch(`${BASE}${path}`, { method: "DELETE" });
  if (!r.ok && r.status !== 204) throw new Error(`${path} ${r.status}`);
}

/** multipart，用于研报上传等 */
export async function postFormData<T>(path: string, form: FormData): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: "POST", body: form });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

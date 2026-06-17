const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const TOKEN_KEY = "access_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = res.statusText;
        try {
            const json = JSON.parse(text);
            message = json.message || json.error || text || res.statusText;
        } catch {
            message = text || res.statusText;
        }
        throw new Error(message || `Request failed: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;

    return res.json();
}

export const api = {
    get: <T>(path: string, options?: RequestInit) =>
        apiFetch<T>(path, { ...options, method: "GET" }),

    post: <T>(path: string, body: unknown, options?: RequestInit) =>
        apiFetch<T>(path, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        }),

    put: <T>(path: string, body: unknown, options?: RequestInit) =>
        apiFetch<T>(path, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body),
        }),

    patch: <T>(path: string, body: unknown, options?: RequestInit) =>
        apiFetch<T>(path, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body),
        }),

    delete: <T>(path: string, options?: RequestInit) =>
        apiFetch<T>(path, { ...options, method: "DELETE" }),

    postForm: <T>(path: string, body: FormData, options?: RequestInit) =>
        apiFetch<T>(path, { ...options, method: "POST", body }),
};

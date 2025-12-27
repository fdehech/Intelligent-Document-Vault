const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
    token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, headers, ...customConfig } = options;

    const config: RequestInit = {
        ...customConfig,
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...headers,
        },
    };

    if (token) {
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    } else {
        const storedToken = localStorage.getItem("accessToken");
        if (storedToken) {
            (config.headers as Record<string, string>)["Authorization"] = `Bearer ${storedToken}`;
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || response.statusText);
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
    post: <T>(endpoint: string, body: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: <T>(endpoint: string, body: any, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "DELETE" }),
};

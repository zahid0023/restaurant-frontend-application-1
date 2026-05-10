import { api, setToken, clearToken } from "./api";

export interface LoginRequest {
    user_name: string;
    password: string;
}

export interface LoginResponse {
    token_type: string;
    access_token: string;
    refresh_token: string;
}

export interface RegisterRequest {
    user_name: string;
    password: string;
    confirm_password: string;
}

export interface RegisterResponse {
    success: boolean;
    id: number;
}

const REFRESH_TOKEN_KEY = "resort_refresh_token";

export const login = async (body: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>("/auth/login", body);
    setToken(res.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
    return res;
};

export const logout = (): void => {
    clearToken();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const register = async (body: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>("/auth/registration/user", body);
};

export const refreshToken = async (): Promise<string> => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refresh) throw new Error("No refresh token");
    const res = await api.post<LoginResponse>("/auth/refresh", { refresh_token: refresh });
    setToken(res.access_token);
    return res.access_token;
};

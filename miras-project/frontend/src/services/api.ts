// Ruta del fichero: /frontend/src/services/api.ts

import axios, { AxiosError, AxiosResponse } from 'axios';
import type { Project, MUnion } from '../core/state/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para manejar tokens de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos de respuesta
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Función helper para extraer datos de la respuesta
const extractData = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  return response.data.data;
};

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get<ApiResponse<Project[]>>('/projects');
    return extractData(response);
  },

  getById: async (id: number): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return extractData(response);
  },

  create: async (project: Partial<Project>): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>('/projects', project);
    return extractData(response);
  },

  update: async (id: number, project: Partial<Project>): Promise<Project> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, project);
    return extractData(response);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  }
};

export const unionsApi = {
  getAll: async (): Promise<MUnion[]> => {
    const response = await api.get<ApiResponse<MUnion[]>>('/munions');
    return extractData(response);
  },

  getById: async (id: number): Promise<MUnion> => {
    const response = await api.get<ApiResponse<MUnion>>(`/munions/${id}`);
    return extractData(response);
  }
};

export const deviceApi = {
  getStatus: async () => {
    const response = await api.get<ApiResponse<{ status: string }>>('/devices/status');
    return extractData(response);
  },

  reconnect: async (deviceId: number) => {
    const response = await api.post<ApiResponse<{ success: boolean }>>(
      `/devices/${deviceId}/reconnect`
    );
    return extractData(response);
  },

  getConfig: async (deviceId: number) => {
    const response = await api.get<ApiResponse<any>>(`/devices/${deviceId}/config`);
    return extractData(response);
  },

  updateConfig: async (deviceId: number, config: any) => {
    const response = await api.put<ApiResponse<any>>(
      `/devices/${deviceId}/config`,
      config
    );
    return extractData(response);
  }
};

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post<ApiResponse<{ token: string }>>(
      '/auth/login',
      { username, password }
    );
    return extractData(response);
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<{ username: string; role: string }>>(
      '/auth/profile'
    );
    return extractData(response);
  }
};

export default api;
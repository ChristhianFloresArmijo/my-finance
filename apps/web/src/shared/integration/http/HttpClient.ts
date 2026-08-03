import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<(success: boolean) => void> = [];

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt refresh for auth endpoints themselves
          const url = originalRequest.url ?? '';
          if (
            url.includes('/auth/sign-in') ||
            url.includes('/auth/refresh') ||
            url.includes('/auth/sign-up')
          ) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Queue this request until refresh resolves
            return new Promise((resolve, reject) => {
              this.refreshQueue.push((success) => {
                if (success) resolve(this.client(originalRequest));
                else reject(error);
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.client.post('/auth/refresh');
            this.refreshQueue.forEach((cb) => cb(true));
            this.refreshQueue = [];
            return this.client(originalRequest);
          } catch {
            this.refreshQueue.forEach((cb) => cb(false));
            this.refreshQueue = [];
            // Dispatch an event instead of doing a hard reload — a hard reload
            // re-runs initAuth() which re-triggers this same interceptor, causing
            // an infinite reload loop when there is no valid session.
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }
}

import type { AxiosRequestConfig } from 'axios';
import type { HttpClient } from './HttpClient';

/**
 * Backend adapter interface.
 * Allows switching between different backend implementations (NestJS, Django, etc.)
 */
export interface BackendAdapter {
  readonly name: string;
  transformRequest<T>(data: T): unknown;
  transformResponse<T>(data: unknown): T;
  transformError(error: unknown): Error;
}

export class NestJSAdapter implements BackendAdapter {
  readonly name = 'nestjs';

  transformRequest<T>(data: T): unknown {
    return data;
  }

  transformResponse<T>(data: unknown): T {
    // Unwrap TransformInterceptor envelope: { data: T, timestamp: string }
    if (
      data !== null &&
      typeof data === 'object' &&
      'data' in data &&
      'timestamp' in data
    ) {
      return (data as { data: T }).data;
    }
    return data as T;
  }

  transformError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    const nestError = error as { message?: string; error?: string };
    return new Error(nestError.message || nestError.error || 'Unknown error');
  }
}

export class DjangoAdapter implements BackendAdapter {
  readonly name = 'django';

  transformRequest<T>(data: T): unknown {
    return this.camelToSnake(data);
  }

  transformResponse<T>(data: unknown): T {
    return this.snakeToCamel(data) as T;
  }

  transformError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    const djangoError = error as { detail?: string; [key: string]: unknown };
    if (djangoError.detail) {
      return new Error(djangoError.detail);
    }
    return new Error(JSON.stringify(error));
  }

  private camelToSnake(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.camelToSnake(item));
    if (typeof obj !== 'object') return obj;

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = this.camelToSnake(value);
    }
    return result;
  }

  private snakeToCamel(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.snakeToCamel(item));
    if (typeof obj !== 'object') return obj;

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = this.snakeToCamel(value);
    }
    return result;
  }
}

export class BackendAdapterFactory {
  private static adapters: Map<string, BackendAdapter> = new Map<string, BackendAdapter>([
    ['nestjs', new NestJSAdapter()],
    ['django', new DjangoAdapter()],
  ]);

  static create(type: string): BackendAdapter {
    const adapter = this.adapters.get(type.toLowerCase());
    if (!adapter) {
      throw new Error(`Unknown backend adapter type: ${type}`);
    }
    return adapter;
  }

  static register(name: string, adapter: BackendAdapter): void {
    this.adapters.set(name.toLowerCase(), adapter);
  }
}

export class AdaptedHttpClient implements HttpClient {
  private readonly httpClient: HttpClient;
  private readonly adapter: BackendAdapter;

  constructor(httpClient: HttpClient, adapter: BackendAdapter) {
    this.httpClient = httpClient;
    this.adapter = adapter;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.httpClient.get<unknown>(url, config);
      return this.adapter.transformResponse<T>(response);
    } catch (error) {
      throw this.adapter.transformError(error);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const transformedData = this.adapter.transformRequest(data);
      const response = await this.httpClient.post<unknown>(url, transformedData, config);
      return this.adapter.transformResponse<T>(response);
    } catch (error) {
      throw this.adapter.transformError(error);
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const transformedData = this.adapter.transformRequest(data);
      const response = await this.httpClient.put<unknown>(url, transformedData, config);
      return this.adapter.transformResponse<T>(response);
    } catch (error) {
      throw this.adapter.transformError(error);
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const transformedData = this.adapter.transformRequest(data);
      const response = await this.httpClient.patch<unknown>(url, transformedData, config);
      return this.adapter.transformResponse<T>(response);
    } catch (error) {
      throw this.adapter.transformError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.httpClient.delete<unknown>(url, config);
      return this.adapter.transformResponse<T>(response);
    } catch (error) {
      throw this.adapter.transformError(error);
    }
  }
}

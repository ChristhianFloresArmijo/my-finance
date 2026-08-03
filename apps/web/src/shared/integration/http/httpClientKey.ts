import type { InjectionKey } from 'vue';
import type { AdaptedHttpClient } from './BackendAdapter';

/**
 * Vue injection key for the app-level singleton AdaptedHttpClient.
 * Provide once in main.ts; inject in any composable or component.
 */
export const HTTP_CLIENT_KEY: InjectionKey<AdaptedHttpClient> = Symbol('httpClient');

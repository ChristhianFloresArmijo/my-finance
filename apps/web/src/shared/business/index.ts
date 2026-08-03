export { Entity } from './Entity';
export { ValueObject } from './ValueObject';
export { Result } from './Result';

/** Generic paginated response shape returned by NestJS list endpoints */
export interface PaginatedResults<T> {
  results: T extends Array<infer U> ? U[] : T[];
  count: number;
  limit: number;
  offset: number;
}

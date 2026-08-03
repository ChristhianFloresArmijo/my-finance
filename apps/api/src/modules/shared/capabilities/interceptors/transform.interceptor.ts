import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

export interface TransformResponse<T> {
  data: T
  timestamp: string
}

/**
 * Global response envelope interceptor.
 *
 * Wraps every successful 2xx response body in:
 *   { data: <original body>, timestamp: <ISO 8601 UTC> }
 *
 * Register globally in main.ts:
 *   app.useGlobalInterceptors(new TransformInterceptor())
 *
 * The frontend NestJSAdapter.transformResponse() detects and unwraps this
 * envelope automatically, so repository / composable code is unaffected.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<TransformResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) return data
        return { data, timestamp: new Date().toISOString() }
      }),
    )
  }
}

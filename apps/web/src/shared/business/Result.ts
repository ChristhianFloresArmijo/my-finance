/**
 * Result pattern for handling success and failure cases without throwing exceptions.
 */
export class Result<T, E = string> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value!;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful result');
    }
    return this._error!;
  }

  static ok<T, E = string>(value?: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static fail<T, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error!);
    }
    return Result.ok<U, E>(fn(this._value!));
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isSuccess) {
      return Result.ok<T, F>(this._value);
    }
    return Result.fail<T, F>(fn(this._error!));
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error!);
    }
    return fn(this._value!);
  }

  getOrElse(defaultValue: T): T {
    return this.isSuccess ? this._value! : defaultValue;
  }

  getOrThrow(): T {
    if (this.isFailure) {
      throw new Error(String(this._error));
    }
    return this._value!;
  }
}

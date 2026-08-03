import { HttpException, InternalServerErrorException } from "@nestjs/common"
import { ValidationException } from "../exceptions"

type Success<T> = { isOk: true; value: T; error: undefined }
type Failure<E> = { isOk: false; value: undefined; error: E }

export type HandlerError = InternalServerErrorException | ValidationException | HttpException
export type Result<T, E> = Success<T> | Failure<E>

export type ErrorCollection = Record<string, string[]>

export function success<T>(value: T): Success<T> {
  return { isOk: true, value, error: undefined }
}
export function failure<E>(error: E): Failure<E> {
  return { isOk: false, value: undefined, error }
}

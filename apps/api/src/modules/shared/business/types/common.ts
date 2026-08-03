export type Nullish = null | undefined

export type OnlyRequire<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>
export type OnlyOptional<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>
export type MakePartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type Public<T> = {
  [K in keyof T as K extends `_${string}` | `to${string}` ? never : K]: T[K]
}

export interface EntityMethod<T> {
  toPlainObject(): T
}

export type Entity<T> = { [K in keyof T]: T[K] } & EntityMethod<T>

export interface CommonTimeStamps {
  created_at: string | Date | Nullish
  updated_at: string | Date | Nullish
  deleted_at: string | Date | Nullish
}

export type TTimeStamp = string | Date | Nullish

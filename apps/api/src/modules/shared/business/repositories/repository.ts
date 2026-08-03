import { Filter } from "@shared/business/utils/filter"
import { Pagination } from "@shared/business/utils/pagination"
import { ErrorCollection, Result } from "@shared/business/utils/error-handling"
import { Prisma } from "@database/prisma/generated-client"
import { PrismaService } from "@shared/integration/services"

export abstract class Repository<TDataObject> {
  abstract model: Prisma.ModelName
  abstract builder: { instance(data: TDataObject): Result<TDataObject, ErrorCollection> }

  abstract client: PrismaService

  abstract save<TypeError = any>(data: TDataObject): Promise<Result<TDataObject, TypeError>>

  abstract findById<TypeError = any>(id: string): Promise<Result<TDataObject | null, TypeError>>

  abstract find<TypeError = any>(
    args: Record<string, any>,
    pagination?: Pagination,
    filter?: Filter,
    orderBy?: any,
  ): Promise<Result<[number, TDataObject[]], TypeError>>

  abstract delete<TypeError = any>(id: string): Promise<Result<true, TypeError>>

  /** Soft-delete: sets status = DELETED and deleted_at = now. Available on all models that have these fields. */
  abstract softDelete<TypeError = any>(id: string): Promise<Result<true, TypeError>>
}

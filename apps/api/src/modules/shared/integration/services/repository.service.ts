import { Injectable } from "@nestjs/common"
import { Prisma } from "@database/prisma/generated-client"
import { Result, success } from "@shared/business/utils/error-handling"
import { Pagination } from "@shared/business/utils/pagination"
import { Filter } from "@shared/business/utils/filter"
import { PrismaService } from "./prisma.service"
import { Repository } from "@shared/business/repositories"

@Injectable()
export class RepositoryService<T extends { id: string }> implements Repository<T> {
  model: Prisma.ModelName
  builder: { instance(data: T): Result<T, any> }

  private readonly _client: PrismaService
  private readonly _subClient: PrismaService

  constructor(client: PrismaService) {
    this._client = client //client.client
    // this._subClient = client
  }

  // get subClient() {
  //   return this._subClient
  // }

  get client() {
    return this._client
  }

  get user() {
    return this.client.user
  }

  get refreshToken() {
    return this.client.refreshToken
  }

  async save<TypeError = any>(data: Partial<T>): Promise<Result<T, TypeError>> {
    // const { created_at, updated_at, deleted_at, id, ..._data } = data as any
    const record: T = await this.client[this.model].upsert({
      where: { id: data.id },
      update: data,
      create: data,
    })
    return this.builder.instance(record)
  }

  async findById<TypeError = any>(id: string): Promise<Result<T | null, TypeError>> {
    const result: T | null = await (this.client[this.model] as any).findUnique({
      where: { id },
    })

    if (!result) {
      return success(null)
    }

    return this.builder.instance(result)
  }

  async delete<TypeError = any>(id: string): Promise<Result<true, TypeError>> {
    await (this.client[this.model] as any).delete({ id })
    return success(true)
  }

  async softDelete<TypeError = any>(id: string): Promise<Result<true, TypeError>> {
    await (this.client[this.model] as any).update({
      where: { id },
      data: { status: "DELETED", deleted_at: new Date() },
    })
    return success(true)
  }

  async find<TypeError = any>(
    args: Record<string, any>,
    pagination?: Pagination,
    filter?: Filter,
    orderBy?: any,
  ): Promise<Result<[number, T[]], TypeError>> {
    const { where: _where = {}, ..._args } = args

    const where = {
      ..._where,
      ...(filter?.where || {}),
    }

    const [count, results]: [number, T[]] = await this.client.$transaction([
      (this.client[this.model] as any).count({
        where,
      }),
      (this.client[this.model] as any).findMany({
        take: pagination?.limit,
        skip: pagination?.offset,
        ..._args,
        where,
        orderBy,
      }),
    ])

    const _results: T[] = []

    for (let index = 0; index < results.length; index++) {
      const element = this.builder.instance(results[index])

      if (element.isOk === false) return element

      _results.push(element.value)
    }
    return success([count, _results])
  }
}

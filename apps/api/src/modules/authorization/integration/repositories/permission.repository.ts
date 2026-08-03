import { Injectable } from "@nestjs/common"
import { Permission } from "@authorization/business/entities"
import { Prisma } from '@database/prisma/generated-client'
import { RepositoryService } from "@shared/integration/services"
import { IPermissionRepository } from "@authorization/business/repositories"

@Injectable()
export class PermissionRepository
  extends RepositoryService<Permission>
  implements IPermissionRepository
{
  model = Prisma.ModelName.Permission
  builder = Permission
}

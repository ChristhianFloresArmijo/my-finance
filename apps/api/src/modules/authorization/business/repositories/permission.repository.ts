import { Permission } from "@authorization/business/entities"
import { Repository } from "@shared/business/repositories"

export abstract class IPermissionRepository extends Repository<Permission> {}

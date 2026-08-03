import { ChangeLog } from "@shared/business/entities/change-log.entity"
import { Repository } from "@shared/business/repositories/repository"

export abstract class IChangeLogRepository extends Repository<ChangeLog> {}

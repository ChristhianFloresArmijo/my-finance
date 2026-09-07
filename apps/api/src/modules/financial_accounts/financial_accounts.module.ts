import { Module } from "@nestjs/common"
import { CqrsModule } from "@nestjs/cqrs"
import { RepositoryService } from "@shared/integration/services"
import HANDLERS from "./capabilities/handlers"
// TODO: cuando existan, importar la interfaz de repositorio desde './business/repositories'
// y su implementación concreta desde './integration/repositories', y agregarlas a
// 'providers' como { provide: I<Entidad>Repository, useClass: <Entidad>Repository }.
// TODO: importar los controllers desde './presentation/restful' y agregarlos a 'controllers'.
// Quita RepositoryService si este módulo no lo necesita.

@Module({
  imports: [CqrsModule],
  controllers: [],
  providers: [RepositoryService, ...HANDLERS],
  exports: [],
})
export class FinancialAccountsModule {}

import { ICommand } from "@nestjs/cqrs"

export class CleanupTokensCommand implements ICommand {
  constructor(public readonly daysOld: number = 7) {}
}

export class RegenerateRecoveryCodesCommand {
  constructor(
    public readonly userId: string,
    public readonly code: string,
  ) {}
}

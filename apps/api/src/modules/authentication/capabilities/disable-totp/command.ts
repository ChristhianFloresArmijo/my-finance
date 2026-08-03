export class DisableTotpCommand {
  constructor(
    public readonly userId: string,
    public readonly code: string,
  ) {}
}

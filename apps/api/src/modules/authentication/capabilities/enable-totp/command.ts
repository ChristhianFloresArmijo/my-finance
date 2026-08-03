export class EnableTotpCommand {
  constructor(
    public readonly userId: string,
    public readonly code: string,
  ) {}
}

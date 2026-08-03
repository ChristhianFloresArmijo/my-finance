export class VerifyTotpLoginCommand {
  constructor(
    public readonly pendingToken: string,
    public readonly code: string,
  ) {}
}

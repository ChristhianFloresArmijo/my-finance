import { ICommand } from "@nestjs/cqrs"

/** Minimal user data needed to generate a token pair — avoids coupling to the User entity */
export interface TokenUserPayload {
  id: string
  email: string
}

export class GenerateTokenPairCommand implements ICommand {
  constructor(
    public readonly user: TokenUserPayload,
    public readonly currentRefreshToken?: string,
  ) {}
}

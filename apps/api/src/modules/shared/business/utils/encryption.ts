import * as bcrypt from "bcrypt"

export async function hashing(
  value: string,
  rounds: number = 10,
  minor: "a" | "b" = "b",
): Promise<string> {
  const salt = await bcrypt.genSalt(rounds, minor)
  const hashedValue = await bcrypt.hash(value, salt)

  return hashedValue
}

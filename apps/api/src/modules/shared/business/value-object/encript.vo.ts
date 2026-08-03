import * as bcrypt from "bcrypt"
import * as crypto from "crypto"

type EncriopMethod = "hash" | "sha256"
export class Encript {
  private constructor(public readonly value: string) {}

  static create(value: string, method: EncriopMethod): Encript {
    const hashedValue = Encript[method](value)
    return new Encript(hashedValue)
  }

  private static hash(value: string): string {
    const salt = bcrypt.genSaltSync()
    return bcrypt.hashSync(value, salt)
  }

  private static sha256(value: string): string {
    const hash = crypto.createHash("sha256")
    hash.update(value)
    return hash.digest("hex")
  }
  public static compare(plainText: string, hashedText: string, method: EncriopMethod): boolean {
    if (method === "hash") {
      return bcrypt.compareSync(plainText, hashedText)
    }
    // sha256 is deterministic — re-hash and string-compare is valid
    const hashedValue = Encript[method](plainText)
    return hashedValue === hashedText
  }
}

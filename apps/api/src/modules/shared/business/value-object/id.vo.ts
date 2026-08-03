import { v4 as uuidv4 } from "uuid"

export class Id {
  constructor(public readonly value?: string) {
    this.value = value ?? uuidv4()
  }
}

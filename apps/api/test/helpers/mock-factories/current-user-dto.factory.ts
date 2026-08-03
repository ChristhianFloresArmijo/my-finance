import { CurrentUserDto } from "@auth/presentation/dtos"
import { Status } from "@database/prisma/generated-client"
import { v4 as uuidv4 } from "uuid"

export interface MockCurrentUserDtoData {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  status?: Status
  created_at?: Date
  roles?: CurrentUserDto["roles"]
  permissions?: CurrentUserDto["permissions"]
}

export function createMockCurrentUserDto(overrides: MockCurrentUserDtoData = {}): CurrentUserDto {
  const first_name = overrides.first_name ?? "John"
  const last_name = overrides.last_name ?? "Doe"
  return {
    id: uuidv4(),
    first_name,
    last_name,
    full_name: `${first_name} ${last_name}`,
    email: "john.doe@example.com",
    status: Status.ACTIVE,
    created_at: new Date(),
    roles: [],
    permissions: [],
    profile: null,
    preferences: null,
    ...overrides,
  }
}

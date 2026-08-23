import { Controller, Get, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "@auth/capabilities/guards"

@ApiTags("meta")
@ApiBearerAuth("JWT")
@Controller("meta")
export class MetaController {
  @ApiOperation({ summary: "Get all enum values used across the system" })
  @UseGuards(JwtAuthGuard)
  @Get("enums")
  getEnums() {
    return {
      status: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "SUSPENDED", label: "Suspended" },
        { value: "PENDING", label: "Pending" },
        { value: "DELETED", label: "Deleted" },
      ],
      permissionScope: [
        { value: "ALL", label: "All — any record" },
        { value: "OWN", label: "Own — user's own records" },
        { value: "TEAM", label: "Team — user's team records" },
        { value: "ORG", label: "Org — user's org records" },
      ],
    }
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { UserManagementService } from "./user-management.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { 
  getUsersSwaggerMetadata, 
  createUserSwaggerMetadata, 
  updateUserSwaggerMetadata, 
  deleteUserSwaggerMetadata 
} from "./user-management.swagger";

@Controller("users")
export class UserManagementController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly service: UserManagementService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  @Get()
  @getUsersSwaggerMetadata()
  getUsers(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("type") type?: string
  ) {
    const userId = 1;
    try {
      const data = this.service.getUsers(Number(page), Number(limit), type);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "UserManagementController",
          messageData: "Users retrieved",
        }),
      });
      return data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "UserManagementController",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Post()
  @createUserSwaggerMetadata()
  addUser(@Body() data: CreateUserDto) {
    const userId = 1;
    try {
      const result = this.service.createUser(data);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "UserManagementController",
          messageData: "Operation successful",
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "UserManagementController",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Put(":id")
  @updateUserSwaggerMetadata()
  updateUser(@Param("id") id: number, @Body() data: UpdateUserDto) {
    const userId = 1;
    try {
      const result = this.service.updateUser(Number(id), data);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "UserManagementController",
          messageData: "Operation successful",
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "UserManagementController",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Delete(":id")
  @deleteUserSwaggerMetadata()
  deleteUser(@Param("id") id: number) {
    const userId = 1;
    try {
      const result = this.service.deleteUser(Number(id));
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "UserManagementController",
          messageData: "Operation successful",
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "UserManagementController",
          messageData: error,
        }),
      });
      throw error;
    }
  }
}

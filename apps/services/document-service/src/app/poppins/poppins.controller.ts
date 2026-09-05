import { Controller, ForbiddenException, Get, HttpStatus, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { PoppinsService } from "./poppins.service";
import {
  errorMessages,
  successMessage,
} from "../../../../../service-lib/src/lib/messages";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { JwtService } from "@nestjs/jwt";

@Controller("poppins-access-url")
export class PoppinsController {
  constructor(private readonly poppinsService: PoppinsService, private readonly jwtService: JwtService) {}

  @Get()
  async getPoppinsAccessUrl(@Req() req: Request, @Res() res: Response) {
    try {
      // Get user email from request headers
      // console.log("Request headers:", req.user);
      
      const token = req?.headers?.authorization.split(" ")[1];
      const decodedUser = this.jwtService.verify(token, {
        secret: ENV.JWT_SECRET,
      });
      const emailId = decodedUser.userDetails.emailId as string;
      if (!emailId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: "User email not found in request",
        });
      }

      const magicUrl = await this.poppinsService.getMagicUrl(emailId);

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Magic URL generated successfully",
        data: { magicUrl },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
        });
      } else{
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate magic URL",
      });
      }
      
    }
  }
}

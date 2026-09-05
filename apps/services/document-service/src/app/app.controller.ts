import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
// import {
//   createResponse,
//   handleErrorResponse,
// } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";

@Controller("document")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }
}

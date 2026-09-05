import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: "Common Service API running successfully.." };
  }
}

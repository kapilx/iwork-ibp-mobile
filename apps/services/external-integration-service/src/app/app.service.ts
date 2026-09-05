import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: "External Integration Service API running successfully.." };
  }

  getHealth(): { status: string; timestamp: string } {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}

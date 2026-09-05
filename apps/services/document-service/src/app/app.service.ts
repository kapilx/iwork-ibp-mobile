import { Injectable } from '@nestjs/common';


@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Document API Service running Successfully..' };
  }
}

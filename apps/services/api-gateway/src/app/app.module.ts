import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TraceIdInterceptor } from './trace-id.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    HttpModule,
    JwtModule,
    InsuranceWellnessHubServiceLibModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceIdInterceptor,
    },
  ],
})
export class AppModule {}

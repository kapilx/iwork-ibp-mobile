/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ENV } from  '../../service-lib/src/lib/environment.ts';
import { setupSwagger } from '../../service-lib/src/lib/swagger.ts';//import global swagger setup from service-lib


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = ENV.PORT_MASTER_DATA_SERVICE || 3014;
  console.log("ENV.PORT_MASTER_DATA_SERVICE", ENV.PORT_MASTER_DATA_SERVICE);
  console.log("process.env.PORT", port);
  // Set up Swagger documentation for the Master Data Service
  setupSwagger(app, 'Master Data Service');
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();

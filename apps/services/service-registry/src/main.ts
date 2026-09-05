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
  const globalPrefix = 'service-registry';
  app.setGlobalPrefix(globalPrefix);
  const port = ENV.PORT_SERVICE_REGISTRY || 3002;
  console.log("ENV.PORT_SERVICE_REGISTRY", ENV.PORT_SERVICE_REGISTRY);
  console.log("process.env.PORT", port);
  // Set up Swagger documentation for the Service Registry
  setupSwagger(app, 'Service Registry');
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();

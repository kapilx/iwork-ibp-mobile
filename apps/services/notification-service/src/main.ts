/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { ENV } from '../../service-lib/src/lib/environment.ts';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  const port = ENV.PORT_NOTIFICATION_SERVICE ? parseInt(ENV.PORT_NOTIFICATION_SERVICE, 10) : 3015;
  await commonBootstrap.bootstrap(port, AppModule, 'Notification Service', gatewayUrl, 'notification-service');
}

bootstrap();

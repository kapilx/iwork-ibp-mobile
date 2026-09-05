
import { AppModule } from './app/app.module';
import { ENV } from '../../service-lib/src/lib/environment.ts';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';//import global bootstrap setup from service-lib


async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  const port = ENV.PORT_API_GATEWAY ? parseInt(ENV.PORT_API_GATEWAY, 10) : 3000;
  await commonBootstrap.bootstrap(port, AppModule, 'API Gateway', gatewayUrl, 'api-gateway');
}

bootstrap();


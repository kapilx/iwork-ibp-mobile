
import { AppModule } from './app/app.module';
import { ENV } from '../../service-lib/src/lib/environment.ts';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';//import global bootstrap setup from service-lib


async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const port = ENV.PORT_IBP_SERVICE ? parseInt(ENV.PORT_IBP_SERVICE, 10) : 3017;
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  await commonBootstrap.bootstrap(port, AppModule, 'Ibp Service', gatewayUrl, 'ibp-service');
}

bootstrap();

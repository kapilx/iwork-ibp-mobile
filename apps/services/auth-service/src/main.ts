import { AppModule } from './app/app.module';
import { ENV } from '../../service-lib/src/lib/environment';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';//import global bootstrap setup from service-lib


async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  const port = ENV.PORT_AUTH_SERVICE ? parseInt(ENV.PORT_AUTH_SERVICE, 10) : 3003;
  await commonBootstrap.bootstrap(port, AppModule, 'Auth Service', gatewayUrl, 'auth-service');
}

bootstrap();

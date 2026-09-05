import { AppModule } from './app/app.module';
import { ENV } from '../../service-lib/src/lib/environment.ts';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';//import global bootstrap setup from service-lib


async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const port = ENV.PORT_ORG_SERVICE ? parseInt(ENV.PORT_ORG_SERVICE, 10) : 3023;
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  await commonBootstrap.bootstrap(port, AppModule, 'Organization Service', gatewayUrl, "org-service");
}

bootstrap();


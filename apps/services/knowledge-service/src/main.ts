import { AppModule } from './app/app.module';
import { ENV } from '../../service-lib/src/lib/environment.ts';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  const port = ENV.PORT_KNOWLEDGE_SERVICE ? parseInt(ENV.PORT_KNOWLEDGE_SERVICE, 10) : 3035;
  await commonBootstrap.bootstrap(port, AppModule, 'Knowledge Service', gatewayUrl, 'knowledge-service');
}

bootstrap();

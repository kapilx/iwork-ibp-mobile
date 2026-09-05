import { AppModule } from './app/app.module';
import { CommonBootstrap } from '../../service-lib/src/lib/common-bootstrap';
import { ENV } from '../../service-lib/src/lib/environment';

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  const port = ENV.PORT_AI_SERVICE ? parseInt(ENV.PORT_AI_SERVICE, 10) : 3010;
  await commonBootstrap.bootstrap(port, AppModule, 'AI Service', gatewayUrl, 'ai-service');
}
bootstrap();



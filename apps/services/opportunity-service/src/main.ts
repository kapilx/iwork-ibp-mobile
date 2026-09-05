/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { AppModule } from "./app/app.module";
import { ENV } from "../../service-lib/src/lib/environment.ts";
import { CommonBootstrap } from "../../service-lib/src/lib/common-bootstrap"; // import global bootstrap setup from service-lib

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const port = ENV.PORT_OPPORTUNITY_SERVICE
    ? parseInt(ENV.PORT_OPPORTUNITY_SERVICE, 10)
    : 3016;
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  await commonBootstrap.bootstrap(port, AppModule, "Opportunity Service", gatewayUrl, 'opportunity-service');
}

bootstrap();

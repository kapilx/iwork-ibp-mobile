/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { AppModule } from "./app/app.module";
import { ENV } from "../../service-lib/src/lib/environment.ts";
import { CommonBootstrap } from "../../service-lib/src/lib/common-bootstrap"; //import global swagger setup from service-lib

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  const port = ENV.PORT_DOCUMENT_SERVICE
    ? parseInt(ENV.PORT_DOCUMENT_SERVICE, 10)
    : 3013;
  await commonBootstrap.bootstrap(
    port,
    AppModule,
    "Document Service",
    gatewayUrl,
    "document-service"
  );
}

bootstrap();

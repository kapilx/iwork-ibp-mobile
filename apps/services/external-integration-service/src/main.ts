import { AppModule } from "./app/app.module";
import { ENV } from "../../service-lib/src/lib/environment";
import { CommonBootstrap } from "../../service-lib/src/lib/common-bootstrap";

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const port = ENV.PORT_EXTERNAL_INTEGRATION_SERVICE
    ? parseInt(ENV.PORT_EXTERNAL_INTEGRATION_SERVICE, 10)
    : 3027;
  const gatewayUrl = ENV.URL_API_GATEWAY as string;
  await commonBootstrap.bootstrap(
    port,
    AppModule,
    "External Integration Service",
    gatewayUrl,
    "external-integration-service",
  );
}

bootstrap();

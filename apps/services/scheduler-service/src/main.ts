import { AppModule } from "./app/app.module";
import { ENV } from "../../service-lib/src/lib/environment";
import { CommonBootstrap } from "../../service-lib/src/lib/common-bootstrap"; //import global bootstrap setup from service-lib

async function bootstrap() {
  const commonBootstrap = new CommonBootstrap();
  const port = ENV.PORT_SCHEDULER_SERVICE
    ? parseInt(ENV.PORT_SCHEDULER_SERVICE, 10)
    : 3019;
  const gatewayUrl = ENV.URL_API_GATEWAY ?? "http://localhost:3000";
  await commonBootstrap.bootstrap(
    port,
    AppModule,
    "Scheduler Service",
    gatewayUrl,
    "scheduler-service"
  );
}

bootstrap();

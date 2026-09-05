import { Module, OnModuleInit, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SimpleAuthModule } from "./simple-auth/simple-auth.module";
import { GoogleOAuthModule } from "./google-oauth/google-oauth.module";
import { MsOAuthModule } from "./ms-oauth/ms-oauth.module";
import { PhoneOtpModule } from "./phone-otp/phone-otp.module";
import { EmailOtpModule } from "./email-otp/email-otp.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "../guards/auth.guard";
import { RolesGuard } from "../guards/role.guard";
import { typeOrmConfig } from "../../../service-lib/src/lib/database/typeorm.config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessControlModule } from "./access-control-list/access-control-list.module";
import { UserManagementModule } from './user-management/user-management.module';
import { ServiceRegistrationService } from "../../../service-lib/src/lib/service-communication";
import { ENV } from "../../../service-lib/src/lib/environment";
import { getAccessTokenExpiry } from "./token.constants";
import { InsuranceWellnessHubServiceLibModule } from "../../../service-lib/src/lib/service-lib.module";
import { AuthProtectionModule, AuthProtectionInterceptor } from "../../../service-lib/src/lib/auth-protection";
import { AuthVersionService } from "../../../service-lib/src/lib/auth-version/auth-version.service";
import { User, UserRole } from "../../../service-lib/src/lib/entities";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, UserRole]), // Add entities for AuthVersionService
    SimpleAuthModule,
    GoogleOAuthModule.forRoot(),
    MsOAuthModule.forRoot(),
    PhoneOtpModule,
    EmailOtpModule,
    JwtModule.register({
      global: true,
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: getAccessTokenExpiry() },
    }),
    AccessControlModule,
    UserManagementModule,
    InsuranceWellnessHubServiceLibModule,
    AuthProtectionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ServiceRegistrationService,
    AuthGuard,
    RolesGuard,
    AuthVersionService, // Add AuthVersionService
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthProtectionInterceptor,
    },
  ],
  exports: [AuthGuard, AppModule, RolesGuard, AuthVersionService], // Export AuthVersionService
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistrationService: ServiceRegistrationService
  ) {}

  async onModuleInit() {
    const serviceInfo = {
      name: "auth-service",
      url: `${ENV.URL_AUTH_SERVICE}`,
      port: ENV.PORT_AUTH_SERVICE,
      healthCheck: "/health",
      status: "active",
    };
    await this.serviceRegistrationService.registerService(serviceInfo);
  }
}

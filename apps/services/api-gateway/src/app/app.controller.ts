import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import type { Request, Response } from "express";
import {
  Param,
  Req,
  Res,
  All,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "../../../service-lib/src/lib/auth.guard";
import { AclGuard } from "../../../service-lib/src/lib/acl.guard";
import axios from "axios";
import { ENV } from "../../../service-lib/src/lib/environment";
import { iirm, serviceNames } from "../../../service-lib/src/lib/constants";
import { TraceIdService } from "../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../service-lib/src/lib/utils/logger.util";
import { PassThrough } from "stream";
import { ApiTags } from "@nestjs/swagger";
import {
  GetDataSwagger,
  RegisterServiceSwagger,
  SwaggerDocsProxySwagger,
  ProxyFileUploadSwagger,
  ProxyFileDownloadSwagger,
  DownloadFaqTemplateSwagger,
  ExportFaqsSwagger,
  ProxyHospitalExportSwagger,
  ProxyHospitalTemplateSwagger,
  GenericProxySwagger,
} from "./app.swagger";

@ApiTags("API Gateway")
@Controller("iirm")
export class AppController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly appService: AppService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.API_GATEWAY);
  }

  @Get()
  @GetDataSwagger()
  getData() {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "getData",
        messageData: "method invoked",
      }),
    });
    return this.appService.getData();
  }

  @Post("register")
  @RegisterServiceSwagger()
  async registerService(@Body() serviceData: any) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "registerService",
        payload: serviceData,
        messageData: "method invoked",
      }),
    });
    try {
      const registeredData = await this.appService.registerService(serviceData);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "registerService",
          payload: serviceData,
          messageData: "Service registered",
        }),
      });
      return registeredData;
    } catch (error: any) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "registerService",
          payload: serviceData,
          messageData: error.message || "Service unavailable",
        }),
      });
      throw new HttpException(
        error.message || "Service unavailable",
        error.status || HttpStatus.BAD_GATEWAY
      );
    }
  }

  @Get(":service/api/docs*")
  @SwaggerDocsProxySwagger()
  async swaggerDocs(
    @Param("service") serviceName: string,
    @Req() request: Request
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "swaggerDocs",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const username = ENV.SWAGGER_USERNAME;
      const password = ENV.SWAGGER_PASSWORD;
      const Authorization = `Basic ${Buffer.from(
        `${username}:${password}`
      ).toString("base64")}`;
      const response = await axios.get(`${serviceUrl}${path}`, {
        headers: {
          Authorization: Authorization,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });
      response.data = response.data.replace(
        /href="\.\/docs\/swagger-ui\.css"/g,
        `href="${ENV.URL_API_GATEWAY}/api/docs/swagger-ui.css"`
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "swaggerDocs",
          payload: { serviceName, url: request.url },
          messageData: "swagger response sent",
        }),
      });
      return response.data;
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "swaggerDocs",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @All(":service/file-upload/upload*")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async fileUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "fileUpload",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers: {
          ...headers,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });
      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: "file upload proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @All(":service/company-employee/file-upload/upload*")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async companyEmployeeFileUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    return this.fileUpload(serviceName, request, response);
  }

  @All(":service/pdf-analyser/cover")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async coverUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "fileUpload",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers: {
          ...headers,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });
      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: "file upload proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }


  @All(":service/pdf-analyser/policy-configurator")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async policyConfigDocUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "fileUpload",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers: {
          ...headers,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });
      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: "file upload proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @All(":service/pdf-analyser/policy-details")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async policyDetailsDocUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "fileUpload",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers: {
          ...headers,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });
      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: "file upload proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "fileUpload",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @Get(":service/portal-configuration/:policyId/faq/template/download")
  @UseGuards(AuthGuard, AclGuard)
  @DownloadFaqTemplateSwagger()
  async downloadFaqTemplate(
    @Param("service") serviceName: string,
    @Param("policyId") policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "downloadFaqTemplate",
        payload: { serviceName },
        messageData: "method invoked",
      }),
    });

    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const downloadUrl = `${serviceUrl}/portal-configuration/${policyId}/faq/template/download`;
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");

      const { host, "content-length": _, ...safeHeaders } = req.headers;

    
      if (req.user?.userDetails?.userId) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      const response = await axios.get(downloadUrl, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });

      // Pipe all headers from the microservice response
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      response.data.pipe(res);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "downloadFaqTemplate",
          payload: { serviceName },
          messageData: "faq template downloaded",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "downloadFaqTemplate",
          payload: { serviceName },
          messageData: error.message || "Service unavailable",
        }),
      });

      if (
        responseData &&
        error.response?.headers?.["content-type"]?.includes("application/json")
      ) {
        res.status(statusCode).json(responseData);
      } else {
        res
          .status(statusCode)
          .send(
            responseData || "Failed to download faq template from service"
          );
      }
    }
  }

  @Get(":service/portal-configuration/faq/:policyId/download")
  @UseGuards(AuthGuard, AclGuard)
  @ExportFaqsSwagger()
  async exportFaqs(
    @Param("service") serviceName: string,
    @Param("policyId") policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "exportFaqs",
        payload: { serviceName },
        messageData: "method invoked",
      }),
    });

    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const downloadUrl = `${serviceUrl}/portal-configuration/faq/${policyId}/download`;
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");

      const { host, "content-length": _, ...safeHeaders } = req.headers;

    
      if (req.user?.userDetails?.userId) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      const response = await axios.get(downloadUrl, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });

      // Pipe all headers from the microservice response
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      response.data.pipe(res);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "exportFaqs",
          payload: { serviceName },
          messageData: "faq exported",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "exportFaqs",
          payload: { serviceName },
          messageData: error.message || "Service unavailable",
        }),
      });

      if (
        responseData &&
        error.response?.headers?.["content-type"]?.includes("application/json")
      ) {
        res.status(statusCode).json(responseData);
      } else {
        res
          .status(statusCode)
          .send(
            responseData || "Failed to export FAQs from service"
          );
      }
    }
  }

  @Get(":service/file-upload/:documentId/download")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileDownloadSwagger("documentId")
  async proxyFileDownloadFile(
    @Param("service") serviceName: string,
    @Param("documentId") documentId: bigint,
    @Req() req: Request,
    @Res() res: Response
  ) {
    return this.handleFileDownloadProxy(serviceName, documentId, req, res);
  }

  @Get(":service/company-employee/file-upload/:documentId/download")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileDownloadSwagger("documentId")
  async proxyCompanyEmployeeFileDownload(
    @Param("service") serviceName: string,
    @Param("documentId") documentId: bigint,
    @Req() req: Request,
    @Res() res: Response
  ) {
    return this.handleFileDownloadProxy(serviceName, documentId, req, res);
  }

  @Post(":service/report/download/:report")
  @UseGuards(AuthGuard, AclGuard)
  async proxyReportDownload(
    @Param("service") serviceName: string,
    @Param("report") report: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Reports can return protected binary files; use a streaming proxy to preserve headers and data.
    return this.handleReportDownloadProxy(serviceName, report, req, res, body);
  }

  @Post(":service/file-upload/bulk-download")
  @UseGuards(AuthGuard, AclGuard)
  async proxyBulkFileDownloadZip(
    @Param("service") serviceName: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.handleBulkZipDownloadProxy(serviceName, req, res, body);
  }

  @Post(":service/company-employee/file-upload/bulk-download")
  @UseGuards(AuthGuard, AclGuard)
  async proxyCompanyEmployeeBulkFileDownloadZip(
    @Param("service") serviceName: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.handleBulkZipDownloadProxy(serviceName, req, res, body);
  }

  @Get(":service/auth-config/file-upload/:documentId/download")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileDownloadSwagger("documentId")
  async proxyAuthConfigFileDownload(
    @Param("service") serviceName: string,
    @Param("documentId") documentId: bigint,
    @Req() req: Request,
    @Res() res: Response
  ) {
    return this.handleFileDownloadProxy(serviceName, documentId, req, res);
  }

  private async handleReportDownloadProxy(
    serviceName: string,
    report: string,
    req: Request,
    res: Response,
    body: any,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "handleReportDownloadProxy",
        payload: { serviceName, report, path: req.url },
        messageData: "method invoked",
      }),
    });

    try {
      // Stream the downstream response to avoid corrupting binary content (xlsx/zip).
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");
      const downloadUrl = `${serviceUrl}${path}`;
      const { host, "content-length": _, ...safeHeaders } = req.headers;

      if (req.user) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      const response = await axios.post(downloadUrl, body, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
          "Content-Type": "application/json",
        },
      });

      res.status(response.status);
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      response.data.pipe(res);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "handleReportDownloadProxy",
          payload: { serviceName, report },
          messageData: "report download proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "handleReportDownloadProxy",
          payload: { serviceName, report },
          messageData: error.message || "Service unavailable",
        }),
      });

      const contentType = error.response?.headers?.["content-type"];
      const isStream = (value: any) =>
        value && typeof value.pipe === "function";

      if (responseData) {
        if (isStream(responseData)) {
          res.status(statusCode);
          return responseData.pipe(res);
        }

        if (contentType?.includes("application/json")) {
          try {
            return res.status(statusCode).json(responseData);
          } catch {
            // fall through to send below
          }
        }

        const payload =
          typeof responseData === "string" || Buffer.isBuffer(responseData)
            ? responseData
            : error.message ||
              "Failed to download file from downstream service";
        return res.status(statusCode).send(payload);
      }

      res
        .status(statusCode)
        .send(
          responseData || "Failed to download file from downstream service",
        );
    }
  }

  private async handleFileDownloadProxy(
    serviceName: string,
    documentId: bigint,
    req: Request,
    res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "proxyFileDownload",
        payload: { serviceName, documentId, path: req.url },
        messageData: "method invoked",
      }),
    });

    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");
      const downloadUrl = `${serviceUrl}${path}`;
      const { host, "content-length": _, ...safeHeaders } = req.headers;

      // Attach user ID header if available
      if (req.user) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      // Perform streaming request to the microservice
      const response = await axios.get(downloadUrl, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });

      // Pipe all headers from the microservice response
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Pipe the response stream to client
      response.data.pipe(res);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "proxyFileDownload",
          payload: { serviceName, documentId },
          messageData: "file download proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "proxyFileDownload",
          payload: { serviceName, documentId },
          messageData: error.message || "Service unavailable",
        }),
      });

      const contentType = error.response?.headers?.["content-type"];
      const isStream = (value: any) => value && typeof value.pipe === "function";

      if (responseData) {
        if (isStream(responseData)) {
          res.status(statusCode);
          return responseData.pipe(res);
        }

        if (contentType?.includes("application/json")) {
          try {
            return res.status(statusCode).json(responseData);
          } catch {
            // fall through to send below
          }
        }

        const payload =
          typeof responseData === "string" || Buffer.isBuffer(responseData)
            ? responseData
            : error.message || "Failed to download file from downstream service";
        return res.status(statusCode).send(payload);
      }

      res
        .status(statusCode)
        .send(
          responseData || "Failed to download file from downstream service"
        );
    }
  }

  private async handleBulkZipDownloadProxy(
    serviceName: string,
    req: Request,
    res: Response,
    body: any,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "handleBulkZipDownloadProxy",
        payload: { serviceName, documentIds: body?.documentIds },
        messageData: "method invoked",
      }),
    });

    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");
      const downloadUrl = `${serviceUrl}${path}`;
      const { host, "content-length": _, ...safeHeaders } = req.headers;

      // Attach user ID header if available
      if (req.user) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      // Perform streaming POST request to the microservice
      const response = await axios.post(downloadUrl, body, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
          "Content-Type": "application/json",
        },
      });

      // Set status from downstream
      res.status(response.status);

      // Forward only whitelisted headers from the microservice response
      const allowedHeaders = [
        "content-type",
        "content-disposition",
        "content-length",
        "access-control-expose-headers",
      ];
      allowedHeaders.forEach((header) => {
        const value = response.headers[header];
        if (value) {
          res.setHeader(header, value);
        }
      });

      // Pipe the response stream to client
      response.data.pipe(res);

      // Handle streaming errors
      response.data.on("error", (streamError: any) => {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "AppController",
            method: "handleBulkZipDownloadProxy",
            payload: { serviceName, documentIds: body?.documentIds },
            messageData: `Stream error: ${streamError.message}`,
          }),
        });
        if (res.headersSent) {
          res.end();
        }
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "handleBulkZipDownloadProxy",
          payload: { serviceName, documentIds: body?.documentIds },
          messageData: "bulk ZIP download proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "handleBulkZipDownloadProxy",
          payload: {
            serviceName,
            documentIds: body?.documentIds,
            errorCode: error.code,
            errorStatus: error.response?.status,
            errorUrl: error.config?.url,
          },
          messageData: error.message || "Service unavailable",
        }),
      });

      // If headers already sent (streaming started), can't throw exception
      if (res.headersSent) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "AppController",
            method: "handleBulkZipDownloadProxy",
            payload: { serviceName, documentIds: body?.documentIds },
            messageData:
              "Error occurred after streaming started, ending response",
          }),
        });
        res.end();
        return;
      }

      const contentType = error.response?.headers?.["content-type"];
      const isStream = (value: any) =>
        value && typeof value.pipe === "function";

      if (responseData) {
        if (isStream(responseData)) {
          res.status(statusCode);
          return responseData.pipe(res);
        }

        if (contentType?.includes("application/json")) {
          try {
            return res.status(statusCode).json(responseData);
          } catch {
            // fall through to send below
          }
        }

        const payload =
          typeof responseData === "string" || Buffer.isBuffer(responseData)
            ? responseData
            : error.message || "Failed to download ZIP from downstream service";
        return res.status(statusCode).send(payload);
      }

      res
        .status(statusCode)
        .send(responseData || "Failed to download ZIP from downstream service");
    }
  }

  @All(":service/password-protection-config*")
  async proxyPasswordProtectionConfig(
    @Param("service") serviceName: string,
    @Req() request: Request,
  ) {
    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;

      const safeHeaders = { ...request.headers };
      delete safeHeaders["content-length"];
      delete safeHeaders["host"];
      // Avoid downstream 304 responses turning into gateway exceptions.
      delete safeHeaders["if-none-match"];
      delete safeHeaders["if-modified-since"];

      const response = await axios({
        method: request.method,
        url: targetUrl,
        data: request.body,
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new HttpException(
          response.data || { message: "Service unavailable" },
          response.status,
        );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "proxyPasswordProtectionConfig",
          payload: { serviceName, url: request.url },
          messageData: "Password protection config request success",
        }),
      });

      return response.data;
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "proxyPasswordProtectionConfig",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode,
      );
    }
  }

  @Get(":service/portal-configuration/policies/:policyId/hospitals/export")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyHospitalExportSwagger()
  async proxyHospitalExport(
    @Param("service") serviceName: string,
    @Param("policyId") policyId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "proxyHospitalExport",
        payload: { serviceName, policyId, query: req.query },
        messageData: "method invoked",
      }),
    });

    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;

      const { host, "content-length": _, ...safeHeaders } = req.headers;
      if (req.user?.userDetails?.userId) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      const response = await axios.get(targetUrl, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });

      res.status(response.status);
      Object.entries(response.headers).forEach(([key, value]) => {
        if (!value) {
          return;
        }
        const headerValue = Array.isArray(value) ? value.join(",") : value;
        res.setHeader(key, headerValue);
      });

      response.data.pipe(res);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "proxyHospitalExport",
          payload: { serviceName, policyId },
          messageData: "hospital export proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "proxyHospitalExport",
          payload: { serviceName, policyId },
          messageData: error.message || "Service unavailable",
        }),
      });

      if (
        responseData &&
        error.response?.headers?.["content-type"]?.includes("application/json")
      ) {
        res.status(statusCode).json(responseData);
      } else {
        res
          .status(statusCode)
          .send(
            responseData || "Failed to export hospitals from downstream service"
          );
      }
    }
  }

  @Get(":service/portal-configuration/hospitals/template")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyHospitalTemplateSwagger()
  async proxyHospitalTemplate(
    @Param("service") serviceName: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "proxyHospitalTemplate",
        payload: { serviceName },
        messageData: "method invoked",
      }),
    });

    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = req.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;

      const { host, "content-length": _, ...safeHeaders } = req.headers;
      if (req.user?.userDetails?.userId) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      const response = await axios.get(targetUrl, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });

      res.status(response.status);
      Object.entries(response.headers).forEach(([key, value]) => {
        if (!value) {
          return;
        }
        const headerValue = Array.isArray(value) ? value.join(",") : value;
        res.setHeader(key, headerValue);
      });

      response.data.pipe(res);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "proxyHospitalTemplate",
          payload: { serviceName },
          messageData: "hospital template proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "proxyHospitalTemplate",
          payload: { serviceName },
          messageData: error.message || "Service unavailable",
        }),
      });

      if (
        responseData &&
        error.response?.headers?.["content-type"]?.includes("application/json")
      ) {
        res.status(statusCode).json(responseData);
      } else {
        res
          .status(statusCode)
          .send(
            responseData || "Failed to download hospital template from service"
          );
      }
    }
  }
  @Get(":service/knowledge/:documentId/download")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileDownloadSwagger("documentId")
  async proxyFileDownload(
    @Param("service") serviceName: string,
    @Param("documentId") documentId: bigint,
    @Req() req: Request,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "proxyFileDownload",
        payload: { serviceName, documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);

      const downloadUrl = `${serviceUrl}/knowledge/${documentId}/download`;
      const { host, "content-length": _, ...safeHeaders } = req.headers;

      // Attach user ID header if available
      if (req.user) {
        safeHeaders["userid"] = req.user.userDetails.userId;
      }

      // Perform streaming request to the microservice
      const response = await axios.get(downloadUrl, {
        responseType: "stream",
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
      });

      // Pipe all headers from the microservice response
      Object.entries(response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Pipe the response stream to client
      response.data.pipe(res);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "proxyFileDownload",
          payload: { serviceName, documentId },
          messageData: "file download proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "proxyFileDownload",
          payload: { serviceName, documentId },
          messageData: error.message || "Service unavailable",
        }),
      });

      if (
        responseData &&
        error.response?.headers?.["content-type"]?.includes("application/json")
      ) {
        res.status(statusCode).json(responseData);
      } else {
        res
          .status(statusCode)
          .send(
            responseData || "Failed to download file from downstream service"
          );
      }
    }
  }

  @All(":service/knowledge/file*")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async knowledgeCentralFileUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "knowledgeCentralFileUpload",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers: {
          ...headers,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });

      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "knowledgeCentralFileUpload",
          payload: { serviceName, url: request.url },
          messageData: "file upload proxied",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "knowledgeCentralFileUpload",
          payload: { serviceName, url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @Post(":service/business-card/upload*")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async businessCardFileUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers,
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });

      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @Post(":service/claim-form/extract*")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async claimFormFileUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }
      delete headers["content-length"];
      delete headers["host"];

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers,
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true,
      });

      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }
      axiosResponse.data.pipe(response);
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        { statusCode, message: error.message || "Service unavailable" },
        statusCode
      );
    }
  }

  @Post(":service/pdf-analyser/upload*")
  @UseGuards(AuthGuard, AclGuard)
  @ProxyFileUploadSwagger()
  async pdfAnalyserFileUpload(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    try {
      const headers = { ...request.headers };
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      // Inject userId into headers if available
      if (request.user?.userDetails?.userId) {
        headers["userid"] = String(request.user.userDetails.userId);
      }

      // Remove content-length because we are re-streaming
      delete headers["content-length"];
      delete headers["host"];

      // Create a pass-through stream to forward the request body

      const passthrough = new PassThrough();
      request.pipe(passthrough);
      const axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        headers,
        data: passthrough,
        responseType: "stream",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true, // allow non-2xx
      });

      // Set response headers and status
      response.status(axiosResponse.status);
      for (const [key, value] of Object.entries(axiosResponse.headers)) {
        if (value) {
          response.setHeader(key, value.toString());
        }
      }

      // Pipe the response stream to the client
      axiosResponse.data.pipe(response);
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData = error.response?.data;
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }

  @All("strapi-cms-service/*")
  @GenericProxySwagger()
  async cmsProxyRequest(@Req() request: Request, @Res() response: Response) {
    const isCmsProxyDebugEnabled =
      process.env.API_GATEWAY_CMS_PROXY_DEBUG === "true";

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "cmsProxyRequest",
        payload: { url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const serviceUrl = await this.appService.getServiceUrl("strapi-cms-service");
      // Remove /iirm/strapi-cms-service prefix to get the actual path for Strapi
      const strippedPath = request.url.replace('/iirm/strapi-cms-service', '');
      const isAdminRoute = strippedPath.startsWith("/admin");
      const path = isAdminRoute ? request.url : strippedPath;
      let targetUrl = `${serviceUrl}${path}`;
      console.log("CMS Proxy - Target URL:", targetUrl);

      const cmsGatewayPrefix = `/${iirm}/strapi-cms-service`;
      const strapiServiceHost = (() => {
        try {
          return new URL(serviceUrl).hostname;
        } catch {
          return "";
        }
      })();
      const rewriteLocationHeader = (rawLocation: string): string => {
        try {
          const parsedLocation = new URL(rawLocation, serviceUrl);
          const isInternalHost =
            parsedLocation.hostname === strapiServiceHost || rawLocation.startsWith("/");
          if (!isInternalHost) return rawLocation;

          const normalizedPath = parsedLocation.pathname.startsWith("/")
            ? parsedLocation.pathname
            : `/${parsedLocation.pathname}`;
          const gatewayPath = normalizedPath.startsWith(cmsGatewayPrefix)
            ? normalizedPath
            : `${cmsGatewayPrefix}${normalizedPath}`;

          // Keep redirect relative so browser always uses the current public host.
          const rewrittenLocation = `${gatewayPath}${parsedLocation.search}${parsedLocation.hash}`;
          if (isCmsProxyDebugEnabled && rewrittenLocation !== rawLocation) {
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "AppController",
                method: "cmsProxyRequest",
                payload: {
                  originalLocation: rawLocation,
                  rewrittenLocation,
                },
                messageData: "Rewrote upstream Location header for browser-safe redirect",
              }),
            });
          }
          return rewrittenLocation;
        } catch {
          return rawLocation;
        }
      };
      
      
      if (isCmsProxyDebugEnabled) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "AppController",
            method: "cmsProxyRequest",
            payload: { 
              originalUrl: request.url,
              strippedPath,
              forwardedPath: path,
              targetUrl: targetUrl 
            },
            messageData: "URL transformation for Strapi",
          }),
        });
      }
      
      const { host, "content-length": _, ...safeHeaders } = request.headers;

      let axiosResponse = await axios({
        method: request.method,
        url: targetUrl,
        data: request.body,
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        responseType: "stream",
        // Preserve upstream redirects/cookies exactly as-is (critical for Strapi SSO).
        maxRedirects: 0,
        validateStatus: () => true,
      });

      // Compatibility fallback:
      // try mounted admin path first; if that environment uses /admin internally, retry with /admin.
      if (isAdminRoute && axiosResponse.status === 404) {
        const internalAdminTargetUrl = `${serviceUrl}${strippedPath}`;
        if (isCmsProxyDebugEnabled) {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "AppController",
              method: "cmsProxyRequest",
              payload: {
                originalTargetUrl: targetUrl,
                fallbackTargetUrl: internalAdminTargetUrl,
              },
              messageData: "Retrying admin route with internal /admin path after 404",
            }),
          });
        }
        axiosResponse = await axios({
          method: request.method,
          url: internalAdminTargetUrl,
          data: request.body,
          headers: {
            ...safeHeaders,
            "X-Trace-Id": this.traceIdService.traceId,
          },
          responseType: "stream",
          maxRedirects: 0,
          validateStatus: () => true,
        });
        targetUrl = internalAdminTargetUrl;
      }

      response.status(axiosResponse.status);
      Object.entries(axiosResponse.headers).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key.toLowerCase() === "location") {
          const locationValue = Array.isArray(value) ? String(value[0]) : String(value);
          response.setHeader(key, rewriteLocationHeader(locationValue));
          return;
        }
        // Preserve multiple Set-Cookie headers. Converting to string breaks cookies.
        if (key.toLowerCase() === "set-cookie") {
          const cookies = Array.isArray(value) ? value.map(String) : [String(value)];
          response.setHeader(key, cookies);
          return;
        }
        response.setHeader(key, Array.isArray(value) ? value.map(String) : String(value));
      });

      axiosResponse.data.pipe(response);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "cmsProxyRequest",
          payload: { url: request.url },
          messageData: "Proxy success",
        }),
      });
    } catch (error: any) {
      const statusCode = error.response?.status || HttpStatus.BAD_GATEWAY;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "cmsProxyRequest",
          payload: { url: request.url },
          messageData: error.message || "Service unavailable",
        }),
      });
      
      // Handle streamed error responses
      if (error.response?.data && typeof error.response.data.pipe === 'function') {
        response.status(statusCode);
        Object.entries(error.response.headers || {}).forEach(([key, value]) => {
          if (value === undefined) return;
          if (key.toLowerCase() === "location") {
            const locationValue = Array.isArray(value) ? String(value[0]) : String(value);
            response.setHeader(key, rewriteLocationHeader(locationValue));
            return;
          }
          if (key.toLowerCase() === "set-cookie") {
            const cookies = Array.isArray(value) ? value.map(String) : [String(value)];
            response.setHeader(key, cookies);
            return;
          }
          response.setHeader(key, Array.isArray(value) ? value.map(String) : String(value));
        });
        error.response.data.pipe(response);
        return;
      }
      
      // Handle JSON error responses
      response.status(statusCode).json({
        statusCode,
        message: error.message || "Service unavailable",
        error: error.response?.statusText || "Bad Gateway"
      });
    }
  }

  @All(":service/policy/:policyId/extension/documents*")
  @UseGuards(AuthGuard, AclGuard)
  async proxyPolicyExtensionDocuments(
    @Param("service") serviceName: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    return this.fileUpload(serviceName, request, response);
  }

  @All(":service/*")
  @UseGuards(AuthGuard, AclGuard)
  @GenericProxySwagger()
  async proxyRequest(
    @Param("service") serviceName: string,
    @Req() request: Request
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "AppController",
        method: "proxyRequest",
        payload: { serviceName, url: request.url },
        messageData: "method invoked",
      }),
    });
    try {
      const serviceUrl = await this.appService.getServiceUrl(serviceName);
      const path = request.url.replace(`/${iirm}/${serviceName}`, "");
      const targetUrl = `${serviceUrl}${path}`;
      const { host, "content-length": _, ...safeHeaders } = request.headers;
      // Avoid propagating browser cache validators to downstream services.
      // Some services return 304 with empty bodies, which should not break gateway flows.
      delete safeHeaders["if-none-match"];
      delete safeHeaders["if-modified-since"];
      if (request.user) {
        safeHeaders["userid"] = request.user.userDetails.userId;
      }
      const response = await axios({
        method: request.method,
        url: targetUrl,
        data: request.body,
        headers: {
          ...safeHeaders,
          "X-Trace-Id": this.traceIdService.traceId,
        },
        validateStatus: () => true,
      });

      if (response.status >= 400) {
        throw new HttpException(
          response.data || { message: "Service unavailable" },
          response.status,
        );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "AppController",
          method: "proxyRequest",
          payload: { serviceName, url: request.url },
          messageData: "Proxy success",
        }),
      });

      return response.data;
    } catch (error: any) {
      // `error` can be either of two shapes here, and reading only one of
      // them (as this code did before) silently loses the real downstream
      // status/body for the other — confirmed against a real HCL test
      // call, where "Policy number ... is not available in IIRM database."
      // was being replaced by a generic 502 message:
      //  (a) an HttpException WE threw above (response.status >= 400) —
      //      Nest's HttpException stores the exact body we passed as
      //      `error.response` DIRECTLY (not nested under `.data`) and the
      //      real status as `error.status` (not `error.response.status`).
      //  (b) a genuine axios rejection (network error/timeout/DNS
      //      failure) — here `error.response` is an axios response
      //      object, so the real body is `error.response.data` and the
      //      real status is `error.response.status`.
      // Deliberately not special-cased with an early `if (error instanceof
      // HttpException) throw error` — that would also skip the
      // logger.error call below for any unrelated HttpException thrown
      // earlier in this same try (e.g. getServiceUrl's "service not
      // registered"), silencing logging for cases that have nothing to do
      // with this fix. This instead always logs and always extracts the
      // correct status/body regardless of which shape `error` is.
      // .status/.response are declared `private` on HttpException, so the
      // public getStatus()/getResponse() accessors are used instead of
      // reading those fields directly.
      const isNestHttpException = error instanceof HttpException;
      const statusCode = isNestHttpException
        ? error.getStatus()
        : error.response?.status || HttpStatus.BAD_GATEWAY;
      const responseData =
        (isNestHttpException ? error.getResponse() : error.response?.data) || null;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "AppController",
          method: "proxyRequest",
          payload: { serviceName, url: request.url },
          messageData:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : error,
        }),
      });

      // Always throw HttpException (never a bare Error) so the client gets
      // a proper HTTP-shaped JSON body instead of a generic 500 with a
      // garbled message.
      if (responseData) {
        throw new HttpException(responseData, statusCode);
      }
      throw new HttpException(
        {
          statusCode,
          message: error.message || "Service unavailable",
        },
        statusCode
      );
    }
  }
}

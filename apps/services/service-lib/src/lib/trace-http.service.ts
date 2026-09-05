import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { TraceIdService } from './trace-id.service';

@Injectable()
export class TraceHttpService {
  constructor(
    private readonly httpService: HttpService,
    private readonly traceIdService: TraceIdService,
  ) {}

  async get<T>(url: string, config: AxiosRequestConfig = {}) {
    const headers = {
      'X-Trace-Id': this.traceIdService.traceId,
      ...(config.headers || {}),
    };
    return firstValueFrom(this.httpService.get<T>(url, { ...config, headers }));
  }

  async post<T>(url: string, data: any, config: AxiosRequestConfig = {}) {
    const headers = {
      'X-Trace-Id': this.traceIdService.traceId,
      ...(config.headers || {}),
    };
    return firstValueFrom(
      this.httpService.post<T>(url, data, { ...config, headers }),
    );
  }

  async put<T>(url: string, data: any, config: AxiosRequestConfig = {}) {
    const headers = {
      'X-Trace-Id': this.traceIdService.traceId,
      ...(config.headers || {}),
    };
    return firstValueFrom(
      this.httpService.put<T>(url, data, { ...config, headers }),
    );
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}) {
    const headers = {
      'X-Trace-Id': this.traceIdService.traceId,
      ...(config.headers || {}),
    };
    return firstValueFrom(
      this.httpService.delete<T>(url, { ...config, headers }),
    );
  }

  async patch<T>(url: string, data: any, config: AxiosRequestConfig = {}) {
    const headers = {
      'X-Trace-Id': this.traceIdService.traceId,
      ...(config.headers || {}),
    };
    return firstValueFrom(
      this.httpService.patch<T>(url, data, { ...config, headers }),
    );
  }
}

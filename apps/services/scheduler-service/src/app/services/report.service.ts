import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { DataSource, IsNull } from 'typeorm';
import { AdminReport, AdminReportParameter } from '../../../../service-lib/src/lib/entities';
import { ENV } from '../../../../service-lib/src/lib/environment';
import {
  applyPasswordProtection,
  generatePasswordFromConfig,
  isPasswordProtectionEnabled,
} from '../../../../service-lib/src/lib/utils/password-protection.utils';
import { FilePasswordConfigClient } from '../../../../service-lib/src/lib/service-communication/file-password-config-client';

@Injectable()
export class ReportService {
  constructor(private readonly dataSource: DataSource) {}

  private async getModulePasswordConfig(categoryKey: string): Promise<boolean> {
    try {
      const documentServiceUrl = ENV.URL_DOCUMENT_SERVICE || 'http://localhost:3013';
      const response = await axios.get(
        `${documentServiceUrl}/password-protection-config/${categoryKey}`,
        { timeout: 5000 },
      );
      const enablePassword = response?.data?.enablePassword;
      return Boolean(
        enablePassword === true ||
          enablePassword === 1 ||
          enablePassword === 'true',
      );
    } catch {
      return false;
    }
  }

  async getReportsList() {
    const repo = this.dataSource.getRepository(AdminReport);
    const reports = await repo.find({
      select: ['id', 'name', 'label'],
      where: { deletedAt: IsNull() },
      order: { orderNo: 'ASC' },
    });
    return reports;
  }

  async getReportDetails(reportId: string) {
    const repo = this.dataSource.getRepository(AdminReport);
    const report = await repo.findOne({
      where: { id: parseInt(reportId), deletedAt: IsNull() },
      relations: ['parameters','results']
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    report.parameters = report.parameters?.sort((a: { orderNo: number; }, b: { orderNo: number; }) => a.orderNo - b.orderNo);
    const parameters = await Promise.all((report.parameters || []).map(async (parameter) => {
      let options: { label: string; value: string; }[] = [];

      if (parameter.inputFieldType === 'SelectBox') {
        if (parameter.optionType === 'raw') {
          options = parameter.option.data;
        } else if (parameter.optionType === 'query') {
          const query = parameter.option.raw_query;
          options = await this.dataSource.query(query);
        }
      }
      return {
        name: parameter.parameterName,
        label: parameter.label,
        dataType: parameter.dataType,
        options: options || [],
      };
    }));
    const results = (report.results || []).map((result) => ({
      name: result.queryParameterName,
      label: result.label,
      dataType: result.dataType,
      alignment: result.alignment,
    }));
    return { endPoint: report.endPoint, parameterList: parameters, resultsList: results };
  }

  private buildQuery(
    rawQuery: string,
    params: Record<string, string>,
    parameterList: AdminReportParameter[],
  ): string {
    let query = rawQuery;
    parameterList.forEach((param) => {
      const key = param.queryParameter;
      const value = params[param.parameterName];
      query = query.replace(
        key,
        value === '#99#' || value === undefined || value === null
          ? `NULL`
          : `'${value}'`,
      );
    });
    return query;
  }

  async generateReport(
    reportName: string,
    params: Record<string, string>,
    options: { page: number; limit: number; sort?: string },
  ): Promise<{ data: any[]; count: number }> {
    const repo = this.dataSource.getRepository(AdminReport);
    const report = await repo.findOne({ where: { name: reportName, deletedAt: IsNull() } });
    const parameterList = await this.dataSource.getRepository(AdminReportParameter).find({ where: { adminReportId: report?.id, deletedAt: IsNull() } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    const mappedParams: Record<string, string> = {};
    parameterList.forEach((param) => {
      mappedParams[param.parameterName] = params[param.parameterName];
    });

    const baseQuery = this.buildQuery(report.query, mappedParams, parameterList);

    let countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) as base`;
     // Ensure no semicolon at the end of the query
    let finalQuery = baseQuery.split(/ORDER BY/i)[0];
    if (options.sort) {
      const sorts = options.sort
        .split(',')
        .map((s) => {
          const [field, ord] = s.split(':');
          return `"${field}" ${ord ? ord.toUpperCase() : 'ASC'}`;
        })
        .join(', ');
      finalQuery += ` ORDER BY ${sorts}`;
    }
    finalQuery = finalQuery.replaceAll(';', '');
    countQuery = countQuery.replaceAll(';', '');
    if (options.limit > 0) {
      finalQuery += ` LIMIT ${options.limit} OFFSET ${(options.page - 1) * options.limit}`;
    }
    
    const [data, countResult] = await Promise.all([
      this.dataSource.query(finalQuery),
      this.dataSource.query(countQuery),
    ]);

    return { data, count: parseInt(countResult[0].count, 10) };
  }

  async downloadReport(
    reportName: string,
    params: Record<string, string>,
  ): Promise<{ data: Buffer; fileName: string; mimeType: string }> {
    const { data } = await this.generateReport(reportName, params, { page: 1, limit: 0 });
    const csv = this.convertToCsv(data);
    const fileBuffer = Buffer.from(csv, 'utf8');

    const moduleKey = 'utilization_reports';
    const isModulePasswordEnabled = await this.getModulePasswordConfig(moduleKey);
    const shouldProtect = isPasswordProtectionEnabled() && isModulePasswordEnabled;

    if (!shouldProtect) {
      return {
        data: fileBuffer,
        fileName: `${reportName}.csv`,
        mimeType: 'text/csv',
      };
    }

    const filePasswordConfigClient = new FilePasswordConfigClient();
    const passwordConfig = await filePasswordConfigClient.getConfiguration();
    const password = generatePasswordFromConfig(passwordConfig, null);

    const protectedFile = await applyPasswordProtection(
      fileBuffer,
      `${reportName}.csv`,
      password,
      moduleKey,
      isModulePasswordEnabled,
    );

    return {
      data: protectedFile.data,
      fileName: protectedFile.fileName,
      mimeType: protectedFile.mimeType,
    };
  }

  private convertToCsv(items: any[]): string {
    if (!items || items.length === 0) return '';
    const headers = Object.keys(items[0]).join(',');
    const rows = items.map((row) => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  }
}

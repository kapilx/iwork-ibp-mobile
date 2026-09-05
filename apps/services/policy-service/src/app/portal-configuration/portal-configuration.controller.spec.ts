import { Test, TestingModule } from '@nestjs/testing';
import { PortalConfigurationController } from './portal-configuration.controller';
import { PortalConfigurationService } from './portal-configuration.service';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('PortalConfigurationController', () => {
  let controller: PortalConfigurationController;
  let service: PortalConfigurationService;

  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortalConfigurationController],
      providers: [
        {
          provide: PortalConfigurationService,
          useValue: {
            getHospitals: jest.fn(),
            searchHospitals: jest.fn(),
            generateTemplate: jest.fn(),
            getUploadHistory: jest.fn(),
          },
        },
        {
          provide: TraceIdService,
          useValue: {
            traceId: 'test-trace-id',
          },
        },
      ],
    }).compile();

    controller = module.get<PortalConfigurationController>(PortalConfigurationController);
    service = module.get<PortalConfigurationService>(PortalConfigurationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('downloadTemplate', () => {
    it('should download hospital upload template successfully', async () => {
      // Arrange
      const mockBuffer = Buffer.from('mock excel content');
      const res = mockResponse();

      jest.spyOn(service, 'generateTemplate').mockResolvedValue(mockBuffer);

      // Act
      await controller.downloadTemplate(res);

      // Assert
      expect(service.generateTemplate).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="hospital-upload-template.xlsx"'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', mockBuffer.length);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle template generation errors', async () => {
      // Arrange
      const res = mockResponse();
      const error = new Error('Template generation failed');

      jest.spyOn(service, 'generateTemplate').mockRejectedValue(error);

      // Act
      await controller.downloadTemplate(res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Template generation failed',
          data: null,
        })
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      // Arrange
      const policyId = 123;
      const page = 1;
      const limit = 10;
      const res = mockResponse();
      const expectedResult = {
        data: [
          {
            id: 1,
            policyId: 123,
            fileName: 'test-file.xlsx',
            fileStatus: 'COMPLETED',
            errorCount: 0,
            successCount: 100,
            uploadedAt: new Date(),
          },
        ],
        count: 1,
      };

      jest.spyOn(service, 'getUploadHistory').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getTransactionHistory(policyId, page, limit, res);

      // Assert
      expect(service.getUploadHistory).toHaveBeenCalledWith(policyId, page, limit);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.OK,
          message: 'Upload history retrieved successfully',
          data: expectedResult,
        })
      );
    });

    it('should use default pagination values', async () => {
      // Arrange
      const policyId = 123;
      const res = mockResponse();
      const expectedResult = { data: [], count: 0 };

      jest.spyOn(service, 'getUploadHistory').mockResolvedValue(expectedResult);

      // Act
      await controller.getTransactionHistory(policyId, undefined, undefined, res);

      // Assert
      expect(service.getUploadHistory).toHaveBeenCalledWith(policyId, 1, 10);
    });

    it('should handle service errors', async () => {
      // Arrange
      const policyId = 123;
      const res = mockResponse();
      const error = new Error('Service error');

      jest.spyOn(service, 'getUploadHistory').mockRejectedValue(error);

      // Act
      const result = await controller.getTransactionHistory(policyId, 1, 10, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Service error',
          data: null,
        })
      );
    });
  });

  describe('searchHospitals', () => {
    const mockRequest = (userId: string) => ({
      headers: {
        userid: userId,
      },
    });

    it('should search hospitals successfully', async () => {
      // Arrange
      const policyId = 123;
      const searchParams = { page: 1, limit: 10, search: 'Apollo' };
      const userId = '456';
      const req = mockRequest(userId);
      const res = mockResponse();
      const expectedResult = {
        data: [
          {
            id: 1,
            name: 'Apollo Hospital',
            code: 'APL001',
          },
        ],
        count: 1,
      };

      jest.spyOn(service, 'searchHospitals').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.searchHospitals(policyId, searchParams, req as any, res);

      // Assert
      expect(service.searchHospitals).toHaveBeenCalledWith(policyId, searchParams, 456);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.OK,
          message: 'Hospitals retrieved successfully',
          data: expectedResult,
        })
      );
    });

    it('should return error for missing userid header', async () => {
      // Arrange
      const policyId = 123;
      const searchParams = { page: 1, limit: 10 };
      const req = { headers: {} };
      const res = mockResponse();

      // Act
      const result = await controller.searchHospitals(policyId, searchParams, req as any, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Missing userid header',
          data: null,
        })
      );
    });

    it('should return error for invalid userid header', async () => {
      // Arrange
      const policyId = 123;
      const searchParams = { page: 1, limit: 10 };
      const req = mockRequest('invalid');
      const res = mockResponse();

      // Act
      const result = await controller.searchHospitals(policyId, searchParams, req as any, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid userid header - must be a valid number',
          data: null,
        })
      );
    });
  });
});
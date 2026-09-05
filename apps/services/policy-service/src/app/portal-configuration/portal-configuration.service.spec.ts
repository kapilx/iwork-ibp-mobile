import { Test, TestingModule } from '@nestjs/testing';
import { PortalConfigurationService } from './portal-configuration.service';
import { PortalConfigurationRepository } from './portal-configuration.repository';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { 
  HOSPITAL_TEMPLATE_HEADERS, 
  MOCK_HOSPITAL_DATA, 
  TEMPLATE_CONFIG 
} from '../../../../service-lib/src/lib/constants';
import * as ExcelJS from 'exceljs';

describe('PortalConfigurationService', () => {
  let service: PortalConfigurationService;
  let repository: PortalConfigurationRepository;
  let traceIdService: TraceIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalConfigurationService,
        {
          provide: PortalConfigurationRepository,
          useValue: {
            getHospitals: jest.fn(),
            searchHospitals: jest.fn(),
            getHospitalUploadTracking: jest.fn(),
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

    service = module.get<PortalConfigurationService>(PortalConfigurationService);
    repository = module.get<PortalConfigurationRepository>(PortalConfigurationRepository);
    traceIdService = module.get<TraceIdService>(TraceIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTemplate', () => {
    it('should generate Excel template with mock data', async () => {
      // Act
      const result = await service.generateTemplate();

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      // Verify Excel content
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(result);

      const worksheet = workbook.getWorksheet(TEMPLATE_CONFIG.sheetName);
      expect(worksheet).toBeDefined();

      // Check headers
      const headerRow = worksheet.getRow(1);
      HOSPITAL_TEMPLATE_HEADERS.forEach((header, index) => {
        expect(headerRow.getCell(index + 1).value).toBe(header);
      });

      // Check mock data rows
      expect(worksheet.rowCount).toBe(MOCK_HOSPITAL_DATA.length + 1); // +1 for header

      // Verify instructions sheet exists
      const instructionsSheet = workbook.getWorksheet('Instructions');
      expect(instructionsSheet).toBeDefined();
    });

    it('should handle errors during template generation', async () => {
      // Mock ExcelJS to throw error
      jest.spyOn(ExcelJS.Workbook.prototype, 'xlsx').mockImplementation(() => {
        throw new Error('Excel generation failed');
      });

      // Act & Assert
      await expect(service.generateTemplate()).rejects.toThrow('Excel generation failed');
    });
  });

  describe('getUploadHistory', () => {
    it('should return paginated upload history', async () => {
      // Arrange
      const policyId = 123;
      const page = 1;
      const limit = 10;
      const expectedResult = {
        data: [
          {
            id: 1,
            policyId: 123,
            fileId: 456,
            fileName: 'test-file.xlsx',
            fileStatus: 'COMPLETED',
            errorCount: 0,
            successCount: 100,
            totalRows: 100,
            uploadedAt: new Date(),
            uploadedBy: 1,
          },
        ],
        count: 1,
      };

      jest.spyOn(repository, 'getHospitalUploadTracking').mockResolvedValue(expectedResult);

      // Act
      const result = await service.getUploadHistory(policyId, page, limit);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(repository.getHospitalUploadTracking).toHaveBeenCalledWith(policyId, page, limit);
    });

    it('should use default pagination values', async () => {
      // Arrange
      const policyId = 123;
      const expectedResult = { data: [], count: 0 };

      jest.spyOn(repository, 'getHospitalUploadTracking').mockResolvedValue(expectedResult);

      // Act
      await service.getUploadHistory(policyId);

      // Assert
      expect(repository.getHospitalUploadTracking).toHaveBeenCalledWith(policyId, 1, 10);
    });

    it('should handle errors from repository', async () => {
      // Arrange
      const policyId = 123;
      const error = new Error('Database connection failed');

      jest.spyOn(repository, 'getHospitalUploadTracking').mockRejectedValue(error);

      // Act & Assert
      await expect(service.getUploadHistory(policyId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('searchHospitals', () => {
    it('should search hospitals successfully', async () => {
      // Arrange
      const policyId = 123;
      const searchParams = {
        page: 1,
        limit: 10,
        search: 'Apollo',
      };
      const userId = 456;
      const expectedResult = {
        data: [
          {
            id: 1,
            name: 'Apollo Hospital',
            code: 'APL001',
            addresses: {
              addressLine1: '123 Health Street',
              city: 'Hyderabad',
              state: 'Telangana',
              pinCode: '500001',
            },
          },
        ],
        count: 1,
      };

      jest.spyOn(repository, 'searchHospitals').mockResolvedValue(expectedResult);

      // Act
      const result = await service.searchHospitals(policyId, searchParams, userId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(repository.searchHospitals).toHaveBeenCalledWith(policyId, searchParams, userId);
    });

    it('should handle search errors', async () => {
      // Arrange
      const policyId = 123;
      const searchParams = { page: 1, limit: 10 };
      const userId = 456;
      const error = new Error('Search failed');

      jest.spyOn(repository, 'searchHospitals').mockRejectedValue(error);

      // Act & Assert
      await expect(service.searchHospitals(policyId, searchParams, userId)).rejects.toThrow('Search failed');
    });
  });

  describe('getHospitals', () => {
    it('should get hospitals with pagination', async () => {
      // Arrange
      const params = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          {
            id: 1,
            name: 'Test Hospital',
            code: 'TEST001',
            addresses: {
              addressLine1: '123 Test Street',
              city: 'Test City',
            },
          },
        ],
        count: 1,
      };

      jest.spyOn(repository, 'getHospitals').mockResolvedValue(expectedResult);

      // Act
      const result = await service.getHospitals(params);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(repository.getHospitals).toHaveBeenCalledWith(params);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const params = { page: 1, limit: 10 };
      const error = new Error('Repository error');

      jest.spyOn(repository, 'getHospitals').mockRejectedValue(error);

      // Act & Assert
      await expect(service.getHospitals(params)).rejects.toThrow('Repository error');
    });
  });
});
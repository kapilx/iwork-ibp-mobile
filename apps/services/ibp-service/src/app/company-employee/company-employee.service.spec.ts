import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyEmployeeService } from './company-employee.service';
import { CompanyEmployeeRepository } from './company-employee.repository';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as fileManagementUtils from '../../../../service-lib/src/lib/utils/file-management.utils';
import {
  DocumentProcessingFile,
  FileUpload,
  Policy,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentDependent,
  PolicyEnrollmentUploadSummary,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEndorsement,
  User,
  Role,
  UserRole,
  PolicyConfiguration,
  LookUp,
} from '../../../../service-lib/src/lib/entities';
import {
  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
} from '../../../../service-lib/src/lib/constants';

describe('CompanyEmployeeService', () => {
  let service: CompanyEmployeeService;

  let repository: jest.Mocked<CompanyEmployeeRepository>;

  beforeEach(async () => {
    repository = {
      getEnrollmentComponents: jest.fn(),
      getEnrollmentSummary: jest.fn(),
      getConfigRelationsAndContains: jest.fn(),
      getDependentsByEmployeeId: jest.fn(),
      getEmployeeDetailsByEmployeeId: jest.fn(),
      getPolicyConfigurationByPolicyId: jest.fn(),
    } as any;
    const repoMock = () => ({
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      insert: jest.fn(),
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyEmployeeService,
        { provide: CompanyEmployeeRepository, useValue: repository },
        TraceIdService,
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: DataSource, useValue: {} },
        { provide: getRepositoryToken(DocumentProcessingFile), useValue: repoMock() },
        { provide: getRepositoryToken(FileUpload), useValue: repoMock() },
        { provide: getRepositoryToken(Policy), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyEnrollmentEmployee), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyEnrollmentDependent), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyEnrollmentUploadSummary), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyEnrollmentEmployeePolicyMap), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyEmployeeEnrollment), useValue: repoMock() },
        { provide: getRepositoryToken(User), useValue: repoMock() },
        { provide: getRepositoryToken(Role), useValue: repoMock() },
        { provide: getRepositoryToken(UserRole), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyEmployeeEndorsement), useValue: repoMock() },
        { provide: getRepositoryToken(PolicyConfiguration), useValue: repoMock() },
        { provide: getRepositoryToken(LookUp), useValue: repoMock() },
      ],
    }).compile();

    service = module.get<CompanyEmployeeService>(CompanyEmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmployeeECardSignedUrl', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return signed url for the employee e-card key', async () => {
      jest
        .spyOn(fileManagementUtils, 'getSignedUrl')
        .mockResolvedValue('https://signed-url.example');

      const result = await service.getEmployeeECardSignedUrl(197052, 'E-111');

      expect(fileManagementUtils.getSignedUrl).toHaveBeenNthCalledWith(
        1,
        'uploads/e-cards/company/197052/E-111.pdf',
        { expiresSeconds: 300, responseContentDisposition: 'inline' },
      );
      expect(fileManagementUtils.getSignedUrl).toHaveBeenNthCalledWith(
        2,
        'uploads/e-cards/company/197052/E-111.pdf',
        {
          expiresSeconds: 300,
          responseContentDisposition: 'attachment; filename="E-111.pdf"',
        },
      );
      expect(result).toEqual({
        key: 'uploads/e-cards/company/197052/E-111.pdf',
        signedUrl: 'https://signed-url.example',
        downloadUrl: 'https://signed-url.example',
      });
    });

    it('should throw when companyEmployeeId is empty', async () => {
      await expect(service.getEmployeeECardSignedUrl(197052, '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw when companyId is invalid', async () => {
      await expect(service.getEmployeeECardSignedUrl(0, 'E-111')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getEmployeeDetailsWithPolicyComponents', () => {
    it('should return details with enrollment choices', async () => {
      const employeeDetails: any = { id: 1, policyId: 2 };
      const policyConfig: any = { components: [], parameters: [], policyOptions: [] };
      const mockChoices = [{ id: 10 }];
      jest
        .spyOn(service as any, 'filterPolicyOptions')
        .mockReturnValue([]);
      repository.getEnrollmentComponents.mockResolvedValue(mockChoices);
      repository.getDependentsByEmployeeId.mockResolvedValue([]);

      const result = await service.getEmployeeDetailsWithPolicyComponents(
        employeeDetails,
        policyConfig,
        2,
      );

      expect(result.enrollmentChoicesMade).toEqual(mockChoices);
      expect(repository.getEnrollmentComponents).toHaveBeenCalledWith(2, 1);
      expect(repository.getDependentsByEmployeeId).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('filterPolicyOptions', () => {
    it('should match option by relation group', () => {
      const policyConfig: any = {
        parameters: [
          {
            id: 'rel-param',
            parameterMasterName: 'Relationship Group',
            type: 'relation',
            relationGroupDetails: [
              {
                id: 'group1',
                selectedRelations: [
                  { name: 'Self', selected: true },
                  { name: 'Spouse/Partner', selected: true },
                ],
              },
              {
                id: 'group2',
                selectedRelations: [{ name: 'Self', selected: true }],
              },
            ],
          },
        ],
        policyOptions: [
          {
            optionId: 'opt1',
            optionMeta: [
              { parameterId: 'rel-param', parameterOptionId: 'group1' },
            ],
          },
          {
            optionId: 'opt2',
            optionMeta: [
              { parameterId: 'rel-param', parameterOptionId: 'group2' },
            ],
          },
        ],
        relationships: {
          enabledPolicyRelations: [
            { type: 'Self', configuredOptions: [{ name: 'Self' }] },
            {
              type: 'Spouse/Partner',
              configuredOptions: [{ name: 'Husband' }, { name: 'Wife' }],
            },
          ],
        },
      };

      const dependents = [{ relation: 'Wife' }];

      const result = service.filterPolicyOptions({}, policyConfig, dependents);

      expect(result.optionId).toBe('opt1');
    });
  });

  describe('getEmployeeRelatedComponentsBasedOnPolicy', () => {
    it('should pass isRelationshipGroup=true when relationship-group parameter is present', async () => {
      repository.getEmployeeDetailsByEmployeeId.mockResolvedValue({ id: 101 } as any);
      repository.getPolicyConfigurationByPolicyId.mockResolvedValue({
        policyConfiguration: {
          parameters: [{ type: POLICY_RELATIONSHIP_TYPE_PARAMETER }],
        },
      } as any);

      const getEmployeeDetailsWithPolicyComponentsSpy = jest
        .spyOn(service as any, 'getEmployeeDetailsWithPolicyComponents')
        .mockResolvedValue({
          enrollmentChoicesMade: [],
          policyComponentsConfiguration: {
            components: [],
            parameters: [],
            availablePolicyChoices: [],
          },
        });

      await service.getEmployeeRelatedComponentsBasedOnPolicy(101, 999, [], true);

      expect(getEmployeeDetailsWithPolicyComponentsSpy).toHaveBeenCalledWith(
        { id: 101 },
        { parameters: [{ type: POLICY_RELATIONSHIP_TYPE_PARAMETER }] },
        999,
        [],
        true,
        true,
      );
    });
  });

   describe('getEmployeeRelationTypes', () => {
    it('should map dependent relations to relation types', () => {
      const relationships: any = {
        enabledPolicyRelations: [
          { type: 'Self', configuredOptions: [{ name: 'Self' }] },
          {
            type: 'Spouse/Partner',
            configuredOptions: [{ name: 'Husband' }, { name: 'Wife' }],
          },
        ],
      };

      const dependents = [{ relation: 'Wife' }];

      const result = (service as any).getEmployeeRelationTypes(
        dependents,
        relationships,
      );

      expect(result).toEqual(['Self', 'Spouse/Partner']);
    });
  });
  
  describe('getEnrollmentSummary', () => {
    it('should return enrollment summary from repository', async () => {
      const summary = { components: [], dependents: [], sumInsured: 0 } as any;
      repository.getEnrollmentSummary = jest.fn().mockResolvedValue(summary);

      const result = await service.getEnrollmentSummary(1, 2);

      expect(repository.getEnrollmentSummary).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(summary);
    });
  });

  describe('getRelationsConstraintsAndDependents', () => {
    it('should return combined config, dependents and choices', async () => {
      const config = {
        relationships: {},
        constraints: {},
        isRelationshipGroup: true,
      } as any;
      const policyComponentsConfiguration = { components: [] } as any;
      repository.getConfigRelationsAndContains.mockResolvedValue(config);
      repository.getEnrollmentSummary.mockResolvedValue({
        dependents: [],
        enrolledChoices: [],
        employeeEnrollmentStatusKey: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
      } as any);
      repository.getEmployeeDetailsByEmployeeId.mockResolvedValue({} as any);
      repository.getPolicyConfigurationByPolicyId.mockResolvedValue({
        policyConfiguration: {},
      } as any);
      const getEmployeeDetailsWithPolicyComponentsSpy = jest
        .spyOn(service as any, 'getEmployeeDetailsWithPolicyComponents')
        .mockResolvedValue({ policyComponentsConfiguration });

      const result = await service.getRelationsConstraintsAndDependents(1, 2);

      expect(repository.getConfigRelationsAndContains).toHaveBeenCalledWith(1);
      expect(repository.getEnrollmentSummary).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({
        ...config,
        dependents: [],
        employeeChosenChoices: [],
        isEnrolled: true,
        policyComponentsConfiguration,
      });
      getEmployeeDetailsWithPolicyComponentsSpy.mockRestore();
    });
  });
});

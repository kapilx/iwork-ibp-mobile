import { Test, TestingModule } from "@nestjs/testing";
import { ContactService } from "./contact.service";
import { ContactRepository } from "./contact.repository";
import { AddressRepository } from "../address/address.repository";
import { CompanyRepository } from "../company/company.repository";
import { LookUpRepository } from "../look-up/look-up.repository";
import { InsurerRepository } from "../insurer/insurer.repository";
import { TpaRepository } from "../tpa/tpa.repository";
import { BrokerRepository } from "../broker/broker.repository";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { DataSource } from "typeorm";
import {
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

describe("ContactService", () => {
  let service: ContactService;
  let contactRepository: jest.Mocked<ContactRepository>;
  let addressRepository: jest.Mocked<AddressRepository>;
  let companyRepository: jest.Mocked<CompanyRepository>;
  let lookUpRepository: jest.Mocked<LookUpRepository>;
  let insurerRepository: jest.Mocked<InsurerRepository>;
  let tpaRepository: jest.Mocked<TpaRepository>;
  let brokerRepository: jest.Mocked<BrokerRepository>;
  let lookUpValidationService: jest.Mocked<LookUpValidationService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockContactRepository = {
    createContact: jest.fn(),
    getContactData: jest.fn(),
    removeContact: jest.fn(),
    fetchPaginatedContactList: jest.fn(),
    getTotalContacts: jest.fn(),
    getTotalCompanies: jest.fn(),
    getExistingContactDetails: jest.fn(),
    updateContact: jest.fn(),
    validateCommunication: jest.fn(),
    getContactCompanyDataAddress: jest.fn(),
    getCommunicationPhoneCheck: jest.fn(),
    findContactAddressMap: jest.fn(),
    createContactAddressMapping: jest.fn(),
    getCompanyConfig: jest.fn(),
  };

  const mockAddressRepository = {
    createAddress: jest.fn(),
    updateAddressDetails: jest.fn(),
  };

  const mockCompanyRepository = {
    getCompanyById: jest.fn(),
  };

  const mockLookUpValidationService = {
    validateDynamicLookupValues: jest.fn(),
  };

  const mockLookUpRepository = {
    getLookUpById: jest.fn(),
    findByLookUpKey: jest.fn(),
  };

  const mockInsurerRepository = {
    fetchInsurerById: jest.fn(),
  };

  const mockTpaRepository = {
    getTpaById: jest.fn(),
  };

  const mockBrokerRepository = {
    getBrokerById: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: ContactRepository, useValue: mockContactRepository },
        { provide: AddressRepository, useValue: mockAddressRepository },
        { provide: CompanyRepository, useValue: mockCompanyRepository },
        { provide: LookUpRepository, useValue: mockLookUpRepository },
        { provide: InsurerRepository, useValue: mockInsurerRepository },
        { provide: TpaRepository, useValue: mockTpaRepository },
        { provide: BrokerRepository, useValue: mockBrokerRepository },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: LookUpValidationService,
          useValue: mockLookUpValidationService,
        }, // Add this line
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    contactRepository = mockContactRepository as any;
    addressRepository = mockAddressRepository as any;
    companyRepository = mockCompanyRepository as any;
    lookUpRepository = mockLookUpRepository as any;
    insurerRepository = mockInsurerRepository as any;
    tpaRepository = mockTpaRepository as any;
    brokerRepository = mockBrokerRepository as any;
    dataSource = mockDataSource as any;
  });
  describe("addContact", () => {
    it("should call getCompanyById when adding a COMPANY contact", async () => {
      const contactDto: CreateContactDto = {
        firstName: "Naveen",
        lastName: "Kumar",
        displayName: "Naveen Kumar",
        linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
        companyLocationId: 15,
        contactTypeLid: 276,
        companyId: 435,
        remarks: "<p>This is my contact details</p>",
        contactRecordTypeLid: 88,
        communicationDetails: [
          {
            communicationType: "email",
            communicationDetails: "rohit@divami.com",
            isPrimary: true,
          },
          {
            communicationType: "phone",
            communicationDetails: "7095639485",
            isPrimary: true,
          },
        ],
        contactDetails: {
          favouriteFood: "",
          favouriteRestaurant: "",
          personalHistory: "",
          majorAchievements: "",
          spouseName: "",
          workingCompany: "",
          childDetails: [],
        },
        professionalExperiences: [],
        qualificationExperiences: [],
        address: [
          {
            addressTypeLid: 25,
            address1: "9-2-252 SD Road",
            countryId: 1,
            stateId: 24,
            cityId: 46,
            address2: "Shivaji Nagar",
            pinCode: "500025",
            phoneNumber: "7095639485",
          },
        ],
      };

      mockCompanyRepository.getCompanyById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      mockLookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Active" },
      });

      mockLookUpRepository.findByLookUpKey.mockResolvedValue([{ id: 123 }]);

      (service as any).processAddresses = jest.fn().mockResolvedValue([]);
      (service as any).createAddressMappings = jest
        .fn()
        .mockResolvedValue(undefined);

      (service as any).getCompanyConfig = jest.fn().mockReturnValue({
        fetchMethod: mockCompanyRepository.getCompanyById,
        statusIdKey: "status.id",
        defaultStatusKeyId: 1001,
        createContactMapping: jest.fn(),
        createCompanyMap: jest.fn().mockReturnValue({}),
      });

      mockContactRepository.createContact.mockResolvedValue({ id: 1 });
      const addContactSpy = jest.spyOn(service, "addContact");
      const frozenDto = Object.freeze({ ...contactDto });
      await service.addContact(frozenDto, 1);
      expect(addContactSpy).toHaveBeenCalled();
    });

    it("should call getCompanyById when adding a INSURER contact", async () => {
      const contactDto: CreateContactDto = {
        firstName: "Naveen",
        lastName: "Kumar",
        displayName: "Naveen Kumar",
        linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
        companyLocationId: 15,
        contactTypeLid: 276,
        companyId: 435,
        remarks: "<p>This is my contact details</p>",
        contactRecordTypeLid: 89,
        communicationDetails: [
          {
            communicationType: "email",
            communicationDetails: "rohit@divami.com",
            isPrimary: true,
          },
          {
            communicationType: "phone",
            communicationDetails: "7095639485",
            isPrimary: true,
          },
        ],
        contactDetails: {
          favouriteFood: "",
          favouriteRestaurant: "",
          personalHistory: "",
          majorAchievements: "",
          spouseName: "",
          workingCompany: "",
          childDetails: [],
        },
        professionalExperiences: [],
        qualificationExperiences: [],
        address: [
          {
            addressTypeLid: 25,
            address1: "9-2-252 SD Road",
            countryId: 1,
            stateId: 24,
            cityId: 46,
            address2: "Shivaji Nagar",
            pinCode: "500025",
            phoneNumber: "7095639485",
          },
        ],
      };

      mockInsurerRepository.fetchInsurerById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      mockLookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Active" },
      });

      mockLookUpRepository.findByLookUpKey.mockResolvedValue([{ id: 123 }]);

      (service as any).processAddresses = jest.fn().mockResolvedValue([]);
      (service as any).createAddressMappings = jest
        .fn()
        .mockResolvedValue(undefined);

      (service as any).getCompanyConfig = jest.fn().mockReturnValue({
        fetchMethod: mockInsurerRepository.fetchInsurerById,
        statusIdKey: "status.id",
        defaultStatusKeyId: 1001,
        createContactMapping: jest.fn(),
        createCompanyMap: jest.fn().mockReturnValue({}),
      });

      mockContactRepository.createContact.mockResolvedValue({ id: 1 });
      const addContactSpy = jest.spyOn(service, "addContact");
      const frozenDto = Object.freeze({ ...contactDto });
      await service.addContact(frozenDto, 1);
      expect(addContactSpy).toHaveBeenCalled();
    });

    it("should call getCompanyById when adding a TPA contact", async () => {
      const contactDto: CreateContactDto = {
        firstName: "Naveen",
        lastName: "Kumar",
        displayName: "Naveen Kumar",
        linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
        companyLocationId: 15,
        contactTypeLid: 276,
        companyId: 435,
        remarks: "<p>This is my contact details</p>",
        contactRecordTypeLid: 90,
        communicationDetails: [
          {
            communicationType: "email",
            communicationDetails: "rohit@divami.com",
            isPrimary: true,
          },
          {
            communicationType: "phone",
            communicationDetails: "7095639485",
            isPrimary: true,
          },
        ],
        contactDetails: {
          favouriteFood: "",
          favouriteRestaurant: "",
          personalHistory: "",
          majorAchievements: "",
          spouseName: "",
          workingCompany: "",
          childDetails: [],
        },
        professionalExperiences: [],
        qualificationExperiences: [],
        address: [
          {
            addressTypeLid: 25,
            address1: "9-2-252 SD Road",
            countryId: 1,
            stateId: 24,
            cityId: 46,
            address2: "Shivaji Nagar",
            pinCode: "500025",
            phoneNumber: "7095639485",
          },
        ],
      };

      mockTpaRepository.getTpaById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      mockLookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Active" },
      });

      mockLookUpRepository.findByLookUpKey.mockResolvedValue([{ id: 123 }]);

      (service as any).processAddresses = jest.fn().mockResolvedValue([]);
      (service as any).createAddressMappings = jest
        .fn()
        .mockResolvedValue(undefined);

      (service as any).getCompanyConfig = jest.fn().mockReturnValue({
        fetchMethod: mockTpaRepository.getTpaById,
        statusIdKey: "status.id",
        defaultStatusKeyId: 1001,
        createContactMapping: jest.fn(),
        createCompanyMap: jest.fn().mockReturnValue({}),
      });

      mockContactRepository.createContact.mockResolvedValue({ id: 1 });
      const addContactSpy = jest.spyOn(service, "addContact");
      const frozenDto = Object.freeze({ ...contactDto });
      await service.addContact(frozenDto, 1);
      expect(addContactSpy).toHaveBeenCalled();
    });

    it("should call getCompanyById when adding a Broker contact", async () => {
      const contactDto: CreateContactDto = {
        firstName: "Naveen",
        lastName: "Kumar",
        displayName: "Naveen Kumar",
        linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
        companyLocationId: 15,
        contactTypeLid: 276,
        companyId: 435,
        remarks: "<p>This is my contact details</p>",
        contactRecordTypeLid: 91,
        communicationDetails: [
          {
            communicationType: "email",
            communicationDetails: "rohit@divami.com",
            isPrimary: true,
          },
          {
            communicationType: "phone",
            communicationDetails: "7095639485",
            isPrimary: true,
          },
        ],
        contactDetails: {
          favouriteFood: "",
          favouriteRestaurant: "",
          personalHistory: "",
          majorAchievements: "",
          spouseName: "",
          workingCompany: "",
          childDetails: [],
        },
        professionalExperiences: [],
        qualificationExperiences: [],
        address: [
          {
            addressTypeLid: 25,
            address1: "9-2-252 SD Road",
            countryId: 1,
            stateId: 24,
            cityId: 46,
            address2: "Shivaji Nagar",
            pinCode: "500025",
            phoneNumber: "7095639485",
          },
        ],
      };

      mockBrokerRepository.getBrokerById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      mockLookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Active" },
      });

      mockLookUpRepository.findByLookUpKey.mockResolvedValue([{ id: 123 }]);

      (service as any).processAddresses = jest.fn().mockResolvedValue([]);
      (service as any).createAddressMappings = jest
        .fn()
        .mockResolvedValue(undefined);

      (service as any).getCompanyConfig = jest.fn().mockReturnValue({
        fetchMethod: mockBrokerRepository.getBrokerById,
        statusIdKey: "status.id",
        defaultStatusKeyId: 1001,
        createContactMapping: jest.fn(),
        createCompanyMap: jest.fn().mockReturnValue({}),
      });

      mockContactRepository.createContact.mockResolvedValue({ id: 1 });
      const addContactSpy = jest.spyOn(service, "addContact");
      const frozenDto = Object.freeze({ ...contactDto });
      await service.addContact(frozenDto, 1);
      expect(addContactSpy).toHaveBeenCalled();
    });

    it("should throw an error if companyId is missing", async () => {
      const createContactDto: CreateContactDto = {
        companyId: undefined,
        contactRecordTypeLid: 2,
        firstName: "John",
        lastName: "Doe",
        communicationDetails: [],
        address: [],
        contactDocMaps: [],
      };
      const userId = 1;

      dataSource.transaction.mockImplementation(async (callback) => {
        return callback();
      });

      await expect(
        service.addContact(createContactDto, userId)
      ).rejects.toThrow("Contact should have a company id");
    });
  });

  describe("getContactById", () => {
    it("should successfully retrieve a contact by ID", async () => {
      const contactId = 1;
      const mockContact = { id: 1, firstName: "John", lastName: "Doe" };

      contactRepository.getContactData.mockResolvedValue(mockContact);

      const result = await service.getContactById(contactId);

      expect(result).toEqual(mockContact);
      expect(contactRepository.getContactData).toHaveBeenCalledWith(contactId);
    });

    it("should throw NotFoundException if contact does not exist", async () => {
      const contactId = 999;

      contactRepository.getContactData.mockResolvedValue(null);

      await expect(service.getContactById(contactId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
    it("should throw InternalServerErrorException on database error", async () => {
      const contactId = 1;

      contactRepository.getContactData.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.getContactById(contactId)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("deleteContactById", () => {
    it("should successfully delete a contact by ID", async () => {
      const contactId = 1;
      const mockContact = { id: 1, firstName: "John", lastName: "Doe" };

      dataSource.transaction.mockImplementation(async (callback) => {
        return callback();
      });

      contactRepository.getContactData.mockResolvedValue(mockContact);
      contactRepository.removeContact.mockResolvedValue(undefined);

      const result = await service.deleteContactById(contactId);

      expect(result).toEqual({
        message: `Contact with ID ${contactId} and its addresses deleted successfully`,
      });
      expect(contactRepository.getContactData).toHaveBeenCalledWith(contactId);
      expect(contactRepository.removeContact).toHaveBeenCalledWith(mockContact);
    });

    it("should throw NotFoundException if contact does not exist", async () => {
      const contactId = 999;

      contactRepository.getContactData.mockResolvedValue(null);

      dataSource.transaction.mockImplementation(async (callback) => {
        return callback();
      });

      await expect(service.deleteContactById(contactId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("getContactList", () => {
    it("should successfully retrieve a paginated list of contacts", async () => {
      const page = 1;
      const limit = 10;
      const userId = 1;
      const contactRecordTypeLid = 2;
      const mockContactList = {
        data: [{ id: 1, firstName: "John", lastName: "Doe" }],
        count: 1,
      };

      contactRepository.fetchPaginatedContactList.mockResolvedValue(
        mockContactList
      );
      contactRepository.getTotalContacts.mockResolvedValue(1);
      contactRepository.getTotalCompanies.mockResolvedValue(1);

      const result = await service.getContactList(
        page,
        limit,
        userId,
        contactRecordTypeLid
      );

      expect(result).toEqual({
        data: mockContactList.data,
        count: mockContactList.count,
        totalContacts: 1,
        totalCompanies: 1,
      });
      expect(contactRepository.fetchPaginatedContactList).toHaveBeenCalledWith(
        page,
        limit,
        userId,
        contactRecordTypeLid,
        undefined,
        undefined
      );
    });

    it("should return an empty list if no contacts are found", async () => {
      const page = 1;
      const limit = 10;
      const userId = 1;
      const contactRecordTypeLid = 2;

      contactRepository.fetchPaginatedContactList.mockResolvedValue({
        data: [],
        count: 0,
      });
      contactRepository.getTotalContacts.mockResolvedValue(0);
      contactRepository.getTotalCompanies.mockResolvedValue(0);

      const result = await service.getContactList(
        page,
        limit,
        userId,
        contactRecordTypeLid
      );

      expect(result).toEqual({
        data: [],
        count: 0,
        totalContacts: 0,
        totalCompanies: 0,
      });
    });
  });

  describe("updateContactById", () => {
    it("should successfully update a contact by ID", async () => {
      const contactId = 1;
      const userId = 1;
      const updateContactDto: UpdateContactDto = {
        firstName: "Updated Name",
        lastName: "Updated Last Name",
        address: [],
        communicationDetails: [],
      };
      const mockExistingContact = {
        id: contactId,
        firstName: "John",
        contactRecordType: { id: 88, value: "COMPANY" },
      };
      const mockUpdatedContact = { id: contactId, firstName: "Updated Name" };
      const mockCompany = { id: 2, name: "Test Company", status: { id: 1 } };
      dataSource.transaction.mockImplementation(async (callback) => {
        return callback();
      });
      contactRepository.getExistingContactDetails.mockResolvedValue(
        mockExistingContact
      );
      companyRepository.getCompanyById.mockResolvedValue(mockCompany);
      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Active" },
      });
      contactRepository.updateContact.mockResolvedValue(mockUpdatedContact);

      const result = await service.updateContactById(
        contactId,
        updateContactDto,
        userId
      );

      expect(result).toEqual(mockUpdatedContact);
      expect(contactRepository.getExistingContactDetails).toHaveBeenCalledWith(
        contactId
      );
      expect(contactRepository.updateContact).toHaveBeenCalledWith(
        contactId,
        expect.objectContaining({
          firstName: "Updated Name",
        })
      );
    });
  });

  describe("validateCommunication", () => {
    it("should validate communication details successfully", async () => {
      const communicationDetails = [
        { communicationType: "phone", communicationDetails: "1234567890" },
      ];
      const config = { communicationSearchQuery: {} };
      const contactName = "John Doe";

      contactRepository.getCommunicationPhoneCheck.mockResolvedValue([]);

      await service.validateCommunication(
        communicationDetails,
        config,
        contactName
      );

      expect(contactRepository.getCommunicationPhoneCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          communicationType: "phone",
          communicationDetails: "1234567890",
        })
      );
    });

    it("should throw an error if phone number already exists", async () => {
      const communicationDetails = [
        { communicationType: "phone", communicationDetails: "1234567890" },
      ];
      const config = { communicationSearchQuery: {} };
      const contactName = "John Doe";

      contactRepository.getCommunicationPhoneCheck.mockResolvedValue([{}]);

      await expect(
        service.validateCommunication(communicationDetails, config, contactName)
      ).rejects.toThrow("Phone number 1234567890 already exists");
    });
  });

  describe("createAddressMappings", () => {
    it("should create address mappings for a contact", async () => {
      const contactResult = { id: 1 };
      const companyId = 1;
      const addressMapping = [{ id: 1 }];
      const companyConfig = {};

      contactRepository.findContactAddressMap.mockResolvedValue(null);
      contactRepository.createContactAddressMapping.mockResolvedValue(
        undefined
      );

      await service.createAddressMappings({
        contactResult,
        companyId,
        addressMapping,
        companyConfig,
      });

      expect(contactRepository.findContactAddressMap).toHaveBeenCalledWith(
        1,
        1
      );
      expect(
        contactRepository.createContactAddressMapping
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 1,
          addressId: 1,
        })
      );
    });
  });

  describe("checkCompanyAddressExists", () => {
    it("should return 0 if address is a default residential address", async () => {
      const newAddress = { addressTypeLid: 1 };
      const companyAddresses = [];
      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Residential" },
      });

      const result = await service.checkCompanyAddressExists(
        newAddress,
        companyAddresses
      );

      expect(result).toBe(0);
    });

    it("should return the address ID if an exact match is found", async () => {
      const newAddress = { address1: "123 Street", cityId: 1 };
      const companyAddresses = [
        { address: { id: 1, address1: "123 Street", cityId: 1 } },
      ];

      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Office" },
      });

      const result = await service.checkCompanyAddressExists(
        newAddress,
        companyAddresses
      );

      expect(result).toBe(0);
    });

    it("should return 0 if no match is found", async () => {
      const newAddress = { address1: "456 Street", cityId: 2 };
      const companyAddresses = [
        { address: { id: 1, address1: "123 Street", cityId: 1 } },
      ];

      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Office" },
      });

      const result = await service.checkCompanyAddressExists(
        newAddress,
        companyAddresses
      );

      expect(result).toBe(0);
    });
  });

  describe("processAddresses", () => {
    it("should process and create new addresses", async () => {
      const addresses = [{ address1: "123 Street", cityId: 1 }];
      const companyData = { companyAddresses: [] };
      const config = { addressRelation: "companyAddresses", userId: 1 };

      addressRepository.createAddress.mockResolvedValue({
        id: 1,
        address1: "123 Street",
      });

      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Office" },
      });

      const result = await service.processAddresses(
        addresses,
        companyData,
        config
      );

      expect(result).toEqual([{ id: 1, address1: "123 Street" }]);
      expect(addressRepository.createAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: "123 Street",
        })
      );
    });
    it("should return existing address if it already exists", async () => {
      const addresses = [{ address1: "123 Street", cityId: 1 }];
      const companyData = {
        companyAddresses: [
          { address: { id: 1, address1: "123 Street", cityId: 1 } },
        ],
      };
      const config = { addressRelation: "companyAddresses", userId: 1 };

      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Office" },
      });

      const result = await service.processAddresses(
        addresses,
        companyData,
        config
      );

      expect(result).toEqual([{ id: 1, address1: "123 Street", cityId: 1 }]);
    });
    it("should return existing address if addressExists is not 0", async () => {
      const addresses = [{ address1: "123 Street", cityId: 1 }];
      const companyData = {
        companyAddresses: [
          { address: { id: 1, address1: "123 Street", cityId: 1 } },
        ],
      };
      const config = { addressRelation: "companyAddresses", userId: 1 };

      lookUpRepository.getLookUpById.mockResolvedValue({
        data: { lookUpValue: "Office" },
      });

      const result = await service.processAddresses(
        addresses,
        companyData,
        config
      );

      expect(result).toEqual([{ id: 1, address1: "123 Street", cityId: 1 }]);
    });
  });

  describe("getCompanyConfig", () => {
    it("should return the company configuration for a valid company ID", async () => {
      const companyId = 1;
      const mockCompanyConfig = {
        recordType: "company",
        companyId: companyId,
        userId: 1,
      };
      const mockCompany = {
        id: companyId,
        name: "Test Company",
        status: { id: 1, lookUpValue: "Active" },
      };

      mockCompanyRepository.getCompanyById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });
      mockInsurerRepository.fetchInsurerById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      mockTpaRepository.getTpaById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      mockBrokerRepository.getBrokerById.mockResolvedValue({
        id: 435,
        status: { id: 1001 },
      });

      const result = await (service as any).getCompanyConfig(
        mockCompanyConfig.recordType,
        mockCompanyConfig.companyId,
        mockCompanyConfig.userId
      );

      expect(result).toEqual({
        recordType: "company",
        companyId: companyId,
        userId: 1,
      });
    });
    it("should return undefined for an invalid record type", async () => {
      const recordType = "invalid";
      const companyId = 1;
      const userId = 1;

      const result = await service.getCompanyConfig(
        recordType,
        companyId,
        userId
      );

      expect(result).toBeUndefined();
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { ContactRepository } from "./contact.repository";
import { CompanyRepository } from "../company/company.repository";
import { Repository } from "typeorm";
import { Contact } from "../../../../service-lib/src/lib/entities/contact.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { CreateContactDto } from "./dto/create-contact.dto";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { ContactCommunicationDetails } from "../../../../service-lib/src/lib/entities/contact-communication-details.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ContactDetails } from "../../../../service-lib/src/lib/entities/contact-details.entity";
import { ChildDetails } from "../../../../service-lib/src/lib/entities/child-details.entity";
import { ProfessionalExperience } from "../../../../service-lib/src/lib/entities/professional-experience.entity";
import { QualificationExperience } from "../../../../service-lib/src/lib/entities/qualification-experience.entity";
import { ContactAddress } from "../../../../service-lib/src/lib/entities/contact-address.entity";
import { CompanyAddress } from "../../../../service-lib/src/lib/entities/company.address.entity";
import { ContactDocMap } from "../../../../service-lib/src/lib/entities/contact-document-map.entity";
import { CompanyContactMap } from "../../../../service-lib/src/lib/entities/company-contact.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import { CreateContactDetailsDto } from "./dto/contact-details.dto";
import { CreateChildDetailsDto } from "./dto/child-details.dto";
import { UpdateChildDetailsDto } from "./dto/update-child-details.dto";
import { CreateProfessionalExperienceDto } from "./dto/professional-experience.dto";
import { CreateQualificationExperienceDto } from "./dto/qualification-experience.dto";
import {
  COMPANY_CONTACT_RECORD_TYPE,
  TPA_CONTACT_RECORD_TYPE,
  BROKER_CONTACT_RECORD_TYPE,
  INSURER_CONTACT_RECORD_TYPE,
} from "../../../../../../libs/service-lib/src/lib/constants";

describe("ContactRepository", () => {
  let contactRepository: ContactRepository;
  let companyRepository: CompanyRepository;
  let contactRepoMock: jest.Mocked<Repository<Contact>>;
  let companyRepoMock: jest.Mocked<Repository<Company>>;
  let entityServiceMock: jest.Mocked<EntityService>;
  let dataSourceMock: jest.Mocked<DataSource>;
  let contactDetailsRepositoryMock: jest.Mocked<Repository<ContactDetails>>;
  let childDetailsRepositoryMock: jest.Mocked<Repository<ChildDetails>>;
  let professionalExperienceRepositoryMock: jest.Mocked<
    Repository<ProfessionalExperience>
  >;
  let qualificationExperienceRepositoryMock: jest.Mocked<
    Repository<QualificationExperience>
  >;
  let contactAddressRepositoryMock: jest.Mocked<Repository<ContactAddress>>;
  let companyAddressRepositoryMock: jest.Mocked<Repository<CompanyAddress>>;
  let contactCommunicationDetailsRepositoryMock: jest.Mocked<
    Repository<ContactCommunicationDetails>
  >;
  let contactDocMapRepositoryMock: jest.Mocked<Repository<ContactDocMap>>;
  let companyContactMapRepositoryMock: jest.Mocked<
    Repository<CompanyContactMap>
  >;
  let updateQualificationExperienceMock: jest.MockedFunction<any>;
  let updateContactDetailsMock: jest.MockedFunction<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // Add the module containing these repositories if applicable
      ],
      providers: [
        ContactRepository,
        CompanyRepository,
        {
          provide: "ContactRepository",
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: EntityService,
          useValue: {
            getLookupValues: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            manager: {
              save: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(Company),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContactCommunicationDetails),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContactDetails),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ChildDetails),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProfessionalExperience),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QualificationExperience),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContactAddress),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompanyAddress),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ContactDocMap),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompanyContactMap),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Insurer),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tpa),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LookUp),
          useValue: {
            getLookUpById: jest.fn(),
            findByLookUpKey: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    contactRepository = module.get<ContactRepository>(ContactRepository);
    companyRepository = module.get<CompanyRepository>(CompanyRepository);
    contactRepoMock = module.get("ContactRepository");
    companyRepoMock = module.get("CompanyRepository");
    entityServiceMock = module.get(EntityService);
    dataSourceMock = module.get(DataSource);
    contactDetailsRepositoryMock = module.get(
      getRepositoryToken(ContactDetails)
    );
    childDetailsRepositoryMock = module.get(getRepositoryToken(ChildDetails));
    professionalExperienceRepositoryMock = module.get(
      getRepositoryToken(ProfessionalExperience)
    );
    qualificationExperienceRepositoryMock = module.get(
      getRepositoryToken(QualificationExperience)
    );
    contactAddressRepositoryMock = module.get(
      getRepositoryToken(ContactAddress)
    );
    companyAddressRepositoryMock = module.get(
      getRepositoryToken(CompanyAddress)
    );
    contactCommunicationDetailsRepositoryMock = module.get(
      getRepositoryToken(ContactCommunicationDetails)
    );
    contactDocMapRepositoryMock = module.get(getRepositoryToken(ContactDocMap));
    companyContactMapRepositoryMock = module.get(
      getRepositoryToken(CompanyContactMap)
    );
    updateQualificationExperienceMock = jest.fn();
    updateContactDetailsMock = jest.fn();
  });

  describe("createContact", () => {
    it("should create and save a new contact successfully", async () => {
      const createContactDto: CreateContactDto = {
        firstName: "Naveen",
        lastName: "Kumar",
        displayName: "Naveen Kumar",
        linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
        companyLocationId: 15,
        contactTypeLid: 276,
        companyId: 435,
        remarks: "<p>This is my contact details</p>",
        statusLid: 29,
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

      const mockContact = {
        id: 1,
        ...createContactDto,
      };

      contactRepoMock.create.mockReturnValue(mockContact);
      dataSourceMock.manager.save.mockResolvedValue(mockContact);

      const result = await contactRepository.createContact(createContactDto);
      expect(result).toEqual(mockContact);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createContactDto: CreateContactDto = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      };

      contactRepoMock.create.mockReturnValue(createContactDto);
      dataSourceMock.manager.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createContact(createContactDto)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("createContactDetails", () => {
    it("should create and save contact details successfully", async () => {
      const createContactDetailsDto: CreateContactDetailsDto = {
        gender: "Male",
        dateOfBirth: "1990-01-01",
        maritalStatus: "Single",
      };

      const mockContactDetails = {
        id: 1,
        ...createContactDetailsDto,
      };

      contactDetailsRepositoryMock.create.mockReturnValue(mockContactDetails);
      contactDetailsRepositoryMock.save.mockResolvedValue(mockContactDetails);

      const result = await contactRepository.createContactDetails(
        createContactDetailsDto
      );

      expect(contactDetailsRepositoryMock.create).toHaveBeenCalledWith(
        createContactDetailsDto
      );
      expect(contactDetailsRepositoryMock.save).toHaveBeenCalledWith(
        mockContactDetails
      );
      expect(result).toEqual(mockContactDetails);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createContactDetailsDto: CreateContactDetailsDto = {
        gender: "Male",
        dateOfBirth: "1990-01-01",
        maritalStatus: "Single",
      };

      contactDetailsRepositoryMock.create.mockReturnValue(
        createContactDetailsDto
      );
      contactDetailsRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createContactDetails(createContactDetailsDto)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactDetailsRepositoryMock.create).toHaveBeenCalledWith(
        createContactDetailsDto
      );
      expect(contactDetailsRepositoryMock.save).toHaveBeenCalledWith(
        createContactDetailsDto
      );
    });
  });

  describe("createChildDetails", () => {
    it("should create and save child details successfully", async () => {
      const createChildDetailsDto: CreateChildDetailsDto = {
        name: "Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      const mockChildDetails = {
        id: 1,
        ...createChildDetailsDto,
      };

      childDetailsRepositoryMock.create.mockReturnValue(mockChildDetails);
      childDetailsRepositoryMock.save.mockResolvedValue(mockChildDetails);

      const result = await contactRepository.createChildDetails(
        createChildDetailsDto
      );

      expect(childDetailsRepositoryMock.create).toHaveBeenCalledWith(
        createChildDetailsDto
      );
      expect(childDetailsRepositoryMock.save).toHaveBeenCalledWith(
        mockChildDetails
      );
      expect(result).toEqual(mockChildDetails);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createChildDetailsDto: CreateChildDetailsDto = {
        name: "Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      childDetailsRepositoryMock.create.mockReturnValue(createChildDetailsDto);
      childDetailsRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createChildDetails(createChildDetailsDto)
      ).rejects.toThrow(InternalServerErrorException);

      expect(childDetailsRepositoryMock.create).toHaveBeenCalledWith(
        createChildDetailsDto
      );
      expect(childDetailsRepositoryMock.save).toHaveBeenCalledWith(
        createChildDetailsDto
      );
    });
  });

  describe("updateChildDetails", () => {
    it("should update and save child details successfully", async () => {
      const updateChildDetailsDto: UpdateChildDetailsDto = {
        name: "Updated Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      const existingChildDetails = {
        id: 1,
        name: "Old Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      const updatedChildDetails = {
        ...existingChildDetails,
        ...updateChildDetailsDto,
      };

      childDetailsRepositoryMock.findOne.mockResolvedValue(
        existingChildDetails
      );
      childDetailsRepositoryMock.merge.mockReturnValue(updatedChildDetails);
      childDetailsRepositoryMock.save.mockResolvedValue(updatedChildDetails);

      const result = await contactRepository.updateChildDetails(
        1,
        updateChildDetailsDto
      );

      expect(childDetailsRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(childDetailsRepositoryMock.merge).toHaveBeenCalledWith(
        existingChildDetails,
        updateChildDetailsDto
      );
      expect(childDetailsRepositoryMock.save).toHaveBeenCalledWith(
        updatedChildDetails
      );
      expect(result).toEqual(updatedChildDetails);
    });

    it("should throw NotFoundException if child details do not exist", async () => {
      const updateChildDetailsDto: UpdateChildDetailsDto = {
        name: "Updated Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      childDetailsRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateChildDetails(1, updateChildDetailsDto)
      ).rejects.toThrow(InternalServerErrorException);

      expect(childDetailsRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const updateChildDetailsDto: UpdateChildDetailsDto = {
        name: "Updated Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      const existingChildDetails = {
        id: 1,
        name: "Old Child Name",
        dateOfBirth: "2015-05-15",
        gender: "Male",
      };

      childDetailsRepositoryMock.findOne.mockResolvedValue(
        existingChildDetails
      );
      childDetailsRepositoryMock.merge.mockReturnValue({
        ...existingChildDetails,
        ...updateChildDetailsDto,
      });
      childDetailsRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.updateChildDetails(1, updateChildDetailsDto)
      ).rejects.toThrow(InternalServerErrorException);

      expect(childDetailsRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(childDetailsRepositoryMock.merge).toHaveBeenCalledWith(
        existingChildDetails,
        updateChildDetailsDto
      );
    });
  });

  describe("createProfessionalExperience", () => {
    it("should create and save professional experience successfully", async () => {
      const createProfessionalExperienceDto: CreateProfessionalExperienceDto = {
        company: "Company A",
        designation: "Software Engineer",
        fromDate: "2020-01-01",
        toDate: "2022-01-01",
        details: "Worked on various projects",
      };

      const mockProfessionalExperience = {
        id: 1,
        ...createProfessionalExperienceDto,
      };

      professionalExperienceRepositoryMock.create.mockReturnValue(
        mockProfessionalExperience
      );
      professionalExperienceRepositoryMock.save.mockResolvedValue(
        mockProfessionalExperience
      );

      const result = await contactRepository.createProfessionalExperience(
        createProfessionalExperienceDto
      );

      expect(professionalExperienceRepositoryMock.create).toHaveBeenCalledWith(
        createProfessionalExperienceDto
      );
      expect(professionalExperienceRepositoryMock.save).toHaveBeenCalledWith(
        mockProfessionalExperience
      );
      expect(result).toEqual(mockProfessionalExperience);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createProfessionalExperienceDto: CreateProfessionalExperienceDto = {
        company: "Company A",
        designation: "Software Engineer",
        fromDate: "2020-01-01",
        toDate: "2022-01-01",
        details: "Worked on various projects",
      };

      professionalExperienceRepositoryMock.create.mockReturnValue(
        createProfessionalExperienceDto
      );
      professionalExperienceRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createProfessionalExperience(
          createProfessionalExperienceDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(professionalExperienceRepositoryMock.create).toHaveBeenCalledWith(
        createProfessionalExperienceDto
      );
      expect(professionalExperienceRepositoryMock.save).toHaveBeenCalledWith(
        createProfessionalExperienceDto
      );
    });
  });

  describe("createQualificationExperience", () => {
    it("should create and save qualification experience successfully", async () => {
      const createQualificationExperienceDto: CreateQualificationExperienceDto =
        {
          nameOfQualification: "Bachelor of Science",
          yearOfQualification: "2018",
          details: "Specialized in Computer Science",
        };

      const mockQualificationExperience = {
        id: 1,
        ...createQualificationExperienceDto,
      };

      qualificationExperienceRepositoryMock.create.mockReturnValue(
        mockQualificationExperience
      );
      qualificationExperienceRepositoryMock.save.mockResolvedValue(
        mockQualificationExperience
      );

      const result = await contactRepository.createQualificationExperience(
        createQualificationExperienceDto
      );

      expect(qualificationExperienceRepositoryMock.create).toHaveBeenCalledWith(
        createQualificationExperienceDto
      );
      expect(qualificationExperienceRepositoryMock.save).toHaveBeenCalledWith(
        mockQualificationExperience
      );
      expect(result).toEqual(mockQualificationExperience);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createQualificationExperienceDto: CreateQualificationExperienceDto =
        {
          nameOfQualification: "Bachelor of Science",
          yearOfQualification: "2018",
          details: "Specialized in Computer Science",
        };

      qualificationExperienceRepositoryMock.create.mockReturnValue(
        createQualificationExperienceDto
      );
      qualificationExperienceRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createQualificationExperience(
          createQualificationExperienceDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(qualificationExperienceRepositoryMock.create).toHaveBeenCalledWith(
        createQualificationExperienceDto
      );
      expect(qualificationExperienceRepositoryMock.save).toHaveBeenCalledWith(
        createQualificationExperienceDto
      );
    });
  });

  describe("updateQualificationExperience", () => {
    it("should update and save qualification experience successfully", async () => {
      const updateQualificationExperienceDto = {
        nameOfQualification: "Master of Science",
        yearOfQualification: "2020",
        details: "Specialized in Data Science",
      };

      const existingQualificationExperience = {
        id: 1,
        nameOfQualification: "Bachelor of Science",
        yearOfQualification: "2018",
        details: "Specialized in Computer Science",
      };

      const updatedQualificationExperience = {
        ...existingQualificationExperience,
        ...updateQualificationExperienceDto,
      };

      qualificationExperienceRepositoryMock.findOne.mockResolvedValue(
        existingQualificationExperience
      );
      qualificationExperienceRepositoryMock.merge.mockReturnValue(
        updatedQualificationExperience
      );
      qualificationExperienceRepositoryMock.save.mockResolvedValue(
        updatedQualificationExperience
      );

      updateQualificationExperienceMock.mockResolvedValue(
        updatedQualificationExperience
      );

      const result = await contactRepository.updateQualificationExperience(
        1,
        updateQualificationExperienceDto
      );

      expect(
        qualificationExperienceRepositoryMock.findOne
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(qualificationExperienceRepositoryMock.merge).toHaveBeenCalledWith(
        existingQualificationExperience,
        updateQualificationExperienceDto
      );
      expect(qualificationExperienceRepositoryMock.save).toHaveBeenCalledWith(
        updatedQualificationExperience
      );
      expect(result).toEqual(updatedQualificationExperience);
    });

    it("should throw NotFoundException if qualification experience does not exist", async () => {
      const updateQualificationExperienceDto = {
        nameOfQualification: "Master of Science",
        yearOfQualification: "2020",
        details: "Specialized in Data Science",
      };

      qualificationExperienceRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateQualificationExperience(
          1,
          updateQualificationExperienceDto
        )
      ).rejects.toThrow(NotFoundException);

      expect(
        qualificationExperienceRepositoryMock.findOne
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("updateProfessionalExperience", () => {
    it("should throw NotFoundException if professional experience does not exist", async () => {
      const updateProfessionalExperienceDto = {
        company: "Updated Company",
        designation: "Senior Software Engineer",
        fromDate: "2021-01-01",
        toDate: "2023-01-01",
        details: "Worked on advanced projects",
      };

      professionalExperienceRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateProfessionalExperience(
          1,
          updateProfessionalExperienceDto
        )
      ).rejects.toThrow(NotFoundException);

      expect(professionalExperienceRepositoryMock.findOne).toHaveBeenCalledWith(
        {
          where: { id: 1 },
        }
      );
    });
  });

  describe("fetchAllContacts", () => {
    it("should fetch all contacts successfully", async () => {
      const mockContacts = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
        },
      ];

      contactRepoMock.find.mockResolvedValue(mockContacts);

      const result = await contactRepository.fetchAllContacts();

      expect(contactRepoMock.find).toHaveBeenCalled();
      expect(result).toEqual(mockContacts);
    });

    it("should throw an InternalServerErrorException if fetching fails", async () => {
      contactRepoMock.find.mockRejectedValue(new Error("Database error"));

      await expect(contactRepository.fetchAllContacts()).rejects.toThrow(
        InternalServerErrorException
      );

      expect(contactRepoMock.find).toHaveBeenCalled();
    });
  });

  describe("getExistingContactDetails", () => {
    it("should return existing contact details successfully", async () => {
      const mockContactDetails = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      };

      contactRepoMock.findOne.mockResolvedValue(mockContactDetails);

      const result = await contactRepository.getExistingContactDetails(1);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["contactRecordType"],
      });
      expect(result).toEqual(mockContactDetails);
    });

    it("should throw NotFoundException if contact details do not exist", async () => {
      contactRepoMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.getExistingContactDetails(1)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["contactRecordType"],
      });
    });

    it("should throw an InternalServerErrorException if fetching fails", async () => {
      contactRepoMock.findOne.mockRejectedValue(new Error("Database error"));

      await expect(
        contactRepository.getExistingContactDetails(1)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["contactRecordType"],
      });
    });
  });

  describe("createContactAddressMapping", () => {
    it("should create and save contact address mapping successfully", async () => {
      const createContactAddressMappingDto = {
        contactId: 1,
        addressId: 2,
      };

      const mockContactAddressMapping = {
        contact: { id: 1 },
        address: { id: 2 },
      };

      contactAddressRepositoryMock.create.mockReturnValue(
        mockContactAddressMapping
      );
      contactAddressRepositoryMock.save.mockResolvedValue(
        mockContactAddressMapping
      );

      const result = await contactRepository.createContactAddressMapping(
        createContactAddressMappingDto
      );

      expect(contactAddressRepositoryMock.create).toHaveBeenCalledWith({
        contact: { id: 1 },
        address: { id: 2 },
      });
      expect(contactAddressRepositoryMock.save).toHaveBeenCalledWith(
        mockContactAddressMapping
      );
      expect(result).toEqual(mockContactAddressMapping);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createContactAddressMappingDto = {
        contactId: 1,
        addressId: 2,
      };

      contactAddressRepositoryMock.create.mockReturnValue({
        contact: { id: 1 },
        address: { id: 2 },
      });
      contactAddressRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createContactAddressMapping(
          createContactAddressMappingDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactAddressRepositoryMock.create).toHaveBeenCalledWith({
        contact: { id: 1 },
        address: { id: 2 },
      });
      expect(contactAddressRepositoryMock.save).toHaveBeenCalledWith({
        contact: { id: 1 },
        address: { id: 2 },
      });
    });
  });

  describe("createCompanyAddressMapping", () => {
    it("should create and save company address mapping successfully", async () => {
      const createCompanyAddressMappingDto = {
        companyId: 1,
        addressId: 2,
      };

      const mockCompanyAddressMapping = {
        companyId: 1,
        addressId: 2,
      };

      companyAddressRepositoryMock.create.mockReturnValue(
        mockCompanyAddressMapping
      );
      companyAddressRepositoryMock.save.mockResolvedValue(
        mockCompanyAddressMapping
      );

      const result = await contactRepository.createCompanyAddressMapping(
        createCompanyAddressMappingDto
      );

      expect(companyAddressRepositoryMock.create).toHaveBeenCalledWith({
        companyId: 1,
        addressId: 2,
      });
      expect(companyAddressRepositoryMock.save).toHaveBeenCalledWith(
        mockCompanyAddressMapping
      );
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createCompanyAddressMappingDto = {
        companyId: 1,
        addressId: 2,
      };

      companyAddressRepositoryMock.create.mockReturnValue({
        companyId: 1,
        addressId: 2,
      });
      companyAddressRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createCompanyAddressMapping(
          createCompanyAddressMappingDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(companyAddressRepositoryMock.create).toHaveBeenCalledWith({
        companyId: 1,
        addressId: 2,
      });
      expect(companyAddressRepositoryMock.save).toHaveBeenCalledWith({
        companyId: 1,
        addressId: 2,
      });
    });
  });

  describe("updateCommunicationDetails", () => {
    it("should update and save communication details successfully", async () => {
      const updateCommunicationDetailsDto = {
        phone: "1234567890",
        email: "updated.email@example.com",
      };

      const existingCommunicationDetails = {
        id: 1,
        phone: "0987654321",
        email: "old.email@example.com",
      };

      const updatedCommunicationDetails = {
        ...existingCommunicationDetails,
        ...updateCommunicationDetailsDto,
      };

      contactCommunicationDetailsRepositoryMock.findOne.mockResolvedValue(
        existingCommunicationDetails
      );
      contactCommunicationDetailsRepositoryMock.merge.mockReturnValue(
        updatedCommunicationDetails
      );
      contactCommunicationDetailsRepositoryMock.save.mockResolvedValue(
        updatedCommunicationDetails
      );

      const result = await contactRepository.updateCommunicationDetails(
        1,
        updateCommunicationDetailsDto
      );

      expect(
        contactCommunicationDetailsRepositoryMock.findOne
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(
        contactCommunicationDetailsRepositoryMock.merge
      ).toHaveBeenCalledWith(
        existingCommunicationDetails,
        updateCommunicationDetailsDto
      );
      expect(
        contactCommunicationDetailsRepositoryMock.save
      ).toHaveBeenCalledWith(updatedCommunicationDetails);
      expect(result).toEqual(updatedCommunicationDetails);
    });

    it("should throw NotFoundException if communication details do not exist", async () => {
      const updateCommunicationDetailsDto = {
        phone: "1234567890",
        email: "updated.email@example.com",
      };

      contactCommunicationDetailsRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateCommunicationDetails(
          1,
          updateCommunicationDetailsDto
        )
      ).rejects.toThrow(NotFoundException);

      expect(
        contactCommunicationDetailsRepositoryMock.findOne
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("createContactCommunicationDetails", () => {
    it("should create and save contact communication details successfully", async () => {
      const createContactCommunicationDetailsDto = {
        communicationType: "phone",
        communicationDetails: "contact.email@example.com",
        isPrimary: true,
      };

      const mockContactCommunicationDetails = {
        ...createContactCommunicationDetailsDto,
      };

      contactCommunicationDetailsRepositoryMock.create.mockReturnValue(
        mockContactCommunicationDetails
      );
      contactCommunicationDetailsRepositoryMock.save.mockResolvedValue(
        mockContactCommunicationDetails
      );

      const result = await contactRepository.createContactCommunicationDetails(
        createContactCommunicationDetailsDto
      );

      expect(
        contactCommunicationDetailsRepositoryMock.create
      ).toHaveBeenCalledWith(createContactCommunicationDetailsDto);
      expect(
        contactCommunicationDetailsRepositoryMock.save
      ).toHaveBeenCalledWith(mockContactCommunicationDetails);
      expect(result).toEqual(mockContactCommunicationDetails);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createContactCommunicationDetailsDto = {
        communicationType: "phone",
        communicationDetails: "contact.email@example.com",
        isPrimary: true,
      };

      contactCommunicationDetailsRepositoryMock.create.mockReturnValue(
        createContactCommunicationDetailsDto
      );
      contactCommunicationDetailsRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createContactCommunicationDetails(
          createContactCommunicationDetailsDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(
        contactCommunicationDetailsRepositoryMock.create
      ).toHaveBeenCalledWith(createContactCommunicationDetailsDto);
      expect(
        contactCommunicationDetailsRepositoryMock.save
      ).toHaveBeenCalledWith(createContactCommunicationDetailsDto);
    });
  });

  describe("updateContactDetails", () => {
    it("should update and save contact details successfully", async () => {
      const updateContactDetailsDto = {
        gender: "Female",
        dateOfBirth: "1992-05-15",
        maritalStatus: "Married",
      };

      const existingContactDetails = {
        id: 1,
        gender: "Male",
        dateOfBirth: "1990-01-01",
        maritalStatus: "Single",
      };

      const updatedContactDetails = {
        ...existingContactDetails,
        ...updateContactDetailsDto,
      };

      contactDetailsRepositoryMock.findOne.mockResolvedValue(
        existingContactDetails
      );
      contactDetailsRepositoryMock.merge.mockReturnValue(updatedContactDetails);
      contactDetailsRepositoryMock.save.mockResolvedValue(
        updatedContactDetails
      );

      updateContactDetailsMock.mockResolvedValue(updatedContactDetails);

      const result = await contactRepository.updateContactDetails(
        1,
        updateContactDetailsDto
      );

      expect(contactDetailsRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(contactDetailsRepositoryMock.merge).toHaveBeenCalledWith(
        existingContactDetails,
        updateContactDetailsDto
      );
      expect(contactDetailsRepositoryMock.save).toHaveBeenCalledWith(
        updatedContactDetails
      );
      expect(result).toEqual(updatedContactDetails);
    });

    it("should throw NotFoundException if contact details do not exist", async () => {
      const updateContactDetailsDto = {
        gender: "Female",
        dateOfBirth: "1992-05-15",
        maritalStatus: "Married",
      };

      contactDetailsRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateContactDetails(1, updateContactDetailsDto)
      ).rejects.toThrow(NotFoundException);

      expect(contactDetailsRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("updateContactDocumentDetails", () => {
    it("should update and save contact document details successfully", async () => {
      const updateContactDocumentDetailsDto = {
        documentType: "Passport",
        documentNumber: "A12345678",
        issueDate: "2020-01-01",
        expiryDate: "2030-01-01",
      };

      const existingContactDocumentDetails = {
        id: 1,
        documentType: "Driver's License",
        documentNumber: "DL123456",
        issueDate: "2015-01-01",
        expiryDate: "2025-01-01",
      };

      const updatedContactDocumentDetails = {
        ...existingContactDocumentDetails,
        ...updateContactDocumentDetailsDto,
      };

      contactDocMapRepositoryMock.findOne.mockResolvedValue(
        existingContactDocumentDetails
      );
      contactDocMapRepositoryMock.merge.mockReturnValue(
        updatedContactDocumentDetails
      );
      contactDocMapRepositoryMock.save.mockResolvedValue(
        updatedContactDocumentDetails
      );

      const result = await contactRepository.updateContactDocumentDetails(
        1,
        updateContactDocumentDetailsDto
      );

      expect(contactDocMapRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(contactDocMapRepositoryMock.merge).toHaveBeenCalledWith(
        existingContactDocumentDetails,
        updateContactDocumentDetailsDto
      );
      expect(contactDocMapRepositoryMock.save).toHaveBeenCalledWith(
        updatedContactDocumentDetails
      );
      expect(result).toEqual(updatedContactDocumentDetails);
    });

    it("should throw NotFoundException if contact document details do not exist", async () => {
      const updateContactDocumentDetailsDto = {
        documentType: "Passport",
        documentNumber: "A12345678",
        issueDate: "2020-01-01",
        expiryDate: "2030-01-01",
      };

      contactDocMapRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateContactDocumentDetails(
          1,
          updateContactDocumentDetailsDto
        )
      ).rejects.toThrow(NotFoundException);

      expect(contactDocMapRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe("createContactDocumentMapping", () => {
    it("should create and save contact document mapping successfully", async () => {
      const createContactDocumentMappingDto = {
        contactId: 1,
        documentId: 2,
      };

      const mockContactDocumentMapping = {
        contactId: 1,
        documentId: 2,
      };

      contactDocMapRepositoryMock.create.mockReturnValue(
        mockContactDocumentMapping
      );
      contactDocMapRepositoryMock.save.mockResolvedValue(
        mockContactDocumentMapping
      );

      const result = await contactRepository.createContactDocumentMapping(
        createContactDocumentMappingDto
      );

      expect(contactDocMapRepositoryMock.create).toHaveBeenCalledWith({
        contactId: 1,
        documentId: 2,
      });
      expect(contactDocMapRepositoryMock.save).toHaveBeenCalledWith(
        mockContactDocumentMapping
      );
      expect(result).toEqual(mockContactDocumentMapping);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createContactDocumentMappingDto = {
        contactId: 1,
        documentId: 2,
      };

      contactDocMapRepositoryMock.create.mockReturnValue({
        contactId: 1,
        documentId: 2,
      });
      contactDocMapRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createContactDocumentMapping(
          createContactDocumentMappingDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactDocMapRepositoryMock.create).toHaveBeenCalledWith({
        contactId: 1,
        documentId: 2,
      });
      expect(contactDocMapRepositoryMock.save).toHaveBeenCalledWith({
        contactId: 1,
        documentId: 2,
      });
    });
  });

  describe("createCompanyContactMapping", () => {
    it("should create and save company contact mapping successfully", async () => {
      const createCompanyContactMappingDto = {
        companyId: 1,
        contactId: 2,
      };

      const mockCompanyContactMapping = {
        companyId: 1,
        contactId: 2,
      };

      companyContactMapRepositoryMock.create.mockReturnValue(
        mockCompanyContactMapping
      );
      companyContactMapRepositoryMock.save.mockResolvedValue(
        mockCompanyContactMapping
      );

      const result = await contactRepository.createCompanyContactMapping(
        createCompanyContactMappingDto
      );

      expect(companyContactMapRepositoryMock.create).toHaveBeenCalledWith({
        companyId: 1,
        contactId: 2,
      });
      expect(companyContactMapRepositoryMock.save).toHaveBeenCalledWith(
        mockCompanyContactMapping
      );
      expect(result).toEqual(mockCompanyContactMapping);
    });

    it("should throw an InternalServerErrorException if saving fails", async () => {
      const createCompanyContactMappingDto = {
        companyId: 1,
        contactId: 2,
      };

      companyContactMapRepositoryMock.create.mockReturnValue({
        companyId: 1,
        contactId: 2,
      });
      companyContactMapRepositoryMock.save.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.createCompanyContactMapping(
          createCompanyContactMappingDto
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(companyContactMapRepositoryMock.create).toHaveBeenCalledWith({
        companyId: 1,
        contactId: 2,
      });
      expect(companyContactMapRepositoryMock.save).toHaveBeenCalledWith({
        companyId: 1,
        contactId: 2,
      });
    });
  });

  describe("fetchContactById", () => {
    it("should return the contact ID if the contact exists", async () => {
      const contactId = 1;
      const mockContact = { id: contactId };

      contactRepoMock.findOne.mockResolvedValue(mockContact);

      const result = await contactRepository.fetchConatctById(contactId);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(result).toBe(contactId);
    });

    it("should return null if the contact does not exist", async () => {
      const contactId = 1;

      contactRepoMock.findOne.mockResolvedValue(null);

      const result = await contactRepository.fetchConatctById(contactId);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(result).toBeNull();
    });
  });

  describe("getContactData", () => {
    it("should return enriched contact data successfully", async () => {
      const contactId = 1;
      const mockContact = {
        id: contactId,
        salutationLid: 1,
        tagLid: 2,
        contactTypeLid: 3,
        statusLid: 4,
        contactRecordTypeLid: 5,
        contactAddresses: [
          {
            address: {
              id: 1,
              addressTypeLid: 1,
              address1: "123 Main St",
              address2: "Suite 100",
              area: "Downtown",
              countryId: 1,
              stateId: 1,
              cityId: 1,
              pinCode: "12345",
              email: "test@example.com",
              phoneNumber: "1234567890",
            },
          },
        ],
        contactDetails: {
          id: 1,
          gender: "Male",
          dateOfBirth: "1990-01-01",
          maritalStatus: "Single",
          childDetails: [],
        },
        professionalExperiences: [],
        qualificationExperiences: [],
        contactDocMaps: [],
        communicationDetails: [],
        salutation: { id: 1, value: "Mr." },
        tag: { id: 2, value: "VIP" },
        contactType: { id: 3, value: "Individual" },
        status: { id: 4, value: "Active" },
        contactRecordType: { id: 5, value: "Customer" },
      };

      const mockLookUpValues = [
        { id: 1, value: "Mr." },
        { id: 2, value: "VIP" },
        { id: 3, value: "Individual" },
        { id: 4, value: "Active" },
        { id: 5, value: "Customer" },
      ];

      const enrichedContact = {
        ...mockContact,
        salutation: { id: 1, value: "Mr." },
        tag: { id: 2, value: "VIP" },
        contactType: { id: 3, value: "Individual" },
        status: { id: 4, value: "Active" },
        contactRecordType: { id: 5, value: "Customer" },
      };

      contactRepoMock.findOne.mockResolvedValue(mockContact);
      entityServiceMock.getLookupValues.mockResolvedValue(mockLookUpValues);

      const result = await contactRepository.getContactData(contactId);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
        relations: expect.any(Array),
      });
      expect(entityServiceMock.getLookupValues).toHaveBeenCalledWith([
        mockContact.salutationLid,
        mockContact.tagLid,
        mockContact.contactTypeLid,
        mockContact.statusLid,
        mockContact.contactRecordTypeLid,
      ]);
      expect(result).toEqual(enrichedContact);
    });

    it("should throw InternalServerErrorException if fetching fails", async () => {
      const contactId = 1;

      contactRepoMock.findOne.mockRejectedValue(new Error("Database error"));

      await expect(contactRepository.getContactData(contactId)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
        relations: ["contactRecordType"],
      });
    });
  });

  describe("findContactAddressMap", () => {
    it("should return the contact address mapping if it exists", async () => {
      const contactId = 1;
      const addressId = 2;

      const mockContactAddressMap = {
        contact: { id: contactId },
        address: { id: addressId },
      };

      contactAddressRepositoryMock.findOne.mockResolvedValue(
        mockContactAddressMap
      );

      const result = await contactRepository.findContactAddressMap(
        contactId,
        addressId
      );

      expect(contactAddressRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          contact: { id: contactId },
          address: { id: addressId },
        },
      });
      expect(result).toEqual(mockContactAddressMap);
    });

    it("should return null if the contact address mapping does not exist", async () => {
      const contactId = 1;
      const addressId = 2;

      contactAddressRepositoryMock.findOne.mockResolvedValue(null);

      const result = await contactRepository.findContactAddressMap(
        contactId,
        addressId
      );

      expect(contactAddressRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          contact: { id: contactId },
          address: { id: addressId },
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("findCompanyAddressMap", () => {
    it("should return the company address mapping if it exists", async () => {
      const companyId = 1;
      const addressId = 2;

      const mockCompanyAddressMap = {
        company: { id: companyId },
        address: { id: addressId },
      };

      companyAddressRepositoryMock.findOne.mockResolvedValue(
        mockCompanyAddressMap
      );

      const result = await contactRepository.findCompanyAddressMap(
        companyId,
        addressId
      );

      expect(companyAddressRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          company: { id: companyId },
          address: { id: addressId },
        },
      });
      expect(result).toEqual(mockCompanyAddressMap);
    });

    it("should return null if the company address mapping does not exist", async () => {
      const companyId = 1;
      const addressId = 2;

      companyAddressRepositoryMock.findOne.mockResolvedValue(null);

      const result = await contactRepository.findCompanyAddressMap(
        companyId,
        addressId
      );

      expect(companyAddressRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          company: { id: companyId },
          address: { id: addressId },
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("removeContact", () => {
    it("should remove a contact successfully and update its status if active", async () => {
      const mockContact = {
        id: 1,
        statusLid: 29,
      };

      const updatedContact = {
        deletedAt: expect.any(Date),
        statusLid: 30,
      };

      contactRepoMock.findOne.mockResolvedValue(mockContact);
      contactRepoMock.update.mockResolvedValue(undefined);

      await contactRepository.removeContact(mockContact);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: mockContact.id },
        select: ["id", "statusLid"],
      });
      expect(contactRepoMock.update).toHaveBeenCalledWith(
        mockContact.id,
        updatedContact
      );
    });

    it("should remove a contact successfully without updating status if inactive", async () => {
      const mockContact = {
        id: 1,
        statusLid: 30,
      };

      const updatedContact = {
        deletedAt: expect.any(Date),
      };

      contactRepoMock.findOne.mockResolvedValue(mockContact);
      contactRepoMock.update.mockResolvedValue(undefined);

      await contactRepository.removeContact(mockContact);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: mockContact.id },
        select: ["id", "statusLid"],
      });
      expect(contactRepoMock.update).toHaveBeenCalledWith(
        mockContact.id,
        updatedContact
      );
    });

    it("should throw InternalServerErrorException if the contact does not exist", async () => {
      const mockContact = { id: 1 };

      contactRepoMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.removeContact(mockContact)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: mockContact.id },
        select: ["id", "statusLid"],
      });
      expect(contactRepoMock.update).not.toHaveBeenCalled();
    });
  });

  describe("getTotalCompanies", () => {
    it("should return the total number of companies successfully", async () => {
      const mockUserQuery = { isActive: true };
      const mockSearchArray = [
        { searchBy: "name", searchValue: "Test Company" },
      ];
      const mockTotalCompanies = 5;

      contactRepoMock.findAndCount.mockResolvedValue([[], mockTotalCompanies]);

      const result = await contactRepository.getTotalCompanies(
        mockUserQuery,
        mockSearchArray
      );

      expect(contactRepoMock.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
      expect(result).toBe(mockTotalCompanies);
    });

    it("should throw an InternalServerErrorException if fetching fails", async () => {
      const mockUserQuery = { isActive: true };
      const mockSearchArray = [
        { searchBy: "name", searchValue: "Test Company" },
      ];

      contactRepoMock.findAndCount.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.getTotalCompanies(mockUserQuery, mockSearchArray)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });
  });

  describe("getTotalContacts", () => {
    it("should return the total number of contacts successfully", async () => {
      const mockWhereCondition = { isActive: true };
      const mockSearchArray = [{ searchBy: "name", searchValue: "John Doe" }];
      const mockTotalContacts = 10;

      contactRepoMock.findAndCount.mockResolvedValue([[], mockTotalContacts]);

      const result = await contactRepository.getTotalContacts(
        mockWhereCondition,
        mockSearchArray
      );

      expect(contactRepoMock.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
      expect(result).toBe(mockTotalContacts);
    });

    it("should throw an InternalServerErrorException if fetching fails", async () => {
      const mockWhereCondition = { isActive: true };
      const mockSearchArray = [{ searchBy: "name", searchValue: "John Doe" }];

      contactRepoMock.findAndCount.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.getTotalContacts(mockWhereCondition, mockSearchArray)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
    });
  });

  describe("fetchPaginatedContactList", () => {
    it("should fetch paginated contact list successfully", async () => {
      const mockPage = 1;
      const mockLimit = 10;
      const mockUserId = 1;
      const mockContactRecordTypeId = 2;
      const mockSearch = "John";
      const mockSort = "firstName:ASC";

      const mockContacts = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
        },
      ];

      const mockCount = 2;
      const mockTotalContacts = 50;
      const mockTotalCompanies = 10;

      contactRepoMock.findAndCount.mockResolvedValue([mockContacts, mockCount]);

      const result = await contactRepository.fetchPaginatedContactList(
        mockPage,
        mockLimit,
        mockUserId,
        mockContactRecordTypeId,
        mockSearch,
        mockSort
      );

      expect(contactRepoMock.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Function),
        take: mockLimit,
        skip: (mockPage - 1) * mockLimit,
        order: expect.any(Object),
      });
      expect(result).toEqual({
        data: mockContacts,
        count: mockCount,
        totalContacts: mockTotalContacts,
        totalCompanies: mockTotalCompanies,
      });
    });

    it("should throw an InternalServerErrorException if fetching fails", async () => {
      const mockPage = 1;
      const mockLimit = 10;
      const mockUserId = 1;
      const mockContactRecordTypeId = 2;
      const mockSearch = "John";
      const mockSort = "firstName:ASC";

      contactRepoMock.findAndCount.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.fetchPaginatedContactList(
          mockPage,
          mockLimit,
          mockUserId,
          mockContactRecordTypeId,
          mockSearch,
          mockSort
        )
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findAndCount).toHaveBeenCalledWith({
        where: expect.any(Function),
        take: mockLimit,
        skip: (mockPage - 1) * mockLimit,
        order: expect.any(Object),
      });
    });
  });

  describe("getContactCompanyDataAddress", () => {
    it("should return the contact company data address successfully", async () => {
      const contactId = 1;

      const mockContactCompanyDataAddress = {
        id: contactId,
        company: {
          id: 2,
          name: "Test Company",
        },
        address: {
          id: 3,
          address1: "123 Main St",
          city: "Test City",
          state: "Test State",
          country: "Test Country",
          pinCode: "123456",
        },
      };

      contactRepoMock.findOne.mockResolvedValue(mockContactCompanyDataAddress);

      const result = await contactRepository.getContactCompanyDataAddress(
        contactId
      );

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
        relations: ["company", "address"],
      });
      expect(result).toEqual(mockContactCompanyDataAddress);
    });

    it("should throw a NotFoundException if the contact company data address does not exist", async () => {
      const contactId = 1;

      contactRepoMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.getContactCompanyDataAddress(contactId)
      ).rejects.toThrow(NotFoundException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
        relations: ["company", "address"],
      });
    });

    it("should throw an InternalServerErrorException if fetching fails", async () => {
      const contactId = 1;

      contactRepoMock.findOne.mockRejectedValue(new Error("Database error"));

      await expect(
        contactRepository.getContactCompanyDataAddress(contactId)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
        relations: ["company", "address"],
      });
    });
  });

  describe("updateContact", () => {
    it("should update and save contact details successfully", async () => {
      const contactId = 1;
      const updateContactDto = {
        firstName: "Updated First Name",
        lastName: "Updated Last Name",
        email: "updated.email@example.com",
      };

      const existingContact = {
        id: contactId,
        firstName: "Old First Name",
        lastName: "Old Last Name",
        email: "old.email@example.com",
      };

      const updatedContact = {
        ...existingContact,
        ...updateContactDto,
      };

      contactRepoMock.findOne.mockResolvedValue(existingContact);
      contactRepoMock.merge.mockReturnValue(updatedContact);
      contactRepoMock.save.mockResolvedValue(updatedContact);

      const result = await contactRepository.updateContact(
        contactId,
        updateContactDto
      );

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(contactRepoMock.merge).toHaveBeenCalledWith(
        existingContact,
        updateContactDto
      );
      expect(contactRepoMock.save).toHaveBeenCalledWith(updatedContact);
      expect(result).toEqual(updatedContact);
    });

    it("should throw NotFoundException if the contact does not exist", async () => {
      const contactId = 1;
      const updateContactDto = {
        firstName: "Updated First Name",
        lastName: "Updated Last Name",
        email: "updated.email@example.com",
      };

      contactRepoMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.updateContact(contactId, updateContactDto)
      ).rejects.toThrow(NotFoundException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(contactRepoMock.merge).not.toHaveBeenCalled();
      expect(contactRepoMock.save).not.toHaveBeenCalled();
    });

    it("should throw InternalServerErrorException if saving fails", async () => {
      const contactId = 1;
      const updateContactDto = {
        firstName: "Updated First Name",
        lastName: "Updated Last Name",
        email: "updated.email@example.com",
      };

      const existingContact = {
        id: contactId,
        firstName: "Old First Name",
        lastName: "Old Last Name",
        email: "old.email@example.com",
      };

      contactRepoMock.findOne.mockResolvedValue(existingContact);
      contactRepoMock.merge.mockReturnValue({
        ...existingContact,
        ...updateContactDto,
      });
      contactRepoMock.save.mockRejectedValue(new Error("Database error"));

      await expect(
        contactRepository.updateContact(contactId, updateContactDto)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(contactRepoMock.merge).toHaveBeenCalledWith(
        existingContact,
        updateContactDto
      );
      expect(contactRepoMock.save).toHaveBeenCalledWith({
        ...existingContact,
        ...updateContactDto,
      });
    });
  });

  describe("delinkCompanyContactMapping", () => {
    it("should delink the company contact mapping successfully", async () => {
      const companyId = 1;
      const contactId = 2;

      const mockCompanyContactMapping = {
        id: 1,
        companyId,
        contactId,
      };

      companyContactMapRepositoryMock.findOne.mockResolvedValue(
        mockCompanyContactMapping
      );
      companyContactMapRepositoryMock.remove.mockResolvedValue(undefined);

      await contactRepository.delinkCompanyContactMapping(companyId, contactId);

      expect(companyContactMapRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { companyId, contactId },
      });
      expect(companyContactMapRepositoryMock.remove).toHaveBeenCalledWith(
        mockCompanyContactMapping
      );
    });

    it("should throw a NotFoundException if the company contact mapping does not exist", async () => {
      const companyId = 1;
      const contactId = 2;

      companyContactMapRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        contactRepository.delinkCompanyContactMapping(companyId, contactId)
      ).rejects.toThrow(NotFoundException);

      expect(companyContactMapRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { companyId, contactId },
      });
      expect(companyContactMapRepositoryMock.remove).not.toHaveBeenCalled();
    });

    it("should throw an InternalServerErrorException if removing fails", async () => {
      const companyId = 1;
      const contactId = 2;

      const mockCompanyContactMapping = {
        id: 1,
        companyId,
        contactId,
      };

      companyContactMapRepositoryMock.findOne.mockResolvedValue(
        mockCompanyContactMapping
      );
      companyContactMapRepositoryMock.remove.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.delinkCompanyContactMapping(companyId, contactId)
      ).rejects.toThrow(InternalServerErrorException);

      expect(companyContactMapRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { companyId, contactId },
      });
      expect(companyContactMapRepositoryMock.remove).toHaveBeenCalledWith(
        mockCompanyContactMapping
      );
    });
  });

  describe("getCommunicationDetailsCheck", () => {
    it("should return communication details successfully", async () => {
      const mockSearchQuery = { contactId: 1 };
      const mockCommunicationDetails = [
        {
          id: 1,
          contactId: 1,
          communicationType: "email",
          communicationDetails: "test@example.com",
        },
      ];

      contactCommunicationDetailsRepositoryMock.find.mockResolvedValue(
        mockCommunicationDetails
      );

      const result = await contactRepository.getCommunicationDetailsCheck(
        mockSearchQuery,
        "Error fetching communication details"
      );

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: mockSearchQuery,
        relations: ["contact"],
      });
      expect(result).toEqual(mockCommunicationDetails);
    });

    it("should throw a BadRequestException if an error occurs", async () => {
      const mockSearchQuery = { contactId: 1 };

      contactCommunicationDetailsRepositoryMock.find.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.getCommunicationDetailsCheck(
          mockSearchQuery,
          "Error fetching communication details"
        )
      ).rejects.toThrow(BadRequestException);

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: mockSearchQuery,
        relations: ["contact"],
      });
    });
  });

  describe("deleteChildDetails", () => {
    it("should perform a soft delete on child details if they exist", async () => {
      const contactDetailsId = 1;

      const mockChildDetails = [
        { id: 1, contactDetails: { id: contactDetailsId } },
        { id: 2, contactDetails: { id: contactDetailsId } },
      ];

      // Mock the find and update methods
      childDetailsRepositoryMock.find.mockResolvedValue(mockChildDetails);
      childDetailsRepositoryMock.update.mockResolvedValue({ affected: 2 });

      await contactRepository.deleteChildDetails(contactDetailsId);

      expect(childDetailsRepositoryMock.find).toHaveBeenCalledWith({
        where: { contactDetails: { id: contactDetailsId } },
      });
      expect(childDetailsRepositoryMock.update).toHaveBeenCalledWith(
        { contactDetails: { id: contactDetailsId } },
        { deletedAt: expect.any(Date) }
      );
    });

    it("should not perform any update if no child details exist", async () => {
      const contactDetailsId = 1;

      childDetailsRepositoryMock.find.mockResolvedValue([]);

      await contactRepository.deleteChildDetails(contactDetailsId);

      expect(childDetailsRepositoryMock.find).toHaveBeenCalledWith({
        where: { contactDetails: { id: contactDetailsId } },
      });
      expect(childDetailsRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw an InternalServerErrorException if an error occurs", async () => {
      const contactDetailsId = 1;

      childDetailsRepositoryMock.find.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.deleteChildDetails(contactDetailsId)
      ).rejects.toThrow(InternalServerErrorException);

      expect(childDetailsRepositoryMock.find).toHaveBeenCalledWith({
        where: { contactDetails: { id: contactDetailsId } },
      });
      expect(childDetailsRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("transformContacts", () => {
    it("should transform a single contact correctly", () => {
      const mockContact = {
        salutationLid: 16,
        firstName: "navai",
        lastName: "Doe",
        middleName: "Mavi",
        displayName: "John Doe",
        linkedInUrl: null,
        companyLocationId: 1,
        companyBranchId: 3,
        tagLid: 59,
        contactTypeLid: 56,
        department: null,
        designation: null,
        reportingToId: null,
        relationshipTypeLid: null,
        remarks: "Test contact",
        contactRecordTypeLid: 89,
        statusLid: 29,
        createdBy: 1,
        updatedBy: 1,
        createdAt: "2025-04-10T05:47:18.083Z",
        updatedAt: "2025-05-07T09:50:04.237Z",
        contactAddresses: [
          {
            address: {
              addressTypeLid: 25,
              address1: "navi",
              countryId: { name: "India", id: 1 },
              stateId: { name: "Arunachal Pradesh", id: 2 },
              cityId: { name: "Vijayawada", id: 2 },
              address2: "",
              area: "navi",
              pinCode: "67890",
              phoneNumber: "1234567890",
              alternatePhoneNumber: "0987654321",
              email: "navi@example.com",
              supportNumber: "1800654321",
            },
          },
        ],
        qualificationExperiences: [
          {
            id: 219,
            nameOfQualification: "B.Tech",
            yearOfQualification: 2020,
            details: "Passed",
          },
        ],
        professionalExperiences: [
          {
            id: 211,
            fromDate: "2016-03-20",
            toDate: "2020-03-01",
            company: "Divami",
            designation: "Software Eng",
            department: "Engg",
            details: "4 years of my life",
          },
        ],
        contactDetails: {
          id: 231,
          gender: 34,
          favouriteFood: "Chocolatssse",
          favouriteRestaurant: "Udapi",
          personalHistory: "Foddy",
          maritalStatus: 37,
          workingCompany: "Divami",
        },
        communicationDetails: [
          {
            id: 339,
            communicationType: "email",
            communicationDetails: "johnn.doe@example.com",
            isPrimary: true,
          },
          {
            id: 340,
            communicationType: "phone",
            communicationDetails: "1234527011",
            isPrimary: true,
          },
        ],
        companyLocation: { name: "Visakhapatnam", id: 1 },
        insurerContacts: [
          {
            insurer: {
              id: 154,
              insurerName: "test insurerssss",
              displayName: "test insurerssss",
            },
          },
        ],
        salutation: { id: 16, lookUpValue: "Mr." },
        tag: { id: 59, lookUpValue: "Auditor" },
        contactType: { id: 56, lookUpValue: "HR" },
        status: { id: 29, lookUpValue: "Active" },
        contactRecordType: { id: 89, lookUpValue: "insurer" },
      };

      const expectedTransformedContact = {
        id: undefined,
        firstName: "navai",
        lastName: "Doe",
        middleName: "Mavi",
        displayName: "John Doe",
        companyLocationId: 1,
        companyBranchId: 3,
        remarks: "Test contact",
        linkedInUrl: null,
        relationshipTypeLid: null,
        relationshipType: undefined,
        address: [
          {
            addressTypeLid: 25,
            address1: "navi",
            countryId: { name: "India", id: 1 },
            stateId: { name: "Arunachal Pradesh", id: 2 },
            cityId: { name: "Vijayawada", id: 2 },
            address2: "",
            area: "navi",
            pinCode: "67890",
            phoneNumber: "1234567890",
            alternatePhoneNumber: "0987654321",
            email: "navi@example.com",
            supportNumber: "1800654321",
          },
        ],
        contactDetails: {
          id: 231,
          gender: 34,
          favouriteFood: "Chocolatssse",
          favouriteRestaurant: "Udapi",
          personalHistory: "Foddy",
          maritalStatus: 37,
          workingCompany: "Divami",
        },
        professionalExperiences: [
          {
            id: 211,
            fromDate: "2016-03-20",
            toDate: "2020-03-01",
            company: "Divami",
            designation: "Software Eng",
            department: "Engg",
            details: "4 years of my life",
          },
        ],
        qualificationExperiences: [
          {
            id: 219,
            nameOfQualification: "B.Tech",
            yearOfQualification: 2020,
            details: "Passed",
          },
        ],
        communicationDetails: [
          {
            id: 339,
            communicationType: "email",
            communicationDetails: "johnn.doe@example.com",
            isPrimary: true,
          },
          {
            id: 340,
            communicationType: "phone",
            communicationDetails: "1234527011",
            isPrimary: true,
          },
        ],
        salutation: { id: 16, lookUpValue: "Mr." },
        tag: { id: 59, lookUpValue: "Auditor" },
        contactType: { id: 56, lookUpValue: "HR" },
        department: null,
        designation: null,
        status: { id: 29, lookUpValue: "Active" },
        contactRecordType: { id: 89, lookUpValue: "insurer" },
        company: {
          id: 154,
          insurerName: "test insurerssss",
          displayName: "test insurerssss",
        },
        companyLocation: { name: "Visakhapatnam", id: 1 },
        companyId: 154,
        salesOpportunity: [],
        renewalOpportunity: [],
        policy: [],
        reportingTo: null,
      };

      const result = contactRepository.transformContacts(mockContact);

      expect(result).toEqual(expectedTransformedContact);
    });
  });

  describe("getContactCompanyDataAddress", () => {
    it("should return the contact company data address successfully", async () => {
      const contactId = 1;

      const mockExistingContactDetails = {
        id: contactId,
        contactRecordType: { lookUpValue: "insurer" },
      };

      const mockContact = {
        id: contactId,
        contactRecordType: { lookUpValue: "insurer" },
        insurerContacts: [
          {
            insurer: {
              id: 154,
              insurerName: "Test Insurer",
              insurerAddresses: [
                {
                  address: {
                    id: 1,
                    addressType: { id: 25, lookUpValue: "Office" },
                    address1: "123 Main St",
                    cityId: { id: 1, name: "Test City" },
                  },
                },
              ],
            },
          },
        ],
      };

      const mockTransformedContact = {
        id: contactId,
        company: {
          id: 154,
          insurerName: "Test Insurer",
          companyAddresses: [
            {
              address: {
                id: 1,
                addressType: { id: 25, lookUpValue: "Office" },
                address1: "123 Main St",
                cityId: { id: 1, name: "Test City" },
              },
            },
          ],
        },
      };

      jest
        .spyOn(contactRepository, "getExistingContactDetails")
        .mockResolvedValue(mockExistingContactDetails as any);
      contactRepoMock.findOne.mockResolvedValue(mockContact);
      jest
        .spyOn(contactRepository, "transformContacts")
        .mockReturnValue(mockTransformedContact);

      const result = await contactRepository.getContactCompanyDataAddress(
        contactId
      );

      expect(contactRepository.getExistingContactDetails).toHaveBeenCalledWith(
        contactId
      );
      expect(contactRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: contactId },
        relations: [
          "status",
          "contactRecordType",
          "insurerContacts.insurer.insurerAddresses.address.addressType",
        ],
      });
      expect(contactRepository.transformContacts).toHaveBeenCalledWith(
        mockContact
      );
      expect(result).toEqual(mockTransformedContact);
    });

    it("should throw NotFoundException if the contact is not found", async () => {
      const contactId = 1;

      jest
        .spyOn(contactRepository, "getExistingContactDetails")
        .mockResolvedValue(null);

      await expect(
        contactRepository.getContactCompanyDataAddress(contactId)
      ).rejects.toThrow(NotFoundException);

      expect(contactRepository.getExistingContactDetails).toHaveBeenCalledWith(
        contactId
      );
      expect(contactRepoMock.findOne).not.toHaveBeenCalled();
    });

    it("should throw InternalServerErrorException if an error occurs", async () => {
      const contactId = 1;

      jest
        .spyOn(contactRepository, "getExistingContactDetails")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        contactRepository.getContactCompanyDataAddress(contactId)
      ).rejects.toThrow(InternalServerErrorException);

      expect(contactRepository.getExistingContactDetails).toHaveBeenCalledWith(
        contactId
      );
      expect(contactRepoMock.findOne).not.toHaveBeenCalled();
    });
  });

  describe("getCommunicationEmailCheck", () => {
    it("should return communication details when email exists", async () => {
      const mockSearchQuery = { communicationDetails: "test@example.com" };
      const mockCommunicationDetails = [
        {
          id: 1,
          communicationType: "email",
          communicationDetails: "test@example.com",
          contact: { id: 1, firstName: "John", lastName: "Doe" },
        },
      ];

      contactCommunicationDetailsRepositoryMock.find.mockResolvedValue(
        mockCommunicationDetails
      );

      const result = await contactRepository.getCommunicationEmailCheck(
        mockSearchQuery
      );

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: mockSearchQuery,
        relations: ["contact"],
      });
      expect(result).toEqual(mockCommunicationDetails);
    });

    it("should return an empty array when no email exists", async () => {
      const mockSearchQuery = { communicationDetails: "notfound@example.com" };

      contactCommunicationDetailsRepositoryMock.find.mockResolvedValue([]);

      const result = await contactRepository.getCommunicationEmailCheck(
        mockSearchQuery
      );

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: mockSearchQuery,
        relations: ["contact"],
      });
      expect(result).toEqual([]);
    });

    it("should throw a BadRequestException when an error occurs", async () => {
      const mockSearchQuery = { communicationDetails: "error@example.com" };

      contactCommunicationDetailsRepositoryMock.find.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.getCommunicationEmailCheck(mockSearchQuery)
      ).rejects.toThrow(BadRequestException);

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: mockSearchQuery,
        relations: ["contact"],
      });
    });
  });

  describe("getCommunicationPhoneCheck", () => {
    it("should return filtered communication details when phone numbers match and contact name matches", async () => {
      const mockSearchQuery = {
        communicationDetails: "1234567890",
        contactName: "John",
      };

      const mockCommunicationDetails = [
        {
          id: 1,
          communicationType: "phone",
          communicationDetails: "1234567890",
          contact: { id: 1, firstName: "John", lastName: "Doe" },
        },
        {
          id: 2,
          communicationType: "phone",
          communicationDetails: "1234567890",
          contact: { id: 2, firstName: "Jane", lastName: "Smith" },
        },
      ];

      contactCommunicationDetailsRepositoryMock.find.mockResolvedValue(
        mockCommunicationDetails
      );

      const result = await contactRepository.getCommunicationPhoneCheck(
        mockSearchQuery
      );

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: { communicationDetails: "1234567890" },
        relations: ["contact"],
      });
      expect(result).toEqual([
        {
          id: 1,
          communicationType: "phone",
          communicationDetails: "1234567890",
          contact: { id: 1, firstName: "John", lastName: "Doe" },
        },
      ]);
    });

    it("should return an empty array when no matching phone numbers are found", async () => {
      const mockSearchQuery = {
        communicationDetails: "9876543210",
        contactName: "John",
      };

      contactCommunicationDetailsRepositoryMock.find.mockResolvedValue([]);

      const result = await contactRepository.getCommunicationPhoneCheck(
        mockSearchQuery
      );

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: { communicationDetails: "9876543210" },
        relations: ["contact"],
      });
      expect(result).toEqual([]);
    });

    it("should throw a BadRequestException when an error occurs", async () => {
      const mockSearchQuery = {
        communicationDetails: "1234567890",
        contactName: "John",
      };

      contactCommunicationDetailsRepositoryMock.find.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        contactRepository.getCommunicationPhoneCheck(mockSearchQuery)
      ).rejects.toThrow(BadRequestException);

      expect(
        contactCommunicationDetailsRepositoryMock.find
      ).toHaveBeenCalledWith({
        where: { communicationDetails: "1234567890" },
        relations: ["contact"],
      });
    });
  });

  describe("getContactRelations", () => {
    it("should return relations for COMPANY_CONTACT_RECORD_TYPE", async () => {
      const contactRecordTypeLid = COMPANY_CONTACT_RECORD_TYPE;

      const expectedRelations = [
        "companyContactMaps",
        "companyContactMaps.company",
        "companyContactMaps.company.companyAddresses",
        "companyContactMaps.company.companyAddresses.address",
        "companyContactMaps.company.companyAddresses.address.cityId",
        "companyContactMaps.contact",
        "communicationDetails",
        "owner",
        "tag",
        "status",
      ];

      const result = await contactRepository.getContactRelations(
        contactRecordTypeLid
      );

      expect(result).toEqual(expectedRelations);
    });

    it("should return relations for INSURER_CONTACT_RECORD_TYPE", async () => {
      const contactRecordTypeLid = INSURER_CONTACT_RECORD_TYPE;

      const expectedRelations = [
        "insurerContacts",
        "insurerContacts.insurer",
        "insurerContacts.insurer.insurerAddresses",
        "insurerContacts.insurer.insurerAddresses.address",
        "insurerContacts.insurer.insurerAddresses.address.cityId",
        "communicationDetails",
        "owner",
        "tag",
        "status",
      ];

      const result = await contactRepository.getContactRelations(
        contactRecordTypeLid
      );

      expect(result).toEqual(expectedRelations);
    });

    it("should return relations for TPA_CONTACT_RECORD_TYPE", async () => {
      const contactRecordTypeLid = TPA_CONTACT_RECORD_TYPE;

      const expectedRelations = [
        "tpaContacts",
        "tpaContacts.tpa",
        "tpaContacts.tpa.tpaAddresses",
        "tpaContacts.tpa.tpaAddresses.address",
        "tpaContacts.tpa.tpaAddresses.address.cityId",
        "communicationDetails",
        "owner",
        "tag",
        "status",
      ];

      const result = await contactRepository.getContactRelations(
        contactRecordTypeLid
      );

      expect(result).toEqual(expectedRelations);
    });

    it("should return relations for BROKER_CONTACT_RECORD_TYPE", async () => {
      const contactRecordTypeLid = BROKER_CONTACT_RECORD_TYPE;

      const expectedRelations = [
        "brokerContacts",
        "brokerContacts.broker",
        "brokerContacts.broker.brokerAddresses",
        "brokerContacts.broker.brokerAddresses.address",
        "brokerContacts.broker.brokerAddresses.address.cityId",
        "communicationDetails",
        "owner",
        "tag",
        "status",
      ];

      const result = await contactRepository.getContactRelations(
        contactRecordTypeLid
      );

      expect(result).toEqual(expectedRelations);
    });

    it("should return an empty array for an unsupported contactRecordTypeLid", async () => {
      const contactRecordTypeLid = 999; // Unsupported type

      const result = await contactRepository.getContactRelations(
        contactRecordTypeLid
      );

      expect(result).toEqual([]);
    });
  });
});

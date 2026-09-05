import { Test, TestingModule } from "@nestjs/testing";
import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";
import { JwtService } from "@nestjs/jwt";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";

describe("ContactController", () => {
  let contactController: ContactController;
  let contactService: ContactService;

  const mockContactService = {
    addContact: jest.fn(),
    getContactList: jest.fn(),
    getContactById: jest.fn(),
    updateContactById: jest.fn(),
    deleteContactById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mockJwtToken"),
    verify: jest.fn().mockReturnValue({ userId: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        {
          provide: ContactService,
          useValue: mockContactService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    contactController = module.get<ContactController>(ContactController);
    contactService = module.get<ContactService>(ContactService);
  });

  it("should be defined", () => {
    expect(contactController).toBeDefined();
  });

  describe("addContact", () => {
    it("should create a new contact", async () => {
      const createContactDto: CreateContactDto = {
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

      const mockResponse = {
        status: 200,
        message: "Contact created successfully",
        data: {
          salutationLid: null,
          firstName: "Naveen",
          lastName: "Kumar",
          middleName: "",
          displayName: "Naveen Kumar",
          linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
          companyLocationId: 15,
          companyBranchId: null,
          tagLid: null,
          contactTypeLid: 276,
          companyId: 435,
          department: null,
          designation: null,
          reportingToId: null,
          assistantId: null,
          remarks: "<p>This is my contact details</p>",
          contactRecordTypeLid: 88,
          statusLid: 29,
          qualificationExperiences: [],
          professionalExperiences: [],
          contactDetails: {
            childDetails: [],
            gender: null,
            dateOfBirth: null,
            website: "",
            favouriteFood: "",
            favouriteRestaurant: "",
            personalHistory: "",
            majorAchievements: "",
            maritalStatus: null,
            dateOfWedding: null,
            spouseName: "",
            spouseDateOfBirth: null,
            spouseWorkingStatus: null,
            workingCompany: "",
            id: 306,
          },
          communicationDetails: [
            {
              communicationType: "email",
              communicationDetails: "rohit@divami.com",
              isPrimary: true,
              contactId: 377,
              id: 759,
            },
            {
              communicationType: "phone",
              communicationDetails: "7095639485",
              isPrimary: true,
              contactId: 377,
              id: 760,
            },
          ],
          id: 377,
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
              id: 1049,
            },
          ],
          contactDocMaps: [],
          companyId: 435,
        },
      };

      mockContactService.addContact.mockResolvedValue(mockResponse.data);

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        user: { userDetails: { userId: 1 } },
      } as any;

      await contactController.addContact(createContactDto, response, req);

      expect(mockContactService.addContact).toHaveBeenCalledWith(
        createContactDto,
        1
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should check incorrect company data", async () => {
      const createContactDto: CreateContactDto = {
        firstName: "Naveen",
        lastName: "Kumar",
        displayName: "Naveen Kumar",
        linkedInUrl: "https://www.linkedin.com/company/divami-design-led-ai",
        companyLocationId: 15,
        contactTypeLid: 276,
        companyId: 434, // Inactive company ID
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

      const mockErrorResponse = {
        status: 400,
        message: "company with ID 434 is not active",
      };

      mockContactService.addContact.mockRejectedValue(
        new Error("company with ID 434 is not active")
      );

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        user: { userDetails: { userId: 1 } },
      } as any;

      await contactController.addContact(createContactDto, response, req);

      expect(mockContactService.addContact).toHaveBeenCalledWith(
        createContactDto,
        1
      );
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(mockErrorResponse);
    });
  });

  describe("getContactList", () => {
    it("should return a list of contacts", async () => {
      const mockContactList = {
        data: [
          {
            id: 346,
            contactName: "Gopalakrishna Ratnala",
            displayName: "Gopalakrishna Ratnala",
            tag: null,
            companyId: 501,
            companyName: "Tech Solutions Inc. 001",
            numberOfAddress: 0,
            communicationDetails: [
              {
                id: 675,
                communicationType: "phone",
                communicationDetails: "7095636980",
                isPrimary: true,
              },
              {
                id: 674,
                communicationType: "email",
                communicationDetails: "sa09ple@gmail.com",
                isPrimary: true,
              },
            ],
            status: {
              id: 29,
              lookUpValue: "Active",
            },
            owner: {
              userId: 1,
              firstName: "testing1",
              lastName: "testing",
            },
            department: null,
            designation: null,
          },
        ],
        count: 1,
        totalContacts: 1,
        totalCompanies: 1,
      };

      mockContactService.getContactList.mockResolvedValue(mockContactList);

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        user: { userDetails: { userId: 1 } },
      } as any;

      const query = {
        page: 1,
        limit: 10,
        contactRecordTypeLid: 88,
      };

      await contactController.getContactList(
        response,
        req,
        query.page,
        query.limit,
        query.contactRecordTypeLid
      );

      expect(mockContactService.getContactList).toHaveBeenCalledWith(
        query.page,
        query.limit,
        req.user.userDetails.userId,
        query.contactRecordTypeLid,
        undefined,
        undefined // No sort parameter
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        status: 200,
        message: "Contact List retrieved successfully",
        data: mockContactList,
      });
    });
  });

  describe("getContactById", () => {
    it("should return contact details for a valid ID", async () => {
      const contactId = 254;
      const mockResponse = {
        status: 200,
        message: "Contact retrieved successfully",
        data: {
          id: 254,
          firstName: "Karan",
          lastName: "Agarwal",
          middleName: "Tester",
          displayName: "Karan Agarwal",
          companyLocationId: 15,
          companyBranchId: 682,
          remarks: "<p>This is karan contact details</p>",
          linkedInUrl: null,
          address: [
            {
              id: 723,
              addressTypeLid: 57,
              addressType: { id: 57, lookUpValue: "Branch" },
              address1: "9-2-234 SD Karan Road",
              address2: "Shivaji Nagar",
              area: "Warangal",
              countryId: { name: "India", isoCode: null, id: 1 },
              stateId: { name: "Telangana", stateCode: "TG", id: 24 },
              cityId: { name: "Warangal", id: 47 },
              pinCode: "500231",
              email: "karantest@gmail.com",
              phoneNumber: "7095639481",
              alternatePhoneNumber: "7095628901",
              supportNumber: "1231230965",
            },
          ],
          contactDetails: {
            id: 233,
            gender: 34,
            dateOfBirth: "1999-12-04",
            website: "https://divami.com",
            favouriteFood: "Biryani",
            favouriteRestaurant: "Paradise",
            personalHistory: "Developer",
            majorAchievements: "Topper",
            maritalStatus: 37,
            dateOfWedding: "2024-01-01",
            spouseName: "veena",
            spouseDateOfBirth: "2000-10-10",
            spouseWorkingStatus: 40,
            workingCompany: "ValueLabs",
            childDetails: [],
            genderType: { id: 34, lookUpValue: "Male" },
            spouseWorkingStatusType: { id: 40, lookUpValue: "Working" },
            maritalStatusType: { id: 37, lookUpValue: "Married" },
          },
          professionalExperiences: [
            {
              id: 213,
              fromDate: "2023-01-06",
              toDate: "2025-10-04",
              designation: "Software Engineer II",
              department: "Engineering",
              company: "Divami",
              details: "Backend Developer",
              remarks: "<p>This is my work experience.</p>",
            },
          ],
          qualificationExperiences: [
            {
              id: 221,
              nameOfQualification: "B.tech",
              yearOfQualification: 2020,
              details: "Passed",
              remarks: "<p>I passed all my B.tech exams.</p>",
            },
          ],
          communicationDetails: [
            {
              id: 347,
              communicationType: "email",
              communicationDetails: "rohit@divami.com",
              isPrimary: true,
            },
          ],
          salutation: { id: 16, lookUpValue: "Mr." },
          tag: { id: 59, lookUpValue: "Auditor" },
          contactType: { id: 56, lookUpValue: "HR" },
          department: { id: 8, name: "Engineering" },
          designation: { id: 4, name: "MANAGER" },
          status: { id: 29, lookUpValue: "Active" },
          contactRecordType: { id: 88, lookUpValue: "company" },
          company: {
            id: 434,
            companyName: "IT solutions",
            displayName: "IT solutions",
            companyTypeLid: 20,
            companyTagLid: 21,
            currencyId: 51,
            industrySegmentLid: 175,
            groupCompanyLid: 48,
            noOfEmployees: 150,
            website: null,
            dateOfIncorporation: "2025-04-11",
            panCardNumber: null,
            registrationNo: "U12345AB1234PLC123456",
            existingBrokerId: null,
            paidUpCapital: "0.00",
            tanNumber: null,
            priorityLid: 54,
            statusLid: 33,
            remarks: null,
            source:
              "A paragraph is a series of sentences that are organized and coherent, and are all related to a sing",
          },
        },
      };

      mockContactService.getContactById.mockResolvedValue(mockResponse.data);

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        headers: { authorization: "Bearer mockJwtToken" },
        user: { userDetails: { userId: 1 } },
      } as any;

      await contactController.getContactById(response, contactId);

      expect(mockContactService.getContactById).toHaveBeenCalledWith(contactId);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should throw NotFoundException if contact is not found", async () => {
      const contactId = 999;
      const mockErrorResponse = {
        status: 404,
        message: "Contact retrieve failed",
      };

      mockContactService.getContactById.mockRejectedValue(
        new NotFoundException("Contact retrieve failed")
      );

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await contactController.getContactById(response, contactId);

      expect(mockContactService.getContactById).toHaveBeenCalledWith(contactId);
      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith(mockErrorResponse);
    });
  });

  describe("updateContactById", () => {
    it("should update contact details for a valid ID", async () => {
      const contactId = 254;
      const updateContactDto: UpdateContactDto = {
        firstName: "Karan",
        lastName: "Agarwal",
        displayName: "Karan Agarwal Updated",
        remarks: "<p>Updated contact details</p>",
      };

      const mockResponse = {
        status: 200,
        message: "Contact updated successfully",
        data: {
          id: 254,
          firstName: "Karan",
          lastName: "Agarwal",
          displayName: "Karan Agarwal Updated",
          remarks: "<p>Updated contact details</p>",
        },
      };

      mockContactService.updateContactById.mockResolvedValue(mockResponse.data);

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        headers: { authorization: "Bearer mockJwtToken" },
        user: { userDetails: { userId: 1 } },
      } as any;

      await contactController.updateContactById(
        response,
        req,
        contactId,
        updateContactDto
      );

      expect(mockContactService.updateContactById).toHaveBeenCalledWith(
        contactId,
        updateContactDto,
        req.user.userDetails.userId
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockResponse);
    });

    it("should throw bad request if contact is not found", async () => {
      const contactId = 999;
      const updateContactDto: UpdateContactDto = {
        firstName: "Nonexistent",
        lastName: "Contact",
        displayName: "Nonexistent Contact",
        remarks: "<p>Nonexistent contact details</p>",
      };

      const mockErrorResponse = {
        status: 400,
        message: "Contact data not found",
      };

      mockContactService.updateContactById.mockRejectedValue(
        new BadRequestException("Contact data not found")
      );

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        headers: { authorization: "Bearer mockJwtToken" },
        user: { userDetails: { userId: 1 } },
      } as any;

      await contactController.updateContactById(
        response,
        req,
        contactId,
        updateContactDto
      );

      expect(mockContactService.updateContactById).toHaveBeenCalledWith(
        contactId,
        updateContactDto,
        req.user.userDetails.userId
      );
      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith(mockErrorResponse);
    });
  });

  describe("deleteContactById", () => {
    it("should delete contact for a valid ID", async () => {
      const contactId = 254;

      const mockResponse = {
        status: 200,
        message: "Contact deleted successfully",
      };

      mockContactService.deleteContactById.mockResolvedValue(true);

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const req = {
        headers: { authorization: "Bearer mockJwtToken" },
        user: { userDetails: { userId: 1 } },
      } as any;

      await contactController.deleteContactById(req, response, contactId);

      expect(mockContactService.deleteContactById).toHaveBeenCalledWith(
        contactId
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockResponse);
    });
  });
});

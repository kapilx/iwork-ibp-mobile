import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { CreateContactDto } from "./dto/create-contact.dto";
import { ContactResponseDto } from "./dto/contact-response.dto";
import { ContactAddressDto } from "./dto/contact-address.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { CompanyContactMapDto } from "./dto/contact-company-map.dto";
import { CommunicationDto } from "./dto/contact-list-response.dto";
import { CreateAddressDto } from "../address/dto/create-address.dto";
import { ContactRepository } from "./contact.repository";
import { AddressRepository } from "../address/address.repository";
import { CompanyRepository } from "../company/company.repository";
import { LookUpRepository } from "../look-up/look-up.repository";
import { InsurerRepository } from "../insurer/insurer.repository";
import { TpaRepository } from "../tpa/tpa.repository";
import { BrokerRepository } from "../broker/broker.repository";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import {
  serviceNames,
  ATTRIBUTE_FIELD_MAP,
  OPPORTUNITY_MAP_TABLE_DELETE_FIELDS,
} from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  createErrorResponse,
  removeMetadataFields,
  addMetadataFields,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  CONTACT_MAP_TABLE_DELETE_FIELDS,
  contactSearchObject,
  sortRealtionsMapping,
  CONTACT_RECORD_TYPE_MAP,
} from "../../../../service-lib/src/lib/constants";
import {
  DEFAULT_ACTIVE_STATUS,
  DEFAULT_COMPANY_STATUS_UNDER_REVIEW_KEY_ID,
  DEFAULT_INSURER_STATUS_ACTIVE_KEY_ID,
  DEFAULT_TPA_STATUS_ACTIVE_KEY_ID,
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY,
  DEFAULT_RESIDENTIAL_ADDRESS_TYPE_KEY,
  DEFAULT_PHONE_KEY,
  DEFAULT_PHONE_NUMBER,
  LOOK_UP_DATA,
  DEFAULT_BROKER_STATUS_ACTIVE_KEY_ID,
  MAPPED_DATA_DELETION,
  DEFAULT_COMPANY_CONTACT_RECORD_TYPE,
  DEFAULT_COMPANY_CONTACT_RECORD_TYPE_KEY,
  ENTITY_NAME,
  OWNER_TYPES,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { InsurerContactDto } from "../insurer/dto/insurer-contact.dto";
import { TpaContactDto } from "../tpa/dto/tpa-contact.dto";
import { BrokerContactDto } from "../broker/dto/broker-contact.dto";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { EmployeeService } from "../employee/employee.service";
/**
 * Service for managing contacts.
 */
@Injectable()
export class ContactService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly addressRepository: AddressRepository, // Inject AddressRepository
    private readonly companyRepository: CompanyRepository, // Inject CompanyRepository
    private readonly insurerRepository: InsurerRepository, // Inject InsurerRepository
    private readonly tpaRepository: TpaRepository, // Inject InsurerRepository
    private readonly brokerRepository: BrokerRepository, // Inject InsurerRepository
    private readonly lookUpRepository: LookUpRepository, // Inject LookUpRepository
    private readonly lookUpValidation: LookUpValidationService,
    private readonly dataSource: DataSource, // Inject DataSource for transaction manager
    private readonly employeeService: EmployeeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Creates a new contact with address using transaction manager. */
  async addContact(
    createContact: CreateContactDto,
    userId: number
  ): Promise<ContactResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ContactService",
        method: "addContact",
        messageData: "method invoked",
      }),
    });
    return this.dataSource.transaction(async () => {
      try {
        if (!createContact.companyId)
          throw new Error("Contact should have a company id");
        await this.lookUpValidation.validateDynamicLookupValues(
          createContact,
          LOOK_UP_DATA
        );
        const recordTypeLookup = await this.lookUpRepository.getLookUpById(
          createContact.contactRecordTypeLid
        );
        const recordType =
          CONTACT_RECORD_TYPE_MAP[
            recordTypeLookup.data
              .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
          ];
        const companyConfig = await this.getCompanyConfig(
          recordType,
          createContact.companyId,
          userId
        );

        if (!companyConfig) throw new Error("Unsupported record type");
        const companyData = await companyConfig.fetchMethod(
          createContact.companyId,
          userId
        );
        if (!companyData)
          throw new Error(
            `${recordType} with ID ${createContact.companyId} not found`
          );
        const statusLid = companyConfig.statusIdKey
          .split(".")
          .reduce(
            (object, key) =>
              object && object[key] !== undefined ? object[key] : undefined,
            companyData
          );
        const companyStatus = await this.lookUpRepository.getLookUpById(
          Number(statusLid)
        );
        if (companyStatus.data.lookUpValue !== DEFAULT_ACTIVE_STATUS) {
          throw new Error(
            `${recordType} with ID ${createContact.companyId} is not active`
          );
        }
        if (createContact?.communicationDetails?.length) {
          await this.validateCommunication(
            createContact.communicationDetails,
            companyConfig,
            createContact.firstName
          );
        }
        let addressMapping: any = [];
        if (createContact?.existingAddressIds?.length) {
          addressMapping = createContact.existingAddressIds.map((id) => ({ id }));
        } else if (createContact?.address?.length) {
          addressMapping = await this.processAddresses(
            createContact.address,
            companyData,
            companyConfig
          );
        }
        createContact.statusLid = (
          await this.lookUpRepository.findByLookUpKey(
            DEFAULT_CONTACT_STATUS_ACTIVE_KEY
          )
        )[0]?.id;
        addMetadataFields(createContact, {
          createdAt: new Date().toISOString(),
          createdBy: userId,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        });
        const contactResult = await this.contactRepository.createContact(
          createContact
        );
        contactResult.address = addressMapping;
        await this.createAddressMappings({
          contactResult,
          companyId: createContact.companyId,
          addressMapping,
          companyConfig,
        });

        if (
          companyConfig.contactRecordTypeName ===
          CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
        ) {
          await Promise.all(
            (addressMapping || []).map((addressData: { id: number }) =>
              this.insurerRepository.updateInsurerAddressContactId(
                createContact.companyId,
                addressData.id,
                contactResult.id
              )
            )
          );
        }

        const docDetails = await Promise.all(
          createContact.contactDocMaps?.map((doc) =>
            this.contactRepository.createContactDocumentMapping({
              contactId: contactResult.id,
              documentId: doc.documentId,
            })
          ) || []
        );

        const contactMappingInput = companyConfig.createCompanyMap(
          contactResult.id,
          createContact.companyId
        );

        await companyConfig.createContactMapping(contactMappingInput);

        contactResult.contactDocMaps = docDetails;
        contactResult.companyId = createContact.companyId;
        removeMetadataFields(contactResult);
        const updatedContactResult =
          await this.contactRepository.getContactData(contactResult.id);
        // return contactResult;
        return updatedContactResult;
      } catch (error) {
        if (error?.message?.includes("Duplicate entry")) {
          throw new Error(error?.message); // Propagate the duplicate entry error
        }
        throw error; // Re-throw other errors
      }
    });
  }

  async inceptionCreateContact(contacts: CreateContactDto[], userId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ContactService",
        method: "inceptionCreateContact",
        messageData: "method invoked",
      }),
    });

    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new BadRequestException("No contacts provided");
    }

    const results = await Promise.all(
      contacts.map(async (contact) => {
        try {
          const contactData = await this.addContact(contact, userId);
          return {
            status: "success",
            data: {
              id: contactData.id,
              firstName: contactData.firstName,
              lastName: contactData.lastName,
            },
            message: successMessage.contactCreated,
          };
        } catch (err) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "ContactService",
              method: "inceptionCreateContact",
              payload: { contact },
              messageData: err,
            }),
          });
          return {
            status: "failure",
            message:
              err instanceof Error
                ? err.message
                : errorMessages.contactCreationFailed,
            payload: contact,
          };
        }
      })
    );

    return results;
  }

  async getCompanyConfig(
    recordType: string,
    companyId: number,
    userId: number
  ) {
    const companyTypeMap = {
      [CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE]: {
        contactRecordTypeName:
          CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE,
        userId: userId,
        fetchMethod: this.companyRepository.getCompanyById.bind(
          this.companyRepository
        ),
        statusIdKey: "status.id",
        defaultStatusKeyId: DEFAULT_COMPANY_STATUS_UNDER_REVIEW_KEY_ID,
        communicationSearchQuery: {
          communicationType: DEFAULT_PHONE_KEY,
          communicationDetails: DEFAULT_PHONE_NUMBER,
          contact: {
            companyContactMaps: {
              companyId: companyId,
            },
          },
        },
        addressRelation: "companyAddresses",
        createCompanyMap: (contactId: number, companyId: number) => ({
          contactId,
          companyId,
        }),
        createAddressMap:
          this.contactRepository.createCompanyAddressMapping.bind(
            this.contactRepository
          ),
        findAddressMap: this.contactRepository.findCompanyAddressMap.bind(
          this.contactRepository
        ),
        createContactMapping:
          this.contactRepository.createCompanyContactMapping.bind(
            this.contactRepository
          ),
      },
      [CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE]: {
        contactRecordTypeName:
          CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE,
        userId: userId,
        fetchMethod: this.insurerRepository.fetchInsurerById.bind(
          this.insurerRepository
        ),
        statusIdKey: "status.id",
        defaultStatusKeyId: DEFAULT_INSURER_STATUS_ACTIVE_KEY_ID,
        communicationSearchQuery: {
          communicationType: DEFAULT_PHONE_KEY,
          communicationDetails: DEFAULT_PHONE_NUMBER,
          contact: {
            insurerContacts: {
              insurerId: companyId,
            },
          },
        },
        addressRelation: "insurerAddresses",
        createCompanyMap: (contactId: number, companyId: number) => ({
          contactId,
          insurerId: companyId,
        }),
        createAddressMap: this.insurerRepository.addInsurerAddressMap.bind(
          this.insurerRepository
        ),
        findAddressMap:
          this.insurerRepository.findInsurerCompanyAddressMap.bind(
            this.insurerRepository
          ),
        createContactMapping: this.insurerRepository.addInsurerContact.bind(
          this.insurerRepository
        ),
      },
      [CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE]: {
        contactRecordTypeName: CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE,
        userId: userId,
        fetchMethod: this.tpaRepository.getTpaById.bind(this.tpaRepository),
        statusIdKey: "status.id",
        defaultStatusKeyId: DEFAULT_TPA_STATUS_ACTIVE_KEY_ID,
        communicationSearchQuery: {
          communicationType: DEFAULT_PHONE_KEY,
          communicationDetails: DEFAULT_PHONE_NUMBER,
          contact: {
            tpaContacts: {
              id: companyId,
            },
          },
        },
        addressRelation: "tpaAddresses",
        createCompanyMap: (contactId: number, companyId: number) => ({
          contactId,
          id: companyId,
        }),
        createAddressMap: this.tpaRepository.addTpaAddress.bind(
          this.tpaRepository
        ),
        findAddressMap: this.tpaRepository.findTpaCompanyAddressMap.bind(
          this.tpaRepository
        ),
        createContactMapping: this.tpaRepository.addTpaContact.bind(
          this.tpaRepository
        ),
      },
      [CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE]: {
        contactRecordTypeName:
          CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE,
        userId: userId,
        fetchMethod: this.brokerRepository.getBrokerById.bind(
          this.brokerRepository
        ),
        statusIdKey: "status.id",
        defaultStatusKeyId: DEFAULT_BROKER_STATUS_ACTIVE_KEY_ID,
        communicationSearchQuery: {
          communicationType: DEFAULT_PHONE_KEY,
          communicationDetails: DEFAULT_PHONE_NUMBER,
          contact: {
            brokerContacts: {
              brokerId: companyId,
            },
          },
        },
        addressRelation: "brokerAddresses",
        createCompanyMap: (contactId: number, companyId: number) => ({
          contactId,
          brokerId: companyId,
        }),
        createAddressMap: this.brokerRepository.addBrokerAddressMap.bind(
          this.brokerRepository
        ),
        findAddressMap: this.brokerRepository.findBrokerCompanyAddressMap.bind(
          this.brokerRepository
        ),
        createContactMapping: this.brokerRepository.addBrokerContact.bind(
          this.brokerRepository
        ),
      },
    };
    return companyTypeMap[recordType as keyof typeof companyTypeMap];
  }

  async createAddressMappings({
    contactResult,
    companyId,
    addressMapping,
    companyConfig,
  }: {
    contactResult: any;
    companyId: number;
    addressMapping: any[];
    companyConfig: any;
  }) {
    return Promise.all(
      (addressMapping || []).map(async (addressData) => {
        const existingAddressMapping =
          await this.contactRepository.findContactAddressMap(
            contactResult.id,
            addressData.id
          );

        if (!existingAddressMapping) {
          await this.contactRepository.createContactAddressMapping({
            contactId: contactResult.id,
            addressId: addressData.id,
          });
        }
        // if a new contact address was being added it was also being added to its company address
        // commented the company address mapping as per the latest discussion
        // const addressTypeDetails = await this.lookUpRepository.getLookUpById(
        //   addressData.addressTypeId
        // );
        // if (
        //   addressTypeDetails.data.lookUpValue !==
        //   DEFAULT_RESIDENTIAL_ADDRESS_TYPE_KEY
        // ) {
        //   const existingCompanyMap = await companyConfig.findAddressMap(
        //     companyId,
        //     addressData.id
        //   );
        //   if (!existingCompanyMap) {
        //     const mapPayload: any = {
        //       address: addressData,
        //       addressId: addressData.id,
        //     };
        //     if (
        //       companyConfig.contactRecordTypeName === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
        //     ) {
        //       mapPayload.company = companyId;
        //     } else if (
        //       companyConfig.contactRecordTypeName === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
        //     ) {
        //       mapPayload.insurerId = companyId;
        //     } else if (
        //       companyConfig.contactRecordTypeName === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
        //     ) {
        //       mapPayload.id = companyId;
        //     } else if (
        //       companyConfig.contactRecordTypeName === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
        //     ) {
        //       mapPayload.brokerId = companyId;
        //     }

        //     await companyConfig.createAddressMap(mapPayload);
        //   }
        // }
      })
    );
  }

  async validateCommunication(
    details: CommunicationDto[],
    config: any,
    contactName: string
  ) {
    for (const detail of details) {
      const communicationQuery = {
        ...config.communicationSearchQuery,
        communicationType: detail.communicationType,
        communicationDetails: detail.communicationDetails,
        contactName: contactName,
      };

      if (detail.communicationType === DEFAULT_PHONE_KEY) {
        const phoneCheck =
          await this.contactRepository.getCommunicationPhoneCheck(
            communicationQuery
          );
        if (phoneCheck.length !== 0) {
          throw new Error(
            `Phone number ${detail.communicationDetails} already exists`
          );
        }
      }
      //  else if (detail.communicationType === DEFAULT_EMAIL_KEY) {
      //   const emailCheck =
      //     await this.contactRepository.getCommunicationEmailCheck(
      //       communicationQuery
      //     );
      //   if (emailCheck.length !== 0) {
      //     throw new Error(
      //       `Email ${detail.communicationDetails} already exists`
      //     );
      //   }
      // }
    }
  }

  async processAddresses(
    addresses: CreateAddressDto[],
    companyData: any,
    config: any
  ) {
    const results = await Promise.all(
      addresses.map(async (addressDto) => {
        const addressExists = await this.checkCompanyAddressExists(
          addressDto,
          companyData[config.addressRelation]
        );
        if (addressExists === 0) {
          const metadata = {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: config.userId,
            updatedBy: config.userId,
          };
          Object.assign(addressDto, metadata);
          return await this.addressRepository.createAddress(addressDto);
        } else {
          return companyData[config.addressRelation].find(
            (existingAddress: any) => existingAddress.id === addressExists
          );
        }
      })
    );
    return results;
  }

  /** Retrieves paginated contacts. */
  async getContactList(
    page: number,
    limit: number,
    loggedInUserId: number,
    contactRecordTypeLid: number,
    search?: string,
    sort?: string,
    searchBy?: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number,
    ownerId?: number,
    viewBy?: "manager" | "team"
  ): Promise<ContactResponseDto[]> {
    try {
      const searchParams = search ? mapSearchParams(search) : [];
      const userId = ownerId ? ownerId : loggedInUserId;
      let userIdsList: number[] = [];
      if (viewBy && viewBy === OWNER_TYPES.TEAM) {
        const users = await this.employeeService.getEmployeeHierarchyByUserId(
          userId
        );
        userIdsList = users?.map((user) => user.userId) || [];
        searchParams.push({
          searchBy: "owner.userId",
          searchValue: userIdsList,
        });
      } else if ((viewBy && viewBy === OWNER_TYPES.MANAGER) || ownerId) {
        searchParams.push({
          searchBy: "owner.userId",
          searchValue: [userId],
        });
      }
      const organisationIdParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId
      );
      const orgId = (
        organisationIdParam?.searchValue as number[] | undefined
      )?.[0];
      if (orgId === 0) {
        const organisationIdNew =
          await this.companyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
            { id: orgId }
          );

        const lookupCriteria =
          organisationIdNew.length === 0
            ? { parentOrganisationId: orgId }
            : { id: orgId };

        const organisationIds =
          await this.companyRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
            lookupCriteria
          );
        const idx = searchParams.findIndex(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId
        );
        if (idx !== -1) {
          searchParams[idx].searchValue = organisationIds;
        }
      }
      const sortParams = sort
        ? mapSortParams(sort, ENTITY_NAME.CONTACT.toUpperCase())
        : undefined;

      const parentCompanyNameKey = "companyContactMaps.company.companyName";
      const parentCompanyBranchKey =
        "companyContactMaps.company.companyAddresses.address.cityId.name";
      const parentCompany: any = {
        [CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE]:
          "insurerContacts.insurer.insurerName",
        [CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE]:
          "tpaContacts.tpa.tpaName",
        [CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE]:
          "brokerContacts.broker.brokerName",
      };
      const parentCompanyBranch: any = {
        [CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE]:
          "insurerContacts.insurer.insurerAddresses.address.cityId.name",
        [CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE]:
          "tpaContacts.tpa.tpaAddresses.address.cityId.name",
        [CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE]:
          "brokerContacts.broker.brokerAddresses.address.cityId.name",
      };
      const parentCompanySortFields: any = {
        [CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE]:
          "companyContactMaps.company.companyName",
        [CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE]:
          "insurerContacts.insurer.insurerName",
        [CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE]:
          "tpaContacts.tpa.tpaName",
        [CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE]:
          "brokerContacts.broker.brokerName",
      };

      let globalSearchFields = contactSearchObject,
        contactRecordTypeLookup: any;
      if (contactRecordTypeLid === DEFAULT_COMPANY_CONTACT_RECORD_TYPE) {
        contactRecordTypeLookup = await this.lookUpRepository.findByLookUpKey(
          DEFAULT_COMPANY_CONTACT_RECORD_TYPE_KEY
        );
        contactRecordTypeLid = contactRecordTypeLookup[0].id;
      }
      contactRecordTypeLookup = await this.lookUpRepository.getLookUpById(
        contactRecordTypeLid
      );
      const recordType =
        CONTACT_RECORD_TYPE_MAP[
          contactRecordTypeLookup.data
            .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ];

      if (parentCompany[recordType]) {
        const parentCompanyMap = parentCompany[recordType];
        if (searchParams || searchBy) {
          const parentCompanyBranchMap = parentCompanyBranch[recordType];
          if (searchParams) {
            const companyNameSearch = searchParams.find(
              (item) => item.searchBy === parentCompanyNameKey
            );
            if (companyNameSearch) {
              companyNameSearch.searchBy = parentCompanyMap;
            }
            const companyBranchSearch = searchParams.find(
              (item) => item.searchBy === parentCompanyBranchKey
            );
            if (companyBranchSearch) {
              companyBranchSearch.searchBy = parentCompanyBranchMap;
            }
          }
        }
        globalSearchFields = contactSearchObject.map((field) =>
          field === parentCompanyNameKey ? parentCompanyMap : field
        );
      }

      if (sortParams) {
        const parentCompanySort = parentCompanySortFields[recordType];
        const companySortOrderSearch = sortParams.find(
          (item) =>
            item.field === sortRealtionsMapping.PARENT_COMPANY_NAME_SORT_KEY
        );
        if (companySortOrderSearch) {
          companySortOrderSearch.field = parentCompanySort;
        }
      }

      if (searchParams) {
        const parentCompanySort = parentCompanySortFields[recordType];
        const companySortOrderSearch = searchParams.find(
          (item) =>
            item.searchBy === sortRealtionsMapping.PARENT_COMPANY_NAME_SORT_KEY
        );
        if (companySortOrderSearch) {
          companySortOrderSearch.searchBy = parentCompanySort;
        }
      }
      const contactData =
        await this.contactRepository.fetchPaginatedContactList(
          page,
          limit,
          loggedInUserId,
          contactRecordTypeLid,
          searchParams,
          sortParams,
          searchBy,
          globalSearchFields,
          field,
          fromDate,
          toDate,
          period,
          timeFilter,
          financialYear
        );
      const status = await this.lookUpRepository.findByLookUpKey(
        DEFAULT_CONTACT_STATUS_ACTIVE_KEY
      );
      let whereCondition: any = {
        createdBy: userId,
        contactRecordTypeLid: contactRecordTypeLid,
        statusLid: status[0].id ?? undefined,
      };
      whereCondition["allContactIds"] = contactData.allContactIds;
      // const totalContacts =
      //   contactData?.data?.length > 0
      //     ? await this.contactRepository.getTotalContacts(
      //         whereCondition,
      //         globalSearchFields,
      //         searchParams,
      //         searchBy
      //       )
      //     : 0;
      const totalContacts = contactData.count;
      if (viewBy && viewBy === OWNER_TYPES.TEAM) {
        whereCondition["createdBy"] = userIdsList;
      } else {
        whereCondition["createdBy"] = [userId];
      }
      const totalCompanies =
        contactData?.data?.length > 0
          ? await this.contactRepository.getTotalCompanies(
              whereCondition,
              searchBy,
              searchParams
            )
          : 0;

      return {
        data: contactData.data,
        count: contactData.count,
        totalContacts,
        totalCompanies,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactFetchFailed
        )
      );
    }
  }

  /** Retrieves a contact by ID. */
  async getContactById(contactId: number): Promise<ContactResponseDto> {
    try {
      const contact = await this.contactRepository.getContactData(contactId);
      if (!contact) {
        throw new NotFoundException(`Contact with ID ${contactId} not found`);
      }
      removeMetadataFields(contact);
      return contact;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactFetchFailed
        )
      );
    }
  }

  /** Updates a contact by ID using transaction manager. */
  async updateContactById(
    contactId: number,
    updateContact: UpdateContactDto,
    userId: number
  ): Promise<ContactResponseDto> {
    return this.dataSource.transaction(async () => {
      try {
        await this.lookUpValidation.validateDynamicLookupValues(
          updateContact,
          LOOK_UP_DATA
        );
        const existingContactDetails =
          await this.contactRepository.getExistingContactDetails(contactId);
        if (!existingContactDetails) {
          throw new NotFoundException(`Contact with ID ${contactId} not found`);
        }
        if (
          updateContact?.reportingToId &&
          updateContact?.reportingToId === contactId
        ) {
          throw new BadRequestException(
            `The 'Reporting To' field cannot reference the same contact.`
          );
        }
        const {
          qualificationExperiences,
          professionalExperiences,
          contactDetails,
          address,
          communicationDetails,
          contactDocMaps,
          ...contactPayload
        } = updateContact;
        const existingContactData =
          await this.contactRepository.getContactCompanyDataAddress(contactId);
        const recordType =
          CONTACT_RECORD_TYPE_MAP[
            (existingContactData.contactRecordType?.lookUpKey ??
              existingContactData.contactRecordType?.data
                ?.lookUpKey) as keyof typeof CONTACT_RECORD_TYPE_MAP
          ];

        if ("companyId" in contactPayload) {
          if (contactPayload.companyId === null) {
            const [contactStatus] = await this.lookUpRepository.findByLookUpKey(
              DEFAULT_CONTACT_STATUS_INACTIVE_KEY
            );
            contactPayload.statusLid = contactStatus.id;
            if (
              recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
            ) {
              const companyContactObject: CompanyContactMapDto = {
                contactId: contactId,
                companyId: existingContactData.company.id,
              };

              await this.contactRepository.delinkCompanyContactMapping(
                companyContactObject
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
            ) {
              const insurerContactObject: InsurerContactDto = {
                contactId: contactId,
                insurerId: existingContactData.company.id,
              };

              await this.insurerRepository.delinkInsurerContactMapping(
                insurerContactObject
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
            ) {
              const tpaContactObject: TpaContactDto = {
                contactId: contactId,
                id: existingContactData.company.id,
              };

              await this.tpaRepository.delinkTpaContactMapping(
                tpaContactObject
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
            ) {
              const brokerContactObject: BrokerContactDto = {
                contactId: contactId,
                brokerId: existingContactData.company.id,
              };

              await this.brokerRepository.delinkBrokerContactMap(
                brokerContactObject
              );
            }
            delete contactPayload.companyId;
          } else if (contactPayload.companyId !== undefined) {
            let companyData: any;
            if (
              recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
            ) {
              companyData = await this.companyRepository.getCompanyById(
                contactPayload.companyId,
                userId
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
            ) {
              companyData =
                await this.insurerRepository.fetchInsurerByIdWithDetails(
                  contactPayload.companyId
                );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
            ) {
              companyData = await this.tpaRepository.getTpaById(
                contactPayload.companyId
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
            ) {
              companyData = await this.brokerRepository.fetchBrokerById(
                contactPayload.companyId
              );
            }

            if (!companyData) {
              throw new Error(
                `Company with ID ${contactPayload.companyId} not found`
              );
            }

            const companyStatus = await this.lookUpRepository.getLookUpById(
              companyData.status?.id ??
                DEFAULT_COMPANY_STATUS_UNDER_REVIEW_KEY_ID
            );

            const statusKey =
              companyStatus.data.lookUpValue === DEFAULT_ACTIVE_STATUS
                ? DEFAULT_CONTACT_STATUS_ACTIVE_KEY
                : DEFAULT_CONTACT_STATUS_INACTIVE_KEY;

            const [contactStatus] = await this.lookUpRepository.findByLookUpKey(
              statusKey
            );
            if (statusKey === DEFAULT_CONTACT_STATUS_INACTIVE_KEY)
              contactPayload.statusLid = contactStatus.id;
            if (
              recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
            ) {
              const companyContactObjectLink: CompanyContactMapDto = {
                contactId: contactId,
                companyId: contactPayload.companyId,
              };

              if (existingContactData?.company !== null) {
                const companyContactObjectDelink: CompanyContactMapDto = {
                  contactId: contactId,
                  companyId: existingContactData.company.id,
                };
                await this.contactRepository.delinkCompanyContactMapping(
                  companyContactObjectDelink
                );
              }
              await this.contactRepository.createCompanyContactMapping(
                companyContactObjectLink
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
            ) {
              const insurerContactObjectLink: InsurerContactDto = {
                contactId: contactId,
                insurerId: contactPayload.companyId,
              };

              if (existingContactData?.company !== null) {
                const insurerContactObjectDelink: InsurerContactDto = {
                  contactId: contactId,
                  insurerId: existingContactData.company.id,
                };
                await this.insurerRepository.delinkInsurerContactMapping(
                  insurerContactObjectDelink
                );
              }
              await this.insurerRepository.addInsurerContact(
                insurerContactObjectLink
              );
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
            ) {
              const tpaContactObjectLink: TpaContactDto = {
                contactId: contactId,
                id: contactPayload.companyId,
              };

              if (existingContactData?.company !== null) {
                const tpaContactObjectDelink: TpaContactDto = {
                  contactId: contactId,
                  id: existingContactData.company.id,
                };
                await this.tpaRepository.delinkTpaContactMapping(
                  tpaContactObjectDelink
                );
              }
              await this.tpaRepository.addTpaContact(tpaContactObjectLink);
            } else if (
              recordType === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
            ) {
              const brokerContactObjectLink: BrokerContactDto = {
                contactId: contactId,
                brokerId: contactPayload.companyId,
              };

              if (existingContactData?.company !== null) {
                const brokerContactObjectDelink: BrokerContactDto = {
                  contactId: contactId,
                  brokerId: existingContactData.company.id,
                };
                await this.brokerRepository.delinkBrokerContactMap(
                  brokerContactObjectDelink
                );
              }
              await this.brokerRepository.addBrokerContact(
                brokerContactObjectLink
              );
            }
            delete contactPayload.companyId;
          }
        }
        let addressExists = 0;
        contactPayload.updatedAt = new Date();
        contactPayload.updatedBy = userId;
        const contact = await this.contactRepository.updateContact(
          contactId,
          contactPayload
        );

        if (!contact) {
          throw new NotFoundException(`Contact with ID ${contactId} not found`);
        }
        const metadata = {
          createdAt: new Date().toISOString(),
          createdBy: userId,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        };
        if (address) {
          // retrieves the existing address
          const existingAddressIds =
            await this.contactRepository.getEntityTableMapIds(
              CONTACT_MAP_TABLE_DELETE_FIELDS.CONTACT_ADDRESS,
              CONTACT_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
              { contactId: contactId }
            );
          if (address?.length > 0) {
            const updatedAddresses = await Promise.all(
              address.map(async (addr) => {
                if (addr.id) {
                  const index = existingAddressIds.indexOf(addr.id);
                  if (index !== -1) {
                    existingAddressIds.splice(index, 1);
                  }
                  addr.updatedAt = new Date();
                  addr.updatedBy = userId;
                  return this.addressRepository.updateAddressDetails(
                    addr.id,
                    addr
                  );
                } else {
                  addressExists = await this.checkCompanyAddressExists(
                    addr,
                    existingContactData?.company?.companyAddresses
                  );
                  if (addressExists === 0) {
                    Object.assign(addr, metadata);
                    return this.addressRepository.createAddress(addr);
                  } else {
                    return existingContactData.company.companyAddresses.find(
                      (existingContactAddress) =>
                        existingContactAddress?.address?.id === addressExists
                    )?.address;
                  }
                }
              })
            );
            contact.address = updatedAddresses;
            await Promise.all(
              updatedAddresses.map(async (addressData) => {
                const existingMapping =
                  await this.contactRepository.findContactAddressMap(
                    contact.id,
                    addressData.id
                  );
                if (!existingMapping) {
                  const mappingData: ContactAddressDto = {
                    contactId: contact.id,
                    addressId: addressData.id,
                  };
                  await this.contactRepository.createContactAddressMapping(
                    mappingData
                  );
                }
              })
            );
          }
          // remove all existing address.
          await this.contactRepository.deleteEntityTableMapIds(
            CONTACT_MAP_TABLE_DELETE_FIELDS.CONTACT_ADDRESS,
            existingAddressIds,
            CONTACT_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
            MAPPED_DATA_DELETION.MAP_REMOVED
          );
        }
        if (qualificationExperiences) {
          // retrieves the existing qualification experience
          const existingQualificationIds =
            await this.contactRepository.getEntityTableMapIds(
              CONTACT_MAP_TABLE_DELETE_FIELDS.QUALIFICATION_EXPERIENCE,
              CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
              { contact: { id: contactId } }
            );
          if (qualificationExperiences?.length > 0) {
            const updatedQualifications = await Promise.all(
              qualificationExperiences.map((qualification) => {
                if (qualification.id) {
                  const index = existingQualificationIds.indexOf(
                    qualification.id
                  );
                  if (index !== -1) {
                    existingQualificationIds.splice(index, 1);
                  }
                  qualification.updatedAt = new Date();
                  qualification.updatedBy = userId;
                  return this.contactRepository.updateQualificationExperience(
                    qualification.id,
                    qualification
                  );
                } else {
                  Object.assign(qualification, metadata);
                  qualification.contact = contactId;
                  return this.contactRepository.createQualificationExperience(
                    qualification
                  );
                }
              })
            );
            contact.qualificationExperiences = updatedQualifications;
          }
          // remove all existing qualification experience.
          await this.contactRepository.deleteEntityTableMapIds(
            CONTACT_MAP_TABLE_DELETE_FIELDS.QUALIFICATION_EXPERIENCE,
            existingQualificationIds,
            CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
            MAPPED_DATA_DELETION.SOFT_DELETE
          );
        }
        if (professionalExperiences) {
          // retrieves the existing professional experience
          const existingProfessionalIds =
            await this.contactRepository.getEntityTableMapIds(
              CONTACT_MAP_TABLE_DELETE_FIELDS.PROFESSIONAL_EXPERIENCE,
              CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
              { contact: { id: contactId } }
            );
          if (professionalExperiences?.length > 0) {
            const updatedProfessionalExperiences = await Promise.all(
              professionalExperiences.map((experience) => {
                if (experience.id) {
                  const index = existingProfessionalIds.indexOf(experience.id);
                  if (index !== -1) {
                    existingProfessionalIds.splice(index, 1);
                  }
                  experience.updatedAt = new Date();
                  experience.updatedBy = userId;
                  return this.contactRepository.updateProfessionalExperience(
                    experience.id,
                    experience
                  );
                } else {
                  Object.assign(experience, metadata);
                  experience.contact = contactId;
                  return this.contactRepository.createProfessionalExperience(
                    experience
                  );
                }
              })
            );
            contact.professionalExperiences = updatedProfessionalExperiences;
          }
          // remove all existing professional experience.
          await this.contactRepository.deleteEntityTableMapIds(
            CONTACT_MAP_TABLE_DELETE_FIELDS.PROFESSIONAL_EXPERIENCE,
            existingProfessionalIds,
            CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
            MAPPED_DATA_DELETION.SOFT_DELETE
          );
        }
        if (contactDetails) {
          const childMetadata = {
            ...metadata,
            contactDetailsId: contactDetails?.id,
          };
          if (contactDetails.id) {
            contactDetails.updatedAt = new Date();
            contactDetails.updatedBy = userId;
            const children = contactDetails.childDetails ?? [];
            // retreive all existing child details
            const existingChildIds =
              await this.contactRepository.getEntityTableMapIds(
                CONTACT_MAP_TABLE_DELETE_FIELDS.CHILD_DETAILS,
                CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
                { contactDetailsId: contactDetails.id }
              );
            if (children.length > 0) {
              await Promise.all(
                children.map(async (childDetail) => {
                  if (childDetail.id) {
                    const index = existingChildIds.indexOf(childDetail.id);
                    if (index !== -1) {
                      existingChildIds.splice(index, 1);
                    }
                  }
                  const baseData: any = childDetail.id
                    ? { ...childDetail, ...childMetadata }
                    : {
                        ...childDetail,
                        ...metadata,
                        contactDetailsId: contactDetails.id,
                      };
                  return childDetail.id
                    ? this.contactRepository.updateChildDetails(
                        childDetail.id,
                        baseData
                      )
                    : this.contactRepository.createChildDetails(baseData);
                })
              );
            }
            delete contactDetails.childDetails; // Clean up before saving

            await this.contactRepository.updateContactDetails(
              contactDetails.id,
              contactDetails
            );
            // remove all existing child details
            await this.contactRepository.deleteEntityTableMapIds(
              CONTACT_MAP_TABLE_DELETE_FIELDS.CHILD_DETAILS,
              existingChildIds,
              CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
              MAPPED_DATA_DELETION.SOFT_DELETE
            );
          } else {
            Object.assign(contactDetails, metadata);
            if (
              Array.isArray(contactDetails.childDetails) &&
              contactDetails.childDetails.length > 0
            ) {
              const now = new Date();
              contactDetails.childDetails = contactDetails.childDetails.map(
                (childDetail) => ({
                  ...childDetail,
                  ...metadata,
                  createdAt: now,
                  updatedAt: now,
                })
              );
            }
            contactDetails.contact = contactId;
            await this.contactRepository.createContactDetails(contactDetails);
          }
          contact.contactDetails = contactDetails;
        }
        if (communicationDetails) {
          // retrieves the existing communication details
          const existingCommunicationDetailsIds =
            await this.contactRepository.getEntityTableMapIds(
              CONTACT_MAP_TABLE_DELETE_FIELDS.COMMUNICATION_DETAILS,
              CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
              { contactId: contactId }
            );
          if (communicationDetails?.length) {
            const updatedCommunicationDetails = await Promise.all(
              communicationDetails.map((detail) => {
                if (detail.id) {
                  const index = existingCommunicationDetailsIds.indexOf(
                    detail.id
                  );
                  if (index !== -1) {
                    existingCommunicationDetailsIds.splice(index, 1);
                  }
                  detail.updatedAt = new Date();
                  detail.updatedBy = userId;
                  return this.contactRepository.updateCommunicationDetails(
                    detail.id,
                    detail
                  );
                } else {
                  Object.assign(detail, metadata);
                  detail.contact = contactId;
                  return this.contactRepository.createContactCommunicationDetails(
                    detail
                  );
                }
              })
            );
            contact.communicationDetails = updatedCommunicationDetails;
          }
          // remove all existing communication details.
          await this.contactRepository.deleteEntityTableMapIds(
            CONTACT_MAP_TABLE_DELETE_FIELDS.COMMUNICATION_DETAILS,
            existingCommunicationDetailsIds,
            CONTACT_MAP_TABLE_DELETE_FIELDS.ID,
            MAPPED_DATA_DELETION.SOFT_DELETE
          );
        }
        if (contactDocMaps?.length) {
          const updatedContactDocMaps = await Promise.all(
            contactDocMaps.map((docDetails) => {
              if (docDetails.id) {
                docDetails.updatedAt = new Date();
                return this.contactRepository.updateContactDocumentDetails(
                  docDetails.id,
                  docDetails
                );
              } else {
                const newDocObject: any = {
                  contactId: contactId,
                  documentId: docDetails.documentId,
                };
                return this.contactRepository.createContactDocumentMapping(
                  newDocObject
                );
              }
            })
          );
          contact.contactDocMaps = updatedContactDocMaps;
        }
        removeMetadataFields(contact);
        const updatedContactResult =
          await this.contactRepository.getContactData(contactId);
        return updatedContactResult;
        // return contact;
      } catch (error) {
        if (error.message.includes("Duplicate entry")) {
          throw new Error(error.message); // Propagate the duplicate entry error
        }
        throw error; // Re-throw other errors
      }
    });
  }

  /** Removes a contact by ID. */
  async deleteContactById(contactId: number): Promise<{ message: string }> {
    return this.dataSource.transaction(async () => {
      try {
        const contact = await this.contactRepository.getContactData(contactId);
        if (!contact) {
          throw new NotFoundException(`Contact with ID ${contactId} not found`);
        }

        await this.contactRepository.removeContact(contact);
        return {
          message: `Contact with ID ${contactId} and its addresses deleted successfully`,
        };
      } catch (error) {
        throw new BadRequestException(
          createErrorResponse(
            statusCode.badRequest,
            errorMessages.contactDeletionFailed
          )
        );
      }
    });
  }
  /** Checks the given new address exists in company address */
  async checkCompanyAddressExists(newAddress: any, companyAddresses: any) {
    const addressObject = [
      "address1",
      "cityId",
      "stateId",
      "countryId",
      "pinCode",
      "phoneNumber",
    ];
    // Fetch address type details
    const addressTypeDetails = await this.lookUpRepository.getLookUpById(
      newAddress.addressTypeLid
    );

    // If it's a default residential address, return 0
    if (
      addressTypeDetails.data.lookUpValue ===
      DEFAULT_RESIDENTIAL_ADDRESS_TYPE_KEY
    ) {
      return 0;
    }

    if (companyAddresses?.length) {
      for (const existingAddress of companyAddresses) {
        // Check if all specified keys in `addressObject` match
        const isExactMatch = addressObject.every(
          (key) =>
            ["countryId", "stateId", "cityId"].includes(key)
              ? existingAddress[key]["id"] === newAddress[key]
              : existingAddress[key] === newAddress[key]
          // Object.keys(existingAddress).includes(key) ? existingAddress[key] === newAddress[key]: existingAddress["address"][key] === newAddress[key]
        );

        if (isExactMatch) {
          return existingAddress.address.id; // Return ID if an exact match is found
        }
      }
    }

    return 0; // Return 0 if no match is found
  }

  async fetchContactList(
    page: number,
    limit: number,
    search: string,
    contactRecordTypeLid: number,
    entityIds: number[],
    userId: number
  ) {
    try {
      const contacts = await this.contactRepository.fetchContactList(
        page,
        limit,
        search,
        contactRecordTypeLid,
        entityIds,
        userId
      );
      return contacts;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Error fetching contacts: ${error.message}` // Provide a more specific error message
      );
    }
  }
}

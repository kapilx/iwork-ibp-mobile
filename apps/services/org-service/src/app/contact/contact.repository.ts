import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, ILike, In } from "typeorm";
import { CreateContactDto } from "./dto/create-contact.dto";
import { ContactResponseDto } from "./dto/contact-response.dto";
import { ContactListResponseDto } from "./dto/contact-list-response.dto";
import { ContactAddressDto } from "./dto/contact-address.dto";
import { CompanyAddressDto } from "./dto/company-address.dto";
import { CreateContactDetailsDto } from "./dto/contact-details.dto";
import { CreateProfessionalExperienceDto } from "./dto/professional-experience.dto";
import { CreateQualificationExperienceDto } from "./dto/qualification-experience.dto";
import { ContactDocumentMapDto } from "../contact/dto/contact-document-map.dto";
import { CompanyContactMapDto } from "../contact/dto/contact-company-map.dto";
import { CreateContactCommunicationDetailsDto } from "./dto/create-contact-communication-details.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { UpdateQualificationExperienceDto } from "./dto/update-qualification-experience.dto";
import { UpdateContactCommunicationDetailsDto } from "./dto/update-contact-communication-details.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto.ts";
import { Contact } from "../../../../service-lib/src/lib/entities/contact.entity";
import { ContactAddress } from "../../../../service-lib/src/lib/entities/contact-address.entity";
import { ContactDetails } from "../../../../service-lib/src/lib/entities/contact-details.entity";
import { CompanyAddress } from "../../../../service-lib/src/lib/entities/company.address.entity";
import { ContactDocMap } from "../../../../service-lib/src/lib/entities/contact-document-map.entity";
import { CompanyContactMap } from "../../../../service-lib/src/lib/entities/company-contact.entity";
import { ContactCommunicationDetails } from "../../../../service-lib/src/lib/entities/contact-communication-details.entity";
import { ProfessionalExperience } from "../../../../service-lib/src/lib/entities/professional-experience.entity";
import { QualificationExperience } from "../../../../service-lib/src/lib/entities/qualification-experience.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import { getDurationDates } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import {
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY_ID,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY_ID,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_KPI_COUNT,
  DEFAULT_CONTACT_ENTITY_NAME,
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { Broker } from "../../../../service-lib/src/lib/entities/broker.entity";
import { ChildDetails } from "../../../../service-lib/src/lib/entities/child-details.entity";
import { CreateChildDetailsDto } from "./dto/child-details.dto";
import { UpdateChildDetailsDto } from "./dto/update-child-details.dto";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import {
  DEFAULT_DATE_FILTER_FIELD,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { CONTACT_RECORD_TYPE_MAP } from "../../../../service-lib/src/lib/constants";
/**
 * Repository for managing contact-related database operations.
 */
@Injectable()
export class ContactRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ContactCommunicationDetails)
    private readonly contactCommunicationDetailsRepository: Repository<ContactCommunicationDetails>,
    @InjectRepository(ContactDetails)
    private readonly contactDetailsRepository: Repository<ContactDetails>,
    @InjectRepository(ChildDetails)
    private readonly childDetailsRepository: Repository<ChildDetails>,
    @InjectRepository(ProfessionalExperience)
    private readonly professionalExperienceRepository: Repository<ProfessionalExperience>,
    @InjectRepository(QualificationExperience)
    private readonly qualificationExperienceRepository: Repository<QualificationExperience>,
    @InjectRepository(ContactAddress)
    private readonly contactAddressRepository: Repository<ContactAddress>,
    @InjectRepository(CompanyAddress)
    private readonly companyAddressRepository: Repository<CompanyAddress>,
    @InjectRepository(ContactDocMap)
    private readonly contactDocumentMapRepository: Repository<ContactDocMap>,
    @InjectRepository(CompanyContactMap)
    private readonly companyContactMapRepository: Repository<CompanyContactMap>,
    @InjectRepository(Insurer)
    private readonly insurerRepository: Repository<Insurer>,
    @InjectRepository(Tpa)
    private readonly tpaRepository: Repository<Tpa>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    private readonly dataSource: DataSource,
    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Creates a new contact in the database.*/
  async createContact(
    createContact: CreateContactDto
  ): Promise<ContactResponseDto> {
    try {
      const contact = this.contactRepository.create(createContact);
      const savedContact = await this.dataSource.manager.save(
        DEFAULT_CONTACT_ENTITY_NAME,
        contact
      );
      return savedContact;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryCreationFailed
        )
      );
    }
  }

  /** Creates an contact details */
  async createContactDetails(
    contactDetailsData: CreateContactDetailsDto
  ): Promise<ContactDetails> {
    try {
      const contactDetails =
        this.contactDetailsRepository.create(contactDetailsData);
      const savedContactDetails = await this.contactDetailsRepository.save(
        contactDetails
      );
      return savedContactDetails;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryCreationFailed
        )
      );
    }
  }
  /** Creates an child details */
  async createChildDetails(
    childDetailsData: CreateChildDetailsDto
  ): Promise<ChildDetails> {
    try {
      const childDetails = this.childDetailsRepository.create(childDetailsData);
      const savedChildDetails = await this.childDetailsRepository.save(
        childDetails
      );
      return savedChildDetails;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.childQueryCreationFailed
        )
      );
    }
  }

  /** Updates an existing child detail. */
  async updateChildDetails(
    id: number,
    childDetailsData: UpdateChildDetailsDto
  ): Promise<ChildDetails> {
    try {
      const existingChildDetails = await this.childDetailsRepository.findOne({
        where: { id },
      });

      if (!existingChildDetails) {
        throw new NotFoundException(`ChildDetails with ID ${id} not found`);
      }

      const mergedChildDetails = this.childDetailsRepository.merge(
        existingChildDetails,
        childDetailsData
      );

      return await this.childDetailsRepository.save(mergedChildDetails);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.childQueryUpdationFailed
        )
      );
    }
  }
  /** Delete the child detail */
  async deleteChildDetails(contactDetailsId: number): Promise<void> {
    try {
      const childDetails = await this.childDetailsRepository.find({
        where: { contactDetails: { id: contactDetailsId } },
      });

      if (childDetails.length) {
        // Perform a soft delete by updating the `deleted_at` column
        await this.childDetailsRepository.update(
          { contactDetails: { id: contactDetailsId } },
          { deletedAt: new Date() }
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.childQueryUpdationFailed
        )
      );
    }
  }

  /** Creates an professional experience associated with contact */
  async createProfessionalExperience(
    professionalExperienceDataObject: CreateProfessionalExperienceDto
  ): Promise<ProfessionalExperience> {
    try {
      const professionalExperienceData =
        this.professionalExperienceRepository.create(
          professionalExperienceDataObject
        );
      const savedProfessionalDetails =
        await this.professionalExperienceRepository.save(
          professionalExperienceData
        );

      return savedProfessionalDetails;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryCreationFailed
        )
      );
    }
  }

  /** Creates an qualification experience associated with contact */
  async createQualificationExperience(
    qualificationExperienceData: CreateQualificationExperienceDto
  ): Promise<QualificationExperience> {
    try {
      const qualificationExperience =
        this.qualificationExperienceRepository.create(
          qualificationExperienceData
        );

      const savedQualificationDetails =
        await this.qualificationExperienceRepository.save(
          qualificationExperience
        );

      return savedQualificationDetails;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryCreationFailed
        )
      );
    }
  }

  /** Fetches all contact details from the database.*/
  async fetchAllContacts(): Promise<ContactResponseDto[]> {
    try {
      return await this.contactRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryFetchFailed
        )
      );
    }
  }

  /** Fetches paginated contact details from the database. */
  async fetchPaginatedContactList(
    page: number,
    limit: number,
    userId: number,
    contactRecordTypeLid: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    searchBy: string,
    contactSearchObject: string[],
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number
  ): Promise<{
    data: ContactListResponseDto[];
    count: number;
    allContactIds: number[];
  }> {
    try {
      // const status = await this.lookUpRepository.findOne({
      //   where: { lookUpKey: DEFAULT_CONTACT_STATUS_ACTIVE_KEY },
      // });
      const whereCondition: Partial<Contact> = {
        contactRecordTypeLid: contactRecordTypeLid,
        // statusLid: status?.id ?? undefined,
      };
      const contactRecordTypeLookup = await this.lookUpRepository.findOne({
        where: { id: contactRecordTypeLid },
      });
      if (!contactRecordTypeLookup) {
        throw new NotFoundException(
          `Lookup with id ${contactRecordTypeLid} not found`
        );
      }
      const recordType =
        CONTACT_RECORD_TYPE_MAP[
          contactRecordTypeLookup.lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ];
      let periodStartAndEndDate;
      if (timeFilter || financialYear !== undefined) {
        const range = getDateRange(timeFilter, financialYear);
        if (range.start && range.end) {
          periodStartAndEndDate = {
            field: field || "createdAt",
            from: range.start,
            to: range.end,
          };
        }
      } else if (period) {
        try {
          const fromToDate = getDurationDates(period);
          periodStartAndEndDate = {
            field: field ?? DEFAULT_DATE_FILTER_FIELD,
            from: fromToDate.startDate,
            to: fromToDate.endDate,
          };
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      }
      let dateFilter;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      const relations: any = await this.getContactRelations(recordType);
      // const { data, count } = await this.entityService.fetchEntityList(
      //   DEFAULT_CONTACT_ENTITY_NAME,
      //   page,
      //   limit,
      //   sort && sort?.length > 0 ? sort : [{ field: "id", order: "DESC" }],
      //   relations,
      //   whereCondition,
      //   undefined,
      //   searchArray && searchArray?.length === 0 ? [] : searchArray,
      //   undefined,
      //   searchBy,
      //   contactSearchObject
      // );
      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: DEFAULT_CONTACT_ENTITY_NAME,
          page: page,
          limit: limit,
          sort:
            sort && sort?.length > 0
              ? sort
              : [{ field: "updatedAt", order: "DESC" }],
          relations: relations,
          where: whereCondition,
          select: undefined,
          searchArray:
            searchArray && searchArray?.length === 0 ? [] : searchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: contactSearchObject,
          dateFilter:
            dateFilter && Object.keys(dateFilter).length > 0
              ? (dateFilter as { field: string; from: Date; to?: Date })
              : undefined,
          period: periodStartAndEndDate,
        },
        userId,
        "contact"
      );

      // Reload ALL communication details for each returned contact so that
      // a search filter on one communication detail (e.g. phone) does not
      // strip the others (e.g. email) from the response.
      if (data?.length) {
        const contactIds = data.map((c: any) => c.id).filter(Boolean);
        if (contactIds.length > 0) {
          const allCommDetails =
            await this.contactCommunicationDetailsRepository.find({
              where: { contactId: In(contactIds) },
            });
          data.forEach((contact: any) => {
            contact.communicationDetails = allCommDetails.filter(
              (cd) => cd.contactId === contact.id
            );
          });
        }
      }

      let contactData: any = [];
      if (data?.length) {
        contactData = data.map((contact) => ({
          id: contact.id,
          contactName: contact?.middleName
            ? `${contact?.firstName} ${contact?.middleName} ${contact?.lastName}`
            : `${contact?.firstName} ${contact?.lastName}`,
          displayName: contact?.displayName,
          tag: contact?.tag ? contact?.tag?.lookUpValue : null,
          companyId:
            recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
              ? contact?.companyContactMaps[0]?.company?.id
              : recordType ===
                CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
              ? contact?.insurerContacts[0]?.insurer?.id
              : recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
              ? contact?.tpaContacts[0]?.tpa?.id
              : contact?.brokerContacts[0]?.broker?.id,
          companyName:
            recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
              ? contact?.companyContactMaps[0]?.company?.companyName
              : recordType ===
                CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
              ? contact?.insurerContacts[0]?.insurer?.insurerName
              : recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
              ? contact?.tpaContacts[0]?.tpa?.tpaName
              : contact?.brokerContacts[0]?.broker?.brokerName,
          numberOfAddress: Array.isArray(contact?.contactAddresses)
            ? contact.contactAddresses.length
            : 0,
          communicationDetails: contact?.communicationDetails?.map(
            (communication) => {
              return {
                id: communication?.id,
                communicationType: communication?.communicationType,
                communicationDetails: communication?.communicationDetails,
                isPrimary: communication?.isPrimary,
              };
            }
          ),
          status: contact.status
            ? {
                id: contact.status.id,
                lookUpValue: contact.status.lookUpValue,
              }
            : null,
          owner: contact?.owner
            ? {
                userId: contact?.owner?.userId,
                firstName: contact?.owner?.firstName,
                lastName: contact?.owner?.lastName,
              }
            : null,
          department: contact?.department ? contact?.department : null,
          designation: contact?.designation ? contact?.designation : null,
        }));
      }
      const { data: allContactIds } =
        await this.scopeService.validateMasterScope(
          {
            entity: DEFAULT_CONTACT_ENTITY_NAME,
            page: 1,
            limit: count,
            sort: [{ field: "id", order: "DESC" }],
            relations: relations,
            where: whereCondition,
            select: ["id"],
            searchArray:
              searchArray && searchArray?.length === 0 ? [] : searchArray,
            userFilter: undefined,
            searchString: searchBy,
            searchOn: contactSearchObject,
            dateFilter:
              dateFilter && Object.keys(dateFilter).length > 0
                ? (dateFilter as { field: string; from: Date; to?: Date })
                : undefined,
            period: periodStartAndEndDate,
          },
          userId,
          "contact"
        );
      const totalContactIds = allContactIds.map((contact) => contact.id);
      return {
        data: contactData,
        count: count,
        allContactIds: totalContactIds,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryFetchFailed
        )
      );
    }
  }

  async getContactRelations(recordType: string) {
    let relations: any = [];
    if (recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE) {
      relations = [
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
    } else if (
      recordType === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
    ) {
      relations = [
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
    } else if (recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE) {
      relations = [
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
    } else if (
      recordType === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
    ) {
      relations = [
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
    }
    return relations;
  }

  /** Retrieves existing contact details based on the provided contact ID. */
  async getExistingContactDetails(contactId: number): Promise<Contact> {
    try {
      const existingContactDetails = await this.contactRepository.findOne({
        where: { id: contactId },
        relations: ["contactRecordType"],
      });
      if (!existingContactDetails) {
        throw new NotFoundException(`Contact with ID ${contactId} not found`);
      }
      return existingContactDetails;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactDataNotFound
        )
      );
    }
  }

  /** Retrieves the details of a specific contact by ID. */
  async getContactData(id: number): Promise<ContactResponseDto> {
    try {
      const existingContactDetails = await this.getExistingContactDetails(id);
      const contactRecord =
        CONTACT_RECORD_TYPE_MAP[
          existingContactDetails?.contactRecordType
            ?.lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ];
      const contactRelations: any = [
        "contactAddresses.address.addressType",
        "contactAddresses.address.branchType",
        "contactDetails.genderType",
        "contactDetails.spouseWorkingStatusType",
        "contactDetails.maritalStatusType",
        "contactDetails.childDetails.childGenderType",
        "professionalExperiences",
        "qualificationExperiences",
        "contactDocMaps",
        "reportingTo",
        "relationshipType",
        "communicationDetails",
        "companyLocation",
      ];
      if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "companyContactMaps.company.companyAddresses.address.addressType"
        );
      } else if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "insurerContacts.insurer.insurerAddresses.address.addressType",
          "insurerContacts.insurer.isLife",
          "insurerContacts.insurer.companyType",
          "insurerContacts.insurer.companyTag",
          "insurerContacts.insurer.status"
        );
      } else if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "tpaContacts.tpa.tpaAddresses.address.addressType",
          "tpaContacts.tpa.status"
        );
      } else if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "brokerContacts.broker.brokerAddresses.address.addressType",
          "brokerContacts.broker.status",
          "brokerContacts.broker.companyType"
        );
      }
      const contact = await this.contactRepository.findOne({
        where: { id },
        relations: contactRelations,
        order: {
          contactAddresses: { id: 'DESC' },
        },
      });

      if (!contact) {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }

      const lookUpValues = await this.entityService.getLookupValues([
        contact.salutationLid,
        contact?.tagLid ?? 0,
        contact?.contactTypeLid ?? 0,
        contact.statusLid,
        contact.relationshipTypeLid,
        contact.contactRecordTypeLid,
      ]);

      const salutation =
        lookUpValues.find((item) => item.id === contact.salutationLid) ?? null;
      const tag =
        lookUpValues.find((item) => item.id === contact.tagLid) ?? null;
      const contactType =
        lookUpValues.find((item) => item.id === contact.contactTypeLid) ?? null;
      const status =
        lookUpValues.find((item) => item.id === contact.statusLid) ?? null;
      let contactRecordType = null;
      const contactRecordTypeData = await this.lookUpRepository.findOne({
        where: { id: contact.contactRecordTypeLid },
      });
      if (contactRecordTypeData) {
        contactRecordType = contactRecordTypeData;
      } else {
        contactRecordType = null;
      }

      const relationshipType =
        lookUpValues.find((item) => item.id === contact.relationshipTypeLid) ??
        null;
      const enrichedContact = {
        ...contact,
        salutation,
        tag,
        contactType,
        status,
        contactRecordType,
        relationshipType,
      };
      return this.transformContacts(enrichedContact);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryFetchFailed
        )
      );
    }
  }

  async getContactCompanyDataAddress(id: number): Promise<ContactResponseDto> {
    try {
      const existingContactDetails = await this.getExistingContactDetails(id);
      const contactRecord =
        CONTACT_RECORD_TYPE_MAP[
          existingContactDetails?.contactRecordType
            ?.lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ];

      const contactRelations: any = ["status", "contactRecordType"];
      if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "companyContactMaps.company.companyAddresses.address.addressType"
        );
      } else if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "insurerContacts.insurer.insurerAddresses.address.addressType"
        );
      } else if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "tpaContacts.tpa.tpaAddresses.address.addressType"
        );
      } else if (
        contactRecord === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
      ) {
        contactRelations.push(
          "brokerContacts.broker.brokerAddresses.address.addressType"
        );
      }
      const contact = await this.contactRepository.findOne({
        where: { id },
        relations: contactRelations,
      });

      if (!contact) {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }
      return this.transformContacts(contact);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ContactRepository",
          method: "getContactCompanyDataAddress",
          payload: { id },
          messageData: error,
        }),
      });

      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryFetchFailed
        )
      );
    }
  }

  /** Updates the details of an existing contact. */
  async updateContact(
    id: number,
    updateContact: UpdateContactDto
  ): Promise<ContactResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const contact = await this.contactRepository.preload({
        id: id,
        ...updateContact,
      });
      if (!contact) {
        throw new NotFoundException(`Contact with ID ${id} not found`);
      }
      const updatedContact = await queryRunner.manager.save(
        DEFAULT_CONTACT_ENTITY_NAME,
        contact
      );
      await queryRunner.commitTransaction();
      return updatedContact;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            createErrorResponse(
              statusCode.badRequest,
              errorMessages.contactQueryUpdationFailed
            )
          );
    } finally {
      await queryRunner.release();
    }
  }

  /** Removes a contact from the database. */
  async removeContact(contact: ContactResponseDto): Promise<void> {
    try {
      const contactData = await this.contactRepository.findOne({
        where: { id: contact.id },
        select: ["id", "statusLid"],
      });

      if (!contactData) {
        throw new NotFoundException(`Contact with ID ${contact.id} not found`);
      }

      const deleteQuery = {
        deletedAt: new Date(),
        ...(contactData.statusLid === DEFAULT_CONTACT_STATUS_ACTIVE_KEY_ID && {
          statusLid: DEFAULT_CONTACT_STATUS_INACTIVE_KEY_ID,
        }),
      };

      await this.contactRepository.update(contact.id, deleteQuery);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete contact`);
    }
  }

  /** Creates a new contact and address mapping in the ContactAddress Table */
  async createContactAddressMapping(
    contactAddressData: ContactAddressDto
  ): Promise<ContactAddress> {
    try {
      const contactAddress = this.contactAddressRepository.create({
        contact: { id: contactAddressData.contactId },
        address: { id: contactAddressData.addressId },
      });

      return await this.contactAddressRepository.save(contactAddress);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactAddressMappingCreationFailed
        )
      );
    }
  }

  /** Creates a new company and address mapping in the CompanyAddress Table */
  async createCompanyAddressMapping(
    companyAddressData: CompanyAddressDto
  ): Promise<CompanyAddress> {
    try {
      const companyAddress =
        this.companyAddressRepository.create(companyAddressData);
      await this.companyAddressRepository.save(companyAddress);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.companyAddressMappingCreationFailed
        )
      );
    }
  }

  /** Finds the address and contact data mapping in ContactAddress Table */
  async findContactAddressMap(
    contactId: number,
    addressId: number
  ): Promise<ContactAddress | null> {
    return this.contactAddressRepository.findOne({
      where: {
        contact: { id: contactId },
        address: { id: addressId },
      },
    });
  }

  /** Finds the address and company data mapping in CompanyAddress Table */
  async findCompanyAddressMap(
    companyId: number,
    addressId: number
  ): Promise<CompanyAddress | null> {
    return this.companyAddressRepository.findOne({
      where: {
        company: { id: companyId },
        address: { id: addressId },
      },
    });
  }

  /** Updates the communication details associated with the contact */
  async updateCommunicationDetails(
    id: number,
    communicationDetailsData: UpdateContactCommunicationDetailsDto
  ): Promise<ContactCommunicationDetails> {
    const existingDetails =
      await this.contactCommunicationDetailsRepository.findOne({
        where: { id },
      });

    if (!existingDetails) {
      throw new NotFoundException(
        `ContactCommunicationDetails with ID ${id} not found`
      );
    }

    const updateData: any = { ...communicationDetailsData };
    if (communicationDetailsData.contact) {
      updateData.contact = { id: communicationDetailsData.contact };
    }

    const mergedDetails = this.contactCommunicationDetailsRepository.merge(
      existingDetails,
      updateData
    );

    return this.contactCommunicationDetailsRepository.save(mergedDetails);
  }

  /** Create a new communication details associated with the contact */
  async createContactCommunicationDetails(
    communicationDetailsData: CreateContactCommunicationDetailsDto
  ): Promise<ContactCommunicationDetails> {
    try {
      const contactDetails = this.contactCommunicationDetailsRepository.create({
        contactId: communicationDetailsData.contact,
        communicationType: communicationDetailsData.communicationType,
        communicationDetails: communicationDetailsData.communicationDetails,
        isPrimary: communicationDetailsData.isPrimary ?? false,
        createdBy: communicationDetailsData.createdBy,
        updatedBy: communicationDetailsData.updatedBy,
      });

      return await this.contactCommunicationDetailsRepository.save(
        contactDetails
      );
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactQueryCreationFailed
        )
      );
    }
  }

  /** Transforms the contact by renaming `contactAddresses` to `address` and formatting the response. */
  async transformContacts(
    contactOrContacts: Contact | Contact[]
  ): ContactResponseDto | ContactResponseDto[] {
    const mapAddress = (contactAddress: ContactAddress) => ({
      id: contactAddress.address?.id,
      addressTypeLid: contactAddress.address?.addressTypeLid,
      addressType: mapLookup(contactAddress.address?.addressType),
      address1: contactAddress.address?.address1,
      address2: contactAddress.address?.address2,
      area: contactAddress.address?.area,
      countryId: contactAddress.address?.countryId,
      stateId: contactAddress.address?.stateId,
      cityId: contactAddress.address?.cityId,
      pinCode: contactAddress.address?.pinCode,
      email: contactAddress.address?.email,
      phoneNumber: contactAddress.address?.phoneNumber,
      alternatePhoneNumber: contactAddress.address?.alternatePhoneNumber,
      supportNumber: contactAddress.address?.supportNumber,
      branchType: contactAddress.address?.branchType
        ? mapLookup(contactAddress.address.branchType)
        : null,
      branchName: contactAddress.address?.branchName ?? null,
    });

    const mapContactDetail = (detail: ContactDetails) => ({
      id: detail?.id,
      gender: detail?.gender,
      dateOfBirth: detail?.dateOfBirth,
      favouriteFood: detail?.favouriteFood,
      favouriteRestaurant: detail?.favouriteRestaurant,
      personalHistory: detail?.personalHistory,
      majorAchievements: detail?.majorAchievements,
      maritalStatus: detail?.maritalStatus,
      dateOfWedding: detail?.dateOfWedding,
      spouseName: detail?.spouseName,
      spouseDateOfBirth: detail?.spouseDateOfBirth,
      spouseWorkingStatus: detail?.spouseWorkingStatus,
      workingCompany: detail?.workingCompany,
      childDetails: detail?.childDetails?.map(mapChildDetail),
      genderType: mapLookup(detail?.genderType),
      spouseWorkingStatusType: mapLookup(detail?.spouseWorkingStatusType),
      maritalStatusType: mapLookup(detail?.maritalStatusType),
    });

    const mapExperience = (exp: ProfessionalExperience) => ({
      id: exp.id,
      fromDate: exp.fromDate,
      toDate: exp.toDate,
      designation: exp.designation,
      department: exp.department,
      company: exp.company,
      details: exp.details,
    });

    const mapQualification = (qual: QualificationExperience) => ({
      id: qual.id,
      nameOfQualification: qual.nameOfQualification,
      yearOfQualification: qual.yearOfQualification,
      details: qual.details,
      universityName: qual.universityName,
    });

    const mapLookup = (lookup: LookUp) => ({
      id: lookup?.id,
      lookUpValue: lookup?.lookUpValue,
    });

    const mapCity = (city: City) => ({
      id: city?.id,
      lookUpValue: city?.name,
    });

    const mapContactDocs = (doc: ContactDocMap) => ({
      id: doc?.id,
      documentId: doc?.documentId,
    });

    const mapChildDetail = (doc: ChildDetails) => ({
      id: doc?.id,
      childName: doc?.childName,
      childDob: doc?.childDob,
      childGender: doc?.childGender,
      childGenderType: mapLookup(doc?.childGenderType),
      contactDetailsId: doc?.contactDetailsId,
    });

    const mapCommunicationDetails = (doc: ContactCommunicationDetails) => ({
      id: doc?.id,
      communicationType: doc?.communicationType,
      communicationDetails: doc?.communicationDetails,
      isPrimary: doc?.isPrimary,
    });

    const mapCompany = (company: Company) =>
      company
        ? {
            id: company.id,
            companyName: company.companyName,
            displayName: company.displayName,
            companyTypeLid: company.companyTypeLid,
            companyTagLid: company.companyTagLid,
            currencyId: company.currencyId,
            industrySegmentLid: company.industrySegmentLid,
            groupCompanyLid: company.groupCompanyLid,
            noOfEmployees: company.noOfEmployees,
            website: company.website,
            dateOfIncorporation: company.dateOfIncorporation,
            panCardNumber: company.panCardNumber,
            registrationNo: company.registrationNo,
            existingBrokerId: company.existingBrokerId,
            paidUpCapital: company.paidUpCapital,
            tanNumber: company.tanNumber,
            priorityLid: company.priorityLid,
            statusLid: company.statusLid,
            remarks: company.remarks,
            source: company.source,
            companyAddresses: company.companyAddresses,
          }
        : null;

    const mapInsurerCompany = (company: Insurer) =>
      company
        ? {
            id: company.id,
            insurerName: company.insurerName,
            displayName: company.displayName,
            companyTypeLid: company.companyTypeLid,
            website: company.website,
            isLifeLid: company.isLifeLid,
            companyTagLid: company.companyTagLid,
            remarks: company.remarks,
            insureCode: company.insureCode,
            statusLid: company.statusLid,
            isLife: mapLookup(company.isLife),
            companyType: mapLookup(company.companyType),
            companyTag: mapLookup(company.companyTag),
            status: mapLookup(company.status),
            companyAddresses: company.insurerAddresses,
          }
        : null;

    const mapTpaCompany = (company: Tpa) =>
      company
        ? {
            id: company.id,
            tpaName: company.tpaName,
            displayName: company.displayName,
            companyTypeLid: company.companyTypeLid,
            website: company.website,
            remarks: company.remarks,
            statusLid: company.statusLid,
            status: mapLookup(company.status),
            companyAddresses: company.tpaAddresses,
          }
        : null;

    const mapBrokerCompany = (company: Broker) =>
      company
        ? {
            id: company?.id,
            brokerName: company?.brokerName,
            displayName: company.displayName,
            companyTypeLid: company.companyTypeLid,
            website: company.website,
            remarks: company.remarks,
            statusLid: company.statusLid,
            status: mapLookup(company.status),
            companyType: mapLookup(company.companyType),
            companyAddresses: company.brokerAddresses,
          }
        : null;

    const transform = (contact: Contact) => ({
      id: contact?.id,
      firstName: contact?.firstName,
      lastName: contact?.lastName,
      middleName: contact?.middleName,
      displayName: contact?.displayName,
      companyLocationId: contact?.companyLocationId,
      companyBranchId: contact?.companyBranchId,
      remarks: contact?.remarks,
      linkedInUrl: contact?.linkedInUrl,
      relationshipTypeLid: contact?.relationshipTypeLid,
      relationshipType: mapLookup(contact?.relationshipType),

      address: contact?.contactAddresses?.map(mapAddress),
      contactDetails: mapContactDetail(contact?.contactDetails),
      professionalExperiences:
        contact?.professionalExperiences?.map(mapExperience),
      qualificationExperiences:
        contact?.qualificationExperiences?.map(mapQualification),
      contactDocMaps: contact?.contactDocMaps?.map(mapContactDocs),
      communicationDetails: contact?.communicationDetails?.map(
        mapCommunicationDetails
      ),
      salutation: contact.salutation,
      tag: contact.tag,
      contactType: contact.contactType,
      department: contact?.department ? contact?.department : null,
      designation: contact?.designation ? contact?.designation : null,
      status: contact.status,
      contactRecordType: contact.contactRecordType,
      company:
        CONTACT_RECORD_TYPE_MAP[
          contact?.contactRecordType
            .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ] === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
          ? mapCompany(contact?.companyContactMaps[0]?.company)
          : CONTACT_RECORD_TYPE_MAP[
              contact?.contactRecordType
                .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
            ] === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
          ? mapInsurerCompany(contact?.insurerContacts[0]?.insurer)
          : CONTACT_RECORD_TYPE_MAP[
              contact?.contactRecordType
                .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
            ] === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
          ? mapTpaCompany(contact?.tpaContacts[0]?.tpa)
          : mapBrokerCompany(contact?.brokerContacts[0]?.broker),
      companyLocation: mapCity(contact?.companyLocation),
      companyId:
        CONTACT_RECORD_TYPE_MAP[
          contact?.contactRecordType
            .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ] === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE
          ? contact?.companyContactMaps[0]?.company?.id
          : CONTACT_RECORD_TYPE_MAP[
              contact?.contactRecordType
                .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
            ] === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
          ? contact?.insurerContacts[0]?.insurer?.id
          : CONTACT_RECORD_TYPE_MAP[
              contact?.contactRecordType
                .lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
            ] === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
          ? contact?.tpaContacts[0]?.tpa?.id
          : contact?.brokerContacts[0]?.broker?.id,
      salesOpportunity: [],
      renewalOpportunity: [],
      policy: [],
      reportingTo: contact?.reportingTo
        ? {
            id: contact?.reportingTo?.id,
            firstName: contact?.reportingTo?.firstName,
            lastName: contact?.reportingTo?.lastName,
            displayName: contact?.reportingTo?.displayName,
          }
        : null,
    });

    return Array.isArray(contactOrContacts)
      ? contactOrContacts.map(transform)
      : transform(contactOrContacts);
  }

  /** Updates an existing qualification experience. */
  async updateQualificationExperience(
    id: number,
    qualificationExperienceData: UpdateQualificationExperienceDto
  ): Promise<QualificationExperience> {
    const existingQualification =
      await this.qualificationExperienceRepository.findOne({
        where: { id },
      });

    if (!existingQualification) {
      throw new NotFoundException(
        `QualificationExperience with ID ${id} not found`
      );
    }

    const partialData: any = { ...qualificationExperienceData };

    if (qualificationExperienceData.contact) {
      partialData.contact = { id: qualificationExperienceData.contact };
    }

    const mergedQualification = this.qualificationExperienceRepository.merge(
      existingQualification,
      partialData
    );

    return await this.qualificationExperienceRepository.save(
      mergedQualification
    );
  }

  /** Updates an existing professional experience. */
  async updateProfessionalExperience(
    id: number,
    professionalExperienceData: CreateProfessionalExperienceDto
  ): Promise<ProfessionalExperience> {
    const existingExperience =
      await this.professionalExperienceRepository.findOne({ where: { id } });

    if (!existingExperience) {
      throw new NotFoundException(
        `ProfessionalExperience with ID ${id} not found`
      );
    }

    const mergedExperience = this.professionalExperienceRepository.merge(
      existingExperience,
      professionalExperienceData
    );

    return await this.professionalExperienceRepository.save(mergedExperience);
  }

  /** Updates an existing contact detail. */
  async updateContactDetails(
    id: number,
    contactDetailsData: CreateContactDetailsDto
  ): Promise<ContactDetails> {
    const existingDetails = await this.contactDetailsRepository.findOne({
      where: { id },
    });

    if (!existingDetails) {
      throw new NotFoundException(`ContactDetails with ID ${id} not found`);
    }

    const mergedDetails = this.contactDetailsRepository.merge(
      existingDetails,
      contactDetailsData
    );

    return await this.contactDetailsRepository.save(mergedDetails);
  }

  /** Updates an existing contact document mapping details */
  async updateContactDocumentDetails(
    id: number,
    contactDocDetails: UpdateDocumentDto
  ): Promise<ContactDocMap> {
    const existingDetails = await this.contactDocumentMapRepository.findOne({
      where: { id },
    });

    if (!existingDetails) {
      throw new NotFoundException(`ContactDocMap with ID ${id} not found`);
    }

    const mergedDetails = this.contactDocumentMapRepository.merge(
      existingDetails,
      contactDocDetails
    );

    return await this.contactDocumentMapRepository.save(mergedDetails);
  }

  /** Gets the total number of unique companies based on contacts. */
  async getTotalCompanies(
    userQuery: any,
    searchString?: string,
    searchArray?: { searchBy: string; searchValue: string }[]
  ): Promise<number> {
    try {
      const { contactRecordTypeLid, ...filters } = userQuery;
      const contactQueryData = this.contactRepository.createQueryBuilder(
        DEFAULT_CONTACT_ENTITY_NAME.toLowerCase()
      );
      let searchOn: any = [];
      const contactRecordTypeLookup = await this.lookUpRepository.findOne({
        where: { id: contactRecordTypeLid },
      });
      const recordType =
        CONTACT_RECORD_TYPE_MAP[
          contactRecordTypeLookup.lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ];
      if (recordType === CONTACT_RECORD_TYPE_MAP.COMPANY_CONTACT_RECORD_TYPE) {
        contactQueryData
          .leftJoin("contact.companyContactMaps", "ccm")
          .leftJoin("ccm.company", "company")
          .leftJoin("contact.communicationDetails", "cd")
          .leftJoin("contact.status", "status")
          .leftJoin("contact.tag", "tag")
          .select("COUNT(DISTINCT company.id)", "count");
        searchOn = [
          "first_name",
          "middle_name",
          "last_name",
          "company.company_name",
          "cd.communication_details",
          "status.value",
          "tag.value",
        ];
      } else if (
        recordType === CONTACT_RECORD_TYPE_MAP.INSURER_CONTACT_RECORD_TYPE
      ) {
        contactQueryData
          .leftJoin("contact.insurerContacts", "ic")
          .leftJoin("ic.insurer", "insurer")
          .leftJoin("contact.communicationDetails", "cd")
          .leftJoin("contact.status", "status")
          .leftJoin("contact.tag", "tag")
          .select("COUNT(DISTINCT insurer.id)", "count");
        searchOn = [
          "first_name",
          "middle_name",
          "last_name",
          "insurer.name",
          "cd.communication_details",
          "status.value",
          "tag.value",
        ];
      } else if (
        recordType === CONTACT_RECORD_TYPE_MAP.TPA_CONTACT_RECORD_TYPE
      ) {
        contactQueryData
          .leftJoin("contact.tpaContacts", "tc")
          .leftJoin("tc.tpa", "tpa")
          .leftJoin("contact.communicationDetails", "cd")
          .leftJoin("contact.status", "status")
          .leftJoin("contact.tag", "tag")
          .select("COUNT(DISTINCT tpa.id)", "count");
        searchOn = [
          "first_name",
          "middle_name",
          "last_name",
          "tpa.name",
          "cd.communication_details",
          "status.value",
          "tag.value",
        ];
      } else if (
        recordType === CONTACT_RECORD_TYPE_MAP.BROKER_CONTACT_RECORD_TYPE
      ) {
        contactQueryData
          .leftJoin("contact.brokerContacts", "bc")
          .leftJoin("bc.broker", "broker")
          .leftJoin("contact.communicationDetails", "cd")
          .leftJoin("contact.status", "status")
          .leftJoin("contact.tag", "tag")
          .select("COUNT(DISTINCT broker.id)", "count");
        searchOn = [
          "first_name",
          "middle_name",
          "last_name",
          "broker.broker_name",
          "cd.communication_details",
          "status.value",
          "tag.value",
        ];
      } else {
        throw new Error("Unsupported contactRecordTypeLid");
      }

      // allContactIds is already the scoped, filtered and searched contact set
      // from the listing query, so no createdBy narrowing is applied here —
      // doing so made the KPI 0 whenever the logged-in user created none of them.
      contactQueryData.where("contact.id IN (:...allContactIds)", {
        allContactIds: filters.allContactIds,
      });
      for (const search of searchArray || []) {
        const key = search.searchBy;
        const value = `%${search.searchValue}%`;

        if (key === "department") {
          contactQueryData.andWhere(
            "LOWER(contact.department) LIKE LOWER(:deptName)",
            {
              deptName: value,
            }
          );
        } else if (key === "designation") {
          contactQueryData.andWhere(
            "LOWER(contact.designation) LIKE LOWER(:designationName)",
            {
              designationName: value,
            }
          );
        } else if (key === "owner.firstName") {
          contactQueryData.leftJoin("contact.owner", "owner");
          contactQueryData.andWhere(
            "LOWER(owner.firstName) LIKE LOWER(:ownerName)",
            {
              ownerName: value,
            }
          );
        } else if (key === "companyContactMaps.company.companyName") {
          contactQueryData.andWhere(
            "LOWER(company.companyName) LIKE LOWER(:companyName)",
            {
              companyName: value,
            }
          );
        } else if (key === "insurerContacts.insurer.insurerName") {
          contactQueryData.andWhere(
            "LOWER(insurer.insurerName) LIKE LOWER(:insurerName)",
            {
              insurerName: value,
            }
          );
        } else if (key === "tpaContacts.tpa.tpaName") {
          contactQueryData.andWhere("LOWER(tpa.tpaName) LIKE LOWER(:tpaName)", {
            tpaName: value,
          });
        } else if (key === "brokerContacts.broker.brokerName") {
          contactQueryData.andWhere(
            "LOWER(broker.brokerName) LIKE LOWER(:brokerName)",
            {
              brokerName: value,
            }
          );
        } else if (
          key ===
          "companyContactMaps.company.companyAddresses.address.cityId.name"
        ) {
          contactQueryData.leftJoin(
            "company.companyAddresses",
            "companyAddresses"
          );
          contactQueryData.leftJoin("companyAddresses.address", "address");
          contactQueryData.leftJoin("address.cityId", "cityId");
          contactQueryData.andWhere(
            "LOWER(cityId.name) LIKE LOWER(:cityName)",
            {
              cityName: value,
            }
          );
        } else if (
          key === "insurerContacts.insurer.insurerAddresses.address.cityId.name"
        ) {
          contactQueryData.leftJoin(
            "insurer.insurerAddresses",
            "insurerAddresses"
          );
          contactQueryData.leftJoin("insurerAddresses.address", "address");
          contactQueryData.leftJoin("address.cityId", "cityId");
          contactQueryData.andWhere(
            "LOWER(cityId.name) LIKE LOWER(:cityName)",
            {
              cityName: value,
            }
          );
        } else if (key === "tpaContacts.tpa.tpaAddresses.address.cityId.name") {
          contactQueryData.leftJoin("tpa.tpaAddresses", "tpaAddresses");
          contactQueryData.leftJoin("tpaAddresses.address", "address");
          contactQueryData.leftJoin("address.cityId", "cityId");
          contactQueryData.andWhere(
            "LOWER(cityId.name) LIKE LOWER(:cityName)",
            {
              cityName: value,
            }
          );
        } else if (
          key === "brokerContacts.broker.brokerAddresses.address.cityId.name"
        ) {
          contactQueryData.leftJoin(
            "broker.brokerAddresses",
            "brokerAddresses"
          );
          contactQueryData.leftJoin("brokerAddresses.address", "address");
          contactQueryData.leftJoin("address.cityId", "cityId");
          contactQueryData.andWhere(
            "LOWER(cityId.name) LIKE LOWER(:cityName)",
            {
              cityName: value,
            }
          );
        }
      }
      if (
        searchString?.trim() &&
        Array.isArray(searchOn) &&
        searchOn.length > 0
      ) {
        const searchTerms = searchString.trim().split(/\s+/);
        const searchConditions: string[] = [];

        // Check if all contact name fields are present
        const hasFullNameFields =
          searchOn.includes("first_name") &&
          searchOn.includes("middle_name") &&
          searchOn.includes("last_name");

        // Enhanced full name search logic
        if (hasFullNameFields) {
          if (searchTerms.length === 2) {
            const [first, second] = searchTerms;
            contactQueryData.setParameter("firstName_twoWords", `%${first}%`);
            contactQueryData.setParameter(
              "middleOrLastName_twoWords",
              `%${second}%`
            );
            searchConditions.push(`(
              contact.first_name ILIKE :firstName_twoWords AND (
              contact.middle_name ILIKE :middleOrLastName_twoWords OR
              contact.last_name ILIKE :middleOrLastName_twoWords
              )
            )`);

            // Optional: reverse order
            contactQueryData.setParameter(
              "lastName_twoWords_alt",
              `%${first}%`
            );
            contactQueryData.setParameter(
              "firstName_twoWords_alt",
              `%${second}%`
            );
            searchConditions.push(`(
              contact.last_name ILIKE :lastName_twoWords_alt AND 
              contact.first_name ILIKE :firstName_twoWords_alt
            )`);
          } else if (searchTerms.length === 3) {
            const [first, middle, last] = searchTerms;
            contactQueryData.setParameter("firstName_threeWords", `%${first}%`);
            contactQueryData.setParameter(
              "middleName_threeWords",
              `%${middle}%`
            );
            contactQueryData.setParameter("lastName_threeWords", `%${last}%`);
            searchConditions.push(`(
              contact.first_name ILIKE :firstName_threeWords AND 
              contact.middle_name ILIKE :middleName_threeWords AND 
              contact.last_name ILIKE :lastName_threeWords
            )`);
          }
        }
        // Field-based ILIKE conditions
        const genericSearchConditions = searchOn.map(
          (field: string, index: number) => {
            let alias: string, column: string;

            if (field.includes(".")) {
              const parts = field.split(".");
              column = parts.pop()!;
              alias = parts.join("_");
            } else {
              alias = "contact";
              column = field;
            }

            const paramKey = `searchParam_${index}`;
            contactQueryData.setParameter(paramKey, `%${searchString}%`);
            return `${alias}.${column} ILIKE :${paramKey}`;
          }
        );

        const allConditions = [...searchConditions, ...genericSearchConditions];

        if (allConditions.length > 0) {
          contactQueryData.andWhere(`(${allConditions.join(" OR ")})`);
        }
      }
      const result = await contactQueryData.getRawOne();
      const uniqueParentCount = parseInt(result.count, 10);
      return uniqueParentCount;
    } catch (error) {
      return DEFAULT_TOTAL_KPI_COUNT;
    }
  }

  /** Gets the total number of contacts based on filters. */
  async getTotalContacts(
    whereCondition: any,
    contactSearchObject: string[],
    searchArray?: { searchBy: string; searchValue: string }[],
    searchBy?: any
  ): Promise<number> {
    try {
      const contactRecordTypeLookup = await this.lookUpRepository.findOne({
        where: { id: whereCondition.contactRecordTypeLid },
      });
      const recordType =
        CONTACT_RECORD_TYPE_MAP[
          contactRecordTypeLookup.lookUpKey as keyof typeof CONTACT_RECORD_TYPE_MAP
        ];

      const relations = await this.getContactRelations(recordType);
      const { count } = await this.entityService.fetchEntityList(
        DEFAULT_CONTACT_ENTITY_NAME,
        DEFAULT_PAGE,
        DEFAULT_PAGE,
        undefined,
        relations,
        whereCondition,
        undefined,
        searchArray,
        undefined,
        searchBy,
        contactSearchObject
      );
      return count;
    } catch (error) {
      return DEFAULT_TOTAL_KPI_COUNT;
    }
  }
  /** Creates an document details associated with contact*/
  async createContactDocumentMapping(
    docObject: ContactDocumentMapDto
  ): Promise<ContactDocMap> {
    try {
      const contactDocMap = this.contactDocumentMapRepository.create(docObject);
      const savedContactDocMap = await this.contactDocumentMapRepository.save(
        contactDocMap
      );
      return savedContactDocMap;
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.contactDocumentMappingCreationFailed
        )
      );
    }
  }

  /** Creates an contact company details mapping*/
  async createCompanyContactMapping(
    docObject: CompanyContactMapDto
  ): Promise<CompanyContactMap> {
    try {
      const contactCompanyMap =
        this.companyContactMapRepository.create(docObject);
      return await this.companyContactMapRepository.save(contactCompanyMap);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.companyContactMappingCreationFailed
        )
      );
    }
  }

  /** Remove an contact company details mapping*/
  async delinkCompanyContactMapping(
    docObject: CompanyContactMapDto
  ): Promise<void> {
    try {
      await this.companyContactMapRepository.delete(docObject);
    } catch (error) {
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.badRequest,
          errorMessages.companyContactMappingDeletionFailed
        )
      );
    }
  }

  /** Generic method to check for duplicate communication details */
  async getCommunicationDetailsCheck(
    useSearchQuery: any,
    errorMessage: string
  ): Promise<ContactCommunicationDetails[]> {
    try {
      const communicationDetails =
        await this.contactCommunicationDetailsRepository.find({
          where: useSearchQuery,
          relations: ["contact"],
        });

      return communicationDetails;
    } catch (error) {
      throw new BadRequestException(errorMessage);
    }
  }

  /** Public method to check duplicate phone numbers */
  async getCommunicationPhoneCheck(
    useSearchQuery: any
  ): Promise<ContactCommunicationDetails[]> {
    try {
      delete useSearchQuery.contactName;
      let communicationDetails = await this.getCommunicationDetailsCheck(
        useSearchQuery,
        errorMessages.communicationPhoneError
      );
      //If the given phone number is already active for a contact in the company, return an error;
      // otherwise, proceed to create the contact with the provided number.
      if (communicationDetails.length) {
        const status = await this.lookUpRepository.findOne({
          where: { lookUpKey: DEFAULT_CONTACT_STATUS_ACTIVE_KEY },
        });
        if (status?.id) {
          communicationDetails = communicationDetails.filter(
            (communication) => communication?.contact?.statusLid === status?.id
          );
        }
      }
      return communicationDetails;
    } catch (error) {
      throw new BadRequestException(errorMessages.communicationPhoneError);
    }
  }

  /** Public method to check duplicate email addresses */
  async getCommunicationEmailCheck(
    useSearchQuery: any
  ): Promise<ContactCommunicationDetails[]> {
    return this.getCommunicationDetailsCheck(
      useSearchQuery,
      errorMessages.communicationEmailError
    );
  }

  async fetchConatctById(id: number): Promise<number | null> {
    const contact = await this.contactRepository.findOne({
      where: { id },
    });
    return contact?.id ?? null;
  }

  async getEntityTableMapIds(
    entity: string,
    select: string,
    whereCondition: any
  ): Promise<number[]> {
    try {
      const data = await this.entityService.getEntityMapByIds(
        entity,
        select,
        whereCondition
      );
      return data;
    } catch (error) {
      return [];
    }
  }

  async deleteEntityTableMapIds(
    entity: string,
    deleteIds: number[],
    select: string,
    deletionType: string
  ): Promise<void> {
    try {
      await this.entityService.deleteEntityMapByIds(
        entity,
        deleteIds,
        select,
        deletionType
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async fetchContactList(
    page: number,
    limit: number,
    search: string,
    contactRecordTypeLid: number,
    entityIds: number[],
    userId: number
  ): Promise<{ data: Insurer[]; total: number }> {
    try {
      const status = await this.lookUpRepository.findOne({
        where: { lookUpKey: DEFAULT_CONTACT_STATUS_ACTIVE_KEY },
      });

      const { data, count } = await this.scopeService.validateMasterScope(
        {
          entity: "contact",
          page,
          limit,
          sort: [{ field: "firstName", order: "ASC" }],
          relations: undefined,
          where: {
            contactRecordTypeLid: contactRecordTypeLid,
            statusLid: status?.id ?? undefined,
          },
          select: ["id", "firstName", "lastName", "displayName"],
          searchArray: [],
          userFilter: undefined,
          searchString: search,
          searchOn: ["firstName", "lastName"],
        },
        userId as number,
        "contact"
      );
      let finalData = data;
      if (entityIds && entityIds.length > 0) {
        const existingContactIds = new Set(data.map((r) => r.id));
        const missingContactIds = entityIds.filter(
          (id) => !existingContactIds.has(id)
        );
        if (missingContactIds.length > 0) {
          const additional = await this.contactRepository.find({
            where: { id: In(missingContactIds) },
            select: ["id", "firstName", "lastName", "displayName"],
          });
          finalData = finalData.concat(additional);
        }
      }
      return { data: finalData, total: count };
    } catch (error) {
      throw new BadRequestException(
        `Error fetching contact list: ${error.message}`
      );
    }
  }
}

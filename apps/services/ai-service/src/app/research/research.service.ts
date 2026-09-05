import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PerplexityService } from "../perplexity/perplexity.service";
import { companyTypeMap, industrySegmentMap } from "./constants/company";
import {
  CompanyResearchResponse,
  CompanyBasicInfo,
  FinancialInfo,
  CompanyLocation,
  ServicesAndProducts,
  IndustryIntelligence,
  PotentialOpportunity,
  LookUpEntity,
} from "./interfaces/company.inteface";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import axios from "axios";
import type { Request } from "express";
import fuzzball from "fuzzball";
import { matchLocationDropdowns } from "../common/utils/match-location-dropdowns";

@Injectable()
export class ResearchService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly perplexityService: PerplexityService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AI_SERVICE);
  }

  async fetchCompanyData(
    query: string,
    dropdownValues: {
      industrySegments: LookUpEntity[];
      companyTypes: LookUpEntity[];
      addressTypes: LookUpEntity[];
    },
    req: Request
  ): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ResearchService",
        method: "fetchCompanyData",
        payload: { query, dropdownValues },
        messageData: "method invoked",
      }),
    });

    const industrySegmentOptions = dropdownValues?.industrySegments
      ?.map((segment) => segment.lookUpValue);
    const companyTypeOptions = dropdownValues?.companyTypes
      ?.map((type) => type.lookUpValue);
    const addressTypeOptions = dropdownValues?.addressTypes
      ?.map((type) => type.lookUpValue);

    const prompts = [
      {
        prompt: `Provide an overview of the company, including its official name, display name, industry segment, company type, number of employees should be in number, date of incorporation(DD/MM/YYYY) or null, registration number, website, and brief history.
         {
          companyName :  string or null,
          displayName :  string or null,
          industrySegment : select and return only one of the following options that matches the value: [${industrySegmentOptions?.join(", ")}], or return null if no match is found,
          companyType : select and return one of the following options that matches the value: [${companyTypeOptions?.join(", ")}], or return null if no match is found,
          noOfEmployees :  number,
          dateOfIncorporation :  string in the format YYYY-MM-DD or null,
          registrationNumber :  string or null,
          website :  string or null,
          breifHistory :  string or null max 500 characters
          }`,
        keys: [
          "companyName",
          "displayName",
          "industrySegment",
          "companyType",
          "noOfEmployees",
          "dateOfIncorporation",
          "registrationNumber",
          "website",
          "breifHistory",
        ],
        subject: "companyBasicInfo",
      },
      {
        prompt: `Share the latest financial details, including PAN, TAN, currency
        {
          financialInfo: {
          pan: string or null,
          tan: string or null,
          currency: string or null
          }
        }`,
        keys: ["financialInfo"],
        subject: "financialData",
      },
      {
        prompt: `List company locations, and major office branches maximum 2 locarions. Each location must be an object with:
        {
          addressType: select and return one of the following options that matches the value: [${addressTypeOptions.join(", ")}], or return null if no match is found,
          address1: string or null,
          address2: string or null,
          area: string or null,
          city: string or null,
          state: string or null,
          country: string or null,
          pinCode: string or null,
          phoneNumber: string or null,
          email: string or null,
          alternatePhoneNumber: string or null,
          supportNumber: string or null,
        }
        If not available, return an empty array[].`,
        keys: [
          "addressType",
          "address1",
          "address2",
          "area",
          "city",
          "state",
          "country",
          "pinCode",
          "phoneNumber",
          "email",
          "alternatePhoneNumber",
          "supportNumber"
        ],
        subject: "companyLocations",
      },
      {
        prompt: `Provide details about the services and products the company offers and limit the complete(services + products) response to 500 characters.
        {
          services: a string containing the multiple services by a comma(,) separated,
          products: a string containing the multiple products by a comma(,) separated,
          keyCustomers: a string containing the multiple key customers by a comma(,) separated max 500 characters
        }`,
        keys: ["services", "products", "keyCustomers"],
        subject: "servicesOrProducts",
      }
    ];

    try {
      const promptForHandlingUnknown = `If the data is not available or the query is not relevant, respond with an empty array or null.
        Never return anything like "I don't know" or "not available" or "null" or "undefined" or "unknown".
        Always respond in JSON format without missing any specefied keys.`;
      const responses = await Promise.allSettled(
        prompts.map(({ prompt, keys, subject }) =>
          this.perplexityService.interactWithPerplexity(
            query,
            `${prompt} Respond strictly in JSON format with keys. ${promptForHandlingUnknown} ${keys.join(
              ", "
            )}.`,
            subject
          )
        )
      );

      const validResponses = responses.map((result, index) => {
        if (result.status === "rejected") {
          this.logger.error(
            `Failed to fetch data for ${prompts[index].subject}:`,
            result.reason
          );
          return {
            subject: prompts[index].subject,
            data: [],
          };
        }
        return result.value;
      });

      // After processing the response, map back to the original object structure
      const mapBackToOriginal = (value: string, options: LookUpEntity[]) => {
        const found = options.find((option) => option.lookUpValue === value);
        return found ? { label: found.lookUpValue, value: found.id } : null;
      };

      const transformedData = validResponses.reduce(
        (acc: Record<string, any>, response) => {
          const { subject, data } = response;

          if (subject === "companyBasicInfo" && data.length > 0) {
            const info = data[0];
            if (
              !info.industrySegment ||
              !Object.keys(industrySegmentMap).includes(info.industrySegment)
            ) {
              info.industrySegment =  mapBackToOriginal(info.industrySegment, dropdownValues?.industrySegments ?? []);
            }
            if (
              !info.companyType ||
              !Object.keys(companyTypeMap).includes(info.companyType)
            ) {
              info.companyType =  mapBackToOriginal(info.companyType, dropdownValues?.companyTypes ?? []);
            }
            acc[subject] = info
          } else if (subject === "financialData") {
            acc[subject] = data[0];
          } else if (subject === "companyLocations") {
            acc[subject] = data;
          } else if (subject === "servicesOrProducts") {
            acc[subject] = data[0];
          }
          return acc;
        },
        {} as Record<string, any>
      );

      // Validate and normalize the transformedData before returning
      const normalizeCompanyResearchResponse = async (
        data: Record<string, any>,
        request: Request
      ): Promise<Omit<CompanyResearchResponse, "industryIntelligence" | "potentialOpportunities">> => {
        // Helper to convert empty string to null
        const emptyToNull = (val: any) => (val === "" ? null : val);

        const companyBasicInfo: CompanyBasicInfo = {
          companyName: emptyToNull(data?.companyBasicInfo?.companyName ?? null),
          displayName: emptyToNull(data?.companyBasicInfo?.displayName ?? null),
          industrySegment: emptyToNull(
            data?.companyBasicInfo?.industrySegment ?? null
          ),
          companyType: emptyToNull(data?.companyBasicInfo?.companyType ?? null),
          noOfEmployees:
            data?.companyBasicInfo?.noOfEmployees === ""
              ? null
              : data?.companyBasicInfo?.noOfEmployees ?? null,
          dateOfIncorporation: emptyToNull(
            data?.companyBasicInfo?.dateOfIncorporation ?? null
          ),
          registrationNumber: emptyToNull(
            data?.companyBasicInfo?.registrationNumber ?? null
          ),
          website: emptyToNull(data?.companyBasicInfo?.website ?? null),
          breifHistory: emptyToNull(
            data?.companyBasicInfo?.breifHistory ?? null
          ),
        };

        const financialInfo: FinancialInfo = {
          financialInfo: {
            pan: emptyToNull(data?.financialData?.financialInfo?.pan ?? null),
            tan: emptyToNull(data?.financialData?.financialInfo?.tan ?? null),
            currency: emptyToNull(
              data?.financialData?.financialInfo?.currency ?? null
            )
          },
        };

        const companyLocations: CompanyLocation[] = Array.isArray(
          data?.companyLocations
        )
          ? await Promise.all(
              data?.companyLocations.map(async (loc: any) => {
                const { country, state, city } = await matchLocationDropdowns(
                  { country: loc?.country, state: loc?.state, city: loc?.city },
                  request
                );
                return {
                  addressType: mapBackToOriginal(loc?.addressType, dropdownValues.addressTypes),
                  address1: emptyToNull(loc?.address1 ?? null),
                  address2: emptyToNull(loc?.address2 ?? null),
                  area: emptyToNull(loc?.area ?? null),
                  city: city,
                  state: state,
                  country: country,
                  pinCode: emptyToNull(loc?.pinCode ?? null),
                  phoneNumber: emptyToNull(loc?.phoneNumber ?? null),
                  email: emptyToNull(loc?.email ?? null),
                  alternatePhoneNumber: emptyToNull(loc?.alternatePhoneNumber ?? null),
                  supportNumber: emptyToNull(loc?.supportNumber ?? null),
                };
              })
          )
          : [];

        const servicesAndProducts: ServicesAndProducts = {
          services: emptyToNull(data?.servicesOrProducts?.services ?? null),
          products: emptyToNull(data?.servicesOrProducts?.products ?? null),
          keyCustomers: emptyToNull(data?.servicesOrProducts?.keyCustomers ?? null),
        };


        return {
          companyBasicInfo: companyBasicInfo,
          financialInfo: financialInfo,
          companyLocations: companyLocations,
          servicesAndProducts: servicesAndProducts,
        };
      };

      const validatedData = await normalizeCompanyResearchResponse(transformedData, req);

      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ResearchService",
          method: "fetchCompanyData",
          messageData: error,
        }),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async fetchIndustryIntelligence(
    query: string,
    industrySegment?: string
  ): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ResearchService",
        method: "fetchIndustryIntelligence",
        payload: { query, industrySegment },
        messageData: "method invoked",
      }),
    });

    const prompts = [
      {
        prompt: `Provide a comprehensive market overview for the company, Strictly JSON object including:
        {
          marketOverview: string or null,
          keyGrowthDrivers: string or null,
          competitiveLandscape: string or null,
          technologyTrends: string or null,
          insurableRisksHighPriority: string or null,
          insurableRisksEmerging: string or null,
          riskForecast1to2Years: string or null,
          riskForecast3to5Years: string or null,
          riskMitigationRecommendations: string or null,
          regulatoryEnvironment: string or null,
          riskFactors: string or null,
          futureOutlook: string or null
        }`,
        keys: [
          "marketOverview",
          "keyGrowthDrivers",
          "competitiveLandscape",
          "technologyTrends",
          "insurableRisksHighPriority",
          "insurableRisksEmerging",
          "riskForecast1to2Years",
          "riskForecast3to5Years",
          "riskMitigationRecommendations",
          "regulatoryEnvironment",
          "riskFactors",
          "futureOutlook",
        ],
        subject: "industryIntelligence",
      },
      {
        prompt: `List all potential opportunities for the company based on its industry segment. For each opportunity, provide Array of JSON object, each object should have fields like below or similar:
        {
          opportunityType: string or null,
          description: string or null,
          recommendedInsurances: array of strings,
          valueProposition: array of strings
        }
        Respond strictly in JSON format as an array of objects.`,
        keys: [
          "opportunityType",
          "description",
          "recommendedInsurances",
          "valueProposition",
        ],
        subject: "potentialOpportunities",
      },
    ];

    try {
      const promptForHandlingUnknown = `If the data is not available or the query is not relevant, respond with an empty array or null.
        Never return anything like "I don't know" or "not available" or "null" or "undefined" or "unknown".
        Always respond in JSON format without missing any specified keys. Make sure the response is in specified format.`;
      const responses = await Promise.allSettled(
        prompts.map(({ prompt, keys, subject }) =>
          this.perplexityService.interactWithPerplexity(
            query,
            `${prompt} ${industrySegment ? `industry Segment is ${industrySegment}` : ""} Respond strictly in JSON format with keys. ${promptForHandlingUnknown} ${keys.join(", ")}.`,
            subject
          )
        )
      );

      const validResponses = responses.map((result, index) => {
        if (result.status === "rejected") {
          this.logger.error(
            `Failed to fetch data for ${prompts[index].subject}:`,
            result.reason
          );
          return {
            subject: prompts[index].subject,
            data: [],
          };
        }
        console.log('Result from Perplexity interaction after cleaning:', result.value.data);
        return result.value;
      });

      const transformedData = validResponses.reduce(
        (acc: Record<string, any>, response) => {
          const { subject, data } = response;
          acc[subject] = data;
          return acc;
        },
        {} as Record<string, any>
      );

      const normalizeIndustryIntelligenceResponse = (
        data: Record<string, any>
      ): {
        industryIntelligence: IndustryIntelligence;
        potentialOpportunities: PotentialOpportunity[];
      } => {
        const emptyToNull = (val: any) => (val === "" ? null : val);

        const isMarketIntelligenceArray = Array.isArray(data?.industryIntelligence);
        const industryIntelligence: IndustryIntelligence = {
          marketOverview: emptyToNull(
           isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.marketOverview 
              : data?.industryIntelligence?.marketOverview 
          ),
          keyGrowthDrivers: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.keyGrowthDrivers
              : data?.industryIntelligence?.keyGrowthDrivers
          ),
          competitiveLandscape: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.competitiveLandscape
              : data?.industryIntelligence?.competitiveLandscape
          ),
          technologyTrends: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.technologyTrends
              : data?.industryIntelligence?.technologyTrends
          ),
          insurableRisksHighPriority: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.insurableRisksHighPriority
              : data?.industryIntelligence?.insurableRisksHighPriority
          ),
          insurableRisksEmerging: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.insurableRisksEmerging
              : data?.industryIntelligence?.insurableRisksEmergings
          ),
          riskForecast1to2Years: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.riskForecast1to2Years
              : data?.industryIntelligence?.riskForecast1to2Years
          ),
          riskForecast3to5Years: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.riskForecast3to5Years
              : data?.industryIntelligence?.riskForecast3to5Years
          ),
          riskMitigationRecommendations: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.riskMitigationRecommendations
              : data?.industryIntelligence?.riskMitigationRecommendations
          ),
          regulatoryEnvironment: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.regulatoryEnvironment
              : data?.industryIntelligence?.regulatoryEnvironment
          ),
          riskFactors: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.riskFactors
              : data?.industryIntelligence?.riskFactors
          ),
          futureOutlook: emptyToNull(
            isMarketIntelligenceArray
              ? data?.industryIntelligence[0]?.futureOutlook
              : data?.industryIntelligence?.futureOutlooks
          ),
        };
        const potentialOpportunities: PotentialOpportunity[] = Array.isArray(
          data?.potentialOpportunities
        )
          ? data?.potentialOpportunities.map((op: any) => ({
              opportunityType: emptyToNull(op?.opportunityType ?? null),
              description: emptyToNull(op?.description ?? null),
              recommendedInsurances: Array.isArray(op?.recommendedInsurances)
                ? op.recommendedInsurances.map((v: any) => emptyToNull(v))
                : [],
              valueProposition: Array.isArray(op?.valueProposition)
                ? op.valueProposition.map((v: any) => emptyToNull(v))
                : [],
            }))
          : [];

        return {
          industryIntelligence,
          potentialOpportunities,
        };
      };

      const validatedData = normalizeIndustryIntelligenceResponse(transformedData);

      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ResearchService",
          method: "fetchIndustryIntelligence",
          messageData: error,
        }),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async fetchDropdownValues(url: string, authToken: string): Promise<LookUpEntity[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: authToken,
        },
      });
      return response.data?.data || [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ResearchService",
          method: "fetchDropdownValues",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException("Failed to fetch dropdown values");
    }
  }
}

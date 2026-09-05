import { Step } from "../../../components/NestedStepper/config.js";
import * as GroupConfig from "./config";
import * as NonGroupConfig from "./nonGroupConfig";

type BreadcrumbResolver = typeof GroupConfig.endorsementDetailsBreadcrumbConfig;

export type CreationType = "endorsement" | "inception";

export interface CreationLabels {
  singular: string;
  singularLower: string;
}

export interface CreationFlowConfig {
  type: CreationType;
  labels: CreationLabels;
  stepperConfig: Step[];
  breadcrumb: BreadcrumbResolver;
  companyType: string;
}

const ENDORSEMENT_LABELS: CreationLabels = {
  singular: "Endorsement",
  singularLower: "endorsement",
};

const buildCreationFlowConfigMap = (
  configModule: typeof GroupConfig
): Record<CreationType, CreationFlowConfig> => ({
  endorsement: {
    type: "endorsement",
    labels: ENDORSEMENT_LABELS,
    stepperConfig: configModule.endorsementProcessConfig,
    breadcrumb: configModule.endorsementDetailsBreadcrumbConfig,
    companyType: "endorsement",
  },
  inception: {
    type: "inception",
    labels: configModule.INCEPTION_LABELS,
    stepperConfig: configModule.inceptionProcessConfig,
    breadcrumb: configModule.inceptionDetailsBreadcrumbConfig,
    companyType: "inception",
  },
});

const groupCreationFlowConfigMap = buildCreationFlowConfigMap(GroupConfig);
const nonGroupCreationFlowConfigMap = buildCreationFlowConfigMap(NonGroupConfig);

export const CREATION_TYPES = Object.keys(
  groupCreationFlowConfigMap
) as CreationType[];

export const DEFAULT_CREATION_TYPE: CreationType = "endorsement";

export const isCreationType = (value?: string): value is CreationType =>
  value === "endorsement" || value === "inception";

export const resolveCreationType = (value?: string): CreationType =>
  isCreationType(value) ? value : DEFAULT_CREATION_TYPE;

export const getCreationFlowConfig = (
  value?: string,
  isGroupPolicyType = true
): CreationFlowConfig =>
  (isGroupPolicyType ? groupCreationFlowConfigMap : nonGroupCreationFlowConfigMap)[
    resolveCreationType(value)
  ];

const buildCreationStepConfigResolvers = (
  configModule: typeof GroupConfig
) => ({
  endorsement: {
    create: configModule.CreateEndorsementConfig,
    sendToInsurer: configModule.SendEndorsementToInsurerConfig,
    receiveAcknowledgement: configModule.ReceiveAcknowledgementFromInsurerConfig,
    clientConfirmation: configModule.ClientConfirmationConfig,
    tpaUpload: configModule.TpaIdUploadConfig,
  },
  inception: {
    create: configModule.CreateInceptionConfig,
    sendToInsurer: configModule.SendInceptionToInsurerConfig,
    receiveAcknowledgement:
      configModule.ReceiveAcknowledgementFromInsurerInceptionConfig,
    clientConfirmation: configModule.InceptionClientConfirmationConfig,
    tpaUpload: configModule.TpaIdUploadInceptionConfig,
  },
});

const groupCreationStepConfigResolvers = buildCreationStepConfigResolvers(GroupConfig);
const nonGroupCreationStepConfigResolvers =
  buildCreationStepConfigResolvers(NonGroupConfig);

type CreationStepResolvers = typeof groupCreationStepConfigResolvers;

export const getCreationStepConfigResolvers = (
  creationType: CreationType,
  isGroupPolicyType = true
): CreationStepResolvers[CreationType] =>
  (isGroupPolicyType
    ? groupCreationStepConfigResolvers
    : nonGroupCreationStepConfigResolvers)[creationType];

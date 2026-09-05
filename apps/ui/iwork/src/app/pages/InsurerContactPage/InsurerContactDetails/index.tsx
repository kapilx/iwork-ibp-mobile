import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ButtonContainer,
  InsurerContactDetailsContainer,
  InsurerContactDetailsNoDataText,
} from "./styles";
import { EDIT, INSURER_CONTACT_DETAILS } from "../../../constants";
import {
  Breadcrumbs,
  contactDetailsConfig,
  contactSummaryConfig,
  entityTypeLabels,
} from "./insurerDetailsConfig";
import { EntityType } from "../../../constants/enum";
import {
  NO_DATA_AVAILABLE,
  NOT_AVAILABLE,
  useApi,
  endPoints,
  CommonDetailsSection,
  Button,
  CommonBreadcrumb,
  SummaryCard,
  selectHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import editIcon from "../../../assets/svgs/edit-icon.svg";
import { OverviewCardBackground } from "../../CompanyPage/CompanyDetails/styles";
import AddressSection from "../../../components/AddressSection";
import { LookUpValues } from "../../../constants/lookupValues";
import { useSelector } from "react-redux";

const entityTypeToEditContactFeatureKey: Record<EntityType, FeatureKey> = {
  [EntityType.INSURER]: FeatureKey.EDIT_INSURER_CONTACT,
  [EntityType.TPA]: FeatureKey.EDIT_TPA_CONTACT,
  [EntityType.BROKER]: FeatureKey.EDIT_BROKER_CONTACT,
};

const InsurerContactDetails = () => {
  const { entityType } = useParams<{ entityType: EntityType }>();
  const resolvedLookupIds = useSelector(
    (state: any) => state.user.resolvedLookupIds
  );

  const fallbackId = resolvedLookupIds?.[LookUpValues.INSURER_CONTACT];

  const contactRecordTypeLid =
    entityType &&
    resolvedLookupIds?.[
      LookUpValues[
        `${entityType.toUpperCase()}_CONTACT` as keyof typeof LookUpValues
      ]
    ]
      ? resolvedLookupIds[
          LookUpValues[
            `${entityType.toUpperCase()}_CONTACT` as keyof typeof LookUpValues
          ]
        ]
      : fallbackId;

  const insurerDetailsConfig = contactDetailsConfig(
    contactRecordTypeLid,
    resolvedLookupIds
  );
  const summaryConfig = contactSummaryConfig(
    contactRecordTypeLid,
    resolvedLookupIds
  );
  const navigate = useNavigate();
  const [insurerContactData, setinsurerContactData] = useState<T | null>(null);
  const { data, doFetch, error } = useApi();
  const { id: contactId } = useParams<{ id: string }>();

  const editContactFeatureKey =
    entityType && entityTypeToEditContactFeatureKey[entityType];

  const canUpdateContact = useSelector((state: any) =>
    editContactFeatureKey
      ? selectHasPermission(editContactFeatureKey)(state)
      : false
  );

  useEffect(() => {
    if (contactId) {
      doFetch(endPoints.contactById(Number(contactId)));
    }
  }, [contactId]);

  useEffect(() => {
    if (data) {
      setinsurerContactData(data?.data as T);
    }
  }, [data]);

  useEffect(() => {
    if (error?.status === 403) {
      navigate("/unauthorized", { replace: true });
    }
  }, [error, navigate]);

  const handleUpdateContact = () => {
    if (contactId) {
      navigate(`/${entityType}/contact/${contactId}/edit`);
    }
  };

  if (!insurerContactData) {
    return (
      <InsurerContactDetailsContainer>
        <InsurerContactDetailsNoDataText variant="h6">
          {NO_DATA_AVAILABLE}
        </InsurerContactDetailsNoDataText>
      </InsurerContactDetailsContainer>
    );
  }
  const dynamicButtonText = entityType
    ? entityTypeLabels[entityType].title
    : INSURER_CONTACT_DETAILS;

  const getPrimaryEmail = (communicationDetails: any[]) => {
    const primaryEmail = communicationDetails?.find(
      (detail) => detail.communicationType === "email"
    );
    return primaryEmail ? primaryEmail.communicationDetails : NOT_AVAILABLE;
  };

  const getPrimaryPhone = (communicationDetails: any[]) => {
    const primaryPhone = communicationDetails?.find(
      (detail) => detail.communicationType === "phone"
    );
    return primaryPhone ? primaryPhone.communicationDetails : NOT_AVAILABLE;
  };
  return (
    <InsurerContactDetailsContainer>
      <ButtonContainer>
        <CommonBreadcrumb
          crumbs={Breadcrumbs(
            insurerContactData?.displayName,
            contactRecordTypeLid,
            resolvedLookupIds
          )}
        />
        {canUpdateContact &&
          (insurerContactData?.editable === undefined ||
            insurerContactData?.editable) && (
            <Button
              variantType="secondary"
              onClick={handleUpdateContact}
              className="edit-button"
            >
              <img src={editIcon} alt={EDIT} /> {EDIT}
            </Button>
          )}
      </ButtonContainer>
      <SummaryCard
        data={{
          company: {
            companyName: insurerContactData?.company?.displayName as string,
            companyId: insurerContactData?.company?.id as number,
            entityType: entityType,
          },
          contactName: `${insurerContactData?.displayName ?? ""}`.trim(),
          department: insurerContactData?.department?.name ?? NOT_AVAILABLE,
          designation: insurerContactData?.designation?.name ?? NOT_AVAILABLE,
          status: insurerContactData?.status?.lookUpValue ?? NOT_AVAILABLE,
          contactType:
            insurerContactData?.contactType?.lookUpValue ?? NOT_AVAILABLE,
          contactTag: insurerContactData?.tag?.lookUpValue ?? NOT_AVAILABLE,
          phone: getPrimaryPhone(
            insurerContactData?.communicationDetails
          ) as string,
          email: getPrimaryEmail(
            insurerContactData?.communicationDetails
          ) as string,
        }}
        sections={summaryConfig}
        headerConfig={{
          titleKey: "contactName",
        }}
      />
      {/* <CommonDetailsSection
        sections={insurerDetailsConfig}
        data={insurerContactData}
      /> */}
      <OverviewCardBackground>
        <CommonDetailsSection
          sections={insurerDetailsConfig.filter(
            (section) => section.sectionTitle === "Details"
          )}
          data={insurerContactData}
        />
      </OverviewCardBackground>
      <OverviewCardBackground>
        <CommonDetailsSection
          sections={insurerDetailsConfig.filter(
            (section) => section.sectionTitle === "Communication details"
          )}
          data={insurerContactData}
        />
      </OverviewCardBackground>
      <AddressSection
        companyAddresses={
          entityType === EntityType.INSURER
            ? insurerContactData?.address
            : entityType === EntityType.TPA
            ? insurerContactData?.address
            : entityType === EntityType.BROKER
            ? insurerContactData?.address
            : []
        }
        showBranchInfo
      />{" "}
    </InsurerContactDetailsContainer>
  );
};

export default InsurerContactDetails;

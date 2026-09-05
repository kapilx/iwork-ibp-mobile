import {
  CardGrid,
  CardsGridNoDataText,
  DynamicObject,
  caseConvertor,
  endPoints,
  useApiQuery,
} from "@ui/ui-lib";
import { CardGridBackground } from "./styles";
import { useParams } from "react-router-dom";
import { CompanyDetailsNoDataBox } from "../../pages/CompanyPage/CompanyDetails/styles";
import backgroundImage from "../../assets/webp/no-data-found-background-image.webp";

const PolicyDetailsContactsTab = ({ values }: DynamicObject) => {
  const { id: policyId } = useParams();
  const { data: getPolicyContacts, isLoading: isPolicyContactsLoading } =
    useApiQuery({
      queryKey: ["getContactsByPolicyId", policyId],
      url: endPoints.getContactsByPolicyId(Number(policyId)),
    });

  if (isPolicyContactsLoading) {
    return <div>Loading...</div>;
  }

  const tpaContacts = getPolicyContacts?.data?.contacts?.tpaContacts || {};
  const insurerContacts =
    getPolicyContacts?.data?.contacts?.insurerContacts || {};
  const coInsurerContacts =
    getPolicyContacts?.data?.contacts?.coInsurerContacts || {};
  const companyContacts =
    getPolicyContacts?.data?.contacts?.companyContacts || {};

  if (
    tpaContacts?.list?.length === 0 &&
    insurerContacts?.list?.length === 0 &&
    coInsurerContacts?.list?.length === 0 &&
    companyContacts?.list?.length === 0
  ) {
    return (
      <CompanyDetailsNoDataBox>
        <img src={backgroundImage} alt="no-contacts-found-img" />
        <CardsGridNoDataText>No Contacts found!</CardsGridNoDataText>
      </CompanyDetailsNoDataBox>
    );
  }

  return (
    <>
      {companyContacts?.list?.length > 0 && (
        <CardGridBackground>
          <CardGrid
            hideAddContact={true}
            displayName={caseConvertor(companyContacts.displayName)}
            contacts={companyContacts.list}
            companyName={values?.companyName}
            companyId={values?.companyId}
            policyDetails={true}
            contactVariant="company"
          />
        </CardGridBackground>
      )}
      {tpaContacts?.list?.length > 0 && (
        <CardGridBackground data-testid="tpa-contacts-card-grid">
          <CardGrid
            hideAddContact={true}
            displayName={caseConvertor(tpaContacts.displayName)}
            contacts={tpaContacts.list}
            companyName={values?.companyName}
            companyId={values?.companyId}
            policyDetails={true}
            contactVariant="tpa"
          />
        </CardGridBackground>
      )}
      {insurerContacts?.list?.length > 0 && (
        <CardGridBackground data-testid="insurer-contacts-card-grid">
          <CardGrid
            hideAddContact={true}
            displayName={caseConvertor(insurerContacts.displayName)}
            contacts={insurerContacts.list}
            companyName={values?.companyName}
            companyId={values?.companyId}
            policyDetails={true}
            contactVariant="insurer"
          />
        </CardGridBackground>
      )}
      {coInsurerContacts?.list?.length > 0 && (
        <CardGridBackground data-testid="co-insurer-contacts-card-grid">
          <CardGrid
            hideAddContact={true}
            displayName={coInsurerContacts.displayName}
            contacts={coInsurerContacts.list}
            companyName={values?.companyName}
            companyId={values?.companyId}
            policyDetails={true}
            contactVariant="insurer"
          />
        </CardGridBackground>
      )}
    </>
  );
};

export default PolicyDetailsContactsTab;

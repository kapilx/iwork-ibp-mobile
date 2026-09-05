import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { CircularProgress } from "@mui/material";
import { ChipRenderer, NOT_AVAILABLE, endPoints, useApiQuery } from "@ui/ui-lib";
import { LoaderOverlay } from "../Dashboard/styles";
import {
  Card,
  ChipRow,
  Column,
  ContactLink,
  FieldGrid,
  FieldLabel,
  FieldValue,
  FlushRow,
  HeroCard,
  Initials,
  ManagerFieldGrid,
  ManagerInitials,
  ManagerRow,
  MetaRow,
  Name,
  ProfileContainer,
  ROLE_CHIP_STYLE_MAP,
  RolesLabel,
  STATUS_CHIP_BORDER_COLOR,
  STATUS_CHIP_STYLE_MAP,
  Row,
  SectionTitle,
} from "./styles";


const display = (value?: string | number) =>
  value || value === 0 ? String(value) : NOT_AVAILABLE;

const toInitials = (person: any) =>
  `${person?.firstName?.[0] ?? ""}${person?.lastName?.[0] ?? ""}`.toUpperCase() ||
  "U";

const toFullName = (person: any) =>
  `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim() || NOT_AVAILABLE;

const toRoleNames = (person: any): string[] =>
  person?.userRoles?.map((role: any) => role.name) ?? [];

const ProfileField = ({ label, value }: { label: string; value?: string }) => (
  <Column>
    <FieldLabel>{label}</FieldLabel>
    <FieldValue>{display(value)}</FieldValue>
  </Column>
);

const OrgFields = ({ person }: { person: any }) => (
  <>
    {(
      [
        ["Organization", person?.organisation?.name],
        ["SBU", person?.sbu?.name],
        ["Vertical", person?.vertical?.name],
        ["Branch", person?.branch?.name],
        ["Location", person?.location?.name],
        ["Iwork role", person?.iworkRole?.lookUpValue],
        ["Department", person?.department?.name],
        ["Designation", person?.designation?.name],
      ] as [string, string | undefined][]
    ).map(([label, value]) => (
      <ProfileField key={label} label={label} value={value} />
    ))}
  </>
);

// Labelled, because "Chairman · 1001" on its own reads as a riddle.
const IdentityMeta = ({
  person,
  employeeId,
  userId,
}: {
  person: any;
  employeeId?: string;
  userId?: string;
}) => (
  <MetaRow>
    <ProfileField label="Designation" value={person?.designation?.name} />
    <ProfileField label="Department" value={person?.department?.name} />
    <ProfileField label="Employee ID" value={employeeId} />
    <ProfileField label="User ID" value={userId} />
  </MetaRow>
);

const ContactRow = ({
  email,
  mobile,
}: {
  email?: string;
  mobile?: string;
}) => (
  <Row>
    {email && (
      <ContactLink>
        <EmailOutlinedIcon /> {email}
      </ContactLink>
    )}
    {mobile && (
      <ContactLink>
        <PhoneOutlinedIcon /> {mobile}
      </ContactLink>
    )}
  </Row>
);

const ReportingManager = ({ manager }: { manager: any }) => {
  if (!manager) return <FieldValue>{NOT_AVAILABLE}</FieldValue>;

  return (
    <>
      <ManagerRow>
        <ManagerInitials>{toInitials(manager)}</ManagerInitials>
        <Column>
          <FieldValue>{toFullName(manager)}</FieldValue>
          <ContactRow email={manager?.emailId} mobile={manager?.mobile} />
        </Column>
      </ManagerRow>
      <ManagerFieldGrid>
        <OrgFields person={manager} />
        <ProfileField label="Employee ID" value={manager?.employeeId} />
        <ProfileField label="Status" value={manager?.status?.lookUpValue} />
      </ManagerFieldGrid>
    </>
  );
};

const ProfilePage = () => {
  const { data, isLoading } = useApiQuery({
    queryKey: ["myProfile"],
    url: endPoints.myProfile,
  });
  const profile = data?.data;

  if (isLoading || !profile) {
    return (
      <LoaderOverlay>
        <CircularProgress />
      </LoaderOverlay>
    );
  }

  return (
    <ProfileContainer>
      <HeroCard>
        <Initials>{toInitials(profile)}</Initials>
        <Column>
          <FlushRow>
            <Name>{toFullName(profile)}</Name>
            {profile?.status?.lookUpValue && (
              <ChipRenderer
                value={profile.status.lookUpValue}
                styleMap={STATUS_CHIP_STYLE_MAP}
                bordercolor={STATUS_CHIP_BORDER_COLOR}
                variant="variable"
                size="medium"
              />
            )}
          </FlushRow>
          <IdentityMeta
            person={profile}
            employeeId={profile?.iirmEmpId}
            userId={profile?.userId?.toString()}
          />
          <ContactRow email={profile?.emailId} mobile={profile?.mobile} />
          <RolesLabel>Roles</RolesLabel>
          <ChipRow>
            {toRoleNames(profile).map((role) => (
              <ChipRenderer
                key={role}
                value={role}
                styleMap={ROLE_CHIP_STYLE_MAP}
                variant="variable"
              />
            ))}
          </ChipRow>
        </Column>
      </HeroCard>

      <Card>
        <SectionTitle>Organisation Details</SectionTitle>
        <FieldGrid>
          <OrgFields person={profile} />
        </FieldGrid>
      </Card>

      <Card>
        <SectionTitle>Reporting to</SectionTitle>
        <ReportingManager manager={profile?.reportingTo} />
      </Card>
    </ProfileContainer>
  );
};

export default ProfilePage;

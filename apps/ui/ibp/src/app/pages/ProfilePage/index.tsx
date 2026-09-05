import ProfileSection from "../../components/ProfileSection";
import ProfileWellnessSection from "../../components/ProfileWellnessSection";
import ActivityLogSection from "../../components/ActivityLogSection";
import ConsentManagementSection from "../../components/ConsentManagementSection";
import { PageWrapper, BlueStrip, ContentWrapper } from "./styles";
import { environment } from "@ui/ui-lib/environment";

const ProfilePage = () => {
    return (
        <PageWrapper>
            {/* BLUE STRIP (Figma exact) */}
            <BlueStrip />

            {/* CONTENT WRAPPER */}
            <ContentWrapper>
                <ProfileSection />
              {environment.featureFlag.FF_IWORK_WELLNESS_CONFIGURATION &&  <ProfileWellnessSection /> }
                <ActivityLogSection />
                {environment.featureFlag.FF_IBP_CONSENT_MANAGEMENT && <ConsentManagementSection />}
            </ContentWrapper>
        </PageWrapper>
    );
};

export default ProfilePage;

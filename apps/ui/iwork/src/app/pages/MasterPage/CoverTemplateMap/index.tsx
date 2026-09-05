import { useState } from "react";
import { CommonAccordion } from "@ui/ui-lib";
import CreateCoverStep from "./CreateCoverStep";
import MapCoverStep from "./MapCoverStep";
import { COVER_MASTER } from "../../../constants";
import { SectionTitle, WizardContainer } from "./styles";

/**
 * Master "Covers" flow as two accordions (shared CommonAccordion) on a single
 * screen:
 *   1. Create a base cover (mstr_cover)
 *   2. Map a policy type + org to covers (mstr_cover_template)
 * Mounted by MasterView when the selected entity is "cover".
 */
const CoverTemplateMap = () => {
  // Bumped after a cover is created so the Map section reloads its cover options.
  const [coversReloadKey, setCoversReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);

  const createTitle = (
    <SectionTitle variant="h6">{COVER_MASTER.STEPS.CREATE}</SectionTitle>
  );
  const mapTitle = (
    <SectionTitle variant="h6">{COVER_MASTER.STEPS.MAP}</SectionTitle>
  );

  return (
    <WizardContainer>
      <CommonAccordion
        expanded={createOpen}
        onToggle={() => setCreateOpen((open) => !open)}
        summary={createTitle}
        title={createTitle}
        details={
          <CreateCoverStep onCreated={() => setCoversReloadKey((k) => k + 1)} />
        }
      />

      <CommonAccordion
        expanded={mapOpen}
        onToggle={() => setMapOpen((open) => !open)}
        summary={mapTitle}
        title={mapTitle}
        details={<MapCoverStep coversReloadKey={coversReloadKey} />}
      />
    </WizardContainer>
  );
};

export default CoverTemplateMap;

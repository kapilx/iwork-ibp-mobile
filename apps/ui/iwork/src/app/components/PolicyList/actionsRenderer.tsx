import { Button } from "@ui/ui-lib";
import { ActionsCell } from "./styles";

export const ActionsRenderer = (params: any) => {
  const handleConfigure = (rowData: any) => {
    console.log("Configure clicked for:", rowData);
  };

  const handleAddEndorsement = (rowData: any) => {
    console.log("Add Endorsement clicked for:", rowData);
  };
  return (
    <ActionsCell>
      <Button
        variantType="secondary"
        onClick={() => handleConfigure(params.data)}
        disabled={true}
        className="edit-button"
      >
        Configure
      </Button>

      <Button
        variantType="secondary"
        onClick={() => handleAddEndorsement(params.data)}
        disabled={true}
        className="edit-button"
      >
        Add Endorsement
      </Button>
    </ActionsCell>
  );
};

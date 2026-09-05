import { CellClickedEvent } from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import ServerSideGrid from "../ServerSideGrid";
import { NO_DATA_AVAILABLE } from "../../constants";
import { TabsContactGridContainer, ParaContainer } from "./styles";
import Button from "../Button";

interface TabsContactProps {
  rows: Array<{
    id: string;
    companyId: string;
    [key: string]: string | number | boolean;
  }>;
  columns: Array<{
    field: string;
    headerName: string;
    [key: string]: string | number | boolean;
  }>;
}

const TabsContact: React.FC<TabsContactProps> = ({ rows, columns }) => {
  const navigate = useNavigate();

  const onCellClicked = (event: CellClickedEvent) => {
    if (
      event.colDef.field === "contactName" ||
      event.colDef.field === "displayName"
    ) {
      navigate(`/contact/${event.data.id}`, {
        state: {
          companyId: event.data.companyId,
        },
      });
    } else if (event.colDef.field === "companyName") {
      navigate(`/companies/${event.data.companyId}`);
    }
  };

  const handleClick = () => {
    navigate("/contact/new");
  };

  if (!rows.length) {
    return <ParaContainer>{NO_DATA_AVAILABLE}</ParaContainer>;
  }

  return (
    <TabsContactGridContainer>
      <Button
        label="Add Contact"
        onClick={handleClick}
        variantType="secondary"
      />
      <ServerSideGrid
        key="contact-grid"
        rows={rows}
        totalRecords={rows.length}
        currentPage={1}
        loading={false}
        columns={columns}
        pageSize={10}
        pageSizeOptions={[5, 10, 20]}
        onPageSizeChange={() => {}}
        onPageChange={() => {}}
        onCellClicked={onCellClicked}
      />
    </TabsContactGridContainer>
  );
};

export default TabsContact;

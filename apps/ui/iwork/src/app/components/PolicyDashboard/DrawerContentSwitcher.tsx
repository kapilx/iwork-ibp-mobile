import { setToastMessage } from "@ui/ui-lib/redux/slice";
import ClosedEndorsement from "../ClosedEndorsement";
import CreateEndorsement from "../CreateEndorsement";
import EmployeeBatch from "../EmployeeBatch";
import InsurerAcknowledgement from "../InsurerAcknowledgement";
import UploadedEmployeeData from "./UploadedEmployeeData";
import { EMPLOYEE_DATA_MESSAGE } from "../../constants";
import UploadEmployeeData from "../UploadEmployeeData";
import { useDispatch } from "react-redux";
import { Props } from ".";
import TPAIdAcknowledement from "../TPAIdAcknowledgement";
import AddCDDetails from "../AddCdDetails";

const DrawerContentSwitcher: React.FC<Props> = ({
  drawerView,
  setDrawerView,
  setOpenDrawer,
  additionalData,
  onInsurerAcknowledge,
  insurerAcknowledgementData,
  sendEndorsement,
  refreshDashboard,
}) => {
  const dispatch = useDispatch();

  switch (drawerView) {
    case "upload":
      return (
        <UploadEmployeeData
          onClose={() => setOpenDrawer(false)}
          onUploadSuccess={() => {
            setDrawerView("employeeBatch");
            dispatch(setToastMessage(EMPLOYEE_DATA_MESSAGE));
          }}
        />
      );

    case "closedEndorsement":
      return (
        <ClosedEndorsement
          onClose={() => setOpenDrawer(false)}
          onInsurerAcknowledge={onInsurerAcknowledge}
        />
      );

    case "employeeBatch":
      return <EmployeeBatch onClose={() => setOpenDrawer(false)} />;

    case "employeeText":
      return <UploadedEmployeeData />;

    case "insurerAcknowledgement":
      return (
        <InsurerAcknowledgement
          onClose={() => setOpenDrawer(false)}
          onPrevious={() => setDrawerView("closedEndorsement")}
          insurerAcknowledgementData={insurerAcknowledgementData}
          refreshDashboard={refreshDashboard}
        />
      );

    case "createEndorsement":
      return (
        <CreateEndorsement
          onClose={() => setOpenDrawer(false)}
          employeeCount={additionalData?.readyForEndorsement || 0}
          insurerId={additionalData?.insurerId || 0}
          sendEndorsement={sendEndorsement}
        />
      );

    // case "cdBalance":
    //   return (
    //     <AddCDDetails
    //       onClose={() => setOpenDrawer(false)}
    //       cdId={additionalData?.cdId || 0}
    //       refreshDashboard={refreshDashboard}
    //     />
    //   );

    case "tpaAcknowledgement":
      return (
        <TPAIdAcknowledement
          onClose={() => setOpenDrawer(false)}
          onPrevious={() => setDrawerView("closedEndorsement")}
          tpaAcknowledgementData={insurerAcknowledgementData}
          refreshDashboard={refreshDashboard}
        />
      );

    default:
      return null;
  }
};

export default DrawerContentSwitcher;

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPermissions,
  selectPermissions,
} from "@ui/ui-lib/redux/permissionSlice";
import type { AppDispatch } from "@ui/ui-lib/redux/store";
// import { useAuth } from "../../../../iwork/src/app/providers/AuthProvider"; //Hot fix-Todo: uncomment when needed
import { CircularProgress } from "@mui/material";
import { LoaderOverlay } from "../styles";

interface Props {
  children: React.ReactNode;
}

//This component is not using anywhere currently
const PermissionInitializer: React.FC<Props> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const permissions = useSelector(selectPermissions);

  //Todo: uncomment below line and delete the next two lines when this component is used
  // const { user, loading: authLoading } = useAuth();
  const user = sessionStorage.getItem("user");
  const authLoading = false;

  useEffect(() => {
    if (!authLoading && user && permissions === null) {
      dispatch(fetchPermissions());
    }
  }, [authLoading, user, permissions, dispatch]);

  if (authLoading || !user || permissions === null) {
    return (
      <LoaderOverlay data-testid="permission-loader">
        <CircularProgress />
      </LoaderOverlay>
    );
  }

  return <>{children}</>;
};

export default PermissionInitializer;

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { setToastMessage } from "./redux/slice";
import ToastMessage from "@ui/ui-lib/commonComponents/Toast";

const RootToast = () => {
  const dispatch = useDispatch();
  const toastMessage = useSelector((state: RootState) => state.user.toastMessage);
  const toastDuration = useSelector((state: RootState) => state.user.toastDuration);

  if (!toastMessage) return null;

  return (
    <ToastMessage
      vertical="top"
      horizontal="center"
      message={toastMessage as string}
      open={Boolean(toastMessage)}
      onClose={() => dispatch(setToastMessage({ message: null }))}
      autoHideDuration={toastDuration}
    />
  );
};

export default RootToast;

import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { userReducer, setToastMessage } from "@ui/ui-lib";
import RootToast from "./RootToast";

describe("RootToast", () => {
  it("renders toast when message is present", () => {
    const store = configureStore({ reducer: { user: userReducer } });
    store.dispatch(setToastMessage("Hello"));
    render(
      <Provider store={store}>
        <RootToast />
      </Provider>
    );

    expect(screen.getByTestId("snackbar")).toBeInTheDocument();
  });
});


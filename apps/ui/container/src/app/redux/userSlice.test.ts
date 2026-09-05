import userReducer, {
  setToastMessage,
  setLoading,
  setDependencies,
  clearDependencies,
  setSelectedCompany,
} from "./slice";

describe("userSlice", () => {
  const initialState = {
    toastMessage: null,
    loading: false,
    dependencies: {},
    selectedCompany: null,
  };

  it("should return the initial state", () => {
    expect(userReducer(undefined, { type: "UNKNOWN_ACTION" })).toEqual(
      initialState
    );
  });

  it("should handle setToastMessage", () => {
    const message = "Test toast message";
    const action = setToastMessage(message);
    const state = userReducer(initialState, action);
    expect(state.toastMessage).toBe(message);
  });

  it("should handle setLoading", () => {
    const action = setLoading(true);
    const state = userReducer(initialState, action);
    expect(state.loading).toBe(true);
  });

  it("should handle setDependencies", () => {
    const payload = { fieldName: "countries", value: ["USA", "Canada"] };
    const action = setDependencies(payload);
    const state = userReducer(initialState, action);
    expect(state.dependencies).toEqual({ countries: ["USA", "Canada"] });
  });

  it("should merge new dependencies with existing ones", () => {
    const currentState = {
      ...initialState,
      dependencies: { industries: ["Tech"] },
    };
    const action = setDependencies({ fieldName: "countries", value: ["USA"] });
    const state = userReducer(currentState, action);
    expect(state.dependencies).toEqual({
      industries: ["Tech"],
      countries: ["USA"],
    });
  });

  it("should handle clearDependencies", () => {
    const currentState = {
      ...initialState,
      dependencies: { a: 1, b: 2 },
    };
    const state = userReducer(currentState, clearDependencies());
    expect(state.dependencies).toEqual({});
  });

  it("should handle setSelectedCompany", () => {
    const company = { id: 1, name: "OpenAI" };
    const action = setSelectedCompany(company);
    const state = userReducer(initialState, action);
    expect(state.selectedCompany).toEqual(company);
  });
});

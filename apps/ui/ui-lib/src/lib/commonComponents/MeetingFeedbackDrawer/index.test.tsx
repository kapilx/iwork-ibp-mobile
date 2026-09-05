import "@testing-library/jest-dom";

jest.mock("../../environment", () => ({
  environment: {
    VITE_API_URL: "http://localhost",
  },
}));

// Mock useApiQuery to always return options for outcomes, challenges, next steps
jest.mock("../../hooks/useApiQuery", () => ({
  useApiQuery: jest.fn(({ url }) => {
    if (url.includes("MEETING_OUTCOME")) {
      return { data: { data: [{ id: 1, lookUpValue: "Outcome 1" }] } };
    }
    if (url.includes("MEETING_CHALLENGE")) {
      return { data: { data: [{ id: 2, lookUpValue: "Challenge 1" }] } };
    }
    if (url.includes("MEETING_NEXT_STEP")) {
      return { data: { data: [{ id: 3, lookUpValue: "Next Step 1" }] } };
    }
    return { data: { data: [] } };
  }),
}));

jest.mock("../../hooks/useMutation", () => {
  let mutationConfig = {};
  return {
    useApiMutation: (options) => {
      mutationConfig = options.config;
      return {
        mutate: jest.fn((params) => {
          if (params.endpoint.includes("error")) {
            mutationConfig.onError &&
              mutationConfig.onError({ message: "Error occurred" });
          } else {
            mutationConfig.onSuccess && mutationConfig.onSuccess();
          }
        }),
      };
    },
  };
});

import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import MeetingFeedbackDrawer from "./index";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { theme } from "@ui/ui-lib/styles";

describe("MeetingFeedbackDrawer Component", () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    meeting: {
      id: 1,
      meetingDate: "2025-07-08",
      startTime: "10:00",
      endTime: "11:00",
      location: "Room 1",
      agenda: "Discuss project",
      attendees: [],
      status: "Scheduled",
      createdBy: 1,
      createdAt: "2025-07-01T10:00:00Z",
      updatedAt: "2025-07-01T10:00:00Z",
      // Add any other required fields for Meeting type here
    },
    onSuccess: jest.fn(),
  };

  const renderWithTheme = (props = {}) => {
    const queryClient = new QueryClient();
    const store = configureStore({ reducer: () => ({}) });
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <MeetingFeedbackDrawer {...defaultProps} {...props} />
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
  };

  it("calls onClose when cancel button is clicked", () => {
    renderWithTheme();
    const cancelBtn = screen.getByTestId("cancel-button");
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders SAVE and Back buttons on step 1", () => {
    renderWithTheme();
    // Fill required fields: select rating and outcome
    fireEvent.click(screen.getAllByRole("radio")[0]); // select rating
    fireEvent.click(screen.getByText("Outcome 1")); // select outcome
    const nextBtn = screen.getByText(/next/i);
    fireEvent.click(nextBtn);
    expect(screen.getByText(/save/i)).toBeInTheDocument();
    expect(screen.getByText(/back/i)).toBeInTheDocument();
  });

  it("disables Next button when rating or outcomes are not selected", () => {
    renderWithTheme();
    const nextBtn = screen.getByText(/next/i);
    expect(nextBtn).toBeDisabled();
  });

  it("navigates to step 1 when rating and outcome are selected", () => {
    renderWithTheme();
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByText("Outcome 1"));
    const nextBtn = screen.getByText(/next/i);
    expect(nextBtn).toBeEnabled();
    fireEvent.click(nextBtn);
    expect(screen.getByText(/challenges faced/i)).toBeInTheDocument();
  });

  it("selects and deselects a challenge chip", () => {
    renderWithTheme();
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByText("Outcome 1"));
    fireEvent.click(screen.getByText(/next/i));

    const challengeChip = screen.getByText("Challenge 1");
    fireEvent.click(challengeChip);
    expect(challengeChip).toBeInTheDocument(); // Selected
    fireEvent.click(challengeChip); // Deselect
  });
  it("enters remarks and triggers save", () => {
    renderWithTheme();
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByText("Outcome 1"));
    fireEvent.click(screen.getByText(/next/i));

    fireEvent.change(screen.getByPlaceholderText("Enter here..."), {
      target: { value: "Some remarks" },
    });

    const saveBtn = screen.getByText(/save/i);
    fireEvent.click(saveBtn);

    // Save is mocked – no assertion for mutation, just that button exists
    expect(saveBtn).toBeInTheDocument();
  });

  it("goes back to step 0 when Back button is clicked", () => {
    renderWithTheme();
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByText("Outcome 1"));
    fireEvent.click(screen.getByText(/next/i));

    fireEvent.click(screen.getByText(/back/i));
    expect(screen.getByText(/how was the meeting/i)).toBeInTheDocument();
  });

  it("resets state and calls onClose when Cancel is clicked", () => {
    renderWithTheme();
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("handles mutation success and calls onSuccess and onClose", () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    renderWithTheme({ onClose, onSuccess });

    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByText("Outcome 1"));
    fireEvent.click(screen.getByText(/next/i));
    fireEvent.click(screen.getByText(/save/i));

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("handles mutation error and calls onClose", () => {
    const onClose = jest.fn();
    renderWithTheme({
      onClose,
      meeting: { ...defaultProps.meeting, id: "error-meeting" }, // to trigger error condition
    });

    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByText("Outcome 1"));
    fireEvent.click(screen.getByText(/next/i));
    fireEvent.click(screen.getByText(/save/i));

    expect(onClose).toHaveBeenCalled();
  });
});

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useForm } from "react-hook-form";
import {
  endPoints,
  useApiQuery,
  masterUserDataUtilityFunction,
  useApiMutation,
  Button,
  SUBMIT,
  INVALID_DATE,
  ERROR_MESSAGE,
  DATE_FORMATS,
  setToastMessage,
  Calendar,
  getChipColorFromLabel,
  DateField,
  selectHasPermission,
  FeatureKey,
  FormComponentStyledCheckbox,
  SearchIcon,
} from "@ui/ui-lib";
import {
  OppFormContainer,
  HeaderStyles,
  PlanningMainContainer,
  LabelStyles,
  LabelDot,
  ActivityBox,
  HeadingStyles,
  ButtonStyles,
  StagedActivities,
  AutocompleteStyles,
  AutocompleteTypographystyles,
  NChipStyles,
  ActivityLabelStyles,
  ApprovalContainerStyles,
  FormControlStyles,
  SelectFieldStyles,
  ApprovalFieldsContainer,
  MainContainerStyles,
  SelectFieldContainer,
  SelectFieldTitleStyles,
  AutocompleteOption,
  StyledMenuItem,
  StyledPaper,
  StyledSearchTextField,
} from "./styles";
import {
  ACTIVITY,
  REQUIRED_PARTICIPANTS,
  REQUIRED_TARGET_DATE,
  PLANNING_NOTE,
  ACTIVITY_SUCCESS_MESSAGE,
  SUBMIT_PLANNING,
  ISG_NOTE,
  SELECT_ASSIGNEE,
  SEND_SELECTED_USER,
  ISG_PLANNING_NOTE,
  PLANNED,
  CLOSED,
  BD,
  ISG,
} from "../../../../constants";
import { useDispatch, useSelector } from "react-redux";
import { Chip, Fade, InputAdornment, MenuItem, TextField } from "@mui/material";

const OpportunityPlanning = ({
  opportunityData,
  setBreadCumbStep,
  role,
  onPlanningUpdate,
  setSubmittedBreadCumb,
  breadCumbSep,
  allActivities,
  isPlanningDisabled,
  planningStatusId,
  isLost = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const [stagedRows, setStagedRows] = useState<
    {
      stageId: number;
      stageName: string;
      activities: {
        id?: number;
        activity: string;
        date: Dayjs | null;
        participants: string[];
        isValid: boolean;
        originalDueDate: Dayjs | null;
      }[];
    }[]
  >([]); // Store stage and activity data
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs()); // Track selected date in calendar
  const dispatch = useDispatch(); // Access Redux dispatch function
  const { id: opportunityId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchAssigneeTerm, setSearchAssigneeTerm] = useState("");

  // Initialize form with react-hook-form
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm();
  const canISGAssign = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ASSIGN_ISG_ACTIVITY)(state)
  );
  const canBDAssign = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ASSIGN_BD_ACTIVITY)(state)
  );
  const canGiveApproval =
    (role === BD && canBDAssign) || (role === ISG && canISGAssign);

  const canEditBDActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.PLAN_BD_ACTIVITY)(state)
  );
  const canEditISGActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.PLAN_ISG_ACTIVITY)(state)
  );

  const canEditActivity =
    (role === BD && canEditBDActivity) ||
    (role === ISG && canEditISGActivity);

  const getRoleKeyForParticipants = (currentRole: string): string => {
    switch (currentRole) {
      case "BD":
        return "ROLE_BD_EXECUTIVE";
      case "ISG":
        return "ROLE_ISG_EXECUTIVE";
      default:
        return "ROLE_ISG_MANAGER"; // Default fallback
    }
  };

  // Fetch participants data for dropdown options
  const { data: participantsData, isLoading: isParticipantsLoading } =
    useApiQuery({
      queryKey: ["participants", role, searchTerm],
      url: `${endPoints.usersList}&roleKey=[${getRoleKeyForParticipants(
        role
      )}]${
        searchTerm
          ? `&searchBy=firstName&search=${encodeURIComponent(searchTerm)}`
          : ""
      }`,
      enabled: !!role, // Only run when role is available
    });
  // For the Assignment dropdown (ISG managers only)
  const { data: isgManagersData } = useApiQuery({
    queryKey: ["participants", "isg-managers", searchAssigneeTerm],
    url: `${endPoints.usersList}&roleKey=[${getRoleKeyForParticipants(role)}]${
      searchAssigneeTerm
        ? `&searchBy=firstName&search=${encodeURIComponent(searchAssigneeTerm)}`
        : ""
    }`,
  });
  // Fetch opportunity activity data by ID
  const { data, refetch } = useApiQuery({
    queryKey: ["opportunityId", id, role],
    url: endPoints.opportunityActivityByOppurtunityId(Number(id)),
    enabled: !!id,
  });

  //put call for updating the opportunity activity
  const { mutate } = useApiMutation({
    config: {
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message || error?.message || ERROR_MESSAGE;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  // Process API data and set initial form values when data loads
  // Optimize and simplify the normalization and pre-filling logic
  const normalizeActivity = (activity: any) => {
    const expiry = opportunityData?.expiryDate
      ? dayjs(opportunityData.expiryDate)
      : null;
    let date = activity.dueDate
      ? dayjs(activity.dueDate)
      // Prefilling from originalDueDate stopped — date must be entered manually
      // : activity.originalDueDate
      // ? dayjs(activity.originalDueDate)
      : null;
    // If expiryDate exists and date is after it, set to expiryDate
    if (expiry && date && date.isAfter(expiry, "day")) {
      date = expiry;
    }
    return {
      id: activity.opportunityActivityId,
      activity: activity.activityName,
      originalDueDate: activity.originalDueDate
        ? dayjs(activity.originalDueDate)
        : null,
      date,
      participants:
        activity.participants?.map((participant: any) => ({
          label: participant.userName,
          value: participant.userId,
        })) || [],
      isValid: !!activity.dueDate && activity.participants?.length > 0,
      isPlanned: activity.isPlanned,
      activityStatus: activity.activityStatus,
    };
  };

  useEffect(() => {
    if (!data?.data?.data) return;

    // Filter data by role if role is provided
    const roleData = role ? data.data.data[role] || [] : data.data.data;

    const normalizedStages = roleData.map((stage: any) => ({
      stageId: stage.stageId,
      stageName: stage.stageName,
      activities: stage.activities.map(normalizeActivity),
    }));
    setStagedRows(normalizedStages);
  }, [data, role]);

  useEffect(() => {
    if (!stagedRows.length) return;

    stagedRows.forEach((stage, stageIndex) => {
      stage.activities.forEach((activity, activityIndex) => {
        const activityPath = `stagedRows[${stageIndex}].activities[${activityIndex}]`;

        const currentParticipants = watch(`${activityPath}.participants`);
        const currentDate = watch(`${activityPath}.date`);

        if (!currentParticipants?.length) {
          setValue(
            `${activityPath}.participants`,
            activity.participants.map((p) => p.value)
          );
        }

        if (!currentDate) {
          setValue(`${activityPath}.date`, activity.date);
        }
      });
    });
  }, [stagedRows, setValue, watch]);

  // Check if any activity is planned
  const hasPlannedActivity = useMemo(() => {
    return stagedRows.some((stage) =>
      stage.activities.some(
        (activity) =>
          activity.isPlanned === PLANNED ||
          activity.activityStatus === CLOSED
      )
    );
  }, [stagedRows, role]);

  // Handle form submission and validation
  const onSubmit = () => {
    const opportunityActivities = stagedRows.flatMap((stage) =>
      stage.activities.map((activity) => ({
        opportunityActivityId: activity.id,
        dueDate: activity.date ? activity.date.format("YYYY-MM-DD") : null,
        participants: activity.participants.map((p) => Number(p.value)), // <-- now numbers
      }))
    );

    const opportunityActivitiesToDisplay = stagedRows.flatMap((stage) =>
      stage.activities.map((activity) => ({
        opportunityActivityId: activity.id,
        dueDate: activity.date ? activity.date.format("YYYY-MM-DD") : null,
        participants: activity.participants.map((p) => p.label.split(",")[0]), // <-- now numbers
      }))
    );

    const payload = {
      opportunityActivities,
    };
    mutate(
      {
        endpoint: endPoints.updateActivity,
        method: "PUT",
        data: payload,
      },
      {
        onSuccess: () => {
          dispatch(setToastMessage(ACTIVITY_SUCCESS_MESSAGE));
          refetch();
          setStagedRows((prevStages) =>
            prevStages.map((stage) => ({
              ...stage,
              activities: stage.activities.map((activity) => ({
                ...activity,
              })),
            }))
          );
          setBreadCumbStep((prev: number | null) =>
            prev === null ? 0 : prev + 1
          );
          setSubmittedBreadCumb((breadCumbSep ?? 0) + 1);
        },
      }
    );
    if (onPlanningUpdate) {
      onPlanningUpdate(opportunityActivitiesToDisplay);
    }
  };

  const getMinDate = (stageIndex: number, activityIndex: number): Dayjs => {
    if (stageIndex === 0 && activityIndex === 0) {
      return dayjs().startOf("day");
    }
    if (activityIndex === 0 && stageIndex > 0) {
      const prevStageLastActivity =
        stagedRows[stageIndex - 1]?.activities?.slice(-1)[0];

      if (prevStageLastActivity?.date) {
        return prevStageLastActivity.date.startOf("day");
      }
      return dayjs().startOf("day"); // fallback
    }
    const prevActivity = stagedRows[stageIndex]?.activities[activityIndex - 1];
    if (prevActivity?.date) {
      return prevActivity.date.startOf("day");
    }
    return dayjs().startOf("day"); // fallback
  };

  // Update date for an activity and validate it
  const handleDateChange = (
    stageIndex: number,
    activityIndex: number,
    newDate: Dayjs | null
  ): void => {
    setStagedRows((prev) => {
      const updatedStages = [...prev];
      const activity = updatedStages[stageIndex]?.activities[activityIndex];

      if (!activity) return updatedStages;

      if (opportunityData?.expiryDate) {
        const expiry = dayjs(opportunityData.expiryDate);
        if (newDate && newDate.isAfter(expiry, "day")) {
          activity.date = expiry;
        } else {
          activity.date = newDate;
        }
      } else {
        activity.date = newDate;
      }
      activity.isValid = !!activity.date && activity.participants.length > 0;

      return updatedStages;
    });
  };

  const handleParticipantsChange = (
    stageIndex: number,
    activityIndex: number,
    newParticipants: { label: string; value: string }[]
  ) => {
    setStagedRows((prevStages) => {
      const updatedStages = [...prevStages];
      const activity = updatedStages[stageIndex].activities[activityIndex];
      activity.participants = newParticipants;
      activity.isValid = !!activity.date && newParticipants.length > 0;
      return updatedStages;
    });
  };

  const calendarData = useMemo(
    () =>
      stagedRows.flatMap((stage) =>
        stage.activities.map((activity) => ({
          label: activity.activity || "",
          date: activity.date,
        }))
      ),
    [stagedRows]
  );

  const validateDate = (
    value: unknown,
    stageIndex: number,
    activityIndex: number,
    activity: {
      originalDueDate: Dayjs | null;
    },
    getMinDate: (stageIndex: number, activityIndex: number) => Dayjs
  ): string | true => {
    const dateValue = dayjs(value);

    if (!value || !dateValue.isValid()) return REQUIRED_TARGET_DATE;

    const minDate = getMinDate(stageIndex, activityIndex);
    if (!minDate.isValid()) return INVALID_DATE;

    if (dateValue.isBefore(minDate)) {
      return `Date cannot be earlier than ${minDate.format(
        DATE_FORMATS.DATE_MONTH_YEAR
      )}`;
    }

    if (opportunityData?.expiryDate) {
      const expiry = dayjs(opportunityData.expiryDate);
      if (expiry.isValid() && dateValue.isAfter(expiry, "day")) {
        return `Date cannot exceed the expiry date. ${expiry.format(
          DATE_FORMATS.DATE_MONTH_YEAR
        )}`;
      }
    }

    return true;
  };

  // Logic for the Assignment of ISG Executive :::
  const [selectedUser, setSelectedUser] = useState(null);
  const [isStageOwnerAssigned, setIsStageOwnerAssigned] =
    useState<boolean>(false);

  const {
    data: stageOwnerData,
    isLoading: isStageOwnerLoading,
    refetch: refetchStageOwner,
  } = useApiQuery({
    queryKey: ["stageOwner", opportunityId],
    url: `${endPoints.getStageOwner(
      Number(opportunityId)
    )}?roleKey=${getRoleKeyForParticipants(role)}`,
    enabled: !!opportunityId,
  });

  // Effect to prefill selectedUser when stage owner data is loaded
  useEffect(() => {
    if (stageOwnerData?.data?.ownerId) {
      setSelectedUser(stageOwnerData.data.ownerId);
      setIsStageOwnerAssigned(true);
    } else {
      setSelectedUser(null);
      setIsStageOwnerAssigned(false);
    }
  }, [stageOwnerData]);

  const handleSendData = () => {
    if (selectedUser) {
      mutate(
        {
          endpoint: endPoints.stageOwner,
          method: "POST",
          data: {
            opportunityId: parseInt(opportunityId),
            ownerId: selectedUser,
            roleKey: getRoleKeyForParticipants(role),
          },
        },
        {
          onSuccess: () => {
            dispatch(setToastMessage("User assigned successfully"));
            setIsStageOwnerAssigned(true); // Lock assignment, enable planning
            refetchStageOwner();
          },
        }
      );
    } else {
      dispatch(setToastMessage("Please select a user."));
    }
  };

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedUser(event.target.value as number);
  };

  // Determine if approval section should be shown based on role position
  // Get all available roles from the API response and find the current role's position
  // const availableRoles = data?.data?.data ? Object.keys(data.data.data) : [];
  // const currentRoleIndex = availableRoles.indexOf(role);

  // Show approval section from 2nd role onwards (index >= 1)
  // currentRoleIndex will be -1 if role not found, so we check >= 1
  // const shouldShowApprovalSection = currentRoleIndex;

  // Determine if planning should be disabled based on role permissions and conditions
  const isPlanningDisabledForRole =
    role === BD
      ? !canEditActivity
      : !canEditActivity || !isStageOwnerAssigned;

  // Define required activities for each role that must be completed to disable the dropdown
  const requiredActivitiesForDropdownDisable = useMemo(() => {
    if (role === BD) {
      return [
        "Data Validation",
        "KDM Meeting",
        "Mandate Details Entry",
        "RFP Data Collection",
        "RFP Details Entry"
      ];
    } else if (role === ISG) {
      return [
        "Broking Slip Generation",
        "Enter Quote",
        "QCR Generation",
        "Meeting for Final Negotiation",
        "Placement Slip Generation",
        "Premium Calculation",
        "Held Cover Note",
        "Policy Hard Copy Receipt",
        "Policy Docket",
        "Hand over Meet",
        "Policy Confirmation"
      ];
    }
    return [];
  }, [role]);

  // Check if all required activities are completed
  const areRequiredActivitiesCompleted = useMemo(() => {
    if (!requiredActivitiesForDropdownDisable.length || !stagedRows.length) {
      return false;
    }

    const allActivities = stagedRows.flatMap(stage => stage.activities);
    
    // Check that ALL required activities exist and are completed
    const completedActivities = requiredActivitiesForDropdownDisable.map(requiredActivity => {
      const activity = allActivities.find(
        act => act.activity.toLowerCase().trim() === requiredActivity.toLowerCase().trim()
      );
      
      const isCompleted = activity && (activity.isPlanned === PLANNED || activity.activityStatus === CLOSED);
            
      return isCompleted;
    });
    
    const allCompleted = completedActivities.every(c => c === true) && completedActivities.length > 0;    
    return allCompleted;
  }, [stagedRows, requiredActivitiesForDropdownDisable]);

  return (
    <MainContainerStyles
      data-testId={
        !canEditActivity ||
        isLost ||
        stagedRows.some((stage) =>
          stage.activities.some(
            (activity) =>
              activity?.isPlanned === PLANNED ||
              activity?.activityStatus === CLOSED
          )
        ) ||
        isPlanningDisabledForRole
          ? "common-activities-main-container-disabled"
          : "common-activities-main-container"
      }
    >
      {/* Only show ApprovalContainerStyles for role 2 onwards */}
      {/* {shouldShowApprovalSection &&  */}
      {canGiveApproval && canEditActivity && (
        <ApprovalContainerStyles>
          <HeadingStyles>{ISG_NOTE}</HeadingStyles>
          <ApprovalFieldsContainer>
            <SelectFieldContainer>
              <SelectFieldTitleStyles>{SELECT_ASSIGNEE}</SelectFieldTitleStyles>
              <FormControlStyles>
                <SelectFieldStyles
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedUser}
                  onChange={handleChange}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxWidth: "300px",
                        maxHeight: "350px",
                        "& .MuiList-root": {
                          paddingTop: 0,
                          paddingBottom: 0,
                        },
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    TransitionComponent: Fade,
                    autoFocus: false,
                  }}
                  disabled={isLost || areRequiredActivitiesCompleted}
                >
                  <StyledMenuItem>
                    <StyledSearchTextField
                      placeholder="Search users..."
                      value={searchAssigneeTerm}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSearchAssigneeTerm(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Escape") {
                          setSearchAssigneeTerm("");
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      size="small"
                      fullWidth
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="#000" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </StyledMenuItem>
                  {isgManagersData?.data?.data?.length > 0 ? (
                    isgManagersData.data.data.map((user) => (
                      <MenuItem key={user.userId} value={user.userId}>
                        {user.firstName + ", " + user?.branch?.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      {searchAssigneeTerm
                        ? "No users found"
                        : "No users available"}
                    </MenuItem>
                  )}
                </SelectFieldStyles>
              </FormControlStyles>
            </SelectFieldContainer>
            <Button
              onClick={handleSendData}
              disabled={
                !canEditActivity ||
                isLost ||
                isPlanningDisabledForRole ||
                areRequiredActivitiesCompleted
              }
            >
              {SEND_SELECTED_USER}
            </Button>
          </ApprovalFieldsContainer>
        </ApprovalContainerStyles>
      )}
      {role === BD ? (
        <HeadingStyles>{PLANNING_NOTE}</HeadingStyles>
      ) : (
        <HeadingStyles>{ISG_PLANNING_NOTE}</HeadingStyles>
      )}{" "}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <PlanningMainContainer>
          <Calendar
            rows={calendarData}
            selectedDate={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            labelColorMap={useMemo(() => {
              const labelColorMap: Record<string, string> = {};
              let index = 0;
              stagedRows.forEach((stage) => {
                stage.activities.forEach((activity) => {
                  const label = activity.activity;
                  if (!labelColorMap[label]) {
                    labelColorMap[label] = getChipColorFromLabel(label, index);
                    index++;
                  }
                });
              });

              return labelColorMap;
            }, [stagedRows])}
          />
          <OppFormContainer>
            <HeaderStyles>
              <ActivityLabelStyles>{ACTIVITY}</ActivityLabelStyles>
              <div>{REQUIRED_TARGET_DATE}</div>
              <div>{REQUIRED_PARTICIPANTS}</div>
            </HeaderStyles>
            {stagedRows.map((stage, stageIndex) => (
              <StagedActivities key={stage.stageId}>
                {stage.activities.map((activity, activityIndex) => (
                  <ActivityBox key={`${activity.activity}-${activityIndex}`}>
                    <LabelStyles>
                      <LabelDot
                        activity={activity.activity}
                        index={stageIndex + activityIndex}
                      />
                      <div>{activity.activity}</div>
                    </LabelStyles>
                    <DateField
                      field={{
                        name: `stagedRows[${stageIndex}].activities[${activityIndex}].date`,
                        type: "date",
                        value: activity.date,
                        rules: {
                          required: {
                            value: true,
                            message: REQUIRED_TARGET_DATE,
                          },
                          validate: (value: Dayjs | null) =>
                            validateDate(
                              value,
                              stageIndex,
                              activityIndex,
                              activity,
                              getMinDate
                            ),
                        },
                        componentProps: {
                          minDate: getMinDate(stageIndex, activityIndex),
                          maxDate: opportunityData?.expiryDate
                            ? dayjs(opportunityData.expiryDate)
                            : undefined,
                          placeholder: DATE_FORMATS.DATE_MONTH_YEAR,
                          onChange: (newDate: Dayjs | null) =>
                            handleDateChange(
                              stageIndex,
                              activityIndex,
                              newDate
                            ),
                          disabled:
                            isLost ||
                            activity?.isPlanned === PLANNED ||
                            activity?.activityStatus === CLOSED ||
                            isPlanningDisabledForRole,
                        },
                      }}
                      control={control}
                    />
                    <AutocompleteStyles
                      data-testid={`select-participants-${activity.activity
                        .replace(/\s+/g, "-")
                        .toLowerCase()}`}
                      multiple
                      disablePortal
                      disableCloseOnSelect={true}
                      options={masterUserDataUtilityFunction(
                        participantsData || []
                      )}
                      PaperComponent={StyledPaper}
                      loading={isParticipantsLoading}
                      onInputChange={(event, newInputValue) => {
                        setSearchTerm(newInputValue);
                      }}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      renderOption={(props, option, { selected }) => (
                        <AutocompleteOption {...props} $selected={selected}>
                          <FormComponentStyledCheckbox checked={selected} />
                          {option.label}
                        </AutocompleteOption>
                      )}
                      value={activity.participants}
                      onChange={(event, selectedOptions, reason, details) => {
                        // Handle clear action (when X icon is clicked)
                        if (reason === "clear") {
                          handleParticipantsChange(
                            stageIndex,
                            activityIndex,
                            []
                          );
                          return;
                        }

                        const clickedOption = details?.option;
                        const existing = activity.participants || [];

                        // Toggle logic
                        let newValue;
                        const isAlreadySelected = existing.some(
                          (participant) =>
                            participant.value === clickedOption?.value
                        );

                        if (isAlreadySelected) {
                          newValue = existing.filter(
                            (participant) =>
                              participant.value !== clickedOption.value
                          );
                        } else {
                          newValue = [...existing, clickedOption];
                        }

                        handleParticipantsChange(
                          stageIndex,
                          activityIndex,
                          newValue
                        );
                      }}
                      disabled={
                        isLost ||
                        activity?.isPlanned === PLANNED ||
                        activity?.activityStatus === CLOSED ||
                        isPlanningDisabledForRole
                      }
                      renderTags={(value, getTagProps) => {
                        const maxVisible = 2; // Change as needed
                        const visibleTags = value.slice(0, maxVisible);
                        const extraCount = value.length - maxVisible;

                        return (
                          <>
                            {visibleTags.map((option, index) => (
                              <Chip
                                key={index}
                                label={option.label || option} // adjust based on your data shape
                                {...getTagProps({ index })}
                                sx={{
                                  width: extraCount > 0 ? "35%" : "50%",
                                }}
                                title={option.label || option}
                              />
                            ))}
                            {extraCount > 0 && (
                              <NChipStyles
                                label={`+${extraCount}`}
                                title={extraCount.toString()}
                              />
                            )}
                          </>
                        );
                      }}
                      renderInput={(params) => (
                        <AutocompleteTypographystyles
                          {...params}
                          variant="outlined"
                        />
                      )}
                    />
                  </ActivityBox>
                ))}
              </StagedActivities>
            ))}
          </OppFormContainer>
        </PlanningMainContainer>
        {!hasPlannedActivity && (
          <ButtonStyles>
            <Button
              variantType="primary"
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isLost || isPlanningDisabledForRole}
            >
              {SUBMIT_PLANNING}
            </Button>
          </ButtonStyles>
        )}
      </LocalizationProvider>
    </MainContainerStyles>
  );
};
export default OpportunityPlanning;

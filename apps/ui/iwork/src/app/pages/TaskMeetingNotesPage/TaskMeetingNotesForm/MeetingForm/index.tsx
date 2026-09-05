import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  MeetingFormFields,
  MeetingDetailsFields,
  MeetingLinkingAndParticipantsFields,
  MeetingLinkingAndParticipantsFields_ForInternalMeeting,
} from "./formConfig.js";
import {
  SectionTitle,
  SectionBox,
  MainFormBox,
  MeetingNotesButtonPanel,
  TasksFormContainer,
  MeetingFeedbackLabel,
  MeetingFeedbackValue,
  FeedbackOuterBox,
  FeedbackInnerBox,
} from "./styles";
import {
  CANCEL_BUTTON,
  CANCEL,
  CREATE,
  DELETE,
  MEETING_ATTACHMENTS,
  MEETING_DETAILS,
  MEETING_LINKS,
  MEETING_PARTICIPANTS,
  UPDATE,
  FEEDBACK,
  MEETING_FEEDBACK_DISPLAY_LABELS,
  DynamicForm,
  TaskMeetingNotesErrorMessages,
  CustomModal,
  LookUpValues,
  useLookupIdByKey,
  theme,
  Rating,
  useApiMutation,
  endPoints,
  setToastMessage,
  FeatureKey,
  environment,
  selectHasPermission,
} from "@ui/ui-lib";
import { useSelector } from "react-redux";
import { LookUpValues as iWorkLookUpValues } from "../../../../constants/lookupValues.js";
import { UseFormReturn, FieldValues } from "react-hook-form";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { StyledButton1 } from "../TaskForm/styles.js";
import { LOCATION, MEETING_STATUS_LID, MEETING_TIME, TIME_RANGE,DATE } from "../../../../constants/index.js";

interface MeetingFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
  editMode?: boolean;
  initialData?: Record<string, unknown>;
  refetchMeeting?: () => void;
  isFromOptyActivityPage?: boolean;
}

const MeetingForm: React.FC<MeetingFormProps> = ({
  onCreated,
  onCancel,
  editMode = false,
  initialData,
  refetchMeeting,
  isFromOptyActivityPage = false,
}) => {
  const location = useLocation();
  const isOnOpportunityPage = location.pathname.includes('/opportunities/');
  const isCompleted = initialData?.meetingStatus?.lookUpValue === "Completed";
  const isFeedbackSubmitted = initialData?.isFeedbackSubmitted === "MEETING_FEEDBACK_SUBMITTED";
  const dispatch = useDispatch();
  // Separate form methods for each DynamicForm
  const [detailsFormMethods, setDetailsFormMethods] =
    useState<UseFormReturn<FieldValues>>();
  const [linkFormMethods, setLinkFormMethods] =
    useState<UseFormReturn<FieldValues>>();
  const [attachmentsFormMethods, setAttachmentsFormMethods] =
    useState<UseFormReturn<FieldValues>>();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [scheduledStatusId, setScheduledStatusId] = useState<number | undefined>(undefined);
  const [completedStatusId, setCompletedStatusId] = useState<number | undefined>(undefined);
  const [cancelledStatusId, setCancelledStatusId] = useState<number | undefined>(undefined);
  const [currentStatusId, setCurrentStatusId] = useState<number | undefined>(undefined);

  // Fetch MEETING_STATUS options to get scheduledStatusId and completedStatusId
  const { mutate: fetchMeetingStatus } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        const statusOptions = response.data || [];
        const scheduled = statusOptions.find(
          (opt: any) => opt.lookUpKey === iWorkLookUpValues.MEETING_STATUS_SCHEDULED,
        );
        const completed = statusOptions.find(
          (opt: any) => opt.lookUpKey === iWorkLookUpValues.MEETING_STATUS_COMPLETED,
        );
        const cancelled = statusOptions.find(
          (opt: any) => opt.lookUpKey === iWorkLookUpValues.MEETING_STATUS_CANCELLED,
        );
        
        if (scheduled) {
          setScheduledStatusId(scheduled.id);
        }
        if (completed) {
          setCompletedStatusId(completed.id);
        }
        if (cancelled) {
          setCancelledStatusId(cancelled.id);
        }
      },
      onError: () => {
        // Silently handle error
      },
    },
  });

  useEffect(() => {
    // Fetch on mount
    fetchMeetingStatus({
      endpoint: endPoints.lookUpByName("MEETING_STATUS"),
      method: "GET",
    });
  }, []);

  const { mutate, status } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(
          setToastMessage(
            editMode
              ? TaskMeetingNotesErrorMessages.MEETING_UPDATED_SUCCESS
              : TaskMeetingNotesErrorMessages.MEETING_CREATED_SUCCESS
          )
        );
        detailsFormMethods?.reset();
        linkFormMethods?.reset();
        attachmentsFormMethods?.reset();
        if (onCreated) onCreated();
        if (onCancel) onCancel();
      },
      onError: (error: unknown) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? TaskMeetingNotesErrorMessages.MEETING_FETCH_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const handleDelete = async () => {
    if (!initialData?.id) {
      setOpenDeleteModal(false);
      return;
    }
    const endpoint = `${endPoints.createMeetings}/${initialData.id}`;
    mutate(
      {
        endpoint,
        method: "DELETE",
        data: undefined,
      },
      {
        onSuccess: () => {
          dispatch(
            setToastMessage(
              TaskMeetingNotesErrorMessages.MEETING_DELETE_SUCCESS
            )
          );
          detailsFormMethods?.reset();
          linkFormMethods?.reset();
          attachmentsFormMethods?.reset();
          if (onCreated) onCreated();
          if (onCancel) onCancel();
          setOpenDeleteModal(false);
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            TaskMeetingNotesErrorMessages.MEETING_DELETE_ERROR ||
            "Failed to delete meeting";
          dispatch(setToastMessage(message));
          setOpenDeleteModal(false);
        },
      }
    );
  };

  // Set default values for edit or create
  //consoling the initial data to see what we have

  const iirmLocationId = useLookupIdByKey(iWorkLookUpValues.MEETING_LOCATION_IIRM);

  // Check if meeting end time has passed
  const isMeetingTimeExpired = useMemo(() => {
    if (!editMode || !initialData?.endTime || !initialData?.meetingDate) {
      return false;
    }
    const meetingDate = dayjs(initialData.meetingDate).format('YYYY-MM-DD');
    const endTime = initialData.endTime;
    let meetingEndDateTime = dayjs(`${meetingDate} ${endTime}`);
    // Past-midnight meetings store an end that sorts before their start, so the
    // end belongs to the next calendar day.
    const meetingStartDateTime = dayjs(`${meetingDate} ${initialData.startTime}`);
    if (meetingEndDateTime.isBefore(meetingStartDateTime)) {
      meetingEndDateTime = meetingEndDateTime.add(1, 'day');
    }
    const now = dayjs();
    const isExpired = now.isAfter(meetingEndDateTime);

    return isExpired;
  }, [editMode, initialData?.endTime, initialData?.startTime, initialData?.meetingDate]);

  const isStatusCompletedOrCancelled = useMemo(() => {
    return currentStatusId === completedStatusId || currentStatusId === cancelledStatusId;
  }, [currentStatusId, completedStatusId, cancelledStatusId]);

  const updateMeetingDetailsConfig = () => {
    return MeetingDetailsFields.map((field) => {
      // Disable Location for internal meetings
      if (isInternalMeetingSelected && field.key === LOCATION) {
        return {
          ...field,
          disabled: true,
        };
      }
      // Disable time fields, date and status when status is completed or cancelled
      if (isStatusCompletedOrCancelled && (field.key === MEETING_TIME || field.key === DATE || field.key === MEETING_STATUS_LID)) {
        return {
          ...field,
          disabled: true,
        };
      }
      return field;
    });
  };

  const defaultValues =
    editMode && initialData
      ? {
          // Meeting type
          meetingType: (initialData as any).meetingType?.id ?? "",
          // Subject
          subject: (initialData as any).meetingSubject ?? "",
          // Purpose (optional, if present in data)
          ...(typeof (initialData as any).meetingPurpose !== "undefined" &&
            (initialData as any).meetingPurpose !== null && {
              meetingPurpose: (initialData as any).meetingPurpose,
            }),
          // Date
          Date: (initialData as any).meetingDate ?? "",
          // Location
          Location: (initialData as any).locationType?.id ?? "",
          meetingStatusLid: (initialData as any).meetingStatus?.id ?? "",
          // DueDate (optional, if present in data)
          ...(typeof (initialData as any).dueDate !== "undefined" &&
            (initialData as any).dueDate !== null && {
              DueDate: (initialData as any).dueDate,
            }),
          // Agenda
          meetingAgenda: (initialData as any).meetingAgenda ?? "",
          // Company
          ...(typeof (initialData as any).company?.id !== "undefined" &&
            (initialData as any).company?.id !== null && {
              companyId: (initialData as any).company?.id,
            }),
          // Contact
          ...(typeof (initialData as any).contact?.id !== "undefined" &&
            (initialData as any).contact?.id !== null && {
              companyContact: (initialData as any).contact?.id,
            }),
          // Opportunity
          ...(typeof (initialData as any).opportunity?.id !== "undefined" &&
            (initialData as any).opportunity?.id !== null && {
              opportunityId: (initialData as any).opportunity?.id,
            }),
          // Activity
          ...(typeof (initialData as any).activity?.id !== "undefined" &&
            (initialData as any).activity?.id !== null && {
              activityId: (initialData as any).activity?.id,
            }),
          // Meeting status
          meetingStatus: (initialData as any).meetingStatus?.id ?? "",
          // Start/End time
          availableFrom: initialData.startTime,
          availableTo: initialData.endTime,
          // Employee participants
          ...(Array.isArray(
            (initialData as any).employeeParticipants?.employees
          ) &&
            (initialData as any).employeeParticipants.employees.length > 0 && {
              internalEmployee: (initialData as any).employeeParticipants
                .employees
                .filter((emp: any) => emp?.id !== undefined && emp?.id !== null),
            }),
          // TPA participants
          ...(typeof (initialData as any).tpaParticipants?.tpaId !==
            "undefined" &&
            (initialData as any).tpaParticipants?.tpaId !== null && {
              tpa: (initialData as any).tpaParticipants.tpaId,
              tpaContact:
                (initialData as any).tpaParticipants.tpaContactPerson ?? [],
            }),
          // Insurer participants
          ...(typeof (initialData as any).insurerParticipants?.insurerId !==
            "undefined" &&
            (initialData as any).insurerParticipants?.insurerId !== null && {
              insure: (initialData as any).insurerParticipants.insurerId,
              insureContact:
                (initialData as any).insurerParticipants.insurerContactPerson ??
                [],
            }),
          // Meeting docs/attachments
          ...(Array.isArray((initialData as any).meetingDocs) &&
            (initialData as any).meetingDocs.length > 0 && {
              attachments: (initialData as any).meetingDocs.map((doc: any) => ({
                documentId: doc.documentId,
                fileName: doc.fileName,
                documentTypeLid: doc.documentTypeLid,
                fileUpload: {
                  id: doc.documentId,
                  name: doc.fileName,
                },
              })),
            }),
          //Company participants - to prefill the data in edit mode
          ...(typeof (initialData as any).companyParticipants?.companyId !==
            "undefined" &&
            (initialData as any).companyParticipants?.companyId !== null && {
              companyId: (initialData as any).companyParticipants.companyId,
              companyContact:
                (initialData as any).companyParticipants.companyContactPerson ??
                [],
            }),
        }
      : {
          Date: dayjs().format("YYYY-MM-DD"), // Default to today
          meetingStatusLid: scheduledStatusId ?? "",
          // Handle pre-fill data from createTaskInitialData (non-edit mode)
          ...(initialData && !editMode && {
            ...(typeof (initialData as any).companyId !== "undefined" &&
              (initialData as any).companyId !== null && {
                companyId: (initialData as any).companyId,
              }),
            ...(typeof (initialData as any).opportunityId !== "undefined" &&
              (initialData as any).opportunityId !== null && {
                opportunityId: (initialData as any).opportunityId,
              }),
            ...(typeof (initialData as any).activityId !== "undefined" &&
              (initialData as any).activityId !== null && {
                activityId: (initialData as any).activityId,
              }),
            ...(typeof (initialData as any).meetingTypeLid !== "undefined" &&
              (initialData as any).meetingTypeLid !== null && {
                meetingType: (initialData as any).meetingTypeLid,
              }),
            ...(typeof (initialData as any).meetingSubject !== "undefined" &&
              (initialData as any).meetingSubject !== null && {
                subject: (initialData as any).meetingSubject,
              }),
          }),
        };

  // Ensure Status (meetingStatusLid) gets set after lookup ids resolve (create mode)
  useEffect(() => {
    if (editMode) return;
    if (!detailsFormMethods) return;
    if (!scheduledStatusId) return;
    const current = detailsFormMethods.getValues("meetingStatusLid");
    if (!current) {
      detailsFormMethods.setValue("meetingStatusLid", scheduledStatusId, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [editMode, scheduledStatusId, detailsFormMethods]);

  const hasRbacExportPermission = useSelector(selectHasPermission(FeatureKey.EXPORT_MEETING));
  const isExportAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacExportPermission;

  const meetingFormConfig = useMemo(() => {
    const docs = Array.isArray(initialData?.meetingDocs)
      ? initialData.meetingDocs
      : [];
    return MeetingFormFields.map((field) =>
      field.type === "documentupload"
        ? {
            ...field,
            componentProps: {
              ...(field.componentProps || {}),
              documents: docs,
              isDownloadAllowed: isExportAllowed,
            },
          }
        : field
    );
  }, [initialData, isExportAllowed]);

  const handleSubmit = async () => {
    // const docs = attachmentsFormMethods?.getValues("documents") || [];
    // attachmentsFormMethods?.setValue("attachments", docs);
    // Validate all forms
    const [isValidDetails, isValidLink, isValidAttachments] = await Promise.all(
      [
        detailsFormMethods?.trigger(),
        linkFormMethods?.trigger(),
        attachmentsFormMethods?.trigger(),
      ]
    );

    const isValid = isValidDetails;

    if (!isValid) {
      dispatch(
        setToastMessage(TaskMeetingNotesErrorMessages.MEETING_REQUIRED_FIELDS)
      );
      return;
    }

    // Get values from all forms
    const detailsData = detailsFormMethods?.getValues() || {};
    const linkData = linkFormMethods?.getValues() || {};
    const attachmentsData = attachmentsFormMethods?.getValues() || {};

    // Check if meeting end time is in the past for new meetings
    if (!editMode && detailsData.Date && detailsData.availableTo && completedStatusId) {
      const meetingDate = dayjs(detailsData.Date).format('YYYY-MM-DD');
      const endTime = detailsData.availableTo;
      let meetingEndDateTime = dayjs(`${meetingDate} ${endTime}`);
      // A meeting running past midnight stores an end time that sorts before its
      // start (11:45 PM -> 12:15 AM), so it belongs to the next calendar day.
      const meetingStartDateTime = dayjs(
        `${meetingDate} ${detailsData.availableFrom}`
      );
      if (meetingEndDateTime.isBefore(meetingStartDateTime)) {
        meetingEndDateTime = meetingEndDateTime.add(1, "day");
      }
      const now = dayjs();
      if (now.isAfter(meetingEndDateTime)) {
        // Auto-set status to completed for past meetings
        detailsData.meetingStatusLid = completedStatusId;
      }
    }

    // Merge all form data into one payload
    const formData = { ...detailsData, ...linkData, ...attachmentsData };

    // Filter out deleted attachments: only include those currently in the attachments field
    let filteredAttachments = [];
    if (Array.isArray(attachmentsData.attachments)) {
      // Log the IDs of all attachments currently in the form
      const attachmentIds = attachmentsData.attachments.map((att: any) => {
        if (att?.documentId) return att.documentId;
        if (att?.fileUpload?.id) return att.fileUpload.id;
        return null;
      });
      filteredAttachments = attachmentsData.attachments.filter((att: any) => {
        // Only keep attachments that have a documentId or fileUpload.id (i.e., not deleted)
        return att && (att.documentId || (att.fileUpload && att.fileUpload.id));
      });
    }

    const meetingDate = formData.Date
      ? dayjs(formData.Date).format("YYYY-MM-DD")
      : undefined;

    // Transform internalEmployee array to employeeParticipants object if present
    const employeeParticipants =
      Array.isArray(formData.internalEmployee) &&
      formData.internalEmployee.length > 0
        ? {
            employees: formData.internalEmployee.map((emp: any) =>
              typeof emp === 'object' && emp !== null
                ? (emp?.value ?? emp?.id ?? emp?.userId ?? emp)
                : emp
            )
          }
        : undefined;

    const extractId = (c: any): number =>
      typeof c === 'object' && c !== null ? (c?.value ?? c?.id ?? c) : c;

    // Transform TPA participants
    const tpaParticipants = formData.tpa
      ? {
          tpaId: formData.tpa,
          tpaContactPerson: Array.isArray(formData.tpaContact)
            ? formData.tpaContact.map(extractId)
            : [],
        }
      : undefined;

    // Transform Insurer participants
    const insurerParticipants = formData.insure
      ? {
          insurerId: formData.insure,
          insurerContactPerson: Array.isArray(formData.insureContact)
            ? formData.insureContact.map(extractId)
            : [],
        }
      : undefined;

    // Transform Company participants
    const companyParticipants = linkData.companyId
      ? {
          companyId: linkData.companyId,
          companyContactPerson: Array.isArray(linkData.companyContact)
            ? linkData.companyContact.map(extractId)
            : [],
        }
      : undefined;

    let location = {};
    if (detailsData.Location != "") {
      location = {
        locationTypeLid: detailsData.Location,
      };
    }
    let payload = {};
    if (isInternalMeetingSelected) {
      payload = {
        meetingTypeLid: detailsData.meetingType,
        meetingDate: detailsData.Date,
        startTime: detailsData.availableFrom,
        endTime: detailsData.availableTo,
        ...location,
        meetingStatusLid: detailsData.meetingStatusLid,
        meetingSubject: detailsData.subject?.trim(),
        meetingAgenda: detailsData.meetingAgenda?.trim(),
        ...(employeeParticipants ? { employeeParticipants } : {}),
        companyParticipants: {},
        tpaParticipants: {},
        insurerParticipants: {},
        companyId: null,
        opportunityId: null,
        activityId: null,
        documents: filteredAttachments.length
          ? filteredAttachments
              .map((att: any) => {
                if (att.documentId) {
                  return { documentId: att.documentId };
                } else if (att.fileUpload && att.fileUpload.id) {
                  return { documentId: att.fileUpload.id };
                }
                return null;
              })
              .filter(Boolean)
          : [],
      };
    } else {
      payload = {
        meetingTypeLid: detailsData.meetingType,
        meetingDate: detailsData.Date,
        startTime: detailsData.availableFrom,
        endTime: detailsData.availableTo,
        ...location,
        meetingStatusLid: detailsData.meetingStatusLid,
        meetingSubject: detailsData.subject?.trim(),
        meetingAgenda: detailsData.meetingAgenda?.trim(),
       ...(formData.companyId ? { companyId: formData.companyId } : { companyId: null }),
        ...(formData.opportunityId
          ? { opportunityId: formData.opportunityId }
          : { opportunityId: null }),
        ...(formData.activityId ? { activityId: formData.activityId } : { activityId: null }),
        ...(tpaParticipants ? { tpaParticipants } : {}),
        ...(insurerParticipants ? { insurerParticipants } : {}),
        ...(companyParticipants ? { companyParticipants } : {}),
        ...(employeeParticipants ? { employeeParticipants } : {}),
        documents: filteredAttachments.length
          ? filteredAttachments
              .map((att: any) => {
                if (att.documentId) {
                  return { documentId: att.documentId };
                } else if (att.fileUpload && att.fileUpload.id) {
                  return { documentId: att.fileUpload.id };
                }
                return null;
              })
              .filter(Boolean)
          : [],
      };
    }

    //log the payload to see what we are sending
    const endpoint =
      editMode && initialData?.id
        ? `${endPoints.createMeetings}/${initialData.id}`
        : endPoints.createMeetings;
    const method = editMode ? "PUT" : "POST";
    mutate({ endpoint, method, data: payload });
  };

  const [meetingTypeLid, setMeetingType] = useState<number | null>(null);
  const internalMeetingId = useLookupIdByKey(
    LookUpValues.MEETING_TYPE_INTERNAL
  );
  useEffect(() => {
    if (detailsFormMethods) {
      const subscription = detailsFormMethods.watch((value, { name }) => {
        if (name === "meetingType") {
          setMeetingType(value.meetingType || null);

          if (value.meetingType === internalMeetingId) {
            detailsFormMethods.setValue("Location", iirmLocationId, {
              shouldValidate: true,
              shouldDirty: true,
            });
          } else {
            detailsFormMethods.setValue("Location", null, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [detailsFormMethods, internalMeetingId, iirmLocationId]);

  useEffect(() => {
    if (editMode && initialData?.meetingType?.id) {
      setMeetingType(initialData.meetingType.id);
    }
    if (editMode && initialData?.meetingStatus?.id) {
      setCurrentStatusId(initialData.meetingStatus.id);
    }
  }, [editMode, initialData]);

  const isInternalMeetingSelected = meetingTypeLid === internalMeetingId;

  useEffect(() => {
    if (isInternalMeetingSelected && linkFormMethods) {
      const linkData = linkFormMethods?.getValues() || {};

      linkFormMethods?.reset({
        internalEmployee: linkData.internalEmployee || [],
      });
    }
  }, [isInternalMeetingSelected, linkFormMethods]);

  // Utility to pick only relevant keys for each form
  const pickFields = (fields: string[], values: Record<string, any>) =>
    fields.reduce((acc, key) => {
      if (key in values) acc[key] = values[key];
      return acc;
    }, {} as Record<string, any>);

  // Get keys for each form from config
  // For timerange fields, we need to extract fromName and toName instead of the key
  const detailsKeys = MeetingDetailsFields.flatMap(f => {
    if (f.type === TIME_RANGE) {
      return [f.fromName, f.toName].filter((name): name is string => Boolean(name));
    }
    return f.key;
  });
  const linkKeys = (isInternalMeetingSelected
      ? MeetingLinkingAndParticipantsFields_ForInternalMeeting(isFromOptyActivityPage)
      : MeetingLinkingAndParticipantsFields(isFromOptyActivityPage, isOnOpportunityPage)
  ).flatMap(f => {
    if (f.type === TIME_RANGE) {
      return [f.fromName, f.toName].filter((name): name is string => Boolean(name));
    }
    return f.key;
  });
  const attachmentsKeys = MeetingFormFields.map(f => f.key);

  // Split default values
  const detailsDefaultValues = pickFields(detailsKeys, defaultValues);
  const linkDefaultValues = pickFields(linkKeys, defaultValues);
  const attachmentsDefaultValues = pickFields(attachmentsKeys, defaultValues);

  // Reset forms when in edit mode and initial data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editMode && initialData && detailsFormMethods && linkFormMethods && attachmentsFormMethods) {
      const statusToSet = isMeetingTimeExpired && completedStatusId 
        ? completedStatusId 
        : (detailsDefaultValues.meetingStatusLid ?? scheduledStatusId ?? "");
      
      detailsFormMethods.reset({
        ...detailsDefaultValues,
        meetingStatusLid: statusToSet,
      });
      linkFormMethods.reset(linkDefaultValues);
      attachmentsFormMethods.reset(attachmentsDefaultValues);
    }
    // Dependencies tracked via initialData?.id to avoid infinite loops from derived values
  }, [editMode, initialData?.id, detailsFormMethods, linkFormMethods, attachmentsFormMethods, isMeetingTimeExpired, completedStatusId, scheduledStatusId]);

  // Auto-update meeting status to completed when time expires
  useEffect(() => {
    if (
      editMode &&
      initialData?.id &&
      isMeetingTimeExpired &&
      completedStatusId &&
      initialData?.meetingStatus?.id !== completedStatusId
    ) {
      // Only update if current status is not already completed
      const payload = {
        meetingStatusLid: completedStatusId,
      };
      
      mutate(
        {
          endpoint: `${endPoints.createMeetings}/${initialData.id}`,
          method: "PUT",
          data: payload,
        },
        {
          onSuccess: () => {
            if (refetchMeeting) {
              refetchMeeting();
            }
          },
          onError: () => {
            // Silently handle error
          },
        }
      );
    }
  }, [editMode, initialData?.id, isMeetingTimeExpired, completedStatusId, initialData?.meetingStatus?.id, mutate, refetchMeeting]);

  return (
    <MainFormBox>
      {isCompleted && (
        <SectionBox>
          <SectionTitle variant="h5">{FEEDBACK}</SectionTitle>
          <TasksFormContainer>
            <FeedbackOuterBox>
              {[
                {
                  label: MEETING_FEEDBACK_DISPLAY_LABELS.RATING,
                  value: (
                    <Rating value={initialData?.meetingRating ?? 0} readOnly />
                  ),
                },
                {
                  label: MEETING_FEEDBACK_DISPLAY_LABELS.MEETING_OUTCOME,
                  value:
                    Array.isArray(initialData?.meetingOutcomes) &&
                    initialData.meetingOutcomes.length > 0
                      ? initialData.meetingOutcomes
                          .map((outcome: any) => outcome.value)
                          .join(", ")
                      : "-",
                },
                {
                  label: MEETING_FEEDBACK_DISPLAY_LABELS.CHALLENGES_FACED,
                  value:
                    Array.isArray(initialData?.meetingChallenges) &&
                    initialData.meetingChallenges.length > 0
                      ? initialData.meetingChallenges
                          .map((challenge: any) => challenge.value)
                          .join(", ")
                      : "-",
                },
                {
                  label: MEETING_FEEDBACK_DISPLAY_LABELS.NEXT_STEPS,
                  value:
                    Array.isArray(initialData?.meetingNextSteps) &&
                    initialData.meetingNextSteps.length > 0
                      ? initialData.meetingNextSteps
                          .map((step: any) => step.value)
                          .join(", ")
                      : "-",
                },
                {
                  label: MEETING_FEEDBACK_DISPLAY_LABELS.REMARKS,
                  value: initialData?.remarks ?? "-",
                },
              ].map((field, index) => (
                <FeedbackInnerBox key={index}>
                  <MeetingFeedbackLabel variant="body2">
                    {field.label}
                  </MeetingFeedbackLabel>
                  <MeetingFeedbackValue variant="body2">
                    {field.value}
                  </MeetingFeedbackValue>
                </FeedbackInnerBox>
              ))}
            </FeedbackOuterBox>
          </TasksFormContainer>
        </SectionBox>
      )}

      <SectionBox>
        <SectionTitle variant="h5">{MEETING_DETAILS}</SectionTitle>
        <TasksFormContainer>
          <DynamicForm
            formConfig={updateMeetingDetailsConfig()}
            formMethods={setDetailsFormMethods}
            defaultValues={{
              ...detailsDefaultValues,
              // Ensure prefill when lookup id resolves
              meetingStatusLid:
                detailsDefaultValues?.meetingStatusLid ?? scheduledStatusId ?? "",
            }}
            shouldReset={!editMode && Boolean(scheduledStatusId)}
          />
        </TasksFormContainer>
      </SectionBox>

      <SectionBox>
        <SectionTitle variant="h5">{`${MEETING_LINKS} and ${MEETING_PARTICIPANTS}`}</SectionTitle>
        <TasksFormContainer>
          <DynamicForm
            formConfig={
              isInternalMeetingSelected
                ? MeetingLinkingAndParticipantsFields_ForInternalMeeting(isFromOptyActivityPage)
                : MeetingLinkingAndParticipantsFields(isFromOptyActivityPage, isOnOpportunityPage)
            }
            formMethods={setLinkFormMethods}
            defaultValues={linkDefaultValues}
          />
        </TasksFormContainer>
      </SectionBox>

      <SectionBox>
        <SectionTitle variant="h5">{MEETING_ATTACHMENTS}</SectionTitle>
        <TasksFormContainer>
          <DynamicForm
            formConfig={meetingFormConfig}
            formMethods={setAttachmentsFormMethods}
            defaultValues={attachmentsDefaultValues}
            disableAllFields={isCompleted || isFeedbackSubmitted}
          />
        </TasksFormContainer>
      </SectionBox>

      <MeetingNotesButtonPanel>
        <StyledButton1
          variantType={editMode ? "danger" : "secondary"}
          onClick={editMode ? () => setOpenDeleteModal(true) : onCancel}
          data-testid={editMode ? "delete-button" : "cancel-button"}
          loadingPosition="start"
          className="button"
        >
          {editMode ? DELETE : CANCEL_BUTTON}
        </StyledButton1>
        <StyledButton1
          variantType="primary"
          onClick={handleSubmit}
          loading={status === "pending"}
          data-testid="create-button"
          loadingPosition="center"
          className="button"
          disabled={status === "pending"}
        >
          {editMode ? UPDATE : CREATE}
        </StyledButton1>
      </MeetingNotesButtonPanel>
      {/* Delete Confirmation Modal */}
      <CustomModal
        open={openDeleteModal}
        handleClose={() => setOpenDeleteModal(false)}
        heading="Delete Meeting"
        disablePortal={true}
        buttons={[
          {
            label: CANCEL,
            onClick: () => setOpenDeleteModal(false),
            variant: "secondary",
          },
          {
            label: DELETE,
            onClick: handleDelete,
            variant: "primary",
          },
        ]}
      >
        {TaskMeetingNotesErrorMessages.MEETING_DELETE_CONFIRMATION}
      </CustomModal>
    </MainFormBox>
  );
};

export default MeetingForm;

import React, { useEffect, useMemo, useRef, useState } from "react";
import SupportBanner from "../../components/SupportBanner";
import SupportFormSection from "../../common/SupportFormSection";
import { useForm } from "react-hook-form";
import {
  getTicketRaiseFormConfig,
  getInitialTicketRaiseData,
} from "./formConfig";
import { TICKET_RAISE_FORM_CONFIG, initialTicketRaiseData } from "./formConfig";
import {
  SupportContentLeftSection,
  SupportPageContainer,
  SupportContentRightSection,
  SupportContentWrapper,
  SupportRightSectionWrapper,
  SupportTicketRaiseContainer,
  SupportTicketSearchContainer,
  SupportSectionQuickLinksContainer,
} from "./styles";
import TicketSearchSection, { TicketDetailPanel, Ticket } from "../../common/TicketSearchSection";
import SupportImage from "../../../assets/svgs/support-ticket-raise-image.svg";
import FaqPage from "../FaqPage";
import ContactMatrixPage from "../ContactMatrix";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import { fetchCompanyTemplate } from "../../redux/companyTemplateSlice";
import { LandingHeader } from "../../components/landing/LandingHeader";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";
import { apiRequest, endPoints } from "@ui/ui-lib";

const SupportPage = () => {
  const dispatch = useDispatch();
  const isAuthenticated = Boolean(sessionStorage.getItem("user"));
  const { companyId } = useCompanyConfig();
  const supportFormRef = useRef<HTMLDivElement>(null);
  const [ticketFormMethods, setTicketFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  // Generate dynamic form config and initial data
  const formConfig = getTicketRaiseFormConfig();
  const initialData = getInitialTicketRaiseData();

  const getSubdomain = (): string => {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    return parts.length > 1 ? parts[0] : hostname;
  };

  // Function to fetch employee tickets — only when authenticated
  const fetchEmployeeTickets = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingTickets(true);
      const userSession = sessionStorage.getItem("user");
      const userData = userSession ? JSON.parse(userSession) : null;
      const employeeId = userData?.employeeId || userData?.id;

      if (employeeId) {
        const response = await apiRequest(endPoints.getRaiseTickets(employeeId), { method: "GET" });
        if (response?.data?.data) {
          setTickets(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleCancel = () => {
    const freshInitialData = getInitialTicketRaiseData();
    ticketFormMethods?.reset(freshInitialData);
    // Force clear document upload component
    ticketFormMethods?.setValue("attachments", []);
    // Trigger form validation reset
    ticketFormMethods?.clearErrors();
  };

  // Function to create activity log for ticket raising
  const createTicketActivityLog = async (ticketData) => {
    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "TICKET_RAISED",
          activityCategory: "SUPPORT",
          referenceId: ticketData.id || ticketData.ticketId,
          referenceType: "TICKET",
          metadata: {
            ticketId: ticketData.ticketId,
            category: ticketData.category,
            status: ticketData.status,
            activityText: `Support ticket raised - ${ticketData.ticketId} (${ticketData.category})`,
            ticketCategory: ticketData.category,
          },
        },
      });
      console.log("Ticket activity log created successfully");
    } catch (error) {
      console.error("Failed to create ticket activity log", error);
    }
  };

  const handleSubmit = async () => {
    if (ticketFormMethods) {
      // Use handleSubmit to trigger form validation first
      ticketFormMethods.handleSubmit(async (formData) => {
        try { 

          // Get employee ID and email from session storage
          const userSession = sessionStorage.getItem("user");
          const userData = userSession ? JSON.parse(userSession) : null;
          const employeeId = userData?.employeeId || userData?.id;
          const sessionEmail = userData?.email || userData?.emailId || null;

          // Resolve the email that will receive the confirmation
          const confirmationEmail = sessionEmail || formData.mailId;

          // Prepare API payload
          const extractedDocumentIds = Array.isArray(formData.attachments) ?
            formData.attachments.map(doc => doc.documentId).filter(Boolean) : [];

          const ticketPayload = {
            category: formData.category,
            mailId: formData.mailId || sessionEmail,
            escalationDescription: formData.escalationDescription.trim(),
            documentIds: extractedDocumentIds
          };

          // Call API to create ticket
          const createTicketEndpoint = employeeId
            ? endPoints.createRaiseTicket(employeeId)
            : endPoints.createRaiseTicketPublic;

          const response = await apiRequest(createTicketEndpoint, {
            method: "POST",
            data: ticketPayload,
          });

          const createdTicket = response?.data?.data || response?.data;

          if (createdTicket?.ticketId) {
            const emailNote = confirmationEmail ? ` Confirmation email sent to ${confirmationEmail}.` : "";
            dispatch(
              setToastMessage(
                `Ticket raised successfully. Ticket ID: ${createdTicket.ticketId}.${emailNote}`,
              ),
            );

            // Send ticket raised confirmation email via dedicated endpoint
            if (confirmationEmail) {
              apiRequest(endPoints.supportTicketConfirmation, {
                method: "POST",
                data: {
                  ...(employeeId ? { employeeId } : { mailId: confirmationEmail }),
                  ticketId: createdTicket.ticketId,
                  category: formData.category || "General",
                  ...(formData.escalationDescription?.trim() ? { description: formData.escalationDescription.trim() } : {}),
                  ...(extractedDocumentIds.length > 0 ? { documentIds: extractedDocumentIds } : {}),
                },
              }).catch(() => {});
            }

            // Create activity log for ticket raising
            const ticketActivityData = {
              id: createdTicket.id,
              ticketId: createdTicket.ticketId,
              category: formData.category,
              status: createdTicket.status || 'open',
            };
            if (employeeId) {
              await createTicketActivityLog(ticketActivityData);
            }
            
            // Reset form and clear documents
            const freshInitialData = getInitialTicketRaiseData();
            ticketFormMethods.reset({ ...freshInitialData, attachments: [] });
            setIsFormSubmitted(true);
            
            // Fetch updated tickets list
            await fetchEmployeeTickets();
          } else {
            console.error("Invalid API response format:", response);
            throw new Error("Invalid response format");
          }

        } catch (error) {
          console.error("Error creating ticket:", error);
          console.error("Error details:", error.response || error.message || error);
          dispatch(setToastMessage("Failed to raise ticket. Please try again."));
        }
      }, (errors) => {
        console.error("Form validation failed:", errors);
        dispatch(setToastMessage("Please fill all required fields correctly."));
      })();
    }
  };

  const raiseTicketFormConfig = useMemo(() => {
    const freshInitialData = getInitialTicketRaiseData();
    // Force empty documents when form is submitted to clear uploads
    const docs = isFormSubmitted 
      ? [] 
      : Array.isArray(freshInitialData?.attachments)
        ? freshInitialData.attachments
        : [];
        
    return formConfig.map((field) =>
      field.type === "documentupload"
        ? {
            ...field,
            componentProps: {
              ...(field.componentProps || {}),
              documents: docs,
              key: isFormSubmitted ? `cleared-${Date.now()}` : 'normal', // Force re-render when clearing
            },
          }
        : field
    );
  }, [initialData, isFormSubmitted]);

  // Allow copy-paste in this page by neutralising the common component's paste block
  useEffect(() => {
    const el = supportFormRef.current;
    if (!el) return;
    const allowPaste = (e: ClipboardEvent) => {
      e.preventDefault = () => {};
    };
    el.addEventListener("paste", allowPaste, true);
    return () => el.removeEventListener("paste", allowPaste, true);
  }, []);

  useEffect(() => {
    const resolvedCompanyId = Number(companyId);
    if (!Number.isFinite(resolvedCompanyId) || resolvedCompanyId <= 0) return;
    dispatch(fetchCompanyTemplate(resolvedCompanyId));
  }, [dispatch, companyId]);

  // Load employee tickets when component mounts
  useEffect(() => {
    fetchEmployeeTickets();
  }, []);

  // Scroll to ticket detail panel when a ticket is selected
  useEffect(() => {
    if (selectedTicket && detailPanelRef.current) {
      const NAVBAR_HEIGHT = 80;
      const y = detailPanelRef.current.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [selectedTicket]);

  // Auto-refresh tickets when form is submitted successfully
  useEffect(() => {
    if (isFormSubmitted) {
      // Reset the form submitted flag after a short delay to allow document clearing
      const timer = setTimeout(() => setIsFormSubmitted(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isFormSubmitted]);

  return (
    <SupportPageContainer>
      <SupportBanner withHeaderOffset={isAuthenticated} />
      <SupportContentWrapper>
        <SupportContentLeftSection>
          <SupportSectionQuickLinksContainer>
            {/* <SupportSectionHeader image={QuickLinksImage} text="Quick Links" /> */}
            <FaqPage isPadding={false} />
          </SupportSectionQuickLinksContainer>
          <div ref={supportFormRef}>
            <SupportFormSection
              image={SupportImage}
              headerText="Raise Ticket"
              formConfig={raiseTicketFormConfig}
              defaultValues={initialData}
              setFormMethods={setTicketFormMethods}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              containerComponent={SupportTicketRaiseContainer}
            />
          </div>
          {isAuthenticated && (
            <SupportTicketSearchContainer>
              <TicketSearchSection
                tickets={tickets}
                loading={loadingTickets}
                selectedTicketId={selectedTicket?.id ?? selectedTicket?.ticketId ?? null}
                onTicketSelect={setSelectedTicket}
              />
            </SupportTicketSearchContainer>
          )}
          {/* <SupportFormSection
            image={ScheduleCallbackIcon}
            headerText="Schedule Call Back"
            formConfig={SCHEDULE_CALLBACK_FORM_CONFIG}
            defaultValues={initialScheduleCallbackData}
            setFormMethods={setCallbackFormMethods}
            onCancel={handleCallbackCancel}
            onSubmit={handleCallbackSubmit}
            containerComponent={SupportSheduleCallbackContainer}
          /> */}
          {/* <SupportRecentRequestContainer>
            <SupportSectionHeader
              image={RecentRequestImage}
              text="Recent Request"
            />
            {SUPPORT_REQUEST_DATA.map((request, index) => (
              <SupportRequestComponent key={index} data={request} showResubmitButton={true}/>
            ))}
          </SupportRecentRequestContainer> */}
        </SupportContentLeftSection>
        <SupportContentRightSection>
          <SupportRightSectionWrapper>
            <ContactMatrixPage />
          </SupportRightSectionWrapper>
          {selectedTicket && (
            <div ref={detailPanelRef}>
              <TicketDetailPanel
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
              />
            </div>
          )}
        </SupportContentRightSection>
      </SupportContentWrapper>
    </SupportPageContainer>
  );
};

export default SupportPage;

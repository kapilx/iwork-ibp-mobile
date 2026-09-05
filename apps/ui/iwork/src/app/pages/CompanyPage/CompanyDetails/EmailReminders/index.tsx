import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";
import {
  ChipRenderer,
  Button,
  useApiQuery,
  useApiMutation,
  HTTP_METHODS,
  endPoints,
  setToastMessage,
} from "@ui/ui-lib";

interface ReminderConfigState {
  installmentReminderDays: number[];
  policyExpiryReminderDays: number[];
  opportunityCloseToExpiryReminderDays: number[];
}

const DEFAULT_REMINDER_CONFIG: ReminderConfigState = {
  installmentReminderDays: [],
  policyExpiryReminderDays: [],
  opportunityCloseToExpiryReminderDays: [],
};

interface EmailRemindersProps {
  companyId?: string | number;
}

export const EmailReminders: React.FC<EmailRemindersProps> = ({ companyId }) => {
  const dispatch = useDispatch();
  const [reminderConfig, setReminderConfig] = useState<ReminderConfigState>(
    DEFAULT_REMINDER_CONFIG
  );
  const [dayInputs, setDayInputs] = useState<Record<keyof ReminderConfigState, string>>({
    installmentReminderDays: "",
    policyExpiryReminderDays: "",
    opportunityCloseToExpiryReminderDays: "",
  });

  const { data, isLoading, refetch } = useApiQuery({
    url: companyId ? endPoints.companyReminderConfigByCompanyId(companyId) : "",
    queryKey: ["company-reminder-config", companyId],
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    const responseData = (data as any)?.data ?? data;
    if (responseData) {
      setReminderConfig({
        installmentReminderDays: responseData.installmentReminderDays ?? [],
        policyExpiryReminderDays: responseData.policyExpiryReminderDays ?? [],
        opportunityCloseToExpiryReminderDays:
          responseData.opportunityCloseToExpiryReminderDays ?? [],
      });
    }
  }, [data]);

  const { mutateAsync: saveReminderConfig, isPending: isSaving } = useApiMutation({
    config: {
      onSuccess: () =>
        dispatch(setToastMessage("Reminder settings saved successfully.")),
      onError: (error: any) => {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? "Something went wrong.";
        dispatch(setToastMessage(message));
      },
    },
  });

  const handleRemoveDay = (key: keyof ReminderConfigState, day: number) => {
    setReminderConfig((prev) => ({
      ...prev,
      [key]: prev[key].filter((value) => value !== day),
    }));
  };

  const handleAddDay = (key: keyof ReminderConfigState) => {
    const raw = dayInputs[key].trim();
    const parsed = Number(raw);
    if (!raw || !Number.isInteger(parsed) || parsed < 0 || parsed > 90) {
      return;
    }
    setDayInputs((prev) => ({ ...prev, [key]: "" }));
    if (reminderConfig[key].includes(parsed)) {
      return;
    }
    setReminderConfig((prev) => ({
      ...prev,
      [key]: [...prev[key], parsed].sort((a, b) => a - b),
    }));
  };

  const handleSave = async () => {
    if (!companyId) return;
    await saveReminderConfig({
      endpoint: endPoints.updateCompanyReminderConfig(companyId),
      method: HTTP_METHODS.PUT as "PUT",
      data: reminderConfig,
    });
    await refetch();
  };

  const renderDaysPicker = (
    key: keyof ReminderConfigState,
    label: string,
    description: string
  ) => (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 1.5 }}>
        {description}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        {reminderConfig[key].length === 0 ? (
          <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
            No reminder days configured
          </Typography>
        ) : (
          reminderConfig[key].map((day) => (
            <ChipRenderer
              key={day}
              value={`${day} day${day !== 1 ? "s" : ""}`}
              onDelete={() => handleRemoveDay(key, day)}
            />
          ))
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          size="small"
          type="number"
          placeholder="e.g. 5"
          value={dayInputs[key]}
          onChange={(e) =>
            setDayInputs((prev) => ({ ...prev, [key]: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddDay(key);
            }
          }}
          inputProps={{ min: 0, max: 90 }}
          sx={{ width: 120 }}
        />
        <Button variantType="addButton" label="Add" onClick={() => handleAddDay(key)} />
      </Box>
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 640 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", mb: 0.5 }}>
        Automated Email Reminders
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 3 }}>
        Configure how many days before each event this company's reminder emails
        should be sent.
      </Typography>

      {renderDaysPicker(
        "installmentReminderDays",
        "Installment Due Reminder",
        "Send a reminder email this many days before an installment is due."
      )}
      {renderDaysPicker(
        "policyExpiryReminderDays",
        "Policy Expiry Reminder",
        "Send a reminder email this many days before a policy expires."
      )}
      {renderDaysPicker(
        "opportunityCloseToExpiryReminderDays",
        "Opportunity Close-to-Expiry Reminder",
        "Notify the owner this many days before an opportunity expires."
      )}

      <Button
        variantType="primary"
        label="Save"
        onClick={handleSave}
        disabled={isSaving}
        sx={{ mt: 2 }}
      />
    </Box>
  );
};

export default EmailReminders;

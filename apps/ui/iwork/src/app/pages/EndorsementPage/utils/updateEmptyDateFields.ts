import dayjs from "dayjs";

// Utility to update date fields if empty
export const updateEmptyDateFields = (
  data: Record<string, any>
): Record<string, any> => {
  const today = dayjs().format("YYYY-MM-DD");

  // Define which fields we want to patch
  const dateFields: Record<string, string[]> = {
    endorsementRequestReceived: ["endorsementRequestReceivedDate"],
    createEndorsement: ["endorsementCreatedDate"],
    sendEndorsementToInsurer: ["insurerCommunicationDate"],
    receiveInsurerAcknowledgement: ["acknowdgementDate"],
    clientConfirmation: ["clientConfirmationDate"],
    tpaIdUpload: ["tpaIdUploadDate"],
  };

  // Deep copy using structuredClone (browser/Node 17+)
  // If unavailable, fallback to JSON clone
  const updatedData =
    typeof structuredClone === "function"
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data));

  Object.entries(dateFields).forEach(([stepKey, fields]) => {
    const step = updatedData[stepKey];
    if (!step?.data) return;

    fields.forEach((field) => {
      for (const section of Object.values(step.data)) {
        if (
          section &&
          typeof section === "object" &&
          field in section &&
          (section[field] === "" || section[field] === null)
        ) {
          section[field] = today;
        }
      }
    });
  });

  return updatedData;
};

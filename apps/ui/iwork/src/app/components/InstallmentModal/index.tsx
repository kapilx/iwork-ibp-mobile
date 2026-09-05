import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { CustomModal, DynamicForm, useApiMutation, HTTP_METHODS, endPoints, setToastMessage } from "@ui/ui-lib";
import { installmentFormConfig } from "./config";

interface InstallmentData {
  id?: number;
  installmentNo?: number;
  insurerEndorsementNumber?: string;
  installmentDate?: string;
  totalInstallmentAmount?: number; // Total Installment Amount (Net Premium + Other Amount)
  installmentPercentage?: number; // API mapping: installmentPercentage -> Premium %
  installmentNetAmount?: number; // API mapping: installmentNetAmount -> Premium amount
  premiumCollectionDate?: string;
  premiumCollectedAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  collectedGrossAmount?: number;
  transactionMode?: string;
  invoiceNo?: string;
  transactionChequeNumber?: string;
  bankName?: string;
  directDebitCharges?: number;
  transferFees?: number;
  netPayable?: number;
  status?: string;
  attachment?: File | null;
  transactionType?: string;
  sourceFile?: {
    id: number;
    fileName: string;
    fileSize?: number;
  } | null;
}

interface InstallmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  policyId: number;
  editData?: InstallmentData | null;
  isEdit?: boolean;
  premiumAndBrokerageDetails?: {
    netPremium?: string | number | null;
    otherAmount?: string | number | null;
  } | null;
}

const parseCurrencyValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const InstallmentModal: React.FC<InstallmentModalProps> = ({
  open,
  onClose,
  onSuccess,
  policyId,
  editData = null,
  isEdit = false,
  premiumAndBrokerageDetails = null,
}) => {
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const isAutoCalculatingRef = useRef(false);
  const dispatch = useDispatch();

  // Create installment mutation
  const { mutate: createInstallment, isPending: isCreating } = useApiMutation({
    config: {
      onSuccess: (response) => {
        dispatch(setToastMessage({
          type: 'success',
          message: `Installment ${isEdit ? 'updated' : 'added'} successfully`
        }));
        formMethods?.reset();
        onSuccess(); // Refresh table data
        onClose(); // Close modal
      },
      onError: (error) => {
        dispatch(setToastMessage({
          type: 'error',
          message: `Failed to ${isEdit ? 'update' : 'add'} installment`
        }));
        console.error('Failed to save installment:', error);
      }
    }
  });

  // Auto-calculation for collected gross amount
  const calculateCollectedGrossAmount = useCallback((premiumCollectedAmount: number, taxAmount: number) => {
    if (premiumCollectedAmount === null || premiumCollectedAmount === undefined) return null;
    if (taxAmount === null || taxAmount === undefined) return premiumCollectedAmount;
    return premiumCollectedAmount + taxAmount;
  }, []);

  // Auto-calculation for premium percentage based on total installment amount
  const calculatePremiumPercentage = useCallback((totalAmount: number, premiumAmount: number) => {
    if (totalAmount === null || totalAmount === undefined || totalAmount === 0) return null;
    if (premiumAmount === null || premiumAmount === undefined) return null;
    return (premiumAmount / totalAmount) * 100;
  }, []);

  // Auto-calculation for premium amount based on total installment amount and percentage
  const calculatePremiumAmount = useCallback((totalAmount: number, percentage: number) => {
    if (totalAmount === null || totalAmount === undefined) return null;
    if (percentage === null || percentage === undefined) return null;
    return (totalAmount * percentage) / 100;
  }, []);

  // Auto-calculation for tax amount based on percentage
  const calculateTaxAmount = useCallback((premiumCollectedAmount: number, taxPercentage: number) => {
    if (premiumCollectedAmount === null || premiumCollectedAmount === undefined) return null;
    if (taxPercentage === null || taxPercentage === undefined) return null;
    return (premiumCollectedAmount * taxPercentage) / 100;
  }, []);

  // Auto-calculation for tax percentage based on amount
  const calculateTaxPercentage = useCallback((premiumCollectedAmount: number, taxAmount: number) => {
    if (premiumCollectedAmount === null || premiumCollectedAmount === undefined || premiumCollectedAmount === 0) return null;
    if (taxAmount === null || taxAmount === undefined) return null;
    return (taxAmount / premiumCollectedAmount) * 100;
  }, []);

  // Watch for changes and trigger auto-calculations
  useEffect(() => {
    if (!formMethods) return;

    const subscription = formMethods.watch((values, { name }) => {
      if (!name || isAutoCalculatingRef.current) return;

      const totalInstallmentAmount = parseFloat(values.totalInstallmentAmount) || 0;
      const installmentPercentage = parseFloat(values.installmentPercentage) || 0;
      const installmentNetAmount = parseFloat(values.installmentNetAmount) || 0;
      const premiumCollectedAmount = parseFloat(values.premiumCollectedAmount) || 0;
      const taxPercentage = parseFloat(values.taxPercentage) || 0;
      const taxAmount = parseFloat(values.taxAmount) || 0;

      isAutoCalculatingRef.current = true;

      // Use setTimeout to ensure all setValue calls complete and gross amount is calculated with latest values
      setTimeout(() => {
        try {
          // Calculate premium percentage and amount from total installment amount
          if (name === 'totalInstallmentAmount' || name === 'installmentPercentage') {
            if (name === 'totalInstallmentAmount' && totalInstallmentAmount > 0) {
              // When total amount changes, calculate premium amount from percentage
              const newPremiumAmount = calculatePremiumAmount(totalInstallmentAmount, installmentPercentage);
              if (newPremiumAmount !== null) {
                formMethods.setValue('installmentNetAmount', newPremiumAmount, { shouldValidate: false });
              }
            }
            if (name === 'installmentPercentage' && totalInstallmentAmount > 0) {
              // When percentage changes, calculate premium amount
              const newPremiumAmount = calculatePremiumAmount(totalInstallmentAmount, installmentPercentage);
              if (newPremiumAmount !== null) {
                formMethods.setValue('installmentNetAmount', newPremiumAmount, { shouldValidate: false });
              }
            }
          }

          // Calculate premium percentage from amount (when user manually enters amount)
          if (name === 'installmentNetAmount' && totalInstallmentAmount > 0) {
            const newPercentage = calculatePremiumPercentage(totalInstallmentAmount, installmentNetAmount);
            if (newPercentage !== null) {
              formMethods.setValue('installmentPercentage', newPercentage, { shouldValidate: false });
            }
          }

          let updatedTaxAmount = taxAmount;

          // Calculate tax amount from percentage
          if (name === 'premiumCollectedAmount' || name === 'taxPercentage') {
            const newTaxAmount = calculateTaxAmount(premiumCollectedAmount, taxPercentage);
            if (newTaxAmount !== null) {
              formMethods.setValue('taxAmount', newTaxAmount, { shouldValidate: false });
              updatedTaxAmount = newTaxAmount;
            }
          }

          // Calculate tax percentage from amount (only when user manually enters tax amount)
          if (name === 'taxAmount' && premiumCollectedAmount > 0) {
            const newTaxPercentage = calculateTaxPercentage(premiumCollectedAmount, taxAmount);
            if (newTaxPercentage !== null) {
              formMethods.setValue('taxPercentage', newTaxPercentage, { shouldValidate: false });
            }
            updatedTaxAmount = taxAmount;
          }

          // Always calculate and update gross amount
          if (name === 'premiumCollectedAmount' || name === 'taxAmount' || name === 'taxPercentage') {
            const newGrossAmount = calculateCollectedGrossAmount(premiumCollectedAmount, updatedTaxAmount);
            if (newGrossAmount !== null) {
              formMethods.setValue('collectedGrossAmount', newGrossAmount, { shouldValidate: false });
            }
          }
        } finally {
          isAutoCalculatingRef.current = false;
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [formMethods, calculatePremiumPercentage, calculatePremiumAmount, calculateTaxAmount, calculateTaxPercentage, calculateCollectedGrossAmount]);

  // Set total installment amount from parent-provided policy details in add mode
  useEffect(() => {
    if (!open || !policyId || !formMethods || isEdit || !premiumAndBrokerageDetails) {
      return;
    }

    const { netPremium, otherAmount } = premiumAndBrokerageDetails;
    const total = parseCurrencyValue(netPremium) + parseCurrencyValue(otherAmount);
    formMethods.setValue("totalInstallmentAmount", total, {
      shouldValidate: false,
    });
  }, [open, policyId, formMethods, isEdit, premiumAndBrokerageDetails]);

  // Initialize form with edit data
  useEffect(() => {
    if (formMethods && editData && isEdit && open) {
      Object.keys(editData).forEach(key => {
        const value = editData[key as keyof InstallmentData];
        if (value !== undefined && value !== null) {
          // Handle lookup objects - extract id for form fields
          if (key === 'status' && typeof value === 'object' && value !== null && 'id' in value) {
            formMethods.setValue(key, value.id);
          } else if (key === 'transactionMode' && typeof value === 'object' && value !== null && 'id' in value) {
            formMethods.setValue(key, value.id);
          } else {
            formMethods.setValue(key, value);
          }
        }
      });

      // Set documents array for file upload component if sourceFile exists
      if (editData?.sourceFile) {
        const documents = [{
          documentId: editData.sourceFile.id,
          fileName: editData.sourceFile.fileName,
          fileSize: editData.sourceFile.fileSize || 0,
          downloadable: true,
          documentName: editData.sourceFile.fileName,
          fileUpload: {
            id: editData.sourceFile.id,
            fileName: editData.sourceFile.fileName,
            fileSize: editData.sourceFile.fileSize || 0
          }
        }];
        formMethods.setValue('documents', documents);
      }

      // Fallback for old/missing installment totals in edit mode.
      if (
        (editData.totalInstallmentAmount === null ||
          editData.totalInstallmentAmount === undefined) &&
        premiumAndBrokerageDetails
      ) {
        const total =
          parseCurrencyValue(premiumAndBrokerageDetails.netPremium) +
          parseCurrencyValue(premiumAndBrokerageDetails.otherAmount);
        formMethods.setValue("totalInstallmentAmount", total, {
          shouldValidate: false,
        });
      }
    }
  }, [formMethods, editData, isEdit, open, premiumAndBrokerageDetails]);

  const handleSubmit = (data: unknown) => {
    const typedData = data as Record<string, unknown>;
    
    // Base fields to exclude from form submission
    const baseExcludedFields = [
      'attachment',
      'fileUpload',      // Exclude any fileUpload object from form data
      'documents',       // Exclude documents array
      'sourceFile',      // Exclude sourceFile object - we handle sourceFileId separately
      'id', 
      'createdAt', 
      'updatedAt', 
      'opportunityId',
      'policyId',        // policyId is in URL path, not in body
      'transactionType', // Not expected in DTO
      'installmentGrossAmount' // Field from placement slip data that conflicts with collectedGrossAmount
    ];
    
    // Additional fields to exclude based on operation type
    let excludedFields = [...baseExcludedFields];
    
    if (isEdit) {
      // For UPDATE - these fields cannot be updated
      excludedFields.push(
        'installmentDate',
        'totalInstallmentAmount', 
        'installmentPercentage',
        'installmentNetAmount',
        'installmentSequence'
      );
    } else {
      // For CREATE - exclude system fields
      excludedFields.push('installmentSequence');
    }
    
    // Numeric fields that need proper type conversion
    const numericFields = [
      'installmentPercentage',
      'installmentNetAmount', 
      'totalInstallmentAmount',
      'premiumCollectedAmount',
      'taxPercentage',
      'taxAmount',
      'collectedGrossAmount',
      'directDebitCharges',
      'transferFees',
      'netPayable',
      'transactionMode',  // Lookup ID - numeric
      'transactionModeLid', // Lookup ID - numeric
      'status',  // Lookup ID - numeric  
      'statusLid' // Lookup ID - numeric
    ];
    
    // Prepare the installment data (flat structure for both CREATE and UPDATE)
    const payload: Record<string, unknown> = {};
    
    // Field name mappings from form to DTO
    const fieldMappings: Record<string, string> = {
      transactionMode: 'transactionModeLid', // Map to lookup ID field expected by backend
      status: 'statusLid' // Map to lookup ID field expected by backend
    };
    
    // Add all fields to payload object except excluded ones
    Object.keys(typedData).forEach(key => {
      if (
        typedData[key] !== null && 
        typedData[key] !== undefined && 
        typedData[key] !== '' && 
        !excludedFields.includes(key)
      ) {
        // Get the mapped field name (or use original if no mapping exists)
        const targetKey = fieldMappings[key] || key;
        
        // Convert numeric fields to proper numbers
        if (numericFields.includes(key)) {
          const numValue = parseFloat(typedData[key] as string);
          payload[targetKey] = isNaN(numValue) ? null : numValue;
        } else {
          payload[targetKey] = typedData[key];
        }
      }
    });

    // Prepare request data
    let requestData: FormData | object;
    const attachment = typedData.attachment;
    const documents = typedData.documents as any[];
  
    // Check for new file upload from DocumentUpload field
    const hasNewFileUpload = documents && documents.length > 0 && 
      documents.some(doc => {
        return doc.fileUpload instanceof File;
      });
    
    // Get the actual File object if it exists
    const newFileUpload = hasNewFileUpload ? 
      documents.find(doc => doc.fileUpload instanceof File)?.fileUpload : null;

    // Check if we have existing files being kept in edit mode
    const hasExistingFileReference = documents && documents.length > 0 &&
      documents.some(doc => doc?.fileUpload?.id && !(doc.fileUpload instanceof File));
    
    const existingFileId = hasExistingFileReference ?
      documents.find(doc => doc?.fileUpload?.id && !(doc.fileUpload instanceof File))?.fileUpload?.id :
      (isEdit && editData?.sourceFile?.id ? editData.sourceFile.id : null);

    if (attachment && attachment instanceof File) {
      // Use FormData for new file uploads via attachment field
      const formData = new FormData();
      
      // Append each field individually to FormData (NestJS expects this format)
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key].toString());
        }
      });
      
      // Append the new file
      formData.append('file', attachment as File);
      requestData = formData;
    } else if (newFileUpload) {
      // Use FormData for new file uploads via DocumentUpload field
      const formData = new FormData();
      
      // Append each field individually to FormData (NestJS expects this format)
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key].toString());
        }
      });
      
      // Append the new file
      formData.append('file', newFileUpload);
      requestData = formData;
    } else if (existingFileId) {
      // Handle existing file case - include sourceFileId
      payload.sourceFileId = existingFileId;
      // Remove any fileUpload object if it exists  
      delete payload.fileUpload;
      requestData = payload;
    } else {
      // Send as JSON object when no file
      // Ensure no file-related fields are included
      delete payload.fileUpload;
      delete payload.sourceFileId;
      requestData = payload;
    }

    const method = isEdit ? HTTP_METHODS.PUT : HTTP_METHODS.POST;

    createInstallment({
      method,
      endpoint: isEdit 
        ? endPoints.updatePolicyInstallment(policyId, editData?.id!) 
        : endPoints.createPolicyInstallment(policyId),
      data: requestData
    });
  };

  const handleCancel = () => {
    formMethods?.reset();
    onClose();
  };

  const buttons = [
    {
      label: isEdit ? "Update Installment" : "Create Installment",
      onClick: () => {
        if (formMethods) {
          formMethods.handleSubmit(handleSubmit)();
        }
      },
      variant: "primary" as const,
      loading: isCreating,
      disabled: isCreating,
    },
    {
      label: "Cancel",
      onClick: handleCancel,
      variant: "secondary" as const,
      disabled: isCreating,
    },
  ];

  return (
    <CustomModal
      open={open}
      handleClose={handleCancel}
      heading={isEdit ? "Edit Installment" : "Add New Installment"}
      headingStyles={{
        fontWeight: 500,
        color: "#111111",
      }}
      buttons={buttons}
      modalBoxStyles={{ width: "80%", maxHeight: "85vh", overflow: "auto" }}
    >
      <DynamicForm
        formConfig={installmentFormConfig(isEdit, editData)}
        formMethods={setFormMethods}
        sx={{ padding: 0 }}
      />
    </CustomModal>
  );
};

export default InstallmentModal;

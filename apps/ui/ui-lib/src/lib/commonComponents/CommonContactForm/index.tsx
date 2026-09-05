import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Box, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { addressFields, defaultAddress } from "../formConfig/sharedFormConfig";
import {
  ADD_ADDRESS,
  ADD_FIRST_ADDRESS,
  ADD_THREE_ADDRESS,
  ADDRESSES,
  EDIT_ADDRESS,
  ERROR_MESSAGE,
  NO_ADDRESSES_ADDED,
  RESET,
  SUBMIT,
  SUCCESS_MESSAGE,
} from "../../constants";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import useApi from "@ui/ui-lib/hooks/useApi";
import mapGetDataToFormData from "@ui/ui-lib/utils/dataMappingUtils";
import DynamicForm from "../FormComponent";
import GenericFormDialog from "../GenericFormDialog";
import SectionDetails from "../SectionDetails";
import { FormActionsContainer } from "../SectionDetails/styles";
import ToastMessage from "../Toast";
import { contactFields, defaultContactFieldData } from "./formConfig";
import { CommonContactFormProps } from "./types";

const CommonContactForm: React.FC<CommonContactFormProps> = ({
  contactType,
}) => {
  const [formMethods, setFormMethods] =
    React.useState<ReturnType<typeof useForm>>();
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const { id: contactId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    doFetch: saveContact,
    data: saveContactApiResponse,
    error,
  } = useApi();
  const { doFetch: getContact, data: contactDataResponse } = useApi();

  useEffect(() => {
    if (contactId) {
      setIsEditMode(true);
      getContact(endPoints.contactById(Number(contactId)));
    }
  }, [contactId]);

  useEffect(() => {
    if (error) {
      setToastMessage(error?.message ?? ERROR_MESSAGE);
    }
  }, [error]);

  useEffect(() => {
    if (!contactDataResponse?.data || !formMethods) return;
    const formFieldNames = contactFields.map((field) => field.name);
    const addressFieldsNames = addressFields.map((field) => field.name);
    const { address, ...contactFormData } = contactDataResponse.data;
    const addressData = address.map((eachAddress: IAddress) =>
      mapGetDataToFormData(eachAddress, addressFieldsNames)
    );

    const contactFormDataMapped = mapGetDataToFormData(
      contactFormData,
      formFieldNames
    );
    setAddresses(addressData);
    formMethods.reset(contactFormDataMapped);
  }, [contactDataResponse, formMethods]);

  useEffect(() => {
    if (
      saveContactApiResponse?.status === 201 ||
      saveContactApiResponse?.status === 200
    ) {
      setToastMessage(saveContactApiResponse?.message ?? SUCCESS_MESSAGE);
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    }
  }, [saveContactApiResponse]);

  const handleAddressSave = (address: IAddress) => {
    if (currentEditIndex !== null) {
      const updatedAddresses = [...addresses];
      updatedAddresses[currentEditIndex] = {
        ...address,
        id: addresses[currentEditIndex].id,
      };
      setAddresses(updatedAddresses);
      setCurrentEditIndex(null);
    } else {
      const newAddress = { ...address, id: addresses.length + 1 };
      setAddresses([...addresses, newAddress]);
    }
    setIsAddressDialogOpen(false);
  };

  const handleAddressEdit = (index: number) => {
    setCurrentEditIndex(index);
    setIsAddressDialogOpen(true);
  };

  const handleAddressDelete = (index: number) => {
    const updatedAddresses = [...addresses];
    updatedAddresses.splice(index, 1);
    setAddresses(updatedAddresses);
  };

  const onSubmit: SubmitHandler<any> = (data) => {
    const finalContactData = {
      ...data,
      CONTACT_RECORD_TYPE: contactType,
    };
    const payload = {
      address: addresses,
      ...finalContactData,
    };

    const endPoint = isEditMode
      ? endPoints.contactById(Number(contactId))
      : endPoints.allContacts;

    saveContact(endPoint, {
      method: isEditMode ? "PUT" : "POST",
      data: payload,
    });
  };

  const handleReset = () => {
    if (formMethods) {
      formMethods.reset();
    }
  };

  return (
    <Box>
      <DynamicForm
        formConfig={contactFields}
        defaultValues={defaultContactFieldData}
        formMethods={setFormMethods}
      />

      <SectionDetails
        title={ADDRESSES}
        icon={<LocationOnIcon />}
        data={addresses}
        onAdd={() => {
          setCurrentEditIndex(null);
          setIsAddressDialogOpen(true);
        }}
        onEdit={handleAddressEdit}
        onDelete={handleAddressDelete}
        noDataMessage={NO_ADDRESSES_ADDED}
        addItemButtonText={ADD_ADDRESS}
        placeholderSubtext={ADD_THREE_ADDRESS}
        firstItemButtonText={ADD_FIRST_ADDRESS}
      />

      <GenericFormDialog
        open={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        onSave={handleAddressSave}
        initialData={
          currentEditIndex !== null ? addresses[currentEditIndex] : undefined
        }
        title={currentEditIndex !== null ? EDIT_ADDRESS : ADD_ADDRESS}
        fields={addressFields}
        defaultValues={defaultAddress}
      />

      <FormActionsContainer>
        <Button
          type="button"
          variant="contained"
          onClick={formMethods ? formMethods.handleSubmit(onSubmit) : undefined}
          disabled={!formMethods}
        >
          {SUBMIT}
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={handleReset}
          disabled={!formMethods}
        >
          {RESET}
        </Button>

        {toastMessage && (
          <ToastMessage
            vertical="top"
            horizontal="center"
            message={toastMessage}
            open={Boolean(toastMessage)}
            onClose={() => setToastMessage(null)}
            autoHideDuration={4000}
          />
        )}
      </FormActionsContainer>
    </Box>
  );
};

export default CommonContactForm;

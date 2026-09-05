import { useCallback, useEffect, useState } from "react";
import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  CircularProgress,
  Radio,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { styled } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, HTTP_METHODS, setToastMessage, useApiQuery } from "@ui/ui-lib";
import CommonRadioGroup from "@ui/ui-lib/commonComponents/Fields/CommonRadioGroup";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import UnauthorizedPage from "../UnauthorizedPage";
import {
  buildUserPasswordPreview,
  FilePasswordConfigResponse,
  FilePasswordType,
  getStoredUser,
  isAdminUser,
  USER_FIELD_OPTIONS,
} from "../../Utils/filePasswordConfig";
import {
  ActionsRow,
  CardContainer,
  CheckboxContainer,
  FieldContainer,
  PageContainer,
  PageTitle,
  PreviewBox,
  PreviewLabel,
  PreviewValue,
  SectionTitle,
} from "./styles";

const CustomRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.neutral.dark,
  "&.Mui-checked": {
    color: theme.palette.chips.senary,
  },
}));

const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.neutral.dark,
  "&.Mui-checked": {
    color: theme.palette.chips.senary,
  },
}));

const FilePasswordConfigPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordType, setPasswordType] = useState<FilePasswordType>("custom");
  const [customPassword, setCustomPassword] = useState("Secure@1234");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [userFields, setUserFields] = useState<string[]>(["firstName"]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | "">(""); 
  const [passwordError, setPasswordError] = useState("");

  const userData = getStoredUser();
  const isAdmin = isAdminUser(userData);

  // Fetch organisations on component mount
  const { data: organisationsResponse, isLoading: isLoadingOrganisations } = useApiQuery({
    queryKey: ["organisations"],
    url: endPoints.masterOrganisation,
    enabled: isAdmin, // Only fetch if user is admin
  });

  const organisations = organisationsResponse?.data?.data || [];

  useEffect(() => {
    if (organisations.length > 0) {
      console.log("Organisations loaded for File Password Config:", organisations);
    }
  }, [organisations]);

  const fetchConfiguration = useCallback(async (countryId?: number | "") => {
    setLoading(true);
    try {
      const url = countryId
        ? `${endPoints.filePasswordConfig}?selectedCountryId=${countryId}`
        : endPoints.filePasswordConfig;
      const response = await apiRequest(url, {
        method: HTTP_METHODS.GET,
      });

      const config = response?.data as FilePasswordConfigResponse | undefined;
      if (config) {
        setPasswordType(config.passwordType || "custom");
        setCustomPassword(config.customPassword || "Secure@1234");
        // Only set country from server on first mount (no country yet selected)
        if (!countryId) {
          setSelectedCountryId(config.selectedCountryId || "");
        }

        const validFieldValues = USER_FIELD_OPTIONS.map((option) => option.value);
        const filteredFields = (config.userFields || ["firstName"]).filter(
          (field: string) => validFieldValues.includes(field)
        );
        setUserFields(filteredFields.length > 0 ? filteredFields : ["firstName"]);
      }
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
      dispatch(setToastMessage("Failed to load configuration"));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAdmin) {
      fetchConfiguration();
    }
  }, [fetchConfiguration, isAdmin]);

  const validatePassword = (password: string): boolean => {
    if (!password || password.trim() === "") {
      setPasswordError("Password cannot be empty");
      return false;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handlePasswordTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordType(event.target.value as FilePasswordType);
    setPasswordError("");
  };

  const handleCountryChange = (event: any) => {
    const newCountryId = event.target.value;
    setSelectedCountryId(newCountryId);
    if (newCountryId) {
      setPasswordError("");
      fetchConfiguration(newCountryId);
    }
  };

  const handleCustomPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = event.target.value;
    setCustomPassword(newPassword);
    if (newPassword) {
      validatePassword(newPassword);
    }
  };

  const handleEditPassword = () => {
    setIsEditingPassword(true);
  };

  const handleUserFieldToggle = (field: string) => {
    setUserFields((prev) =>
      prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]
    );
  };

  const generatePreviewPassword = (): string => {
    if (!selectedCountryId || selectedCountryId === "") {
      return "Please select a country first";
    }

    if (passwordType === "custom") {
      return customPassword;
    }

    if (passwordType === "user_details") {
      return buildUserPasswordPreview(userFields);
    }

    return "No password type selected";
  };

  const handleSave = async () => {
    // First check if country is selected
    if (!selectedCountryId || selectedCountryId === "") {
      setPasswordError("Please select a country/organisation");
      dispatch(setToastMessage("Please select a country/organisation"));
      return;
    }

    // Then validate based on password type
    if (passwordType === "custom") {
      if (!validatePassword(customPassword)) {
        return;
      }
    } else if (passwordType === "user_details") {
      if (userFields.length === 0) {
        setPasswordError("Please select at least one field for password generation");
        dispatch(setToastMessage("Please select at least one field for password generation"));
        return;
      }
    }

    setSaving(true);
    try {
      // Find the selected organisation to get organisationKey
      const selectedOrganisation = organisations.find(org => org.id === selectedCountryId);
      
      const payload: FilePasswordConfigResponse = {
        passwordType,
        selectedCountryId,
        organisationKey: selectedOrganisation?.organisationKey,
        ...(passwordType === "custom" && { customPassword }),
        ...(passwordType === "user_details" && {
          userFields,
          customPassword: buildUserPasswordPreview(userFields),
        }),
      };

      await apiRequest(endPoints.filePasswordConfig, {
        method: HTTP_METHODS.PUT,
        data: payload,
      });

      dispatch(setToastMessage("Password Configuration saved successfully"));
      setIsEditingPassword(false);
    } catch (error) {
      console.error("Failed to save configuration:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to save configuration";
      dispatch(setToastMessage(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return <UnauthorizedPage />;
  }

  return (
    <PageContainer>
      <PageTitle>File Password Configuration</PageTitle>
      <CardContainer>
        {(loading || isLoadingOrganisations) ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Country Selection Section */}
            <Box mb={3}>
              <SectionTitle>Select Country/Organisation</SectionTitle>
              <FormControl sx={{ mt: 1, minWidth: 300, maxWidth: 400 }} error={!!passwordError && (!selectedCountryId || selectedCountryId === "")}>
                <InputLabel>Select Country/Organisation</InputLabel>
                <Select
                  value={selectedCountryId || ""}
                  onChange={handleCountryChange}
                  label="Select Country/Organisation"
                  error={!!passwordError && (!selectedCountryId || selectedCountryId === "")}
                >
                  {organisations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
                {(!selectedCountryId || selectedCountryId === "") && passwordError && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                    {passwordError}
                  </Box>
                )}
              </FormControl>
            </Box>

            {/* Password Configuration Section */}
            <FormControl component="fieldset" disabled={!selectedCountryId || selectedCountryId === ""}>
              <SectionTitle>Password Configuration</SectionTitle>
              <CommonRadioGroup value={passwordType} onChange={handlePasswordTypeChange}>
                <FieldContainer>
                  <FormControlLabel
                    value="custom"
                    control={<CustomRadio />}
                    label={<SectionTitle>Custom Password</SectionTitle>}
                    disabled={!selectedCountryId || selectedCountryId === ""}
                  />
                  {passwordType === "custom" && (selectedCountryId && selectedCountryId !== "") && (
                    <Box ml={4}>
                      <TextField
                        fullWidth
                        type="text"
                        value={customPassword}
                        onChange={handleCustomPasswordChange}
                        disabled={!isEditingPassword}
                        error={!!passwordError && passwordType === "custom"}
                        helperText={passwordType === "custom" ? passwordError : ""}
                        InputProps={{
                          endAdornment: !isEditingPassword && (
                            <InputAdornment position="end">
                              <IconButton onClick={handleEditPassword} edge="end" size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  )}
                </FieldContainer>

                <FieldContainer>
                  <FormControlLabel
                    value="user_details"
                    control={<CustomRadio />}
                    label={<SectionTitle>Generate Password From User Details</SectionTitle>}
                    disabled={!selectedCountryId || selectedCountryId === ""}
                  />
                  {passwordType === "user_details" && (selectedCountryId && selectedCountryId !== "") && (
                    <CheckboxContainer>
                      {USER_FIELD_OPTIONS.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          control={
                            <CustomCheckbox
                              checked={userFields.includes(option.value)}
                              onChange={() => handleUserFieldToggle(option.value)}
                            />
                          }
                          label={option.label}
                        />
                      ))}
                    </CheckboxContainer>
                  )}
                </FieldContainer>
              </CommonRadioGroup>
            </FormControl>

            <PreviewBox>
              <PreviewLabel>Password Preview</PreviewLabel>
              <PreviewValue>{generatePreviewPassword()}</PreviewValue>
            </PreviewBox>

            <ActionsRow>
              <Button
                variantType="secondary"
                size="small"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                variantType="primary"
                size="small"
                onClick={handleSave}
                disabled={saving || loading || isLoadingOrganisations}
                loading={saving}
                loadingPosition="center"
              >
                Save
              </Button>
            </ActionsRow>
          </>
        )}
      </CardContainer>
    </PageContainer>
  );
};

export default FilePasswordConfigPage;

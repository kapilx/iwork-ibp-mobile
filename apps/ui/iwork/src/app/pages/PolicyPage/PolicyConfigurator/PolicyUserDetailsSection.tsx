import { Button, IconButton, Typography } from "@mui/material";
import { CommonTextField } from "@ui/ui-lib";
import React, { useRef } from "react";
import addIcon from "../../../assets/svgs/add-card.svg";
import removeIcon from "../../../assets/svgs/remove-card.svg";
import {
  AddIcon,
  RemoveIcon,
  StyledRowStackWithMargin,
  StyledTablePaper,
} from "./styles";
import { UserDetailConfig, UserDetailsSectionConfig } from "./policytypes";

interface PolicyUserDetailsSectionProps {
  sectionData: UserDetailsSectionConfig;
  isEditable: boolean;
  onChange: (data: UserDetailsSectionConfig) => void;
}

export const PolicyUserDetailsSection: React.FC<PolicyUserDetailsSectionProps> = ({
  sectionData,
  isEditable,
  onChange,
}) => {
  const nextIdRef = useRef(
    Math.max(0, ...sectionData.items.map((ud) => parseInt(ud.id.split("-")[1]) || 0)) + 1
  );

  const updateItems = (items: UserDetailConfig[]) =>
    onChange({ ...sectionData, items });

  const handleAdd = () => {
    const newItem: UserDetailConfig = {
      id: `ud-${nextIdRef.current++}`,
      label: "",
    };
    updateItems([...sectionData.items, newItem]);
  };

  const handleRemove = (id: string) =>
    updateItems(sectionData.items.filter((ud) => ud.id !== id));

  const handleLabelChange = (id: string, val: string) =>
    updateItems(
      sectionData.items.map((ud) => (ud.id === id ? { ...ud, label: val } : ud))
    );

  return (
    <StyledTablePaper sx={{ mb: 3, flexGrow: 0 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        User Details
      </Typography>
      {sectionData.items.map((item) => (
        <StyledRowStackWithMargin
          key={item.id}
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <CommonTextField
            label="Label"
            value={item.label}
            dataTestId={`user-detail-${item.id}-label`}
            onChange={(e) => handleLabelChange(item.id, e.target.value)}
            size="small"
            sx={{ width: "220px" }}
            disabled={!isEditable}
            variant="outlined"
          />
          {isEditable && sectionData.items.length > 1 && (
            <IconButton
              onClick={() => handleRemove(item.id)}
              size="small"
              aria-label="remove user detail"
              data-testid={`user-detail-${item.id}-remove-btn`}
            >
              <RemoveIcon src={removeIcon} />
            </IconButton>
          )}
        </StyledRowStackWithMargin>
      ))}
      {isEditable && (
        <Button
          startIcon={<AddIcon src={addIcon} alt="Add" />}
          onClick={handleAdd}
          size="small"
          sx={{ color: "#0A73E9", fontWeight: "300", alignSelf: "flex-start" }}
          data-testid="add-user-detail-field-btn"
        >
          Add Field
        </Button>
      )}
    </StyledTablePaper>
  );
};

export default PolicyUserDetailsSection;

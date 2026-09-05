import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Checkbox, useApiQuery, endPoints } from "@ui/ui-lib";
import { RoleApiResponse, Role } from "./types";

interface RolePickerProps {
  value: number[];
  onChange: (roles: number[]) => void;
}

const RolePicker: React.FC<RolePickerProps> = ({ value, onChange }) => {
  const { data } = useApiQuery({
    queryKey: ["roleList"],
    url: endPoints.employeeRoleList,
  });

  const roles: Role[] = ((data as RoleApiResponse)?.data?.data || []).filter(
    (role): role is Role => Boolean(role && role.id)
  );
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // Ensure selectAll is true only if roles are available and all of them are in the value array.
    if (roles.length > 0) {
      setSelectAll(value.length === roles.length);
    } else {
      // If there are no roles to select, selectAll should be false.
      setSelectAll(false);
    }
  }, [roles, value]);

  const handleToggle = (roleId: number, checked: boolean) => {
    if (checked) {
      onChange([...value, roleId]);
    } else {
      onChange(value.filter((id) => id !== roleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onChange(roles.map((r) => r.id, checked));
    } else {
      onChange([]);
    }
    // The `selectAll` state is now managed by the useEffect,
    // which reacts to changes in the `value` prop (updated by `onChange`).
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Checkbox
          label={<Typography sx={{ fontSize: "14px" }}>Select All</Typography>}
          isChecked={selectAll}
          isIndeterminate={!selectAll && value.length > 0 && value.length < roles.length}
          onChange={(e, checked) => handleSelectAll(checked)}
        />
        {roles.map((role) => (
          <Checkbox
            key={role.id}
            label={<Typography sx={{ fontSize: "14px" }}>{role.name}</Typography>}
            isChecked={value.includes(role.id)}
            onChange={(e, checked) => handleToggle(role.id, checked)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default RolePicker;

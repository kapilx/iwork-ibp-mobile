import { CellClickedEvent } from "ag-grid-community";
import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { TextField, Box, Typography, Grid, InputLabel } from "@mui/material";
import {
  Button,
  Divider,
  endPoints,
  useApiMutation,
  useApiQuery,
  useTableController,
  Table,
  isCopyPasteAllowedForOrg,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { PageContainer, TitleContainer, AclTable, FormActions } from "./styles";
import { columns } from "./tableConfig";
import { AclCategoryWithActions, Role, AclAction } from "./types";

interface RoleFormData {
  name: string;
  description: string;
  roleKey: string;
}

const RoleManagement = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [aclMeta, setAclMeta] = useState<AclCategoryWithActions[]>([]);
  const [selectedAclIds, setSelectedAclIds] = useState<number[]>([]);

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
  } = useTableController({
    endpoint: endPoints.roles,
  });

  const { data: aclData } = useApiQuery({
    url: endPoints.aclMetadata,
    queryKey: ["aclMetadata"],
  });

  useEffect(() => {
    if (aclData?.data) {
      setAclMeta(aclData.data);
    }
  }, [aclData]);

  const { data: roleAclData, refetch: refetchRoleAcl } = useApiQuery({
    url: selectedRole ? endPoints.roleAcl(selectedRole.id) : "",
    queryKey: ["role", selectedRole?.id],
    enabled: false,
  });

  useEffect(() => {
    if (selectedRole) {
      refetchRoleAcl();
    }
  }, [selectedRole, refetchRoleAcl]);

  useEffect(() => {
    if (roleAclData?.data) {
      // Flatten the array of aclActionIds from all categories
      const allActionIds = roleAclData.data.reduce(
        (
          acc: number[],
          categoryAcls: { aclCategoryId: number; aclCatActionMapIds: number[] }
        ) => {
          return acc.concat(categoryAcls.aclCatActionMapIds);
        },
        []
      );
      setSelectedAclIds(Array.from(new Set(allActionIds))); // Ensure uniqueness, though backend should provide unique IDs
    }
  }, [roleAclData]);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: { name: "", description: "", roleKey: "" },
  });

  useEffect(() => {
    if (selectedRole) {
      reset({
        name: selectedRole.name,
        description: selectedRole.description,
        roleKey: selectedRole.roleKey,
      });
    } else {
      reset({ name: "", description: "", roleKey: "" });
      setSelectedAclIds([]);
    }
  }, [selectedRole, reset]);

  const { mutateAsync: saveRole } = useApiMutation({});

  const onSubmit = async (data: RoleFormData) => {
    const values = data; // data from react-hook-form
    const existing = rowData.some(
      (r: Role) =>
        r.name.toLowerCase() === values.name?.toLowerCase() &&
        r.id !== selectedRole?.id
    );
    if (existing) {
      alert("Role name must be unique");
      return;
    }
    let roleId = selectedRole?.id;
    if (selectedRole) {
      await saveRole({
        endpoint: endPoints.roleById(selectedRole.id),
        method: "PUT",
        data: { name: values.name, description: values.description },
      });
    } else {
      const res: any = await saveRole({
        endpoint: endPoints.roles,
        method: "POST",
        data: { name: values.name, description: values.description },
      });
      roleId = res?.data?.id;
    }

    if (roleId) {
      await saveRole({
        endpoint: endPoints.updateRoleAcl(roleId),
        method: "PUT",
        data: { aclIds: selectedAclIds },
      });
    }
  };

  const handleReset = () => {
    setSelectedRole(null);
    setSelectedAclIds([]);
    reset({ name: "", description: "", roleKey: "" });
  };

  const onCellClicked = (event: CellClickedEvent) => {
    setSelectedRole(event.data as Role);
  };

  const handleCategoryToggle = (
    categoryId: number,
    checked: boolean,
    actionIds: number[]
  ) => {
    if (checked) {
      setSelectedAclIds((prev) => Array.from(new Set([...prev, ...actionIds])));
    } else {
      setSelectedAclIds((prev) => prev.filter((id) => !actionIds.includes(id)));
    }
  };

  const handleActionToggle = (actionId: number, checked: boolean) => {
    if (checked) {
      setSelectedAclIds((prev) => Array.from(new Set([...prev, actionId])));
    } else {
      setSelectedAclIds((prev) => prev.filter((id) => id !== actionId));
    }
  };

  const watchedName = watch("name");

  useEffect(() => {
    if (!selectedRole) {
      // Only derive roleKey for new roles or if name changes
      setValue(
        "roleKey",
        watchedName
          ? `ROLE_${watchedName.toUpperCase().replace(/\s+/g, "_")}`
          : ""
      );
    }
  }, [watchedName, setValue, selectedRole]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return rowData.slice(startIndex, endIndex);
  }, [rowData, currentPage, pageSize]);

  return (
    <PageContainer>
      <TitleContainer variant="h1">Role Management</TitleContainer>
      <Table
        columns={columns}
        rowData={rowData} // <-- Use paginated data here
        totalRows={totalRows}
        currentPage={currentPage}
        loading={loading}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        setSort={setSort}
        title="Roles"
        displaySettingsButton={false}
      />
      <Divider sx={{ mt: 7 }} />
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ marginTop: 7, width: "100%" }}
      >
        <Typography variant="h5" gutterBottom>
          {selectedRole ? "Edit Role" : "Create New Role"}
        </Typography>
        <Grid container spacing={3} sx={{ mt: 5, mb: 2 }}>
          <Grid item xs={12} sm={12} md={3}>
            <InputLabel
              htmlFor="role-name"
              sx={{ mb: 0.5, fontWeight: 500, color: "text.primary" }}
            >
              Role Name
            </InputLabel>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Role name is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="role-name"
                  variant="outlined"
                  size="small"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  onPaste={(e) => {
                    if (!isCopyPasteAllowedForOrg()) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <InputLabel
              htmlFor="role-key"
              sx={{ mb: 0.5, fontWeight: 500, color: "text.primary" }}
            >
              Role Key
            </InputLabel>
            <Controller
              name="roleKey"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="role-key"
                  variant="outlined"
                  size="small"
                  fullWidth
                  disabled // Always disabled as per requirements
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={6}>
            <InputLabel
              htmlFor="role-description"
              sx={{ mb: 0.5, fontWeight: 500, color: "text.primary" }}
            >
              Role Description
            </InputLabel>
            <Controller
              name="description"
              control={control}
              rules={{ required: "Role description is required" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="role-description"
                  variant="outlined"
                  size="small"
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  onPaste={(e) => {
                    if (!isCopyPasteAllowedForOrg()) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>

      <AclTable component="table">
        {/* <caption>ACL Permissions</caption> */}
        <thead>
          <tr>
            <th>Category</th>
            <th>Permissions</th>
          </tr>
        </thead>
        <tbody>
          {aclMeta.map((meta) => {
            if (
              meta.category.categoryKey === "FILE_PASSWORD_CONFIGURATION" &&
              !environment.enableFilePasswordProtection
            ) {
              return null;
            }
            const actionIds = meta.actions.map((a) => a.id);
            const categoryChecked = actionIds.every((id) =>
              selectedAclIds.includes(id)
            );
            return (
              <tr key={meta.category.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={categoryChecked}
                    onChange={(e) =>
                      handleCategoryToggle(
                        meta.category.id,
                        e.target.checked,
                        actionIds
                      )
                    }
                  />
                  {meta.category.name}
                </td>
                <td>
                  {meta.actions.map((action: AclAction) => (
                    <label key={action.id} style={{ marginRight: 20 }}>
                      <input
                        type="checkbox"
                        checked={selectedAclIds.includes(action.id)}
                        onChange={(e) =>
                          handleActionToggle(action.id, e.target.checked)
                        }
                      />
                      {meta.category.categoryKey === "BULK_DOWNLOAD" &&
                      action.actionKey === "ENABLE_001"
                        ? "Bulk Download (Enabled)"
                        : meta.category.categoryKey ===
                              "FILE_PASSWORD_CONFIGURATION" &&
                            action.actionKey === "ENABLE_001"
                          ? "File Password Configuration (Enabled)"
                        : action.name}
                    </label>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </AclTable>

      <FormActions
        sx={{ mt: 7, display: "flex", justifyContent: "right", gap: 2 }}
      >
        <Button label="Reset" onClick={handleReset} variantType="secondary" />
        <Button
          label="Save"
          onClick={handleSubmit(onSubmit)}
          variantType="primary"
        />
      </FormActions>
    </PageContainer>
  );
};

export default RoleManagement;
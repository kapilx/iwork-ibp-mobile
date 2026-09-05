import { useEffect, useMemo, useState } from "react";
import {
  AutocompleteStyles,
  Button,
  CardBackground,
  ServerSideGrid,
  StyledLabelTypography,
  StyledPickerFormController,
  StyledPickerLabelContainer,
  endPoints,
  useApiQuery,
  apiRequest,
  ServerSideGridStyledFormControl,
  StyledSelect,
  StyledBox,
  Pagination,
  PaginationContainer,
  isCopyPasteAllowedForOrg,
} from "@ui/ui-lib";
import { Box, CircularProgress, MenuItem, TextField } from "@mui/material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import CoverTemplateMap from "../CoverTemplateMap";
import { COVER_MASTER } from "../../../constants";

type EntityItem = { name: string; label: string };
type Parameter = { name: string; label: string; dataType: string; options: any[] | null };
type ResultColumn = { name: string; label: string; dataType: string; alignment?: string };

const MasterView = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, any | null>>({});
  const [paramLabels, setParamLabels] = useState<Record<string, any | null>>({});
  const [resultColumns, setResultColumns] = useState<ResultColumn[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(false);
  const pageSizeOptions = [10, 20, 50, 100];

  const columns = useMemo(() => {
    const baseCols = resultColumns.map((c) => ({
      field: c.name,
      headerName: c.label || c.name,
      tooltipField: c.name,
      tooltipValueGetter: (params: any) => params.value ?? "",
      ...(c.name === "status" && {
        valueFormatter: (params: any) => {
          if (params.value === 1 || params.value === true) return "ACTIVE";
          if (params.value === 0 || params.value === false) return "INACTIVE";
          return params.value ?? "";
        },
      }),
    }));
    // Action column
    const actionCol = {
      field: "__actions__",
      headerName: "Actions",
      cellRenderer: (params: any) => {
        const row = params.data;
        return (
          <Box display="flex" gap={1}>
            {/* <Button
              label="View Details"
              variantType="secondary"
              size="small"
              onClick={() =>
                selectedEntity &&
                navigate(`/master/${selectedEntity.name}/${row.id}`, { replace: false })
              }
            /> */}
            <Button
              label="Edit Record"
              variantType="secondary"
              size="small"
              onClick={() =>
                selectedEntity &&
                navigate(`/master/${selectedEntity.name}/${selectedEntity.name==='user'?row.userId : row.id}/edit`, { replace: false })
              }
            />
          </Box>
        );
      },
    } as any;
    return [...baseCols, actionCol];
  }, [resultColumns, navigate, selectedEntity]);

  // Entities list
  const { data: entityData, isLoading: entityLoading } = useApiQuery({
    url: endPoints.masterEntities,
    queryKey: ["masterEntities"],
  });

  useEffect(() => {
    if (entityData?.data?.entities) {
      setEntities(entityData.data.entities);
      setSelectedEntity((prev) => prev || entityData.data.entities[0] || null);
    }
  }, [entityData]);

  // Fetch metadata on entity change
  const { data: metadataData, isLoading: metadataLoading } = useApiQuery({
    url: selectedEntity ? endPoints.masterEntityMetadata(selectedEntity.name) : "",
    queryKey: ["masterEntityMetadata", selectedEntity?.name],
    enabled: !!selectedEntity,
  });

  useEffect(() => {
    if (metadataData?.data) {
      const md = metadataData.data;
      setParameters(md.parameterList || []);
      setResultColumns(md.resultsList || []);
      // init defaults for filters
      const defaultsValues: Record<string, any | null> = {};
      const defaultsLabels: Record<string, any | null> = {};
      (md.parameterList || []).forEach((p: Parameter) => {
        if (p.dataType === "date") {
          defaultsValues[p.name] = null; // Date fields start empty
          defaultsLabels[p.name] = null;
        } else if (p.options && p.options.length > 0) {
          defaultsValues[p.name] = null; // Dropdown fields start unselected
          defaultsLabels[p.name] = null;
        } else {
          defaultsValues[p.name] = null; // Text/number fields start empty
          defaultsLabels[p.name] = null;
        }
      });
      setParamValues(defaultsValues);
      setParamLabels(defaultsLabels);
      // reset data state
      setRows([]);
      setCurrentPage(1);
      setView(false);
    }
  }, [metadataData]);

  // Reset all filters and state when entity changes
  useEffect(() => {
    if (selectedEntity) {
      // Reset all filter/param values
      setParamValues({});
      setParamLabels({});
      // Reset data and pagination
      setRows([]);
      setTotalRows(0);
      setCurrentPage(1);
      setPageSize(10);
      setSort([]);
      // Reset view state
      setView(false);
      setLoading(false);
    }
  }, [selectedEntity]);

  const buildQuery = () => {
    const sortParam =
      sort.length > 0 ? `&sortBy=${sort[0].colId}&sortOrder=${sort[0].sort.toUpperCase()}` : "";
    
    // Build multiple search parameters dynamically
    const searchParams: string[] = [];
    
    parameters.forEach((p) => {
      const value = paramValues[p.name];
      if (value !== null && value !== undefined && value !== "") {
        if (p.name === "name") {
          // For name search, use the original searchBy/search pattern
          searchParams.push(`searchBy=${encodeURIComponent(p.name)}&search=${encodeURIComponent(String(value))}`);
        } else if (typeof value === "number" && p.options) {
          // For dropdown selections (like verticalName), send as xxxName parameter
          searchParams.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(p.options.find(opt => opt.value === value)?.label || String(value))}`);
        } else if (typeof value === "string" && p.options) {
          // For string dropdown selections, send as xxxName parameter
          searchParams.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(String(value))}`);
        } else {
          // For other field types, send as direct parameters
          if (typeof value === "number") {
            searchParams.push(`searchBy=${encodeURIComponent(p.name)}&searchId=${value}`);
          } else {
            searchParams.push(`${encodeURIComponent(p.name)}=${encodeURIComponent(String(value))}`);
          }
        }
      }
    });
    
    const searchParam = searchParams.length > 0 ? `&${searchParams.join('&')}` : "";
      
    return `?page=${currentPage}&limit=${pageSize}${searchParam}${sortParam}`;
  };

  const fetchList = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    try {
      const res = await apiRequest(endPoints.masterList(selectedEntity.name) + buildQuery(), {
        method: "GET",
      });
      console.log("API Response:", res); // Debug log
      const data = res?.data?.data || res?.data || [];
      const count = res?.data?.count ?? data.length;
      console.log("Parsed data:", { data: data.length, count }); // Debug log
      setRows(data || []);
      setTotalRows(count || 0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    setCurrentPage(1);
    setView(true);
    fetchList();
  };

  useEffect(() => {
    if (view) fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sort]);

  const pageLoading = entityLoading || metadataLoading;
  const isCover = selectedEntity?.name === COVER_MASTER.ENTITY;

  return (
    <Box p={4}>
      <CardBackground>
        <Box display="flex" gap={2} flexWrap="nowrap" alignItems="flex-end">
          <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
            <StyledPickerLabelContainer>
              <StyledLabelTypography variant="body1" sx={{ wordBreak: 'break-word' }}>
                Select Entity
              </StyledLabelTypography>
            </StyledPickerLabelContainer>
            <AutocompleteStyles
              options={entities}
              getOptionLabel={(option) => (option as EntityItem).label}
              isOptionEqualToValue={(option, value) =>
                (option as EntityItem).name === (value as EntityItem | null)?.name
              }
              value={selectedEntity}
              onChange={(_, val) => setSelectedEntity(val as EntityItem)}
              renderInput={(params) => <TextField {...params} placeholder="Select Entity" size="small" />}
              sx={{ width: '100%' }}
            />
          </Box>
          {!isCover && parameters.filter(param => param.name.toLowerCase() !== 'id').map((param) => (
            <Box key={param.name} sx={{ flex: '1 1 160px', minWidth: 0 }}>
              <StyledPickerLabelContainer>
                <StyledLabelTypography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {param.label}
                </StyledLabelTypography>
              </StyledPickerLabelContainer>
              <StyledPickerFormController fullWidth>
                {param.dataType === "date" ? (
                  <TextField
                    type="date"
                    size="small"
                    value={paramValues[param.name] || ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                    sx={{ width: "100%" }}
                  />
                ) : param.options && param.options.length > 0 ? (
                  // Dropdown field for parameters with options
                  <AutocompleteStyles
                    options={param.options}
                    getOptionLabel={(option) => option.label || option.value || String(option)}
                    isOptionEqualToValue={(option, value) => 
                      option.value === value?.value || option === value
                    }
                    value={paramLabels[param.name] || null}
                    onChange={(_, val) => {
                      setParamLabels((prev) => ({ ...prev, [param.name]: val }));
                      setParamValues((prev) => ({ 
                        ...prev, 
                        [param.name]: val ? val.value : null 
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        placeholder={`Select ${param.label}`}
                        size="small"
                      />
                    )}
                    sx={{ width: "100%" }}
                  />
                ) : param.dataType === "number" ? (
                  // Number field
                  <TextField
                    type="number"
                    placeholder={`Filter by ${param.label}`}
                    size="small"
                    value={paramValues[param.name] || ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                    sx={{ width: "100%" }}
                    onPaste={(e) => {
                      if (!isCopyPasteAllowedForOrg()) {
                        e.preventDefault();
                      }
                    }}
                  />
                ) : (
                  // Default text field
                  <TextField
                    placeholder={`Filter by ${param.label}`}
                    size="small"
                    value={paramValues[param.name] || ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                    sx={{ width: "100%" }}
                    onPaste={(e) => {
                      if (!isCopyPasteAllowedForOrg()) {
                        e.preventDefault();
                      }
                    }}
                  />
                )}
              </StyledPickerFormController>
            </Box>
          ))}
        </Box>

        {!isCover && (
          <Box display="flex" gap={2} mt={2} alignItems="center">
            <Button label="View" variantType="primary" onClick={handleView} />
            <Button
              label="Add New Record"
              variantType={selectedEntity ? "primary" : "secondary"}
              disabled={!selectedEntity}
              onClick={() =>
                selectedEntity && navigate(`/master/${selectedEntity.name}/new`, { replace: false })
              }
            />
          </Box>
        )}
      </CardBackground>
      {isCover ? (
        <Box mt={4} width="100%">
          <CoverTemplateMap />
        </Box>
      ) : pageLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      ) : (
        view && (
          <Box mt={4} width="100%">
            <ServerSideGrid
              rows={rows}
              columns={columns}
              totalRecords={totalRows}
              currentPage={currentPage}
              loading={loading}
              onPageChange={(page) => setCurrentPage(page)}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              setSort={setSort}
              height={500}
            />
            <PaginationContainer>
              <Box display="flex" alignItems="center" gap={1}>
                <ServerSideGridStyledFormControl variant="outlined" size="small">
                  <StyledBox>Showing </StyledBox>
                  <StyledSelect
                    value={pageSize}
                    inputProps={{ "aria-label": "Page size" }}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    {pageSizeOptions.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                  <StyledBox>of {totalRows} entries</StyledBox>
                </ServerSideGridStyledFormControl>
              </Box>
              <Pagination
                totalRecords={totalRows}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
              />
            </PaginationContainer>
          </Box>
        )
      )}
    </Box>
  );
};

export default MasterView;
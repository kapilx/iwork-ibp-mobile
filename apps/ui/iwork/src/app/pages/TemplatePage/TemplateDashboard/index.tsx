import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Alert,
  AlertTitle,
  Typography,
} from "@mui/material";
import {
  setToastMessage,
  useApiQuery,
  endPoints,
  Pagination,
  PaginationContainer,
  ServerSideGridStyledFormControl,
  StyledSelect,
  StyledBox,
  ServerSideGrid,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { ColDef } from "ag-grid-community";
import { TemplateLayout } from "../TemplateLayout";
import TemplateTopNav from "../TemplateTopNav";
import { findChannelType, CHANNEL_TYPES } from "../TemplateEditor/constants";
import {
  Template,
  TemplateCardProps,
  TemplateDashboardState,
  ApprovalStatusEnum,
  TemplateStatusEnum,
} from "./types";
import {
  ApiBaseResponse,
  ApiTemplateListResponse,
  ApiEventType,
} from "../apiTypes";
import {
  DashboardContainer,
  EmptyStateContainer,
  EmptyStateTitle,
  EmptyStateDescription,
  TemplateCard as StyledTemplateCard,
  TemplateCardContent,
  TemplateCardHeader,
  TemplateCardTitle,
  TemplateCardChips,
  TemplateCardFooter,
  SearchWrapper,
  HeaderActionsContainer, // Added
  StyledSearchIcon, // Added
  StyledInputBase, // Added
  ErrorAlertContainer,
  FiltersContainer,
  FilterField,
  FlexibleFilterField,
  WhiteSelect,
  StyledInputLabel,
  ActionButton,
  LoadingBox,
} from "./styles";

// SessionStorage key for filters
const FILTERS_STORAGE_KEY = 'templateDashboard_filters';
const PAGE_STORAGE_KEY = 'templateDashboard_page';

// Helper to load filters from sessionStorage
const loadFiltersFromStorage = () => {
  try {
    const stored = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load filters from storage:', error);
  }
  return {
    search: '',
    channelType: 'all',
    approvalStatus: 'all',
    templateStatus: 'all',
  };
};

// Helper to save filters to sessionStorage
const saveFiltersToStorage = (filters: any) => {
  try {
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to storage:', error);
  }
};

// Helper to load page from sessionStorage
const loadPageFromStorage = () => {
  try {
    const stored = sessionStorage.getItem(PAGE_STORAGE_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }
  } catch (error) {
    console.error('Failed to load page from storage:', error);
  }
  return 1;
};

// Helper to save page to sessionStorage
const savePageToStorage = (page: number) => {
  try {
    sessionStorage.setItem(PAGE_STORAGE_KEY, page.toString());
  } catch (error) {
    console.error('Failed to save page to storage:', error);
  }
};

// Template Card Component
// const _TemplateCardComponent: React.FC<TemplateCardProps & { loadingAction?: boolean; currentUserId?: number }> = ({
//   template,
//   onEdit,
//   onDelete,
//   onPreview,
//   onHistory,
//   onStatusChange,
//   loadingAction,
//   currentUserId
// }) => {
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//   const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const getStatusColor = (status: Template['status']) => {
//     switch (status) {
//       case 'active':
//       case 'approved':
//       case ApprovalStatusEnum.APPROVED:
//       case TemplateStatusEnum.ACTIVE:
//         return 'success';
//       case 'pending':
//       case ApprovalStatusEnum.PENDING_APPROVAL:
//         return 'warning';
//       case 'draft':
//       case ApprovalStatusEnum.DRAFT:
//         return 'info';
//       case ApprovalStatusEnum.REJECTED:
//         return 'error';
//       default: return 'default';
//     }
//   };

//   const getTypeColor = (type: Template['type']) => {
//     switch (type) {
//       case 'email': return 'primary';
//       case 'sms': return 'secondary';
//       case 'push': return 'info';
//       case 'in-app': return 'info';
//       case 'whats-app': return 'success';
//       default: return 'default';
//     }
//   };

//   const currentApprovalStatus = template.approvalStatus;
//   const isDraft = currentApprovalStatus === ApprovalStatusEnum.DRAFT;
//   const isPending = currentApprovalStatus === ApprovalStatusEnum.PENDING_APPROVAL;
//   const isApproved = currentApprovalStatus === ApprovalStatusEnum.APPROVED;
//   const isRejected = currentApprovalStatus === ApprovalStatusEnum.REJECTED;
//   const isTemplateActive = template.templateStatus === TemplateStatusEnum.ACTIVE;
//   const isCreator = currentUserId && template.createdBy && Number(template.createdBy) === currentUserId;

//   return (
//     <StyledTemplateCard>
//       <TemplateCardContent onClick={() => onPreview(template.id)}>
//         <TemplateCardHeader>
//           <TemplateCardTitle variant="h6">
//             {template.name}
//           </TemplateCardTitle>
//           <IconButton
//             size="small"
//             onClick={(e) => {
//               e.stopPropagation();
//               handleMenuOpen(e);
//             }}
//             disabled={loadingAction}
//           >
//             {loadingAction ? <CircularProgress size={20} /> : <MoreVertIcon />}
//           </IconButton>
//         </TemplateCardHeader>
//         <TemplateCardChips>
//           <Chip
//             label={(template.type || 'email').toUpperCase()}
//             size="small"
//             color={getTypeColor(template.type)}
//           />
//           <Chip
//             label={`${(template.approvalStatus || 'draft').toUpperCase()}`}
//             size="small"
//             color={getStatusColor(template.approvalStatus)}
//           />
//           <Chip
//             label={`${(template.templateStatus || 'inactive').toUpperCase()}`}
//             size="small"
//             variant="outlined"
//             color={isTemplateActive ? 'success' : 'default'}
//           />
//         </TemplateCardChips>

//         <TemplateCardFooter variant="caption">
//           Updated: {new Date(template.updatedAt).toLocaleDateString('en-GB')}
//         </TemplateCardFooter>
//       </TemplateCardContent>
//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={handleMenuClose}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {isRejected && (
//           <MenuItem
//             key="revise"
//             onClick={(e) => {
//               e.stopPropagation();
//               onStatusChange(template.id, WorkflowActionEnum.REVISE);
//               handleMenuClose();
//             }}
//           >
//             <IconWrapper><EditIcon fontSize="small" /></IconWrapper>
//             Revise
//           </MenuItem>
//         )}
//         {(isDraft || isApproved) && (
//           <MenuItem
//             key="edit"
//             onClick={(e) => {
//               e.stopPropagation();
//               onEdit(template.id);
//               handleMenuClose();
//             }}
//           >
//             <IconWrapper><EditIcon fontSize="small" /></IconWrapper>
//             Edit
//           </MenuItem>
//         )}
//         {isDraft && (
//           <MenuItem
//             key="submit"
//             onClick={(e) => {
//               e.stopPropagation();
//               onStatusChange(template.id, WorkflowActionEnum.SUBMIT);
//               handleMenuClose();
//             }}
//           >
//             <IconWrapper><RateReviewIcon fontSize="small" /></IconWrapper>
//             Submit for Approval
//           </MenuItem>
//         )}
//         {isPending && isCreator && (
//           <MenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(template.id, WorkflowActionEnum.WITHDRAW); handleMenuClose(); }}>
//             <IconWrapper><WithdrawIcon fontSize="small" /></IconWrapper>
//             Withdraw
//           </MenuItem>
//         )}
//         <MenuItem onClick={(e) => { e.stopPropagation(); onHistory(template.id); handleMenuClose(); }}>
//           <IconWrapper><HistoryIcon fontSize="small" /></IconWrapper>
//           History
//         </MenuItem>
//         <MenuItem onClick={(e) => { e.stopPropagation(); onPreview(template.id); handleMenuClose(); }}>
//           <IconWrapper><PreviewIcon fontSize="small" /></IconWrapper>
//           Preview
//         </MenuItem>
//         {isTemplateActive && (
//           <MenuItem onClick={(e) => { e.stopPropagation(); onDelete(template.id); handleMenuClose(); }}>
//             <DeleteMenuItem>
//               <IconWrapper><DeleteIcon fontSize="small" /></IconWrapper>
//               Delete
//             </DeleteMenuItem>
//           </MenuItem>
//         )}
//       </Menu>
//     </StyledTemplateCard>
//   );
// };

// Main Dashboard Component
const TemplateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [state, setState] = useState<TemplateDashboardState>({
    templates: [],
    loading: true,
    error: '',
  });

  // Initialize filters from sessionStorage
  const initialFilters = loadFiltersFromStorage();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [page, setPage] = useState(loadPageFromStorage());
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>([]);
  const [eventTypes, setEventTypes] = useState<ApiEventType[]>([]);

  // Fetch available event types for dropdown
  const { data: eventTypesData } = useApiQuery({
    url: endPoints.templateEventTypes,
    queryKey: ["template-event-types"],
  });

  // Set event types when data is loaded
  useEffect(() => {
    if (eventTypesData?.data) {
      setEventTypes(eventTypesData.data);
    }
  }, [eventTypesData]);

  // Helper to get channel ID
  const getChannelTypeId = (key: string) => {
    if (key === 'all') return undefined;
    const channel = CHANNEL_TYPES.find(c => c.key === key);
    return channel?.id;
  };

  // API Integration using standard useApiQuery
  const {
    data: apiResponse,
    isLoading: isApiLoading,
    error: apiError,
    refetch
  } = useApiQuery({
    url: (() => {
      const getQueryParams = () => {
        const statusParam = appliedFilters.templateStatus === 'all' ? undefined : (appliedFilters.templateStatus === 'active' ? 'active' : 'inactive');

        return {
          page,
          limit: pageSize,
          search: appliedFilters.search || undefined,
          channelTypeId: getChannelTypeId(appliedFilters.channelType),
          approvalStatus: appliedFilters.approvalStatus === 'all' ? undefined : appliedFilters.approvalStatus,
          status: statusParam,
        };
      };

      const params = getQueryParams();
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      return `${endPoints.templates}?${queryString}`;
    })(),
    queryKey: ['notification-templates', page, pageSize, appliedFilters],
    shouldShowLoader: false, // Page has its own loading state logic below
  });

  // Save applied filters to sessionStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(appliedFilters);
  }, [appliedFilters]);

  // Save page to sessionStorage whenever it changes
  useEffect(() => {
    savePageToStorage(page);
  }, [page]);

  // Cleanup sessionStorage when navigating out of template management module
  const location = useLocation();
  useEffect(() => {
    return () => {
      // Check if the next route is still within template management
      // Use setTimeout to allow navigation to complete before checking
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith(`/${TEMPLATE_MANAGEMENT_BASE_PATH}`)) {
          sessionStorage.removeItem(FILTERS_STORAGE_KEY);
          sessionStorage.removeItem(PAGE_STORAGE_KEY);
        }
      }, 0);
    };
  }, [location.pathname]);

  // Memoized merged templates
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const loadAndMergeTemplates = () => {
      // 1. Get Standard Mocks
      const templateMap = new Map<string, Template>();

      // 2. Local Storage Logic Removed as requested

      // 3. Merge API Templates
      const responseData = (apiResponse as ApiBaseResponse<ApiTemplateListResponse>)?.data;
      if (responseData?.templates) {
        responseData.templates.forEach((t) => {
          // Find event type name by matching eventTypeId with eventTypes array
          const eventTypeName = t.eventTypeId
            ? eventTypes.find((et) => et.id === t.eventTypeId)?.name
            : undefined;

          templateMap.set(t.id.toString(), {
            id: t.id.toString(),
            name: t.subject || `Template ${t.id}`,
            description: t.eventTypeName || 'Template',
            type: (CHANNEL_TYPES.find(c => c.id === t.channelTypeId)?.key || findChannelType(t.channelType)?.key || 'email') as Template['type'],
            approvalStatus: (t.approvalStatus?.toLowerCase() || 'draft') as ApprovalStatusEnum,
            templateStatus: (t.status?.toLowerCase() || 'inactive') as TemplateStatusEnum,
            status: t.approvalStatus || 'draft', // for backward compatibility in some components
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            createdBy: t.createdBy.toString() || "System",
            eventTypeId: t.eventTypeId,
            eventTypeName: eventTypeName, // Use the matched event type name
            isCompanyCustomizable: (t as any).isCompanyCustomizable,
            configId: (t as any).configId ?? null,
            companyName: (t as any).companyName ?? null,
            subDomain: (t as any).overrideSubDomain ?? null,
            formData: {
              content: t.body,
              subject: t.subject || ''
            }
          });
        });
        setTotalTemplates(responseData.total || 0);
      }

      setAllTemplates(Array.from(templateMap.values()));
    };

    loadAndMergeTemplates();
  }, [apiResponse, eventTypes]);

  // Sync internal state for loading/error
  useEffect(() => {
    setState(prev => ({
      ...prev,
      templates: allTemplates,
      loading: isApiLoading,
      error: apiError ? 'Failed to fetch templates from backend' : ''
    }));
  }, [allTemplates, isApiLoading, apiError]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1); // Reset to first page when changing page size
  };

  const handleCreateNew = () => {
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/create`);
  };

  // Row click navigates straight into the Customise/detail screen for
  // every template — Edit/Preview/History/Remove Trigger/Delete/workflow
  // actions all now live as buttons on that screen instead of a kebab menu
  // here (see TemplateCustomisation/index.tsx).
  const handleCustomise = (id: string) => {
    navigate(`/${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/${id}`);
  };

  const handleErrorDismiss = () => {
    setState(prev => ({
      ...prev,
      error: '',
    }));
  };

  const handleApplyFilters = () => {
    setPage(1); // Reset to first page on filter application
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      search: '',
      channelType: 'all',
      approvalStatus: 'all',
      templateStatus: 'all',
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = () => {
    refetch();
  };

  // Table columns configuration
  const tableColumns: ColDef[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Template / Event",
        flex: 2,
        sortable: false,
        tooltipField: "name",
        cellRenderer: (params: any) => {
          const isOverride = params.data?.configId != null;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden" }}>
              <Typography variant="body2" noWrap title={params.value}>
                {params.value}
              </Typography>
              <Chip
                label={isOverride ? "Customized" : "Default"}
                size="small"
                color={isOverride ? "warning" : "default"}
                variant={isOverride ? "filled" : "outlined"}
                sx={{ height: 20, fontSize: 11, flexShrink: 0 }}
              />
            </Box>
          );
        },
      },
      {
        // Only set for a company/domain override row; blank for the shared
        // default (there is no single company a default belongs to).
        field: "companyName",
        headerName: "Company",
        flex: 1.2,
        sortable: false,
        cellRenderer: (params: any) => (
          <Typography variant="body2" color={params.value ? "text.primary" : "text.secondary"}>
            {params.value || "—"}
          </Typography>
        ),
      },
      {
        field: "subDomain",
        headerName: "Subdomain",
        flex: 1,
        sortable: false,
        cellRenderer: (params: any) => (
          <Typography variant="body2" color={params.value ? "text.primary" : "text.secondary"}>
            {params.value || "—"}
          </Typography>
        ),
      },
      {
        field: "type",
        headerName: "Channel Type",
        flex: 1,
        sortable: false,
        cellRenderer: (params: any) => {
          const type = params.value || "email";
          return <Chip label={type.toUpperCase()} size="small" />;
        },
      },
      {
        field: "approvalStatus",
        headerName: "Approval Status",
        flex: 1,
        sortable: false,
        cellRenderer: (params: any) => {
          const status = params.value || "draft";
          return <Chip label={status.toUpperCase()} size="small" />;
        },
      },
      {
        field: "templateStatus",
        headerName: "Template Status",
        flex: 1,
        sortable: false,
        cellRenderer: (params: any) => {
          const status = params.value || "inactive";
          const isActive = status === TemplateStatusEnum.ACTIVE;
          return (
            <Chip
              label={status.toUpperCase()}
              size="small"
              variant="outlined"
              color={isActive ? "success" : "default"}
            />
          );
        },
      },
      {
        field: "updatedAt",
        headerName: "Last Updated",
        flex: 1,
        sortable: false,
        valueFormatter: (params: any) => {
          return params.value
            ? new Date(params.value).toLocaleDateString("en-GB")
            : "";
        },
      },
      {
        field: "eventTypeName",
        headerName: "Triggered On",
        flex: 1.5,
        sortable: false,
        cellRenderer: (params: any) => {
          const eventTypeName = params.value;
          return eventTypeName ? (
            <Chip
              label={eventTypeName}
              size="small"
              color="info"
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" color="black">
              Not Assigned
            </Typography>
          );
        },
      },
    ],
    []
  );

  const headerActions = (
    <HeaderActionsContainer>
      <IconButton size="small" onClick={handleRefresh}><RefreshIcon /></IconButton>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleCreateNew}
      >
        Create Template
      </Button>
    </HeaderActionsContainer>
  );

  return (
    <TemplateLayout
      title="Template Management"
      headerActions={headerActions}
      loading={false}
    >
      <TemplateTopNav />
      <DashboardContainer>
        {state.error && (
          <ErrorAlertContainer>
            <Alert
              severity="error"
              onClose={handleErrorDismiss}
              action={
                <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              }
            >
              <AlertTitle>Error</AlertTitle>
              {state.error}
            </Alert>
          </ErrorAlertContainer>
        )}

        <FiltersContainer>
          <FilterField>
            <FormControl fullWidth size="small">
              <StyledInputLabel id="channel-type-filter-label" shrink={true}>Channel Type</StyledInputLabel>
              <WhiteSelect
                labelId="channel-type-filter-label"
                value={filters.channelType}
                label="Channel Type"
                onChange={(e: any) => handleFilterChange('channelType', e.target.value)}
              >
                <MenuItem value="all">All Channels</MenuItem>
                {CHANNEL_TYPES.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.label}
                  </MenuItem>
                ))}
              </WhiteSelect>
            </FormControl>
          </FilterField>

          <FilterField>
            <FormControl fullWidth size="small">
              <StyledInputLabel id="status-filter-label" shrink={true}>Approval Status</StyledInputLabel>
              <WhiteSelect
                labelId="status-filter-label"
                value={filters.approvalStatus}
                label="Approval Status"
                onChange={(e: any) => handleFilterChange('approvalStatus', e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.values(ApprovalStatusEnum).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </WhiteSelect>
            </FormControl>
          </FilterField>

          <FilterField>
            <FormControl fullWidth size="small">
              <StyledInputLabel id="template-status-filter-label" shrink={true}>Template Status</StyledInputLabel>
              <WhiteSelect
                labelId="template-status-filter-label"
                value={filters.templateStatus}
                label="Template Status"
                onChange={(e: any) => handleFilterChange('templateStatus', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </WhiteSelect>
            </FormControl>
          </FilterField>

          <FlexibleFilterField>
            <SearchWrapper>
              <StyledSearchIcon>
                <SearchIcon />
              </StyledSearchIcon>
              <StyledInputBase
                placeholder="Search by subject..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
              />
            </SearchWrapper>
          </FlexibleFilterField>

          <ActionButton
            variant="contained"
            onClick={handleApplyFilters}
          >
            Apply
          </ActionButton>
          <ActionButton
            variant="outlined"
            onClick={handleResetFilters}
          >
            Reset
          </ActionButton>
        </FiltersContainer>

        {state.loading ? (
          <LoadingBox>
            <CircularProgress color="primary" />
          </LoadingBox>
        ) : state.templates.length === 0 ? (
          <EmptyStateContainer>
            <EmptyStateTitle variant="h6" gutterBottom>
              No templates found
            </EmptyStateTitle>
            <EmptyStateDescription variant="body2">
              There are no templates matching your criteria.
            </EmptyStateDescription>
          </EmptyStateContainer>
        ) : (
          <>
            <ServerSideGrid
              rows={state.templates}
              columns={tableColumns}
              totalRecords={totalTemplates}
              currentPage={page}
              loading={state.loading}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={handlePageSizeChange}
              setSort={setSort}
              height={600}
              emptyDataMessage="No templates found matching your criteria"
              // Clicking anywhere on a row jumps straight into its detail
              // screen — no menu, no kebab. That screen hosts Edit/History/
              // Preview/Remove Trigger/Delete/workflow actions plus
              // Customise (which itself decides, from that one template's
              // own fetched data, whether it's actually customizable per
              // company/domain — see TemplateCustomisation/index.tsx).
              onRowClicked={(event: any) => {
                const template = event.data as Template;
                if (template?.id) handleCustomise(template.id);
              }}
              // Every row is clickable now, so the cursor is just a plain
              // pointer everywhere — no per-row conditional needed.
              getRowStyle={() => ({ cursor: 'pointer' })}
            />
            {totalTemplates > 0 && (
              <PaginationContainer>
                <ServerSideGridStyledFormControl variant="outlined" size="small">
                  <StyledBox>Showing </StyledBox>
                  <StyledSelect
                    value={pageSize}
                    inputProps={{ "aria-label": "Page size" }}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                  <StyledBox>of {totalTemplates} entries</StyledBox>
                </ServerSideGridStyledFormControl>
                <Pagination
                  totalRecords={totalTemplates}
                  currentPage={page}
                  onPageChange={handlePageChange}
                  pageSize={pageSize}
                />
              </PaginationContainer>
            )}
          </>
        )}

      </DashboardContainer>
    </TemplateLayout>
  );
};

export default TemplateDashboard;
import { capitalizeFirst } from '../../utils';
import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { UploadFile, Close } from '@mui/icons-material';
import dayjs from 'dayjs';
import NoDataPage from '../../common/NoData';
import LifeEventsDependentRemoval from './LifeEventsDependentRemoval';
import { apiRequest, endPoints, useLocalization, formatAmountWithCurrency } from '@ui/ui-lib';
import { useDispatch } from 'react-redux';
import {
  LIFE_EVENTS_CONFIRM_REMOVAL_COPY,
} from './constants';
import LifeEventsSuccessPage, {
  LifeEventsSubmissionMeta,
} from './LifeEventsSuccessPage';
import {
  StepContainer,
  ErrorMessage,
  AdditionDetailsFooterActions,
  AdditionDetailsSecondaryButton,
  AdditionDetailsFooterRightGroup,
  AdditionDetailsPrimaryButton,
  ConfirmUploadDependentCard,
  ConfirmUploadDependentRow,
  ConfirmUploadDependentInfo,
  ConfirmUploadDependentName,
  ConfirmUploadDependentDetailInfo,
  ConfirmUploadDependentMeta,
  ConfirmUploadWarningSection,
  ConfirmUploadWarningIcon,
  ConfirmUploadWarningContent,
  ConfirmUploadWarningTitle,
  ConfirmUploadPoliciesText,
  ConfirmUploadDocumentSection,
  ConfirmUploadDocumentTitle,
  ConfirmUploadDocumentZone,
  ConfirmUploadDocumentZoneIcon,
  ConfirmUploadDocumentZoneText,
  ConfirmUploadDocumentZoneSubtext,
  ConfirmUploadUploadedFileCard,
  ConfirmUploadUploadedFileInfo,
  ConfirmUploadUploadedFileText,
  ConfirmUploadUploadedFileName,
  ConfirmUploadUploadedFileSize,
  ConfirmUploadUploadedFileRemove,
  // Premium Review Components
  PremiumReviewContainer,
  PremiumReviewCard,
  PremiumSectionCard,
  PremiumSummaryCard,
  PremiumBreakdownTitle,
  PremiumSectionTitle,
  PremiumPolicyCategory,
  PremiumPolicyName,
  PremiumPolicyAmount,
  PremiumSummaryLabel,
  PremiumSummaryValue,
  PremiumReductionValue,
  PremiumTotalLabel,
  PremiumTotalValue,
  PremiumPolicyRowWithBorder,
  PremiumSummaryRow,
  PremiumSummaryRowWithBorder,
  PremiumTotalRow,
  LoadingButtonContent,
} from './styles';
import warningIcon from '../../assets/svgs/warning.svg';
import dependentUpload from '../../../assets/svgs/dependent-upload.svg';
import { setToastMessage } from '../../redux/slice';
import { useNavigate } from 'react-router-dom';

// FIX: All step components are defined OUTSIDE DeletionSteps.
// Previously they were defined inside the render function, which caused React
// to treat them as brand-new component types on every render → remount → state reset.

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const toAmount = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, '').trim());
  return Number.isFinite(numeric) ? numeric : 0;
};

const getPolicyScopeKey = (policy: any) =>
  String(
    policy?.policyTypeKey ??
      policy?.policyId ??
      policy?.policyName ??
      'policy',
  )
    .trim()
    .toLowerCase();

const getPolicyDisplayName = (policy: any) =>
  String(
    policy?.policyName ??
      policy?.policyTypeKey ??
      policy?.policyType ??
      'Policy',
  ).trim();

const annotatePolicyScopedItem = (item: any, policy: any) => ({
  ...item,
  sourcePolicyId: policy?.policyId ?? null,
  sourcePolicyName: policy?.policyName ?? null,
  sourcePolicyTypeKey: policy?.policyTypeKey ?? null,
  sourcePolicyScopeKey: getPolicyScopeKey(policy),
});

const isSupportedFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return (
    file.type === 'application/pdf' ||
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png')
  );
};

const getDependentIdentityKey = (dep: any) =>
  [
    String(dep?.name ?? '').toLowerCase().trim(),
    String(dep?.relation ?? dep?.relationship ?? '').toLowerCase().trim(),
    String(dep?.gender ?? '').toLowerCase().trim(),
  ].join('|');

const buildMergedLifeEventPolicyData = (
  gmcPolicyData: any,
  lifeEventPolicySources: any[] = [],
) => {
  const sourcePolicies = Array.isArray(lifeEventPolicySources)
    ? lifeEventPolicySources
    : [];

  if (!sourcePolicies.length) {
    return gmcPolicyData;
  }

  // Deduplicate dependents across all policies by name|relation|gender.
  // Each deduplicated entry carries enrolledPolicies — an array of per-policy
  // objects that record which choices that person has in each policy.
  const dependentByKey = new Map<string, any>();

  sourcePolicies.forEach((policy: any) => {
    const policyMeta = {
      sourcePolicyId: policy?.policyId ?? null,
      sourcePolicyName: getPolicyDisplayName(policy),
      sourcePolicyScopeKey: getPolicyScopeKey(policy),
    };

    (policy?.configuration?.dependents || []).forEach((dep: any) => {
      const identityKey = getDependentIdentityKey(dep);
      if (!identityKey || identityKey === '||') return;

      const enrolledPolicyEntry = {
        ...policyMeta,
        policyComponentActionTypeId: dep.policyComponentActionTypeId ?? null,
        choices: Array.isArray(dep.choices) ? dep.choices : [],
      };

      const existing = dependentByKey.get(identityKey);
      if (!existing) {
        dependentByKey.set(identityKey, {
          ...annotatePolicyScopedItem(dep, policy),
          enrolledPolicies: [enrolledPolicyEntry],
        });
      } else {
        dependentByKey.set(identityKey, {
          ...existing,
          enrolledPolicies: [...(existing.enrolledPolicies || []), enrolledPolicyEntry],
        });
      }
    });
  });

  const mergedDependents = Array.from(dependentByKey.values());

  const mergedEmployeeChoices = sourcePolicies.flatMap(
    (policy: any) =>
      (policy?.configuration?.employeeChosenChoices || []).map((choice: any) =>
        annotatePolicyScopedItem(choice, policy),
      ),
  );
  const mergedPolicyComponents = sourcePolicies.flatMap(
    (policy: any) =>
      (policy?.configuration?.policyComponentsConfiguration?.components || []).map(
        (component: any) => annotatePolicyScopedItem(component, policy),
      ),
  );

  return {
    ...gmcPolicyData,
    configuration: {
      ...(gmcPolicyData?.configuration || {}),
      dependents: mergedDependents,
      employeeChosenChoices: mergedEmployeeChoices,
      policyComponentsConfiguration: {
        ...(gmcPolicyData?.configuration?.policyComponentsConfiguration || {}),
        components: mergedPolicyComponents,
      },
    },
  };
};

const noop = () => undefined;

const SelectDependentStep: React.FC<{
  selectedLifeEvent: string | null;
  gmcPolicyData: any;
  lifeEventPolicySources?: any[];
  onDependentSelection: (dependents: any[]) => void;
  getSelectedLifeEventData: () => any;
  selectedDependents: number[]; // IDs of selected dependents for removal
  setSelectedDependents: React.Dispatch<React.SetStateAction<number[]>>;
  onBack: () => void;
  onContinue: () => void;
}> = ({
  selectedLifeEvent,
  gmcPolicyData,
  lifeEventPolicySources = [],
  onDependentSelection,
  getSelectedLifeEventData,
  selectedDependents,
  setSelectedDependents,
  onBack,
  onContinue,
}) => {
  const navigate = useNavigate();
  const mergedPolicyData = useMemo(
    () => buildMergedLifeEventPolicyData(gmcPolicyData, lifeEventPolicySources),
    [gmcPolicyData, lifeEventPolicySources],
  );
 
  return (
    <StepContainer>
      {selectedLifeEvent && mergedPolicyData ? (
        <LifeEventsDependentRemoval
          selectedLifeEvent={selectedLifeEvent}
          policyData={mergedPolicyData}
          onDependentSelection={onDependentSelection}
          lifeEventData={getSelectedLifeEventData()}
          selectedDependents={selectedDependents}
          setSelectedDependents={setSelectedDependents}
          onBack={onBack}
          onContinue={onContinue}
          onExit={() => navigate('/life-events')}
        />
      ) : (
        <ErrorMessage>
          {LIFE_EVENTS_CONFIRM_REMOVAL_COPY.selectDependentFirstMessage}
        </ErrorMessage>
      )}
    </StepContainer>
  );
};

// Combined Confirm & Upload Documents Step (Step 1 in new flow)
const ConfirmAndUploadStep: React.FC<{
  dependentsData: any[];
  gmcPolicyData: any;
  lifeEventPolicySources?: any[];
  getSelectedLifeEventData: () => any;
  isSubmitting?: boolean;
  uploadedDocuments: any[];
  onUploadedDocumentsChange: (documents: any[]) => void;
  onBack: () => void;
  onContinue: () => void;
}> = ({
  dependentsData,
  gmcPolicyData,
  lifeEventPolicySources = [],
  getSelectedLifeEventData,
  _isSubmitting = false,
  uploadedDocuments,
  onUploadedDocumentsChange,
  onBack,
  onContinue,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const token = user?.accessToken?.accessToken;
  const companyId = user?.companyId;
  const [uploadingDependentId, setUploadingDependentId] = useState<
    number | null
  >(null);
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState(false);

  const selectedLifeEvent = getSelectedLifeEventData?.();
  const requiredDocuments: string[] =
    selectedLifeEvent?.requiredDocuments && Array.isArray(selectedLifeEvent.requiredDocuments)
      ? selectedLifeEvent.requiredDocuments
      : [];

  const uploadedByDependentId = useMemo(() => {
    const map = new Map<number, Array<{ id: number | string; fileName?: string; fileSize?: number }>>();
    (uploadedDocuments || []).forEach((doc: any) => {
      const depId = Number(doc?.dependentId);
      if (!Number.isFinite(depId)) return;
      const list = map.get(depId) ?? [];
      list.push({
        id: doc?.id,
        fileName: doc?.fileName,
        fileSize: Number(doc?.fileSize || doc?.size || 0),
      });
      map.set(depId, list);
    });
    return map;
  }, [uploadedDocuments]);

  const hasUploadedDocumentForEveryDependent = useMemo(() => {
    if (!Array.isArray(dependentsData) || dependentsData.length === 0) {
      return false;
    }
    return dependentsData.every((dependent: any) => {
      const dependentId = Number(dependent?.id);
      if (!Number.isFinite(dependentId)) {
        return false;
      }
      const docs = uploadedByDependentId.get(dependentId) || [];
      return docs.length > 0;
    });
  }, [dependentsData, uploadedByDependentId]);

  const handleContinueClick = () => {
    setHasAttemptedContinue(true);
    if (!hasUploadedDocumentForEveryDependent || uploadingDependentId !== null) {
      return;
    }
    onContinue();
  };

  const removeUploadedDocument = (dependentId: number, fileId: number | string) => {
    const nextDocs = (uploadedDocuments || []).filter((doc: any) => {
      const isSameDependent = Number(doc?.dependentId) === Number(dependentId);
      const isSameFile = String(doc?.id) === String(fileId);
      return !(isSameDependent && isSameFile);
    });
    onUploadedDocumentsChange(nextDocs);
  };

  const uploadFilesForDependent = async (dependentId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(
      (file) => isSupportedFile(file) && file.size <= MAX_FILE_SIZE_BYTES,
    );

    if (validFiles.length === 0) {
      dispatch(
        setToastMessage(
          'Please upload PDF, JPG, or PNG files up to 5MB only.',
        ),
      );
      return;
    }

    setUploadingDependentId(dependentId);
    try {
      const uploadedResponses = await Promise.all(
        validFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('companyType', 'company');
          formData.append('companyId', String(companyId || ''));
          formData.append('documentTypeLid', -1);

          const response = await apiRequest(endPoints.ibpFileUpload, {
            method: 'POST',
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const uploadedFile =
            (response as any)?.data?.data ||
            (response as any)?.data ||
            response;

          return {
            id: uploadedFile?.id,
            fileName: uploadedFile?.fileName || file.name,
            dependentId,
            fileSize: file.size,
          };
        }),
      );

      const nextDocs = uploadedResponses.filter((d) => Boolean(d?.id));
      if (nextDocs.length) {
        onUploadedDocumentsChange([...(uploadedDocuments || []), ...nextDocs]);
        dispatch(setToastMessage('Document uploaded successfully.'));
      }
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            'Document upload failed. Please try again.',
        ),
      );
    } finally {
      setUploadingDependentId(null);
    }
  };

  // Build a unified component ID → { label, policyName } map from ALL policy sources.
  // Falls back to the GMC merged components so existing behaviour is preserved.
  const componentInfoById = useMemo(() => {
    const map = new Map<number, { label: string; policyName: string }>();
    const allSources = lifeEventPolicySources.length
      ? lifeEventPolicySources
      : gmcPolicyData
      ? [gmcPolicyData]
      : [];

    allSources.forEach((policy: any) => {
      const policyName = getPolicyDisplayName(policy);
      (policy?.configuration?.policyComponentsConfiguration?.components || []).forEach(
        (comp: any) => {
          const id = Number(comp?.id);
          if (Number.isFinite(id) && id > 0) {
            map.set(id, {
              label: String(comp?.label ?? comp?.name ?? `Component ${id}`),
              policyName,
            });
          }
        },
      );
    });
    return map;
  }, [lifeEventPolicySources, gmcPolicyData]);

  // Returns groups of { policyName, labels[] } for "GMC (Base Policy, Dental), GPA (GPA)" format.
  // Uses per-policy enrolledPolicies when available (post-deduplication).
  const getDependentPolicyGroups = (dependent: any): Array<{ policyName: string; labels: string[] }> => {
    const enrolledPolicies: any[] = Array.isArray(dependent?.enrolledPolicies)
      ? dependent.enrolledPolicies
      : [];

    if (enrolledPolicies.length > 0) {
      return enrolledPolicies.map((enrolled: any) => {
        const componentIds = new Set<number>();
        const mainId = Number(enrolled?.policyComponentActionTypeId);
        if (Number.isFinite(mainId) && mainId > 0) componentIds.add(mainId);
        (enrolled?.choices || []).forEach((choice: any) => {
          const id = Number(choice?.policyComponentActionTypeId);
          if (Number.isFinite(id) && id > 0) componentIds.add(id);
        });

        const labels: string[] = [];
        componentIds.forEach((id) => {
          const info = componentInfoById.get(id);
          if (info?.label) labels.push(info.label);
        });

        return {
          policyName: enrolled.sourcePolicyName ?? 'Policy',
          labels,
        };
      });
    }

    // Fallback: group by policy using componentInfoById
    const componentIds = new Set<number>();
    if (dependent.policyComponentActionTypeId) {
      const id = Number(dependent.policyComponentActionTypeId);
      if (Number.isFinite(id)) componentIds.add(id);
    }
    (dependent.choices || []).forEach((choice: any) => {
      const id = Number(choice?.policyComponentActionTypeId);
      if (Number.isFinite(id)) componentIds.add(id);
    });

    const byPolicy = new Map<string, { policyName: string; labels: string[] }>();
    componentIds.forEach((id) => {
      const info = componentInfoById.get(id);
      const policyName =
        info?.policyName ?? dependent?.sourcePolicyName ?? getPolicyDisplayName(gmcPolicyData);
      const label = info?.label ?? '';
      if (!label) return;
      const existing = byPolicy.get(policyName) ?? { policyName, labels: [] };
      existing.labels.push(label);
      byPolicy.set(policyName, existing);
    });
    return Array.from(byPolicy.values());
  };

  return (
    <StepContainer>
    {dependentsData?.length > 0 ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {dependentsData.map((dependent) => {
          const age = dayjs().diff(dayjs(dependent.dateOfBirth), 'year');
          const policyGroups = getDependentPolicyGroups(dependent);
          const dependentDocs = uploadedByDependentId.get(Number(dependent.id)) || [];

          const policiesText = policyGroups
            .flatMap((group) => group.labels)
            .join(', ');

          return (
            <ConfirmUploadDependentCard key={dependent.id}>
              <ConfirmUploadDependentRow>
                {/* Left Side - Dependent Info */}
                <ConfirmUploadDependentInfo>
                  {/* Dependent Name */}
                  <ConfirmUploadDependentDetailInfo>
                  <ConfirmUploadDependentName>
                    {dependent.name}
                  </ConfirmUploadDependentName>

                  {/* Dependent Meta Info */}
                  <ConfirmUploadDependentMeta>
                    {capitalizeFirst(dependent.relation)} | {age} Years
                  </ConfirmUploadDependentMeta>
                </ConfirmUploadDependentDetailInfo>
                  {/* Warning Section with Policies */}
                  <ConfirmUploadWarningSection>
                    <ConfirmUploadWarningIcon>
                      <img src={warningIcon} alt="Warning" />
                    </ConfirmUploadWarningIcon>
                    <ConfirmUploadWarningContent>
                      <ConfirmUploadWarningTitle addPadding={policyGroups.length === 0}>
                        {policyGroups.length > 0
                          ? `The dependent will be removed from these policies: `
                          : 'This dependent is not enrolled in any policy and can be removed only from the dependent list.'}
                      </ConfirmUploadWarningTitle>
                      {policyGroups.length > 0 && (
                        <ConfirmUploadPoliciesText>
                          {policiesText}
                        </ConfirmUploadPoliciesText>
                      )}
                    </ConfirmUploadWarningContent>
                  </ConfirmUploadWarningSection>
                </ConfirmUploadDependentInfo>

                {/* Right Side - Document Upload */}
                <ConfirmUploadDocumentSection>
                  <ConfirmUploadDocumentTitle>
                    {dependent.name}{' '}
                    {requiredDocuments?.[0] || 'Document Proof'}
                  </ConfirmUploadDocumentTitle>

                  {dependentDocs.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {dependentDocs.map((doc) => {
                        const fileSizeKb = Math.max(
                          0,
                          Math.round(Number(doc.fileSize || 0) / 1024),
                        );
                        return (
                          <ConfirmUploadUploadedFileCard key={`${dependent.id}-${doc.id}`}>
                            <ConfirmUploadUploadedFileInfo>
                              <UploadFile fontSize="small" />
                              <ConfirmUploadUploadedFileText>
                                <ConfirmUploadUploadedFileName
                                  component="a"
                                  href={endPoints.ibpFileUploadDownloadById(Number(doc.id))}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                  {doc.fileName || `Document ${doc.id}`}
                                </ConfirmUploadUploadedFileName>
                                <ConfirmUploadUploadedFileSize>
                                  {fileSizeKb > 0 ? `${fileSizeKb}kb` : '--'}
                                </ConfirmUploadUploadedFileSize>
                              </ConfirmUploadUploadedFileText>
                            </ConfirmUploadUploadedFileInfo>
                            <ConfirmUploadUploadedFileRemove
                              onClick={() =>
                                removeUploadedDocument(Number(dependent.id), doc.id)
                              }
                            >
                              <Close fontSize="small" />
                            </ConfirmUploadUploadedFileRemove>
                          </ConfirmUploadUploadedFileCard>
                        );
                      })}
                    </Box>
                  ) : (
                    <>
                      <ConfirmUploadDocumentZone
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.jpg,.jpeg,.png';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              void uploadFilesForDependent(Number(dependent.id), files);
                            }
                          };
                          input.click();
                        }}
                      >
                        <ConfirmUploadDocumentZoneIcon>
                          {uploadingDependentId === Number(dependent.id) ? (
                            <CircularProgress size={18} />
                          ) : (
                            <img src={dependentUpload} alt="Upload File" />
                          )}
                        </ConfirmUploadDocumentZoneIcon>
                        <ConfirmUploadDocumentZoneText>
                          Click to upload or drag and drop
                          <br />
                          <ConfirmUploadDocumentZoneSubtext>
                            PDF upto 5MB
                          </ConfirmUploadDocumentZoneSubtext>
                        </ConfirmUploadDocumentZoneText>
                      </ConfirmUploadDocumentZone>
                      {hasAttemptedContinue && (
                        <Typography
                          sx={{
                            mt: 1,
                            fontSize: '12px',
                            lineHeight: 1.4,
                            color: '#D32F2F',
                          }}
                        >
                          This document is required.
                        </Typography>
                      )}
                    </>
                  )}
                </ConfirmUploadDocumentSection>
              </ConfirmUploadDependentRow>
            </ConfirmUploadDependentCard>
          );
        })}

        {/* Footer Actions */}
        <AdditionDetailsFooterActions>
          <AdditionDetailsSecondaryButton onClick={onBack}>
            Back
          </AdditionDetailsSecondaryButton>
          <AdditionDetailsFooterRightGroup>
            <AdditionDetailsSecondaryButton onClick={() => navigate('/life-events')}>
              Quit / Exit
            </AdditionDetailsSecondaryButton>
            <AdditionDetailsPrimaryButton
              onClick={handleContinueClick}
              disabled={uploadingDependentId !== null}
            >
              Continue
            </AdditionDetailsPrimaryButton>
          </AdditionDetailsFooterRightGroup>
        </AdditionDetailsFooterActions>
      </Box>
    ) : (
      <NoDataPage
        compactView
        showFlyingBirds={false}
        showDivider={false}
        removeMaxWidth
        title="No dependents selected"
        subtitle="Please select dependents to remove before continuing."
      />
      )}
    </StepContainer>
  );
};

// Review Premium Step (Step 2 in new flow)
const ReviewPremiumStep: React.FC<{
  dependentsData: any[];
  gmcPolicyData: any;
  lifeEventPolicySources?: any[];
  getSelectedLifeEventData: () => any;
  onBack: () => void;
  onContinue: () => void;
  isSubmitting?: boolean;
}> = ({
  dependentsData,
  gmcPolicyData: _gmcPolicyData,
  lifeEventPolicySources = [],
  _getSelectedLifeEventData,
  onBack,
  onContinue,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  // Get component IDs for a dependent, scoped to a specific policy.
  // For deduplicated multi-policy dependents, reads from the matching enrolledPolicies entry.
  const getDependentComponentIdsForPolicy = (dependent: any, scopeKey: string) => {
    const enrolledEntry = (dependent?.enrolledPolicies || []).find(
      (ep: any) => ep?.sourcePolicyScopeKey === scopeKey,
    );
    const source = enrolledEntry ?? dependent;
    const componentIds = new Set<number>();
    if (source?.policyComponentActionTypeId) {
      componentIds.add(Number(source.policyComponentActionTypeId));
    }
    (source?.choices || []).forEach((choice: any) => {
      const id = Number(choice?.policyComponentActionTypeId);
      if (Number.isFinite(id) && id > 0) componentIds.add(id);
    });
    return Array.from(componentIds).filter((id) => Number.isFinite(id) && id > 0);
  };

  // Legacy helper used for counting existing policy dependents (non-merged).
  const getDependentComponentIds = (dependent: any) => {
    const componentIds = new Set<number>();
    if (dependent?.policyComponentActionTypeId) {
      componentIds.add(Number(dependent.policyComponentActionTypeId));
    }
    (dependent?.choices || []).forEach((choice: any) => {
      const choiceComponentId = Number(choice?.policyComponentActionTypeId);
      if (Number.isFinite(choiceComponentId)) componentIds.add(choiceComponentId);
    });
    return Array.from(componentIds).filter((id) => Number.isFinite(id));
  };

  const getDependentPolicyScopeKey = (dependent: any) =>
    String(
      dependent?.sourcePolicyScopeKey ??
        dependent?.sourcePolicyTypeKey ??
        dependent?.policyTypeKey ??
        dependent?.sourcePolicyId ??
        dependent?.policyId ??
        'policy',
    )
      .trim()
      .toLowerCase();

  const policyBreakdowns = useMemo(() => {
    return (lifeEventPolicySources || []).map((policy: any) => {
      const policyScopeKey = getPolicyScopeKey(policy);
      const policyTitle = getPolicyDisplayName(policy);
      const policyTemplate = policy?.configuration?.policyTemplate || {};
      const policyComponents =
        policy?.configuration?.policyComponentsConfiguration?.components || [];
      const policyEmployeeChoices = policy?.configuration?.employeeChosenChoices || [];

      // A dependent belongs to this policy if either:
      // (a) its primary sourcePolicyScopeKey matches (non-deduplicated path), or
      // (b) it has an enrolledPolicies entry for this scope (deduplicated multi-policy path).
      const policyDependents = (dependentsData || []).filter((dependent: any) => {
        const primaryMatch = getDependentPolicyScopeKey(dependent) === policyScopeKey;
        const enrolledMatch = (dependent?.enrolledPolicies || []).some(
          (ep: any) => ep?.sourcePolicyScopeKey === policyScopeKey,
        );
        if (!primaryMatch && !enrolledMatch) return false;
        const scopedIds = getDependentComponentIdsForPolicy(dependent, policyScopeKey);
        return scopedIds.length > 0;
      });

      const getComponentLabel = (componentId: number) => {
        const component = policyComponents.find(
          (comp: any) => Number(comp?.id) === Number(componentId),
        );
        return component ? component.label : `Component ${componentId}`;
      };

      const getComponentDetails = (componentId: number) => {
        const component = policyComponents.find(
          (comp: any) => Number(comp?.id) === Number(componentId),
        );
        const currentChoice = policyEmployeeChoices.find(
          (choice: any) =>
            Number(choice?.policyComponentActionTypeId) === Number(componentId),
        );
        return {
          id: componentId,
          label: getComponentLabel(componentId),
          premium: toAmount(currentChoice?.premium ?? component?.premium),
          employeeContribution: toAmount(
            currentChoice?.employeePay ??
              currentChoice?.employeeContribution ??
              component?.employeeContribution,
          ),
          companyContribution: toAmount(
            currentChoice?.companyPay ??
              currentChoice?.companyContribution ??
              component?.companyContribution,
          ),
          premiumPerLife: Boolean(component?.premiumPerLife),
          type: component?.type,
          isOptional: component?.isOptional === true,
        };
      };

      // Use policy-scoped component IDs for dependents being removed.
      const getDependentComponentsWithPremium = (dependent: any) =>
        getDependentComponentIdsForPolicy(dependent, policyScopeKey).map((id: number) =>
          getComponentDetails(id),
        );

      const currentDependentCountByComponentId = new Map<number, number>();
      (policy?.configuration?.dependents || []).forEach((dependent: any) => {
        getDependentComponentIds(dependent).forEach((componentId: number) => {
          currentDependentCountByComponentId.set(
            componentId,
            (currentDependentCountByComponentId.get(componentId) || 0) + 1,
          );
        });
      });

      const removedCountByComponentId = new Map<number, number>();
      policyDependents.forEach((dependent: any) => {
        getDependentComponentIdsForPolicy(dependent, policyScopeKey).forEach((componentId: number) => {
          removedCountByComponentId.set(
            componentId,
            (removedCountByComponentId.get(componentId) || 0) + 1,
          );
        });
      });

      const selfEligibleByComponentId = new Map<number, boolean>();
      const addEligibleRelations = (componentId: unknown, eligibleRelations?: unknown[]) => {
        const parsedId = Number(componentId);
        if (!Number.isFinite(parsedId)) return;
        const hasSelf = (eligibleRelations || []).some(
          (relation) => String(relation || '').trim().toLowerCase() === 'self',
        );
        if (hasSelf) {
          selfEligibleByComponentId.set(parsedId, true);
        }
      };

      addEligibleRelations(
        policyTemplate?.basePolicy?.mainPolicyId,
        policyTemplate?.basePolicy?.eligibleRelations,
      );
      (policyTemplate?.basePolicy?.addonIds || []).forEach((addon: any) => {
        addEligibleRelations(addon?.optionId, addon?.eligibleRelations);
      });
      addEligibleRelations(
        policyTemplate?.parentalPolicy?.mainPolicyId,
        policyTemplate?.parentalPolicy?.eligibleRelations,
      );
      (policyTemplate?.parentalPolicy?.addonIds || []).forEach((addon: any) => {
        addEligibleRelations(addon?.optionId, addon?.eligibleRelations);
      });

      const reductionByComponentId = new Map<number, number>();
      const currentPremiumByComponentId = new Map<number, number>();
      const perLifeUnitPremiumByComponentId = new Map<number, number>();

      policyComponents.forEach((component: any) => {
        const componentId = Number(component?.id);
        if (!Number.isFinite(componentId)) return;
        const isPerLife = Boolean(component?.premiumPerLife);
        const currentChoice = policyEmployeeChoices.find(
          (choice: any) =>
            Number(choice?.policyComponentActionTypeId) === componentId,
        );
        const componentPremium = toAmount(
          currentChoice?.employeePay ??
            currentChoice?.employeeContribution ??
            component?.employeeContribution,
        );
        perLifeUnitPremiumByComponentId.set(componentId, componentPremium);

        const hasSelfCoverage = Boolean(selfEligibleByComponentId.get(componentId));
        const currentDependentCount = currentDependentCountByComponentId.get(componentId) || 0;
        const coveredLivesCount = currentDependentCount + (hasSelfCoverage ? 1 : 0);
        const currentComponentPremium = isPerLife
          ? componentPremium * coveredLivesCount
          : coveredLivesCount > 0
          ? componentPremium
          : 0;
        currentPremiumByComponentId.set(componentId, currentComponentPremium);

        const removedCount = removedCountByComponentId.get(componentId) || 0;
        if (isPerLife) {
          reductionByComponentId.set(componentId, componentPremium * removedCount);
        } else {
          const remainingCoveredCount = coveredLivesCount - removedCount;
          reductionByComponentId.set(
            componentId,
            remainingCoveredCount <= 0 ? componentPremium : 0,
          );
        }
      });

      const remainingReductionByComponentId = new Map<number, number>(
        Array.from(reductionByComponentId.entries()),
      );

      const dependentRemovals = policyDependents.map((dependent: any) => {
        const components = getDependentComponentsWithPremium(dependent);

        const componentRows = components.map((comp) => {
          const componentId = Number(comp.id);
          const totalComponentReduction = reductionByComponentId.get(componentId) || 0;
          let reduction = 0;

          if (comp.premiumPerLife) {
            reduction = perLifeUnitPremiumByComponentId.get(componentId) || 0;
          } else if ((remainingReductionByComponentId.get(componentId) || 0) > 0) {
            reduction = totalComponentReduction;
            remainingReductionByComponentId.set(componentId, 0);
          }

          return {
            name: comp.label,
            // Same rule the enrolment and dashboard buckets use: an `optional`
            // component, or one the configurator flagged `isOptional`, is Optional.
            // Compared against true so components saved before the flag existed
            // stay Compulsory.
            category:
              comp.type === 'optional' || comp.isOptional === true
                ? 'Optional'
                : 'Compulsory',
            reduction,
            premiumType: comp.premiumPerLife ? 'Per Life' : 'Per Family',
          };
        });

        return {
          name: dependent.name,
          components: componentRows,
          policyName: dependent?.sourcePolicyName ?? dependent?.policyName ?? policyTitle,
        };
      });

      const selectedComponentIds = new Set<number>();
      policyDependents.forEach((dependent: any) => {
        getDependentComponentIds(dependent).forEach((componentId: number) => {
          selectedComponentIds.add(componentId);
        });
      });

      const currentTotalPremium = Array.from(selectedComponentIds).reduce(
        (sum: number, componentId: number) =>
          sum + (currentPremiumByComponentId.get(componentId) || 0),
        0,
      );
      const premiumReduction = Array.from(reductionByComponentId.values()).reduce(
        (sum, value) => sum + value,
        0,
      );

      return {
        key: policyScopeKey,
        title: policyTitle,
        dependentRemovals,
        currentTotalPremium,
        premiumReduction,
      };
    });
  }, [dependentsData, lifeEventPolicySources]);

  const currentTotalPremium = policyBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.currentTotalPremium,
    0,
  );
  const premiumReduction = policyBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.premiumReduction,
    0,
  );
  const updatedTotalPremium = currentTotalPremium - premiumReduction;
  const payrollInstallments = Math.max(
    1,
    (lifeEventPolicySources || []).reduce((max: number, policy: any) => {
      const inst = policy?.configuration?.constraints?.payrollInstallments;
      return typeof inst === 'number' && inst > max ? inst : max;
    }, 1),
  );
  const monthlyDeduction = Math.max(0, Math.round(updatedTotalPremium / payrollInstallments));
  const formatAmount = (value: number) => formatAmountWithCurrency(Math.max(0, value), localizationData?.data);

  return (
    <StepContainer>
      <PremiumReviewContainer>
        <PremiumReviewCard>
          <PremiumBreakdownTitle>
            Premium Breakdown
          </PremiumBreakdownTitle>

          {/* Dependent-wise premium breakdown */}
          {policyBreakdowns.filter((pb) => pb.dependentRemovals.length > 0).map((policyBreakdown) => (
            <PremiumSectionCard key={policyBreakdown.key}>
              <PremiumSectionTitle>
                Policies Being Removed For - {policyBreakdown.title}
              </PremiumSectionTitle>

              {policyBreakdown.dependentRemovals.map((dependent) => (
                <PremiumSectionCard key={`${policyBreakdown.key}-${dependent.name}`}>
                  <PremiumSectionTitle>
                    Dependent - {dependent.name}
                  </PremiumSectionTitle>

                  <Box sx={{ px: 0.5 }}>
                    <PremiumSummaryLabel sx={{ mb: 1, display: 'block' }}>
                      Policy - {dependent.policyName}
                    </PremiumSummaryLabel>

                    {dependent.components.map((policy: any, index: number) => (
                      <PremiumPolicyRowWithBorder key={index}>
                        <Box>
                          <PremiumPolicyCategory>{policy.category}</PremiumPolicyCategory>
                          <PremiumPolicyName>
                            {policy.name}
                          </PremiumPolicyName>
                        </Box>
                        <PremiumPolicyAmount isReduction={policy.reduction > 0}>
                          {`- ${formatAmount(policy.reduction)}`}
                        </PremiumPolicyAmount>
                      </PremiumPolicyRowWithBorder>
                    ))}
                  </Box>
                </PremiumSectionCard>
              ))}

              <PremiumSectionCard sx={{ mt: 1 }}>
                <PremiumSummaryRowWithBorder sx={{ mb: 1.5 }}>
                  <PremiumSummaryLabel>
                    Current Total Premium (Annual)
                  </PremiumSummaryLabel>
                  <PremiumSummaryValue>
                    {formatAmount(policyBreakdown.currentTotalPremium)}
                  </PremiumSummaryValue>
                </PremiumSummaryRowWithBorder>

                <PremiumSummaryRow sx={{ mb: 0 }}>
                  <PremiumSummaryLabel>
                    Premium Reduction
                  </PremiumSummaryLabel>
                  <PremiumReductionValue>
                    - {formatAmount(policyBreakdown.premiumReduction)}
                  </PremiumReductionValue>
                </PremiumSummaryRow>
              </PremiumSectionCard>
            </PremiumSectionCard>
          ))}

          {/* Premium summary */}
          <PremiumSectionCard sx={{ mt: 1 }}>
            <PremiumSummaryRowWithBorder sx={{ mb: 1.5 }}>
              <PremiumSummaryLabel>
                Current Total Premium (Annual)
              </PremiumSummaryLabel>
              <PremiumSummaryValue>
                {formatAmount(currentTotalPremium)}
              </PremiumSummaryValue>
            </PremiumSummaryRowWithBorder>

            <PremiumSummaryRow sx={{ mb: 0 }}>
              <PremiumSummaryLabel>
                Premium Reduction
              </PremiumSummaryLabel>
              <PremiumReductionValue>
                - {formatAmount(premiumReduction)}
              </PremiumReductionValue>
            </PremiumSummaryRow>

            <PremiumSummaryCard sx={{ mt: 2 }}>
              <PremiumTotalRow sx={{ alignItems: 'flex-start' }}>
                <PremiumTotalLabel>
                  Updated Total Premium (Annual)
                </PremiumTotalLabel>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <PremiumTotalValue>
                    {formatAmount(updatedTotalPremium)}
                  </PremiumTotalValue>
                  <PremiumSummaryLabel sx={{ color: '#4B5563' }}>
                    {formatAmount(monthlyDeduction)}/month
                  </PremiumSummaryLabel>
                </Box>
              </PremiumTotalRow>
            </PremiumSummaryCard>
          </PremiumSectionCard>
        </PremiumReviewCard>
      </PremiumReviewContainer>

      {/* Footer Actions - Bottom positioned like other steps */}
      <AdditionDetailsFooterActions>
        <AdditionDetailsSecondaryButton onClick={onBack}>
          Back
        </AdditionDetailsSecondaryButton>
        <AdditionDetailsFooterRightGroup>
          <AdditionDetailsSecondaryButton onClick={()=> navigate('/life-events')}>
            Quit / Exit
          </AdditionDetailsSecondaryButton>
          <AdditionDetailsPrimaryButton
            onClick={onContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingButtonContent>
                <CircularProgress size={16} color="inherit" />
                Submitting...
              </LoadingButtonContent>
            ) : (
              'Submit Request'
            )}
          </AdditionDetailsPrimaryButton>
        </AdditionDetailsFooterRightGroup>
      </AdditionDetailsFooterActions>
    </StepContainer>
  );
};

/*
// Commented out unused components for 3-step flow
const ConfirmRemovalStep = ...;
const UploadDocumentsStep = ...;
*/

// -----------------------------------------------------------------------
// DELETION STEPS FLOW COMPONENT
// -----------------------------------------------------------------------
interface DeletionStepsProps {
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  onExit?: () => void;
  onReturnHome?: () => void; // Add onReturnHome handler
  isSubmitting?: boolean;
  selectedLifeEvent: string | null;
  availableLifeEvents: any[];
  dependentsData: any[];
  gmcPolicyData: any;
  lifeEventPolicySources?: any[];
  uploadedDocuments: any[];
  onUploadedDocumentsChange: (documents: any[]) => void;
  onLifeEventSelect: (eventId: string) => void;
  onDependentSelection: (dependents: any[]) => void;
  getSelectedLifeEventData: () => any;
  submissionMeta?: LifeEventsSubmissionMeta | null;
}

const DeletionSteps: React.FC<DeletionStepsProps> = ({
  activeStep,
  onNext,
  onBack,
  onReturnHome,
  isSubmitting = false,
  selectedLifeEvent,
  _availableLifeEvents,
  dependentsData,
  gmcPolicyData,
  lifeEventPolicySources = [],
  uploadedDocuments,
  onUploadedDocumentsChange,
  _onLifeEventSelect,
  onDependentSelection,
  getSelectedLifeEventData,
  submissionMeta,
}) => {

const [selectedDependents, setSelectedDependents] = useState<number[]>([]);

  switch (activeStep) {
    case 0:
      return (
        <SelectDependentStep
          selectedLifeEvent={selectedLifeEvent}
          gmcPolicyData={gmcPolicyData}
          lifeEventPolicySources={lifeEventPolicySources}
          onDependentSelection={onDependentSelection}
          getSelectedLifeEventData={getSelectedLifeEventData}
          selectedDependents={selectedDependents}
          setSelectedDependents={setSelectedDependents}
          onBack={onBack}
          onContinue={onNext}
        />
      );
    case 1:
      return (
        <ConfirmAndUploadStep
          dependentsData={dependentsData}
          gmcPolicyData={gmcPolicyData}
          lifeEventPolicySources={lifeEventPolicySources}
          getSelectedLifeEventData={getSelectedLifeEventData}
          isSubmitting={isSubmitting}
          uploadedDocuments={uploadedDocuments}
          onUploadedDocumentsChange={onUploadedDocumentsChange}
          onBack={onBack}
          onContinue={onNext}
        />
      );
    case 2:
      return (
        <ReviewPremiumStep
          dependentsData={dependentsData}
          gmcPolicyData={gmcPolicyData}
          lifeEventPolicySources={lifeEventPolicySources}
          getSelectedLifeEventData={getSelectedLifeEventData}
          onBack={onBack}
          onContinue={onNext}
          isSubmitting={isSubmitting}
        />
      );
    case 3:
      return (
        <LifeEventsSuccessPage
          flowType="deletion"
          submissionMeta={submissionMeta}
          onReturnHome={onReturnHome || noop}
        />
      );
    default:
      return null;
  }
};

export default DeletionSteps;

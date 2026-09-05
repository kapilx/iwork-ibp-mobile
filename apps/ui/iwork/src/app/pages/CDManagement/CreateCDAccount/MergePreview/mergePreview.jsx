import React, { useMemo } from "react";
import { IconButton, DialogContent } from "@mui/material";
import { Button, formatCurrencyByLocalization } from "@ui/ui-lib";
import {
    StyledDialog,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    SectionLabel,
    SourceCard,
    TargetCard,
    CardHeader,
    AccountNumber,
    SourceBadge,
    TargetBadge,
    MetaRow,
    MetaItem,
    PolicyChipsRow,
    SourcePolicyChip,
    TargetPolicyChip,
    InfoGrid,
    InfoBox,
    NewBalanceBox,
    InfoBoxLabel,
    InfoBoxValue,
    NewBalanceValue,
    AllPoliciesLabel,
    ArrowContainer,
    ArrowCircle,
    WarningBox,
    WarningTitle,
    WarningText,
} from "./mergePreview.styles";

const MergePreviewModal = ({ open, onClose, onConfirm, sourceAccounts, targetAccount }) => {
    const formatCurrency = (amount) =>
        formatCurrencyByLocalization(Number(amount || 0), undefined, 0);

    const totalSourceBalance = useMemo(
        () => sourceAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        [sourceAccounts],
    );

    const newTargetBalance = (targetAccount?.balance || 0) + totalSourceBalance;

    const sourcePolicies = useMemo(
        () => sourceAccounts.flatMap((acc) => acc.policies || []),
        [sourceAccounts],
    );

    const allPoliciesAfterMerge = useMemo(
        () => [...(targetAccount?.policies || []), ...sourcePolicies],
        [targetAccount, sourcePolicies],
    );

    const totalPoliciesAfterMerge = allPoliciesAfterMerge.length;
    const currentTargetPolicies = targetAccount?.policies?.length || 0;

    if (!targetAccount) return null;

    return (
        <StyledDialog open={open} onClose={onClose} scroll="paper">
            <DialogHeader>
                <DialogTitle>Merge Preview</DialogTitle>
                <IconButton onClick={onClose} size="small">
                    ✕
                </IconButton>
            </DialogHeader>

            <DialogContent dividers={false} sx={{ padding: 0 }}>
                <DialogBody>
                    {/* Source Accounts */}
                    <div>
                        <SectionLabel>Source Accounts (Will be merged)</SectionLabel>
                        {sourceAccounts.map((acc) => (
                            <SourceCard key={acc.cautionDepositId}>
                                <CardHeader>
                                    <AccountNumber>{acc.cdAccountNumber}</AccountNumber>
                                    <SourceBadge label="Source" size="small" />
                                </CardHeader>
                                <MetaRow>
                                    <MetaItem>
                                        Balance: <strong>{formatCurrency(acc.balance)}</strong>
                                    </MetaItem>
                                    <MetaItem>
                                        Policies: <strong>{acc.policies?.length || 0}</strong>
                                    </MetaItem>
                                    <MetaItem>
                                        Transactions: <strong>{acc.transactionCount ?? '--'}</strong>
                                    </MetaItem>
                                </MetaRow>
                                {acc.policies?.length > 0 && (
                                    <PolicyChipsRow>
                                        {acc.policies.map((p) => (
                                            <SourcePolicyChip key={p.policyId}>{p.policyId}</SourcePolicyChip>
                                        ))}
                                    </PolicyChipsRow>
                                )}
                            </SourceCard>
                        ))}
                    </div>

                    {/* Arrow */}
                    <ArrowContainer>
                        <ArrowCircle>↓</ArrowCircle>
                    </ArrowContainer>

                    {/* Target Account */}
                    <div>
                        <SectionLabel>Target Account (Will receive merged data)</SectionLabel>
                        <TargetCard>
                            <CardHeader>
                                <AccountNumber>{targetAccount.cdAccountNumber}</AccountNumber>
                                <TargetBadge label="Target" size="small" />
                            </CardHeader>

                            <InfoGrid>
                                <InfoBox>
                                    <InfoBoxLabel>Current Balance</InfoBoxLabel>
                                    <InfoBoxValue>{formatCurrency(targetAccount.balance)}</InfoBoxValue>
                                </InfoBox>
                                <NewBalanceBox>
                                    <InfoBoxLabel>New Balance</InfoBoxLabel>
                                    <NewBalanceValue>{formatCurrency(newTargetBalance)}</NewBalanceValue>
                                </NewBalanceBox>
                                <InfoBox>
                                    <InfoBoxLabel>Current Policies</InfoBoxLabel>
                                    <InfoBoxValue>{currentTargetPolicies}</InfoBoxValue>
                                </InfoBox>
                                <InfoBox>
                                    <InfoBoxLabel>Total Policies</InfoBoxLabel>
                                    <InfoBoxValue>{totalPoliciesAfterMerge}</InfoBoxValue>
                                </InfoBox>
                                <InfoBox>
                                    <InfoBoxLabel>Transactions</InfoBoxLabel>
                                    <InfoBoxValue>{targetAccount.transactionCount ?? '--'}</InfoBoxValue>
                                </InfoBox>
                            </InfoGrid>

                            {allPoliciesAfterMerge.length > 0 && (
                                <div>
                                    <AllPoliciesLabel>All Policies After Merge</AllPoliciesLabel>
                                    <PolicyChipsRow>
                                        {(targetAccount.policies || []).map((p) => (
                                            <TargetPolicyChip key={`target-${p.policyId}`}>{p.policyId}</TargetPolicyChip>
                                        ))}
                                        {sourcePolicies.map((p) => (
                                            <SourcePolicyChip key={`source-${p.policyId}`}>{p.policyId}</SourcePolicyChip>
                                        ))}
                                    </PolicyChipsRow>
                                </div>
                            )}
                        </TargetCard>
                    </div>

                    {/* Warning */}
                    <WarningBox>
                        <span style={{ fontSize: "16px" }}>⚠</span>
                        <div>
                            <WarningTitle>Important</WarningTitle>
                            <WarningText>
                                This action cannot be undone. Source accounts will be closed and all
                                their data will be transferred to the target account.
                            </WarningText>
                        </div>
                    </WarningBox>
                </DialogBody>
            </DialogContent>

            <DialogFooter>
                <Button variantType="secondary" sizeType="small" onClick={onClose}>
                    Cancel
                </Button>
                <Button variantType="primary" sizeType="small" onClick={onConfirm}>
                    Confirm Merge
                </Button>
            </DialogFooter>
        </StyledDialog>
    );
};

export default MergePreviewModal;

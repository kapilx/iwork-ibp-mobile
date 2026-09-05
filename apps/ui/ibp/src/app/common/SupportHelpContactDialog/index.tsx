import React from 'react';
import SupportIcon from '../../../assets/svgs/cancel-support-icon.svg';
import {
    SupportHelpDialog,
    SupportHelpHeader,
    SupportHelpTitle,
    SupportHelpCloseButton,
    SupportHelpDivider,
    SupportHelpContent,
    SupportHelpText,
} from './styles';

interface SupportHelpContactDialogProps {
    open: boolean;
    onClose: () => void;
}

export const SupportHelpContactDialog: React.FC<SupportHelpContactDialogProps> = ({ open, onClose }) => {
    return (
        <SupportHelpDialog open={open} onClose={onClose}>
            <SupportHelpHeader>
                <SupportHelpTitle>Need help ?</SupportHelpTitle>
                <SupportHelpCloseButton
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <img src={SupportIcon} alt='support-icon' />
                </SupportHelpCloseButton>
            </SupportHelpHeader>
            <SupportHelpDivider />
            <SupportHelpContent>
                <SupportHelpText>
                    If you experience any difficulties while logging in, please reach
                    out to your HR team for assistance. They will be able to guide you
                    and help resolve the issue.
                </SupportHelpText>
            </SupportHelpContent>
        </SupportHelpDialog>
    );
};

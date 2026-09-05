import { Box, Button, Tooltip } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { MethodsGrid, MethodCard, CheckboxIndicator, MethodIconBox, MethodTitle, MethodDescription } from '../../styles';
import { SvgIconComponent } from '@mui/icons-material';

export type AuthMethod = 'email-password' | 'email-otp' | 'mobile-otp' | 'phone-password' | 'employee-id' | 'oauth';

export interface AuthMethodOption {
    id: AuthMethod;
    icon: SvgIconComponent;
    label: string;
    description: string;
    methodCode?: string;
    methodKey?: string;
}

interface AuthMethodGridProps {
    authMethods: AuthMethodOption[];
    selectedMethods: AuthMethod[];
    onMethodSelect: (method: AuthMethodOption) => void;
    onMethodConfigure?: (method: AuthMethodOption) => void;
}

export const AuthMethodGrid: React.FC<AuthMethodGridProps> = ({
    authMethods,
    selectedMethods,
    onMethodSelect,
    onMethodConfigure,
}) => {
    return (
        <MethodsGrid>
            {authMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethods.includes(method.id);
                return (
                    <MethodCard
                        key={method.id}
                        selected={isSelected}
                        onClick={() => onMethodSelect(method)}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            p: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {/* ── Card body ── */}
                        <Box sx={{ flex: 1, p: '14px 14px 12px 14px' }}>

                            {/* Row 1: method icon (left) + checkbox (right) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                                {/* Method icon box */}
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '8px',
                                        backgroundColor: isSelected ? '#fff' : '#F3F4F6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: isSelected ? '0 1px 4px rgba(99,102,241,0.18)' : 'none',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <Icon sx={{ fontSize: 17, color: '#6366F1' }} />
                                </Box>

                                {/* Checkbox indicator */}
                                <CheckboxIndicator
                                    selected={isSelected}
                                    sx={{ position: 'static', flexShrink: 0 }}
                                />
                            </Box>

                            {/* Row 2: title */}
                            <MethodTitle sx={{ mb: 0.4 }}>{method.label}</MethodTitle>

                            {/* Row 3: description */}
                            <MethodDescription>{method.description}</MethodDescription>
                        </Box>

                        {/* ── Card footer — always rendered for equal height ── */}
                        <Box
                            sx={{
                                borderTop: isSelected
                                    ? '1px solid rgba(99,102,241,0.15)'
                                    : '1px solid transparent',
                                backgroundColor: isSelected
                                    ? 'rgba(99,102,241,0.06)'
                                    : 'transparent',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                px: 1.5,
                                height: 36,
                            }}
                        >
                            {isSelected && onMethodConfigure && (
                                <Tooltip title="Configure Settings" placement="top" arrow>
                                    <Button
                                        size="small"
                                        endIcon={<SettingsIcon sx={{ fontSize: '13px !important' }} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMethodConfigure(method);
                                        }}
                                        sx={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            height: 24,
                                            px: 1.2,
                                            borderRadius: '6px',
                                            backgroundColor: '#6366F1',
                                            color: '#fff',
                                            lineHeight: 1,
                                            minWidth: 0,
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                backgroundColor: '#4F46E5',
                                            },
                                        }}
                                    >
                                        Configure
                                    </Button>
                                </Tooltip>
                            )}
                        </Box>
                    </MethodCard>
                );
            })}
        </MethodsGrid>
    );
};

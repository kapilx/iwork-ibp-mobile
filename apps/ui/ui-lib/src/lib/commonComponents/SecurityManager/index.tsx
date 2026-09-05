import React, { useEffect } from 'react';
import { isSecurityRestrictionEnabledForOrg } from '../../environment';

export const SecurityManager: React.FC<{ children: React.ReactNode; user?: any }> = ({ children, user: userProp }) => {
    const currentUserSession = userProp ? JSON.stringify(userProp) : sessionStorage.getItem('user');
    useEffect(() => {
        const isRestricted = isSecurityRestrictionEnabledForOrg();

        const handleContextMenu = (e: MouseEvent) => {
            if (isRestricted) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            if (isRestricted) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isRestricted) return;

            const isControl = e.ctrlKey || e.metaKey;

            if (isControl && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (isControl && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                e.stopPropagation();
            }

            if (isControl && e.key.toLowerCase() === 's') {
                e.preventDefault();
                e.stopPropagation();
            }

            if (isControl && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                e.stopPropagation();
            }

            if (e.key === 'PrintScreen') {
                e.preventDefault();
                try {
                    navigator.clipboard.writeText("");
                } catch (err) {
                    // Silently fail
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (isRestricted && e.key === 'PrintScreen') {
                try {
                    navigator.clipboard.writeText("");
                } catch (err) {
                    // Silently fail
                }
            }
        };

        if (isRestricted) {
            window.addEventListener('contextmenu', handleContextMenu, true);
            window.addEventListener('copy', handleCopy, true);
            window.addEventListener('keydown', handleKeyDown, true);
            window.addEventListener('keyup', handleKeyUp, true);

            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';

            const style = document.createElement('style');
            style.id = 'security-print-restriction';
            style.innerHTML = `
        @media print {
          body {
            display: none !important;
          }
        }
      `;
            document.head.appendChild(style);
        }

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true);
            window.removeEventListener('copy', handleCopy, true);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            document.body.style.userSelect = 'auto';
            document.body.style.webkitUserSelect = 'auto';
            const styleTag = document.getElementById('security-print-restriction');
            if (styleTag) styleTag.remove();
        };
    }, [currentUserSession]);

    return <>{children}</>;
};

export default SecurityManager;

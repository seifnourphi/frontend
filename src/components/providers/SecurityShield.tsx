'use client';

import React, { useEffect } from 'react';

/**
 * SecurityShield Component
 * Implements frontend-level security by blocking dangerous characters 
 * directly at the input level to prevent XSS and injection attempts.
 */
export const SecurityShield = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        // List of characters often used in XSS or injection scripts
        const blockedChars = ['<', '>', '\\', '{', '}', '[', ']'];

        // Patterns that are definitely dangerous
        const dangerousPatterns = [
            /script/i,
            /onerror/i,
            /onload/i,
            /javascript:/i,
            /eval\(/i,
            /alert\(/i
        ];

        const handleKeyDown = (e: KeyboardEvent) => {
            // Allow these if Ctrl/Cmd is pressed
            if (e.ctrlKey || e.metaKey) return;

            if (blockedChars.includes(e.key)) {
                e.preventDefault();
                return false;
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            const pastedText = e.clipboardData?.getData('text') || '';

            const containsBlocked = blockedChars.some(char => pastedText.includes(char));
            const containsDangerous = dangerousPatterns.some(pattern => pattern.test(pastedText));

            if (containsBlocked || containsDangerous) {
                e.preventDefault();
                console.warn('Security Shield: Blocked content due to potentially dangerous characters.');
            }
        };

        // Attach to document to catch all inputs
        const attachListeners = () => {
            document.addEventListener('keydown', (e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    handleKeyDown(e as any);
                }
            }, true);

            document.addEventListener('paste', (e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    handlePaste(e as any);
                }
            }, true);
        };

        attachListeners();

        return () => {
            document.removeEventListener('keydown', handleKeyDown as any);
            document.removeEventListener('paste', handlePaste as any);
        };
    }, []);

    return <>{children}</>;
};

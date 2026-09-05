import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPasswordProtectionConfigs } from '../redux/passwordProtectionConfigSlice';

/**
 * Custom hook to fetch and manage password protection configurations
 * Should be called once after successful login
 * 
 * @returns Object containing configs, loading state, error, and initialized flag
 * 
 * @example
 * const { configs, loading, error, initialized } = usePasswordProtectionConfigs();
 */
export const usePasswordProtectionConfigs = () => {
    const dispatch = useDispatch();
    const { configs, loading, error, initialized } = useSelector(
        (state: any) => state.passwordProtectionConfig
    );

    const fetchConfigs = async () => {
        try {
            await dispatch(fetchPasswordProtectionConfigs() as any).unwrap();
        } catch (err) {
            console.warn('Failed to load password protection configs:', err);
        }
    };

    return {
        configs,
        loading,
        error,
        initialized,
        fetchConfigs,
    };
};

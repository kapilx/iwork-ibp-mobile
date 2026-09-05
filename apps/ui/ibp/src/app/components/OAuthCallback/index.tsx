import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToastMessage } from '../../redux/slice';
import { TOAST_MESSAGES } from '../../constants/index';
import axiosInstance from '@ui/ui-lib/utils/axiosInterceptors';
import { apiRequest, endPoints } from '@ui/ui-lib';
import { CircularProgress, Box, Typography } from '@mui/material';

const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const processOAuthCallback = async () => {
            try {
                // Get tokens from URL query params
                const accessToken = searchParams.get('accessToken');
                const refreshToken = searchParams.get('refreshToken');
                const error = searchParams.get('message');

                // Handle error case
                if (error) {
                    dispatch(setToastMessage(decodeURIComponent(error)));
                    navigate('/login');
                    return;
                }

                // Validate tokens exist
                if (!accessToken || !refreshToken) {
                    dispatch(setToastMessage('Authentication failed. No tokens received.'));
                    navigate('/login');
                    return;
                }

                // Store tokens in sessionStorage
                const loginData = {
                    accessToken: {
                        accessToken,
                        refreshToken,
                    },
                    portal: "IBP",
                };
                sessionStorage.setItem('user', JSON.stringify(loginData));

                // Fetch user details
                const response = await axiosInstance.get(endPoints.employeeDetails);
                const userData = response.data;

                // Combine login data with user details
                const combinedUser = {
                    ...loginData,
                    ...userData?.data,
                };

                // Save complete user data
                sessionStorage.setItem('user', JSON.stringify(combinedUser));
                const loggedInUserId = combinedUser?.id || combinedUser?.userId;
                if (loggedInUserId) {
                    await apiRequest(endPoints.getActivityLogs, {
                        method: 'POST',
                        data: {
                            activityKey: 'LOGGED_IN',
                            activityCategory: 'AUTH',
                            referenceId: loggedInUserId,
                            referenceType: 'USER',
                            metadata: null,
                        },
                        headers: { userid: String(loggedInUserId) },
                    });
                }

                dispatch(setToastMessage(TOAST_MESSAGES.LOGIN_SUCCESS));

                // Redirect to home page
                navigate('/');
            } catch (err: any) {
                dispatch(
                    setToastMessage(
                        err?.message || 'Failed to complete authentication'
                    )
                );
                navigate('/login');
            }
        };

        processOAuthCallback();
    }, [searchParams, navigate, dispatch]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            gap={2}
        >
            <CircularProgress size={60} />
            <Typography variant="h6" color="textSecondary">
                Completing sign in...
            </Typography>
        </Box>
    );
};

export default OAuthCallback;

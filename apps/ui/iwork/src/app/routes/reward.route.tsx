import { RouteObject } from "react-router-dom";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";
import RewardPage from "../pages/RewardPage";
import RewardForm from "../pages/RewardPage/RewardForm";

export const rewardRoutes: RouteObject[] = [
    {
        path: "/insurer-rewards",
        element: (
            <PermissionGuard feature={FeatureKey.VIEW_REWARD}>
                <RewardPage title="Insurer Rewards" />
            </PermissionGuard>
        ),
    },
    {
        path: "/insurer-rewards/new",
        element: (
            <PermissionGuard feature={FeatureKey.CREATE_REWARD}>
                <RewardForm key="new" />
            </PermissionGuard>
        ),
    },
    {
        path: "/insurer-rewards/:id/edit",
        element: (
            <PermissionGuard feature={FeatureKey.EDIT_REWARD}>
                <RewardForm key="edit" />
            </PermissionGuard>
        ),
    },
];

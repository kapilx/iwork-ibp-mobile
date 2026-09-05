import React from 'react';
import { CircularProgress, Alert } from '@mui/material';
import { TemplateLayoutProps, LoadingSkeletonProps } from './types';
import {
  TemplatePageContainer,
  TemplateHeader,
  TemplateTitle,
  TemplateContentBox,
  LoadingContainer,
  SkeletonRow,
  SkeletonContent,
  SkeletonItem,
  SkeletonList,
  FormSkeletonContainer,
  FormSkeletonLabel,
  FormSkeletonInput,
  CardSkeletonContainer,
  CardSkeletonTitle,
  CardSkeletonLine,
  HeaderActionsBox, // Added
  ErrorContainer, // Added
} from './styles';

// Template Layout Component
export const TemplateLayout: React.FC<TemplateLayoutProps> = ({
  title,
  children,
  headerActions,
  loading = false,
  error
}) => {
  return (
    <TemplatePageContainer>
      <TemplateHeader>
        <TemplateTitle variant="h1">
          {title}
        </TemplateTitle>
        {headerActions && (
          <HeaderActionsBox>
            {headerActions}
          </HeaderActionsBox>
        )}
      </TemplateHeader>

      {error && (
        <ErrorContainer>
          <Alert severity="error">
            {error}
          </Alert>
        </ErrorContainer>
      )}

      <TemplateContentBox>
        {loading ? (
          <LoadingContainer>
            <CircularProgress />
          </LoadingContainer>
        ) : (
          children
        )}
      </TemplateContentBox>
    </TemplatePageContainer>
  );
};

// Loading States Components
export const TemplateLoadingStates = {
  TableSkeleton: ({ count = 5 }: LoadingSkeletonProps) => (
    <SkeletonList>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index}>
          <SkeletonContent>
            <SkeletonItem width="20%" />
            <SkeletonItem width="30%" />
            <SkeletonItem width="25%" />
            <SkeletonItem width="25%" />
          </SkeletonContent>
        </SkeletonRow>
      ))}
    </SkeletonList>
  ),

  FormSkeleton: ({ count = 4 }: LoadingSkeletonProps) => (
    <SkeletonList>
      {Array.from({ length: count }).map((_, index) => (
        <FormSkeletonContainer key={index}>
          <FormSkeletonLabel />
          <FormSkeletonInput />
        </FormSkeletonContainer>
      ))}
    </SkeletonList>
  ),

  CardSkeleton: () => (
    <CardSkeletonContainer>
      <CardSkeletonTitle />
      <CardSkeletonLine />
      <CardSkeletonLine width="80%" />
      <CardSkeletonLine width="90%" />
    </CardSkeletonContainer>
  )
};

export default TemplateLayout;
import React, { useMemo } from 'react';
import { Typography } from '@mui/material';
import { Visibility as PreviewIcon } from '@mui/icons-material';
import { CommonTextField, sanitizeHtml } from "@ui/ui-lib";
import {
  PreviewPaper,
  PreviewSubHeader,
  PreviewSubTitle,
  PreviewContentBox,
  PreviewSubjectBox,
  // PreviewLabel,
  PreviewText,
  StyledMarkdownPreview,
  PreviewEmptyBox,
  EmptyPreviewText,
  TestParamsBox,
  TestParamsTitle,
  TestGrid,
  TestGridItem,
} from './styles';

const CommonTextFieldAny = CommonTextField as any;

export interface TemplatePreviewCommonProps {
  subject?: string;
  content?: string;
  testValues: Record<string, string>;
  displayParams: Array<{ key: string; description: string }>;
  onTestValueChange: (key: string, value: string) => void;
  getRenderedContent: (text: string) => string;
  showHeader?: boolean;
  emptyContentMessage?: string;
  channelType?: string;
}

const TemplatePreviewCommon: React.FC<TemplatePreviewCommonProps> = ({
  subject,
  content,
  testValues,
  displayParams,
  onTestValueChange,
  getRenderedContent,
  showHeader = true,
  emptyContentMessage = 'Type something in the editor to see it here...',
  channelType,
}) => {
  // Helper function to convert newlines to HTML breaks for plain text channels
  const formatPlainTextContent = (text: string) => {
    if (!text) return '';
    // Replace \n with <br> tags for HTML rendering
    return text.replace(/\n/g, '<br>');
  };

  // Determine if this is a plain text channel (in-app, sms)
  const isPlainTextChannel = channelType === 'in-app' || channelType === 'sms';

  // Process content based on channel type
  const processContent = (text: string) => {
    const rendered = getRenderedContent(text);
    return isPlainTextChannel ? formatPlainTextContent(rendered) : rendered;
  };
  return (
    <PreviewPaper>
      {showHeader && (
        <PreviewSubHeader>
          <PreviewSubTitle variant="h6" color="text.primary">
            <PreviewIcon fontSize="small" color="action" />
            Live Preview
          </PreviewSubTitle>
          <Typography variant="caption">
            See how your template will look when rendered with actual data
          </Typography>
        </PreviewSubHeader>
      )}

      <PreviewContentBox>
        {subject && (
          <PreviewSubjectBox>
            {/* <PreviewLabel variant="overline">
              Subject
            </PreviewLabel> */}
             
            <PreviewText 
              variant="h6"
              dangerouslySetInnerHTML={{
                // fd_secret_ignore
                __html: sanitizeHtml(processContent(subject)),
              }}
            />
          </PreviewSubjectBox>
        )}

        {content ? (
          <>
            {/* <PreviewLabel variant="overline">
              Content
            </PreviewLabel> */}
            <StyledMarkdownPreview
              className="markdown-preview"
              dangerouslySetInnerHTML={{
                // fd_secret_ignore
                __html: sanitizeHtml(processContent(content)),
              }}
            />
          </>
        ) : (
          <PreviewEmptyBox>
            <EmptyPreviewText variant="body2">
              {emptyContentMessage}
            </EmptyPreviewText>
          </PreviewEmptyBox>
        )}
      </PreviewContentBox>

      {displayParams.length < 0 && (
        <TestParamsBox>
          <TestParamsTitle variant="subtitle2" gutterBottom>
            Test Parameters
          </TestParamsTitle>
          <TestGrid>
            {displayParams.map(param => (
              <TestGridItem key={param.key}>
                <CommonTextFieldAny
                  width="100%"
                  label={`Value for {{${param.key}}}`}
                  value={testValues[param.key] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTestValueChange(param.key, e.target.value)}
                  placeholder={param.description}
                />
              </TestGridItem>
            ))}
          </TestGrid>
        </TestParamsBox>
      )}
    </PreviewPaper>
  );
};

export default TemplatePreviewCommon;

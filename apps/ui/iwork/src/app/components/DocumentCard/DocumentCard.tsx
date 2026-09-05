import { ChipRenderer, getFileIcon, useHasPermission, FeatureKey, environment } from "@ui/ui-lib";
import React, { useState } from "react";
import dayjs from "dayjs";
import { Tooltip, Box } from "@mui/material";
import {
  DocumentHolder,
  TopSection,
  DocumentCardIconWrapper,
  StyledIcon,
  ContentWrapper,
  TitleRow,
  Title,
  MetaInfo,
  DownloadIconStyled,
  EditIconStyled,
  TagsContainer,
  MoreTagsLabel,
  SeparatorLine,
  BottomSection,
  CategoryChipWrapper,
} from "./styles";
import DownloadIcon from "../../assets/svgs/download-icon.svg"; // Import the specified download icon
import EditIcon from "../../assets/svgs/edit-pencil-icon.svg";
import { KnowledgeDocument } from "../../pages/KnowledgeCentral/types";

type Props = {
  doc: KnowledgeDocument;
  onAccess: (documentId: number) => void;
  onClick?: (doc: KnowledgeDocument) => void; // Optional: if the whole card should be clickableprtihhoard hollickableleepthhoard hollickableleepthhoard hollickableleepthhoard hollickable
  onEdit?: (doc: KnowledgeDocument) => void;
  canEdit?: boolean;
};

const DocumentCard: React.FC<Props> = ({
  doc,
  onAccess,
  onClick,
  onEdit,
  canEdit = false,
  downloadFeatureKey = FeatureKey.EXPORT_KNOWLEDGE_DOCUMENT,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasRbacPermission = useHasPermission(downloadFeatureKey);
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccess(doc.documentId);
  };
  const handleCardClick = () => {
    if (onClick && isDownloadAllowed) {
      onClick(doc);
    }
  };

  const displayDate =
    doc.createdAt && dayjs(doc.createdAt).isValid()
      ? dayjs(doc.createdAt).format("DD/MM/YYYY")
      : "N/A";
  const tagsToDisplay = doc.tags?.slice(0, 1) || [];
  const remainingTagsCount = doc.tags ? Math.max(0, doc.tags.length - 1) : 0;
  const remainingTagsTooltip =
    remainingTagsCount > 0 ? doc.tags?.slice(1).join(", ") : "";
  const iconElement = getFileIcon(doc.extension);

  return (
    <DocumentHolder
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TopSection>
        <Tooltip title={doc.summary || ""} placement="bottom-start">
          <span className="icon">{iconElement}</span>
        </Tooltip>
        <ContentWrapper>
          <TitleRow>
            <Title title={doc.title}>{doc.title}</Title>
            {isHovered && isDownloadAllowed && (
              <DownloadIconStyled
                src={DownloadIcon}
                alt="Download"
                onClick={handleDownloadClick}
              />
            )}
          </TitleRow>
          <MetaInfo>
            <span>{displayDate}</span>
            <span>&bull;</span> {/* Separator */}
            <span>{doc.accessCount} views</span>
          </MetaInfo>
        </ContentWrapper>
      </TopSection>
      <SeparatorLine />
      <BottomSection>
        {doc.tags && doc.tags.length > 0 && (
          <TagsContainer>
            {tagsToDisplay.map((tag, index) => (
              <CategoryChipWrapper key={index}>
                <ChipRenderer
                  value={tag}
                  variant="variable"
                  size="small"
                  padding="0px 4px"
                />
              </CategoryChipWrapper>
            ))}
            {remainingTagsCount > 0 && (
              <Tooltip title={remainingTagsTooltip} placement="top">
                <MoreTagsLabel>+{remainingTagsCount}</MoreTagsLabel>
              </Tooltip>
            )}
          </TagsContainer>
        )}
        {canEdit && isHovered && (
          <EditIconStyled
            src={EditIcon}
            alt="Edit"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEdit?.(doc);
            }}
          />
        )}
      </BottomSection>
    </DocumentHolder>
  );
};

export default DocumentCard;

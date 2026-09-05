import React from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { TreeNode } from "./types";
import {
  ImageContainer,
  StyledTreeContainer,
  StyledTreeLine,
  StyledTreeNodeContainer,
  StyledTreeNodeLabel,
  StyledTreeNodeWrapper,
  SelectButton,
  DisablesTextStyles,
} from "./styles";
import { CompanyMatchResult } from "../../pages/CompanyPage/UploadCompany";
import { useNavigate } from "react-router-dom";
import { INACTIVE } from "../../constants";
import { COMPANY_STATUS } from "../../constants/enum";

// Recursive Tree Node Component
const SimpleTreeNode: React.FC<{
  node: TreeNode;
  depth?: number;
  selectedNodeId: string | null;
  onNodeClick: (node: TreeNode) => void;
  debouncedName: string;
  matchedCompanyResult: CompanyMatchResult;
}> = ({
  node,
  depth = 0,
  selectedNodeId,
  onNodeClick,
  debouncedName,
  matchedCompanyResult,
}) => {
  const hasChildren = node?.children && node?.children?.length > 0;
  const isSelected = node.id === selectedNodeId;

  const navigate = useNavigate();

  const handleNodeClick = () => {
    if (node.status === COMPANY_STATUS.ACTIVE) {
      onNodeClick(node);
    }
  };
  return (
    <StyledTreeNodeWrapper depth={depth}>
      {depth > 0 && <StyledTreeLine />}
      <StyledTreeContainer onClick={handleNodeClick}>
        <StyledTreeNodeLabel
          className={isSelected ? "selected" : ""}
          isChild={depth > 0}
        >
          {node.label}, {node.country}
          {node.status === COMPANY_STATUS.INACTIVE && (
            <DisablesTextStyles>{`(${INACTIVE})`}</DisablesTextStyles>
          )}
        </StyledTreeNodeLabel>
        {node.status === COMPANY_STATUS.ACTIVE && (
          <ImageContainer>
            <SelectButton
              className="select-button"
              variantType="secondary"
              sizeType="small"
              onClick={() => onNodeClick(node)}
              label="Select & proceed"
            />
          </ImageContainer>
        )}
      </StyledTreeContainer>

      {hasChildren && (
        <StyledTreeNodeContainer>
          {node.children?.map((child) => (
            <SimpleTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onNodeClick={onNodeClick}
              debouncedName={debouncedName}
              matchedCompanyResult={matchedCompanyResult}
            />
          ))}
        </StyledTreeNodeContainer>
      )}
    </StyledTreeNodeWrapper>
  );
};

// Main Tree View Component
export const SimpleTreeView: React.FC<{
  data: TreeNode[];
  onSelectNode: (node: TreeNode) => void;
  selectedTreeNode: TreeNode | null;
  debouncedName: string;
  matchedCompanyResult: CompanyMatchResult;
  containerSx?: SxProps<Theme>;
}> = ({
  data,
  onSelectNode,
  selectedTreeNode,
  debouncedName,
  matchedCompanyResult,
  containerSx,
}) => {
  const handleNodeClick = (node: TreeNode) => {
    onSelectNode(node);
  };

  return (
    <Box sx={containerSx}>
      {data.map((node) => (
        <SimpleTreeNode
          key={node.id}
          node={node}
          selectedNodeId={selectedTreeNode?.id || null}
          onNodeClick={handleNodeClick}
          debouncedName={debouncedName}
          matchedCompanyResult={matchedCompanyResult}
        />
      ))}
    </Box>
  );
};

export default SimpleTreeView;

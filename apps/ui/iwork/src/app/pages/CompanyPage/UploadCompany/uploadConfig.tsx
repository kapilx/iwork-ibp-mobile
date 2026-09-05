import { Box } from "@mui/material";
import { SimpleTreeView, Checkbox, TreeNode } from "@ui/ui-lib";
import { CompanyMatchResult } from ".";

// Define the AccordionHandlers type
export interface AccordionHandlers {
  handleTreeNodeSelect: (node: TreeNode) => void;
  handleCheckboxChange: (
    checked: boolean,
    currentAccordionTitle: string,
    contactLabel?: string
  ) => void;
  selectedTreeNode: TreeNode | null;
  debouncedName: string;
}

// Contacts Data
export const contacts = [
  { id: "contact1", label: "John Doe" },
  { id: "contact2", label: "Jane Smith" },
  { id: "contact3", label: "Alice Johnson" },
];

// Define accordion data with links
export const getAccordionData = (
  treeData: TreeNode[], // Pass treeData as a parameter
  {
    handleTreeNodeSelect,
    handleCheckboxChange,
    selectedTreeNode,
  }: AccordionHandlers,
  contactData: any,
  debouncedName: string,
  matchedCompanyResult: CompanyMatchResult
) => {
  return [
    {
      title: "Company Selection",
      content: (
        <SimpleTreeView
          data={treeData}
          onSelectNode={handleTreeNodeSelect}
          selectedTreeNode={selectedTreeNode}
          debouncedName={debouncedName}
          matchedCompanyResult={matchedCompanyResult}
        />
      ),
      link: { label: "Add Company", path: "/companies/new" }, // Link for Company Selection
    },
    {
      title: "Contact Selection",
      content: (
        <Box>
          {contactData?.map((contact: any) => (
            <Checkbox
              key={contact.id}
              label={contact.label}
              isChecked={false}
              isIcon={true}
              onChange={(checked) => handleCheckboxChange(checked, contact)}
            />
          ))}
        </Box>
      ),
      link: { label: "Add Contacts", path: "/contact/new" }, // Link for Contact Selection
    },
    {
      title: "Opportunity Selection",
      content: <Box>Opportunity details</Box>,
      link: { label: "Add Opportunity", path: "/opportunities/new" }, // Link for Opportunity Selection
    },
  ];
};

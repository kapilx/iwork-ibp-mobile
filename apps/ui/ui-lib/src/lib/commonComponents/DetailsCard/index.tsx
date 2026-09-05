import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, IconButton, Typography } from "@mui/material";
import {
  DetailsStyledCard,
  DetailsCardStyledCardContent,
  StyledCardHeader,
  StyledEditIcon,
} from "./styles";
import { getTextFromHtml } from "@ui/ui-lib/utils/richTextUtils";
import { formatDate, isValidDate } from "@ui/ui-lib/utils/DateFormat";

interface DataItem {
  label: string;
  value: string | number | boolean;
}

interface CommonCardProps<T> {
  title: string;
  data: T; // Generic object containing key-value pairs
  onEdit: () => void;
  onDelete: () => void;
}

const DetailsCard = <T extends Record<string, string | number>>({
  title,
  data,
  onEdit,
  onDelete,
}: CommonCardProps<T>) => {
  const dataItems: DataItem[] = Object.entries(data).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: value,
  }));

  return (
    <DetailsStyledCard>
      <StyledCardHeader
        title={title}
        action={
          <Box>
            <IconButton size="small" onClick={onEdit}>
              <StyledEditIcon />
            </IconButton>
          </Box>
        }
      />
      <DetailsCardStyledCardContent>
        {dataItems.map((item, idx) => {
          if (item.label.toLowerCase() === "id") {
            return null;
          }
          let value = item.value;
          if (item.label === "Remarks") {
            value = getTextFromHtml(value as string);
          }
          if (typeof value === "string" && isValidDate(value)) {
            const formattedValue = formatDate(value);
            value =
              formattedValue === value
                ? value
                : formattedValue ?? "Invalid date";
          }

          if (typeof value === "boolean" && item.label === "IsPrimary") {
            value = value.toString();
          }
          return (
            <Typography variant="body2" key={idx}>
              <strong>{item.label}:</strong> {value}
            </Typography>
          );
        })}
      </DetailsCardStyledCardContent>
    </DetailsStyledCard>
  );
};

export default DetailsCard;

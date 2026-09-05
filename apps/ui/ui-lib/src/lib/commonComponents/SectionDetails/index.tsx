import { Box, Button, Typography, Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { FC } from "react";
import DetailsCard from "../DetailsCard";
import {
  SectionDetailsIconContainer,
  PlaceholderBox,
  SectionDetailsStyledBox,
  SectionDetailsStyledPaper,
  IconAndTitle,
  FirstItemButton,
  ItemText,
} from "./styles";

interface DataItem {
  id?: number;
  [key: string]: any;
}

interface DetailsSectionProps {
  icon: React.ReactNode;
  title: string;
  data: DataItem[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  maxItems?: number;
  noDataMessage: string;
  addItemButtonText: string;
  placeholderSubtext?: string;
  firstItemButtonText: string;
}

const SectionDetails: FC<DetailsSectionProps> = ({
  icon,
  title,
  data,
  onAdd,
  onEdit,
  onDelete,
  maxItems = 3,
  noDataMessage,
  addItemButtonText,
  placeholderSubtext,
  firstItemButtonText,
}) => (
  <SectionDetailsStyledPaper elevation={3}>
    <SectionDetailsStyledBox>
      <IconAndTitle>
        <SectionDetailsIconContainer>{icon}</SectionDetailsIconContainer>
        <Typography variant="h3">{title}</Typography>
      </IconAndTitle>
      <Button variant="contained" onClick={onAdd} startIcon={<AddIcon />}>
        {addItemButtonText}
      </Button>
    </SectionDetailsStyledBox>
    {data.length === 0 ? (
      <NoDataPlaceholder
        onAdd={onAdd}
        message={noDataMessage}
        subtext={placeholderSubtext}
        buttonText={firstItemButtonText}
      />
    ) : (
      <Grid container spacing={2}>
        {data.map((item, index) => (
          <Grid item xs={12} md={6} lg={4} key={item.id || index}>
            <DetailsCard
              title={`${title} ${index + 1}`}
              data={item}
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
            />
          </Grid>
        ))}
      </Grid>
    )}
  </SectionDetailsStyledPaper>
);

interface NoDataPlaceholderProps {
  onAdd: () => void;
  message: string;
  subtext?: string;
  buttonText: string;
}

const NoDataPlaceholder: FC<NoDataPlaceholderProps> = ({
  onAdd,
  message,
  subtext,
  buttonText,
}) => (
  <PlaceholderBox>
    <Typography color="text.secondary">{message}</Typography>
    {/* <ItemText variant="body2" color="text.secondary">
      {subtext}
    </ItemText> */}
    <FirstItemButton variant="outlined" onClick={onAdd} startIcon={<AddIcon />}>
      {buttonText}
    </FirstItemButton>
  </PlaceholderBox>
);

export default SectionDetails;

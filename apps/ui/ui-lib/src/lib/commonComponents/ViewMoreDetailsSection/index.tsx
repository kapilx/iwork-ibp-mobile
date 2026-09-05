import {
  ViewMoreContainer,
  LabelValueHolder,
  CommonLabelTypography,
  CommonValueTypography,
} from "./styles";

export interface ViewMoreDetailsProps {
  label: string;
  value: string | number;
  handleClick?: () => void;
}

const ViewMoreDetails = ({ items }: { items: ViewMoreDetailsProps[] }) => (
  <ViewMoreContainer data-testid="details-section">
    {items.map((item, index) => (
      <LabelValueHolder key={index} data-testid={"detail-item"}>
        <CommonLabelTypography>{item.label}</CommonLabelTypography>
        <CommonValueTypography onClick={item.handleClick} hasClick={!!item.handleClick && item.value != "--"}>{item.value}</CommonValueTypography>
      </LabelValueHolder>
    ))}
  </ViewMoreContainer>
);

export default ViewMoreDetails;

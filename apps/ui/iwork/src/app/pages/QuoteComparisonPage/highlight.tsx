import { HighlightDiffSpan } from "./styles";

interface HighlightDiffRendererProps {
  value: any;
  data: any;
  colDef: any;
  context: {
    selectedInsurers: string[];
    headers: { [key: string]: string };
  };
}

const HighlightDiffRenderer = ({
  value,
  data,
  colDef,
  context,
}: HighlightDiffRendererProps) => {
  const { selectedInsurers = [], headers = {} } = context || {};
  const currentField = colDef?.field;

  if (!headers || !selectedInsurers?.length || !currentField) {
    return <HighlightDiffSpan>{value ?? "--"}</HighlightDiffSpan>;
  }

  // Get the current column's header
  const currentHeader = headers[currentField]?.toLowerCase() || '';

  // Determine the base comparison field based on priority
  let baseField: string | undefined = undefined;

  // 1. First priority: RFP
  if (selectedInsurers.some(ins => ins.toLowerCase() === 'rfp')) {
    baseField = Object.entries(headers).find(
      ([_, header]) => header.toLowerCase().includes('rfp')
    )?.[0];
  }
  
  // 2. Second priority: Broking Slip
  if (!baseField && selectedInsurers.some(ins => ins.toLowerCase().includes('broking slip'))) {
    baseField = Object.entries(headers).find(
      ([_, header]) => header.toLowerCase().includes('broking slip')
    )?.[0];
  }

  // 3. Third priority: First selected insurer
  if (!baseField && selectedInsurers.length > 0) {
    const firstInsurer = selectedInsurers[0].toLowerCase().split(' ')[0];
    baseField = Object.entries(headers).find(
      ([_, header]) => header.toLowerCase().includes(firstInsurer)
    )?.[0];
  }

  // If we found a base field and it's not the current field, compare values
  const shouldHighlight = baseField && 
                         baseField !== currentField && 
                         String(data[baseField]) !== String(value);

  return (
    <HighlightDiffSpan isDifferent={shouldHighlight}>
      {value ?? "--"}
    </HighlightDiffSpan>
  );
};

export default HighlightDiffRenderer;
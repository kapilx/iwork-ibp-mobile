export interface DonutGraphConfig {
  subtitle: string;
  count: number;
  target: number | null;
  brokerageAmount?: number | null;
  variant?: "single" | "dual";
  // For dual variant - showing target vs achieved
  primaryValue?: number; // Target value
  secondaryValue?: number; // Achieved/Brokerage value
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  achieved?: number; // For backward compatibility, can be used as secondaryValue
}

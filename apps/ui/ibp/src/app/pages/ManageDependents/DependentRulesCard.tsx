import React, { useMemo } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import {
  EligibilityItem,
  EligibilityMeta,
  EligibilityName,
  FormCardHeader,
  RuleItem,
  RulesGrid,
  RulesGroupTitle,
  SectionCard,
  SectionTitle,
} from "./styles";
import { buildDependentRules } from "./utils";

interface DependentRulesCardProps {
  relationships?: any;
  constraints?: any;
  employeeGender?: string;
}

const ageText = (minAge?: number, maxAge?: number) => {
  if (minAge != null && maxAge != null) return `ages ${minAge}–${maxAge}`;
  if (maxAge != null) return `up to ${maxAge} yrs`;
  if (minAge != null) return `${minAge}+ yrs`;
  return "";
};

const DependentRulesCard: React.FC<DependentRulesCardProps> = ({
  relationships,
  constraints,
  employeeGender,
}) => {
  const { eligibility, rules } = useMemo(
    () => buildDependentRules(relationships, constraints, employeeGender),
    [relationships, constraints, employeeGender],
  );

  if (!eligibility.length && !rules.length) return null;

  return (
    <SectionCard>
      <FormCardHeader>
        <FactCheckOutlinedIcon />
        <SectionTitle>Before you add a dependent</SectionTitle>
      </FormCardHeader>

      <RulesGrid>
        <div>
          <RulesGroupTitle>
            <Groups2OutlinedIcon />
            Who you can add
          </RulesGroupTitle>
          {eligibility.map((e) => {
            const age = ageText(e.minAge, e.maxAge);
            const count =
              e.maxCount != null ? `up to ${e.maxCount}` : "";
            const meta = [count, age].filter(Boolean).join(" · ");
            return (
              <EligibilityItem key={e.type}>
                <EligibilityName>
                  {e.type}
                  {meta ? ` — ${meta}` : ""}
                </EligibilityName>
                {e.options.length > 0 && (
                  <EligibilityMeta>{e.options.join(", ")}</EligibilityMeta>
                )}
              </EligibilityItem>
            );
          })}
        </div>

        <div>
          <RulesGroupTitle>
            <RuleOutlinedIcon />
            Rules to remember
          </RulesGroupTitle>
          {rules.map((r) => (
            <RuleItem key={r}>
              <CheckCircleOutlineIcon />
              <span>{r}</span>
            </RuleItem>
          ))}
        </div>
      </RulesGrid>
    </SectionCard>
  );
};

export default DependentRulesCard;

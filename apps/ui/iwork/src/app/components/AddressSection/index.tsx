import { NOT_AVAILABLE } from "@ui/ui-lib";
import React from "react";
import AddressCard from "../AddressCard";
import { AddressSectionContainer } from "./styles";

type CompanyAddress = {
  id: number;
  isPrimary: boolean;
  address?: {
    address1: string;
    address2?: string;
    area?: string;
    pinCode?: string;
    phoneNumber?: string;
    alternatePhoneNumber?: string;
    supportNumber?: string;
    email?: string;
    cityId?: { name: string };
    stateId?: { name: string };
    addressType?: { lookUpValue: string };
    branchType?: { lookUpValue: string };
    branchName?: string;
  };
  address1?: string;
  address2?: string;
  area?: string;
  pinCode?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  supportNumber?: string;
  email?: string;
  cityId?: { name: string };
  stateId?: { name: string };
  addressType?: { lookUpValue: string };
  branchType?: { lookUpValue: string };
  branchName?: string;
};

type Props = {
  companyAddresses: CompanyAddress[];
  showBranchInfo?: boolean;
  onEditBranch?: (addressId: number) => void;
};

const AddressSection: React.FC<Props> = ({ companyAddresses, showBranchInfo = false, onEditBranch }) => {
  return (
    <AddressSectionContainer data-testid="company-address-section">
      {companyAddresses.map((item) => {
        const addr = item.address || item;

        const fullAddress = [
          addr.address1,
          addr.address2,
          addr.area,
          addr.cityId?.name,
          addr.stateId?.name,
          addr.pinCode,
        ]
          .filter(Boolean)
          .join(", ");

        return (
          <AddressCard
            data-testid="company-address-card"
            key={item.id}
            onEdit={onEditBranch ? () => onEditBranch(item.id) : undefined}
            data={{
              location: `${addr.cityId?.name || NOT_AVAILABLE}, ${
                addr.addressType?.lookUpValue || NOT_AVAILABLE
              }`,
              address: fullAddress,
              mobile: addr.phoneNumber || NOT_AVAILABLE,
              landline: addr.alternatePhoneNumber || NOT_AVAILABLE,
              supportNumber: addr.supportNumber || NOT_AVAILABLE,
              email: addr.email || NOT_AVAILABLE,
              branchType: showBranchInfo ? addr.branchType?.lookUpValue || null : null,
              branchName: showBranchInfo ? addr.branchName || null : null,
            }}
          />
        );
      })}
    </AddressSectionContainer>
  );
};

export default AddressSection;

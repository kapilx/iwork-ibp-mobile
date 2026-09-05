export interface MasterUserResponse {
  data: {
    data: {
      userId: number;
      firstName: string;
      branch?: { name?: string };
    }[];
  };
}

export const masterUserDataUtilityFunction = (response: MasterUserResponse) => {
  const masterData = response?.data?.data ?? [];
  return masterData.map(({ userId, firstName, branch }) => ({
    value: userId,
    label: `${firstName}, ${branch?.name}`,
  }));
};

export const masterUserDataUtilityFunctionForOwner = (response: any) => {
  const masterData = response?.data ?? [];
  return masterData.map(({ userId, firstName, lastName }) => ({
    value: userId,
    label: `${firstName} ${lastName}`,
  }));
};

export const accountManagerUtilityFunction = (response: any) => {
  const users = Array.isArray(response)
    ? response
    : Array.isArray(response?.peers)
    ? response.peers
    : Array.isArray(response?.data?.users)
    ? response.data.users
    : Array.isArray(response?.data?.peers)
    ? response.data.peers
    : Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
    ? response.data
    : [];

  return users.map(({ userId, firstName, lastName }: any) => ({
    value: userId,
    label: [firstName, lastName].filter(Boolean).join(" ").trim(),
  }));
};


export const validateDateRange = (
  fromFieldName: string,
  toFieldName: string,
  fromLabel: string,
  toLabel: string,
  errorMessage?: string
) => {
  return (value: any, formValues: any) => {
    const fromValue = formValues?.[fromFieldName];
    const toValue = formValues?.[toFieldName];

    if (!fromValue || !toValue) return true;

    const fromDate = new Date(fromValue);
    const toDate = new Date(toValue);

    return (
      toDate >= fromDate ||
      errorMessage ||
      `${toLabel} must be on or greater than ${fromLabel}`
    );
  };
};

export const employeeReportingManagerUtilityFunction = (response: any) => {
  const employees = response?.data?.data ?? [];
  return employees.map(({ employeeId, firstName }) => ({
    value: employeeId,
    label: firstName,
  }));
};

interface DependencyParams {
  [key: string]: string | number;
}

const companyUtilityFunction = (data: any) => {
  let companyData = data.data.contacts || [];

  return companyData.map((contact: any) => ({
    value: contact.id,
    label: contact.displayName,
  }));
};

const lookUpUtilityFunction = (data: any) => {
  return data.data.map((item: any) => ({
    value: item.id,
    label: item.lookUpValue,
  }));
};

const renderUtilityFunction = (utilityFunctionName: string) => {
  switch (utilityFunctionName) {
    case "lookUpByName":
      return lookUpUtilityFunction;
      // Add logic for rendering Opportunity Activity
      break;
    case "companyUtilityFunction":
      return companyUtilityFunction;
    case "employeeReportingManagerUtilityFunction":
      return employeeReportingManagerUtilityFunction;
    case "meetingUtilityFunction":
      return (data: any) => {
        return data.data.map((item: any) => ({
          value: item.id,
          label: item.name,
        }));
      };
    default:
  }
};

export const resolveDynamicDependencies = (
  config: any[],
  params: DependencyParams,
  endPoints: Record<string, any>
): any[] => {
  return config.map((item) => {
    if (Array.isArray(item.config)) {
      return {
        ...item,
        config: resolveDynamicDependencies(item.config, params, endPoints),
      };
    }

    const { apiDependencies } = item;
    if (apiDependencies?.functionName) {
      let actualValue: string | number | undefined;
      let resolvedUrl: string | undefined;

      const endpoint = endPoints[apiDependencies.functionName];

      // 👉 If it's a function, call it with the right value
      if (typeof endpoint === "function") {
        if (apiDependencies.dependencyKey) {
          actualValue = params[apiDependencies.dependencyKey];
          resolvedUrl = endpoint(actualValue);
        } else if (apiDependencies.paramValue) {
          actualValue = apiDependencies.paramValue;
          resolvedUrl = endpoint(actualValue);
        } else {
          console.warn(
            `No parameter provided for function endpoint '${apiDependencies.functionName}'`
          );
        }
      }
      // 👉 If it's a string, use it directly
      else if (typeof endpoint === "string") {
        resolvedUrl = endpoint;
      }

      if (resolvedUrl) {
        const utilityFunctionName = apiDependencies.utilityFunction;
        const resolvedUtilityFunction =
          renderUtilityFunction(utilityFunctionName);

        let resolvedShowFunction;
        const showCondition = apiDependencies?.showCondition;

        if (typeof showCondition === "string") {
          // resolvedShowFunction = renderShowFunction(showCondition);
        } else if (typeof showCondition === "function") {
          resolvedShowFunction = showCondition;
        } else {
          resolvedShowFunction = () => true;
        }

        return {
          ...item,
          apiDependencies: {
            ...apiDependencies,
            endPoint: resolvedUrl,
            utilityFunction: resolvedUtilityFunction,
            showCondition: resolvedShowFunction,
          },
        };
      }
    }
    //

    return item;
  });
};

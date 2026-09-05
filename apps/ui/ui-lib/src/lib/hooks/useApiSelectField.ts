import { useEffect, useState } from "react";
import useApi from "./useApi";
import { UseFormWatch } from "react-hook-form";
// import { ApiDependencies } from "../common/FormComponent/types";
import { useSelector } from "react-redux";

export interface Option {
  value: number;
  label: string;
}

export const useApiSelectField = ({
  apiDependencies,
  watch,
  fieldName,
}: {
  // apiDependencies: ApiDependencies;
  apiDependencies: any;
  watch: UseFormWatch<any>;
  fieldName: string;
}) => {
  const { data: apiResponse, loading, error, doFetch } = useApi();
  const [options, setOptions] = useState<Option[]>([]);

  const globalState = useSelector((state: any) => state?.user?.dependencies);
  // these will be used to fetch details which does not depend on any other field like lookupdata (in simple the endpoint will be string)
  useEffect(() => {
    if (typeof apiDependencies.endPoint === "string") {
      doFetch(apiDependencies.endPoint, { method: "GET" });
    }
  }, [fieldName, apiDependencies.endPoint]);

  // these will be used to fetch details which depend on other field like in adress section state depends on country and city depends on state (in simple the endpoint will be function)
  useEffect(() => {
    const dependentValue = apiDependencies.dependentField
      ? watch(apiDependencies.dependentField)
      : undefined;
    if (
      apiDependencies.dependentField &&
      dependentValue &&
      dependentValue !== "ALL"
    ) {
      if (typeof apiDependencies.endPoint === "function") {
        // A multiselect parent hands over a list — send it as CSV so the
        // lookup returns the options for every selected parent.
        if (Array.isArray(dependentValue) && dependentValue.length === 0) return;
        const value = Array.isArray(dependentValue)
          ? dependentValue
              .map((v: any) =>
                v && typeof v === "object" && "value" in v ? v.value : v
              )
              .join(",")
          : typeof dependentValue === "object"
          ? dependentValue?.value
          : dependentValue;
        doFetch(`${apiDependencies.endPoint(value)}`, {
          method: "GET",
        });
      }
    }
  }, [
    fieldName,
    apiDependencies.endPoint,
    //whenever the dependent field changes we need to call the api and get the options
    apiDependencies.dependentField
      ? watch(apiDependencies.dependentField)
      : undefined,
  ]);

  useEffect(() => {
    let options: Option[] = [];

    if (
      apiDependencies.endPoint === undefined &&
      !apiResponse &&
      apiDependencies?.utilityFunction
    ) {
      options = apiDependencies.utilityFunction(
        watch(apiDependencies?.utilityDependent)
      );

      setOptions(options);
      return;
    }

    if (apiDependencies.endPoint && !apiResponse) return;

    if (apiDependencies.utilityFunction) {
      if (apiDependencies.utilityDependent) {
        options = apiDependencies.utilityFunction(
          apiResponse,
          watch(apiDependencies.utilityDependent)
        );
      } else {
        options = apiDependencies.utilityFunction(apiResponse, globalState);
      }
    } else {
      //lookup template
      const apiData = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
      if (
        apiDependencies.isSmartSearch !== undefined &&
        apiDependencies.isSmartSearch
      ) {
        //in smart search we are sending label instead of id
        options = apiData.map((item: any) => ({
          label: item.lookUpValue,
          value: item.lookUpValue,
        }));
      } else {
        options = apiData.map((item: any) => ({
          label: item.lookUpValue,
          value: item.id,
        }));
      }
    }

    setOptions(options);
  }, [
    globalState,
    apiResponse, // generally apiResponse is enough here
    //this case is used when we have to call the api and get the options based on the utility dependent(in simple we are calling utility function again when utilityDependent value changes. alternative way we have to make api call).
    //we are added below condition just to rerender when the utilityDependent value changes and it is using in only place in addcontacts for branch field
    apiDependencies.utilityDependent
      ? watch(apiDependencies.utilityDependent)
      : undefined,
  ]);

  return { options, loading, error };
};

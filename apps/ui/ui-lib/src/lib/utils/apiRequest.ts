import axiosInstance from "./axiosInterceptors";
import type { AxiosResponse } from "axios";
import { handleApiError } from ".";
import { endPoints } from "@ui/ui-lib/constants/endPoints";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  responseType?: "blob" | "json" | "arraybuffer";
}

export const apiRequest = async (
  url: string,
  options?: FetchOptions
): Promise<any> => {
  const token = sessionStorage.getItem("user")
    ? JSON.parse(sessionStorage.getItem("user") as string)?.accessToken
        ?.accessToken
    : null;

  const { method = "GET", data, headers = {}, responseType } = options || {};

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const finalHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...headers,
  };

  if (data instanceof FormData && !headers["Content-Type"]) {
    delete finalHeaders["Content-Type"];
  }

  try {
    let response: AxiosResponse;

    switch (method) {
      case "POST":
        response = await axiosInstance.post(url, data, {
          headers: finalHeaders,
          responseType,
        });
        break;
      case "PUT":
        response = await axiosInstance.put(url, data, {
          headers: finalHeaders,
          responseType,
        });
        break;
      case "DELETE":
        response = await axiosInstance.delete(url, {
          headers: finalHeaders,
          responseType,
        });
        break;
      case "GET":
      default:
        response = await axiosInstance.get(url, {
          headers: finalHeaders,
          responseType,
        });
        break;
    }
    return responseType ? response : response.data;
  } catch (error: any) {
    if (error?.request?.responseURL !== endPoints.userDetails) {
      handleApiError(error);
    }
    const responseData = error?.response?.data;
    if (responseData instanceof Blob) {
      try {
        const text = await responseData.text();
        const parsed = JSON.parse(text);
        throw parsed?.message ?? parsed ?? { message: "Something went wrong" };
      } catch (innerErr) {
        if (innerErr !== responseData) throw innerErr;
        throw { message: "Something went wrong" };
      }
    }
    throw (
      responseData ??
      responseData?.message ?? { message: "Something went wrong" }
    );
  }
};

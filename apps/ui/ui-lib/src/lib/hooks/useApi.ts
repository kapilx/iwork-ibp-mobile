import { useState } from "react";
import axiosInstance from "../utils/axiosInterceptors";
import type { AxiosResponse, AxiosError } from "axios";
import { handleApiError } from "../utils";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface FetchOptions {
  method: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
}

const useApi = () => {
  const [data, setData] = useState<AxiosResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AxiosError | null | unknown>(null);

  const doFetch = (url: string, options?: FetchOptions) => {
    setLoading(true);
    setData(null);
    setError(null);

    fetchData(url, options);
  };

  const fetchData = async (url: string, options?: FetchOptions) => {
    try {
      const {
        method = "GET",
        data,
        headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      } = options || {}; // Default to GET if no method is provided

      let response;

      switch (method) {
        case "POST":
          response = await axiosInstance.post(url, data, { headers }); // For POST, data is included in the body
          break;
        case "PUT":
          response = await axiosInstance.put(url, data, { headers }); // For PUT, data is included in the body
          break;
        case "DELETE":
          response = await axiosInstance.delete(url, { data, headers }); // For DELETE, data is included in the body
          break;
        case "GET":
        default:
          response = await axiosInstance.get(url, { headers });
          break;
      }

      setData(response.data);
    } catch (error: unknown) {
      setError(error?.response?.data ?? { message: "something went wrong" });
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, doFetch };
};

export default useApi;

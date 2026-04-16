import axios from "axios";
import { getApiBaseUrl } from "./apiBaseUrl";

const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;

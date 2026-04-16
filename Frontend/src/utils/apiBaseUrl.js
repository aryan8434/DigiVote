import { Capacitor } from "@capacitor/core";

const DEFAULT_PRODUCTION_API_URL = "http://98.81.246.139:3000";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");
const hasHttpProtocol = (value) => /^https?:\/\//i.test(value);

export const getApiBaseUrl = () => {
  const isNative = Capacitor.isNativePlatform();

  // For web (including backend-served build), always use same origin.
  if (!isNative) {
    return "";
  }

  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    const normalized = trimTrailingSlash(envUrl);
    if (!hasHttpProtocol(normalized) || normalized === "/api") {
      return DEFAULT_PRODUCTION_API_URL;
    }
    return normalized;
  }

  // Native builds should use the deployed backend unless a local override is set.
  if (!import.meta.env.DEV) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  if (Capacitor.getPlatform() === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
};

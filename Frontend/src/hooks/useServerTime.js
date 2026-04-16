import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axiosClient from "../utils/axiosClient";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

const API_URL = getApiBaseUrl();
const SOCKET_URL =
  API_URL.startsWith("http://") || API_URL.startsWith("https://")
    ? new URL(API_URL).origin
    : window.location.origin;

export function useServerTime() {
  const [serverTime, setServerTime] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTime = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/time");
      if (res.data?.serverTime) setServerTime(new Date(res.data.serverTime));
      if (res.data?.config) setConfig(res.data.config);
    } catch {
      setServerTime(new Date());
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTime();
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("getTime"));
    socket.on("timeUpdate", (data) => {
      if (data?.serverTime) setServerTime(new Date(data.serverTime));
      if (data?.config) setConfig(data.config);
    });
    socket.on("electionUpdate", fetchTime);

    const interval = setInterval(fetchTime, 30000);
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [fetchTime]);

  const now = serverTime || new Date();
  const registrationOpen =
    config?.registrationDeadline && now < new Date(config.registrationDeadline);
  const votingOpen =
    config?.startTime &&
    config?.endTime &&
    now >= new Date(config.startTime) &&
    now <= new Date(config.endTime);
  const votingNotStarted =
    config?.startTime && now < new Date(config.startTime);
  const countdownToStart =
    votingNotStarted && config?.startTime
      ? new Date(config.startTime) - now
      : 0;

  return {
    serverTime: now,
    config,
    loading,
    registrationOpen: !!registrationOpen,
    votingOpen: !!votingOpen,
    votingNotStarted: !!votingNotStarted,
    countdownToStart,
    refetch: fetchTime,
  };
}

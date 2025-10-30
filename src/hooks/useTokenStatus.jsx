import { useEffect, useRef, useState } from "react";
import { getStoredToken, isTokenExpired, msUntilExpiry, parseJwt } from "../utils/jwt";

export default function useTokenStatus() {
  const [token, setToken] = useState(() => getStoredToken());
  const [payload, setPayload] = useState(() => parseJwt(token));
  const [expired, setExpired] = useState(() => isTokenExpired(token));
  const [remainingMs, setRemainingMs] = useState(() => msUntilExpiry(token));
  const timerRef = useRef(null);

  const schedule = (t) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const wait = Math.min(Math.max(t, 0), 24 * 60 * 60 * 1000);
    timerRef.current = setTimeout(() => {
      const tk = getStoredToken();
      setToken(tk);
      setPayload(parseJwt(tk));
      setExpired(isTokenExpired(tk));
      setRemainingMs(msUntilExpiry(tk));
    }, wait + 250);
  };

  const refresh = () => {
    const tk = getStoredToken();
    setToken(tk);
    setPayload(parseJwt(tk));
    setExpired(isTokenExpired(tk));
    const ms = msUntilExpiry(tk);
    setRemainingMs(ms);
    schedule(ms);
  };

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "authToken") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { token, payload, expired, remainingMs, refresh };
}
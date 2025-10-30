import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTokenStatus from "../../hooks/useTokenStatus";

export default function TokenGuard({ children, redirectInfo = "/login", onExpire = null }) {
    const { expired } = useTokenStatus();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (expired) {
            onExpire?.();
            navigate(redirectInfo, { replace: true, state: { from: location.pathname } });
        }
    }, [expired, navigate, redirectInfo, location.pathname, onExpire]);

    if (expired) return null;
    return children;
}
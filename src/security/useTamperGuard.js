import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useTamperGuard = (expectedRole, showMessage) => {
  const navigate = useNavigate();

  useEffect(() => {
    // don't attach the interval when we don't yet know the expected role
    if (!expectedRole) return;

    let stopped = false;

    const checkLocalStorage = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      try {
        const parsedUser = JSON.parse(storedUser);
        const currentRole = parsedUser.role;
        if (currentRole !== expectedRole) {
          showMessage("role tampering detected", "error");
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setTimeout(() => navigate("/"), 2000);
        }
      } catch {
        showMessage("Corrupted user data", "error");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    const checkDOM = () => {
      const badge = document.querySelector(".role-badge");
      if (
        badge &&
        badge.textContent.trim().toLowerCase() !== expectedRole.toLowerCase()
      ) {
        showMessage("DOM tampering detected", "error");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/"), 2000);
      }
    };

    const checkingScripts = () => {
      if (window.hackedFunction) {
        showMessage("Suspicious script detected", "error");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    // run checks once immediately (avoid waiting for first interval)
    checkLocalStorage();
    checkDOM();
    checkingScripts();

    const interval = setInterval(() => {
      if (stopped) return;
      checkLocalStorage();
      checkDOM();
      checkingScripts();
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [expectedRole, showMessage, navigate]);
};

export default useTamperGuard;

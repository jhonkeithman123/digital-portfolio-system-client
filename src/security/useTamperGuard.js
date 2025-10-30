import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useTamperGuard = (expectedRole, showMessage) => {
    const navigate = useNavigate();

    useEffect(() => {
        const checkLocalStorage = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    const currentRole = parsedUser.role;
                    console.log("Checking role:", currentRole, "Expected:", expectedRole);
                    if(currentRole !== expectedRole) {
                        showMessage("role tampering detected", "error");
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        setTimeout(() => navigate('/'), 2000);
                    }
                } catch {
                    showMessage("Corrupted user data", "error");
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    navigate("/");
                }
            }
        };

        const checkDOM = () => {
            const badge = document.querySelector('.role-badge');
            if (badge && badge.textContent.trim().toLowerCase() !== expectedRole.toLowerCase()) {
                showMessage("DOM tapering detected", "error");
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setTimeout(() => navigate("/"), 2000);
            }
        };

        const checkingScripts = () => {
            if (window.hackedFunction) {
                showMessage("Suspicious script detected", "error");
                setTimeout(() => navigate("/login"), 2000);
            }
        };

        const interval = setInterval(() => {
            checkLocalStorage();
            checkDOM();
            checkingScripts();
        }, 3000);

        return () => clearInterval(interval);
    }, [expectedRole, showMessage, navigate]);
};

export default useTamperGuard;
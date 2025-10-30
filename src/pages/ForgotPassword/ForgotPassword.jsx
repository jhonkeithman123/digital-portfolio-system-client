import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import useMessage from "../../hooks/useMessage";
import './ForgotPassword.css';

const reactAppUrl = process.env.REACT_APP_API_URL;

const ForgotPassword = () => {
    const [code, setCode] = useState("");
    const [step, setStep] = useState("verify");
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState("");
    const [retryPassword, setRetryPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

   const role = localStorage.getItem('role');
   const validRoles = ['student', 'teacher'];

   const { messageComponent, showMessage } = useMessage();

    const navigate = useNavigate();

    useEffect(() => {
        if (!role || !validRoles.includes(role)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showMessage('Your role is not in the storage. Please choose again.', 'error');
            navigate('/');
        }
    });

    const handleSelect = ( page = 'login') => {
        navigate(`/${page}`);
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleCodeVerify = async () => {
        setLoading(true);
        if (!code.trim()) {
            showMessage("Please enter the verification code.", "error");
            return;
        }

        try {
            const res = await fetch(`${reactAppUrl}/auth/verify-code`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();
            if (data.success) {
                showMessage(data.message || "Email verified!", "success");
                setStep("reset");
            } else {
                showMessage(data.message || "Invalid or expired code", "error");
            }
        } catch (err) {
            console.error(err);
            showMessage("Server error. Try again later.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async () => {
        console.log("forgotPass tapped");
        setLoading(true);
        if (!email.trim()) {
            showMessage("Email is required.", "error");
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("Please enter a valid email address.", "error");
            return;
        }

        try {
            const res = await fetch(`${reactAppUrl}/auth/request-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            const data = await res.json();
            if (data.success) {
                showMessage(data.message || "Verification code sent!", "success");
                setStep("code");
            } else {
                console.error(data);
                showMessage(data.error || "Failed to send verification code.", "error");
            }
        } catch (error) {
            showMessage("Server error. Please try again later.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        if (!newPassword || !retryPassword) {
            showMessage("Please fill in both password fields.", "error");
            return;
        }

        if (newPassword !== retryPassword) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        if (newPassword.length < 6) {
            showMessage("Password must be at least 6 characters.", "error");
            return;
        }

        try {
            const res = await fetch(`${reactAppUrl}/auth/reset-password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPassword }),
            });

            const data = await res.json();
            if (data.success) {
                showMessage(data.message || "Password reset successful!", "success");
                setTimeout(() => navigate("/login"), 1500);
            } else {
                console.error(data || "Failed to reset password.");
                showMessage("Failed to reset password.", "error");
            }
        } catch (err) {
            console.error("Server error", err);
            showMessage("Server error", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />

            {messageComponent}
            
            <div className="backgroundF"></div>
            <div className="overlayF"></div>

            <button onClick={() => navigate('/')} className="backF">← Back</button>

            <div className="containerF">
                <h1 className="title">Forgot Password as {role ? role.toUpperCase() : "GUEST"}</h1>
                {step === "verify" && (
                    <div className="input-container">
                        <label htmlFor="email">Email</label>
                        <input 
                            name="email" 
                            autoComplete="email" 
                            type="text"
                            placeholder="Email" 
                            className="inputF"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button onClick={handleForgot} disabled={loading} className={`buttonF ${loading ? "disabled" : ""}`}>Submit</button>
                    </div>
                )}

                {step === "code" && (
                    <div className="input-container">
                        <label htmlFor="code">Verification Code</label>
                        <input 
                            type="text" 
                            name="code"
                            className="inputF" 
                            placeholder="Enter Code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button onClick={handleCodeVerify} disabled={loading} className={`buttonF ${loading ? "disabled" : ""}`}>Verify</button>
                    </div>
                )}

                {step === "reset" && (
                    <div className="input-container">
                        <label htmlFor="reset">Reset Password</label>
                        <div className="password-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="reset"
                                className={`inputF ${showPassword ? "fade-in" : ""}`}
                                placeholder="Enter new Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="password-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="reset"
                                className={`inputF ${showPassword ? "fade-in" : ""}`}
                                placeholder="Re-Enter Password"
                                value={retryPassword}
                                onChange={(e) => setRetryPassword(e.target.value)}
                            />
                        </div>
                        <button type="button" className={`eye-toggle ${showPassword ? "active" : ""}`} onClick={togglePasswordVisibility}>{showPassword ? "🙈" : "👁️"}</button>
                        <button onClick={handleReset} disabled={loading} className={`buttonF ${loading ? "disabled" : ""}`} >Reset</button>
                    </div>
                )}
                {loading && <div className="overlay-spinner"><div className="spinner"></div></div>}
                <div className="button-containerF">
                    <button onClick={() => handleSelect()} className="buttonF">Back to Log in</button>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword
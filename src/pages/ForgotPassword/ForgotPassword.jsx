import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import useMessage from "../../hooks/useMessage";
import "./ForgotPassword.css";
import InputField from "../../components/InputField";
import { apiFetchPublic } from "../../utils/apiClient.js";

const reactAppUrl = process.env.REACT_APP_API_URL;

const ForgotPassword = () => {
  const [code, setCode] = useState("");
  const [step, setStep] = useState("verify");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retryPassword, setRetryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = localStorage.getItem("role");
  const validRoles = ["student", "teacher"];

  const { messageComponent, showMessage } = useMessage();

  const navigate = useNavigate();

  useEffect(() => {
    if (!role || !validRoles.includes(role)) {
      localStorage.removeItem("user");
      showMessage(
        "Your role is not in the storage. Please choose again.",
        "error"
      );
      navigate("/");
    }
  }, [role, navigate]);

  const handleSelect = (page = "login") => {
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
      setLoading(false);
      return;
    }

    try {
      const { ok, data } = await apiFetchPublic(`/auth/verify-code`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      if (ok && data?.success) {
        showMessage(data.message || "Email verified!", "success");
        setStep("reset");
      } else {
        showMessage(data?.message || "Invalid or expired code", "error");
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
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address.", "error");
      setLoading(false);
      return;
    }

    try {
      const { ok, data } = await apiFetchPublic(`/auth/request-verification`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      if (ok && data?.success) {
        showMessage(data.message || "Verification code sent!", "success");
        setStep("code");
      } else {
        console.error(data);
        showMessage(
          data?.error || "Failed to send verification code.",
          "error"
        );
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
      setLoading(false);
      return;
    }

    if (newPassword !== retryPassword) {
      showMessage("Passwords do not match.", "error");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      setLoading(false);
      return;
    }

    try {
      const { ok, data } = await apiFetchPublic(`/auth/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ email, newPassword }),
      });
      if (ok && data?.success) {
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

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    handleForgot();
  };
  const handleCodeSubmit = (e) => {
    e.preventDefault();
    handleCodeVerify();
  };
  const handleResetSubmit = (e) => {
    e.preventDefault();
    handleReset();
  };

  return (
    <>
      <Header />

      {messageComponent}

      <div className="backgroundF"></div>
      <div className="overlayF"></div>

      <button onClick={() => navigate("/")} className="backF">
        ← Back
      </button>

      <div className="containerF">
        <h1 className="title">
          Forgot Password as {role ? role.toUpperCase() : "GUEST"}
        </h1>
        {step === "verify" && (
          <form className="input-container" onSubmit={handleForgotSubmit}>
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`buttonF ${loading ? "disabled" : ""}`}
            >
              Submit
            </button>
          </form>
        )}

        {step === "code" && (
          <form className="input-container" onSubmit={handleCodeSubmit}>
            <InputField
              label="Verification Code"
              name="code"
              type="text"
              placeholder="Enter Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`buttonF ${loading ? "disabled" : ""}`}
            >
              Verify
            </button>
          </form>
        )}

        {step === "reset" && (
          <form className="input-container" onSubmit={handleResetSubmit}>
            <InputField
              label="Reset Password"
              name="reset"
              type="password"
              placeholder="Enter new Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showToggle
              required
            />
            <InputField
              label="Re-Enter Password"
              name="retry"
              type="password"
              placeholder="Re-Enter Password"
              value={retryPassword}
              onChange={(e) => setRetryPassword(e.target.value)}
              showToggle
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`buttonF ${loading ? "disabled" : ""}`}
            >
              Reset
            </button>
          </form>
        )}

        {loading && (
          <div className="overlay-spinner">
            <div className="spinner"></div>
          </div>
        )}
        <div className="button-containerF">
          <button onClick={() => handleSelect()} className="buttonF">
            Back to Log in
          </button>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;

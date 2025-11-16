import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useMessage from "../../hooks/useMessage";
import Header from "../../components/Header";
import {
  localStorageRemove,
  localStorageGet,
  localStorageSet,
} from "../../utils/modifyFromLocalStorage";
import { apiFetchPublic } from "../../utils/apiClient.js";
import "./Login.css";
import InputField from "../../components/InputField";

const Login = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const { messageComponent, showMessage } = useMessage();

  const role = localStorageGet({ keys: ["role"] })[0];

  const navigate = useNavigate();

  const valid_roles = useMemo(() => ["student", "teacher"], []);

  useEffect(() => {
    localStorageRemove({ keys: ["token", "user", "currentClassroom"] });

    if (!role || !valid_roles.includes(role)) {
      localStorage.clear();
      alert("Your role is not in the storage. Please choose again.");
      navigate("/");
    }
  }, [role, navigate, valid_roles]);

  const handleSelect = (page = "login") => {
    navigate(`/${page}`);
  };

  const validation = () => {
    const newErrors = {};

    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email format";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be atleast 6 characters long";

    setErrors(newErrors);
    return newErrors;
  };

  const handleLogin = () => {
    const validationErrors = validation();
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      showMessage(firstError, "error");
      return;
    }

    apiFetchPublic(
      `/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      },
      { withCredentials: true }
    ) // include to receive httpOnly cookie
      .then(({ ok, data }) => {
        if (!ok || !data?.success) {
          const msg = data?.error || "Login failed";
          showMessage(msg, "error");
          return;
        }
        showMessage("Login successfull", "success");
        setUser(data.user);
        localStorageSet({
          keys: ["user", "role"],
          values: [JSON.stringify(data.user), data.user.role],
        });
        navigate(`/dash`);
      })
      .catch((err) => {
        console.error("Login error:", err);
        showMessage("Server Error", "error");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <>
      <Header
        variant="public"
        subtitle={role ? `Login as ${role.toUpperCase()}` : "Login"}
        leftActions={
          <button onClick={() => navigate("/")} className="header-link">
            ← Back
          </button>
        }
      />
      <div className="backgroundL"></div>
      <div className="overlayL"></div>

      {messageComponent}

      <form className="containerL" onSubmit={handleSubmit}>
        <div className="input-container">
          <InputField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="Email"
            required
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            showToggle
            required
          />
        </div>
        <div className="buttonContainerL">
          <button type="submit" className="buttonL">
            Log in
          </button>
          <button
            onClick={() => handleSelect("signup")}
            type="button"
            className="buttonL"
          >
            Sign up
          </button>
          <button
            onClick={() => handleSelect("forgot")}
            type="button"
            className="buttonNBG"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </>
  );
};

export default Login;

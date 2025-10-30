import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useMessage from "../../hooks/useMessage";
import Header from "../../components/Header";
import { localStorageRemove, localStorageGet, localStorageSet } from "../../utils/modifyFromLocalStorage";
import './Login.css';

const Login = () => {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const { messageComponent, showMessage } = useMessage();

    const role = localStorageGet({ keys: ['role'] })[0];

    const navigate = useNavigate();

    const valid_roles = useMemo(() => ['student', 'teacher'], []);
    useEffect(() => {
        localStorageRemove({ keys: ['token', 'user', 'currentClassroom'] });

        if (!role || !valid_roles.includes(role)) {
            localStorage.clear();
            alert('Your role is not in the storage. Please choose again.');
            navigate('/');
        }
    }, [role, navigate, valid_roles]);

    const handleSelect = ( page = 'login') => {
        navigate(`/${page}`);
    }

    const apiUrl = process.env.REACT_APP_API_URL;

    const validation = () => {
        const newErrors = {};

        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be atleast 6 characters long';

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

        fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage("Login successfull", "success");
                setUser(data.user);
                localStorageSet({ keys: ['token', 'user', 'role'], values: [data.token, JSON.stringify(data.user), data.user.role] });
                navigate(`/dash`);
            } else {
                showMessage(data.error || "Login failed", 'error');
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            showMessage('Server Error', 'error');
        });
    };

    return (
        <>
            <Header />
            <div className="backgroundL"></div>
            <div className="overlayL"></div>

            {messageComponent}
            
            <button onClick={() => navigate('/')} className="backL">← Back</button>

            <div className="containerL">
                <h1 className="title">Login as {role ? role.toUpperCase() : "GUEST"}</h1>
                <div className="input-container">
                    <label htmlFor="email">Email</label>
                    <input name="email" value={email} autoComplete="email" type="text" placeholder="Email" className="inputL" onChange={(e) => setEmail(e.target.value)} />

                    <label htmlFor="password">Password</label>
                    <div className="password-wrapper">
                        <input name="password" value={password} autoComplete="current-password" type={showPassword ? 'text' : 'password'} placeholder="Password" className="inputL" onChange={(e) => setPassword(e.target.value)} />
                        <span className="toggle-icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</span>
                    </div>
                </div>
                <div className="buttonContainerL">
                    <button onClick={handleLogin} type="submit" className="buttonL">Log in</button>
                    <button onClick={() => handleSelect('signup')} type="button" className="buttonL">Sign up</button>
                    <button onClick={() => handleSelect('forgot')} type="button" className="buttonNBG">Forgot Password?</button>
                </div>
            </div>
        </>
    );
};

export default Login;
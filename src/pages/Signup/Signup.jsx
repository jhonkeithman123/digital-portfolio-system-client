import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import useMessage from "../../hooks/useMessage";
import './Signup.css';
import { useEffect, useState } from "react";

const reactAppUrl = process.env.REACT_APP_API_URL;

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail]= useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { messageComponent, showMessage } = useMessage();

    const role = localStorage.getItem('role');
    const validRoles = ['student', 'teacher'];

    const navigate = useNavigate();

    useEffect(() => {
        if (!role || !validRoles.includes(role)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showMessage("Your role is not in the storage. Please choose again.", "error");
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    }, [role, navigate])

    const handleSelect = (page = "login") => {
        navigate(`/${page}`);
    }

    const validate = () => {
        if (!name || !email || !password) {
            showMessage('All fields are required', 'error');
            return false;
        }

        if (!/\S+@\S+\./.test(email)) {
            showMessage('Invalid email format', 'error');
            return false;
        }

        if (password.length < 6) {
            showMessage("Passwords must be at least 6 characters", 'error');
            return false;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords must match', 'error');
            return false;
        }

        return true;
    };

    const handleSignup = () => {
        if (!validate()) return;

        fetch(`${reactAppUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage('Signup successful! Redirecting...', 'success');
                setTimeout(() => navigate(`/login?role=${role}`), 1500);
            } else {
                showMessage(data.error || 'Singup failed', 'error');
            }
        })
        .catch(() => showMessage('Server error', 'error'));
    };

    return (
        <>
            <Header />
            <div className="backgroundS"></div>
            <div className="overlayS"></div>

            <button onClick={() => navigate('/')} className="backS">← Back</button>

            {messageComponent}

            <div className="containerS">
                <h1 className="title">Sign Up as a {role ? role.toUpperCase() : "GUEST"}</h1>
                <div className="input-containerS">
                    <label htmlFor="username">Username</label>
                    <input name="username" type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="username" placeholder="Username" className="inputS" />
                    <label htmlFor="email">Email</label>
                    <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="Email" className="inputS" />
                    <div className="password-wrapperS">
                        <label htmlFor="password">Password</label>
                        <input name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new password" placeholder="Password" className="inputS" />
                        <span className="toggle-iconS" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</span>

                        <label htmlFor="password">Confirm Password</label>
                        <input name="password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new password" placeholder="Password" className="inputS" />
                    </div>
                </div>
                <div className="button-containerS">
                    <button onClick={handleSignup} type="submit" className="buttonS">Sign up</button>
                    <button onClick={() => handleSelect()} className="buttonS">Back to Log in</button>
                </div>
            </div>
        </>
    );
};

export default Signup;
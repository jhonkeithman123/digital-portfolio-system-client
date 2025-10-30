import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { localStorageRemove, localStorageSet, localStorageGet } from "../../utils/modifyFromLocalStorage";
import './RoleSelect.css';

const reactAppUrl = process.env.REACT_APP_API_URL;

const RoleSelect = () => {
    const navigate = useNavigate();

    const handleSelect = (role) => {
        localStorage.setItem('role', role);
        navigate(`/login`);
    };

    useEffect(() => {
        localStorageRemove({ keys: ['role'] });
        const token = localStorageGet({ keys: ['token'] })[0];
        if (!token) return;

        fetch(`${reactAppUrl}/auth/session`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorageRemove({ keys: ['role'] });
                localStorageSet({ keys: ['user', 'role'], values: [JSON.stringify(data.user), data.user.role] });
                navigate('/dash');
            }
        })
        .catch(() => {
            localStorageRemove({ keys: ['token', 'user'] });
        });
    }, [navigate]);

    return (
        <>
            <Header />
            <div className="background"></div>
            <div className="overlay"></div>
            
            <div className="container">
                <p className="title">Select your role to continue:</p>
                <div className="buttonGroup">
                    <button onClick={() => handleSelect('student')} className="button student">Student</button>
                    <button onClick={() => handleSelect('teacher')} className="button teacher">Teacher</button>
                </div>
            </div>
        </>
    );
};


export default RoleSelect;
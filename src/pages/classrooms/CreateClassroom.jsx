import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useMessage from "../../hooks/useMessage";
import useLogout from "../../hooks/useLogout";
import './CreateClassroom.css';

const CreateClassroom = () => {
    const navigate = useNavigate();
    const [logout, LogoutModal] = useLogout();

    const [name, setName] = useState('');
    const [schoolYear, setSchoolYear] = useState('');
    const { messageComponent, showMessage } = useMessage();

    const handleCreate = () => {
        if (!name || !schoolYear) return showMessage("Please fill all fields.", "error");
        const token = localStorage.getItem("token");
        fetch(`${process.env.REACT_APP_API_URL}/classrooms/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name, schoolYear })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
                showMessage("Successfully created a classroom", "success");
                navigate('/dash');
            } else {
                showMessage(data.error || "failed to create classroom.", "error");
            }
          })
          .catch(() => showMessage("Server error. Try again later.", "error"));
    };

    return (
        <>
            {messageComponent}

            <div className="create-classroom-wrapper">
                <div className="create-classroom-container">
                    <h1>Create Your Advisory Classroom</h1>
                    <input
                        className="create-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Classroom Name"
                    />
                    <input
                        className="create-input"
                        type="text"
                        value={schoolYear}
                        onChange={(e) => setSchoolYear(e.target.value)}
                        placeholder="School Year (e.g. 2025-2026)"
                    />
                    <button className="create-button" onClick={handleCreate}>Create Classroom</button>
                    <LogoutModal />
                    <button className="create-button" onClick={logout}>Logout</button>
                </div>
            </div>
        </>
    )
};

export default CreateClassroom;
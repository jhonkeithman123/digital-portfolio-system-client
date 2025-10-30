import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import useMessage from "../../hooks/useMessage";
import useLogout from "../../hooks/useLogout";

import InvNotificationMenu from "./InvNotificationMenu";
import './JoinClassroom.css';
import './InviteBell.css';

const reactAppUrl = process.env.REACT_APP_API_URL;

const JoinClassroom = () => {
    const navigate = useNavigate();
    const [logout, LogoutModal] = useLogout();

    const [code, setCode] = useState('');
    const [invites, setInvites] = useState([]);
    const [inviteOpen, setInviteOpen] = useState(false);
    const bellRef = useRef(null);

    const { messageComponent, showMessage } = useMessage();
    const visibleInvitesCount = invites.filter(inv => !inv.hidden && !inv.hidden === false ? true : !inv.hidden).length;

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('[JoinClassroom] fetching invites, token present:', token);
        fetch(`${reactAppUrl}/classrooms/invites`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            console.log('[JoinClassroom] invites response:', data);
            if (data.success && Array.isArray(data.invites)) {
                setInvites(data.invites);
            } else {
                setInvites([]);
            }
        })
        .catch((err) => {
            console.log("[JoinClassroom] failed to fetch invites:", err);
            showMessage("Failed to fetch invites", "error")
        });
    }, []);

    const handleJoin = (joinCode) => {
        const useCode = joinCode || code;
        if (!useCode || useCode.length !== 10) return showMessage("Please enter a valid 10-character classroom code.", "error");

        const token = localStorage.getItem("token");
        fetch(`${reactAppUrl}/classrooms/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ code: useCode })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
                showMessage("Successfully enrolled", "success");
                navigate('/dash');
            } else {
                showMessage(data.error || "Failed to join classroom", "error");
            }
          })
          .catch(() => showMessage("Server error. Tyr again later.", "error"));
    };

    return (
        <>
            {messageComponent}

            <div className="invite-bell-wrapper" ref={bellRef}>
                <button 
                    type="button"
                    className="invite-bell"
                    aria-label="Invites"
                    aria-expanded={inviteOpen}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log("[InviteBell] clicked - toggle:", !inviteOpen);
                        setInviteOpen(v => !v);
                    }}
                >
                    <svg 
                        className="invite-bell-icon"
                        viewBox="0 0 24 24"
                        aria-hidden
                    >
                        <path d="M12 2a7 7 0 0 0-7 7v4.5L3.3 16.1A1 1 0 0 0 4 18h16a1 1 0 0 0 .7-1.6L19 13.5V9a7 7 0 0 0-7-7zM12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22z" />
                    </svg>
                    {visibleInvitesCount > 0 && <span className="invite-badge">{visibleInvitesCount}</span>}
                </button>
            </div>

            {inviteOpen && (
                <InvNotificationMenu 
                    invites={invites}
                    setInvites={setInvites}
                    anchorRef={bellRef}
                    onClose={() => setInviteOpen(false)}
                    onJoin={(c) => {
                        console.log("Openinng the inv notification menu");
                        handleJoin(c);
                        setInviteOpen(false);
                    }}
                />
            )}
            
            <div className="join-classroom-wrapper">
                <div className="join-classroom-container">
                    <h1>Welcome to Digital Portfolio</h1>
                    <p>You're not enrolled in a classroom yet.</p>
                    <p>Enter a classroom code below or wait for your teacher to invite you.</p>

                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter 10-character code"
                        maxLength={10}
                        className="code-input"
                    />
                    <button className="join-button" onClick={() => handleJoin()}>Join Classroom</button>
                    <LogoutModal />
                    <button className="join-button" onClick={logout}>Logout</button>
                </div>
            </div>
        </>
    )
}

export default JoinClassroom;
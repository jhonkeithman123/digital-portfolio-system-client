import { useEffect, useState } from "react";
import './css/NotificationMenu.css';

const NotificationMenu = ({ setUnreadCount, onClose }) => {
    const [notifications, setNotifications] = useState([]);

    const markAsRead = (id) => {
        const token = localStorage.getItem('token');

        fetch(`${process.env.REACT_APP_API_URL}/notifications/${id}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');

        fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
                const unread = data.notifications.filter(n => !n.is_read).length;
                setUnreadCount(unread);
                setNotifications(data.notifications);
            }
          });
    }, []);

    return (
        <div className="notification-menu">
            <h4>Notifications</h4>
            <ul>
                {notifications.map(n => (
                    <li 
                        key={n.id} 
                        className={n.is_read ? 'read' : 'unread'}
                        onClick={() => markAsRead(n.id)}    
                    >
                        <a href={n.link || '#'}>{n.message}</a>
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NotificationMenu;
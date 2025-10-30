import { useEffect } from 'react';
import './css/burger_menu.css';

const BurgerMenu = ({ openMenu, toggleMenu, classroomInfo }) => {

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') toggleMenu(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleMenu]);

    return (
        <div className="burger-menu">
            <button className={`burger-toggle ${openMenu ? 'open' : ''}`} onClick={() => toggleMenu(prev => !prev)}>
                <span className="line top"></span>
                <span className="line middle"></span>
                <span className="line bottom"></span>
            </button>
            {openMenu && (
                <div className="burger-overlay" onClick={() => toggleMenu(false)}></div>
            )}
            <div className={`burger-dropdown ${openMenu && classroomInfo ? 'open' : ''}`}>
                {classroomInfo ? (
                    <>
                        <h3>Advisory Classroom</h3>
                        <p><strong>Name: </strong> {classroomInfo.name}</p>
                        <p><strong>Code: </strong> {classroomInfo.code}</p>
                        <button onClick={() => navigator.clipboard.writeText(classroomInfo.code)}>Copy Code</button>
                    </>
                ) : (
                    <p>Loading classroom info</p>
                )}
            </div>
        </div>
    );
}

export default BurgerMenu;
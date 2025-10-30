import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import './NotFound.css'

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <>
            <Header />
            <div className="containerN">
                <h1 className="notFound">404 - Page Not Found</h1>
                <p className="notFoundP">Sorry, the page you're looking for doesn't exist.</p>
                <button onClick={() => navigate("/")} className="buttonN">Go Back</button>
            </div>
        </>
    );
}

export default NotFound;
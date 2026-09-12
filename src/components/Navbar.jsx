import { Link, useNavigate } from "react-router-dom";
import { LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <BarChart3 size={22} strokeWidth={2.5} />
          <span>SalesForecast</span>
        </Link>
      </div>
      <div className="navbar-right">
        <span className="navbar-user">
          {user?.name} <span className="role-badge">{user?.role}</span>
        </span>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={2.2} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./sidebar.css";

const Sidebar = () => {
  const { user } = useAuth();

  const links = [
    { to: "/", label: "Dashboard", icon: "🏠" },
    { to: "/products", label: "Products", icon: "📦" },
    { to: "/sales", label: "Sales", icon: "💰" },
    { to: "/forecast", label: "Forecast", icon: "📈" },
    { to: "/reports", label: "Reports", icon: "📄" },
  ];

  return (
    <aside className="sidebar">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="icon">{link.icon}</span>
          <span className="label">{link.label}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;

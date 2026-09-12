import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./sidebar.css";

const Sidebar = () => {
  const { user } = useAuth();

  const links = [
    { to: "/", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/products", label: "Products", Icon: Package },
    { to: "/sales", label: "Sales", Icon: DollarSign },
    { to: "/forecast", label: "Forecast", Icon: TrendingUp },
    { to: "/reports", label: "Reports", Icon: FileText },
  ];

  return (
    <aside className="sidebar">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            isActive ? "sidebar-link active" : "sidebar-link"
          }
        >
          <span className="icon">
            <Icon size={20} strokeWidth={2} />
          </span>
          <span className="label">{label}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;

import "../styles/dashboard.css";

const DashboardCard = ({ title, value, icon, color }) => {
  return (
    <div
      className="dashboard-card"
      style={{ borderLeftColor: color || "#3b82f6" }}
    >
      <div className="card-icon" style={{ background: color || "#3b82f6" }}>
        {icon}
      </div>
      <div className="card-body">
        <p className="card-title">{title}</p>
        <h3 className="card-value">{value}</h3>
      </div>
    </div>
  );
};

export default DashboardCard;

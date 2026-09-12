import { useEffect, useState } from "react";
import API from "../api/axios";
import DashboardCard from "../components/DashboardCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../styles/dashboard.css";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, sl] = await Promise.all([
          API.get("/forecast/summary"),
          API.get("/sales"),
        ]);
        setSummary(s.data);
        setSales(sl.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  // Build chart data: revenue per day (last 10)
  const chartData = sales
    .slice(0, 10)
    .reverse()
    .map((s) => ({
      name: new Date(s.saleDate).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      revenue: s.totalAmount,
      quantity: s.quantitySold,
    }));

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Dashboard Overview</h1>

      <div className="cards-grid">
        <DashboardCard
          title="Total Revenue"
          value={`₦${(summary?.totalRevenue || 0).toLocaleString()}`}
          icon="💰"
          color="#10b981"
        />
        <DashboardCard
          title="Total Products"
          value={summary?.totalProducts || 0}
          icon="📦"
          color="#3b82f6"
        />
        <DashboardCard
          title="Total Sales"
          value={summary?.totalSales || 0}
          icon="🛒"
          color="#f59e0b"
        />
        <DashboardCard
          title="Forecast Next Month"
          value={Math.round(summary?.nextMonthForecast || 0)}
          icon="📈"
          color="#8b5cf6"
        />
        <DashboardCard
          title="Best Selling"
          value={summary?.bestSelling || "N/A"}
          icon="⭐"
          color="#ef4444"
        />
      </div>

      <div className="charts-section">
        <div className="chart-box">
          <h3>Recent Revenue</h3>
          {chartData.length === 0 ? (
            <p className="empty-text">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-box">
          <h3>Recent Quantity Sold</h3>
          {chartData.length === 0 ? (
            <p className="empty-text">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
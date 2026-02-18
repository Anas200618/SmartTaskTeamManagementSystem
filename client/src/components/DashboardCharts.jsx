import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const ChartCard = ({ title, children }) => (
  <div className="card border-0 shadow-sm custom-rounded h-100">
    <div className="card-body p-4">
      <h5 className="fw-semibold mb-4">{title}</h5>
      <div style={{ height: "300px", position: "relative" }}>{children}</div>
    </div>
  </div>
);

const DashboardCharts = ({ stats, showAdminView }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  // Data for Admin/SuperAdmin
  const adminBarData = {
    labels: ["Total", "Completed", "In Progress", "Pending"],
    datasets: [
      {
        label: "Tasks Overview",
        data: [
          stats.totalTasks || 0,
          stats.completedTasks || 0,
          stats.inProgressTasks || 0,
          stats.pendingTasks || 0,
        ],
        backgroundColor: ["#6a11cb", "#00c9ff", "#f7971e", "#ff416c"],
        borderRadius: 6,
      },
    ],
  };

  const adminLineData = {
    labels: stats.annualTrend?.labels || [],
    datasets: [
      {
        label: "Total Work Hours (System)",
        data: stats.annualTrend?.data || [],
        borderColor: "#43cea2",
        backgroundColor: "rgba(67, 206, 162, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const adminDoughnutData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [
          stats.completedTasks || 0,
          stats.inProgressTasks || 0,
          stats.pendingTasks || 0,
        ],
        backgroundColor: ["#00c9ff", "#f7971e", "#ff416c"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  // Data for Member
  const memberLineData = {
    labels: ["Assigned", "Completed", "Pending"],
    datasets: [
      {
        label: "Your Tasks",
        data: [
          stats.assignedTasks || 0,
          stats.completedTasks || 0,
          stats.pendingTasks || 0,
        ],
        borderColor: "#6a11cb",
        backgroundColor: "rgba(106, 17, 203, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#6a11cb",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="row g-4 mb-4">
      {showAdminView ? (
        <>
          <div className="col-lg-4">
            <ChartCard title="Task Bar View">
              <Bar data={adminBarData} options={chartOptions} />
            </ChartCard>
          </div>
          <div className="col-lg-4">
            <ChartCard title="Annual System Trend">
              <Line data={adminLineData} options={chartOptions} />
            </ChartCard>
          </div>
          <div className="col-lg-4">
            <ChartCard title="Task Status Breakdown">
              <Doughnut data={adminDoughnutData} options={chartOptions} />
            </ChartCard>
          </div>
        </>
      ) : (
        <>
          <div className="col-lg-4">
            <ChartCard title="Task Breakdown">
              <Pie data={adminDoughnutData} options={chartOptions} />
            </ChartCard>
          </div>
          <div className="col-lg-8">
            <ChartCard title="Activity Trend">
              <Line data={memberLineData} options={chartOptions} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardCharts;
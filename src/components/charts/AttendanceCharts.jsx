// import React, { useRef, useEffect, useState } from "react";
// import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
// import moment from "moment";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js";

// // Register ChartJS components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// const DEFAULT_API_BASE = "https://smc-backend-bjm5.onrender.com";

// /* Utility helpers */
// function lastNDates(n) {
//   const dates = [];
//   for (let i = n - 1; i >= 0; i--) {
//     const d = moment().subtract(i, "days").startOf("day");
//     dates.push(d);
//   }
//   return dates;
// }

// function dateKey(m) {
//   return m.format("YYYY-MM-DD");
// }

// async function fetchAttendanceForSweeper(apiBase, sweeperId, from, to) {
//   try {
//     const url = `${apiBase}/sweepers/${sweeperId}/attendance?from=${from}&to=${to}`;
//     const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
//     if (!res.ok) return [];
//     const json = await res.json();
//     return Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
//   } catch {
//     return [];
//   }
// }

// /* Hook to fetch sweepers and attendance entries (same as earlier implementation) */
// function useAttendanceData(apiBase = DEFAULT_API_BASE, days = 7) {
//   const [sweepers, setSweepers] = useState([]);
//   const [attendanceEntries, setAttendanceEntries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let mounted = true;
//     const fetchAll = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const sres = await fetch(`${apiBase}/sweepers`, { method: "GET", headers: { "Content-Type": "application/json" } });
//         if (!sres.ok) throw new Error(`Failed to fetch sweepers (${sres.status})`);
//         const sjson = await sres.json();
//         const sw = Array.isArray(sjson.sweepers) ? sjson.sweepers : [];
//         if (!mounted) return;
//         setSweepers(sw);
//         if (sw.length === 0) {
//           setAttendanceEntries([]);
//           setLoading(false);
//           return;
//         }

//         const dates = lastNDates(days);
//         const from = dateKey(dates[0]);
//         const to = dateKey(dates[dates.length - 1]);

//         const attendancePromises = sw.map(async (s) => {
//           const entries = await fetchAttendanceForSweeper(apiBase, s._id || s.id, from, to);
//           return entries.map((e) => ({ ...e, sweeperId: s._id || s.id }));
//         });

//         const results = await Promise.all(attendancePromises);
//         if (!mounted) return;
//         const flattened = results.flat();
//         setAttendanceEntries(flattened);
//       } catch (err) {
//         if (!mounted) return;
//         setError(err.message || "Error fetching attendance data");
//         setAttendanceEntries([]);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     fetchAll();
//     return () => {
//       mounted = false;
//     };
//   }, [apiBase, days]);

//   return { sweepers, attendanceEntries, loading, error };
// }

// /* Render guard: only render charts on client after mount to avoid Chart.js DOM errors */
// function useIsClient() {
//   const [isClient, setIsClient] = useState(false);
//   useEffect(() => setIsClient(true), []);
//   return isClient;
// }

// /* WEEKLY CHART */
// export const WeeklyAttendanceChart = ({ data: propData = null, apiBase = DEFAULT_API_BASE, days = 7 }) => {
//   const isClient = useIsClient();
//   const { sweepers, attendanceEntries, loading } = useAttendanceData(apiBase, days);
//   const chartRef = useRef(null);

//   const dates = lastNDates(days);
//   const labels = dates.map((d) => d.format("DD MMM")).reverse();

//   const countsMap = {};
//   dates.forEach((d) => {
//     countsMap[dateKey(d)] = { verified: 0, pending: 0, total: sweepers.length };
//   });

//   if (!propData) {
//     attendanceEntries.forEach((entry) => {
//       const entryDate = moment(entry.date).utc().startOf("day");
//       const key = dateKey(entryDate);
//       if (countsMap[key]) countsMap[key].verified = (countsMap[key].verified || 0) + 1;
//     });
//     Object.keys(countsMap).forEach((k) => {
//       countsMap[k].pending = Math.max(0, (countsMap[k].total || 0) - (countsMap[k].verified || 0));
//     });
//   }

//   const chartData = {
//     labels,
//     datasets: [
//       {
//         label: "Present",
//         data: propData ? propData.map((it) => it.verified).reverse() : Object.values(countsMap).map((v) => v.verified).reverse(),
//         backgroundColor: "#4caf50",
//         borderColor: "#4caf50",
//         borderWidth: 2,
//         tension: 0.4,
//         fill: false,
//       },
//       {
//         label: "Absent/Pending",
//         data: propData ? propData.map((it) => it.pending).reverse() : Object.values(countsMap).map((v) => v.pending).reverse(),
//         backgroundColor: "#ff9800",
//         borderColor: "#ff9800",
//         borderWidth: 2,
//         tension: 0.4,
//         fill: false,
//       },
//       {
//         label: "Total Staff",
//         data: propData ? propData.map((it) => it.total).reverse() : Object.values(countsMap).map((v) => v.total).reverse(),
//         backgroundColor: "#1976d233",
//         borderColor: "#1976d2",
//         borderWidth: 1,
//         tension: 0.4,
//         fill: true,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     scales: {
//       y: { beginAtZero: true, suggestedMax: Math.max(10, sweepers.length), title: { display: true, text: "Number of Staff" } },
//       x: { title: { display: true, text: "Date" } },
//     },
//     interaction: { mode: "index", intersect: false },
//     plugins: { tooltip: { enabled: true }, legend: { position: "top" } },
//   };

//   if (!isClient || loading) {
//     return <div className="h-64 p-6 text-center text-gray-500">Loading chart...</div>;
//   }

//   return (
//     <div className="h-64">
//       <Line ref={chartRef} data={chartData} options={options} />
//     </div>
//   );
// };

// /* ZONE CHART */
// export const ZoneAttendanceChart = ({ apiBase = DEFAULT_API_BASE }) => {
//   const isClient = useIsClient();
//   const { sweepers, attendanceEntries, loading } = useAttendanceData(apiBase, 1);
//   const chartRef = useRef(null);

//   if (!isClient || loading) return <div className="h-64 p-6 text-center text-gray-500">Loading zone chart...</div>;

//   const zoneMap = {};
//   sweepers.forEach((s) => {
//     const z = s.zone || "Unknown";
//     if (!zoneMap[z]) zoneMap[z] = { total: 0, present: 0 };
//     zoneMap[z].total += 1;
//   });

//   const todayKey = dateKey(moment().startOf("day"));
//   const presentSet = new Set();
//   attendanceEntries.forEach((entry) => {
//     const key = dateKey(moment(entry.date).utc().startOf("day"));
//     if (key === todayKey) presentSet.add(entry.sweeperId || entry.sweeper || entry.sweeperId);
//   });

//   sweepers.forEach((s) => {
//     const z = s.zone || "Unknown";
//     if (presentSet.has(s._id || s.id)) zoneMap[z].present += 1;
//   });

//   const labels = Object.keys(zoneMap);
//   const presentData = labels.map((z) => zoneMap[z].present);
//   const pendingData = labels.map((z) => Math.max(0, zoneMap[z].total - zoneMap[z].present));

//   const data = {
//     labels,
//     datasets: [
//       { label: "Present", data: presentData, backgroundColor: "#4caf50cc", borderColor: "#4caf50", borderWidth: 1 },
//       { label: "Absent/Pending", data: pendingData, backgroundColor: "#ff9800cc", borderColor: "#ff9800", borderWidth: 1 },
//     ],
//   };

//   const options = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: "top" } } };

//   return (
//     <div className="h-64">
//       <Bar ref={chartRef} data={data} options={options} />
//     </div>
//   );
// };

// /* PIE CHART */
// export const AttendancePieChart = ({ verified: propVerified = null, pending: propPending = null, apiBase = DEFAULT_API_BASE }) => {
//   const isClient = useIsClient();
//   const { sweepers, attendanceEntries, loading } = useAttendanceData(apiBase, 1);
//   const chartRef = useRef(null);

//   if (!isClient || loading) return <div className="h-52 p-6 text-center text-gray-500">Loading pie...</div>;

//   let verified = 0;
//   let pending = 0;
//   if (propVerified !== null && propPending !== null) {
//     verified = propVerified;
//     pending = propPending;
//   } else {
//     const todayKey = dateKey(moment().startOf("day"));
//     const presentSet = new Set();
//     attendanceEntries.forEach((entry) => {
//       const key = dateKey(moment(entry.date).utc().startOf("day"));
//       if (key === todayKey) presentSet.add(entry.sweeperId || entry.sweeper || entry.sweeperId);
//     });
//     verified = presentSet.size;
//     pending = Math.max(0, (sweepers.length || 0) - verified);
//   }

//   const data = {
//     labels: ["Present", "Absent/Pending"],
//     datasets: [
//       { data: [verified, pending], backgroundColor: ["#4caf50cc", "#ff9800cc"], borderColor: ["#4caf50", "#ff9800"], borderWidth: 1 },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { position: "bottom" },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             const label = context.label || "";
//             const value = context.raw || 0;
//             const total = verified + pending || 1;
//             const percentage = ((value / total) * 100).toFixed(1);
//             return `${label}: ${value} (${percentage}%)`;
//           },
//         },
//       },
//     },
//   };

//   return (
//     <div className="h-52">
//       <Pie ref={chartRef} data={data} options={options} />
//     </div>
//   );
// };

// /* TIME DISTRIBUTION */
// export const TimeDistributionChart = ({ apiBase = DEFAULT_API_BASE, days = 7 }) => {
//   const isClient = useIsClient();
//   const { attendanceEntries, loading } = useAttendanceData(apiBase, days);
//   const chartRef = useRef(null);

//   if (!isClient || loading) return <div className="h-64 p-6 text-center text-gray-500">Loading time distribution...</div>;

//   const buckets = { before9: 0, nineTo12: 0, twelveTo15: 0, after15: 0 };

//   attendanceEntries.forEach((entry) => {
//     const m = moment(entry.date);
//     if (!m.isValid()) return;
//     const hour = m.hour();
//     if (hour < 9) buckets.before9 += 1;
//     else if (hour < 12) buckets.nineTo12 += 1;
//     else if (hour < 15) buckets.twelveTo15 += 1;
//     else buckets.after15 += 1;
//   });

//   const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;

//   const data = {
//     labels: ["Before 9 AM", "9 AM - 12 PM", "12 PM - 3 PM", "After 3 PM"],
//     datasets: [
//       { data: [buckets.before9, buckets.nineTo12, buckets.twelveTo15, buckets.after15], backgroundColor: ["#4caf50cc", "#1976d2cc", "#03a9f4cc", "#ff9800cc"], borderColor: ["#4caf50", "#1976d2", "#03a9f4", "#ff9800"], borderWidth: 1 },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { position: "right" },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             const label = context.label || "";
//             const value = context.raw || 0;
//             const percentage = ((value / total) * 100).toFixed(1);
//             return `${label}: ${value} (${percentage}%)`;
//           },
//         },
//       },
//     },
//     cutout: "50%",
//   };

//   return (
//     <div className="h-64">
//       <Doughnut ref={chartRef} data={data} options={options} />
//     </div>
//   );
// };

// export default {
//   WeeklyAttendanceChart,
//   ZoneAttendanceChart,
//   AttendancePieChart,
//   TimeDistributionChart,
// };

import React, { useRef, useEffect, useState } from "react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import moment from "moment";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// const DEFAULT_API_BASE = "https://smc-backend-bjm5.onrender.com";
const DEFAULT_API_BASE = " http://localhost:3000";

/* Utility helpers */
function lastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = moment().subtract(i, "days").startOf("day");
    dates.push(d);
  }
  return dates;
}

function dateKey(m) {
  return m.format("YYYY-MM-DD");
}

async function fetchSweepers(apiBase) {
  const res = await fetch(`${apiBase}/sweepers`);
  if (!res.ok) throw new Error("Failed to fetch sweepers");
  const json = await res.json();
  return Array.isArray(json.sweepers) ? json.sweepers : [];
}

async function fetchAttendanceForRange(apiBase, sweeperIds, from, to) {
  const promises = sweeperIds.map((id) =>
    fetch(`${apiBase}/sweepers/${id}/attendance?from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
      .then((j) => (Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []))
      .then((arr) => arr.map((e) => ({ ...e, sweeperId: id })))
      .catch(() => [])
  );
  const results = await Promise.all(promises);
  return results.flat();
}

/* Hook to fetch sweepers and attendance entries and listen for realtime updates */
function useAttendanceDataRealtime(apiBase = DEFAULT_API_BASE, days = 7) {
  const [sweepers, setSweepers] = useState([]);
  const [attendanceEntries, setAttendanceEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let socket;

    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const sw = await fetchSweepers(apiBase);
        if (!mounted) return;
        setSweepers(sw);

        if (sw.length === 0) {
          setAttendanceEntries([]);
          setLoading(false);
          return;
        }

        const dates = lastNDates(days);
        const from = dateKey(dates[0]);
        const to = dateKey(dates[dates.length - 1]);
        const sweeperIds = sw.map((s) => s._id || s.id);
        const entries = await fetchAttendanceForRange(apiBase, sweeperIds, from, to);
        if (!mounted) return;
        setAttendanceEntries(entries);

        // Debug logs so you can inspect data in the browser console
        // (remove or reduce verbosity in production)
        console.debug("[AttendanceCharts2] fetched sweepers:", sw.length, "attendance entries:", entries.length);
      } catch (err) {
        if (!mounted) return;
        console.error("[AttendanceCharts2] fetch error:", err);
        setError(err.message || "Error fetching attendance data");
        setAttendanceEntries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    // Socket setup for realtime updates (safe base, trimmed)
    try {
      const rawBase = apiBase || "";
      const safeBase = (typeof rawBase === "string" ? rawBase.trim() : "") || window.location.origin;
      socket = io(safeBase, { transports: ["websocket", "polling"] });
      socketRef.current = socket;
      console.debug("[AttendanceCharts2] connecting socket to", safeBase);

      const onAnyUpdate = async () => {
        // lightweight: re-fetch aggregated data on updates
        await fetchAll();
      };

      socket.on("connect", () => console.debug("[AttendanceCharts2] socket connected", socket.id));
      socket.on("disconnect", (reason) => console.debug("[AttendanceCharts2] socket disconnected", reason));

      socket.on("sweeper:added", onAnyUpdate);
      socket.on("sweeper:deleted", onAnyUpdate);
      socket.on("sweeper:updated", onAnyUpdate);
      socket.on("sweeper:duty-time-updated", onAnyUpdate);
      socket.on("attendance:marked", onAnyUpdate);
    } catch (err) {
      console.warn("[AttendanceCharts2] Socket connect failed:", err && err.message ? err.message : err);
    }

    return () => {
      mounted = false;
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch {}
    };
  }, [apiBase, days]);

  return { sweepers, attendanceEntries, loading, error };
}

/* Render guard: only render charts on client after mount to avoid Chart.js DOM errors */
function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

/* Helper to build a short key from datasets (avoids big strings) */
function buildChartKey(datasets) {
  return datasets.map((d) => (Array.isArray(d.data) ? d.data.join(",") : String(d.data))).join("|");
}

/* WEEKLY CHART */
// export const WeeklyAttendanceChart = ({ data: propData = null, apiBase = DEFAULT_API_BASE, days = 7 }) => {
//   const isClient = useIsClient();
//   const { sweepers, attendanceEntries, loading } = useAttendanceDataRealtime(apiBase, days);
//   const chartRef = useRef(null);

//   const dates = lastNDates(days);
//   const labels = dates.map((d) => d.format("DD MMM")).reverse();

//   const countsMap = {};
//   dates.forEach((d) => {
//     countsMap[dateKey(d)] = { verified: 0, pending: 0, total: sweepers.length };
//   });

//   if (!propData) {
//     attendanceEntries.forEach((entry) => {
//       const entryDate = moment(entry.date).utc().startOf("day");
//       const key = dateKey(entryDate);
//       if (countsMap[key]) countsMap[key].verified = (countsMap[key].verified || 0) + 1;
//     });
//     Object.keys(countsMap).forEach((k) => {
//       countsMap[k].pending = Math.max(0, (countsMap[k].total || 0) - (countsMap[k].verified || 0));
//     });
//   }

//   const presentArray = propData ? propData.map((it) => it.verified).reverse() : Object.values(countsMap).map((v) => v.verified).reverse();
//   const pendingArray = propData ? propData.map((it) => it.pending).reverse() : Object.values(countsMap).map((v) => v.pending).reverse();
//   const totalArray = propData ? propData.map((it) => it.total).reverse() : Object.values(countsMap).map((v) => v.total).reverse();

//   const chartData = {
//     labels,
//     datasets: [
//       {
//         label: "Present",
//         data: presentArray,
//         backgroundColor: "#4caf50",
//         borderColor: "#4caf50",
//         borderWidth: 2,
//         tension: 0.4,
//         fill: false,
//       },
//       {
//         label: "Absent/Pending",
//         data: pendingArray,
//         backgroundColor: "#ff9800",
//         borderColor: "#ff9800",
//         borderWidth: 2,
//         tension: 0.4,
//         fill: false,
//       },
//       {
//         label: "Total Staff",
//         data: totalArray,
//         backgroundColor: "#1976d233",
//         borderColor: "#1976d2",
//         borderWidth: 1,
//         tension: 0.4,
//         fill: true,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     scales: {
//       y: { beginAtZero: true, suggestedMax: Math.max(10, sweepers.length), title: { display: true, text: "Number of Staff" } },
//       x: { title: { display: true, text: "Date" } },
//     },
//     interaction: { mode: "index", intersect: false },
//     plugins: { tooltip: { enabled: true }, legend: { position: "top" } },
//   };

//   if (!isClient || loading) {
//     return <div className="h-64 p-6 text-center text-gray-500">Loading chart...</div>;
//   }

//   // key helps the chart remount when dataset values change shape
//   const chartKey = buildChartKey(chartData.datasets);

//   return (
//     <div className="h-64">
//       <Line key={chartKey} ref={chartRef} data={chartData} options={options} />
//     </div>
//   );
// };

/* ZONE CHART */
// export const ZoneAttendanceChart = ({ apiBase = DEFAULT_API_BASE }) => {
//   const isClient = useIsClient();
//   const { sweepers, attendanceEntries, loading } = useAttendanceDataRealtime(apiBase, 1);
//   const chartRef = useRef(null);

//   if (!isClient || loading) return <div className="h-64 p-6 text-center text-gray-500">Loading zone chart...</div>;

//   const zoneMap = {};
//   sweepers.forEach((s) => {
//     const z = s.zone || "Unknown";
//     if (!zoneMap[z]) zoneMap[z] = { total: 0, present: 0 };
//     zoneMap[z].total += 1;
//   });

//   const todayKey = dateKey(moment().startOf("day"));
//   const presentSet = new Set();
//   attendanceEntries.forEach((entry) => {
//     const key = dateKey(moment(entry.date).utc().startOf("day"));
//     if (key === todayKey) presentSet.add(entry.sweeperId || entry.sweeper || entry.sweeperId);
//   });

//   sweepers.forEach((s) => {
//     const z = s.zone || "Unknown";
//     if (presentSet.has(s._id || s.id)) zoneMap[z].present += 1;
//   });

//   const labels = Object.keys(zoneMap);
//   const presentData = labels.map((z) => zoneMap[z].present);
//   const pendingData = labels.map((z) => Math.max(0, zoneMap[z].total - zoneMap[z].present));

//   const data = {
//     labels,
//     datasets: [
//       { label: "Present", data: presentData, backgroundColor: "#4caf50cc", borderColor: "#4caf50", borderWidth: 1 },
//       { label: "Absent/Pending", data: pendingData, backgroundColor: "#ff9800cc", borderColor: "#ff9800", borderWidth: 1 },
//     ],
//   };

//   const options = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: "top" } } };

//   // key to force re-render when data changes
//   const key = presentData.join(",") + "|" + pendingData.join(",");

//   return (
//     <div className="h-64">
//       <Bar key={key} ref={chartRef} data={data} options={options} />
//     </div>
//   );
// };

/* PIE CHART */
export const AttendancePieChart = ({ verified: propVerified = null, pending: propPending = null, apiBase = DEFAULT_API_BASE }) => {
  const isClient = useIsClient();
  const { sweepers, attendanceEntries, loading } = useAttendanceDataRealtime(apiBase, 1);
  const chartRef = useRef(null);

  if (!isClient || loading) return <div className="h-52 p-6 text-center text-gray-500">Loading pie...</div>;

  let verified = 0;
  let pending = 0;
  if (propVerified !== null && propPending !== null) {
    verified = propVerified;
    pending = propPending;
  } else {
    const todayKey = dateKey(moment().startOf("day"));
    const presentSet = new Set();
    attendanceEntries.forEach((entry) => {
      const key = dateKey(moment(entry.date).utc().startOf("day"));
      if (key === todayKey) presentSet.add(entry.sweeperId || entry.sweeper || entry.sweeperId);
    });
    verified = presentSet.size;
    pending = Math.max(0, (sweepers.length || 0) - verified);
  }

  const data = {
    labels: ["Present", "Absent/Pending"],
    datasets: [
      { data: [verified, pending], backgroundColor: ["#4caf50cc", "#ff9800cc"], borderColor: ["#4caf50", "#ff9800"], borderWidth: 1 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = verified + pending || 1;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const key = `${verified}-${pending}`;

  return (
    <div className="h-52">
      <Pie key={key} ref={chartRef} data={data} options={options} />
    </div>
  );
};

/* TIME DISTRIBUTION */
// export const TimeDistributionChart = ({ apiBase = DEFAULT_API_BASE, days = 7 }) => {
//   const isClient = useIsClient();
//   const { attendanceEntries, loading } = useAttendanceDataRealtime(apiBase, days);
//   const chartRef = useRef(null);

//   if (!isClient || loading) return <div className="h-64 p-6 text-center text-gray-500">Loading time distribution...</div>;

//   const buckets = { before9: 0, nineTo12: 0, twelveTo15: 0, after15: 0 };

//   attendanceEntries.forEach((entry) => {
//     const m = moment(entry.date);
//     if (!m.isValid()) return;
//     const hour = m.hour();
//     if (hour < 9) buckets.before9 += 1;
//     else if (hour < 12) buckets.nineTo12 += 1;
//     else if (hour < 15) buckets.twelveTo15 += 1;
//     else buckets.after15 += 1;
//   });

//   const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;

//   const data = {
//     labels: ["Before 9 AM", "9 AM - 12 PM", "12 PM - 3 PM", "After 3 PM"],
//     datasets: [
//       { data: [buckets.before9, buckets.nineTo12, buckets.twelveTo15, buckets.after15], backgroundColor: ["#4caf50cc", "#1976d2cc", "#03a9f4cc", "#ff9800cc"], borderColor: ["#4caf50", "#1976d2", "#03a9f4", "#ff9800"], borderWidth: 1 },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { position: "right" },
//       tooltip: {
//         callbacks: {
//           label: function (context) {
//             const label = context.label || "";
//             const value = context.raw || 0;
//             const percentage = ((value / total) * 100).toFixed(1);
//             return `${label}: ${value} (${percentage}%)`;
//           },
//         },
//       },
//     },
//     cutout: "50%",
//   };

//   const key = Object.values(buckets).join(",");

//   return (
//     <div className="h-64">
//       <Doughnut key={key} ref={chartRef} data={data} options={options} />
//     </div>
//   );
// };

export default {
  // WeeklyAttendanceChart,
  // ZoneAttendanceChart,
  AttendancePieChart,
  // TimeDistributionChart,
};
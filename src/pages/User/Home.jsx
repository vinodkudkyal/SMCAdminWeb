import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import { FaSearch, FaCalendarAlt, FaTimes } from "react-icons/fa";

/**
 * HomePage.jsx
 * - UI preserved from your original Home component
 * - Adds a compact read-only Sweeper list + search + zone filter
 * - Computes 7-day attendance aggregates (uses same approach as SweeperList)
 * - Opens a read-only detail modal to view attendance records for a sweeper
 *
 * Notes:
 * - API_BASE defaults to window.__API_BASE or http://localhost:3000
 * - This file is intentionally read-only: no create/update/delete actions
 */

const API_BASE = (typeof window !== "undefined" && window.__API_BASE) || "http://localhost:3000";

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="text-3xl text-primary/90">{icon}</div>
    </div>
  </div>
);

const Home = () => {
  // list & filters
  const [sweepers, setSweepers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [zones, setZones] = useState([]);

  // attendance derived
  const [weeklyData, setWeeklyData] = useState([]);
  const [todaySummary, setTodaySummary] = useState({ total: 0, verified: 0, pending: 0 });

  // loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // detail modal
  const [detailSweeper, setDetailSweeper] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFrom, setAttendanceFrom] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
  const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));

  const socketRef = useRef(null);

  const lastNDates = (n) => {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
      arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
    }
    return arr;
  };

  // Fetch sweepers and attendance aggregates (7-day window)
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/sweepers`);
      if (!res.ok) throw new Error("Failed to fetch sweepers");
      const json = await res.json();
      const sw = Array.isArray(json.sweepers) ? json.sweepers : [];

      // derive zones
      const z = Array.from(new Set(sw.map((s) => s.zone).filter(Boolean)));
      setZones(z);

      // prepare 7-day attendance aggregates like SweeperList
      const days = 7;
      const dates = lastNDates(days);
      const countsMap = {};
      dates.forEach((d) => (countsMap[d] = { verified: 0, total: sw.length, pending: 0 }));

      if (sw.length === 0) {
        setSweepers([]);
        setWeeklyData(dates.map((d) => ({ date: d, verified: 0, pending: 0, total: 0 })));
        setTodaySummary({ total: 0, verified: 0, pending: 0 });
        setLoading(false);
        return;
      }

      const from = dates[0];
      const to = dates[dates.length - 1];

      // fetch attendance for each sweeper in parallel (same approach as SweeperList)
      const attendancePromises = sw.map((s) =>
        fetch(`${API_BASE}/sweepers/${s._id || s.id}/attendance?from=${from}&to=${to}`)
          .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
          .then((j) => (Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []))
          .catch(() => [])
      );

      const allResults = await Promise.all(attendancePromises);

      // build presentByDate set
      const presentByDateAndSweeper = {};
      dates.forEach((d) => (presentByDateAndSweeper[d] = new Set()));
      allResults.forEach((entries, idx) => {
        const sweeper = sw[idx];
        const sweeperId = String(sweeper._id || sweeper.id);
        entries.forEach((entry) => {
          const key = moment(entry.date).utc().startOf("day").format("YYYY-MM-DD");
          if (presentByDateAndSweeper[key]) presentByDateAndSweeper[key].add(sweeperId);
        });
      });

      dates.forEach((d) => {
        const presentSet = presentByDateAndSweeper[d] || new Set();
        countsMap[d].verified = presentSet.size;
        countsMap[d].pending = Math.max(0, countsMap[d].total - countsMap[d].verified);
      });

      const computedWeekly = dates.map((d) => ({
        date: d,
        verified: countsMap[d].verified,
        pending: countsMap[d].pending,
        total: countsMap[d].total,
      }));

      const todayKey = dates[dates.length - 1];
      const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

      const augmentedSweepers = sw.map((s) => {
        const id = String(s._id || s.id);
        return { ...s, hasToday: todayPresentSet.has(id) };
      });

      setSweepers(augmentedSweepers);
      setWeeklyData(computedWeekly);
      setTodaySummary({
        total: computedWeekly[computedWeekly.length - 1].total,
        verified: computedWeekly[computedWeekly.length - 1].verified,
        pending: computedWeekly[computedWeekly.length - 1].pending,
      });
    } catch (err) {
      console.error("[Home] loadData error:", err);
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // optional realtime updates (safe fallback to origin)
    try {
      const base = (typeof API_BASE === "string" && API_BASE.trim()) || window.location.origin;
      const ioClient = require("socket.io-client");
      const s = ioClient(base, { transports: ["websocket", "polling"] });
      socketRef.current = s;
      const onUpdate = () => loadData();
      s.on("connect", () => console.debug("[Home] socket connected", s.id));
      s.on("sweeper:added", onUpdate);
      s.on("sweeper:deleted", onUpdate);
      s.on("sweeper:updated", onUpdate);
      s.on("attendance:marked", onUpdate);
    } catch (err) {
      // socket optional: ignore if not available
      console.debug("[Home] socket setup skipped:", err && err.message);
    }

    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = sweepers.filter((s) => {
    const nameMatch = s.name ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const zoneMatch = zoneFilter === "" || (s.zone || "") === zoneFilter;
    return nameMatch && zoneMatch;
  });

  // open detail modal and fetch attendance for the selected sweeper
  const openDetail = async (s) => {
    setDetailSweeper(s);
    setShowDetailModal(true);
    setAttendanceRecords([]);
    setAttendanceLoading(true);
    try {
      const id = s._id || s.id;
      const url = new URL(`${API_BASE}/sweepers/${id}/attendance`);
      if (attendanceFrom) url.searchParams.append("from", attendanceFrom);
      if (attendanceTo) url.searchParams.append("to", attendanceTo);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const json = await res.json();
      const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceRecords(records);
    } catch (err) {
      console.error("[Home] fetchAttendanceForSweeper error:", err);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setDetailSweeper(null);
    setAttendanceRecords([]);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-sky-50 to-sky-100 border border-white/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Welcome back!</h1>
            <p className="mt-1 text-slate-700 max-w-xl">
              This is your dashboard — streamlined and refreshed with a calm light-blue theme.
              Quick access to your profile, recent activity and available actions are below.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="hidden md:flex flex-col items-end justify-center">
              <p className="text-sm text-slate-600">Account</p>
              <p className="text-lg font-semibold text-slate-900">Standard User</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-white/40 flex items-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-bold">U</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Tasks Today" value="8" icon="🗂️" />
        <StatCard title="Total Sweepers" value={todaySummary.total ?? 0} icon="👥" />
        <StatCard title="Present Today" value={todaySummary.verified ?? 0} icon="✅" />
      </div>

      {/* Sweepers list + filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-white/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 w-full md:w-1/2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FaSearch /></div>
              <input
                type="text"
                placeholder="Search sweepers by name or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="">All Zones</option>
                {zones.map((z) => (
                  <option value={z} key={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500 hidden md:block">Showing {filtered.length} results</div>
            <button
              type="button"
              onClick={() => loadData()}
              className="px-3 py-2 rounded-lg bg-white/90 border border-white/40 shadow hover:shadow-md"
              title="Refresh"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading sweepers...</div>
          ) : error ? (
            <div className="p-6 text-center text-rose-600">Error: {error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No sweepers found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sky-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Today's</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s._id || s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-primary cursor-pointer" onClick={() => openDetail(s)}>{s.name || "—"}</div>
                      <div className="text-xs text-slate-500">{s.email || ""}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">{s.zone || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {s.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${s.hasToday ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {s.hasToday ? "Present" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetail(s)}
                        className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Actions (kept) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-white/30">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Recent Activity</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 text-lg">🛈</div>
                <div>
                  <p className="text-sm text-slate-700">You updated your profile.</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 text-lg">📄</div>
                <div>
                  <p className="text-sm text-slate-700">Report "Weekly Summary" is ready.</p>
                  <p className="text-xs text-slate-500">1 day ago</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-white/30">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">Start Task</button>
              <button className="px-4 py-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">Request Support</button>
              <button className="px-4 py-2 rounded-lg bg-primary text-white">New Request</button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-white/30">
            <h4 className="text-sm font-medium text-slate-800 mb-2">Profile Summary</h4>
            <p className="text-sm text-slate-600">Name: Jane Doe</p>
            <p className="text-sm text-slate-600">Role: User</p>
            <p className="text-sm text-slate-600">Member since: Jan 2024</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-white/30">
            <h4 className="text-sm font-medium text-slate-800 mb-2">Tips</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>Customize your profile for better recommendations.</li>
              <li>Check notifications regularly for updates.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Detail modal */}
      {showDetailModal && detailSweeper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{detailSweeper.name}</h3>
                <div className="text-sm text-slate-600">{detailSweeper.email}</div>
                <div className="text-sm text-slate-600 mt-1">Zone: {detailSweeper.zone || "—"}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-slate-100"
                  onClick={() => closeDetail()}
                  aria-label="Close details"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Attendance Records</h4>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <label className="text-sm text-slate-600">From</label>
                <input type="date" className="border p-2 rounded" value={attendanceFrom} onChange={(e) => setAttendanceFrom(e.target.value)} />
                <label className="text-sm text-slate-600">To</label>
                <input type="date" className="border p-2 rounded" value={attendanceTo} onChange={(e) => setAttendanceTo(e.target.value)} />
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-100"
                  onClick={() => openDetail(detailSweeper)}
                >
                  <FaCalendarAlt className="mr-2 inline" /> Refresh
                </button>
              </div>

              {attendanceLoading ? (
                <div className="text-sm text-slate-500">Loading attendance...</div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-sm text-slate-500">No attendance records found for this range.</div>
              ) : (
                <div className="overflow-x-auto max-h-72">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Latitude</th>
                        <th className="px-3 py-2 text-left">Longitude</th>
                        <th className="px-3 py-2 text-left">Recorded At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((a) => (
                        <tr key={a._id || a.id || `${a.date}-${a.sweeperId}`}>
                          <td className="px-3 py-2">{moment(a.date).format("YYYY-MM-DD")}</td>
                          <td className="px-3 py-2">{moment(a.date).format("HH:mm:ss")}</td>
                          <td className="px-3 py-2">{a.location?.latitude ?? "-"}</td>
                          <td className="px-3 py-2">{a.location?.longitude ?? "-"}</td>
                          <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => closeDetail()} className="px-4 py-2 rounded-lg bg-slate-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
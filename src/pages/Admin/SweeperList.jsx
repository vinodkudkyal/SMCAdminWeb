// import React, { useState, useEffect, useRef } from "react";
// import moment from "moment";
// import Card from "../../components/common/Card";
// import Badge from "../../components/common/Badge";
// import Button from "../../components/common/Button";
// import { FaSearch, FaRoute, FaMapMarkerAlt, FaUserPlus, FaClock, FaTrash, FaSync } from "react-icons/fa";
// import {
//   WeeklyAttendanceChart,
//   AttendancePieChart,
//   ZoneAttendanceChart,
//   TimeDistributionChart,
// } from "../../components/charts/AttendanceCharts";
// import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";

// const SweeperList = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterZone, setFilterZone] = useState("");
//   const [sweepers, setSweepers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // attendance derived state
//   const [weeklyData, setWeeklyData] = useState([]);
//   const [todaySummary, setTodaySummary] = useState({ total: 0, verified: 0, pending: 0 });

//   // Add Sweeper modal & form state
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addName, setAddName] = useState("");
//   const [addEmail, setAddEmail] = useState("");
//   const [addPassword, setAddPassword] = useState("");
//   const [addZone, setAddZone] = useState("");
//   const [addStatus, setAddStatus] = useState("active");
//   const [adding, setAdding] = useState(false);
//   const [addError, setAddError] = useState("");

//   // duty modal states
//   const [showDutyModal, setShowDutyModal] = useState(false);
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [dutyStart, setDutyStart] = useState("");
//   const [dutyEnd, setDutyEnd] = useState("");
//   const [savingDuty, setSavingDuty] = useState(false);
//   const [dutyError, setDutyError] = useState("");

//   // deletion state
//   const [deletingId, setDeletingId] = useState(null);

//   const socketRef = useRef(null);

//   // helper: last N date strings (YYYY-MM-DD)
//   const lastNDates = (n) => {
//     const arr = [];
//     for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
//     return arr;
//   };

//   const fetchSweepers = async () => {
//     const res = await fetch(`${API_BASE}/sweepers`);
//     if (!res.ok) throw new Error("Failed to fetch sweepers");
//     const json = await res.json();
//     return Array.isArray(json.sweepers) ? json.sweepers : [];
//   };

//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const sw = await fetchSweepers();

//       const days = 7;
//       const dates = lastNDates(days);
//       const countsMap = {};
//       dates.forEach((d) => (countsMap[d] = { verified: 0, total: sw.length, pending: 0 }));

//       if (sw.length === 0) {
//         setSweepers([]);
//         setWeeklyData(dates.map((d) => ({ date: d, verified: 0, pending: 0, total: 0 })));
//         setTodaySummary({ total: 0, verified: 0, pending: 0 });
//         setLoading(false);
//         return;
//       }

//       const from = dates[0];
//       const to = dates[dates.length - 1];

//       const attendancePromises = sw.map((s) =>
//         fetch(`${API_BASE}/sweepers/${s._id || s.id}/attendance?from=${from}&to=${to}`)
//           .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
//           .then((j) => (Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []))
//           .catch(() => [])
//       );
//       const allResults = await Promise.all(attendancePromises);

//       const presentByDateAndSweeper = {};
//       dates.forEach((d) => (presentByDateAndSweeper[d] = new Set()));

//       allResults.forEach((entries, idx) => {
//         const sweeper = sw[idx];
//         const sweeperId = String(sweeper._id || sweeper.id);
//         entries.forEach((entry) => {
//           const key = moment(entry.date).utc().startOf("day").format("YYYY-MM-DD");
//           if (presentByDateAndSweeper[key]) presentByDateAndSweeper[key].add(sweeperId);
//         });
//       });

//       dates.forEach((d) => {
//         const presentSet = presentByDateAndSweeper[d] || new Set();
//         countsMap[d].verified = presentSet.size;
//         countsMap[d].pending = Math.max(0, countsMap[d].total - countsMap[d].verified);
//       });

//       const computedWeekly = dates.map((d) => ({
//         date: d,
//         verified: countsMap[d].verified,
//         pending: countsMap[d].pending,
//         total: countsMap[d].total,
//       }));

//       const todayKey = dates[dates.length - 1];
//       const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

//       const augmentedSweepers = sw.map((s) => {
//         const id = String(s._id || s.id);
//         return { ...s, hasToday: todayPresentSet.has(id) };
//       });

//       setSweepers(augmentedSweepers);
//       setWeeklyData(computedWeekly);
//       setTodaySummary({
//         total: computedWeekly[computedWeekly.length - 1].total,
//         verified: computedWeekly[computedWeekly.length - 1].verified,
//         pending: computedWeekly[computedWeekly.length - 1].pending,
//       });

//       console.debug("[SweeperList] loadData complete:", augmentedSweepers.length, "sweepers, weeklyData:", computedWeekly);
//     } catch (err) {
//       console.error("[SweeperList] loadData error:", err);
//       setError(err.message || "Error loading data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();

//     // safe socket base
//     const rawBase = API_BASE || "";
//     const safeBase = (typeof rawBase === "string" ? rawBase.trim() : "") || window.location.origin;

//     let s;
//     try {
//       s = io(safeBase, { transports: ["websocket", "polling"] });
//       socketRef.current = s;
//       console.debug("[SweeperList] socket connecting to", safeBase);

//       const onUpdate = () => {
//         loadData();
//       };

//       s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
//       s.on("disconnect", (reason) => console.debug("[SweeperList] socket disconnected", reason));

//       s.on("sweeper:added", onUpdate);
//       s.on("sweeper:deleted", onUpdate);
//       s.on("sweeper:updated", onUpdate);
//       s.on("sweeper:duty-time-updated", onUpdate);
//       s.on("attendance:marked", onUpdate);
//     } catch (err) {
//       console.warn("[SweeperList] socket connect failed:", err && err.message ? err.message : err);
//     }

//     return () => {
//       try {
//         if (socketRef.current) {
//           socketRef.current.disconnect();
//           socketRef.current = null;
//         }
//       } catch {}
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // derive zones dynamically from fetched sweepers
//   const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

//   const filteredList = sweepers.filter((sweeper) => {
//     const nameMatch = sweeper.name ? sweeper.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
//     const zoneMatch = filterZone === "" || (sweeper.zone || "") === filterZone;
//     return nameMatch && zoneMatch;
//   });

//   // ----------------------------
//   // Add Sweeper handler
//   // ----------------------------
//   const handleAddSweeper = async (e) => {
//     e && e.preventDefault();
//     setAddError("");
//     if (!addName.trim() || !addEmail.trim() || !addPassword) {
//       setAddError("Name, email and password are required.");
//       return;
//     }
//     setAdding(true);
//     try {
//       const payload = {
//         name: addName.trim(),
//         email: addEmail.trim(),
//         password: addPassword,
//         zone: addZone || undefined,
//         status: addStatus || undefined,
//       };
//       const res = await fetch(`${API_BASE}/sweepers`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response from server when adding sweeper.");
//       }

//       if (!res.ok || !data?.success) {
//         throw new Error(data?.message || `Failed to add sweeper (${res.status})`);
//       }

//       // success: clear form, close modal, reload data
//       setAddName("");
//       setAddEmail("");
//       setAddPassword("");
//       setAddZone("");
//       setAddStatus("active");
//       setShowAddModal(false);
//       await loadData();
//     } catch (err) {
//       setAddError(err.message || "Error adding sweeper");
//     } finally {
//       setAdding(false);
//     }
//   };

//   // ----------------------------
//   // Duty time modal handlers
//   // ----------------------------
//   const openDutyModal = (sweeper) => {
//     setSelectedSweeper(sweeper);
//     const start = (sweeper.dutyTime && sweeper.dutyTime.start) || "";
//     const end = (sweeper.dutyTime && sweeper.dutyTime.end) || "";
//     const normalize = (val) => {
//       if (!val) return "";
//       const m = moment(val, moment.ISO_8601, true);
//       if (m.isValid()) return m.format("HH:mm");
//       // fallback assume already HH:mm
//       return String(val);
//     };
//     setDutyStart(normalize(start));
//     setDutyEnd(normalize(end));
//     setDutyError("");
//     setShowDutyModal(true);
//   };

//   const handleSaveDuty = async (e) => {
//     e && e.preventDefault();
//     if (!selectedSweeper) return;
//     setDutyError("");
//     if (!dutyStart || !dutyEnd) {
//       setDutyError("Start and end times are required.");
//       return;
//     }
//     const sMoment = moment(dutyStart, "HH:mm");
//     const eMoment = moment(dutyEnd, "HH:mm");
//     if (!sMoment.isValid() || !eMoment.isValid()) {
//       setDutyError("Invalid time format.");
//       return;
//     }
//     if (!eMoment.isAfter(sMoment)) {
//       setDutyError("End time must be after start time.");
//       return;
//     }

//     setSavingDuty(true);
//     try {
//       const payload = { start: dutyStart, end: dutyEnd };
//       const res = await fetch(`${API_BASE}/sweepers/${selectedSweeper._id || selectedSweeper.id}/duty-time`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response from server when saving duty time.");
//       }

//       if (!res.ok || !data?.success) {
//         throw new Error(data?.message || `Failed to save duty time (${res.status})`);
//       }

//       // success - refresh data and close modal
//       setShowDutyModal(false);
//       setSelectedSweeper(null);
//       await loadData();
//     } catch (err) {
//       setDutyError(err.message || "Error saving duty time");
//     } finally {
//       setSavingDuty(false);
//     }
//   };

//   // ----------------------------
//   // Delete sweeper handler
//   // ----------------------------
//   const handleDeleteSweeper = async (sweeper) => {
//     if (!sweeper) return;
//     const id = sweeper._id || sweeper.id;
//     const confirm = window.confirm(`Delete sweeper "${sweeper.name}"? This will remove the sweeper and associated data.`);

//     if (!confirm) return;

//     setDeletingId(id);
//     try {
//       const res = await fetch(`${API_BASE}/sweepers/${id}`, {
//         method: "DELETE",
//       });

//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         // ignore JSON parse error
//       }

//       if (!res.ok) {
//         // If backend returns JSON with message use it
//         const msg = data?.message || `Failed to delete sweeper (${res.status})`;
//         throw new Error(msg);
//       }

//       // success
//       // reload list and show a simple notification
//       await loadData();
//       window.alert(`Sweeper "${sweeper.name}" deleted successfully.`);
//     } catch (err) {
//       console.error("Error deleting sweeper:", err);
//       window.alert(`Failed to delete sweeper: ${err.message || err}`);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-heading font-semibold mb-6">Sweeper List</h1>

//       <Card>
//         {/* toolbar (search, zone filter, add) */}
//         <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
//           <div className="flex flex-wrap items-center gap-4">
//             <div className="relative w-64">
//               <input
//                 type="text"
//                 placeholder="Search sweepers..."
//                 className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>

//             <select
//               className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//               value={filterZone}
//               onChange={(e) => setFilterZone(e.target.value)}
//             >
//               <option value="">All Zones</option>
//               {zones.map((z) => (
//                 <option value={z} key={z}>
//                   {z}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center gap-3">
//             <Button color="black" onClick={() => setShowAddModal(true)}>
//               <FaUserPlus className="mr-2" /> Add New Sweeper
//             </Button>
//             <Button variant="outline" color="secondary" onClick={() => loadData()}><FaSync /></Button>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           {loading ? (
//             <div className="p-6 text-center text-gray-500">Loading sweepers...</div>
//           ) : error ? (
//             <div className="p-6 text-center text-red-600">Error: {error}</div>
//           ) : filteredList.length === 0 ? (
//             <div className="p-6 text-center text-gray-500">No sweepers found.</div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Attendance</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifications</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
//                   return (
//                     <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="font-medium">{sweeper.name || "—"}</div>
//                         <div className="text-xs text-gray-500">{sweeper.email || ""}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sweeper.zone || "—"}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant={(sweeper.status === "active" && "success") || "warning"} className="capitalize">
//                           {sweeper.status || "unknown"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {sweeper.dutyTime && (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
//                           <div className="text-sm">
//                             <div>{sweeper.dutyTime.start || "—"} - {sweeper.dutyTime.end || "—"}</div>
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-500">Not set</div>
//                         )}
//                         <div className="mt-2">
//                           <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
//                             <FaClock className="mr-2" /> Duty Time
//                           </Button>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant={sweeper.hasToday ? "success" : "danger"} className="capitalize">
//                           {sweeper.hasToday ? "present" : "pending"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         <div className="flex items-center">
//                           <div className="w-24 bg-gray-200 rounded-full h-1.5 mr-2">
//                             <div
//                               className="bg-primary h-1.5 rounded-full"
//                               style={{ width: `${((sweeper.verifications || 0) / 5) * 100}%` }}
//                             ></div>
//                           </div>
//                           <span>{sweeper.verifications ?? 0}/5</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button size="sm" color="black" iconOnly title="Assign Route">
//                             <FaRoute />
//                           </Button>
//                           <Button size="sm" color="black" iconOnly title="Track Location">
//                             <FaMapMarkerAlt />
//                           </Button>
//                           <Button
//                             size="sm"
//                             color="black"
//                             iconOnly
//                             title="Delete Sweeper"
//                             onClick={() => handleDeleteSweeper(sweeper)}
//                             disabled={isDeleting}
//                           >
//                             <FaTrash />
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </Card>

//       <Card className="mt-8">
//         <h2 className="text-lg font-medium mb-6">Attendance Overview</h2>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           <div className="bg-gray-50 rounded-lg p-6 flex flex-col justify-center">
//             <h3 className="text-sm font-medium text-gray-500 mb-4">Today's Summary</h3>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span>Total Staff:</span>
//                 <span className="font-semibold">{todaySummary.total}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Present:</span>
//                 <span className="font-semibold text-success">{todaySummary.verified}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Absent/Pending:</span>
//                 <span className="font-semibold text-warning">{todaySummary.pending}</span>
//               </div>
//               <div className="border-t pt-2 mt-2">
//                 <div className="flex justify-between">
//                   <span>Attendance Rate:</span>
//                   <span className="font-semibold text-primary">
//                     {todaySummary.total > 0 ? (((todaySummary.verified / todaySummary.total) * 100).toFixed(1) + "%") : "—"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gray-50 rounded-lg p-6">
//             <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Attendance</h3>
//             <AttendancePieChart verified={todaySummary.verified} pending={todaySummary.pending} apiBase={API_BASE} />
//           </div>
//         </div>

//         <div className="mb-8">
//           <h3 className="text-sm font-medium text-gray-500 mb-4">Weekly Attendance Trends</h3>
//           <div className="h-64">
//             <WeeklyAttendanceChart data={weeklyData} apiBase={API_BASE} />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-sm font-medium text-gray-500 mb-4">Zone-wise Attendance</h3>
//             <ZoneAttendanceChart apiBase={API_BASE} />
//           </div>

//           <div>
//             <h3 className="text-sm font-medium text-gray-500 mb-4">Verification Time Distribution</h3>
//             <TimeDistributionChart apiBase={API_BASE} />
//           </div>
//         </div>
//       </Card>

//       {/* Add Sweeper Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h3 className="text-lg font-semibold mb-4">Add New Sweeper</h3>

//             <form onSubmit={handleAddSweeper} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Name</label>
//                 <input value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Email</label>
//                 <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Password</label>
//                 <input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} type="password" className="mt-1 block w-full border rounded px-3 py-2" required />
//                 <p className="text-xs text-gray-500 mt-1">Passwords may be stored as-is depending on backend. Consider hashing in backend.</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Zone</label>
//                 <input value={addZone} onChange={(e) => setAddZone(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Status</label>
//                 <select value={addStatus} onChange={(e) => setAddStatus(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
//                   <option value="active">active</option>
//                   <option value="inactive">inactive</option>
//                 </select>
//               </div>

//               {addError && <div className="text-sm text-red-600">{addError}</div>}

//               <div className="flex justify-end gap-2">
//                 <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowAddModal(false)} disabled={adding}>
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={adding}>
//                   {adding ? "Adding..." : "Add Sweeper"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Duty Time Modal */}
//       {showDutyModal && selectedSweeper && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h3 className="text-lg font-semibold mb-4">Assign Duty Time - {selectedSweeper.name}</h3>

//             <form onSubmit={handleSaveDuty} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Start Time</label>
//                 <input
//                   value={dutyStart}
//                   onChange={(e) => setDutyStart(e.target.value)}
//                   type="time"
//                   className="mt-1 block w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">End Time</label>
//                 <input
//                   value={dutyEnd}
//                   onChange={(e) => setDutyEnd(e.target.value)}
//                   type="time"
//                   className="mt-1 block w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>

//               {dutyError && <div className="text-sm text-red-600">{dutyError}</div>}

//               <div className="flex justify-end gap-2">
//                 <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowDutyModal(false)} disabled={savingDuty}>
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={savingDuty}>
//                   {savingDuty ? "Saving..." : "Save Duty Time"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SweeperList;


// import React, { useState, useEffect, useRef } from "react";
// import moment from "moment";
// import Card from "../../components/common/Card";
// import Badge from "../../components/common/Badge";
// import Button from "../../components/common/Button";
// import {
//   FaSearch,
//   FaRoute,
//   FaMapMarkerAlt,
//   FaUserPlus,
//   FaClock,
//   FaTrash,
//   FaSync,
// } from "react-icons/fa";
// import {
//   WeeklyAttendanceChart,
//   AttendancePieChart,
//   ZoneAttendanceChart,
//   TimeDistributionChart,
// } from "../../components/charts/AttendanceCharts";
// import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";

// const SweeperList = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterZone, setFilterZone] = useState("");
//   const [sweepers, setSweepers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // attendance derived state for dashboard overview
//   const [weeklyData, setWeeklyData] = useState([]);
//   const [todaySummary, setTodaySummary] = useState({ total: 0, verified: 0, pending: 0 });

//   // modals & forms states
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addName, setAddName] = useState("");
//   const [addEmail, setAddEmail] = useState("");
//   const [addPassword, setAddPassword] = useState("");
//   const [addZone, setAddZone] = useState("");
//   const [addStatus, setAddStatus] = useState("active");
//   const [adding, setAdding] = useState(false);
//   const [addError, setAddError] = useState("");

//   // duty modal
//   const [showDutyModal, setShowDutyModal] = useState(false);
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [dutyStart, setDutyStart] = useState("");
//   const [dutyEnd, setDutyEnd] = useState("");
//   const [savingDuty, setSavingDuty] = useState(false);
//   const [dutyError, setDutyError] = useState("");

//   // delete state
//   const [deletingId, setDeletingId] = useState(null);

//   // Sweeper detail & attendance modal
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [detailSweeper, setDetailSweeper] = useState(null);
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [attendanceLoading, setAttendanceLoading] = useState(false);
//   const [attendanceFrom, setAttendanceFrom] = useState(
//     moment().subtract(7, "days").format("YYYY-MM-DD")
//   );
//   const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));
//   const socketRef = useRef(null);

//   // Helpers
//   const lastNDates = (n) => {
//     const arr = [];
//     for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
//     return arr;
//   };

//   // Fetch sweepers
//   const fetchSweepers = async () => {
//     const res = await fetch(`${API_BASE}/sweepers`);
//     if (!res.ok) throw new Error("Failed to fetch sweepers");
//     const json = await res.json();
//     return Array.isArray(json.sweepers) ? json.sweepers : [];
//   };

//   // Load data & attendance aggregates
//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const sw = await fetchSweepers();

//       const days = 7;
//       const dates = lastNDates(days);
//       const countsMap = {};
//       dates.forEach((d) => (countsMap[d] = { verified: 0, total: sw.length, pending: 0 }));

//       if (sw.length === 0) {
//         setSweepers([]);
//         setWeeklyData(dates.map((d) => ({ date: d, verified: 0, pending: 0, total: 0 })));
//         setTodaySummary({ total: 0, verified: 0, pending: 0 });
//         setLoading(false);
//         return;
//       }

//       const from = dates[0];
//       const to = dates[dates.length - 1];

//       const attendancePromises = sw.map((s) =>
//         fetch(`${API_BASE}/sweepers/${s._id || s.id}/attendance?from=${from}&to=${to}`)
//           .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
//           .then((j) => (Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []))
//           .catch(() => [])
//       );
//       const allResults = await Promise.all(attendancePromises);

//       const presentByDateAndSweeper = {};
//       dates.forEach((d) => (presentByDateAndSweeper[d] = new Set()));

//       allResults.forEach((entries, idx) => {
//         const sweeper = sw[idx];
//         const sweeperId = String(sweeper._id || sweeper.id);
//         entries.forEach((entry) => {
//           const key = moment(entry.date).utc().startOf("day").format("YYYY-MM-DD");
//           if (presentByDateAndSweeper[key]) presentByDateAndSweeper[key].add(sweeperId);
//         });
//       });

//       dates.forEach((d) => {
//         const presentSet = presentByDateAndSweeper[d] || new Set();
//         countsMap[d].verified = presentSet.size;
//         countsMap[d].pending = Math.max(0, countsMap[d].total - countsMap[d].verified);
//       });

//       const computedWeekly = dates.map((d) => ({
//         date: d,
//         verified: countsMap[d].verified,
//         pending: countsMap[d].pending,
//         total: countsMap[d].total,
//       }));

//       const todayKey = dates[dates.length - 1];
//       const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

//       const augmentedSweepers = sw.map((s) => {
//         const id = String(s._id || s.id);
//         return { ...s, hasToday: todayPresentSet.has(id) };
//       });

//       setSweepers(augmentedSweepers);
//       setWeeklyData(computedWeekly);
//       setTodaySummary({
//         total: computedWeekly[computedWeekly.length - 1].total,
//         verified: computedWeekly[computedWeekly.length - 1].verified,
//         pending: computedWeekly[computedWeekly.length - 1].pending,
//       });
//     } catch (err) {
//       console.error("loadData error:", err);
//       setError(err.message || "Error loading data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();

//     // socket setup for realtime updates (optional)
//     const rawBase = API_BASE || "";
//     const safeBase = (typeof rawBase === "string" ? rawBase.trim() : "") || window.location.origin;
//     let s;
//     try {
//       s = io(safeBase, { transports: ["websocket", "polling"] });
//       socketRef.current = s;

//       const onUpdate = () => loadData();
//       s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
//       s.on("sweeper:added", onUpdate);
//       s.on("sweeper:deleted", onUpdate);
//       s.on("sweeper:updated", onUpdate);
//       s.on("sweeper:duty-time-updated", onUpdate);
//       s.on("attendance:marked", onUpdate);
//     } catch (err) {
//       console.warn("socket connect failed:", err && err.message ? err.message : err);
//     }

//     return () => {
//       try {
//         if (socketRef.current) {
//           socketRef.current.disconnect();
//           socketRef.current = null;
//         }
//       } catch {}
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Add Sweeper
//   const handleAddSweeper = async (e) => {
//     e && e.preventDefault();
//     setAddError("");
//     if (!addName.trim() || !addEmail.trim() || !addPassword) {
//       setAddError("Name, email and password are required.");
//       return;
//     }
//     setAdding(true);
//     try {
//       const payload = {
//         name: addName.trim(),
//         email: addEmail.trim(),
//         password: addPassword,
//         zone: addZone || undefined,
//         status: addStatus || undefined,
//       };
//       const res = await fetch(`${API_BASE}/sweepers`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response when adding sweeper.");
//       }
//       if (!res.ok || !data?.success) throw new Error(data?.message || `Failed to add sweeper (${res.status})`);
//       setAddName("");
//       setAddEmail("");
//       setAddPassword("");
//       setAddZone("");
//       setAddStatus("active");
//       setShowAddModal(false);
//       await loadData();
//     } catch (err) {
//       setAddError(err.message || "Error adding sweeper");
//     } finally {
//       setAdding(false);
//     }
//   };

//   // Duty modal handlers
//   const openDutyModal = (sweeper) => {
//     setSelectedSweeper(sweeper);
//     const start = (sweeper.dutyTime && sweeper.dutyTime.start) || "";
//     const end = (sweeper.dutyTime && sweeper.dutyTime.end) || "";
//     const normalize = (val) => {
//       if (!val) return "";
//       const m = moment(val, moment.ISO_8601, true);
//       if (m.isValid()) return m.format("HH:mm");
//       return String(val);
//     };
//     setDutyStart(normalize(start));
//     setDutyEnd(normalize(end));
//     setDutyError("");
//     setShowDutyModal(true);
//   };

//   const handleSaveDuty = async (e) => {
//     e && e.preventDefault();
//     if (!selectedSweeper) return;
//     setDutyError("");
//     if (!dutyStart || !dutyEnd) {
//       setDutyError("Start and end times are required.");
//       return;
//     }
//     const sMoment = moment(dutyStart, "HH:mm");
//     const eMoment = moment(dutyEnd, "HH:mm");
//     if (!sMoment.isValid() || !eMoment.isValid()) {
//       setDutyError("Invalid time format.");
//       return;
//     }
//     if (!eMoment.isAfter(sMoment)) {
//       setDutyError("End time must be after start time.");
//       return;
//     }

//     setSavingDuty(true);
//     try {
//       const payload = { start: dutyStart, end: dutyEnd };
//       const res = await fetch(`${API_BASE}/sweepers/${selectedSweeper._id || selectedSweeper.id}/duty-time`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response when saving duty time.");
//       }
//       if (!res.ok || !data?.success) throw new Error(data?.message || `Failed to save duty time (${res.status})`);
//       setShowDutyModal(false);
//       setSelectedSweeper(null);
//       await loadData();
//     } catch (err) {
//       setDutyError(err.message || "Error saving duty time");
//     } finally {
//       setSavingDuty(false);
//     }
//   };

//   // Delete sweeper
//   const handleDeleteSweeper = async (sweeper) => {
//     if (!sweeper) return;
//     const id = sweeper._id || sweeper.id;
//     const confirm = window.confirm(`Delete sweeper "${sweeper.name}"? This will remove the sweeper and associated data.`);
//     if (!confirm) return;
//     setDeletingId(id);
//     try {
//       const res = await fetch(`${API_BASE}/sweepers/${id}`, { method: "DELETE" });
//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {}
//       if (!res.ok) {
//         const msg = data?.message || `Failed to delete sweeper (${res.status})`;
//         throw new Error(msg);
//       }
//       await loadData();
//       window.alert(`Sweeper "${sweeper.name}" deleted successfully.`);
//     } catch (err) {
//       console.error("Error deleting sweeper:", err);
//       window.alert(`Failed to delete sweeper: ${err.message || err}`);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // ---- Sweeper detail & attendance ----
//   const openDetail = async (sweeper) => {
//     setDetailSweeper(sweeper);
//     setShowDetailModal(true);
//     // default fetch attendance for range
//     await fetchAttendanceForSweeper(sweeper, attendanceFrom, attendanceTo);
//   };

//   const fetchAttendanceForSweeper = async (sweeper, from, to) => {
//     if (!sweeper) return;
//     setAttendanceLoading(true);
//     setAttendanceRecords([]);
//     try {
//       const id = sweeper._id || sweeper.id;
//       const url = new URL(`${API_BASE}/sweepers/${id}/attendance`);
//       if (from) url.searchParams.append("from", from);
//       if (to) url.searchParams.append("to", to);
//       const res = await fetch(url.toString());
//       if (!res.ok) throw new Error("Failed to fetch attendance");
//       const json = await res.json();
//       const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
//       // sort by date desc
//       records.sort((a, b) => new Date(b.date) - new Date(a.date));
//       setAttendanceRecords(records);
//     } catch (err) {
//       console.error("fetchAttendanceForSweeper error:", err);
//       setAttendanceRecords([]);
//     } finally {
//       setAttendanceLoading(false);
//     }
//   };

//   // derive zones
//   const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

//   const filteredList = sweepers.filter((sweeper) => {
//     const nameMatch = sweeper.name ? sweeper.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
//     const zoneMatch = filterZone === "" || (sweeper.zone || "") === filterZone;
//     return nameMatch && zoneMatch;
//   });

//   return (
//     <div>
//       <h1 className="text-2xl font-heading font-semibold mb-6">Sweeper List</h1>

//       <Card>
//         <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
//           <div className="flex flex-wrap items-center gap-4">
//             <div className="relative w-64">
//               <input
//                 type="text"
//                 placeholder="Search sweepers..."
//                 className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>

//             <select
//               className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//               value={filterZone}
//               onChange={(e) => setFilterZone(e.target.value)}
//             >
//               <option value="">All Zones</option>
//               {zones.map((z) => (
//                 <option value={z} key={z}>
//                   {z}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center gap-3">
//             <Button color="black" onClick={() => setShowAddModal(true)}>
//               <FaUserPlus className="mr-2" /> Add New Sweeper
//             </Button>
//             <Button variant="outline" color="secondary" onClick={() => loadData()}>
//               <FaSync />
//             </Button>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           {loading ? (
//             <div className="p-6 text-center text-gray-500">Loading sweepers...</div>
//           ) : error ? (
//             <div className="p-6 text-center text-red-600">Error: {error}</div>
//           ) : filteredList.length === 0 ? (
//             <div className="p-6 text-center text-gray-500">No sweepers found.</div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Attendance</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifications</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
//                   return (
//                     <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div
//                           className="font-medium cursor-pointer text-primary"
//                           onClick={() => openDetail(sweeper)}
//                         >
//                           {sweeper.name || "—"}
//                         </div>
//                         <div className="text-xs text-gray-500">{sweeper.email || ""}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sweeper.zone || "—"}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant={(sweeper.status === "active" && "success") || "warning"} className="capitalize">
//                           {sweeper.status || "unknown"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {sweeper.dutyTime && (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
//                           <div className="text-sm">
//                             <div>{sweeper.dutyTime.start || "—"} - {sweeper.dutyTime.end || "—"}</div>
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-500">Not set</div>
//                         )}
//                         <div className="mt-2">
//                           <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
//                             <FaClock className="mr-2" /> Duty Time
//                           </Button>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant={sweeper.hasToday ? "success" : "danger"} className="capitalize">
//                           {sweeper.hasToday ? "present" : "pending"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         <div className="flex items-center">
//                           <div className="w-24 bg-gray-200 rounded-full h-1.5 mr-2">
//                             <div
//                               className="bg-primary h-1.5 rounded-full"
//                               style={{ width: `${((sweeper.verifications || 0) / 5) * 100}%` }}
//                             ></div>
//                           </div>
//                           <span>{sweeper.verifications ?? 0}/5</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button size="sm" color="primary" iconOnly title="Assign Route">
//                             <FaRoute />
//                           </Button>
//                           <Button size="sm" color="secondary" iconOnly title="Track Location">
//                             <FaMapMarkerAlt />
//                           </Button>
//                           <Button
//                             size="sm"
//                             color="danger"
//                             iconOnly
//                             title="Delete Sweeper"
//                             onClick={() => handleDeleteSweeper(sweeper)}
//                             disabled={isDeleting}
//                           >
//                             <FaTrash />
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </Card>

//       {/* Attendance / Sweeper Detail Modal */}
//       {showDetailModal && detailSweeper && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h3 className="text-xl font-semibold">{detailSweeper.name}</h3>
//                 <div className="text-sm text-gray-600">{detailSweeper.email}</div>
//                 <div className="text-sm text-gray-600">Zone: {detailSweeper.zone || "—"}</div>
//                 <div className="text-sm text-gray-600">Duty Time: {detailSweeper.dutyTime?.start || "—"} - {detailSweeper.dutyTime?.end || "—"}</div>
//                 <div className="text-sm text-gray-600">Geofence points: {(detailSweeper.geofence || []).length}</div>
//                 <div className="text-sm text-gray-600">Checkpoints: {(detailSweeper.checkpoints || []).length}</div>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Button variant="outline" color="default" onClick={() => { setShowDetailModal(false); setDetailSweeper(null); }}>
//                   Close
//                 </Button>
//               </div>
//             </div>

//             <div className="mb-4">
//               <h4 className="font-medium mb-2">Attendance Records</h4>
//               <div className="flex items-center gap-3 mb-3">
//                 <label className="text-sm text-gray-600">From</label>
//                 <input
//                   type="date"
//                   className="border p-2 rounded"
//                   value={attendanceFrom}
//                   onChange={(e) => setAttendanceFrom(e.target.value)}
//                 />
//                 <label className="text-sm text-gray-600">To</label>
//                 <input
//                   type="date"
//                   className="border p-2 rounded"
//                   value={attendanceTo}
//                   onChange={(e) => setAttendanceTo(e.target.value)}
//                 />
//                 <Button color="black" onClick={() => fetchAttendanceForSweeper(detailSweeper, attendanceFrom, attendanceTo)}>
//                   Refresh
//                 </Button>
//               </div>

//               {attendanceLoading ? (
//                 <div className="text-sm text-gray-500">Loading attendance...</div>
//               ) : attendanceRecords.length === 0 ? (
//                 <div className="text-sm text-gray-500">No attendance records found for this range.</div>
//               ) : (
//                 <div className="overflow-x-auto max-h-72">
//                   <table className="min-w-full divide-y divide-gray-200 text-sm">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left">Date</th>
//                         <th className="px-3 py-2 text-left">Time</th>
//                         <th className="px-3 py-2 text-left">Latitude</th>
//                         <th className="px-3 py-2 text-left">Longitude</th>
//                         <th className="px-3 py-2 text-left">Recorded At</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {attendanceRecords.map((a) => (
//                         <tr key={a._id || a.id || `${a.date}-${a.sweeperId}`}>
//                           <td className="px-3 py-2">{moment(a.date).format("YYYY-MM-DD")}</td>
//                           <td className="px-3 py-2">{moment(a.date).format("HH:mm:ss")}</td>
//                           <td className="px-3 py-2">{a.location?.latitude ?? "-"}</td>
//                           <td className="px-3 py-2">{a.location?.longitude ?? "-"}</td>
//                           <td className="px-3 py-2">{moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>

//             {/* Optional: small attendance summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <Card>
//                 <div className="text-sm text-gray-500">Total records</div>
//                 <div className="text-xl font-semibold">{attendanceRecords.length}</div>
//               </Card>
//               <Card>
//                 <div className="text-sm text-gray-500">First record</div>
//                 <div className="text-sm">{attendanceRecords.length ? moment(attendanceRecords[attendanceRecords.length - 1].date).format("YYYY-MM-DD HH:mm") : "-"}</div>
//               </Card>
//               <Card>
//                 <div className="text-sm text-gray-500">Last record</div>
//                 <div className="text-sm">{attendanceRecords.length ? moment(attendanceRecords[0].date).format("YYYY-MM-DD HH:mm") : "-"}</div>
//               </Card>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Sweeper Modal (existing code) */}
//       {showAddModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h3 className="text-lg font-semibold mb-4">Add New Sweeper</h3>
//             <form onSubmit={handleAddSweeper} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Name</label>
//                 <input value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Email</label>
//                 <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Password</label>
//                 <input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} type="password" className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Zone</label>
//                 <input value={addZone} onChange={(e) => setAddZone(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Status</label>
//                 <select value={addStatus} onChange={(e) => setAddStatus(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
//                   <option value="active">active</option>
//                   <option value="inactive">inactive</option>
//                 </select>
//               </div>
//               {addError && <div className="text-sm text-red-600">{addError}</div>}
//               <div className="flex justify-end gap-2">
//                 <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowAddModal(false)} disabled={adding}>Cancel</button>
//                 <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={adding}>{adding ? "Adding..." : "Add Sweeper"}</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Duty Time Modal */}
//       {showDutyModal && selectedSweeper && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h3 className="text-lg font-semibold mb-4">Assign Duty Time - {selectedSweeper.name}</h3>
//             <form onSubmit={handleSaveDuty} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Start Time</label>
//                 <input value={dutyStart} onChange={(e) => setDutyStart(e.target.value)} type="time" className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">End Time</label>
//                 <input value={dutyEnd} onChange={(e) => setDutyEnd(e.target.value)} type="time" className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>
//               {dutyError && <div className="text-sm text-red-600">{dutyError}</div>}
//               <div className="flex justify-end gap-2">
//                 <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowDutyModal(false)} disabled={savingDuty}>Cancel</button>
//                 <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={savingDuty}>{savingDuty ? "Saving..." : "Save Duty Time"}</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SweeperList;



// import React, { useState, useEffect, useRef } from "react";
// import moment from "moment";
// import Card from "../../components/common/Card";
// import Badge from "../../components/common/Badge";
// import Button from "../../components/common/Button";
// import { FaSearch, FaRoute, FaMapMarkerAlt, FaUserPlus, FaClock, FaTrash, FaSync } from "react-icons/fa";
// // import {
// //   // WeeklyAttendanceChart,
// //   AttendancePieChart,
// //   // ZoneAttendanceChart,
// //   // TimeDistributionChart,
// // } from "../../components/charts/AttendanceCharts";
// import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";

// const SweeperList = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterZone, setFilterZone] = useState("");
//   const [sweepers, setSweepers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // attendance derived state
//   const [weeklyData, setWeeklyData] = useState([]);
//   const [todaySummary, setTodaySummary] = useState({ total: 0, verified: 0, pending: 0 });

//   // Add Sweeper modal & form state
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addName, setAddName] = useState("");
//   const [addEmail, setAddEmail] = useState("");
//   const [addPassword, setAddPassword] = useState("");
//   const [addZone, setAddZone] = useState("");
//   const [addStatus, setAddStatus] = useState("active");
//   const [adding, setAdding] = useState(false);
//   const [addError, setAddError] = useState("");

//   // duty modal states
//   const [showDutyModal, setShowDutyModal] = useState(false);
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [dutyStart, setDutyStart] = useState("");
//   const [dutyEnd, setDutyEnd] = useState("");
//   const [savingDuty, setSavingDuty] = useState(false);
//   const [dutyError, setDutyError] = useState("");

//   // deletion state
//   const [deletingId, setDeletingId] = useState(null);

//   const socketRef = useRef(null);

//   // helper: last N date strings (YYYY-MM-DD)
//   const lastNDates = (n) => {
//     const arr = [];
//     for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
//     return arr;
//   };

//   const fetchSweepers = async () => {
//     const res = await fetch(`${API_BASE}/sweepers`);
//     if (!res.ok) throw new Error("Failed to fetch sweepers");
//     const json = await res.json();
//     return Array.isArray(json.sweepers) ? json.sweepers : [];
//   };

//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const sw = await fetchSweepers();

//       const days = 7;
//       const dates = lastNDates(days);
//       const countsMap = {};
//       dates.forEach((d) => (countsMap[d] = { verified: 0, total: sw.length, pending: 0 }));

//       if (sw.length === 0) {
//         setSweepers([]);
//         setWeeklyData(dates.map((d) => ({ date: d, verified: 0, pending: 0, total: 0 })));
//         setTodaySummary({ total: 0, verified: 0, pending: 0 });
//         setLoading(false);
//         return;
//       }

//       const from = dates[0];
//       const to = dates[dates.length - 1];

//       const attendancePromises = sw.map((s) =>
//         fetch(`${API_BASE}/sweepers/${s._id || s.id}/attendance?from=${from}&to=${to}`)
//           .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
//           .then((j) => (Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []))
//           .catch(() => [])
//       );
//       const allResults = await Promise.all(attendancePromises);

//       const presentByDateAndSweeper = {};
//       dates.forEach((d) => (presentByDateAndSweeper[d] = new Set()));

//       allResults.forEach((entries, idx) => {
//         const sweeper = sw[idx];
//         const sweeperId = String(sweeper._id || sweeper.id);
//         entries.forEach((entry) => {
//           const key = moment(entry.date).utc().startOf("day").format("YYYY-MM-DD");
//           if (presentByDateAndSweeper[key]) presentByDateAndSweeper[key].add(sweeperId);
//         });
//       });

//       dates.forEach((d) => {
//         const presentSet = presentByDateAndSweeper[d] || new Set();
//         countsMap[d].verified = presentSet.size;
//         countsMap[d].pending = Math.max(0, countsMap[d].total - countsMap[d].verified);
//       });

//       const computedWeekly = dates.map((d) => ({
//         date: d,
//         verified: countsMap[d].verified,
//         pending: countsMap[d].pending,
//         total: countsMap[d].total,
//       }));

//       const todayKey = dates[dates.length - 1];
//       const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

//       const augmentedSweepers = sw.map((s) => {
//         const id = String(s._id || s.id);
//         return { ...s, hasToday: todayPresentSet.has(id) };
//       });

//       setSweepers(augmentedSweepers);
//       setWeeklyData(computedWeekly);
//       setTodaySummary({
//         total: computedWeekly[computedWeekly.length - 1].total,
//         verified: computedWeekly[computedWeekly.length - 1].verified,
//         pending: computedWeekly[computedWeekly.length - 1].pending,
//       });

//       console.debug("[SweeperList] loadData complete:", augmentedSweepers.length, "sweepers, weeklyData:", computedWeekly);
//     } catch (err) {
//       console.error("[SweeperList] loadData error:", err);
//       setError(err.message || "Error loading data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();

//     // safe socket base
//     const rawBase = API_BASE || "";
//     const safeBase = (typeof rawBase === "string" ? rawBase.trim() : "") || window.location.origin;

//     let s;
//     try {
//       s = io(safeBase, { transports: ["websocket", "polling"] });
//       socketRef.current = s;
//       console.debug("[SweeperList] socket connecting to", safeBase);

//       const onUpdate = () => {
//         loadData();
//       };

//       s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
//       s.on("disconnect", (reason) => console.debug("[SweeperList] socket disconnected", reason));

//       s.on("sweeper:added", onUpdate);
//       s.on("sweeper:deleted", onUpdate);
//       s.on("sweeper:updated", onUpdate);
//       s.on("sweeper:duty-time-updated", onUpdate);
//       s.on("attendance:marked", onUpdate);
//     } catch (err) {
//       console.warn("[SweeperList] socket connect failed:", err && err.message ? err.message : err);
//     }

//     return () => {
//       try {
//         if (socketRef.current) {
//           socketRef.current.disconnect();
//           socketRef.current = null;
//         }
//       } catch {}
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // derive zones dynamically from fetched sweepers
//   const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

//   const filteredList = sweepers.filter((sweeper) => {
//     const nameMatch = sweeper.name ? sweeper.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
//     const zoneMatch = filterZone === "" || (sweeper.zone || "") === filterZone;
//     return nameMatch && zoneMatch;
//   });

//   // ----------------------------
//   // Add Sweeper handler
//   // ----------------------------
//   const handleAddSweeper = async (e) => {
//     e && e.preventDefault();
//     setAddError("");
//     if (!addName.trim() || !addEmail.trim() || !addPassword) {
//       setAddError("Name, email and password are required.");
//       return;
//     }
//     setAdding(true);
//     try {
//       const payload = {
//         name: addName.trim(),
//         email: addEmail.trim(),
//         password: addPassword,
//         zone: addZone || undefined,
//         status: addStatus || undefined,
//       };
//       const res = await fetch(`${API_BASE}/sweepers`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response from server when adding sweeper.");
//       }

//       if (!res.ok || !data?.success) {
//         throw new Error(data?.message || `Failed to add sweeper (${res.status})`);
//       }

//       // success: clear form, close modal, reload data
//       setAddName("");
//       setAddEmail("");
//       setAddPassword("");
//       setAddZone("");
//       setAddStatus("active");
//       setShowAddModal(false);
//       await loadData();
//     } catch (err) {
//       setAddError(err.message || "Error adding sweeper");
//     } finally {
//       setAdding(false);
//     }
//   };

//   // ----------------------------
//   // Duty time modal handlers
//   // ----------------------------
//   const openDutyModal = (sweeper) => {
//     setSelectedSweeper(sweeper);
//     const start = (sweeper.dutyTime && sweeper.dutyTime.start) || "";
//     const end = (sweeper.dutyTime && sweeper.dutyTime.end) || "";
//     const normalize = (val) => {
//       if (!val) return "";
//       const m = moment(val, moment.ISO_8601, true);
//       if (m.isValid()) return m.format("HH:mm");
//       // fallback assume already HH:mm
//       return String(val);
//     };
//     setDutyStart(normalize(start));
//     setDutyEnd(normalize(end));
//     setDutyError("");
//     setShowDutyModal(true);
//   };

//   const handleSaveDuty = async (e) => {
//     e && e.preventDefault();
//     if (!selectedSweeper) return;
//     setDutyError("");
//     if (!dutyStart || !dutyEnd) {
//       setDutyError("Start and end times are required.");
//       return;
//     }
//     const sMoment = moment(dutyStart, "HH:mm");
//     const eMoment = moment(dutyEnd, "HH:mm");
//     if (!sMoment.isValid() || !eMoment.isValid()) {
//       setDutyError("Invalid time format.");
//       return;
//     }
//     if (!eMoment.isAfter(sMoment)) {
//       setDutyError("End time must be after start time.");
//       return;
//     }

//     setSavingDuty(true);
//     try {
//       const payload = { start: dutyStart, end: dutyEnd };
//       const res = await fetch(`${API_BASE}/sweepers/${selectedSweeper._id || selectedSweeper.id}/duty-time`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response from server when saving duty time.");
//       }

//       if (!res.ok || !data?.success) {
//         throw new Error(data?.message || `Failed to save duty time (${res.status})`);
//       }

//       // success - refresh data and close modal
//       setShowDutyModal(false);
//       setSelectedSweeper(null);
//       await loadData();
//     } catch (err) {
//       setDutyError(err.message || "Error saving duty time");
//     } finally {
//       setSavingDuty(false);
//     }
//   };

//   // ----------------------------
//   // Delete sweeper handler
//   // ----------------------------
//   const handleDeleteSweeper = async (sweeper) => {
//     if (!sweeper) return;
//     const id = sweeper._id || sweeper.id;
//     const confirm = window.confirm(`Delete sweeper "${sweeper.name}"? This will remove the sweeper and associated data.`);

//     if (!confirm) return;

//     setDeletingId(id);
//     try {
//       const res = await fetch(`${API_BASE}/sweepers/${id}`, {
//         method: "DELETE",
//       });

//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         // ignore JSON parse error
//       }

//       if (!res.ok) {
//         // If backend returns JSON with message use it
//         const msg = data?.message || `Failed to delete sweeper (${res.status})`;
//         throw new Error(msg);
//       }

//       // success
//       // reload list and show a simple notification
//       await loadData();
//       window.alert(`Sweeper "${sweeper.name}" deleted successfully.`);
//     } catch (err) {
//       console.error("Error deleting sweeper:", err);
//       window.alert(`Failed to delete sweeper: ${err.message || err}`);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-heading font-semibold mb-6">Sweeper List</h1>

//       <Card>
//         {/* toolbar (search, zone filter, add) */}
//         <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
//           <div className="flex flex-wrap items-center gap-4">
//             <div className="relative w-64">
//               <input
//                 type="text"
//                 placeholder="Search sweepers..."
//                 className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>

//             <select
//               className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//               value={filterZone}
//               onChange={(e) => setFilterZone(e.target.value)}
//             >
//               <option value="">All Zones</option>
//               {zones.map((z) => (
//                 <option value={z} key={z}>
//                   {z}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center gap-3">
//             <Button color="black" onClick={() => setShowAddModal(true)}>
//               <FaUserPlus className="mr-2" /> Add New Sweeper
//             </Button>
//             <Button variant="outline" color="secondary" onClick={() => loadData()}><FaSync /></Button>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           {loading ? (
//             <div className="p-6 text-center text-gray-500">Loading sweepers...</div>
//           ) : error ? (
//             <div className="p-6 text-center text-red-600">Error: {error}</div>
//           ) : filteredList.length === 0 ? (
//             <div className="p-6 text-center text-gray-500">No sweepers found.</div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Attendance</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifications</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
//                   return (
//                     <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="font-medium">{sweeper.name || "—"}</div>
//                         <div className="text-xs text-gray-500">{sweeper.email || ""}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sweeper.zone || "—"}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant={(sweeper.status === "active" && "success") || "warning"} className="capitalize">
//                           {sweeper.status || "unknown"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {sweeper.dutyTime && (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
//                           <div className="text-sm">
//                             <div>{sweeper.dutyTime.start || "—"} - {sweeper.dutyTime.end || "—"}</div>
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-500">Not set</div>
//                         )}
//                         <div className="mt-2">
//                           <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
//                             <FaClock className="mr-2" /> Duty Time
//                           </Button>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <Badge variant={sweeper.hasToday ? "success" : "danger"} className="capitalize">
//                           {sweeper.hasToday ? "present" : "pending"}
//                         </Badge>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         <div className="flex items-center">
//                           <div className="w-24 bg-gray-200 rounded-full h-1.5 mr-2">
//                             <div
//                               className="bg-primary h-1.5 rounded-full"
//                               style={{ width: `${((sweeper.verifications || 0) / 5) * 100}%` }}
//                             ></div>
//                           </div>
//                           <span>{sweeper.verifications ?? 0}/5</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button size="sm" color="black" iconOnly title="Assign Route">
//                             <FaRoute />
//                           </Button>
//                           <Button size="sm" color="black" iconOnly title="Track Location">
//                             <FaMapMarkerAlt />
//                           </Button>
//                           <Button
//                             size="sm"
//                             color="black"
//                             iconOnly
//                             title="Delete Sweeper"
//                             onClick={() => handleDeleteSweeper(sweeper)}
//                             disabled={isDeleting}
//                           >
//                             <FaTrash />
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </Card>

//       <Card className="mt-8">
//         <h2 className="text-lg font-medium mb-6">Attendance Overview</h2>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           <div className="bg-gray-50 rounded-lg p-6 flex flex-col justify-center">
//             <h3 className="text-sm font-medium text-gray-500 mb-4">Today's Summary</h3>
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <span>Total Staff:</span>
//                 <span className="font-semibold">{todaySummary.total}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Present:</span>
//                 <span className="font-semibold text-success">{todaySummary.verified}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Absent/Pending:</span>
//                 <span className="font-semibold text-warning">{todaySummary.pending}</span>
//               </div>
//               <div className="border-t pt-2 mt-2">
//                 <div className="flex justify-between">
//                   <span>Attendance Rate:</span>
//                   <span className="font-semibold text-primary">
//                     {todaySummary.total > 0 ? (((todaySummary.verified / todaySummary.total) * 100).toFixed(1) + "%") : "—"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* <div className="bg-gray-50 rounded-lg p-6">
//             <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Attendance</h3>
//             <AttendancePieChart verified={todaySummary.verified} pending={todaySummary.pending} apiBase={API_BASE} />
//           </div> */}
//         </div>

//         {/* <div className="mb-8">
//           <h3 className="text-sm font-medium text-gray-500 mb-4">Weekly Attendance Trends</h3>
//           <div className="h-64">
//             <WeeklyAttendanceChart data={weeklyData} apiBase={API_BASE} />
//           </div>
//         </div> */}

//         {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-sm font-medium text-gray-500 mb-4">Zone-wise Attendance</h3>
//             <ZoneAttendanceChart apiBase={API_BASE} />
//           </div>

//           <div>
//             <h3 className="text-sm font-medium text-gray-500 mb-4">Verification Time Distribution</h3>
//             <TimeDistributionChart apiBase={API_BASE} />
//           </div>
//         </div> */}
//       </Card>

//       {/* Add Sweeper Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h3 className="text-lg font-semibold mb-4">Add New Sweeper</h3>

//             <form onSubmit={handleAddSweeper} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Name</label>
//                 <input value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Email</label>
//                 <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" className="mt-1 block w-full border rounded px-3 py-2" required />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Password</label>
//                 <input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} type="password" className="mt-1 block w-full border rounded px-3 py-2" required />
//                 <p className="text-xs text-gray-500 mt-1">Passwords may be stored as-is depending on backend. Consider hashing in backend.</p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Zone</label>
//                 <input value={addZone} onChange={(e) => setAddZone(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Status</label>
//                 <select value={addStatus} onChange={(e) => setAddStatus(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
//                   <option value="active">active</option>
//                   <option value="inactive">inactive</option>
//                 </select>
//               </div>

//               {addError && <div className="text-sm text-red-600">{addError}</div>}

//               <div className="flex justify-end gap-2">
//                 <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowAddModal(false)} disabled={adding}>
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={adding}>
//                   {adding ? "Adding..." : "Add Sweeper"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Duty Time Modal */}
//       {showDutyModal && selectedSweeper && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h3 className="text-lg font-semibold mb-4">Assign Duty Time - {selectedSweeper.name}</h3>

//             <form onSubmit={handleSaveDuty} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Start Time</label>
//                 <input
//                   value={dutyStart}
//                   onChange={(e) => setDutyStart(e.target.value)}
//                   type="time"
//                   className="mt-1 block w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">End Time</label>
//                 <input
//                   value={dutyEnd}
//                   onChange={(e) => setDutyEnd(e.target.value)}
//                   type="time"
//                   className="mt-1 block w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>

//               {dutyError && <div className="text-sm text-red-600">{dutyError}</div>}

//               <div className="flex justify-end gap-2">
//                 <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowDutyModal(false)} disabled={savingDuty}>
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={savingDuty}>
//                   {savingDuty ? "Saving..." : "Save Duty Time"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SweeperList;

import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import {
  FaSearch,
  FaRoute,
  FaMapMarkerAlt,
  FaUserPlus,
  FaClock,
  FaTrash,
  FaSync,
} from "react-icons/fa";
// import {
//   WeeklyAttendanceChart,
//   AttendancePieChart,
//   ZoneAttendanceChart,
//   TimeDistributionChart,
// } from "../../components/charts/AttendanceCharts";
import { io } from "socket.io-client";

const API_BASE = "https://smc-backend-bjm5.onrender.com";

const SweeperList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [sweepers, setSweepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // attendance derived state for dashboard overview
  const [weeklyData, setWeeklyData] = useState([]);
  const [todaySummary, setTodaySummary] = useState({ total: 0, verified: 0, pending: 0 });

  // modals & forms states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addZone, setAddZone] = useState("");
  const [addStatus, setAddStatus] = useState("active");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // duty modal
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [selectedSweeper, setSelectedSweeper] = useState(null);
  const [dutyStart, setDutyStart] = useState("");
  const [dutyEnd, setDutyEnd] = useState("");
  const [savingDuty, setSavingDuty] = useState(false);
  const [dutyError, setDutyError] = useState("");

  // delete state
  const [deletingId, setDeletingId] = useState(null);

  // Sweeper detail & attendance modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSweeper, setDetailSweeper] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFrom, setAttendanceFrom] = useState(
    moment().subtract(7, "days").format("YYYY-MM-DD")
  );
  const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));
  const socketRef = useRef(null);

  // Helpers
  const lastNDates = (n) => {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
    return arr;
  };

  // Fetch sweepers
  const fetchSweepers = async () => {
    const res = await fetch(`${API_BASE}/sweepers`);
    if (!res.ok) throw new Error("Failed to fetch sweepers");
    const json = await res.json();
    return Array.isArray(json.sweepers) ? json.sweepers : [];
  };

  // Load data & attendance aggregates
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const sw = await fetchSweepers();

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

      const attendancePromises = sw.map((s) =>
        fetch(`${API_BASE}/sweepers/${s._id || s.id}/attendance?from=${from}&to=${to}`)
          .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
          .then((j) => (Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []))
          .catch(() => [])
      );
      const allResults = await Promise.all(attendancePromises);

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
      console.error("loadData error:", err);
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // socket setup for realtime updates (optional)
    const rawBase = API_BASE || "";
    const safeBase = (typeof rawBase === "string" ? rawBase.trim() : "") || window.location.origin;
    let s;
    try {
      s = io(safeBase, { transports: ["websocket", "polling"] });
      socketRef.current = s;

      const onUpdate = () => loadData();
      s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
      s.on("sweeper:added", onUpdate);
      s.on("sweeper:deleted", onUpdate);
      s.on("sweeper:updated", onUpdate);
      s.on("sweeper:duty-time-updated", onUpdate);
      s.on("attendance:marked", onUpdate);
    } catch (err) {
      console.warn("socket connect failed:", err && err.message ? err.message : err);
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

  // Add Sweeper
  const handleAddSweeper = async (e) => {
    e && e.preventDefault();
    setAddError("");
    if (!addName.trim() || !addEmail.trim() || !addPassword) {
      setAddError("Name, email and password are required.");
      return;
    }
    setAdding(true);
    try {
      const payload = {
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        zone: addZone || undefined,
        status: addStatus || undefined,
      };
      const res = await fetch(`${API_BASE}/sweepers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Unexpected response when adding sweeper.");
      }
      if (!res.ok || !data?.success) throw new Error(data?.message || `Failed to add sweeper (${res.status})`);
      setAddName("");
      setAddEmail("");
      setAddPassword("");
      setAddZone("");
      setAddStatus("active");
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setAddError(err.message || "Error adding sweeper");
    } finally {
      setAdding(false);
    }
  };

  // Duty modal handlers
  const openDutyModal = (sweeper) => {
    setSelectedSweeper(sweeper);
    const start = (sweeper.dutyTime && sweeper.dutyTime.start) || "";
    const end = (sweeper.dutyTime && sweeper.dutyTime.end) || "";
    const normalize = (val) => {
      if (!val) return "";
      const m = moment(val, moment.ISO_8601, true);
      if (m.isValid()) return m.format("HH:mm");
      return String(val);
    };
    setDutyStart(normalize(start));
    setDutyEnd(normalize(end));
    setDutyError("");
    setShowDutyModal(true);
  };

  const handleSaveDuty = async (e) => {
    e && e.preventDefault();
    if (!selectedSweeper) return;
    setDutyError("");
    if (!dutyStart || !dutyEnd) {
      setDutyError("Start and end times are required.");
      return;
    }
    const sMoment = moment(dutyStart, "HH:mm");
    const eMoment = moment(dutyEnd, "HH:mm");
    if (!sMoment.isValid() || !eMoment.isValid()) {
      setDutyError("Invalid time format.");
      return;
    }
    if (!eMoment.isAfter(sMoment)) {
      setDutyError("End time must be after start time.");
      return;
    }

    setSavingDuty(true);
    try {
      const payload = { start: dutyStart, end: dutyEnd };
      const res = await fetch(`${API_BASE}/sweepers/${selectedSweeper._id || selectedSweeper.id}/duty-time`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Unexpected response when saving duty time.");
      }
      if (!res.ok || !data?.success) throw new Error(data?.message || `Failed to save duty time (${res.status})`);
      setShowDutyModal(false);
      setSelectedSweeper(null);
      await loadData();
    } catch (err) {
      setDutyError(err.message || "Error saving duty time");
    } finally {
      setSavingDuty(false);
    }
  };

  // Delete sweeper
  const handleDeleteSweeper = async (sweeper) => {
    if (!sweeper) return;
    const id = sweeper._id || sweeper.id;
    const confirm = window.confirm(`Delete sweeper "${sweeper.name}"? This will remove the sweeper and associated data.`);
    if (!confirm) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/sweepers/${id}`, { method: "DELETE" });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok) {
        const msg = data?.message || `Failed to delete sweeper (${res.status})`;
        throw new Error(msg);
      }
      await loadData();
      window.alert(`Sweeper "${sweeper.name}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting sweeper:", err);
      window.alert(`Failed to delete sweeper: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Sweeper detail & attendance ----
  const openDetail = async (sweeper) => {
    setDetailSweeper(sweeper);
    setShowDetailModal(true);
    // default fetch attendance for range
    await fetchAttendanceForSweeper(sweeper, attendanceFrom, attendanceTo);
  };

  const fetchAttendanceForSweeper = async (sweeper, from, to) => {
    if (!sweeper) return;
    setAttendanceLoading(true);
    setAttendanceRecords([]);
    try {
      const id = sweeper._id || sweeper.id;
      const url = new URL(`${API_BASE}/sweepers/${id}/attendance`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const json = await res.json();
      const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
      // sort by date desc
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAttendanceRecords(records);
    } catch (err) {
      console.error("fetchAttendanceForSweeper error:", err);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // derive zones
  const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

  const filteredList = sweepers.filter((sweeper) => {
    const nameMatch = sweeper.name ? sweeper.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const zoneMatch = filterZone === "" || (sweeper.zone || "") === filterZone;
    return nameMatch && zoneMatch;
  });

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">Sweeper List</h1>

      <Card>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search sweepers..."
                className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map((z) => (
                <option value={z} key={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button color="black" onClick={() => setShowAddModal(true)}>
              <FaUserPlus className="mr-2" /> Add New Sweeper
            </Button>
            <Button variant="outline" color="secondary" onClick={() => loadData()}>
              <FaSync />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading sweepers...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Error: {error}</div>
          ) : filteredList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No sweepers found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList.map((sweeper) => {
                  const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
                  return (
                    <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="font-medium cursor-pointer text-primary"
                          onClick={() => openDetail(sweeper)}
                        >
                          {sweeper.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{sweeper.email || ""}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sweeper.zone || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={(sweeper.status === "active" && "success") || "warning"} className="capitalize">
                          {sweeper.status || "unknown"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sweeper.dutyTime && (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
                          <div className="text-sm">
                            <div>{sweeper.dutyTime.start || "—"} - {sweeper.dutyTime.end || "—"}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not set</div>
                        )}
                        <div className="mt-2">
                          <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
                            <FaClock className="mr-2" /> Duty Time
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={sweeper.hasToday ? "success" : "danger"} className="capitalize">
                          {sweeper.hasToday ? "present" : "pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-1.5 mr-2">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${((sweeper.verifications || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span>{sweeper.verifications ?? 0}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button size="sm" color="black" iconOnly title="Assign Route">
                            <FaRoute />
                          </Button>
                          <Button size="sm" color="black" iconOnly title="Track Location">
                            <FaMapMarkerAlt />
                          </Button>
                          <Button
                            size="sm"
                            color="black"
                            iconOnly
                            title="Delete Sweeper"
                            onClick={() => handleDeleteSweeper(sweeper)}
                            disabled={isDeleting}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Attendance / Sweeper Detail Modal */}
      {showDetailModal && detailSweeper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{detailSweeper.name}</h3>
                <div className="text-sm text-gray-600">{detailSweeper.email}</div>
                <div className="text-sm text-gray-600">Zone: {detailSweeper.zone || "—"}</div>
                <div className="text-sm text-gray-600">Duty Time: {detailSweeper.dutyTime?.start || "—"} - {detailSweeper.dutyTime?.end || "—"}</div>
                <div className="text-sm text-gray-600">Geofence points: {(detailSweeper.geofence || []).length}</div>
                <div className="text-sm text-gray-600">Checkpoints: {(detailSweeper.checkpoints || []).length}</div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" color="default" onClick={() => { setShowDetailModal(false); setDetailSweeper(null); }}>
                  Close
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Attendance Records</h4>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm text-gray-600">From</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={attendanceFrom}
                  onChange={(e) => setAttendanceFrom(e.target.value)}
                />
                <label className="text-sm text-gray-600">To</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={attendanceTo}
                  onChange={(e) => setAttendanceTo(e.target.value)}
                />
                <Button color="black" onClick={() => fetchAttendanceForSweeper(detailSweeper, attendanceFrom, attendanceTo)}>
                  Refresh
                </Button>
              </div>

              {attendanceLoading ? (
                <div className="text-sm text-gray-500">Loading attendance...</div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-sm text-gray-500">No attendance records found for this range.</div>
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
                          <td className="px-3 py-2">{moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Optional: small attendance summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-sm text-gray-500">Total records</div>
                <div className="text-xl font-semibold">{attendanceRecords.length}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500">First record</div>
                <div className="text-sm">{attendanceRecords.length ? moment(attendanceRecords[attendanceRecords.length - 1].date).format("YYYY-MM-DD HH:mm") : "-"}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-500">Last record</div>
                <div className="text-sm">{attendanceRecords.length ? moment(attendanceRecords[0].date).format("YYYY-MM-DD HH:mm") : "-"}</div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Add Sweeper Modal (existing code) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Sweeper</h3>
            <form onSubmit={handleAddSweeper} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" className="mt-1 block w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} type="password" className="mt-1 block w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zone</label>
                <input value={addZone} onChange={(e) => setAddZone(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={addStatus} onChange={(e) => setAddStatus(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              {addError && <div className="text-sm text-red-600">{addError}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowAddModal(false)} disabled={adding}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={adding}>{adding ? "Adding..." : "Add Sweeper"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duty Time Modal */}
      {showDutyModal && selectedSweeper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Duty Time - {selectedSweeper.name}</h3>
            <form onSubmit={handleSaveDuty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input value={dutyStart} onChange={(e) => setDutyStart(e.target.value)} type="time" className="mt-1 block w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input value={dutyEnd} onChange={(e) => setDutyEnd(e.target.value)} type="time" className="mt-1 block w-full border rounded px-3 py-2" required />
              </div>
              {dutyError && <div className="text-sm text-red-600">{dutyError}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowDutyModal(false)} disabled={savingDuty}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-black" disabled={savingDuty}>{savingDuty ? "Saving..." : "Save Duty Time"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SweeperList;
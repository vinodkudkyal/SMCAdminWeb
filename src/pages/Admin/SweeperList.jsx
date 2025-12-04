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
// // import {
// //   WeeklyAttendanceChart,
// //   AttendancePieChart,
// //   ZoneAttendanceChart,
// //   TimeDistributionChart,
// // } from "../../components/charts/AttendanceCharts";
// import { io } from "socket.io-client";

// const API_BASE = "https://smc-backend-bjm5.onrender.com";

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
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
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
//                         <div className="flex space-x-2">
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





// Updated SweeperList.jsx
// Replace your existing SweeperList.jsx with this file (keeps your UI, fixes alarm-fetching + normalization).
// This version explicitly tries the backend endpoints exposed in your index1_Version2(1).js (GET /sweepers/:id/alarm-events and GET /alarm-events?sweeperId=...)
// It normalizes fields (alarmTimestampMs, openedTimestampMs, responseMs, verificationTimestampMs, createdAt) and logs useful debug info.
// URL for local API is http://localhost:3000 — update API_BASE if different.



// import React, { useState, useEffect, useRef } from "react";
// import moment from "moment";
// import Card from "../../components/common/Card";
// import Badge from "../../components/common/Badge";
// import Button from "../../components/common/Button";
// import {
//   FaSearch,
//   FaUserPlus,
//   FaClock,
//   FaTrash,
//   FaSync,
//   FaMapMarkerAlt,
//   FaBell,
//   FaDownload,
//   FaHistory,
//   FaInfoCircle,
// } from "react-icons/fa";
// import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";
// // const API_BASE = "https://smc-backend-bjm5.onrender.com";

// const SweeperList = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterZone, setFilterZone] = useState("");
//   const [sweepers, setSweepers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // add/duty/delete UI state (kept minimal)
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addName, setAddName] = useState("");
//   const [addEmail, setAddEmail] = useState("");
//   const [addPassword, setAddPassword] = useState("");
//   const [addZone, setAddZone] = useState("");
//   const [addStatus, setAddStatus] = useState("active");
//   const [adding, setAdding] = useState(false);
//   const [addError, setAddError] = useState("");

//   const [showDutyModal, setShowDutyModal] = useState(false);
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [dutyStart, setDutyStart] = useState("");
//   const [dutyEnd, setDutyEnd] = useState("");
//   const [savingDuty, setSavingDuty] = useState(false);
//   const [dutyError, setDutyError] = useState("");

//   const [deletingId, setDeletingId] = useState(null);

//   // detail modal state
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [detailSweeper, setDetailSweeper] = useState(null);
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [attendanceLoading, setAttendanceLoading] = useState(false);
//   const [attendanceFrom, setAttendanceFrom] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
//   const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));

//   // alarms summary + history
//   const [alarmsSummary, setAlarmsSummary] = useState({}); // map sweeperId -> { missed, active, recent:[], full:[] }
//   const [alarmsLoading, setAlarmsLoading] = useState(false);
//   const [showFullAlarmHistory, setShowFullAlarmHistory] = useState(false); // toggle in modal

//   // selected alarm (for showing full details)
//   const [selectedAlarm, setSelectedAlarm] = useState(null);

//   const socketRef = useRef(null);

//   // Helpers
//   const lastNDates = (n) => {
//     const arr = [];
//     for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
//     return arr;
//   };

//   // -------------------------
//   // Fetch helpers
//   // -------------------------
//   const fetchSweepers = async () => {
//     const res = await fetch(`${API_BASE}/sweepers`);
//     if (!res.ok) throw new Error("Failed to fetch sweepers");
//     const json = await res.json();
//     return Array.isArray(json.sweepers) ? json.sweepers : [];
//   };

//   const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
//     try {
//       const url = new URL(`${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/attendance`);
//       if (from) url.searchParams.append("from", from);
//       if (to) url.searchParams.append("to", to);
//       const res = await fetch(url.toString());
//       if (!res.ok) return [];
//       const json = await res.json();
//       const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
//       records.sort((a, b) => new Date(b.date) - new Date(a.date));
//       return records;
//     } catch (err) {
//       console.warn("fetchAttendanceForSweeper error:", err);
//       return [];
//     }
//   };

//   // NEW: robust alarm fetcher that tries known backend routes and normalizes events
//   const fetchAlarmsForSweeper = async (sweeperId, opts = {}) => {
//     // Try endpoints in order of preference:
//     const candidates = [
//       // index1_Version2 provides this:
//       `${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/alarm-events`,
//       // alternate collection-style endpoints:
//       `${API_BASE}/alarm-events?sweeperId=${encodeURIComponent(sweeperId)}`,
//       `${API_BASE}/alarm-events?since=${encodeURIComponent(opts.since || "")}`,
//       // older names / compatibility:
//       `${API_BASE}/alarmevents?sweeperId=${encodeURIComponent(sweeperId)}`,
//       `${API_BASE}/alarms?sweeperId=${encodeURIComponent(sweeperId)}`,
//     ];

//     for (const url of candidates) {
//       try {
//         // skip malformed candidate when opts.since empty
//         if (url.endsWith("since=")) continue;
//         const res = await fetch(url);
//         if (!res.ok) {
//           // proceed to next candidate
//           continue;
//         }
//         const json = await res.json();
//         // normalize various response shapes to an array
//         let events = [];
//         if (Array.isArray(json)) events = json;
//         else if (Array.isArray(json.events)) events = json.events;
//         else if (Array.isArray(json.alarmevents)) events = json.alarmevents;
//         else if (Array.isArray(json.data)) events = json.data;
//         else if (json.event && typeof json.event === "object") events = [json.event];
//         else if (json.alarmevent && typeof json.alarmevent === "object") events = [json.alarmevent];
//         else if (json && typeof json === "object" && (json.alarmTimestampMs || json._id || json.createdAt)) events = [json];

//         // sanitize/normalize each event
//         events = events.map((ev) => {
//           const copy = { ...ev };
//           // Some exports include nested $date/$numberLong; handle common mongo export forms
//           if (copy.alarmTimestampMs && typeof copy.alarmTimestampMs === "object") {
//             // e.g. { $numberDouble: "176..." } or {$numberLong:"176..."}
//             const maybe = copy.alarmTimestampMs.$numberDouble || copy.alarmTimestampMs.$numberLong || copy.alarmTimestampMs.$numberInt;
//             if (maybe) copy.alarmTimestampMs = Number(maybe);
//           } else if (copy.alarmTimestampMs) {
//             copy.alarmTimestampMs = Number(copy.alarmTimestampMs);
//           }

//           if (copy.openedTimestampMs && typeof copy.openedTimestampMs === "object") {
//             const maybe = copy.openedTimestampMs.$numberDouble || copy.openedTimestampMs.$numberLong || copy.openedTimestampMs.$numberInt;
//             if (maybe) copy.openedTimestampMs = Number(maybe);
//           } else if (copy.openedTimestampMs) {
//             copy.openedTimestampMs = Number(copy.openedTimestampMs);
//           }

//           if (copy.verificationTimestampMs && typeof copy.verificationTimestampMs === "object") {
//             const maybe = copy.verificationTimestampMs.$numberDouble || copy.verificationTimestampMs.$numberLong || copy.verificationTimestampMs.$numberInt;
//             if (maybe) copy.verificationTimestampMs = Number(maybe);
//           } else if (copy.verificationTimestampMs) {
//             copy.verificationTimestampMs = Number(copy.verificationTimestampMs);
//           }

//           if (copy.responseMs && typeof copy.responseMs === "object") {
//             const maybe = copy.responseMs.$numberInt || copy.responseMs.$numberDouble || copy.responseMs.$numberLong;
//             if (maybe) copy.responseMs = Number(maybe);
//           } else if (copy.responseMs) {
//             copy.responseMs = Number(copy.responseMs);
//           }

//           // Normalize createdAt if it's the extended JSON form
//           if (copy.createdAt && typeof copy.createdAt === "object") {
//             // handle { $date: { $numberLong: "..." } } or { $date: "..." }
//             if (copy.createdAt.$date) {
//               const inner = copy.createdAt.$date;
//               const nl = inner.$numberLong || inner;
//               copy.createdAt = new Date(Number(nl));
//             } else if (copy.createdAt.$numberLong) {
//               copy.createdAt = new Date(Number(copy.createdAt.$numberLong));
//             } else {
//               // fallback: stringify
//               copy.createdAt = new Date(String(copy.createdAt));
//             }
//           } else if (copy.createdAt) {
//             // if it's numeric or string, convert
//             if (typeof copy.createdAt === "number") copy.createdAt = new Date(copy.createdAt);
//             else if (typeof copy.createdAt === "string") {
//               const parsed = Date.parse(copy.createdAt);
//               copy.createdAt = isNaN(parsed) ? copy.createdAt : new Date(parsed);
//             }
//           }

//           // Ensure sweeperId is a string
//           if (copy.sweeperId && typeof copy.sweeperId === "object" && copy.sweeperId.$oid) {
//             copy.sweeperId = String(copy.sweeperId.$oid);
//           } else if (copy.sweeperId && typeof copy.sweeperId !== "string") {
//             copy.sweeperId = String(copy.sweeperId);
//           }

//           return copy;
//         });

//         // Return normalized events
//         return events;
//       } catch (err) {
//         // try next candidate
//         // console.warn("fetchAlarms candidate failed", url, err);
//         continue;
//       }
//     }
//     // none found
//     return [];
//   };

//   // -------------------------
//   // Main load & summaries
//   // -------------------------
//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const sw = await fetchSweepers();

//       // presence calculation using last 7 days
//       const days = 7;
//       const dates = lastNDates(days);
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

//       const todayKey = dates[dates.length - 1];
//       const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

//       const augmentedSweepers = sw.map((s, idx) => {
//         const entries = allResults[idx] || [];
//         let lastLocation = null;
//         if (entries.length > 0) {
//           const latest = entries.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
//           if (latest && latest.location) lastLocation = latest.location;
//         }
//         return { ...s, hasToday: todayPresentSet.has(String(s._id || s.id)), lastLocation };
//       });

//       setSweepers(augmentedSweepers);

//       // fetch alarm summaries (last 24h)
//       await loadAlarmSummaries(augmentedSweepers);
//     } catch (err) {
//       console.error("loadData error:", err);
//       setError(err.message || "Error loading data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadAlarmSummaries = async (sweepersList) => {
//     setAlarmsLoading(true);
//     try {
//       const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
//       const promises = sweepersList.map(async (s) => {
//         try {
//           const events = await fetchAlarmsForSweeper(s._id || s.id, { since: sinceMs });
//           const missed = events.filter(
//             (ev) =>
//               (ev.verificationStatus && ev.verificationStatus.toLowerCase() === "skipped") ||
//               (!ev.opened && !ev.verificationTimestampMs)
//           ).length;
//           const active = events.filter((ev) => ev.opened === false).length;
//           const recent = events.slice().sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)).slice(0, 5);
//           return { id: s._id || s.id, missed, active, recent, full: events.slice().sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)) };
//         } catch (err) {
//           return { id: s._id || s.id, missed: 0, active: 0, recent: [], full: [] };
//         }
//       });

//       const results = await Promise.all(promises);
//       const map = {};
//       results.forEach((r) => {
//         map[r.id] = { missed: r.missed, active: r.active, recent: r.recent, full: r.full };
//       });
//       setAlarmsSummary(map);
//     } catch (err) {
//       console.warn("loadAlarmSummaries error:", err);
//     } finally {
//       setAlarmsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();

//     // socket.io refresh on events
//     let s;
//     try {
//       s = io(API_BASE, { transports: ["websocket", "polling"] });
//       socketRef.current = s;
//       const onUpdate = () => loadData();
//       s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
//       s.on("sweeper:added", onUpdate);
//       s.on("sweeper:deleted", onUpdate);
//       s.on("sweeper:updated", onUpdate);
//       s.on("sweeper:duty-time-updated", onUpdate);
//       s.on("attendance:marked", onUpdate);
//       s.on("alarmevent:created", onUpdate);
//     } catch (err) {
//       console.warn("socket connect failed:", err);
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

//   // -------------------------
//   // CRUD handlers (add/duty/delete)
//   // -------------------------
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

//   // open detail modal: fetch attendance + alarms history
//   const openDetail = async (sweeper) => {
//     setDetailSweeper(sweeper);
//     setShowDetailModal(true);
//     setSelectedAlarm(null);
//     setAttendanceLoading(true);
//     setAttendanceRecords([]);
//     setShowFullAlarmHistory(false);
//     try {
//       const recs = await fetchAttendanceForSweeper(sweeper._id || sweeper.id, attendanceFrom, attendanceTo);
//       setAttendanceRecords(recs);
//       const fullEvents = await fetchAlarmsForSweeper(sweeper._id || sweeper.id, {});
//       setAlarmsSummary((prev) => ({ ...prev, [sweeper._id || sweeper.id]: { ...(prev[sweeper._id || sweeper.id] || {}), full: fullEvents, recent: (prev[sweeper._id || sweeper.id] && prev[sweeper._id || sweeper.id].recent) || fullEvents.slice(0, 5) } }));
//     } catch (err) {
//       console.error("openDetail error:", err);
//     } finally {
//       setAttendanceLoading(false);
//     }
//   };

//   // Utility: determine presence today
//   const isPresentToday = (records) => {
//     if (!records) return false;
//     return records.some((r) => moment(r.date).isSame(moment(), "day"));
//   };

//   // Utility: determine event state strings and row classes
//   const analyzeEvent = (ev) => {
//     const opened = !!ev.opened;
//     const verified = ev.verificationStatus && ev.verificationStatus.toLowerCase() === "verified";
//     const skipped = ev.verificationStatus && ev.verificationStatus.toLowerCase() === "skipped";
//     const missed = (!opened && !verified && !ev.verificationTimestampMs) || skipped;
//     let state = "Ringed";
//     if (verified) state = "Verified";
//     else if (skipped) state = "Missed (skipped)";
//     else if (!opened) state = "Unopened";
//     return { opened, verified, skipped, missed, state };
//   };

//   // Render UI (keeps markup similar to earlier versions)
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
//               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missed / Alarms</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Location</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
//                   const aSummary = alarmsSummary[sweeper._id || sweeper.id] || { missed: 0, active: 0, recent: [], full: [] };
//                   const lastLoc = sweeper.lastLocation;
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
//                         <div className="text-xs text-gray-500 mt-1">{sweeper.zone || ""}</div>
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center space-x-3">
//                           <div>
//                             <div className="text-sm font-medium">{aSummary.missed}</div>
//                             <div className="text-xs text-gray-500">missed (24h)</div>
//                           </div>
//                           {aSummary.active > 0 && (
//                             <div className="flex items-center text-sm text-red-600">
//                               <FaBell className="mr-2" />
//                               <div>{aSummary.active} active</div>
//                             </div>
//                           )}
//                         </div>
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {lastLoc ? (
//                           <div className="text-sm">
//                             <div><FaMapMarkerAlt className="inline-block mr-1 text-gray-600" /> {Number(lastLoc.latitude).toFixed(5)}, {Number(lastLoc.longitude).toFixed(5)}</div>
//                             <div className="text-xs text-gray-500">recent</div>
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-500">No location</div>
//                         )}
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
//                             <FaClock className="mr-1" /> Duty
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

//       {/* Detail Modal */}
//       {showDetailModal && detailSweeper && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
//           <div
//             className={`w-full max-w-4xl p-6 rounded-lg shadow-lg bg-white ${
//               isPresentToday(attendanceRecords) ? "border-2 border-green-500" : "border-2 border-red-500"
//             }`}
//           >
//             <div className="flex justify-between items-start mb-4">
//               <div className="flex-1">
//                 <h3 className="text-xl font-semibold">{detailSweeper.name}</h3>

//                 <div className="mt-2">
//                   {isPresentToday(attendanceRecords) ? (
//                     <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800">
//                       Present
//                     </div>
//                   ) : (
//                     <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800">
//                       Absent
//                     </div>
//                   )}
//                 </div>

//                 <div className="text-sm text-gray-600 mt-2">{detailSweeper.email}</div>
//                 <div className="text-sm text-gray-600">Zone: {detailSweeper.zone || "—"}</div>
//                 <div className="text-sm text-gray-600">Duty Time: {detailSweeper.dutyTime?.start || "—"} - {detailSweeper.dutyTime?.end || "—"}</div>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Button variant="outline" color="default" onClick={() => { setShowDetailModal(false); setDetailSweeper(null); setSelectedAlarm(null); }}>
//                   Close
//                 </Button>
//               </div>
//             </div>

//             <div className="mb-4">
//               <h4 className="font-medium mb-2">Attendance Records</h4>

//               <div className="flex items-center gap-3 mb-3">
//                 <label className="text-sm text-gray-600">From</label>
//                 <input type="date" className="border p-2 rounded" value={attendanceFrom} onChange={(e) => setAttendanceFrom(e.target.value)} />
//                 <label className="text-sm text-gray-600">To</label>
//                 <input type="date" className="border p-2 rounded" value={attendanceTo} onChange={(e) => setAttendanceTo(e.target.value)} />
//                 <Button color="black" onClick={async () => {
//                   setAttendanceLoading(true);
//                   setAttendanceRecords([]);
//                   try {
//                     const recs = await fetchAttendanceForSweeper(detailSweeper._id || detailSweeper.id, attendanceFrom, attendanceTo);
//                     setAttendanceRecords(recs);
//                   } catch (err) {
//                     console.error(err);
//                   } finally {
//                     setAttendanceLoading(false);
//                   }
//                 }}>
//                   Refresh
//                 </Button>

//                 <Button variant="outline" color="secondary" onClick={() => {
//                   if (!attendanceRecords || attendanceRecords.length === 0) { window.alert("No records to export"); return; }
//                   const header = ["date","time","latitude","longitude","recordedAt"];
//                   const rows = attendanceRecords.map((a) => {
//                     const date = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//                     const time = a.date ? moment(a.date).format("HH:mm:ss") : "";
//                     const lat = a.location?.latitude ?? "";
//                     const lng = a.location?.longitude ?? "";
//                     const recorded = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "";
//                     return [date,time,lat,lng,recorded].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",");
//                   });
//                   const csv = [header.join(","),...rows].join("\n");
//                   const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
//                   const url = URL.createObjectURL(blob);
//                   const a = document.createElement('a');
//                   a.href = url;
//                   a.download = `${detailSweeper.name||'sweeper'}_attendance_${attendanceFrom}_${attendanceTo}.csv`;
//                   document.body.appendChild(a);
//                   a.click();
//                   a.remove();
//                   URL.revokeObjectURL(url);
//                 }}>
//                   <FaDownload className="mr-2" /> Export CSV
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
//                         <tr key={a._id || `${a.date}-${a.sweeperId}`}>
//                           <td className="px-3 py-2">{moment(a.date).format("YYYY-MM-DD")}</td>
//                           <td className="px-3 py-2">{moment(a.date).format("HH:mm:ss")}</td>
//                           <td className="px-3 py-2">{a.location?.latitude ?? "-"}</td>
//                           <td className="px-3 py-2">{a.location?.longitude ?? "-"}</td>
//                           <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>

//             <div className="mb-4">
//               <div className="flex items-center justify-between mb-2">
//                 <h4 className="font-medium">Alarm / Events (history)</h4>
//                 <div className="flex items-center space-x-2">
//                   <Button variant="outline" color="secondary" onClick={() => setShowFullAlarmHistory((v) => !v)}>
//                     <FaHistory className="mr-2" /> {showFullAlarmHistory ? "Show Recent" : "Show Full History"}
//                   </Button>
//                 </div>
//               </div>

//               <div className="overflow-x-auto max-h-64">
//                 {(() => {
//                   const summary = alarmsSummary[detailSweeper._id || detailSweeper.id] || {};
//                   const events = showFullAlarmHistory ? (summary.full || []) : (summary.recent || []);
//                   if (!events || events.length === 0) {
//                     return <div className="text-sm text-gray-500">No alarm events found.</div>;
//                   }
//                   return (
//                     <div className="flex">
//                       <div className="w-2/3 overflow-auto">
//                         <table className="min-w-full divide-y divide-gray-200 text-sm">
//                           <thead className="bg-gray-50">
//                             <tr>
//                               <th className="px-3 py-2 text-left">Ring Time</th>
//                               <th className="px-3 py-2 text-left">State</th>
//                               <th className="px-3 py-2 text-left">Opened</th>
//                               <th className="px-3 py-2 text-left">Response (ms)</th>
//                               <th className="px-3 py-2 text-left">Verification</th>
//                               <th className="px-3 py-2 text-left">Info</th>
//                             </tr>
//                           </thead>
//                           <tbody className="bg-white divide-y divide-gray-200">
//                             {events.map((ev) => {
//                               const { opened, verified, skipped, missed, state } = analyzeEvent(ev);
//                               const rowClass = missed ? "bg-red-50" : verified ? "bg-green-50" : "";
//                               return (
//                                 <tr
//                                   key={ev._id || ev.alarmTimestampMs || Math.random()}
//                                   className={`${rowClass} hover:bg-gray-100 cursor-pointer`}
//                                   onClick={() => setSelectedAlarm(ev)}
//                                 >
//                                   <td className="px-3 py-2">{ev.alarmTimestampMs ? moment(ev.alarmTimestampMs).format("YYYY-MM-DD HH:mm:ss") : "-"}</td>
//                                   <td className="px-3 py-2">{state}</td>
//                                   <td className="px-3 py-2">{opened ? (ev.openedTimestampMs ? `Yes (${moment(ev.openedTimestampMs).format("YYYY-MM-DD HH:mm:ss")})` : "Yes") : "No"}</td>
//                                   <td className="px-3 py-2">{ev.responseMs ?? "-"}</td>
//                                   <td className="px-3 py-2">{ev.verificationTimestampMs ? moment(ev.verificationTimestampMs).format("YYYY-MM-DD HH:mm:ss") : (ev.verificationStatus || "-")}</td>
//                                   <td className="px-3 py-2">{ev.note || ev.message || "-"}</td>
//                                 </tr>
//                               );
//                             })}
//                           </tbody>
//                         </table>
//                       </div>

//                       <div className="w-1/3 pl-4">
//                         <div className="sticky top-0">
//                           <h5 className="text-sm font-medium mb-2 flex items-center"><FaInfoCircle className="mr-2" /> Selected Alarm Details</h5>
//                           {!selectedAlarm ? (
//                             <div className="text-sm text-gray-500">Click an alarm row to see full details (timestamps, raw fields).</div>
//                           ) : (
//                             <div className="text-sm">
//                               <div className="mb-2"><strong>Alarm time:</strong> {selectedAlarm.alarmTimestampMs ? moment(selectedAlarm.alarmTimestampMs).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
//                               <div className="mb-2"><strong>Created at:</strong> {selectedAlarm.createdAt ? moment(selectedAlarm.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
//                               <div className="mb-2"><strong>Opened:</strong> {selectedAlarm.opened ? `Yes (${selectedAlarm.openedTimestampMs ? moment(selectedAlarm.openedTimestampMs).format("YYYY-MM-DD HH:mm:ss") : "-"})` : "No"}</div>
//                               <div className="mb-2"><strong>Response (ms):</strong> {selectedAlarm.responseMs ?? "-"}</div>
//                               <div className="mb-2"><strong>Verification status:</strong> {selectedAlarm.verificationStatus ?? "-"}</div>
//                               <div className="mb-2"><strong>Verification time:</strong> {selectedAlarm.verificationTimestampMs ? moment(selectedAlarm.verificationTimestampMs).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
//                               <div className="mb-2"><strong>SweeperId:</strong> {selectedAlarm.sweeperId ?? "-"}</div>
//                               <div className="mb-2"><strong>Raw JSON:</strong></div>
//                               <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto" style={{ maxHeight: 280 }}>
//                                 {JSON.stringify(selectedAlarm, null, 2)}
//                               </pre>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })()}
//               </div>
//             </div>

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

//       {/* Add and Duty modals: keep existing implementations (omitted for brevity) */}
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
//   FaUserPlus,
//   FaClock,
//   FaTrash,
//   FaSync,
//   FaBell,
//   FaDownload,
//   FaHistory,
//   FaInfoCircle,
// } from "react-icons/fa";
// import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";
// // const API_BASE = "https://smc-backend-bjm5.onrender.com";

// const SweeperList = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterZone, setFilterZone] = useState("");
//   const [sweepers, setSweepers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // add/duty/delete UI state (kept minimal)
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [addName, setAddName] = useState("");
//   const [addEmail, setAddEmail] = useState("");
//   const [addPassword, setAddPassword] = useState("");
//   const [addZone, setAddZone] = useState("");
//   const [addStatus, setAddStatus] = useState("active");
//   const [adding, setAdding] = useState(false);
//   const [addError, setAddError] = useState("");

//   const [showDutyModal, setShowDutyModal] = useState(false);
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [dutyStart, setDutyStart] = useState("");
//   const [dutyEnd, setDutyEnd] = useState("");
//   const [savingDuty, setSavingDuty] = useState(false);
//   const [dutyError, setDutyError] = useState("");

//   const [deletingId, setDeletingId] = useState(null);

//   // detail modal state
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [detailSweeper, setDetailSweeper] = useState(null);
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [attendanceLoading, setAttendanceLoading] = useState(false);
//   const [attendanceFrom, setAttendanceFrom] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
//   const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));

//   // alarms summary + history
//   const [alarmsSummary, setAlarmsSummary] = useState({}); // map sweeperId -> { missed, active, recent:[], full:[] }
//   const [alarmsLoading, setAlarmsLoading] = useState(false);
//   const [showFullAlarmHistory, setShowFullAlarmHistory] = useState(false); // toggle in modal

//   // selected alarm (for showing full details)
//   const [selectedAlarm, setSelectedAlarm] = useState(null);

//   const socketRef = useRef(null);

//   // Helpers
//   const lastNDates = (n) => {
//     const arr = [];
//     for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
//     return arr;
//   };

//   // -------------------------
//   // Fetch helpers
//   // -------------------------
//   const fetchSweepers = async () => {
//     const res = await fetch(`${API_BASE}/sweepers`);
//     if (!res.ok) throw new Error("Failed to fetch sweepers");
//     const json = await res.json();
//     return Array.isArray(json.sweepers) ? json.sweepers : [];
//   };

//   const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
//     try {
//       const url = new URL(`${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/attendance`);
//       if (from) url.searchParams.append("from", from);
//       if (to) url.searchParams.append("to", to);
//       const res = await fetch(url.toString());
//       if (!res.ok) return [];
//       const json = await res.json();
//       const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
//       records.sort((a, b) => new Date(b.date) - new Date(a.date));
//       return records;
//     } catch (err) {
//       console.warn("fetchAttendanceForSweeper error:", err);
//       return [];
//     }
//   };

//   // robust alarm fetcher that tries known backend routes and normalizes events
//   const fetchAlarmsForSweeper = async (sweeperId, opts = {}) => {
//     const candidates = [
//       `${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/alarmevents`,
//       `${API_BASE}/alarmevents?sweeperId=${encodeURIComponent(sweeperId)}`,
//       `${API_BASE}/alarmevents?sweeperId=${encodeURIComponent(sweeperId)}&from=${encodeURIComponent(opts.since || "")}`,
//       `${API_BASE}/alarmevents`,
//     ];

//     for (const url of candidates) {
//       try {
//         if (url.includes("from=") && opts.since == null) continue;
//         const res = await fetch(url);
//         if (!res.ok) continue;
//         const json = await res.json();
//         let events = [];
//         if (Array.isArray(json)) events = json;
//         else if (Array.isArray(json.alarmevents)) events = json.alarmevents;
//         else if (Array.isArray(json.events)) events = json.events;
//         else if (json && typeof json === "object" && (json._id || json.alarmTimestampMs)) events = [json];
//         // convert fields where necessary; simple normalization
//         events = events.map((ev) => {
//           const copy = { ...ev };
//           if (copy.alarmTimestampMs) copy.alarmTimestampMs = Number(copy.alarmTimestampMs);
//           if (copy.openedTimestampMs) copy.openedTimestampMs = Number(copy.openedTimestampMs);
//           if (copy.verificationTimestampMs) copy.verificationTimestampMs = Number(copy.verificationTimestampMs);
//           if (copy.responseMs) copy.responseMs = Number(copy.responseMs);
//           return copy;
//         });
//         return events;
//       } catch (err) {
//         continue;
//       }
//     }
//     return [];
//   };

//   // -------------------------
//   // Main load & summaries
//   // -------------------------
//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const sw = await fetchSweepers();

//       // presence calculation using last 7 days
//       const days = 7;
//       const dates = lastNDates(days);
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

//       const todayKey = dates[dates.length - 1];
//       const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

//       const augmentedSweepers = sw.map((s, idx) => {
//         const entries = allResults[idx] || [];
//         let lastLocation = null;
//         if (entries.length > 0) {
//           const latest = entries.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
//           if (latest && latest.location) lastLocation = latest.location;
//         }
//         return { ...s, hasToday: todayPresentSet.has(String(s._id || s.id)), lastLocation };
//       });

//       setSweepers(augmentedSweepers);

//       // fetch alarm summaries (last 24h)
//       await loadAlarmSummaries(augmentedSweepers);
//     } catch (err) {
//       console.error("loadData error:", err);
//       setError(err.message || "Error loading data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadAlarmSummaries = async (sweepersList) => {
//     setAlarmsLoading(true);
//     try {
//       const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
//       const promises = sweepersList.map(async (s) => {
//         try {
//           const events = await fetchAlarmsForSweeper(s._id || s.id, { since: sinceMs });
//           const missed = events.filter(
//             (ev) =>
//               (ev.verificationStatus && String(ev.verificationStatus).toLowerCase() === "skipped") ||
//               (!ev.opened && !ev.verificationTimestampMs)
//           ).length;
//           const active = events.filter((ev) => ev.opened === false).length;
//           const recent = events.slice().sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)).slice(0, 5);
//           return { id: s._id || s.id, missed, active, recent, full: events.slice().sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)) };
//         } catch (err) {
//           return { id: s._id || s.id, missed: 0, active: 0, recent: [], full: [] };
//         }
//       });

//       const results = await Promise.all(promises);
//       const map = {};
//       results.forEach((r) => {
//         map[r.id] = { missed: r.missed, active: r.active, recent: r.recent, full: r.full };
//       });
//       setAlarmsSummary(map);
//     } catch (err) {
//       console.warn("loadAlarmSummaries error:", err);
//     } finally {
//       setAlarmsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();

//     // socket.io refresh on events
//     let s;
//     try {
//       s = io(API_BASE, { transports: ["websocket", "polling"] });
//       socketRef.current = s;
//       const onUpdate = () => loadData();
//       s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
//       s.on("sweeper:added", onUpdate);
//       s.on("sweeper:deleted", onUpdate);
//       s.on("sweeper:updated", onUpdate);
//       s.on("sweeper:duty-time-updated", onUpdate);
//       s.on("attendance:marked", onUpdate);
//       s.on("alarmevent:created", onUpdate);
//     } catch (err) {
//       console.warn("socket connect failed:", err);
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

//   // CRUD handlers (add/duty/delete) omitted here for brevity (use earlier implementations)...

//   // open detail modal: fetch attendance + alarms history
//   const openDetail = async (sweeper) => {
//     setDetailSweeper(sweeper);
//     setShowDetailModal(true);
//     setSelectedAlarm(null);
//     setAttendanceLoading(true);
//     setAttendanceRecords([]);
//     setShowFullAlarmHistory(false);
//     try {
//       const recs = await fetchAttendanceForSweeper(sweeper._id || sweeper.id, attendanceFrom, attendanceTo);
//       setAttendanceRecords(recs);
//       const fullEvents = await fetchAlarmsForSweeper(sweeper._id || sweeper.id, {});
//       setAlarmsSummary((prev) => ({ ...prev, [sweeper._id || sweeper.id]: { ...(prev[sweeper._id || sweeper.id] || {}), full: fullEvents, recent: (prev[sweeper._id || sweeper.id] && prev[sweeper._id || sweeper.id].recent) || fullEvents.slice(0, 5) } }));
//     } catch (err) {
//       console.error("openDetail error:", err);
//     } finally {
//       setAttendanceLoading(false);
//     }
//   };

//   // Utility: determine presence today
//   const isPresentToday = (records) => {
//     if (!records) return false;
//     return records.some((r) => moment(r.date).isSame(moment(), "day"));
//   };

//   // Utility: determine event state strings and row classes and "attended by" inference
//   const analyzeEvent = (ev, currentSweeperId) => {
//     const opened = !!ev.opened;
//     const verification = ev.verificationStatus ? String(ev.verificationStatus).toLowerCase() : null;
//     const verified = verification === "verified";
//     const skipped = verification === "skipped";
//     const missed = skipped || (!opened && !ev.verificationTimestampMs);
//     let state = "Ringed";
//     if (verified) state = "Verified";
//     else if (skipped) state = "Missed (skipped)";
//     else if (!opened) state = "Unopened";

//     let attendedBy = "-";
//     if (verified) {
//       if (String(ev.sweeperId) === String(currentSweeperId)) attendedBy = "Self";
//       else attendedBy = "Other";
//     } else if (skipped) {
//       attendedBy = "Skipped";
//     } else if (opened) {
//       attendedBy = "Opened";
//     }

//     return { opened, verified, skipped, missed, state, attendedBy };
//   };

//   // Render UI (main parts)
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
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missed / Alarms</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
//                   const aSummary = alarmsSummary[sweeper._id || sweeper.id] || { missed: 0, active: 0, recent: [], full: [] };
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
//                         <div className="text-xs text-gray-500 mt-1">{sweeper.zone || ""}</div>
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center space-x-3">
//                           <div>
//                             <div className="text-sm font-medium">{aSummary.missed}</div>
//                             <div className="text-xs text-gray-500">missed (24h)</div>
//                           </div>
//                           {aSummary.active > 0 && (
//                             <div className="flex items-center text-sm text-red-600">
//                               <FaBell className="mr-2" />
//                               <div>{aSummary.active} active</div>
//                             </div>
//                           )}
//                         </div>
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
//                             <FaClock className="mr-1" /> Duty
//                           </Button>
//                         </div>
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button size="sm" color="primary" onClick={() => openDetail(sweeper)}>Details</Button>
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

//       {/* Detail Modal (attendance table now excludes lat/lng columns and CSV export changed) */}
//       {showDetailModal && detailSweeper && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
//           <div
//             className={`w-full max-w-4xl p-6 rounded-lg shadow-lg bg-white ${
//               isPresentToday(attendanceRecords) ? "border-2 border-green-500" : "border-2 border-red-500"
//             }`}
//           >
//             <div className="flex justify-between items-start mb-4">
//               <div className="flex-1">
//                 <h3 className="text-xl font-semibold">{detailSweeper.name}</h3>

//                 <div className="mt-2">
//                   {isPresentToday(attendanceRecords) ? (
//                     <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800">
//                       Present
//                     </div>
//                   ) : (
//                     <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800">
//                       Absent
//                     </div>
//                   )}
//                 </div>

//                 <div className="text-sm text-gray-600 mt-2">{detailSweeper.email}</div>
//                 <div className="text-sm text-gray-600">Zone: {detailSweeper.zone || "—"}</div>
//                 <div className="text-sm text-gray-600">Duty Time: {detailSweeper.dutyTime?.start || "—"} - {detailSweeper.dutyTime?.end || "—"}</div>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Button variant="outline" color="default" onClick={() => { setShowDetailModal(false); setDetailSweeper(null); setSelectedAlarm(null); }}>
//                   Close
//                 </Button>
//               </div>
//             </div>

//             <div className="mb-4">
//               <h4 className="font-medium mb-2">Attendance Records</h4>

//               <div className="flex items-center gap-3 mb-3">
//                 <label className="text-sm text-gray-600">From</label>
//                 <input type="date" className="border p-2 rounded" value={attendanceFrom} onChange={(e) => setAttendanceFrom(e.target.value)} />
//                 <label className="text-sm text-gray-600">To</label>
//                 <input type="date" className="border p-2 rounded" value={attendanceTo} onChange={(e) => setAttendanceTo(e.target.value)} />
//                 <Button color="black" onClick={async () => {
//                   setAttendanceLoading(true);
//                   setAttendanceRecords([]);
//                   try {
//                     const recs = await fetchAttendanceForSweeper(detailSweeper._id || detailSweeper.id, attendanceFrom, attendanceTo);
//                     setAttendanceRecords(recs);
//                   } catch (err) {
//                     console.error(err);
//                   } finally {
//                     setAttendanceLoading(false);
//                   }
//                 }}>
//                   Refresh
//                 </Button>

//                 <Button variant="outline" color="secondary" onClick={() => {
//                   if (!attendanceRecords || attendanceRecords.length === 0) { window.alert("No records to export"); return; }
//                   const header = ["date","time","recordedAt"];
//                   const rows = attendanceRecords.map((a) => {
//                     const date = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//                     const time = a.date ? moment(a.date).format("HH:mm:ss") : "";
//                     const recorded = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "";
//                     return [date,time,recorded].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",");
//                   });
//                   const csv = [header.join(","),...rows].join("\n");
//                   const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
//                   const url = URL.createObjectURL(blob);
//                   const a = document.createElement('a');
//                   a.href = url;
//                   a.download = `${detailSweeper.name||'sweeper'}_attendance_${attendanceFrom}_${attendanceTo}.csv`;
//                   document.body.appendChild(a);
//                   a.click();
//                   a.remove();
//                   URL.revokeObjectURL(url);
//                 }}>
//                   <FaDownload className="mr-2" /> Export CSV
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
//                         <th className="px-3 py-2 text-left">Recorded At</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {attendanceRecords.map((a) => (
//                         <tr key={a._id || `${a.date}-${a.sweeperId}`}>
//                           <td className="px-3 py-2">{moment(a.date).format("YYYY-MM-DD")}</td>
//                           <td className="px-3 py-2">{moment(a.date).format("HH:mm:ss")}</td>
//                           <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>

//             {/* Alarm section unchanged from prior version; shows per-sweeper events and details */}
//             <div className="mb-4">
//               <div className="flex items-center justify-between mb-2">
//                 <h4 className="font-medium">Alarm / Events (history)</h4>
//                 <div className="flex items-center space-x-2">
//                   <Button variant="outline" color="secondary" onClick={() => setShowFullAlarmHistory((v) => !v)}>
//                     <FaHistory className="mr-2" /> {showFullAlarmHistory ? "Show Recent" : "Show Full History"}
//                   </Button>
//                 </div>
//               </div>

//               <div className="overflow-x-auto max-h-64">
//                 {(() => {
//                   const summary = alarmsSummary[detailSweeper._id || detailSweeper.id] || {};
//                   const events = showFullAlarmHistory ? (summary.full || []) : (summary.recent || []);
//                   if (!events || events.length === 0) {
//                     return <div className="text-sm text-gray-500">No alarm events found.</div>;
//                   }
//                   return (
//                     <div className="flex">
//                       <div className="w-2/3 overflow-auto">
//                         <table className="min-w-full divide-y divide-gray-200 text-sm">
//                           <thead className="bg-gray-50">
//                             <tr>
//                               <th className="px-3 py-2 text-left">Ring Time</th>
//                               <th className="px-3 py-2 text-left">State</th>
//                               <th className="px-3 py-2 text-left">Opened</th>
//                               <th className="px-3 py-2 text-left">Response (ms)</th>
//                               <th className="px-3 py-2 text-left">Verification</th>
//                               <th className="px-3 py-2 text-left">Attended By</th>
//                               <th className="px-3 py-2 text-left">Info</th>
//                             </tr>
//                           </thead>
//                           <tbody className="bg-white divide-y divide-gray-200">
//                             {events.map((ev) => {
//                               const { opened, verified, skipped, missed, state, attendedBy } = analyzeEvent(ev, detailSweeper._id || detailSweeper.id);
//                               const rowClass = missed ? "bg-red-50" : verified ? "bg-green-50" : "";
//                               return (
//                                 <tr
//                                   key={ev._id || ev.alarmTimestampMs || Math.random()}
//                                   className={`${rowClass} hover:bg-gray-100 cursor-pointer`}
//                                   onClick={() => setSelectedAlarm(ev)}
//                                 >
//                                   <td className="px-3 py-2">{ev.alarmTimestampMs ? moment(Number(ev.alarmTimestampMs)).format("YYYY-MM-DD HH:mm:ss") : "-"}</td>
//                                   <td className="px-3 py-2">{state}</td>
//                                   <td className="px-3 py-2">{opened ? (ev.openedTimestampMs ? `Yes (${moment(Number(ev.openedTimestampMs)).format("HH:mm:ss")})` : "Yes") : "No"}</td>
//                                   <td className="px-3 py-2">{ev.responseMs != null ? ev.responseMs : "-"}</td>
//                                   <td className="px-3 py-2">{ev.verificationTimestampMs ? moment(Number(ev.verificationTimestampMs)).format("YYYY-MM-DD HH:mm:ss") : (ev.verificationStatus || "-")}</td>
//                                   <td className="px-3 py-2">{attendedBy}</td>
//                                   <td className="px-3 py-2">{ev.note || ev.message || "-"}</td>
//                                 </tr>
//                               );
//                             })}
//                           </tbody>
//                         </table>
//                       </div>

//                       <div className="w-1/3 pl-4">
//                         <div className="sticky top-0">
//                           <h5 className="text-sm font-medium mb-2 flex items-center"><FaInfoCircle className="mr-2" /> Selected Alarm Details</h5>
//                           {!selectedAlarm ? (
//                             <div className="text-sm text-gray-500">Click an alarm row to see full details (timestamps, raw fields).</div>
//                           ) : (
//                             <div className="text-sm">
//                               <div className="mb-2"><strong>Alarm time:</strong> {selectedAlarm.alarmTimestampMs ? moment(Number(selectedAlarm.alarmTimestampMs)).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
//                               <div className="mb-2"><strong>Created at:</strong> {selectedAlarm.createdAt ? moment(selectedAlarm.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
//                               <div className="mb-2"><strong>Opened:</strong> {selectedAlarm.opened ? `Yes (${selectedAlarm.openedTimestampMs ? moment(Number(selectedAlarm.openedTimestampMs)).format("YYYY-MM-DD HH:mm:ss") : "-"})` : "No"}</div>
//                               <div className="mb-2"><strong>Response (ms):</strong> {selectedAlarm.responseMs ?? "-"}</div>
//                               <div className="mb-2"><strong>Verification status:</strong> {selectedAlarm.verificationStatus ?? "-"}</div>
//                               <div className="mb-2"><strong>Verification time:</strong> {selectedAlarm.verificationTimestampMs ? moment(Number(selectedAlarm.verificationTimestampMs)).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
//                               <div className="mb-2"><strong>SweeperId (trigger):</strong> {selectedAlarm.sweeperId ?? "-"}</div>
//                               <div className="mb-2"><strong>Raw JSON:</strong></div>
//                               <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto" style={{ maxHeight: 280 }}>
//                                 {JSON.stringify(selectedAlarm, null, 2)}
//                               </pre>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })()}
//               </div>
//             </div>

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

//       {/* Add and Duty modals: keep existing implementations (omitted for brevity) */}
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
  FaUserPlus,
  FaClock,
  FaTrash,
  FaSync,
  FaBell,
  FaDownload,
  FaHistory,
  FaInfoCircle,
} from "react-icons/fa";
import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";
const API_BASE = "https://smc-backend-bjm5.onrender.com";
// If you use a different backend host/port in production, set API_BASE accordingly.

const SweeperList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [sweepers, setSweepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // add/duty/delete UI state (kept minimal)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addZone, setAddZone] = useState("");
  const [addStatus, setAddStatus] = useState("active");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [showDutyModal, setShowDutyModal] = useState(false);
  const [selectedSweeper, setSelectedSweeper] = useState(null);
  const [dutyStart, setDutyStart] = useState("");
  const [dutyEnd, setDutyEnd] = useState("");
  const [savingDuty, setSavingDuty] = useState(false);
  const [dutyError, setDutyError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  // detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSweeper, setDetailSweeper] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFrom, setAttendanceFrom] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
  const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));

  // alarms summary + history
  const [alarmsSummary, setAlarmsSummary] = useState({}); // map sweeperId -> { missed, active, recent:[], full:[] }
  const [alarmsLoading, setAlarmsLoading] = useState(false);
  const [alarmRecords, setAlarmRecords] = useState([]); // current sweeper events shown in modal
  const [showFullAlarmHistory, setShowFullAlarmHistory] = useState(false); // toggle in modal

  // selected alarm (for showing full details)
  const [selectedAlarm, setSelectedAlarm] = useState(null);

  const socketRef = useRef(null);

  // Helpers
  const lastNDates = (n) => {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
    return arr;
  };

  // -------------------------
  // Fetch helpers
  // -------------------------
  const fetchSweepers = async () => {
    const res = await fetch(`${API_BASE}/sweepers`);
    if (!res.ok) throw new Error("Failed to fetch sweepers");
    const json = await res.json();
    return Array.isArray(json.sweepers) ? json.sweepers : [];
  };

  const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
    try {
      const url = new URL(`${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/attendance`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const json = await res.json();
      const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      return records;
    } catch (err) {
      console.warn("fetchAttendanceForSweeper error:", err);
      return [];
    }
  };

  // NEW: helpers to extract embedded alarm events inside sweeper document (older format)
  const normalizeEmbeddedEvent = (ev, sweeper) => {
    const copy = { ...(ev || {}) };
    if (copy.id && !copy._id) copy._id = copy.id;
    if (copy.alarmTimestampMs && typeof copy.alarmTimestampMs !== "number") {
      const p = Number(copy.alarmTimestampMs);
      copy.alarmTimestampMs = isNaN(p) ? null : p;
    } else if (!copy.alarmTimestampMs && copy.alarmTimestamp) {
      const p = Number(copy.alarmTimestamp);
      copy.alarmTimestampMs = isNaN(p) ? null : p;
    }
    if (copy.openedTimestampMs && typeof copy.openedTimestampMs !== "number") {
      const p = Number(copy.openedTimestampMs);
      copy.openedTimestampMs = isNaN(p) ? null : p;
    }
    if (copy.verificationTimestampMs && typeof copy.verificationTimestampMs !== "number") {
      const p = Number(copy.verificationTimestampMs);
      copy.verificationTimestampMs = isNaN(p) ? null : p;
    }
    if (copy.responseMs && typeof copy.responseMs !== "number") {
      const p = Number(copy.responseMs);
      copy.responseMs = isNaN(p) ? null : p;
    }
    if (!copy.sweeperId) copy.sweeperId = sweeper._id || sweeper.id || null;
    // convert createdAt if it's a parseable string/number
    if (copy.createdAt && typeof copy.createdAt !== "object") {
      const parsed = Date.parse(String(copy.createdAt));
      if (!isNaN(parsed)) copy.createdAt = new Date(parsed);
    }
    return copy;
  };

  const extractEmbeddedAlarmEvents = (sweeper) => {
    if (!sweeper || !sweeper.alarmEvents) return [];
    try {
      const out = [];
      if (Array.isArray(sweeper.alarmEvents)) {
        for (const ev of sweeper.alarmEvents) out.push(normalizeEmbeddedEvent(ev, sweeper));
      } else if (typeof sweeper.alarmEvents === "object") {
        // expected shape: { "YYYY-MM-DD": [ ...events ] }
        for (const key of Object.keys(sweeper.alarmEvents)) {
          const arr = Array.isArray(sweeper.alarmEvents[key]) ? sweeper.alarmEvents[key] : [];
          for (const ev of arr) out.push(normalizeEmbeddedEvent(ev, sweeper));
        }
      }
      return out;
    } catch (err) {
      console.warn("extractEmbeddedAlarmEvents error:", err);
      return [];
    }
  };

  // robust alarm fetcher: uses /sweepers/:id/alarmevents and falls back to /alarmevents?sweeperId=...
  // merges API events with embedded events from the sweeper document
  const fetchAlarmsForSweeperView = async (sweeper, fromDateStr, toDateStr) => {
    if (!sweeper) return [];
    setAlarmsLoading(true);
    setAlarmRecords([]);
    try {
      const id = sweeper._id || sweeper.id;
      const url = new URL(`${API_BASE}/sweepers/${encodeURIComponent(id)}/alarmevents`);

      // Convert YYYY-MM-DD -> epoch ms (start/end of day) so server numeric comparison works
      if (fromDateStr) {
        const from = new Date(fromDateStr);
        from.setHours(0, 0, 0, 0);
        url.searchParams.append("from", String(from.getTime()));
      }
      if (toDateStr) {
        const to = new Date(toDateStr);
        to.setHours(23, 59, 59, 999);
        url.searchParams.append("to", String(to.getTime()));
      }

      console.debug("[fetchAlarms] GET", url.toString());
      const res = await fetch(url.toString());
      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : [];
      } catch (e) {
        console.warn("[fetchAlarms] invalid JSON:", text);
        json = [];
      }
      console.debug("[fetchAlarms] status:", res.status, "body:", json);

      let apiEvents = [];
      if (res.ok && Array.isArray(json)) {
        apiEvents = json.map((ev) => ({
          ...ev,
          alarmTimestampMs: ev.alarmTimestampMs ? Number(ev.alarmTimestampMs) : null,
          openedTimestampMs: ev.openedTimestampMs ? Number(ev.openedTimestampMs) : null,
          verificationTimestampMs: ev.verificationTimestampMs ? Number(ev.verificationTimestampMs) : null,
          responseMs: ev.responseMs ? Number(ev.responseMs) : null,
        }));
      } else {
        // fallback
        const fallbackUrl = `${API_BASE}/alarmevents?sweeperId=${encodeURIComponent(id)}`;
        console.debug("[fetchAlarms] Trying fallback GET", fallbackUrl);
        const r2 = await fetch(fallbackUrl);
        const j2 = await r2.json().catch(() => []);
        console.debug("[fetchAlarms fallback] status:", r2.status, "body:", j2);
        const arr = Array.isArray(j2) ? j2 : Array.isArray(j2.alarmevents) ? j2.alarmevents : [];
        apiEvents = arr.map((ev) => ({
          ...ev,
          alarmTimestampMs: ev.alarmTimestampMs ? Number(ev.alarmTimestampMs) : null,
          openedTimestampMs: ev.openedTimestampMs ? Number(ev.openedTimestampMs) : null,
          verificationTimestampMs: ev.verificationTimestampMs ? Number(ev.verificationTimestampMs) : null,
          responseMs: ev.responseMs ? Number(ev.responseMs) : null,
        }));
      }

      // extract embedded events from sweeper doc
      const embedded = extractEmbeddedAlarmEvents(sweeper);

      // merge+dedupe by _id or alarmTimestampMs
      const mergedMap = new Map();
      const pushToMap = (ev) => {
        const key = ev._id ? String(ev._id) : ev.alarmTimestampMs ? `ts:${ev.alarmTimestampMs}` : JSON.stringify(ev);
        if (!mergedMap.has(key)) mergedMap.set(key, ev);
      };
      apiEvents.forEach(pushToMap);
      embedded.forEach(pushToMap);

      const merged = Array.from(mergedMap.values()).sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0));

      setAlarmRecords(merged);
      setAlarmsSummary((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), full: merged, recent: merged.slice(0, 5) } }));
      return merged;
    } catch (err) {
      console.error("fetchAlarmsForSweeperView error:", err);
      setAlarmRecords([]);
      return [];
    } finally {
      setAlarmsLoading(false);
    }
  };

  // -------------------------
  // Main load & summaries
  // -------------------------
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const sw = await fetchSweepers();

      // presence calculation using last 7 days
      const days = 7;
      const dates = lastNDates(days);
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

      const todayKey = dates[dates.length - 1];
      const todayPresentSet = presentByDateAndSweeper[todayKey] || new Set();

      const augmentedSweepers = sw.map((s, idx) => {
        const entries = allResults[idx] || [];
        let lastLocation = null;
        if (entries.length > 0) {
          const latest = entries.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          if (latest && latest.location) lastLocation = latest.location;
        }
        return { ...s, hasToday: todayPresentSet.has(String(s._id || s.id)), lastLocation };
      });

      setSweepers(augmentedSweepers);

      // fetch alarm summaries (last 24h)
      await loadAlarmSummaries(augmentedSweepers);
    } catch (err) {
      console.error("loadData error:", err);
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const loadAlarmSummaries = async (sweepersList) => {
    setAlarmsLoading(true);
    try {
      const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
      const promises = sweepersList.map(async (s) => {
        try {
          const events = await fetchAlarmsForSweeperView(s, null, null); // fetch all for summary filter locally
          const missed = events.filter(
            (ev) =>
              (ev.verificationStatus && String(ev.verificationStatus).toLowerCase() === "skipped") ||
              (!ev.opened && !ev.verificationTimestampMs)
          ).length;
          const active = events.filter((ev) => ev.opened === false).length;
          const recent = events.slice().sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)).slice(0, 5);
          return { id: s._id || s.id, missed, active, recent, full: events.slice().sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)) };
        } catch (err) {
          return { id: s._id || s.id, missed: 0, active: 0, recent: [], full: [] };
        }
      });

      const results = await Promise.all(promises);
      const map = {};
      results.forEach((r) => {
        map[r.id] = { missed: r.missed, active: r.active, recent: r.recent, full: r.full };
      });
      setAlarmsSummary(map);
    } catch (err) {
      console.warn("loadAlarmSummaries error:", err);
    } finally {
      setAlarmsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // socket.io refresh on events
    let s;
    try {
      s = io(API_BASE, { transports: ["websocket", "polling"] });
      socketRef.current = s;
      const onUpdate = () => loadData();
      s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
      s.on("sweeper:added", onUpdate);
      s.on("sweeper:deleted", onUpdate);
      s.on("sweeper:updated", onUpdate);
      s.on("sweeper:duty-time-updated", onUpdate);
      s.on("attendance:marked", onUpdate);
      s.on("alarmevent:created", onUpdate);
    } catch (err) {
      console.warn("socket connect failed:", err);
    }
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // CRUD handlers (add/duty/delete)
  // -------------------------
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

  const to12Hour = (timeStr) => {
    if (!timeStr) return "—";
    const m = moment(timeStr, ["HH:mm", moment.ISO_8601], true);
    return m.isValid() ? m.format("hh:mm A") : timeStr;
  };


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
      } catch { }
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

  // open detail modal: fetch attendance + alarms history
  const openDetail = async (sweeper) => {
    setDetailSweeper(sweeper);
    setShowDetailModal(true);
    setSelectedAlarm(null);
    setAttendanceLoading(true);
    setAttendanceRecords([]);
    setShowFullAlarmHistory(false);
    try {
      const recs = await fetchAttendanceForSweeper(sweeper._id || sweeper.id, attendanceFrom, attendanceTo);
      setAttendanceRecords(recs);
      // fetch alarms and set state for modal (fetchAlarmsForSweeperView will also include embedded events)
      await fetchAlarmsForSweeperView(sweeper, attendanceFrom, attendanceTo);
    } catch (err) {
      console.error("openDetail error:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Utility: determine presence today
  const isPresentToday = (records) => {
    if (!records) return false;
    return records.some((r) => moment(r.date).isSame(moment(), "day"));
  };

  // Utility: determine event state strings and row classes and "attended by" inference
  const analyzeEvent = (ev, currentSweeperId) => {
    const opened = !!ev.opened;
    const verification = ev.verificationStatus ? String(ev.verificationStatus).toLowerCase() : null;
    const verified = verification === "verified";
    const skipped = verification === "skipped";
    const missed = skipped || (!opened && !ev.verificationTimestampMs);
    let state = "Ringed";
    if (verified) state = "Verified";
    else if (skipped) state = "Missed (skipped)";
    else if (!opened) state = "Unopened";

    let attendedBy = "-";
    if (verified) {
      if (String(ev.sweeperId) === String(currentSweeperId)) attendedBy = "Self";
      else attendedBy = "Other";
    } else if (skipped) {
      attendedBy = "Skipped";
    } else if (opened) {
      attendedBy = "Opened";
    }

    return { opened, verified, skipped, missed, state, attendedBy };
  };

  // Render UI (main parts)
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
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Add New Sweeper</h2>

                  {addError && (
                    <div className="text-red-600 text-sm mb-3">{addError}</div>
                  )}

                  <div className="space-y-4">
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder="Name"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                    />

                    <input
                      type="email"
                      className="w-full border p-2 rounded"
                      placeholder="Email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                    />

                    <input
                      type="password"
                      className="w-full border p-2 rounded"
                      placeholder="Password"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                    />

                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      placeholder="Zone"
                      value={addZone}
                      onChange={(e) => setAddZone(e.target.value)}
                    />

                    <select
                      className="w-full border p-2 rounded"
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="outline"
                      color="default"
                      onClick={() => {
                        setShowAddModal(false);
                        setAddError("");
                      }}
                    >
                      Cancel
                    </Button>

                    <Button color="black" onClick={handleAddSweeper} disabled={adding}>
                      {adding ? "Adding..." : "Add Sweeper"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {showDutyModal && selectedSweeper && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Set Duty Time for {selectedSweeper.name}
                  </h2>

                  {dutyError && (
                    <div className="text-red-600 text-sm mb-3">{dutyError}</div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Start Time</label>
                      <input
                        type="time"
                        className="w-full border p-2 rounded"
                        value={dutyStart}
                        onChange={(e) => setDutyStart(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">End Time</label>
                      <input
                        type="time"
                        className="w-full border p-2 rounded"
                        value={dutyEnd}
                        onChange={(e) => setDutyEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="outline"
                      color="default"
                      onClick={() => {
                        setShowDutyModal(false);
                        setSelectedSweeper(null);
                        setDutyError("");
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      color="black"
                      onClick={handleSaveDuty}
                      disabled={savingDuty}
                    >
                      {savingDuty ? "Saving..." : "Save Duty Time"}
                    </Button>
                  </div>
                </div>
              </div>
            )}



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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duty Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList.map((sweeper) => {
                  const isDeleting =
                    deletingId && deletingId === (sweeper._id || sweeper.id);

                  return (
                    <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
                      {/* Name column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="font-medium cursor-pointer text-primary"
                          onClick={() => openDetail(sweeper)}
                        >
                          {sweeper.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sweeper.email || ""}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {sweeper.zone || ""}
                        </div>
                      </td>

                      {/* Duty time column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sweeper.dutyTime &&
                          (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
                          <div className="text-sm">
                            <div>
                              {to12Hour(sweeper.dutyTime?.start)} - {to12Hour(sweeper.dutyTime?.end)}
                            </div>
                          </div>

                        ) : (
                          <div className="text-sm text-gray-500">Not set</div>
                        )}
                        <div className="mt-2">
                          <Button
                            size="sm"
                            color="black"
                            onClick={() => openDutyModal(sweeper)}
                          >
                            <FaClock className="mr-1" /> Duty
                          </Button>
                        </div>
                      </td>

                      {/* Actions column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            color="primary"
                            onClick={() => openDetail(sweeper)}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
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

      {/* Detail Modal */}
      {showDetailModal && detailSweeper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
          <div
            className={`w-full max-w-4xl p-6 rounded-lg shadow-lg bg-white ${isPresentToday(attendanceRecords) ? "border-2 border-green-500" : "border-2 border-red-500"
              }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{detailSweeper.name}</h3>

                <div className="mt-2">
                  {isPresentToday(attendanceRecords) ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800">
                      Present
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800">
                      Absent
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 mt-2">{detailSweeper.email}</div>
                <div className="text-sm text-gray-600">Zone: {detailSweeper.zone || "—"}</div>
                <div className="text-sm text-gray-600">
                  Duty Time: {to12Hour(detailSweeper.dutyTime?.start)} - {to12Hour(detailSweeper.dutyTime?.end)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" color="default" onClick={() => { setShowDetailModal(false); setDetailSweeper(null); setSelectedAlarm(null); }}>
                  Close
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Attendance Records</h4>

              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm text-gray-600">From</label>
                <input type="date" className="border p-2 rounded" value={attendanceFrom} onChange={(e) => setAttendanceFrom(e.target.value)} />
                <label className="text-sm text-gray-600">To</label>
                <input type="date" className="border p-2 rounded" value={attendanceTo} onChange={(e) => setAttendanceTo(e.target.value)} />
                <Button
                  color="black"
                  onClick={async () => {
                    setAttendanceLoading(true);
                    setAttendanceRecords([]);
                    try {
                      // 1) Reload attendance
                      const recs = await fetchAttendanceForSweeper(
                        detailSweeper._id || detailSweeper.id,
                        attendanceFrom,
                        attendanceTo
                      );
                      setAttendanceRecords(recs);

                      // 2) Reload alarm events for this sweeper & date range
                      await fetchAlarmsForSweeperView(
                        detailSweeper,
                        attendanceFrom,
                        attendanceTo
                      );
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setAttendanceLoading(false);
                    }
                  }}
                >
                  Refresh
                </Button>


                <Button variant="outline" color="secondary" onClick={() => {
                  if (!attendanceRecords || attendanceRecords.length === 0) { window.alert("No records to export"); return; }
                  const header = ["attendanceDate", "recordedDate", "recordedTime"];
                  const rows = attendanceRecords.map((a) => {
                    const attendanceDate = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
                    const recordedDate = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "";
                    const recordedTime = a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "";
                    return [attendanceDate, recordedDate, recordedTime].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
                  });
                  const csv = [header.join(","), ...rows].join("\n");
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${detailSweeper.name || 'sweeper'}_attendance_${attendanceFrom}_${attendanceTo}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}>
                  <FaDownload className="mr-2" /> Export CSV
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
                        <th className="px-3 py-2 text-left">Attendance Date</th>
                        <th className="px-3 py-2 text-left">Recorded Date</th>
                        <th className="px-3 py-2 text-left">Recorded Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((a) => (
                        <tr key={a._id || `${a.date}-${a.sweeperId}`}>
                          <td className="px-3 py-2">{a.date ? moment(a.date).format("YYYY-MM-DD") : "-"}</td>
                          <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "-"}</td>
                          <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Alarm / Events History</h4>

              {alarmsLoading ? (
                <div className="text-sm text-gray-500">Loading alarm events...</div>
              ) : alarmRecords.length === 0 ? (
                <div className="text-sm text-gray-500">No alarm events found.</div>
              ) : (
                <div className="overflow-x-auto max-h-72 border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Alarm Time</th>
                        <th className="px-3 py-2 text-left">Opened</th>
                        <th className="px-3 py-2 text-left">Opened Time</th>
                        <th className="px-3 py-2 text-left">Response (ms)</th>
                        <th className="px-3 py-2 text-left">Verification Time</th>
                        <th className="px-3 py-2 text-left">Verification Status</th>
                        <th className="px-3 py-2 text-left">Created At</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {alarmRecords.map((ev) => (
                        <tr
                          key={ev._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedAlarm(ev)}
                        >
                          {/* Alarm time */}
                          <td className="px-3 py-2">
                            {ev.alarmTimestampMs
                              ? moment(Number(ev.alarmTimestampMs)).format("DD MMM YYYY, hh:mm:ss A")
                              : "-"}
                          </td>

                          {/* Opened */}
                          <td className="px-3 py-2">
                            {ev.opened ? "Yes" : "No"}
                          </td>

                          {/* Opened Timestamp */}
                          <td className="px-3 py-2">
                            {ev.openedTimestampMs
                              ? moment(Number(ev.openedTimestampMs)).format("hh:mm:ss A")
                              : "-"}
                          </td>

                          {/* Response */}
                          <td className="px-3 py-2">{ev.responseMs ?? "-"}</td>

                          {/* Verification timestamp */}
                          <td className="px-3 py-2">
                            {ev.verificationTimestampMs
                              ? moment(Number(ev.verificationTimestampMs)).format("DD MMM YYYY, hh:mm:ss A")
                              : "-"}
                          </td>

                          {/* Verification status */}
                          <td className="px-3 py-2">{ev.verificationStatus ?? "-"}</td>

                          {/* CreatedAt */}
                          <td className="px-3 py-2">
                            {ev.createdAt
                              ? moment(ev.createdAt).format("DD MMM YYYY, hh:mm A")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>




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

      {/* Add and Duty modals: keep existing implementations (omitted for brevity) */}
    </div>
  );
};

export default SweeperList;
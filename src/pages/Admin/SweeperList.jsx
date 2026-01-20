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
// // If you use a different backend host/port in production, set API_BASE accordingly.

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
//   const [alarmRecords, setAlarmRecords] = useState([]); // current sweeper events shown in modal
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

//   // NEW: helpers to extract embedded alarm events inside sweeper document (older format)
//   const normalizeEmbeddedEvent = (ev, sweeper) => {
//     const copy = { ...(ev || {}) };
//     if (copy.id && !copy._id) copy._id = copy.id;
//     if (copy.alarmTimestampMs && typeof copy.alarmTimestampMs !== "number") {
//       const p = Number(copy.alarmTimestampMs);
//       copy.alarmTimestampMs = isNaN(p) ? null : p;
//     } else if (!copy.alarmTimestampMs && copy.alarmTimestamp) {
//       const p = Number(copy.alarmTimestamp);
//       copy.alarmTimestampMs = isNaN(p) ? null : p;
//     }
//     if (copy.openedTimestampMs && typeof copy.openedTimestampMs !== "number") {
//       const p = Number(copy.openedTimestampMs);
//       copy.openedTimestampMs = isNaN(p) ? null : p;
//     }
//     if (copy.verificationTimestampMs && typeof copy.verificationTimestampMs !== "number") {
//       const p = Number(copy.verificationTimestampMs);
//       copy.verificationTimestampMs = isNaN(p) ? null : p;
//     }
//     if (copy.responseMs && typeof copy.responseMs !== "number") {
//       const p = Number(copy.responseMs);
//       copy.responseMs = isNaN(p) ? null : p;
//     }
//     if (!copy.sweeperId) copy.sweeperId = sweeper._id || sweeper.id || null;
//     // convert createdAt if it's a parseable string/number
//     if (copy.createdAt && typeof copy.createdAt !== "object") {
//       const parsed = Date.parse(String(copy.createdAt));
//       if (!isNaN(parsed)) copy.createdAt = new Date(parsed);
//     }
//     return copy;
//   };

//   const extractEmbeddedAlarmEvents = (sweeper) => {
//     if (!sweeper || !sweeper.alarmEvents) return [];
//     try {
//       const out = [];
//       if (Array.isArray(sweeper.alarmEvents)) {
//         for (const ev of sweeper.alarmEvents) out.push(normalizeEmbeddedEvent(ev, sweeper));
//       } else if (typeof sweeper.alarmEvents === "object") {
//         // expected shape: { "YYYY-MM-DD": [ ...events ] }
//         for (const key of Object.keys(sweeper.alarmEvents)) {
//           const arr = Array.isArray(sweeper.alarmEvents[key]) ? sweeper.alarmEvents[key] : [];
//           for (const ev of arr) out.push(normalizeEmbeddedEvent(ev, sweeper));
//         }
//       }
//       return out;
//     } catch (err) {
//       console.warn("extractEmbeddedAlarmEvents error:", err);
//       return [];
//     }
//   };

//   // robust alarm fetcher: uses /sweepers/:id/alarmevents and falls back to /alarmevents?sweeperId=...
//   // merges API events with embedded events from the sweeper document
//   const fetchAlarmsForSweeperView = async (sweeper, fromDateStr, toDateStr) => {
//     if (!sweeper) return [];
//     setAlarmsLoading(true);
//     setAlarmRecords([]);
//     try {
//       const id = sweeper._id || sweeper.id;
//       const url = new URL(`${API_BASE}/sweepers/${encodeURIComponent(id)}/alarmevents`);

//       // Convert YYYY-MM-DD -> epoch ms (start/end of day) so server numeric comparison works
//       if (fromDateStr) {
//         const from = new Date(fromDateStr);
//         from.setHours(0, 0, 0, 0);
//         url.searchParams.append("from", String(from.getTime()));
//       }
//       if (toDateStr) {
//         const to = new Date(toDateStr);
//         to.setHours(23, 59, 59, 999);
//         url.searchParams.append("to", String(to.getTime()));
//       }

//       console.debug("[fetchAlarms] GET", url.toString());
//       const res = await fetch(url.toString());
//       const text = await res.text();
//       let json;
//       try {
//         json = text ? JSON.parse(text) : [];
//       } catch (e) {
//         console.warn("[fetchAlarms] invalid JSON:", text);
//         json = [];
//       }
//       console.debug("[fetchAlarms] status:", res.status, "body:", json);

//       let apiEvents = [];
//       if (res.ok && Array.isArray(json)) {
//         apiEvents = json.map((ev) => ({
//           ...ev,
//           alarmTimestampMs: ev.alarmTimestampMs ? Number(ev.alarmTimestampMs) : null,
//           openedTimestampMs: ev.openedTimestampMs ? Number(ev.openedTimestampMs) : null,
//           verificationTimestampMs: ev.verificationTimestampMs ? Number(ev.verificationTimestampMs) : null,
//           responseMs: ev.responseMs ? Number(ev.responseMs) : null,
//         }));
//       } else {
//         // fallback
//         const fallbackUrl = `${API_BASE}/alarmevents?sweeperId=${encodeURIComponent(id)}`;
//         console.debug("[fetchAlarms] Trying fallback GET", fallbackUrl);
//         const r2 = await fetch(fallbackUrl);
//         const j2 = await r2.json().catch(() => []);
//         console.debug("[fetchAlarms fallback] status:", r2.status, "body:", j2);
//         const arr = Array.isArray(j2) ? j2 : Array.isArray(j2.alarmevents) ? j2.alarmevents : [];
//         apiEvents = arr.map((ev) => ({
//           ...ev,
//           alarmTimestampMs: ev.alarmTimestampMs ? Number(ev.alarmTimestampMs) : null,
//           openedTimestampMs: ev.openedTimestampMs ? Number(ev.openedTimestampMs) : null,
//           verificationTimestampMs: ev.verificationTimestampMs ? Number(ev.verificationTimestampMs) : null,
//           responseMs: ev.responseMs ? Number(ev.responseMs) : null,
//         }));
//       }

//       // extract embedded events from sweeper doc
//       const embedded = extractEmbeddedAlarmEvents(sweeper);

//       // merge+dedupe by _id or alarmTimestampMs
//       const mergedMap = new Map();
//       const pushToMap = (ev) => {
//         const key = ev._id ? String(ev._id) : ev.alarmTimestampMs ? `ts:${ev.alarmTimestampMs}` : JSON.stringify(ev);
//         if (!mergedMap.has(key)) mergedMap.set(key, ev);
//       };
//       apiEvents.forEach(pushToMap);
//       embedded.forEach(pushToMap);

//       const merged = Array.from(mergedMap.values()).sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0));

//       setAlarmRecords(merged);
//       setAlarmsSummary((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), full: merged, recent: merged.slice(0, 5) } }));
//       return merged;
//     } catch (err) {
//       console.error("fetchAlarmsForSweeperView error:", err);
//       setAlarmRecords([]);
//       return [];
//     } finally {
//       setAlarmsLoading(false);
//     }
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
//           const events = await fetchAlarmsForSweeperView(s, null, null); // fetch all for summary filter locally
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
//       } catch { }
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

//   const to12Hour = (timeStr) => {
//     if (!timeStr) return "—";
//     const m = moment(timeStr, ["HH:mm", moment.ISO_8601], true);
//     return m.isValid() ? m.format("hh:mm A") : timeStr;
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
//       } catch { }
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
//       // fetch alarms and set state for modal (fetchAlarmsForSweeperView will also include embedded events)
//       await fetchAlarmsForSweeperView(sweeper, attendanceFrom, attendanceTo);
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
//             {showAddModal && (
//               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//                 <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//                   <h2 className="text-xl font-semibold mb-4">Add New Sweeper</h2>

//                   {addError && (
//                     <div className="text-red-600 text-sm mb-3">{addError}</div>
//                   )}

//                   <div className="space-y-4">
//                     <input
//                       type="text"
//                       className="w-full border p-2 rounded"
//                       placeholder="Name"
//                       value={addName}
//                       onChange={(e) => setAddName(e.target.value)}
//                     />

//                     <input
//                       type="email"
//                       className="w-full border p-2 rounded"
//                       placeholder="Email"
//                       value={addEmail}
//                       onChange={(e) => setAddEmail(e.target.value)}
//                     />

//                     <input
//                       type="password"
//                       className="w-full border p-2 rounded"
//                       placeholder="Password"
//                       value={addPassword}
//                       onChange={(e) => setAddPassword(e.target.value)}
//                     />

//                     <input
//                       type="text"
//                       className="w-full border p-2 rounded"
//                       placeholder="Zone"
//                       value={addZone}
//                       onChange={(e) => setAddZone(e.target.value)}
//                     />

//                     <select
//                       className="w-full border p-2 rounded"
//                       value={addStatus}
//                       onChange={(e) => setAddStatus(e.target.value)}
//                     >
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                     </select>
//                   </div>

//                   <div className="flex justify-end gap-3 mt-6">
//                     <Button
//                       variant="outline"
//                       color="default"
//                       onClick={() => {
//                         setShowAddModal(false);
//                         setAddError("");
//                       }}
//                     >
//                       Cancel
//                     </Button>

//                     <Button color="black" onClick={handleAddSweeper} disabled={adding}>
//                       {adding ? "Adding..." : "Add Sweeper"}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {showDutyModal && selectedSweeper && (
//               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//                 <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//                   <h2 className="text-xl font-semibold mb-4">
//                     Set Duty Time for {selectedSweeper.name}
//                   </h2>

//                   {dutyError && (
//                     <div className="text-red-600 text-sm mb-3">{dutyError}</div>
//                   )}

//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm mb-1">Start Time</label>
//                       <input
//                         type="time"
//                         className="w-full border p-2 rounded"
//                         value={dutyStart}
//                         onChange={(e) => setDutyStart(e.target.value)}
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm mb-1">End Time</label>
//                       <input
//                         type="time"
//                         className="w-full border p-2 rounded"
//                         value={dutyEnd}
//                         onChange={(e) => setDutyEnd(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   <div className="flex justify-end gap-3 mt-6">
//                     <Button
//                       variant="outline"
//                       color="default"
//                       onClick={() => {
//                         setShowDutyModal(false);
//                         setSelectedSweeper(null);
//                         setDutyError("");
//                       }}
//                     >
//                       Cancel
//                     </Button>

//                     <Button
//                       color="black"
//                       onClick={handleSaveDuty}
//                       disabled={savingDuty}
//                     >
//                       {savingDuty ? "Saving..." : "Save Duty Time"}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}



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
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Duty Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>

//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting =
//                     deletingId && deletingId === (sweeper._id || sweeper.id);

//                   return (
//                     <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
//                       {/* Name column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div
//                           className="font-medium cursor-pointer text-primary"
//                           onClick={() => openDetail(sweeper)}
//                         >
//                           {sweeper.name || "—"}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {sweeper.email || ""}
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           {sweeper.zone || ""}
//                         </div>
//                       </td>

//                       {/* Duty time column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {sweeper.dutyTime &&
//                           (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
//                           <div className="text-sm">
//                             <div>
//                               {to12Hour(sweeper.dutyTime?.start)} - {to12Hour(sweeper.dutyTime?.end)}
//                             </div>
//                           </div>

//                         ) : (
//                           <div className="text-sm text-gray-500">Not set</div>
//                         )}
//                         <div className="mt-2">
//                           <Button
//                             size="sm"
//                             color="black"
//                             onClick={() => openDutyModal(sweeper)}
//                           >
//                             <FaClock className="mr-1" /> Duty
//                           </Button>
//                         </div>
//                       </td>

//                       {/* Actions column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button
//                             size="sm"
//                             color="primary"
//                             onClick={() => openDetail(sweeper)}
//                           >
//                             Details
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
//             className={`w-full max-w-4xl p-6 rounded-lg shadow-lg bg-white ${isPresentToday(attendanceRecords) ? "border-2 border-green-500" : "border-2 border-red-500"
//               }`}
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
//                 <div className="text-sm text-gray-600">
//                   Duty Time: {to12Hour(detailSweeper.dutyTime?.start)} - {to12Hour(detailSweeper.dutyTime?.end)}
//                 </div>
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
//                 <Button
//                   color="black"
//                   onClick={async () => {
//                     setAttendanceLoading(true);
//                     setAttendanceRecords([]);
//                     try {
//                       // 1) Reload attendance
//                       const recs = await fetchAttendanceForSweeper(
//                         detailSweeper._id || detailSweeper.id,
//                         attendanceFrom,
//                         attendanceTo
//                       );
//                       setAttendanceRecords(recs);

//                       // 2) Reload alarm events for this sweeper & date range
//                       await fetchAlarmsForSweeperView(
//                         detailSweeper,
//                         attendanceFrom,
//                         attendanceTo
//                       );
//                     } catch (err) {
//                       console.error(err);
//                     } finally {
//                       setAttendanceLoading(false);
//                     }
//                   }}
//                 >
//                   Refresh
//                 </Button>


//                 <Button variant="outline" color="secondary" onClick={() => {
//                   if (!attendanceRecords || attendanceRecords.length === 0) { window.alert("No records to export"); return; }
//                   const header = ["attendanceDate", "recordedDate", "recordedTime"];
//                   const rows = attendanceRecords.map((a) => {
//                     const attendanceDate = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//                     const recordedDate = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "";
//                     const recordedTime = a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "";
//                     return [attendanceDate, recordedDate, recordedTime].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
//                   });
//                   const csv = [header.join(","), ...rows].join("\n");
//                   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//                   const url = URL.createObjectURL(blob);
//                   const a = document.createElement('a');
//                   a.href = url;
//                   a.download = `${detailSweeper.name || 'sweeper'}_attendance_${attendanceFrom}_${attendanceTo}.csv`;
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
//                         <th className="px-3 py-2 text-left">Attendance Date</th>
//                         <th className="px-3 py-2 text-left">Recorded Date</th>
//                         <th className="px-3 py-2 text-left">Recorded Time</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {attendanceRecords.map((a) => (
//                         <tr key={a._id || `${a.date}-${a.sweeperId}`}>
//                           <td className="px-3 py-2">{a.date ? moment(a.date).format("YYYY-MM-DD") : "-"}</td>
//                           <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "-"}</td>
//                           <td className="px-3 py-2">{a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "-"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//             <div className="mb-4">
//               <h4 className="font-medium mb-2">Alarm / Events History</h4>

//               {alarmsLoading ? (
//                 <div className="text-sm text-gray-500">Loading alarm events...</div>
//               ) : alarmRecords.length === 0 ? (
//                 <div className="text-sm text-gray-500">No alarm events found.</div>
//               ) : (
//                 <div className="overflow-x-auto max-h-72 border rounded-lg">
//                   <table className="min-w-full divide-y divide-gray-200 text-sm">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left">Alarm Time</th>
//                         <th className="px-3 py-2 text-left">Opened</th>
//                         <th className="px-3 py-2 text-left">Opened Time</th>
//                         <th className="px-3 py-2 text-left">Response (ms)</th>
//                         <th className="px-3 py-2 text-left">Verification Time</th>
//                         <th className="px-3 py-2 text-left">Verification Status</th>
//                         <th className="px-3 py-2 text-left">Created At</th>
//                       </tr>
//                     </thead>

//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {alarmRecords.map((ev) => (
//                         <tr
//                           key={ev._id}
//                           className="hover:bg-gray-50 cursor-pointer"
//                           onClick={() => setSelectedAlarm(ev)}
//                         >
//                           {/* Alarm time */}
//                           <td className="px-3 py-2">
//                             {ev.alarmTimestampMs
//                               ? moment(Number(ev.alarmTimestampMs)).format("DD MMM YYYY, hh:mm:ss A")
//                               : "-"}
//                           </td>

//                           {/* Opened */}
//                           <td className="px-3 py-2">
//                             {ev.opened ? "Yes" : "No"}
//                           </td>

//                           {/* Opened Timestamp */}
//                           <td className="px-3 py-2">
//                             {ev.openedTimestampMs
//                               ? moment(Number(ev.openedTimestampMs)).format("hh:mm:ss A")
//                               : "-"}
//                           </td>

//                           {/* Response */}
//                           <td className="px-3 py-2">{ev.responseMs ?? "-"}</td>

//                           {/* Verification timestamp */}
//                           <td className="px-3 py-2">
//                             {ev.verificationTimestampMs
//                               ? moment(Number(ev.verificationTimestampMs)).format("DD MMM YYYY, hh:mm:ss A")
//                               : "-"}
//                           </td>

//                           {/* Verification status */}
//                           <td className="px-3 py-2">{ev.verificationStatus ?? "-"}</td>

//                           {/* CreatedAt */}
//                           <td className="px-3 py-2">
//                             {ev.createdAt
//                               ? moment(ev.createdAt).format("DD MMM YYYY, hh:mm A")
//                               : "-"}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
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
//   FaCheckCircle,
//   FaTimesCircle,
//   FaMapMarkerAlt,
// } from "react-icons/fa";
// import { io } from "socket.io-client";

// // const API_BASE = "http://localhost:3000";
// // const API_BASE = "https://smc-backend-bjm5.onrender.com";
// const API_BASE = "https://smcbakcenddummy.onrender.com";

// // Helper to get today's YYYY-MM-DD
// const todayKey = moment().format("YYYY-MM-DD");

// // Process alarm summary for a sweeper
// // NEW CODE - Shows ALL alarms from all dates

// // Update the processAlarmSummary function to return today's stats
// const processAlarmSummary = (sweeper) => {
//   let allAlarms = [];
//   try {
//     if (sweeper.alarmEvents && typeof sweeper.alarmEvents === "object") {
//       // Extract all alarms from all date keys
//       for (const dateKey of Object.keys(sweeper.alarmEvents)) {
//         if (Array.isArray(sweeper.alarmEvents[dateKey])) {
//           sweeper.alarmEvents[dateKey].forEach((ev) => {
//             allAlarms.push({
//               ...ev,
//               verificationStatus: ev.verificationStatus
//                 ? ev.verificationStatus.toLowerCase()
//                 : "",
//               dateKey: dateKey,
//             });
//           });
//         }
//       }
//     }
//   } catch (err) {
//     console.warn("processAlarmSummary error:", err);
//   }

//   // All-time stats
//   const total = allAlarms.length;
//   const attended = allAlarms.filter(
//     (ev) => ev.verificationStatus === "attended"
//   ).length;
//   const missed = allAlarms.filter(
//     (ev) =>
//       ev.verificationStatus === "missed" ||
//       ev.verificationStatus === "skipped" ||
//       (!ev.opened && !ev.verificationTimestampMs)
//   ).length;

//   // Today's alarms
//   let todayAlarms = [];
//   if (sweeper.alarmEvents && Array.isArray(sweeper.alarmEvents[todayKey])) {
//     todayAlarms = sweeper.alarmEvents[todayKey].map((ev) => ({
//       ...ev,
//       verificationStatus: ev.verificationStatus
//         ? ev.verificationStatus.toLowerCase()
//         : "",
//     }));
//   }

//   // TODAY'S STATS - ADD THIS
//   const todayTotal = todayAlarms.length;
//   const todayAttended = todayAlarms.filter(
//     (ev) => ev.verificationStatus === "attended"
//   ).length;
//   const todayMissed = todayAlarms.filter(
//     (ev) =>
//       ev.verificationStatus === "missed" ||
//       ev.verificationStatus === "skipped" ||
//       (!ev.opened && !ev.verificationTimestampMs)
//   ).length;

//   return {
//     total,           // all-time total
//     attended,        // all-time attended
//     missed,          // all-time missed
//     allAlarms,
//     todayAlarms,
//     // ADD THESE NEW FIELDS
//     todayTotal,
//     todayAttended,
//     todayMissed,
//   };
// };

// const SweeperList = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterZone, setFilterZone] = useState("");
//   const [sweepers, setSweepers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // add/duty/delete UI state
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
//   // const [attendanceFrom, setAttendanceFrom] = useState(
//   //   moment().subtract(7, "days").format("YYYY-MM-DD")
//   // );
//   // const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));
//   // Set default date range to December 2025 where dummy data exists
//   const [attendanceFrom, setAttendanceFrom] = useState("2025-12-15");
//   const [attendanceTo, setAttendanceTo] = useState("2025-12-21");
//   // alarms summary + history
//   const [alarmsSummary, setAlarmsSummary] = useState({});
//   const [alarmsLoading, setAlarmsLoading] = useState(false);
//   const [alarmRecords, setAlarmRecords] = useState([]);
//   const [showFullAlarmHistory, setShowFullAlarmHistory] = useState(false);
//   const [selectedAlarm, setSelectedAlarm] = useState(null);

//   // Tab state for detail modal
//   const [activeTab, setActiveTab] = useState("attendance");

//   const socketRef = useRef(null);

//   // Helpers
//   const lastNDates = (n) => {
//     const arr = [];
//     for (let i = n - 1; i >= 0; i--)
//       arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
//     return arr;
//   };

//   const fetchSweepers = async () => {
//     const res = await fetch(`${API_BASE}/sweepers`);
//     if (!res.ok) throw new Error("Failed to fetch sweepers");
//     const json = await res.json();
//     return Array.isArray(json.sweepers) ? json.sweepers : [];
//   };

//   const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
//     try {
//       const url = new URL(
//         `${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/attendance`
//       );
//       if (from) url.searchParams.append("from", from);
//       if (to) url.searchParams.append("to", to);
//       const res = await fetch(url.toString());
//       if (!res.ok) return [];
//       const json = await res.json();
//       const records = Array.isArray(json.attendanceHistory)
//         ? json.attendanceHistory
//         : [];
//       records.sort((a, b) => new Date(b.date) - new Date(a.date));
//       return records;
//     } catch (err) {
//       console.warn("fetchAttendanceForSweeper error:", err);
//       return [];
//     }
//   };

//   // Normalize embedded event
//   const normalizeEmbeddedEvent = (ev, sweeper) => {
//     const copy = { ... (ev || {}) };
//     if (copy.id && !copy._id) copy._id = copy.id;
//     if (copy.alarmTimestampMs && typeof copy.alarmTimestampMs !== "number") {
//       const p = Number(copy.alarmTimestampMs);
//       copy.alarmTimestampMs = isNaN(p) ? null : p;
//     } else if (!copy.alarmTimestampMs && copy.alarmTimestamp) {
//       const p = Number(copy.alarmTimestamp);
//       copy.alarmTimestampMs = isNaN(p) ? null : p;
//     }
//     if (copy.openedTimestampMs && typeof copy.openedTimestampMs !== "number") {
//       const p = Number(copy.openedTimestampMs);
//       copy.openedTimestampMs = isNaN(p) ? null : p;
//     }
//     if (
//       copy.verificationTimestampMs &&
//       typeof copy.verificationTimestampMs !== "number"
//     ) {
//       const p = Number(copy.verificationTimestampMs);
//       copy.verificationTimestampMs = isNaN(p) ? null : p;
//     }
//     if (copy.responseMs && typeof copy.responseMs !== "number") {
//       const p = Number(copy.responseMs);
//       copy.responseMs = isNaN(p) ? null : p;
//     }
//     if (!copy.sweeperId) copy.sweeperId = sweeper._id || sweeper.id || null;
//     if (copy.createdAt && typeof copy.createdAt !== "object") {
//       const parsed = Date.parse(String(copy.createdAt));
//       if (!isNaN(parsed)) copy.createdAt = new Date(parsed);
//     }
//     return copy;
//   };

//   const extractEmbeddedAlarmEvents = (sweeper) => {
//     if (!sweeper || !sweeper.alarmEvents) return [];
//     try {
//       const out = [];
//       if (Array.isArray(sweeper.alarmEvents)) {
//         for (const ev of sweeper.alarmEvents)
//           out.push(normalizeEmbeddedEvent(ev, sweeper));
//       } else if (typeof sweeper.alarmEvents === "object") {
//         for (const key of Object.keys(sweeper.alarmEvents)) {
//           const arr = Array.isArray(sweeper.alarmEvents[key])
//             ? sweeper.alarmEvents[key]
//             : [];
//           for (const ev of arr) out.push(normalizeEmbeddedEvent(ev, sweeper));
//         }
//       }
//       return out;
//     } catch (err) {
//       console.warn("extractEmbeddedAlarmEvents error:", err);
//       return [];
//     }
//   };

//   // const fetchAlarmsForSweeperView = async (sweeper, fromDateStr, toDateStr) => {
//   //   if (!sweeper) return [];
//   //   setAlarmsLoading(true);
//   //   setAlarmRecords([]);

//   //   console.log("🔍 FETCH ALARMS CALLED FOR:", sweeper.name);
//   //   console.log("🔍 Date range:", fromDateStr, "to", toDateStr);

//   //   try {
//   //     const id = sweeper._id || sweeper.id;
//   //     const url = new URL(
//   //       `${API_BASE}/sweepers/${encodeURIComponent(id)}/alarmevents`
//   //     );

//   //     if (fromDateStr) {
//   //       const from = new Date(fromDateStr);
//   //       from.setHours(0, 0, 0, 0);
//   //       url.searchParams.append("from", String(from.getTime()));
//   //       console.log("🔍 FROM timestamp:", from.getTime(), "=", from.toISOString());
//   //     }
//   //     if (toDateStr) {
//   //       const to = new Date(toDateStr);
//   //       to.setHours(23, 59, 59, 999);
//   //       url.searchParams.append("to", String(to.getTime()));
//   //       console.log("🔍 TO timestamp:", to.getTime(), "=", to.toISOString());
//   //     }

//   //     console.debug("[fetchAlarms] GET", url.toString());
//   //     const res = await fetch(url.toString());
//   //     const text = await res.text();
//   //     let json;
//   //     try {
//   //       json = text ? JSON.parse(text) : [];
//   //     } catch (e) {
//   //       console.warn("[fetchAlarms] invalid JSON:", text);
//   //       json = [];
//   //     }
//   //     console.debug("[fetchAlarms] status:", res.status, "body:", json);

//   //     // 🔍 DEBUG: Check what API returned
//   //     console.log("🔍 API RETURNED:", Array.isArray(json) ? json.length : 0, "events");
//   //     if (Array.isArray(json) && json.length > 0) {
//   //       console.log("🔍 First event:", json[0]);
//   //       console.log("🔍 Last event:", json[json.length - 1]);
//   //     }

//   //     let apiEvents = [];
//   //     if (res.ok && Array.isArray(json)) {
//   //       apiEvents = json.map((ev) => ({
//   //         ...ev,
//   //         alarmTimestampMs: ev.alarmTimestampMs
//   //           ? Number(ev.alarmTimestampMs)
//   //           : null,
//   //         openedTimestampMs: ev.openedTimestampMs
//   //           ? Number(ev.openedTimestampMs)
//   //           : null,
//   //         verificationTimestampMs: ev.verificationTimestampMs
//   //           ? Number(ev.verificationTimestampMs)
//   //           : null,
//   //         responseMs: ev.responseMs ? Number(ev.responseMs) : null,
//   //       }));
//   //     } else {
//   //       const fallbackUrl = `${API_BASE}/alarmevents? sweeperId=${encodeURIComponent(id)}`;
//   //       console.debug("[fetchAlarms] Trying fallback GET", fallbackUrl);
//   //       const r2 = await fetch(fallbackUrl);
//   //       const j2 = await r2.json().catch(() => []);
//   //       console.debug("[fetchAlarms fallback] status:", r2.status, "body:", j2);
//   //       const arr = Array.isArray(j2)
//   //         ? j2
//   //         : Array.isArray(j2.alarmevents)
//   //           ? j2.alarmevents
//   //           : [];
//   //       apiEvents = arr.map((ev) => ({
//   //         ...ev,
//   //         alarmTimestampMs: ev.alarmTimestampMs
//   //           ? Number(ev.alarmTimestampMs)
//   //           : null,
//   //         openedTimestampMs: ev.openedTimestampMs
//   //           ? Number(ev.openedTimestampMs)
//   //           : null,
//   //         verificationTimestampMs: ev.verificationTimestampMs
//   //           ? Number(ev.verificationTimestampMs)
//   //           : null,
//   //         responseMs: ev.responseMs ? Number(ev.responseMs) : null,
//   //       }));
//   //     }

//   //     console.log("🔍 MAPPED apiEvents:", apiEvents.length);

//   //     const embedded = extractEmbeddedAlarmEvents(sweeper);
//   //     console.log("🔍 EMBEDDED events from sweeper object:", embedded.length);

//   //     const mergedMap = new Map();
//   //     const pushToMap = (ev) => {
//   //       const key = ev._id
//   //         ? String(ev._id)
//   //         : ev.alarmTimestampMs
//   //           ? `ts:${ev.alarmTimestampMs}`
//   //           : JSON.stringify(ev);
//   //       if (!mergedMap.has(key)) mergedMap.set(key, ev);
//   //     };
//   //     apiEvents.forEach(pushToMap);
//   //     embedded.forEach(pushToMap);

//   //     const merged = Array.from(mergedMap.values()).sort(
//   //       (a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)
//   //     );

//   //     console.log("🔍 FINAL MERGED:", merged.length, "events");

//   //     setAlarmRecords(merged);
//   //     setAlarmsSummary((prev) => ({
//   //       ...prev,
//   //       [id]: {
//   //         ...(prev[id] || {}),
//   //         full: merged,
//   //         recent: merged.slice(0, 5),
//   //       },
//   //     }));
//   //     return merged;
//   //   } catch (err) {
//   //     console.error("fetchAlarmsForSweeperView error:", err);
//   //     setAlarmRecords([]);
//   //     return [];
//   //   } finally {
//   //     setAlarmsLoading(false);
//   //   }
//   // };

//   const fetchAlarmsForSweeperView = async (sweeper, fromDateStr, toDateStr) => {
//     if (!sweeper) return [];

//     setAlarmsLoading(true);
//     setAlarmRecords([]);

//     try {
//       // 1️⃣ Extract embedded alarms only
//       let embedded = extractEmbeddedAlarmEvents(sweeper);

//       // 2️⃣ Apply date filter if provided
//       if (fromDateStr || toDateStr) {
//         const fromMs = fromDateStr
//           ? new Date(fromDateStr).setHours(0, 0, 0, 0)
//           : null;
//         const toMs = toDateStr
//           ? new Date(toDateStr).setHours(23, 59, 59, 999)
//           : null;

//         embedded = embedded.filter(ev => {
//           const t = Number(ev.alarmTimestampMs);
//           if (!t) return false;
//           if (fromMs && t < fromMs) return false;
//           if (toMs && t > toMs) return false;
//           return true;
//         });
//       }

//       // 3️⃣ Sort newest first
//       embedded.sort(
//         (a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)
//       );

//       // 4️⃣ Update UI state
//       setAlarmRecords(embedded);
//       setAlarmsSummary(prev => ({
//         ...prev,
//         [sweeper._id || sweeper.id]: {
//           ...(prev[sweeper._id || sweeper.id] || {}),
//           full: embedded,
//           recent: embedded.slice(0, 5),
//         },
//       }));

//       return embedded;
//     } catch (err) {
//       console.error("fetchAlarmsForSweeperView error:", err);
//       setAlarmRecords([]);
//       return [];
//     } finally {
//       setAlarmsLoading(false);
//     }
//   };


//   const loadData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const sw = await fetchSweepers();

//       const days = 7;
//       const dates = lastNDates(days);
//       const from = dates[0];
//       const to = dates[dates.length - 1];

//       const attendancePromises = sw.map((s) =>
//         fetch(
//           `${API_BASE}/sweepers/${s._id || s.id}/attendance? from=${from}&to=${to}`
//         )
//           .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
//           .then((j) =>
//             Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []
//           )
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
//           if (presentByDateAndSweeper[key])
//             presentByDateAndSweeper[key].add(sweeperId);
//         });
//       });

//       const todayKeyVal = dates[dates.length - 1];
//       const todayPresentSet = presentByDateAndSweeper[todayKeyVal] || new Set();

//       const augmentedSweepers = sw.map((s, idx) => {
//         const entries = allResults[idx] || [];
//         let lastLocation = null;
//         if (entries.length > 0) {
//           const latest = entries
//             .slice()
//             .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
//           if (latest && latest.location) lastLocation = latest.location;
//         }

//         // ✅ NEW: Check if sweeper has any alarm events for today
//         const todayAlarms = s.alarmEvents && s.alarmEvents[todayKeyVal]
//           ? s.alarmEvents[todayKeyVal]
//           : [];
//         const hasTodayAlarms = Array.isArray(todayAlarms) && todayAlarms.length > 0;

//         return {
//           ...s,
//           hasToday: hasTodayAlarms, // ✅ Changed from attendance-based to alarm-based
//           lastLocation,
//         };
//       });

//       setSweepers(augmentedSweepers);
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
//           const events = await fetchAlarmsForSweeperView(s, null, null);
//           const missed = events.filter(
//             (ev) =>
//               (ev.verificationStatus &&
//                 String(ev.verificationStatus).toLowerCase() === "skipped") ||
//               (!ev.opened && !ev.verificationTimestampMs)
//           ).length;
//           const active = events.filter((ev) => ev.opened === false).length;
//           const recent = events
//             .slice()
//             .sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0))
//             .slice(0, 5);
//           return {
//             id: s._id || s.id,
//             missed,
//             active,
//             recent,
//             full: events
//               .slice()
//               .sort(
//                 (a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)
//               ),
//           };
//         } catch (err) {
//           return {
//             id: s._id || s.id,
//             missed: 0,
//             active: 0,
//             recent: [],
//             full: [],
//           };
//         }
//       });

//       const results = await Promise.all(promises);
//       const map = {};
//       results.forEach((r) => {
//         map[r.id] = {
//           missed: r.missed,
//           active: r.active,
//           recent: r.recent,
//           full: r.full,
//         };
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
//       } catch { }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

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
//       if (!res.ok || !data?.success)
//         throw new Error(data?.message || `Failed to add sweeper (${res.status})`);
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

//   const to12Hour = (timeStr) => {
//     if (!timeStr) return "—";
//     const m = moment(timeStr, ["HH:mm", moment.ISO_8601], true);
//     return m.isValid() ? m.format("hh:mm A") : timeStr;
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
//       const res = await fetch(
//         `${API_BASE}/sweepers/${selectedSweeper._id || selectedSweeper.id}/duty-time`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );
//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         throw new Error("Unexpected response when saving duty time.");
//       }
//       if (!res.ok || !data?.success)
//         throw new Error(
//           data?.message || `Failed to save duty time (${res.status})`
//         );
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
//     const confirm = window.confirm(
//       `Delete sweeper "${sweeper.name}"?  This will remove the sweeper and associated data.`
//     );
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
//       } catch { }
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

//   const openDetail = async (sweeper) => {
//     setDetailSweeper(sweeper);
//     setShowDetailModal(true);
//     setSelectedAlarm(null);
//     setActiveTab("attendance");
//     setAttendanceLoading(true);
//     setAttendanceRecords([]);
//     setShowFullAlarmHistory(false);

//     // Use December 2025 date range for dummy data
//     const from = "2025-12-15";
//     const to = "2025-12-21";

//     try {
//       const recs = await fetchAttendanceForSweeper(
//         sweeper._id || sweeper.id,
//         from,
//         to
//       );
//       setAttendanceRecords(recs);
//       await fetchAlarmsForSweeperView(sweeper, from, to);
//     } catch (err) {
//       console.error("openDetail error:", err);
//     } finally {
//       setAttendanceLoading(false);
//     }
//   };
//   const isPresentToday = (records) => {
//     if (!records) return false;
//     return records.some((r) => moment(r.date).isSame(moment(), "day"));
//   };

//   const analyzeEvent = (ev, currentSweeperId) => {
//     const opened = !!ev.opened;
//     const verification = ev.verificationStatus
//       ? String(ev.verificationStatus).toLowerCase()
//       : null;
//     const verified = verification === "attended";
//     const skipped = verification === "skipped";
//     const missed = skipped || (!opened && !ev.verificationTimestampMs);
//     let state = "Ringed";
//     if (verified) state = "Attended";
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

//   const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));
//   const filteredList = sweepers.filter((sweeper) => {
//     const nameMatch = sweeper.name
//       ? sweeper.name.toLowerCase().includes(searchTerm.toLowerCase())
//       : false;
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
//                 className="pl-9 pr-4 py-2 w-full border rounded-lg focus: ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             </div>

//             {/* <select
//               className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus: outline-none"
//               value={filterZone}
//               onChange={(e) => setFilterZone(e.target.value)}
//             >
//               <option value="">All Zones</option>
//               {zones.map((z) => (
//                 <option value={z} key={z}>
//                   {z}
//                 </option>
//               ))}
//             </select> */}
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
//             <div className="p-6 text-center text-gray-500">No sweepers found. </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Attendance
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Duty Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Today's Alarms
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>

//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredList.map((sweeper) => {
//                   const isDeleting =
//                     deletingId && deletingId === (sweeper._id || sweeper.id);
//                   const attendanceToday = sweeper.hasToday ? "Present" : "Day not started";
//                   const summary = processAlarmSummary(sweeper);

//                   return (
//                     <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
//                       {/* Name column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div
//                           className="font-medium cursor-pointer text-primary hover:underline"
//                           onClick={() => openDetail(sweeper)}
//                         >
//                           {sweeper.name || "—"}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {sweeper.email || ""}
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           {sweeper.zone || ""}
//                         </div>
//                       </td>

//                       {/* Attendance column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${attendanceToday === "Present"
//                             ? "bg-green-100 text-green-700 border border-green-300"
//                             : "bg-gray-100 text-gray-700 border border-gray-300"
//                             }`}
//                         >
//                           {attendanceToday}
//                         </span>
//                       </td>

//                       {/* Duty time column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm">
//                           {sweeper.dutyTime &&
//                             (sweeper.dutyTime.start || sweeper.dutyTime.end)
//                             ? `${to12Hour(sweeper.dutyTime?.start)} - ${to12Hour(
//                               sweeper.dutyTime?.end
//                             )}`
//                             : "Not set"}
//                         </div>
//                         <div className="mt-1">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             color="default"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               openDutyModal(sweeper);
//                             }}
//                           >
//                             <FaClock className="mr-1" /> Set Duty
//                           </Button>
//                         </div>
//                       </td>

//                       {/* Today's Alarms Summary */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex flex-col gap-1 text-sm">
//                           <div>
//                             <span className="font-semibold">{summary.total}</span>{" "}
//                             alarm{summary.total !== 1 ? "s" : ""}
//                           </div>
//                           {summary.total > 0 && (
//                             <div className="flex gap-2">
//                               <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
//                                 <FaCheckCircle className="inline mr-1" />
//                                 {summary.attended} attended
//                               </span>
//                               <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
//                                 <FaTimesCircle className="inline mr-1" />
//                                 {summary.missed} missed
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </td>

//                       {/* Actions column */}
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex space-x-2">
//                           <Button
//                             size="sm"
//                             color="primary"
//                             onClick={() => openDetail(sweeper)}
//                           >
//                             <FaInfoCircle className="mr-1" /> Details
//                           </Button>
//                           <Button
//                             size="sm"
//                             color="danger"
//                             iconOnly
//                             title="Delete Sweeper"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDeleteSweeper(sweeper);
//                             }}
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

//       {/* Add Sweeper Modal */}
//       {showAddModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h2 className="text-xl font-semibold mb-4">Add New Sweeper</h2>

//             {addError && (
//               <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
//                 {addError}
//               </div>
//             )}

//             <div className="space-y-4">
//               <input
//                 type="text"
//                 className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
//                 placeholder="Name"
//                 value={addName}
//                 onChange={(e) => setAddName(e.target.value)}
//               />

//               <input
//                 type="email"
//                 className="w-full border p-2 rounded focus: ring-2 focus:ring-primary/20"
//                 placeholder="Email"
//                 value={addEmail}
//                 onChange={(e) => setAddEmail(e.target.value)}
//               />

//               <input
//                 type="password"
//                 className="w-full border p-2 rounded focus: ring-2 focus:ring-primary/20"
//                 placeholder="Password"
//                 value={addPassword}
//                 onChange={(e) => setAddPassword(e.target.value)}
//               />

//               <input
//                 type="text"
//                 className="w-full border p-2 rounded focus: ring-2 focus:ring-primary/20"
//                 placeholder="Zone"
//                 value={addZone}
//                 onChange={(e) => setAddZone(e.target.value)}
//               />

//               <select
//                 className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
//                 value={addStatus}
//                 onChange={(e) => setAddStatus(e.target.value)}
//               >
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//             </div>

//             <div className="flex justify-end gap-3 mt-6">
//               <Button
//                 variant="outline"
//                 color="default"
//                 onClick={() => {
//                   setShowAddModal(false);
//                   setAddError("");
//                 }}
//               >
//                 Cancel
//               </Button>

//               <Button color="black" onClick={handleAddSweeper} disabled={adding}>
//                 {adding ? "Adding..." : "Add Sweeper"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Duty Time Modal */}
//       {showDutyModal && selectedSweeper && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h2 className="text-xl font-semibold mb-4">
//               Set Duty Time for {selectedSweeper.name}
//             </h2>

//             {dutyError && (
//               <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
//                 {dutyError}
//               </div>
//             )}

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm mb-1 font-medium">
//                   Start Time
//                 </label>
//                 <input
//                   type="time"
//                   className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
//                   value={dutyStart}
//                   onChange={(e) => setDutyStart(e.target.value)}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm mb-1 font-medium">End Time</label>
//                 <input
//                   type="time"
//                   className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
//                   value={dutyEnd}
//                   onChange={(e) => setDutyEnd(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end gap-3 mt-6">
//               <Button
//                 variant="outline"
//                 color="default"
//                 onClick={() => {
//                   setShowDutyModal(false);
//                   setSelectedSweeper(null);
//                   setDutyError("");
//                 }}
//               >
//                 Cancel
//               </Button>

//               <Button color="black" onClick={handleSaveDuty} disabled={savingDuty}>
//                 {savingDuty ? "Saving..." : "Save Duty Time"}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Detail Modal */}
//       {showDetailModal && detailSweeper && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
//           <div
//             className={`w-full max-w-5xl p-6 rounded-lg shadow-lg bg-white ${isPresentToday(attendanceRecords)
//               ? "border-4 border-green-500"
//               : "border-4 border-red-500"
//               }`}
//           >
//             {/* Header */}
//             <div className="flex justify-between items-start mb-6">
//               <div className="flex-1">
//                 <h3 className="text-2xl font-semibold">{detailSweeper.name}</h3>

//                 <div className="mt-2">
//                   {isPresentToday(attendanceRecords) ? (
//                     <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border-2 border-green-400 text-green-800 font-medium">
//                       <FaCheckCircle className="mr-2" /> Present Today
//                     </div>
//                   ) : (
//                     <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 border-2 border-red-400 text-red-800 font-medium">
//                       <FaTimesCircle className="mr-2" /> Absent Today
//                     </div>
//                   )}
//                 </div>

//                 <div className="text-sm text-gray-600 mt-3 space-y-1">
//                   <div>
//                     <strong>Email:</strong> {detailSweeper.email}
//                   </div>
//                   <div>
//                     <strong>Zone: </strong> {detailSweeper.zone || "—"}
//                   </div>
//                   <div>
//                     <strong>Duty Time:</strong>{" "}
//                     {to12Hour(detailSweeper.dutyTime?.start)} -{" "}
//                     {to12Hour(detailSweeper.dutyTime?.end)}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="outline"
//                   color="default"
//                   onClick={() => {
//                     setShowDetailModal(false);
//                     setDetailSweeper(null);
//                     setSelectedAlarm(null);
//                   }}
//                 >
//                   Close
//                 </Button>
//               </div>
//             </div>

//             {/* Tabs */}
//             <div className="border-b border-gray-200 mb-4">
//               <nav className="flex space-x-4">
//                 <button
//                   className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === "attendance"
//                     ? "border-primary text-primary"
//                     : "border-transparent text-gray-500 hover:text-gray-700"
//                     }`}
//                   onClick={() => setActiveTab("attendance")}
//                 >
//                   <FaHistory className="inline mr-2" />
//                   Attendance History
//                 </button>
//                 <button
//                   className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === "alarms"
//                     ? "border-primary text-primary"
//                     : "border-transparent text-gray-500 hover:text-gray-700"
//                     }`}
//                   onClick={() => setActiveTab("alarms")}
//                 >
//                   <FaBell className="inline mr-2" />
//                   Alarm Events
//                 </button>
//               </nav>
//             </div>

//             {/* Tab Content */}
//             {activeTab === "attendance" && (
//               <div>
//                 <h4 className="font-medium mb-3 text-lg">Attendance Records</h4>

//                 <div className="flex items-center gap-3 mb-4 flex-wrap">
//                   <label className="text-sm text-gray-600 font-medium">From</label>
//                   <input
//                     type="date"
//                     className="border p-2 rounded focus:ring-2 focus:ring-primary/20"
//                     value={attendanceFrom}
//                     onChange={(e) => setAttendanceFrom(e.target.value)}
//                   />
//                   <label className="text-sm text-gray-600 font-medium">To</label>
//                   <input
//                     type="date"
//                     className="border p-2 rounded focus:ring-2 focus:ring-primary/20"
//                     value={attendanceTo}
//                     onChange={(e) => setAttendanceTo(e.target.value)}
//                   />
//                   <Button
//                     color="black"
//                     onClick={async () => {
//                       setAttendanceLoading(true);
//                       setAttendanceRecords([]);
//                       try {
//                         const recs = await fetchAttendanceForSweeper(
//                           detailSweeper._id || detailSweeper.id,
//                           attendanceFrom,
//                           attendanceTo
//                         );
//                         setAttendanceRecords(recs);
//                         await fetchAlarmsForSweeperView(
//                           detailSweeper,
//                           attendanceFrom,
//                           attendanceTo
//                         );
//                       } catch (err) {
//                         console.error(err);
//                       } finally {
//                         setAttendanceLoading(false);
//                       }
//                     }}
//                   >
//                     <FaSync className="mr-2" /> Refresh
//                   </Button>

//                   <Button
//                     variant="outline"
//                     color="secondary"
//                     onClick={() => {
//                       if (!attendanceRecords || attendanceRecords.length === 0) {
//                         window.alert("No records to export");
//                         return;
//                       }
//                       const header = ["attendanceDate", "recordedDate", "recordedTime"];
//                       const rows = attendanceRecords.map((a) => {
//                         const attendanceDate = a.date
//                           ? moment(a.date).format("YYYY-MM-DD")
//                           : "";
//                         const recordedDate = a.createdAt
//                           ? moment(a.createdAt).format("YYYY-MM-DD")
//                           : "";
//                         const recordedTime = a.createdAt
//                           ? moment(a.createdAt).format("HH:mm: ss")
//                           : "";
//                         return [attendanceDate, recordedDate, recordedTime]
//                           .map((v) => `"${String(v).replace(/"/g, '""')}"`)
//                           .join(",");
//                       });
//                       const csv = [header.join(","), ...rows].join("\n");
//                       const blob = new Blob([csv], {
//                         type: "text/csv;charset=utf-8;",
//                       });
//                       const url = URL.createObjectURL(blob);
//                       const a = document.createElement("a");
//                       a.href = url;
//                       a.download = `${detailSweeper.name || "sweeper"
//                         }_attendance_${attendanceFrom}_${attendanceTo}. csv`;
//                       document.body.appendChild(a);
//                       a.click();
//                       a.remove();
//                       URL.revokeObjectURL(url);
//                     }}
//                   >
//                     <FaDownload className="mr-2" /> Export CSV
//                   </Button>
//                 </div>

//                 {attendanceLoading ? (
//                   <div className="text-sm text-gray-500">Loading attendance...</div>
//                 ) : attendanceRecords.length === 0 ? (
//                   <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
//                     No attendance records found for this range.
//                   </div>
//                 ) : (
//                   <>
//                     <div className="overflow-x-auto max-h-96 border rounded-lg mb-4">
//                       <table className="min-w-full divide-y divide-gray-200 text-sm">
//                         <thead className="bg-gray-50 sticky top-0">
//                           <tr>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Attendance Date
//                             </th>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Recorded Date
//                             </th>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Recorded Time
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {attendanceRecords.map((a) => (
//                             <tr
//                               key={a._id || `${a.date}-${a.sweeperId}`}
//                               className="hover:bg-gray-50"
//                             >
//                               <td className="px-4 py-3">
//                                 {a.date ? moment(a.date).format("YYYY-MM-DD") : "-"}
//                               </td>
//                               <td className="px-4 py-3">
//                                 {a.createdAt
//                                   ? moment(a.createdAt).format("YYYY-MM-DD")
//                                   : "-"}
//                               </td>
//                               <td className="px-4 py-3">
//                                 {a.createdAt
//                                   ? moment(a.createdAt).format("HH:mm:ss")
//                                   : "-"}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>

//                     {/* Summary Cards */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <Card>
//                         <div className="text-sm text-gray-500">Total records</div>
//                         <div className="text-2xl font-semibold">
//                           {attendanceRecords.length}
//                         </div>
//                       </Card>
//                       <Card>
//                         <div className="text-sm text-gray-500">First record</div>
//                         <div className="text-sm">
//                           {attendanceRecords.length
//                             ? moment(
//                               attendanceRecords[attendanceRecords.length - 1].date
//                             ).format("YYYY-MM-DD HH:mm")
//                             : "-"}
//                         </div>
//                       </Card>
//                       <Card>
//                         <div className="text-sm text-gray-500">Last record</div>
//                         <div className="text-sm">
//                           {attendanceRecords.length
//                             ? moment(attendanceRecords[0].date).format(
//                               "YYYY-MM-DD HH:mm"
//                             )
//                             : "-"}
//                         </div>
//                       </Card>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}

//             {activeTab === "alarms" && (
//               <div>
//                 <h4 className="font-medium mb-3 text-lg">Alarm Events History</h4>

//                 {alarmsLoading ? (
//                   <div className="text-sm text-gray-500">Loading alarm events...</div>
//                 ) : alarmRecords.length === 0 ? (
//                   <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
//                     No alarm events found for this sweeper in the selected range.
//                   </div>
//                 ) : (
//                   <>
//                     <div className="overflow-x-auto max-h-96 border rounded-lg mb-4">
//                       <table className="min-w-full divide-y divide-gray-200 text-sm">
//                         <thead className="bg-gray-50 sticky top-0">
//                           <tr>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Alarm Time
//                             </th>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Status
//                             </th>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Response (ms)
//                             </th>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Verification Time
//                             </th>
//                             <th className="px-4 py-3 text-left font-medium text-gray-700">
//                               Within Geofence
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {alarmRecords.map((ev) => {
//                             // Simplified status logic:  only Attended or Missed
//                             const verStatus = ev.verificationStatus
//                               ? String(ev.verificationStatus).toLowerCase()
//                               : "";

//                             const isAttended = verStatus === "attended";
//                             const status = isAttended ? "Attended" : "Missed";
//                             const color = isAttended ? "green" : "red";

//                             return (
//                               <tr
//                                 key={ev._id}
//                                 className="hover:bg-gray-50 cursor-pointer"
//                                 onClick={() => setSelectedAlarm(ev)}
//                               >
//                                 <td className="px-4 py-3">
//                                   {ev.alarmTimestampMs
//                                     ? moment(Number(ev.alarmTimestampMs)).format(
//                                       "DD MMM YYYY, hh:mm: ss A"
//                                     )
//                                     : "-"}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   <span
//                                     className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${color === "green"
//                                       ? "bg-green-100 text-green-800 border border-green-300"
//                                       : "bg-red-100 text-red-800 border border-red-300"
//                                       }`}
//                                   >
//                                     {status}
//                                   </span>
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {ev.responseMs ? (
//                                     <span className="font-mono">{ev.responseMs}</span>
//                                   ) : (
//                                     "-"
//                                   )}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {ev.verificationTimestampMs
//                                     ? moment(Number(ev.verificationTimestampMs)).format(
//                                       "DD MMM, hh:mm A"
//                                     )
//                                     : "-"}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {ev.withinGeofence == null ? (
//                                     <span className="text-gray-400">-</span>
//                                   ) : ev.withinGeofence ? (
//                                     <span className="text-green-700 font-bold flex items-center">
//                                       <FaCheckCircle className="mr-1" /> Yes
//                                     </span>
//                                   ) : (
//                                     <span className="text-red-700 font-bold flex items-center">
//                                       <FaTimesCircle className="mr-1" /> No
//                                     </span>
//                                   )}
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>

//                     {/* Alarm Summary Cards */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                       <Card>
//                         <div className="text-sm text-gray-500">Total Alarms</div>
//                         <div className="text-2xl font-semibold">
//                           {alarmRecords.length}
//                         </div>
//                       </Card>
//                       <Card>
//                         <div className="text-sm text-gray-500">Attended</div>
//                         <div className="text-2xl font-semibold text-green-600">
//                           {
//                             alarmRecords.filter(
//                               (ev) =>
//                                 ev.verificationStatus?.toLowerCase() === "attended"
//                             ).length
//                           }
//                         </div>
//                       </Card>
//                       <Card>
//                         <div className="text-sm text-gray-500">Missed</div>
//                         <div className="text-2xl font-semibold text-red-600">
//                           {
//                             alarmRecords.filter(
//                               (ev) =>
//                                 ev.verificationStatus?.toLowerCase() !== "attended"
//                             ).length
//                           }
//                         </div>
//                       </Card>
//                       <Card>
//                         <div className="text-sm text-gray-500">Avg Response</div>
//                         <div className="text-2xl font-semibold">
//                           {(() => {
//                             const validResponses = alarmRecords
//                               .map((ev) => ev.responseMs)
//                               .filter((r) => r != null && r > 0);
//                             if (validResponses.length === 0) return "-";
//                             const avg =
//                               validResponses.reduce((sum, r) => sum + r, 0) /
//                               validResponses.length;
//                             return `${Math.round(avg)}ms`;
//                           })()}
//                         </div>
//                       </Card>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
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
  FaUserPlus,
  FaClock,
  FaTrash,
  FaSync,
  FaBell,
  FaDownload,
  FaHistory,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { io } from "socket.io-client";

// const API_BASE = "http://localhost:3000";
// const API_BASE = "https://smc-backend-bjm5.onrender.com";
const API_BASE = "https://smcbakcenddummy.onrender.com";

// Helper to get today's YYYY-MM-DD
const todayKey = moment().format("YYYY-MM-DD");

// Process alarm summary for a sweeper
const processAlarmSummary = (sweeper) => {
  let allAlarms = [];
  try {
    if (sweeper.alarmEvents && typeof sweeper.alarmEvents === "object") {
      for (const dateKey of Object.keys(sweeper.alarmEvents)) {
        if (Array.isArray(sweeper.alarmEvents[dateKey])) {
          sweeper.alarmEvents[dateKey].forEach((ev) => {
            allAlarms.push({
              ... ev,
              verificationStatus: ev.verificationStatus
                ? ev.verificationStatus. toLowerCase()
                : "",
              dateKey: dateKey,
            });
          });
        }
      }
    }
  } catch (err) {
    console.warn("processAlarmSummary error:", err);
  }

  const total = allAlarms.length;
  const attended = allAlarms.filter(
    (ev) => ev.verificationStatus === "attended"
  ).length;
  const missed = allAlarms.filter(
    (ev) =>
      ev.verificationStatus === "missed" ||
      ev. verificationStatus === "skipped" ||
      (! ev.opened && !ev.verificationTimestampMs)
  ).length;

  let todayAlarms = [];
  if (sweeper.alarmEvents && Array.isArray(sweeper.alarmEvents[todayKey])) {
    todayAlarms = sweeper.alarmEvents[todayKey].map((ev) => ({
      ...ev,
      verificationStatus: ev.verificationStatus
        ? ev.verificationStatus.toLowerCase()
        : "",
    }));
  }

  const todayTotal = todayAlarms. length;
  const todayAttended = todayAlarms.filter(
    (ev) => ev.verificationStatus === "attended"
  ).length;
  const todayMissed = todayAlarms.filter(
    (ev) =>
      ev.verificationStatus === "missed" ||
      ev.verificationStatus === "skipped" ||
      (!ev.opened && !ev.verificationTimestampMs)
  ).length;

  return {
    total,
    attended,
    missed,
    allAlarms,
    todayAlarms,
    todayTotal,
    todayAttended,
    todayMissed,
  };
};

// ✅ NEW:  Function to get attendance status for a specific date
const getAttendanceStatus = (sweeper, dateKey) => {
  const dateAlarms = sweeper.alarmEvents && sweeper.alarmEvents[dateKey] 
    ? sweeper.alarmEvents[dateKey] 
    : [];
  
  const totalAlarms = dateAlarms.length;
  
  if (totalAlarms === 0) {
    return "Day not started";
  }
  
  const attendedAlarms = dateAlarms.filter(
    (ev) => ev.verificationStatus?. toLowerCase() === "attended"
  ).length;
  
  // All 3 alarms attended = Present
  if (totalAlarms === 3 && attendedAlarms === 3) {
    return "Present";
  }
  
  // At least one alarm missed = Absent
  return "Absent";
};

const SweeperList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [sweepers, setSweepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ NEW: Date and status filters
  const [filterDate, setFilterDate] = useState(moment().format("YYYY-MM-DD"));
  const [filterStatus, setFilterStatus] = useState(""); // "", "Present", "Absent", "Day not started"

  // add/duty/delete UI state
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
  const [attendanceFrom, setAttendanceFrom] = useState("2025-12-15");
  const [attendanceTo, setAttendanceTo] = useState("2025-12-21");
  const [alarmsSummary, setAlarmsSummary] = useState({});
  const [alarmsLoading, setAlarmsLoading] = useState(false);
  const [alarmRecords, setAlarmRecords] = useState([]);
  const [showFullAlarmHistory, setShowFullAlarmHistory] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState(null);

  const [activeTab, setActiveTab] = useState("attendance");

  const socketRef = useRef(null);

  const lastNDates = (n) => {
    const arr = [];
    for (let i = n - 1; i >= 0; i--)
      arr.push(moment().subtract(i, "days").startOf("day").format("YYYY-MM-DD"));
    return arr;
  };

  const fetchSweepers = async () => {
    const res = await fetch(`${API_BASE}/sweepers`);
    if (! res.ok) throw new Error("Failed to fetch sweepers");
    const json = await res.json();
    return Array.isArray(json. sweepers) ? json.sweepers : [];
  };

  const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
    try {
      const url = new URL(
        `${API_BASE}/sweepers/${encodeURIComponent(sweeperId)}/attendance`
      );
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      const json = await res.json();
      const records = Array.isArray(json.attendanceHistory)
        ? json.attendanceHistory
        : [];
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      return records;
    } catch (err) {
      console.warn("fetchAttendanceForSweeper error:", err);
      return [];
    }
  };

  const normalizeEmbeddedEvent = (ev, sweeper) => {
    const copy = { ...(ev || {}) };
    if (copy.id && ! copy._id) copy._id = copy.id;
    if (copy.alarmTimestampMs && typeof copy.alarmTimestampMs !== "number") {
      const p = Number(copy.alarmTimestampMs);
      copy.alarmTimestampMs = isNaN(p) ? null : p;
    } else if (! copy.alarmTimestampMs && copy.alarmTimestamp) {
      const p = Number(copy.alarmTimestamp);
      copy.alarmTimestampMs = isNaN(p) ? null : p;
    }
    if (copy.openedTimestampMs && typeof copy.openedTimestampMs !== "number") {
      const p = Number(copy.openedTimestampMs);
      copy.openedTimestampMs = isNaN(p) ? null : p;
    }
    if (
      copy.verificationTimestampMs &&
      typeof copy.verificationTimestampMs !== "number"
    ) {
      const p = Number(copy. verificationTimestampMs);
      copy.verificationTimestampMs = isNaN(p) ? null : p;
    }
    if (copy.responseMs && typeof copy.responseMs !== "number") {
      const p = Number(copy.responseMs);
      copy.responseMs = isNaN(p) ? null : p;
    }
    if (! copy.sweeperId) copy.sweeperId = sweeper._id || sweeper.id || null;
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
        for (const ev of sweeper.alarmEvents)
          out.push(normalizeEmbeddedEvent(ev, sweeper));
      } else if (typeof sweeper.alarmEvents === "object") {
        for (const key of Object.keys(sweeper.alarmEvents)) {
          const arr = Array.isArray(sweeper.alarmEvents[key])
            ? sweeper.alarmEvents[key]
            : [];
          for (const ev of arr) out.push(normalizeEmbeddedEvent(ev, sweeper));
        }
      }
      return out;
    } catch (err) {
      console.warn("extractEmbeddedAlarmEvents error:", err);
      return [];
    }
  };

  const fetchAlarmsForSweeperView = async (sweeper, fromDateStr, toDateStr) => {
    if (!sweeper) return [];

    setAlarmsLoading(true);
    setAlarmRecords([]);

    try {
      let embedded = extractEmbeddedAlarmEvents(sweeper);

      if (fromDateStr || toDateStr) {
        const fromMs = fromDateStr
          ? new Date(fromDateStr).setHours(0, 0, 0, 0)
          : null;
        const toMs = toDateStr
          ? new Date(toDateStr).setHours(23, 59, 59, 999)
          : null;

        embedded = embedded.filter(ev => {
          const t = Number(ev.alarmTimestampMs);
          if (! t) return false;
          if (fromMs && t < fromMs) return false;
          if (toMs && t > toMs) return false;
          return true;
        });
      }

      embedded. sort(
        (a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)
      );

      setAlarmRecords(embedded);
      setAlarmsSummary(prev => ({
        ...prev,
        [sweeper._id || sweeper.id]: {
          ...(prev[sweeper._id || sweeper.id] || {}),
          full: embedded,
          recent: embedded.slice(0, 5),
        },
      }));

      return embedded;
    } catch (err) {
      console.error("fetchAlarmsForSweeperView error:", err);
      setAlarmRecords([]);
      return [];
    } finally {
      setAlarmsLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const sw = await fetchSweepers();

      const days = 7;
      const dates = lastNDates(days);
      const from = dates[0];
      const to = dates[dates.length - 1];

      const attendancePromises = sw.map((s) =>
        fetch(
          `${API_BASE}/sweepers/${s._id || s.id}/attendance? from=${from}&to=${to}`
        )
          .then((r) => (r.ok ? r.json() : { attendanceHistory: [] }))
          .then((j) =>
            Array.isArray(j.attendanceHistory) ? j.attendanceHistory : []
          )
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
          if (presentByDateAndSweeper[key])
            presentByDateAndSweeper[key].add(sweeperId);
        });
      });

      const todayKeyVal = dates[dates.length - 1];

      const augmentedSweepers = sw.map((s, idx) => {
        const entries = allResults[idx] || [];
        let lastLocation = null;
        if (entries.length > 0) {
          const latest = entries
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          if (latest && latest.location) lastLocation = latest.location;
        }

        const todayAlarms = s.alarmEvents && s.alarmEvents[todayKeyVal]
          ? s.alarmEvents[todayKeyVal]
          : [];
        const hasTodayAlarms = Array.isArray(todayAlarms) && todayAlarms.length > 0;

        return {
          ...s,
          hasToday: hasTodayAlarms,
          lastLocation,
        };
      });

      setSweepers(augmentedSweepers);
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
      const promises = sweepersList.map(async (s) => {
        try {
          const events = await fetchAlarmsForSweeperView(s, null, null);
          const missed = events.filter(
            (ev) =>
              (ev.verificationStatus &&
                String(ev.verificationStatus).toLowerCase() === "skipped") ||
              (! ev.opened && !ev.verificationTimestampMs)
          ).length;
          const active = events.filter((ev) => ev.opened === false).length;
          const recent = events
            .slice()
            .sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0))
            .slice(0, 5);
          return {
            id: s._id || s.id,
            missed,
            active,
            recent,
            full: events
              .slice()
              .sort(
                (a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0)
              ),
          };
        } catch (err) {
          return {
            id: s._id || s.id,
            missed: 0,
            active: 0,
            recent: [],
            full: [],
          };
        }
      });

      const results = await Promise.all(promises);
      const map = {};
      results.forEach((r) => {
        map[r.id] = {
          missed: r.missed,
          active: r.active,
          recent: r.recent,
          full: r.full,
        };
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

  const handleAddSweeper = async (e) => {
    e && e.preventDefault();
    setAddError("");
    if (! addName.trim() || !addEmail.trim() || !addPassword) {
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
        data = text ?  JSON.parse(text) : null;
      } catch {
        throw new Error("Unexpected response when adding sweeper.");
      }
      if (! res.ok || !data?. success)
        throw new Error(data?. message || `Failed to add sweeper (${res.status})`);
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
    const end = (sweeper.dutyTime && sweeper. dutyTime.end) || "";
    const normalize = (val) => {
      if (! val) return "";
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
    if (! sMoment.isValid() || !eMoment.isValid()) {
      setDutyError("Invalid time format.");
      return;
    }
    if (! eMoment.isAfter(sMoment)) {
      setDutyError("End time must be after start time.");
      return;
    }

    setSavingDuty(true);
    try {
      const payload = { start: dutyStart, end:  dutyEnd };
      const res = await fetch(
        `${API_BASE}/sweepers/${selectedSweeper._id || selectedSweeper.id}/duty-time`,
        {
          method: "PUT",
          headers:  { "Content-Type": "application/json" },
          body:  JSON.stringify(payload),
        }
      );
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error("Unexpected response when saving duty time.");
      }
      if (!res.ok || !data?.success)
        throw new Error(
          data?.message || `Failed to save duty time (${res.status})`
        );
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
    const confirm = window.confirm(
      `Delete sweeper "${sweeper.name}"?  This will remove the sweeper and associated data.`
    );
    if (! confirm) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/sweepers/${id}`, {
        method: "DELETE",
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON. parse(text) : null;
      } catch { }
      if (!res.ok) {
        const msg = data?.message || `Failed to delete sweeper (${res.status})`;
        throw new Error(msg);
      }
      await loadData();
      window.alert(`Sweeper "${sweeper.name}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting sweeper:", err);
      window.alert(`Failed to delete sweeper:  ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = async (sweeper) => {
    setDetailSweeper(sweeper);
    setShowDetailModal(true);
    setSelectedAlarm(null);
    setActiveTab("attendance");
    setAttendanceLoading(true);
    setAttendanceRecords([]);
    setShowFullAlarmHistory(false);

    const from = "2025-12-15";
    const to = "2025-12-21";

    try {
      const recs = await fetchAttendanceForSweeper(
        sweeper._id || sweeper.id,
        from,
        to
      );
      setAttendanceRecords(recs);
      await fetchAlarmsForSweeperView(sweeper, from, to);
    } catch (err) {
      console.error("openDetail error:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const isPresentToday = (records) => {
    if (!records) return false;
    return records.some((r) => moment(r.date).isSame(moment(), "day"));
  };

  const analyzeEvent = (ev, currentSweeperId) => {
    const opened = !!ev.opened;
    const verification = ev.verificationStatus
      ? String(ev.verificationStatus).toLowerCase()
      : null;
    const verified = verification === "attended";
    const skipped = verification === "skipped";
    const missed = skipped || (! opened && !ev.verificationTimestampMs);
    let state = "Ringed";
    if (verified) state = "Attended";
    else if (skipped) state = "Missed (skipped)";
    else if (! opened) state = "Unopened";

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

  const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));
  
  // ✅ UPDATED: Apply filters
  const filteredList = sweepers.filter((sweeper) => {
    const nameMatch = sweeper.name
      ?  sweeper.name.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    
    const zoneMatch = filterZone === "" || (sweeper.zone || "") === filterZone;
    
    const sweeperStatus = getAttendanceStatus(sweeper, filterDate);
    const statusMatch = filterStatus === "" || sweeperStatus === filterStatus;
    
    return nameMatch && zoneMatch && statusMatch;
  });

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">Sweeper List</h1>

      <Card>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
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

            {/* ✅ NEW: Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Date: </label>
              <input
                type="date"
                className="py-2 px-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus: outline-none"
                value={filterDate}
                onChange={(e) => setFilterDate(e. target.value)}
              />
            </div>

            {/* ✅ NEW: Status Filter */}
            <select
              className="py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Day not started">Day not started</option>
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
            <div className="p-6 text-center text-gray-500">
              No sweepers found matching the filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duty Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alarms ({moment(filterDate).format("MMM DD, YYYY")})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList. map((sweeper) => {
                  const isDeleting =
                    deletingId && deletingId === (sweeper._id || sweeper. id);
                  
                  const attendanceStatus = getAttendanceStatus(sweeper, filterDate);
                  const summary = processAlarmSummary(sweeper);

                  const dateAlarms = sweeper.alarmEvents && sweeper.alarmEvents[filterDate]
                    ? sweeper.alarmEvents[filterDate]
                    : [];
                  const dateAlarmsTotal = dateAlarms.length;
                  const dateAlarmsAttended = dateAlarms.filter(
                    (ev) => ev.verificationStatus?. toLowerCase() === "attended"
                  ).length;
                  const dateAlarmsMissed = dateAlarmsTotal - dateAlarmsAttended;

                  return (
                    <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
                      {/* Name column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="font-medium cursor-pointer text-primary hover:underline"
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

                      {/* Attendance column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            attendanceStatus === "Present"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : attendanceStatus === "Absent"
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-gray-100 text-gray-700 border border-gray-300"
                          }`}
                        >
                          {attendanceStatus}
                        </span>
                      </td>

                      {/* Duty time column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {sweeper.dutyTime &&
                            (sweeper.dutyTime.start || sweeper.dutyTime. end)
                            ? `${to12Hour(sweeper.dutyTime?. start)} - ${to12Hour(
                                sweeper.dutyTime?.end
                              )}`
                            : "Not set"}
                        </div>
                        <div className="mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            color="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDutyModal(sweeper);
                            }}
                          >
                            <FaClock className="mr-1" /> Set Duty
                          </Button>
                        </div>
                      </td>

                      {/* Alarms for filtered date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-sm">
                          <div>
                            <span className="font-semibold">{dateAlarmsTotal}</span>{" "}
                            alarm{dateAlarmsTotal !== 1 ? "s" : ""}
                          </div>
                          {dateAlarmsTotal > 0 && (
                            <div className="flex gap-2">
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                <FaCheckCircle className="inline mr-1" />
                                {dateAlarmsAttended} attended
                              </span>
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                <FaTimesCircle className="inline mr-1" />
                                {dateAlarmsMissed} missed
                              </span>
                            </div>
                          )}
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
                            <FaInfoCircle className="mr-1" /> Details
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            iconOnly
                            title="Delete Sweeper"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSweeper(sweeper);
                            }}
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

      {/* Add Sweeper Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Sweeper</h2>

            {addError && (
              <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
                {addError}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
                placeholder="Name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />

              <input
                type="email"
                className="w-full border p-2 rounded focus: ring-2 focus:ring-primary/20"
                placeholder="Email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target. value)}
              />

              <input
                type="password"
                className="w-full border p-2 rounded focus: ring-2 focus:ring-primary/20"
                placeholder="Password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target. value)}
              />

              <input
                type="text"
                className="w-full border p-2 rounded focus: ring-2 focus:ring-primary/20"
                placeholder="Zone"
                value={addZone}
                onChange={(e) => setAddZone(e. target.value)}
              />

              <select
                className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
                value={addStatus}
                onChange={(e) => setAddStatus(e.target. value)}
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

      {/* Duty Time Modal */}
      {showDutyModal && selectedSweeper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Set Duty Time for {selectedSweeper.name}
            </h2>

            {dutyError && (
              <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
                {dutyError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 font-medium">
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
                  value={dutyStart}
                  onChange={(e) => setDutyStart(e.target. value)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1 font-medium">End Time</label>
                <input
                  type="time"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-primary/20"
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

              <Button color="black" onClick={handleSaveDuty} disabled={savingDuty}>
                {savingDuty ? "Saving..." : "Save Duty Time"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailSweeper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 overflow-auto">
          <div
            className={`w-full max-w-5xl p-6 rounded-lg shadow-lg bg-white ${
              isPresentToday(attendanceRecords)
                ? "border-4 border-green-500"
                : "border-4 border-red-500"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold">{detailSweeper.name}</h3>

                <div className="mt-2">
                  {isPresentToday(attendanceRecords) ? (
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border-2 border-green-400 text-green-800 font-medium">
                      <FaCheckCircle className="mr-2" /> Present Today
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 border-2 border-red-400 text-red-800 font-medium">
                      <FaTimesCircle className="mr-2" /> Absent Today
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 mt-3 space-y-1">
                  <div>
                    <strong>Email:</strong> {detailSweeper.email}
                  </div>
                  <div>
                    <strong>Zone: </strong> {detailSweeper.zone || "—"}
                  </div>
                  <div>
                    <strong>Duty Time:</strong>{" "}
                    {to12Hour(detailSweeper.dutyTime?. start)} -{" "}
                    {to12Hour(detailSweeper.dutyTime?.end)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  color="default"
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailSweeper(null);
                    setSelectedAlarm(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex space-x-4">
                <button
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === "attendance"
                      ? "border-primary text-primary"
                      :  "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("attendance")}
                >
                  <FaHistory className="inline mr-2" />
                  Attendance History
                </button>
                <button
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === "alarms"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("alarms")}
                >
                  <FaBell className="inline mr-2" />
                  Alarm Events
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "attendance" && (
              <div>
                <h4 className="font-medium mb-3 text-lg">Attendance Records</h4>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <label className="text-sm text-gray-600 font-medium">From</label>
                  <input
                    type="date"
                    className="border p-2 rounded focus:ring-2 focus:ring-primary/20"
                    value={attendanceFrom}
                    onChange={(e) => setAttendanceFrom(e.target.value)}
                  />
                  <label className="text-sm text-gray-600 font-medium">To</label>
                  <input
                    type="date"
                    className="border p-2 rounded focus:ring-2 focus:ring-primary/20"
                    value={attendanceTo}
                    onChange={(e) => setAttendanceTo(e.target.value)}
                  />
                  <Button
                    color="black"
                    onClick={async () => {
                      setAttendanceLoading(true);
                      setAttendanceRecords([]);
                      try {
                        const recs = await fetchAttendanceForSweeper(
                          detailSweeper._id || detailSweeper.id,
                          attendanceFrom,
                          attendanceTo
                        );
                        setAttendanceRecords(recs);
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
                    <FaSync className="mr-2" /> Refresh
                  </Button>

                  <Button
                    variant="outline"
                    color="secondary"
                    onClick={() => {
                      if (! attendanceRecords || attendanceRecords.length === 0) {
                        window. alert("No records to export");
                        return;
                      }
                      const header = ["attendanceDate", "recordedDate", "recordedTime"];
                      const rows = attendanceRecords.map((a) => {
                        const attendanceDate = a.date
                          ? moment(a.date).format("YYYY-MM-DD")
                          : "";
                        const recordedDate = a.createdAt
                          ? moment(a.createdAt).format("YYYY-MM-DD")
                          : "";
                        const recordedTime = a.createdAt
                          ? moment(a.createdAt).format("HH:mm: ss")
                          : "";
                        return [attendanceDate, recordedDate, recordedTime]
                          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                          .join(",");
                      });
                      const csv = [header.join(","), ...rows].join("\n");
                      const blob = new Blob([csv], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${
                        detailSweeper. name || "sweeper"
                      }_attendance_${attendanceFrom}_${attendanceTo}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL. revokeObjectURL(url);
                    }}
                  >
                    <FaDownload className="mr-2" /> Export CSV
                  </Button>
                </div>

                {attendanceLoading ?  (
                  <div className="text-sm text-gray-500">Loading attendance...</div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
                    No attendance records found for this range. 
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto max-h-96 border rounded-lg mb-4">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Attendance Date
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Recorded Date
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Recorded Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendanceRecords.map((a) => (
                            <tr
                              key={a._id || `${a.date}-${a.sweeperId}`}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                {a.date ? moment(a. date).format("YYYY-MM-DD") : "-"}
                              </td>
                              <td className="px-4 py-3">
                                {a.createdAt
                                  ? moment(a. createdAt).format("YYYY-MM-DD")
                                  : "-"}
                              </td>
                              <td className="px-4 py-3">
                                {a.createdAt
                                  ? moment(a.createdAt).format("HH:mm:ss")
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <div className="text-sm text-gray-500">Total records</div>
                        <div className="text-2xl font-semibold">
                          {attendanceRecords.length}
                        </div>
                      </Card>
                      <Card>
                        <div className="text-sm text-gray-500">First record</div>
                        <div className="text-sm">
                          {attendanceRecords. length
                            ? moment(
                                attendanceRecords[attendanceRecords.length - 1].date
                              ).format("YYYY-MM-DD HH:mm")
                            :  "-"}
                        </div>
                      </Card>
                      <Card>
                        <div className="text-sm text-gray-500">Last record</div>
                        <div className="text-sm">
                          {attendanceRecords.length
                            ? moment(attendanceRecords[0].date).format(
                                "YYYY-MM-DD HH:mm"
                              )
                            : "-"}
                        </div>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "alarms" && (
              <div>
                <h4 className="font-medium mb-3 text-lg">Alarm Events History</h4>

                {alarmsLoading ? (
                  <div className="text-sm text-gray-500">Loading alarm events...</div>
                ) : alarmRecords.length === 0 ?  (
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
                    No alarm events found for this sweeper in the selected range.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto max-h-96 border rounded-lg mb-4">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Alarm Time
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Response (ms)
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Verification Time
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                              Within Geofence
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {alarmRecords. map((ev) => {
                            const verStatus = ev.verificationStatus
                              ? String(ev.verificationStatus).toLowerCase()
                              : "";

                            const isAttended = verStatus === "attended";
                            const status = isAttended ? "Attended" : "Missed";
                            const color = isAttended ? "green" : "red";

                            return (
                              <tr
                                key={ev._id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setSelectedAlarm(ev)}
                              >
                                <td className="px-4 py-3">
                                  {ev. alarmTimestampMs
                                    ? moment(Number(ev.alarmTimestampMs)).format(
                                        "DD MMM YYYY, hh:mm: ss A"
                                      )
                                    : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                      color === "green"
                                        ? "bg-green-100 text-green-800 border border-green-300"
                                        : "bg-red-100 text-red-800 border border-red-300"
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {ev.responseMs ?  (
                                    <span className="font-mono">{ev.responseMs}</span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {ev.verificationTimestampMs
                                    ?  moment(Number(ev.verificationTimestampMs)).format(
                                        "DD MMM, hh:mm A"
                                      )
                                    : "-"}
                                </td>
                                <td className="px-4 py-3">
                                  {ev.withinGeofence == null ? (
                                    <span className="text-gray-400">-</span>
                                  ) : ev.withinGeofence ? (
                                    <span className="text-green-700 font-bold flex items-center">
                                      <FaCheckCircle className="mr-1" /> Yes
                                    </span>
                                  ) : (
                                    <span className="text-red-700 font-bold flex items-center">
                                      <FaTimesCircle className="mr-1" /> No
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Alarm Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <div className="text-sm text-gray-500">Total Alarms</div>
                        <div className="text-2xl font-semibold">
                          {alarmRecords.length}
                        </div>
                      </Card>
                      <Card>
                        <div className="text-sm text-gray-500">Attended</div>
                        <div className="text-2xl font-semibold text-green-600">
                          {
                            alarmRecords.filter(
                              (ev) =>
                                ev.verificationStatus?. toLowerCase() === "attended"
                            ).length
                          }
                        </div>
                      </Card>
                      <Card>
                        <div className="text-sm text-gray-500">Missed</div>
                        <div className="text-2xl font-semibold text-red-600">
                          {
                            alarmRecords. filter(
                              (ev) =>
                                ev.verificationStatus?.toLowerCase() !== "attended"
                            ).length
                          }
                        </div>
                      </Card>
                      <Card>
                        <div className="text-sm text-gray-500">Avg Response</div>
                        <div className="text-2xl font-semibold">
                          {(() => {
                            const validResponses = alarmRecords
                              .map((ev) => ev.responseMs)
                              .filter((r) => r != null && r > 0);
                            if (validResponses.length === 0) return "-";
                            const avg =
                              validResponses.reduce((sum, r) => sum + r, 0) /
                              validResponses.length;
                            return `${Math.round(avg)}ms`;
                          })()}
                        </div>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SweeperList;
// import React, { useEffect, useState } from "react";
// import Card from "../../components/common/Card";
// import Badge from "../../components/common/Badge";
// import Button from "../../components/common/Button";
// import { FaSearch, FaCalendarAlt, FaDownload, FaUserCheck, FaFilter } from "react-icons/fa";
// import moment from "moment";

// // const API_BASE = "https://smc-backend-bjm5.onrender.com";
// const API_BASE = "http://localhost:3000";

// const AttendanceRecords = () => {
//   const [sweepers, setSweepers] = useState([]);
//   const [loadingSweepers, setLoadingSweepers] = useState(true);
//   const [sweepersError, setSweepersError] = useState("");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [zoneFilter, setZoneFilter] = useState("");

//   // detail modal & attendance
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [showDetailModal, setShowDetailModal] = useState(false);

//   const [attendanceFrom, setAttendanceFrom] = useState(
//     moment().subtract(7, "days").format("YYYY-MM-DD")
//   );
//   const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [attendanceLoading, setAttendanceLoading] = useState(false);
//   const [attendanceError, setAttendanceError] = useState("");

//   // Export-specific date range (for exporting sweepers + attendance)
//   const [exportFrom, setExportFrom] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
//   const [exportTo, setExportTo] = useState(moment().format("YYYY-MM-DD"));
//   const [exporting, setExporting] = useState(false);

//   // Load sweepers list
//   const loadSweepers = async () => {
//     setLoadingSweepers(true);
//     setSweepersError("");
//     try {
//       const res = await fetch(`${API_BASE}/sweepers`);
//       if (!res.ok) throw new Error(`Failed to load sweepers (${res.status})`);
//       const json = await res.json();
//       const list = Array.isArray(json.sweepers) ? json.sweepers : [];
//       setSweepers(list);
//     } catch (err) {
//       console.error("loadSweepers:", err);
//       setSweepersError(err.message || "Failed to load sweepers");
//       setSweepers([]);
//     } finally {
//       setLoadingSweepers(false);
//     }
//   };

//   useEffect(() => {
//     loadSweepers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Fetch attendance for a given sweeper between from..to (inclusive)
//   const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
//     try {
//       const url = new URL(`${API_BASE}/sweepers/${sweeperId}/attendance`);
//       if (from) url.searchParams.append("from", from);
//       if (to) url.searchParams.append("to", to);
//       const res = await fetch(url.toString());
//       if (!res.ok) {
//         console.warn(`fetchAttendanceForSweeper ${sweeperId} returned ${res.status}`);
//         return [];
//       }
//       const json = await res.json();
//       const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
//       // sort newest first
//       records.sort((a, b) => new Date(b.date) - new Date(a.date));
//       return records;
//     } catch (err) {
//       console.error("fetchAttendanceForSweeper error:", err);
//       return [];
//     }
//   };

//   // Open detail modal for a sweeper and load attendance range
//   const openSweeperDetail = async (sweeper) => {
//     setSelectedSweeper(sweeper);
//     setShowDetailModal(true);
//     setAttendanceLoading(true);
//     setAttendanceError("");
//     setAttendanceRecords([]);
//     try {
//       const records = await fetchAttendanceForSweeper(sweeper._id || sweeper.id, attendanceFrom, attendanceTo);
//       setAttendanceRecords(records);
//     } catch (err) {
//       setAttendanceError(err.message || "Failed to fetch attendance");
//       setAttendanceRecords([]);
//     } finally {
//       setAttendanceLoading(false);
//     }
//   };

//   // Export: sweepers + their attendance (exportFrom/exportTo)
//   const exportSweepersWithAttendance = async () => {
//     if (!sweepers || sweepers.length === 0) return;
//     setExporting(true);
//     try {
//       // We'll fetch each sweeper's attendance for the export range in parallel.
//       // For large datasets consider server-side export. For now we do client-side.
//       const fetchPromises = sweepers.map(async (s) => {
//         const records = await fetchAttendanceForSweeper(s._id || s.id, exportFrom, exportTo);
//         return { sweeper: s, attendance: records };
//       });

//       const results = await Promise.all(fetchPromises);

//       // Build CSV:
//       // We'll have columns:
//       // sweeper_id, name, email, zone, status, dutyStart, dutyEnd, attendance_date, attendance_time, latitude, longitude, recordedAt
//       const header = [
//         "sweeper_id",
//         "name",
//         "email",
//         "zone",
//         "status",
//         "duty_start",
//         "duty_end",
//         "attendance_date",
//         "attendance_time",
//         "latitude",
//         "longitude",
//         "recorded_at",
//       ];

//       const rows = [];

//       results.forEach(({ sweeper, attendance }) => {
//         if (attendance && attendance.length > 0) {
//           attendance.forEach((a) => {
//             const date = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//             const time = a.date ? moment(a.date).format("HH:mm:ss") : "";
//             const lat = a.location?.latitude ?? "";
//             const lng = a.location?.longitude ?? "";
//             const recorded = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "";
//             const row = [
//               sweeper._id || sweeper.id || "",
//               sweeper.name || "",
//               sweeper.email || "",
//               sweeper.zone || "",
//               sweeper.status || "",
//               (sweeper.dutyTime && sweeper.dutyTime.start) || "",
//               (sweeper.dutyTime && sweeper.dutyTime.end) || "",
//               date,
//               time,
//               lat,
//               lng,
//               recorded,
//             ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
//             rows.push(row.join(","));
//           });
//         } else {
//           // No attendance rows: still include a row with empty attendance fields
//           const row = [
//             sweeper._id || sweeper.id || "",
//             sweeper.name || "",
//             sweeper.email || "",
//             sweeper.zone || "",
//             sweeper.status || "",
//             (sweeper.dutyTime && sweeper.dutyTime.start) || "",
//             (sweeper.dutyTime && sweeper.dutyTime.end) || "",
//             "", // date
//             "", // time
//             "", // lat
//             "", // lng
//             "", // recorded
//           ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
//           rows.push(row.join(","));
//         }
//       });

//       const csv = [header.join(","), ...rows].join("\n");
//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       const filename = `sweepers_with_attendance_${exportFrom}_${exportTo}.csv`;
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("exportSweepersWithAttendance error:", err);
//       window.alert("Failed to export sweepers + attendance. See console for details.");
//     } finally {
//       setExporting(false);
//     }
//   };

//   // Derived zones
//   const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

//   const filteredSweepers = sweepers.filter((s) => {
//     const nameMatch = s.name ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
//     const zoneMatch = zoneFilter === "" || (s.zone || "") === zoneFilter;
//     return nameMatch && zoneMatch;
//   });

//   return (
//     <div>
//       <h1 className="text-2xl font-heading font-semibold mb-6">Sweepers & Attendance</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
//         {/* Left: Sweeper list */}
//         <Card className="lg:col-span-1">
//           <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
//             <h2 className="text-lg font-medium">Sweeper List</h2>
//             <Button 
//               variant="outline" 
//               color="secondary" 
//               onClick={loadSweepers}
//               className="w-full sm:w-auto"
//             >
//               Refresh
//             </Button>
//           </div>

//           <div className="flex flex-col md:flex-row gap-4 mb-4">
//             <div className="relative flex-1">
//               <input
//                 type="text"
//                 placeholder="Search by name..."
//                 className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             </div>

//             <select
//               className="w-full md:w-1/3 py-2 px-3 border rounded-lg text-sm"
//               value={zoneFilter}
//               onChange={(e) => setZoneFilter(e.target.value)}
//             >
//               <option value="">All Zones</option>
//               {zones.map((z) => (
//                 <option value={z} key={z}>
//                   {z}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
//             {loadingSweepers ? (
//               <div className="text-center py-6 text-gray-500">Loading sweepers...</div>
//             ) : sweepersError ? (
//               <div className="text-center py-6 text-red-600">{sweepersError}</div>
//             ) : filteredSweepers.length === 0 ? (
//               <div className="text-center py-6 text-gray-500">No sweepers found.</div>
//             ) : (
//               <ul className="space-y-2">
//                 {filteredSweepers.map((s) => (
//                   <li
//                     key={s._id || s.id}
//                     className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors duration-150"
//                     onClick={() => openSweeperDetail(s)}
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
//                       <div className="space-y-1">
//                         <div className="font-medium text-sm text-primary">{s.name}</div>
//                         <div className="text-xs text-gray-500 break-all">{s.email}</div>
//                         <div className="text-xs text-gray-500">Zone: {s.zone || "—"}</div>
//                       </div>

//                       <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:text-right">
//                         <Badge variant={(s.status === "active" && "success") || "warning"} className="capitalize text-xs">
//                           {s.status || "unknown"}
//                         </Badge>
//                         <div className="text-xs text-gray-500">
//                           {s.dutyTime && (s.dutyTime.start || s.dutyTime.end)
//                             ? `${s.dutyTime.start || "—"} - ${s.dutyTime.end || "—"}`
//                             : "No duty time"}
//                         </div>
//                       </div>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </Card>

//         {/* Right: Overview + export */}
//         <div className="lg:col-span-2 space-y-6">
//           <Card>
//             <div className="flex flex-col lg:flex-row lg:items-center gap-4">
//               <div className="flex-1">
//                 <h2 className="text-lg font-medium mb-1">Attendance Overview</h2>
//                 <div className="text-sm text-gray-500">Click a sweeper from the left to view details and attendance records.</div>
//               </div>

//               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
//                 <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
//                     <label className="text-sm text-gray-600">From</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={exportFrom} 
//                       onChange={(e) => setExportFrom(e.target.value)} 
//                     />
//                   </div>
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
//                     <label className="text-sm text-gray-600">To</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={exportTo} 
//                       onChange={(e) => setExportTo(e.target.value)} 
//                     />
//                   </div>
//                 </div>
//                 <Button 
//                   color="black" 
//                   onClick={exportSweepersWithAttendance} 
//                   disabled={exporting}
//                   className="w-full sm:w-auto whitespace-nowrap"
//                 >
//                   {exporting ? "Exporting..." : (
//                     <>
//                       <FaDownload className="inline-block mr-2" />
//                       <span className="hidden sm:inline">Export Sweepers + Attendance</span>
//                       <span className="sm:hidden">Export Data</span>
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </Card>

//           <Card>
//             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
//               <div>
//                 <div className="text-sm text-gray-500 mb-1">Total Sweepers</div>
//                 <div className="text-lg sm:text-2xl font-semibold">{sweepers.length}</div>
//               </div>
//               <div className="col-span-2 sm:col-span-1">
//                 <div className="text-sm text-gray-500 mb-1">Zones</div>
//                 <div className="text-sm sm:text-base truncate" title={zones.join(", ") || "—"}>
//                   {zones.join(", ") || "—"}
//                 </div>
//               </div>
//               <div className="sm:text-right">
//                 <div className="text-sm text-gray-500 mb-1">Last Refresh</div>
//                 <div className="text-sm sm:text-base">{moment().format("YYYY-MM-DD HH:mm")}</div>
//               </div>
//             </div>
//           </Card>

//           <Card>
//             <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Insights</h3>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="text-sm text-gray-500 mb-1">Avg Verifications</div>
//                 <div className="text-lg sm:text-xl font-semibold">—</div>
//               </div>
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="text-sm text-gray-500 mb-1">On-time Rate</div>
//                 <div className="text-lg sm:text-xl font-semibold">—</div>
//               </div>
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="text-sm text-gray-500 mb-1">Missing Today</div>
//                 <div className="text-lg sm:text-xl font-semibold">—</div>
//               </div>
//             </div>
//           </Card>
//         </div>
//       </div>

//       {/* Sweeper Detail Modal */}
//       {showDetailModal && selectedSweeper && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-auto">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-4 sm:p-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
//               <div className="space-y-1">
//                 <h3 className="text-lg sm:text-xl font-semibold">{selectedSweeper.name}</h3>
//                 <div className="text-sm text-gray-600 break-all">{selectedSweeper.email}</div>
//                 <div className="text-sm text-gray-600">Zone: {selectedSweeper.zone || "—"}</div>
//                 <div className="text-sm text-gray-600">
//                   Duty Time: {selectedSweeper.dutyTime?.start || "—"} - {selectedSweeper.dutyTime?.end || "—"}
//                 </div>
//                 <div className="text-sm text-gray-600">Geofence points: {(selectedSweeper.geofence || []).length}</div>
//                 <div className="text-sm text-gray-600">Checkpoints: {(selectedSweeper.checkpoints || []).length}</div>
//               </div>

//               <div>
//                 <Button 
//                   variant="outline" 
//                   color="default" 
//                   onClick={() => { setShowDetailModal(false); setSelectedSweeper(null); }}
//                 >
//                   Close
//                 </Button>
//               </div>
//             </div>

//             <div className="mb-4">
//               <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
//                 <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
//                     <label className="text-sm text-gray-600">From</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={attendanceFrom} 
//                       onChange={(e) => setAttendanceFrom(e.target.value)} 
//                     />
//                   </div>
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
//                     <label className="text-sm text-gray-600">To</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={attendanceTo} 
//                       onChange={(e) => setAttendanceTo(e.target.value)} 
//                     />
//                   </div>
//                 </div>
//                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
//                   <Button 
//                     color="primary" 
//                     className="w-full sm:w-auto"
//                     onClick={async () => {
//                       setAttendanceLoading(true);
//                       setAttendanceError("");
//                       try {
//                         const recs = await fetchAttendanceForSweeper(selectedSweeper._id || selectedSweeper.id, attendanceFrom, attendanceTo);
//                         setAttendanceRecords(recs);
//                       } catch (err) {
//                         setAttendanceError(err?.message || "Failed to refresh");
//                         setAttendanceRecords([]);
//                       } finally {
//                         setAttendanceLoading(false);
//                       }
//                     }}
//                   >
//                     Refresh
//                   </Button>
//                   <Button 
//                     variant="outline" 
//                     color="secondary"
//                     className="w-full sm:w-auto whitespace-nowrap"
//                     onClick={() => {
//                       if (!attendanceRecords || attendanceRecords.length === 0) {
//                         window.alert("No records to export");
//                         return;
//                       }
//                       // Export just the displayed attendance records for this sweeper
//                       const header = ["date", "time", "latitude", "longitude", "recordedAt"];
//                       const rows = attendanceRecords.map((a) => {
//                         const date = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//                         const time = a.date ? moment(a.date).format("HH:mm:ss") : "";
//                         const lat = a.location?.latitude ?? "";
//                         const lng = a.location?.longitude ?? "";
//                         const recorded = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "";
//                         return [date, time, lat, lng, recorded].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
//                       });
//                       const csv = [header.join(","), ...rows].join("\n");
//                       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                       const url = URL.createObjectURL(blob);
//                       const a = document.createElement("a");
//                       a.href = url;
//                       a.download = `${(selectedSweeper?.name || "sweeper")}_attendance_${attendanceFrom}_${attendanceTo}.csv`;
//                       document.body.appendChild(a);
//                       a.click();
//                       a.remove();
//                       URL.revokeObjectURL(url);
//                     }}
//                   >
//                     <FaDownload className="inline-block mr-2" />
//                     <span className="hidden sm:inline">Export CSV</span>
//                     <span className="sm:hidden">Export</span>
//                   </Button>
//                 </div>
//               </div>

//               {attendanceLoading ? (
//                 <div className="text-sm text-gray-500 text-center py-4">Loading attendance...</div>
//               ) : attendanceError ? (
//                 <div className="text-sm text-red-600 text-center py-4">{attendanceError}</div>
//               ) : attendanceRecords.length === 0 ? (
//                 <div className="text-sm text-gray-500 text-center py-4">No attendance records for this range.</div>
//               ) : (
//                 <div className="overflow-x-auto max-h-[calc(100vh-24rem)] -mx-4 sm:mx-0">
//                   <div className="inline-block min-w-full align-middle">
//                     <table className="min-w-full divide-y divide-gray-200 text-sm">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th scope="col" className="py-2 pl-4 pr-2 sm:px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Date
//                           </th>
//                           <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Time
//                           </th>
//                           <th scope="col" className="hidden sm:table-cell px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Latitude
//                           </th>
//                           <th scope="col" className="hidden sm:table-cell px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Longitude
//                           </th>
//                           <th scope="col" className="py-2 pl-2 pr-4 sm:px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Recorded At
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {attendanceRecords.map((a) => (
//                           <tr key={a._id || `${a.date}-${a.sweeperId}`} className="hover:bg-gray-50">
//                             <td className="py-2 pl-4 pr-2 sm:px-3 whitespace-nowrap text-sm text-gray-900">
//                               {moment(a.date).format("YYYY-MM-DD")}
//                             </td>
//                             <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
//                               {moment(a.date).format("HH:mm:ss")}
//                             </td>
//                             <td className="hidden sm:table-cell px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                               {a.location?.latitude ?? "-"}
//                             </td>
//                             <td className="hidden sm:table-cell px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-500">
//                               {a.location?.longitude ?? "-"}
//                             </td>
//                             <td className="py-2 pl-2 pr-4 sm:px-3 whitespace-nowrap text-sm text-gray-500">
//                               <span className="hidden sm:inline">{a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</span>
//                               <span className="sm:hidden">{a.createdAt ? moment(a.createdAt).format("MM-DD HH:mm") : "-"}</span>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <Card className="p-3">
//                 <div className="text-sm text-gray-500 mb-1">Total records</div>
//                 <div className="text-lg sm:text-xl font-semibold">{attendanceRecords.length}</div>
//               </Card>
//               <Card className="p-3">
//                 <div className="text-sm text-gray-500 mb-1">First record</div>
//                 <div className="text-sm">
//                   <span className="hidden sm:inline">
//                     {attendanceRecords.length ? moment(attendanceRecords[attendanceRecords.length - 1].date).format("YYYY-MM-DD HH:mm") : "-"}
//                   </span>
//                   <span className="sm:hidden">
//                     {attendanceRecords.length ? moment(attendanceRecords[attendanceRecords.length - 1].date).format("MM-DD HH:mm") : "-"}
//                   </span>
//                 </div>
//               </Card>
//               <Card className="p-3">
//                 <div className="text-sm text-gray-500 mb-1">Last record</div>
//                 <div className="text-sm">
//                   <span className="hidden sm:inline">
//                     {attendanceRecords.length ? moment(attendanceRecords[0].date).format("YYYY-MM-DD HH:mm") : "-"}
//                   </span>
//                   <span className="sm:hidden">
//                     {attendanceRecords.length ? moment(attendanceRecords[0].date).format("MM-DD HH:mm") : "-"}
//                   </span>
//                 </div>
//               </Card>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AttendanceRecords;




// import React, { useEffect, useState } from "react";
// import Card from "../../components/common/Card";
// import Badge from "../../components/common/Badge";
// import Button from "../../components/common/Button";
// import { FaSearch, FaCalendarAlt, FaDownload, FaUserCheck, FaFilter } from "react-icons/fa";
// import moment from "moment";

// const API_BASE = "https://smc-backend-bjm5.onrender.com";
// // const API_BASE = "http://localhost:3000";

// const AttendanceRecords = () => {
//   const [sweepers, setSweepers] = useState([]);
//   const [loadingSweepers, setLoadingSweepers] = useState(true);
//   const [sweepersError, setSweepersError] = useState("");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [zoneFilter, setZoneFilter] = useState("");

//   // detail modal & attendance
//   const [selectedSweeper, setSelectedSweeper] = useState(null);
//   const [showDetailModal, setShowDetailModal] = useState(false);

//   const [attendanceFrom, setAttendanceFrom] = useState(
//     moment().subtract(7, "days").format("YYYY-MM-DD")
//   );
//   const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [attendanceLoading, setAttendanceLoading] = useState(false);
//   const [attendanceError, setAttendanceError] = useState("");

//   // Export-specific date range (for exporting sweepers + attendance)
//   const [exportFrom, setExportFrom] = useState(moment().subtract(7, "days").format("YYYY-MM-DD"));
//   const [exportTo, setExportTo] = useState(moment().format("YYYY-MM-DD"));
//   const [exporting, setExporting] = useState(false);

//   // Load sweepers list
//   const loadSweepers = async () => {
//     setLoadingSweepers(true);
//     setSweepersError("");
//     try {
//       const res = await fetch(`${API_BASE}/sweepers`);
//       if (!res.ok) throw new Error(`Failed to load sweepers (${res.status})`);
//       const json = await res.json();
//       const list = Array.isArray(json.sweepers) ? json.sweepers : [];
//       setSweepers(list);
//     } catch (err) {
//       console.error("loadSweepers:", err);
//       setSweepersError(err.message || "Failed to load sweepers");
//       setSweepers([]);
//     } finally {
//       setLoadingSweepers(false);
//     }
//   };

//   useEffect(() => {
//     loadSweepers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Fetch attendance for a given sweeper between from..to (inclusive)
//   const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
//     try {
//       const url = new URL(`${API_BASE}/sweepers/${sweeperId}/attendance`);
//       if (from) url.searchParams.append("from", from);
//       if (to) url.searchParams.append("to", to);
//       const res = await fetch(url.toString());
//       if (!res.ok) {
//         console.warn(`fetchAttendanceForSweeper ${sweeperId} returned ${res.status}`);
//         return [];
//       }
//       const json = await res.json();
//       const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
//       // sort newest first
//       records.sort((a, b) => new Date(b.date) - new Date(a.date));
//       return records;
//     } catch (err) {
//       console.error("fetchAttendanceForSweeper error:", err);
//       return [];
//     }
//   };

//   // Open detail modal for a sweeper and load attendance range
//   const openSweeperDetail = async (sweeper) => {
//     setSelectedSweeper(sweeper);
//     setShowDetailModal(true);
//     setAttendanceLoading(true);
//     setAttendanceError("");
//     setAttendanceRecords([]);
//     try {
//       const records = await fetchAttendanceForSweeper(sweeper._id || sweeper.id, attendanceFrom, attendanceTo);
//       setAttendanceRecords(records);
//     } catch (err) {
//       setAttendanceError(err.message || "Failed to fetch attendance");
//       setAttendanceRecords([]);
//     } finally {
//       setAttendanceLoading(false);
//     }
//   };

//   // Export: sweepers + their attendance (exportFrom/exportTo)
//   const exportSweepersWithAttendance = async () => {
//     if (!sweepers || sweepers.length === 0) return;
//     setExporting(true);
//     try {
//       // We'll fetch each sweeper's attendance for the export range in parallel.
//       // For large datasets consider server-side export. For now we do client-side.
//       const fetchPromises = sweepers.map(async (s) => {
//         const records = await fetchAttendanceForSweeper(s._id || s.id, exportFrom, exportTo);
//         return { sweeper: s, attendance: records };
//       });

//       const results = await Promise.all(fetchPromises);

//       // Build CSV:
//       // Columns:
//       // sweeper_id, name, email, zone, status, dutyStart, dutyEnd, attendance_date, recorded_date, recorded_time
//       const header = [
//         "sweeper_id",
//         "name",
//         "email",
//         "zone",
//         "status",
//         "duty_start",
//         "duty_end",
//         "attendance_date",
//         "recorded_date",
//         "recorded_time",
//       ];

//       const rows = [];

//       results.forEach(({ sweeper, attendance }) => {
//         if (attendance && attendance.length > 0) {
//           attendance.forEach((a) => {
//             const attendanceDate = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//             const recordedDate = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "";
//             const recordedTime = a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "";
//             const row = [
//               sweeper._id || sweeper.id || "",
//               sweeper.name || "",
//               sweeper.email || "",
//               sweeper.zone || "",
//               sweeper.status || "",
//               (sweeper.dutyTime && sweeper.dutyTime.start) || "",
//               (sweeper.dutyTime && sweeper.dutyTime.end) || "",
//               attendanceDate,
//               recordedDate,
//               recordedTime,
//             ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
//             rows.push(row.join(","));
//           });
//         } else {
//           // No attendance rows: still include a row with empty attendance fields
//           const row = [
//             sweeper._id || sweeper.id || "",
//             sweeper.name || "",
//             sweeper.email || "",
//             sweeper.zone || "",
//             sweeper.status || "",
//             (sweeper.dutyTime && sweeper.dutyTime.start) || "",
//             (sweeper.dutyTime && sweeper.dutyTime.end) || "",
//             "", // attendance_date
//             "", // recorded_date
//             "", // recorded_time
//           ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
//           rows.push(row.join(","));
//         }
//       });

//       const csv = [header.join(","), ...rows].join("\n");
//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       const filename = `sweepers_with_attendance_${exportFrom}_${exportTo}.csv`;
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("exportSweepersWithAttendance error:", err);
//       window.alert("Failed to export sweepers + attendance. See console for details.");
//     } finally {
//       setExporting(false);
//     }
//   };

//   // Derived zones
//   const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

//   const filteredSweepers = sweepers.filter((s) => {
//     const nameMatch = s.name ? s.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
//     const zoneMatch = zoneFilter === "" || (s.zone || "") === zoneFilter;
//     return nameMatch && zoneMatch;
//   });

//   return (
//     <div>
//       <h1 className="text-2xl font-heading font-semibold mb-6">Sweepers & Attendance</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
//         {/* Left: Sweeper list */}
//         <Card className="lg:col-span-1">
//           <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
//             <h2 className="text-lg font-medium">Sweeper List</h2>
//             <Button 
//               variant="outline" 
//               color="secondary" 
//               onClick={loadSweepers}
//               className="w-full sm:w-auto"
//             >
//               Refresh
//             </Button>
//           </div>

//           <div className="flex flex-col md:flex-row gap-4 mb-4">
//             <div className="relative flex-1">
//               <input
//                 type="text"
//                 placeholder="Search by name..."
//                 className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             </div>

//             <select
//               className="w-full md:w-1/3 py-2 px-3 border rounded-lg text-sm"
//               value={zoneFilter}
//               onChange={(e) => setZoneFilter(e.target.value)}
//             >
//               <option value="">All Zones</option>
//               {zones.map((z) => (
//                 <option value={z} key={z}>
//                   {z}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
//             {loadingSweepers ? (
//               <div className="text-center py-6 text-gray-500">Loading sweepers...</div>
//             ) : sweepersError ? (
//               <div className="text-center py-6 text-red-600">{sweepersError}</div>
//             ) : filteredSweepers.length === 0 ? (
//               <div className="text-center py-6 text-gray-500">No sweepers found.</div>
//             ) : (
//               <ul className="space-y-2">
//                 {filteredSweepers.map((s) => (
//                   <li
//                     key={s._id || s.id}
//                     className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors duration-150"
//                     onClick={() => openSweeperDetail(s)}
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
//                       <div className="space-y-1">
//                         <div className="font-medium text-sm text-primary">{s.name}</div>
//                         <div className="text-xs text-gray-500 break-all">{s.email}</div>
//                         <div className="text-xs text-gray-500">Zone: {s.zone || "—"}</div>
//                       </div>

//                       <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:text-right">
//                         <Badge variant={(s.status === "active" && "success") || "warning"} className="capitalize text-xs">
//                           {s.status || "unknown"}
//                         </Badge>
//                         <div className="text-xs text-gray-500">
//                           {s.dutyTime && (s.dutyTime.start || s.dutyTime.end)
//                             ? `${s.dutyTime.start || "—"} - ${s.dutyTime.end || "—"}`
//                             : "No duty time"}
//                         </div>
//                       </div>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>
//         </Card>

//         {/* Right: Overview + export */}
//         <div className="lg:col-span-2 space-y-6">
//           <Card>
//             <div className="flex flex-col lg:flex-row lg:items-center gap-4">
//               <div className="flex-1">
//                 <h2 className="text-lg font-medium mb-1">Attendance Overview</h2>
//                 <div className="text-sm text-gray-500">Click a sweeper from the left to view details and attendance records.</div>
//               </div>

//               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
//                 <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
//                     <label className="text-sm text-gray-600">From</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={exportFrom} 
//                       onChange={(e) => setExportFrom(e.target.value)} 
//                     />
//                   </div>
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
//                     <label className="text-sm text-gray-600">To</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={exportTo} 
//                       onChange={(e) => setExportTo(e.target.value)} 
//                     />
//                   </div>
//                 </div>
//                 <Button 
//                   color="black" 
//                   onClick={exportSweepersWithAttendance} 
//                   disabled={exporting}
//                   className="w-full sm:w-auto whitespace-nowrap"
//                 >
//                   {exporting ? "Exporting..." : (
//                     <>
//                       <FaDownload className="inline-block mr-2" />
//                       <span className="hidden sm:inline">Export Sweepers + Attendance</span>
//                       <span className="sm:hidden">Export Data</span>
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </Card>

//           <Card>
//             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
//               <div>
//                 <div className="text-sm text-gray-500 mb-1">Total Sweepers</div>
//                 <div className="text-lg sm:text-2xl font-semibold">{sweepers.length}</div>
//               </div>
//               <div className="col-span-2 sm:col-span-1">
//                 <div className="text-sm text-gray-500 mb-1">Zones</div>
//                 <div className="text-sm sm:text-base truncate" title={zones.join(", ") || "—"}>
//                   {zones.join(", ") || "—"}
//                 </div>
//               </div>
//               <div className="sm:text-right">
//                 <div className="text-sm text-gray-500 mb-1">Last Refresh</div>
//                 <div className="text-sm sm:text-base">{moment().format("YYYY-MM-DD HH:mm")}</div>
//               </div>
//             </div>
//           </Card>

//           <Card>
//             <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Insights</h3>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="text-sm text-gray-500 mb-1">Avg Verifications</div>
//                 <div className="text-lg sm:text-xl font-semibold">—</div>
//               </div>
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="text-sm text-gray-500 mb-1">On-time Rate</div>
//                 <div className="text-lg sm:text-xl font-semibold">—</div>
//               </div>
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <div className="text-sm text-gray-500 mb-1">Missing Today</div>
//                 <div className="text-lg sm:text-xl font-semibold">—</div>
//               </div>
//             </div>
//           </Card>
//         </div>
//       </div>

//       {/* Sweeper Detail Modal */}
//       {showDetailModal && selectedSweeper && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-auto">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-4 sm:p-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
//               <div className="space-y-1">
//                 <h3 className="text-lg sm:text-xl font-semibold">{selectedSweeper.name}</h3>
//                 <div className="text-sm text-gray-600 break-all">{selectedSweeper.email}</div>
//                 <div className="text-sm text-gray-600">Zone: {selectedSweeper.zone || "—"}</div>
//                 <div className="text-sm text-gray-600">
//                   Duty Time: {selectedSweeper.dutyTime?.start || "—"} - {selectedSweeper.dutyTime?.end || "—"}
//                 </div>
//                 <div className="text-sm text-gray-600">Geofence points: {(selectedSweeper.geofence || []).length}</div>
//                 <div className="text-sm text-gray-600">Checkpoints: {(selectedSweeper.checkpoints || []).length}</div>
//               </div>

//               <div>
//                 <Button 
//                   variant="outline" 
//                   color="default" 
//                   onClick={() => { setShowDetailModal(false); setSelectedSweeper(null); }}
//                 >
//                   Close
//                 </Button>
//               </div>
//             </div>

//             <div className="mb-4">
//               <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
//                 <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
//                     <label className="text-sm text-gray-600">From</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={attendanceFrom} 
//                       onChange={(e) => setAttendanceFrom(e.target.value)} 
//                     />
//                   </div>
//                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
//                     <label className="text-sm text-gray-600">To</label>
//                     <input 
//                       type="date" 
//                       className="w-full sm:w-auto border p-2 rounded text-sm" 
//                       value={attendanceTo} 
//                       onChange={(e) => setAttendanceTo(e.target.value)} 
//                     />
//                   </div>
//                 </div>
//                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
//                   <Button 
//                     color="primary" 
//                     className="w-full sm:w-auto"
//                     onClick={async () => {
//                       setAttendanceLoading(true);
//                       setAttendanceError("");
//                       try {
//                         const recs = await fetchAttendanceForSweeper(selectedSweeper._id || selectedSweeper.id, attendanceFrom, attendanceTo);
//                         setAttendanceRecords(recs);
//                       } catch (err) {
//                         setAttendanceError(err?.message || "Failed to refresh");
//                         setAttendanceRecords([]);
//                       } finally {
//                         setAttendanceLoading(false);
//                       }
//                     }}
//                   >
//                     Refresh
//                   </Button>
//                   <Button 
//                     variant="outline" 
//                     color="secondary"
//                     className="w-full sm:w-auto whitespace-nowrap"
//                     onClick={() => {
//                       if (!attendanceRecords || attendanceRecords.length === 0) {
//                         window.alert("No records to export");
//                         return;
//                       }
//                       // Export just the displayed attendance records for this sweeper
//                       const header = ["attendanceDate", "recordedDate", "recordedTime"];
//                       const rows = attendanceRecords.map((a) => {
//                         const attendanceDate = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
//                         const recordedDate = a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "";
//                         const recordedTime = a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "";
//                         return [attendanceDate, recordedDate, recordedTime].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
//                       });
//                       const csv = [header.join(","), ...rows].join("\n");
//                       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                       const url = URL.createObjectURL(blob);
//                       const a = document.createElement("a");
//                       a.href = url;
//                       a.download = `${(selectedSweeper?.name || "sweeper")}_attendance_${attendanceFrom}_${attendanceTo}.csv`;
//                       document.body.appendChild(a);
//                       a.click();
//                       a.remove();
//                       URL.revokeObjectURL(url);
//                     }}
//                   >
//                     <FaDownload className="inline-block mr-2" />
//                     <span className="hidden sm:inline">Export CSV</span>
//                     <span className="sm:hidden">Export</span>
//                   </Button>
//                 </div>
//               </div>

//               {attendanceLoading ? (
//                 <div className="text-sm text-gray-500 text-center py-4">Loading attendance...</div>
//               ) : attendanceError ? (
//                 <div className="text-sm text-red-600 text-center py-4">{attendanceError}</div>
//               ) : attendanceRecords.length === 0 ? (
//                 <div className="text-sm text-gray-500 text-center py-4">No attendance records for this range.</div>
//               ) : (
//                 <div className="overflow-x-auto max-h-[calc(100vh-24rem)] -mx-4 sm:mx-0">
//                   <div className="inline-block min-w-full align-middle">
//                     <table className="min-w-full divide-y divide-gray-200 text-sm">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th scope="col" className="py-2 pl-4 pr-2 sm:px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Attendance Date
//                           </th>
//                           <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Recorded Date
//                           </th>
//                           <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             Recorded Time
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-gray-200">
//                         {attendanceRecords.map((a) => (
//                           <tr key={a._id || `${a.date}-${a.sweeperId}`} className="hover:bg-gray-50">
//                             <td className="py-2 pl-4 pr-2 sm:px-3 whitespace-nowrap text-sm text-gray-900">
//                               {a.date ? moment(a.date).format("YYYY-MM-DD") : "-"}
//                             </td>
//                             <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
//                               {a.createdAt ? moment(a.createdAt).format("YYYY-MM-DD") : "-"}
//                             </td>
//                             <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
//                               {a.createdAt ? moment(a.createdAt).format("HH:mm:ss") : "-"}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <Card className="p-3">
//                 <div className="text-sm text-gray-500 mb-1">Total records</div>
//                 <div className="text-lg sm:text-xl font-semibold">{attendanceRecords.length}</div>
//               </Card>
//               <Card className="p-3">
//                 <div className="text-sm text-gray-500 mb-1">First record</div>
//                 <div className="text-sm">
//                   <span className="hidden sm:inline">
//                     {attendanceRecords.length ? moment(attendanceRecords[attendanceRecords.length - 1].date).format("YYYY-MM-DD HH:mm") : "-"}
//                   </span>
//                   <span className="sm:hidden">
//                     {attendanceRecords.length ? moment(attendanceRecords[attendanceRecords.length - 1].date).format("MM-DD HH:mm") : "-"}
//                   </span>
//                 </div>
//               </Card>
//               <Card className="p-3">
//                 <div className="text-sm text-gray-500 mb-1">Last record</div>
//                 <div className="text-sm">
//                   <span className="hidden sm:inline">
//                     {attendanceRecords.length ? moment(attendanceRecords[0].date).format("YYYY-MM-DD HH:mm") : "-"}
//                   </span>
//                   <span className="sm:hidden">
//                     {attendanceRecords.length ? moment(attendanceRecords[0].date).format("MM-DD HH:mm") : "-"}
//                   </span>
//                 </div>
//               </Card>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AttendanceRecords;



import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { FaSearch, FaDownload } from "react-icons/fa";
import moment from "moment";

const API_BASE = "https://smc-backend-bjm5.onrender.com";
// const API_BASE = "http://localhost:3000";

const AttendanceRecords = () => {
  const [sweepers, setSweepers] = useState([]);
  const [loadingSweepers, setLoadingSweepers] = useState(true);
  const [sweepersError, setSweepersError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");

  // detail modal & attendance
  const [selectedSweeper, setSelectedSweeper] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [attendanceFrom, setAttendanceFrom] = useState(
    moment().subtract(7, "days").format("YYYY-MM-DD")
  );
  const [attendanceTo, setAttendanceTo] = useState(moment().format("YYYY-MM-DD"));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  // alarm events for selected sweeper
  const [alarmRecords, setAlarmRecords] = useState([]);
  const [alarmsLoading, setAlarmsLoading] = useState(false);
  const [alarmsError, setAlarmsError] = useState("");

  // Export-specific date range (for exporting sweepers + attendance)
  const [exportFrom, setExportFrom] = useState(
    moment().subtract(7, "days").format("YYYY-MM-DD")
  );
  const [exportTo, setExportTo] = useState(moment().format("YYYY-MM-DD"));
  const [exporting, setExporting] = useState(false);

  // Load sweepers list
  const loadSweepers = async () => {
    setLoadingSweepers(true);
    setSweepersError("");
    try {
      const res = await fetch(`${API_BASE}/sweepers`);
      if (!res.ok) throw new Error(`Failed to load sweepers (${res.status})`);
      const json = await res.json();
      const list = Array.isArray(json.sweepers) ? json.sweepers : [];
      setSweepers(list);
    } catch (err) {
      console.error("loadSweepers:", err);
      setSweepersError(err.message || "Failed to load sweepers");
      setSweepers([]);
    } finally {
      setLoadingSweepers(false);
    }
  };

  useEffect(() => {
    loadSweepers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch attendance for a given sweeper between from..to (inclusive)
  const fetchAttendanceForSweeper = async (sweeperId, from, to) => {
    try {
      const url = new URL(`${API_BASE}/sweepers/${sweeperId}/attendance`);
      if (from) url.searchParams.append("from", from);
      if (to) url.searchParams.append("to", to);
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`fetchAttendanceForSweeper ${sweeperId} returned ${res.status}`);
        return [];
      }
      const json = await res.json();
      const records = Array.isArray(json.attendanceHistory) ? json.attendanceHistory : [];
      // sort newest first
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      return records;
    } catch (err) {
      console.error("fetchAttendanceForSweeper error:", err);
      return [];
    }
  };

  // Fetch alarm events for a given sweeper (filtered by same date range)
  const fetchAlarmsForSweeper = async (sweeperId, from, to) => {
    try {
      const url = new URL(`${API_BASE}/sweepers/${sweeperId}/alarmevents`);

      // backend expects epoch ms in from/to
      if (from) {
        const d = new Date(from);
        d.setHours(0, 0, 0, 0);
        url.searchParams.append("from", String(d.getTime()));
      }
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        url.searchParams.append("to", String(d.getTime()));
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`fetchAlarmsForSweeper ${sweeperId} returned ${res.status}`);
        return [];
      }
      const json = await res.json().catch(() => []);
      const events = Array.isArray(json) ? json : [];

      // sort latest first
      events.sort((a, b) => (b.alarmTimestampMs || 0) - (a.alarmTimestampMs || 0));
      return events;
    } catch (err) {
      console.error("fetchAlarmsForSweeper error:", err);
      return [];
    }
  };

  // Open detail modal for a sweeper and load attendance + alarms
  const openSweeperDetail = async (sweeper) => {
    setSelectedSweeper(sweeper);
    setShowDetailModal(true);

    setAttendanceLoading(true);
    setAttendanceError("");
    setAttendanceRecords([]);

    setAlarmsLoading(true);
    setAlarmsError("");
    setAlarmRecords([]);

    try {
      const sweeperId = sweeper._id || sweeper.id;

      const [records, alarms] = await Promise.all([
        fetchAttendanceForSweeper(sweeperId, attendanceFrom, attendanceTo),
        fetchAlarmsForSweeper(sweeperId, attendanceFrom, attendanceTo),
      ]);

      setAttendanceRecords(records);
      setAlarmRecords(alarms);
    } catch (err) {
      setAttendanceError(err.message || "Failed to fetch attendance");
      setAttendanceRecords([]);
      setAlarmsError(err.message || "Failed to fetch alarm events");
      setAlarmRecords([]);
    } finally {
      setAttendanceLoading(false);
      setAlarmsLoading(false);
    }
  };

  // Export: sweepers + their attendance (exportFrom/exportTo)
  const exportSweepersWithAttendance = async () => {
    if (!sweepers || sweepers.length === 0) return;
    setExporting(true);
    try {
      // We'll fetch each sweeper's attendance for the export range in parallel.
      const fetchPromises = sweepers.map(async (s) => {
        const records = await fetchAttendanceForSweeper(
          s._id || s.id,
          exportFrom,
          exportTo
        );
        return { sweeper: s, attendance: records };
      });

      const results = await Promise.all(fetchPromises);

      // Build CSV:
      // sweeper_id, name, email, zone, status, dutyStart, dutyEnd, attendance_date, recorded_date, recorded_time
      const header = [
        "sweeper_id",
        "name",
        "email",
        "zone",
        "status",
        "duty_start",
        "duty_end",
        "attendance_date",
        "recorded_date",
        "recorded_time",
      ];

      const rows = [];

      results.forEach(({ sweeper, attendance }) => {
        if (attendance && attendance.length > 0) {
          attendance.forEach((a) => {
            const attendanceDate = a.date ? moment(a.date).format("YYYY-MM-DD") : "";
            const recordedDate = a.createdAt
              ? moment(a.createdAt).format("YYYY-MM-DD")
              : "";
            const recordedTime = a.createdAt
              ? moment(a.createdAt).format("HH:mm:ss")
              : "";
            const row = [
              sweeper._id || sweeper.id || "",
              sweeper.name || "",
              sweeper.email || "",
              sweeper.zone || "",
              sweeper.status || "",
              (sweeper.dutyTime && sweeper.dutyTime.start) || "",
              (sweeper.dutyTime && sweeper.dutyTime.end) || "",
              attendanceDate,
              recordedDate,
              recordedTime,
            ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
            rows.push(row.join(","));
          });
        } else {
          // No attendance rows: still include a row with empty attendance fields
          const row = [
            sweeper._id || sweeper.id || "",
            sweeper.name || "",
            sweeper.email || "",
            sweeper.zone || "",
            sweeper.status || "",
            (sweeper.dutyTime && sweeper.dutyTime.start) || "",
            (sweeper.dutyTime && sweeper.dutyTime.end) || "",
            "",
            "",
            "",
          ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
          rows.push(row.join(","));
        }
      });

      const csv = [header.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `sweepers_with_attendance_${exportFrom}_${exportTo}.csv`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("exportSweepersWithAttendance error:", err);
      window.alert(
        "Failed to export sweepers + attendance. See console for details."
      );
    } finally {
      setExporting(false);
    }
  };

  // Derived zones
  const zones = Array.from(new Set(sweepers.map((s) => s.zone).filter(Boolean)));

  const filteredSweepers = sweepers.filter((s) => {
    const nameMatch = s.name
      ? s.name.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    const zoneMatch = zoneFilter === "" || (s.zone || "") === zoneFilter;
    return nameMatch && zoneMatch;
  });

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">
        Sweepers & Attendance
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Sweeper list */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-medium">Sweeper List</h2>
            <Button
              variant="outline"
              color="secondary"
              onClick={loadSweepers}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <select
              className="w-full md:w-1/3 py-2 px-3 border rounded-lg text-sm"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map((z) => (
                <option value={z} key={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
            {loadingSweepers ? (
              <div className="text-center py-6 text-gray-500">
                Loading sweepers...
              </div>
            ) : sweepersError ? (
              <div className="text-center py-6 text-red-600">
                {sweepersError}
              </div>
            ) : filteredSweepers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No sweepers found.
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredSweepers.map((s) => (
                  <li
                    key={s._id || s.id}
                    className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => openSweeperDetail(s)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-primary">
                          {s.name}
                        </div>
                        <div className="text-xs text-gray-500 break-all">
                          {s.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          Zone: {s.zone || "—"}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:text-right">
                        <Badge
                          variant={
                            (s.status === "active" && "success") || "warning"
                          }
                          className="capitalize text-xs"
                        >
                          {s.status || "unknown"}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {s.dutyTime && (s.dutyTime.start || s.dutyTime.end)
                            ? `${s.dutyTime.start || "—"} - ${
                                s.dutyTime.end || "—"
                              }`
                            : "No duty time"}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Right: Overview + export */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-medium mb-1">
                  Attendance Overview
                </h2>
                <div className="text-sm text-gray-500">
                  Click a sweeper from the left to view details and attendance
                  records.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                    <label className="text-sm text-gray-600">From</label>
                    <input
                      type="date"
                      className="w-full sm:w-auto border p-2 rounded text-sm"
                      value={exportFrom}
                      onChange={(e) => setExportFrom(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                    <label className="text-sm text-gray-600">To</label>
                    <input
                      type="date"
                      className="w-full sm:w-auto border p-2 rounded text-sm"
                      value={exportTo}
                      onChange={(e) => setExportTo(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  color="black"
                  onClick={exportSweepersWithAttendance}
                  disabled={exporting}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  {exporting ? (
                    "Exporting..."
                  ) : (
                    <>
                      <FaDownload className="inline-block mr-2" />
                      <span className="hidden sm:inline">
                        Export Sweepers + Attendance
                      </span>
                      <span className="sm:hidden">Export Data</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Total Sweepers
                </div>
                <div className="text-lg sm:text-2xl font-semibold">
                  {sweepers.length}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-sm text-gray-500 mb-1">Zones</div>
                <div
                  className="text-sm sm:text-base truncate"
                  title={zones.join(", ") || "—"}
                >
                  {zones.join(", ") || "—"}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-sm text-gray-500 mb-1">
                  Last Refresh
                </div>
                <div className="text-sm sm:text-base">
                  {moment().format("YYYY-MM-DD HH:mm")}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Quick Insights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">
                  Avg Verifications
                </div>
                <div className="text-lg sm:text-xl font-semibold">—</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">
                  On-time Rate
                </div>
                <div className="text-lg sm:text-xl font-semibold">—</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">
                  Missing Today
                </div>
                <div className="text-lg sm:text-xl font-semibold">—</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sweeper Detail Modal */}
      {showDetailModal && selectedSweeper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold">
                  {selectedSweeper.name}
                </h3>
                <div className="text-sm text-gray-600 break-all">
                  {selectedSweeper.email}
                </div>
                <div className="text-sm text-gray-600">
                  Zone: {selectedSweeper.zone || "—"}
                </div>
                <div className="text-sm text-gray-600">
                  Duty Time: {selectedSweeper.dutyTime?.start || "—"} -{" "}
                  {selectedSweeper.dutyTime?.end || "—"}
                </div>
                <div className="text-sm text-gray-600">
                  Geofence points:{" "}
                  {(selectedSweeper.geofence || []).length}
                </div>
                <div className="text-sm text-gray-600">
                  Checkpoints:{" "}
                  {(selectedSweeper.checkpoints || []).length}
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  color="default"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSweeper(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                    <label className="text-sm text-gray-600">From</label>
                    <input
                      type="date"
                      className="w-full sm:w-auto border p-2 rounded text-sm"
                      value={attendanceFrom}
                      onChange={(e) => setAttendanceFrom(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                    <label className="text-sm text-gray-600">To</label>
                    <input
                      type="date"
                      className="w-full sm:w-auto border p-2 rounded text-sm"
                      value={attendanceTo}
                      onChange={(e) => setAttendanceTo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    color="primary"
                    className="w-full sm:w-auto"
                    onClick={async () => {
                      if (!selectedSweeper) return;

                      setAttendanceLoading(true);
                      setAttendanceError("");
                      setAlarmsLoading(true);
                      setAlarmsError("");

                      try {
                        const sweeperId =
                          selectedSweeper._id || selectedSweeper.id;

                        const [recs, alarms] = await Promise.all([
                          fetchAttendanceForSweeper(
                            sweeperId,
                            attendanceFrom,
                            attendanceTo
                          ),
                          fetchAlarmsForSweeper(
                            sweeperId,
                            attendanceFrom,
                            attendanceTo
                          ),
                        ]);

                        setAttendanceRecords(recs);
                        setAlarmRecords(alarms);
                      } catch (err) {
                        setAttendanceError(
                          err?.message || "Failed to refresh attendance"
                        );
                        setAttendanceRecords([]);
                        setAlarmsError(
                          err?.message || "Failed to refresh alarm events"
                        );
                        setAlarmRecords([]);
                      } finally {
                        setAttendanceLoading(false);
                        setAlarmsLoading(false);
                      }
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    color="secondary"
                    className="w-full sm:w-auto whitespace-nowrap"
                    onClick={() => {
                      if (!attendanceRecords || attendanceRecords.length === 0) {
                        window.alert("No records to export");
                        return;
                      }
                      // Export just the displayed attendance records for this sweeper
                      const header = [
                        "attendanceDate",
                        "recordedDate",
                        "recordedTime",
                      ];
                      const rows = attendanceRecords.map((a) => {
                        const attendanceDate = a.date
                          ? moment(a.date).format("YYYY-MM-DD")
                          : "";
                        const recordedDate = a.createdAt
                          ? moment(a.createdAt).format("YYYY-MM-DD")
                          : "";
                        const recordedTime = a.createdAt
                          ? moment(a.createdAt).format("HH:mm:ss")
                          : "";
                        return [attendanceDate, recordedDate, recordedTime]
                          .map((v) =>
                            `"${String(v).replace(/"/g, '""')}"`
                          )
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
                        selectedSweeper?.name || "sweeper"
                      }_attendance_${attendanceFrom}_${attendanceTo}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <FaDownload className="inline-block mr-2" />
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </div>
              </div>

              {/* Attendance table */}
              {attendanceLoading ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading attendance...
                </div>
              ) : attendanceError ? (
                <div className="text-sm text-red-600 text-center py-4">
                  {attendanceError}
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No attendance records for this range.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[calc(100vh-24rem)] -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 pl-4 pr-2 sm:px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendance Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recorded Date
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            <td className="py-2 pl-4 pr-2 sm:px-3 whitespace-nowrap text-sm text-gray-900">
                              {a.date
                                ? moment(a.date).format("YYYY-MM-DD")
                                : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {a.createdAt
                                ? moment(a.createdAt).format("YYYY-MM-DD")
                                : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {a.createdAt
                                ? moment(a.createdAt).format("HH:mm:ss")
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Alarm / Events History */}
            <div className="mb-4 mt-6">
              <h4 className="text-sm font-medium mb-2">
                Alarm / Events History
              </h4>

              {alarmsLoading ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading alarm events...
                </div>
              ) : alarmsError ? (
                <div className="text-sm text-red-600 text-center py-4">
                  {alarmsError}
                </div>
              ) : alarmRecords.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No alarm events for this range.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[calc(100vh-24rem)] -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 pl-4 pr-2 sm:px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Alarm Time
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Opened
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Opened Time
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response (ms)
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verification Time
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verification Status
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {alarmRecords.map((ev) => (
                          <tr key={ev._id} className="hover:bg-gray-50">
                            <td className="py-2 pl-4 pr-2 sm:px-3 whitespace-nowrap text-sm text-gray-900">
                              {ev.alarmTimestampMs
                                ? moment(
                                    Number(ev.alarmTimestampMs)
                                  ).format("DD MMM YYYY, hh:mm:ss A")
                                : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ev.opened ? "Yes" : "No"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ev.openedTimestampMs
                                ? moment(
                                    Number(ev.openedTimestampMs)
                                  ).format("hh:mm:ss A")
                                : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ev.responseMs ?? "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ev.verificationTimestampMs
                                ? moment(
                                    Number(ev.verificationTimestampMs)
                                  ).format("DD MMM YYYY, hh:mm:ss A")
                                : "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ev.verificationStatus ?? "-"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {ev.createdAt
                                ? moment(ev.createdAt).format(
                                    "DD MMM YYYY, hh:mm A"
                                  )
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-3">
                <div className="text-sm text-gray-500 mb-1">
                  Total records
                </div>
                <div className="text-lg sm:text-xl font-semibold">
                  {attendanceRecords.length}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-sm text-gray-500 mb-1">
                  First record
                </div>
                <div className="text-sm">
                  <span className="hidden sm:inline">
                    {attendanceRecords.length
                      ? moment(
                          attendanceRecords[attendanceRecords.length - 1].date
                        ).format("YYYY-MM-DD HH:mm")
                      : "-"}
                  </span>
                  <span className="sm:hidden">
                    {attendanceRecords.length
                      ? moment(
                          attendanceRecords[attendanceRecords.length - 1].date
                        ).format("MM-DD HH:mm")
                      : "-"}
                  </span>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-sm text-gray-500 mb-1">
                  Last record
                </div>
                <div className="text-sm">
                  <span className="hidden sm:inline">
                    {attendanceRecords.length
                      ? moment(attendanceRecords[0].date).format(
                          "YYYY-MM-DD HH:mm"
                        )
                      : "-"}
                  </span>
                  <span className="sm:hidden">
                    {attendanceRecords.length
                      ? moment(attendanceRecords[0].date).format(
                          "MM-DD HH:mm"
                        )
                      : "-"}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecords;

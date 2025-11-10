import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { FaSearch, FaTrash, FaSync, FaUserPlus, FaClock } from "react-icons/fa";
import { io } from "socket.io-client";

const API_BASE = "https://smc-backend-bjm5.onrender.com";

const SweeperList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [sweepers, setSweepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add Sweeper modal & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addZone, setAddZone] = useState("");
  const [addStatus, setAddStatus] = useState("active");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // duty modal states
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [selectedSweeper, setSelectedSweeper] = useState(null);
  const [dutyStart, setDutyStart] = useState("");
  const [dutyEnd, setDutyEnd] = useState("");
  const [savingDuty, setSavingDuty] = useState(false);
  const [dutyError, setDutyError] = useState("");

  // deletion state
  const [deletingId, setDeletingId] = useState(null);

  const socketRef = useRef(null);

  const fetchSweepers = async () => {
    const res = await fetch(`${API_BASE}/sweepers`);
    if (!res.ok) throw new Error("Failed to fetch sweepers");
    const json = await res.json();
    return Array.isArray(json.sweepers) ? json.sweepers : [];
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const sw = await fetchSweepers();
      setSweepers(sw);
    } catch (err) {
      console.error("[SweeperList] loadData error:", err);
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // safe socket base
    const rawBase = API_BASE || "";
    const safeBase = (typeof rawBase === "string" ? rawBase.trim() : "") || window.location.origin;

    let s;
    try {
      s = io(safeBase, { transports: ["websocket", "polling"] });
      socketRef.current = s;
      console.debug("[SweeperList] socket connecting to", safeBase);

      const onUpdate = () => {
        loadData();
      };

      s.on("connect", () => console.debug("[SweeperList] socket connected", s.id));
      s.on("disconnect", (reason) => console.debug("[SweeperList] socket disconnected", reason));

      s.on("sweeper:added", onUpdate);
      s.on("sweeper:deleted", onUpdate);
      s.on("sweeper:updated", onUpdate);
      s.on("sweeper:duty-time-updated", onUpdate);
      s.on("attendance:marked", onUpdate);
    } catch (err) {
      console.warn("[SweeperList] socket connect failed:", err && err.message ? err.message : err);
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

  const filteredList = sweepers.filter((sweeper) => {
    const nameMatch = sweeper.name ? sweeper.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch;
  });

  // Add Sweeper handler
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
        throw new Error("Unexpected response from server when adding sweeper.");
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to add sweeper (${res.status})`);
      }

      // success: clear form, close modal, reload data
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

  // Duty time modal handlers
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
        throw new Error("Unexpected response from server when saving duty time.");
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Failed to save duty time (${res.status})`);
      }

      // success - refresh data and close modal
      setShowDutyModal(false);
      setSelectedSweeper(null);
      await loadData();
    } catch (err) {
      setDutyError(err.message || "Error saving duty time");
    } finally {
      setSavingDuty(false);
    }
  };

  // Delete sweeper handler
  const handleDeleteSweeper = async (sweeper) => {
    if (!sweeper) return;
    const id = sweeper._id || sweeper.id;
    const confirm = window.confirm(`Delete sweeper "${sweeper.name}"? This will remove the sweeper and associated data.`);

    if (!confirm) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/sweepers/${id}`, {
        method: "DELETE",
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // ignore JSON parse error
      }

      if (!res.ok) {
        // If backend returns JSON with message use it
        const msg = data?.message || `Failed to delete sweeper (${res.status})`;
        throw new Error(msg);
      }

      // success
      // reload list and show a simple notification
      await loadData();
      window.alert(`Sweeper "${sweeper.name}" deleted successfully.`);
    } catch (err) {
      console.error("Error deleting sweeper:", err);
      window.alert(`Failed to delete sweeper: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">Sweeper List</h1>

      <Card>
        {/* toolbar (search and add) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              placeholder="Search sweepers..."
              className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button color="black" onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
              <FaUserPlus className="sm:mr-2" /> <span className="hidden sm:inline">Add New Sweeper</span>
            </Button>
            <Button variant="outline" color="secondary" onClick={() => loadData()} className="w-10 h-10 flex items-center justify-center">
              <FaSync />
            </Button>
          </div>
        </div>

        {/* Table */}
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
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList.map((sweeper) => {
                  const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
                  return (
                    <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{sweeper.name || "—"}</div>
                        <div className="text-xs text-gray-500">{sweeper.email || ""}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {sweeper.dutyTime && (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
                          <div className="text-sm">
                            <div>{sweeper.dutyTime.start || "—"} - {sweeper.dutyTime.end || "—"}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not set</div>
                        )}
                        <div className="mt-2">
                          <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
                            <FaClock className="sm:mr-2" /> <span className="hidden sm:inline">Duty Time</span>
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleDeleteSweeper(sweeper)}
                          disabled={isDeleting}
                          className="w-full sm:w-auto flex items-center justify-center"
                        >
                          <FaTrash className="sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Sweeper</h3>

            <form onSubmit={handleAddSweeper} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input 
                  value={addName} 
                  onChange={(e) => setAddName(e.target.value)} 
                  className="mt-1 block w-full border rounded px-3 py-2" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  value={addEmail} 
                  onChange={(e) => setAddEmail(e.target.value)} 
                  type="email" 
                  className="mt-1 block w-full border rounded px-3 py-2" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                  value={addPassword} 
                  onChange={(e) => setAddPassword(e.target.value)} 
                  type="password" 
                  className="mt-1 block w-full border rounded px-3 py-2" 
                  required 
                />
              </div>

              {addError && <div className="text-sm text-red-600">{addError}</div>}

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  color="secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={adding}
                  className="w-full sm:w-auto"
                >
                  {adding ? "Adding..." : "Add Sweeper"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duty Time Modal */}
      {showDutyModal && selectedSweeper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Duty Time - {selectedSweeper.name}</h3>

            <form onSubmit={handleSaveDuty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  value={dutyStart}
                  onChange={(e) => setDutyStart(e.target.value)}
                  type="time"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  value={dutyEnd}
                  onChange={(e) => setDutyEnd(e.target.value)}
                  type="time"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {dutyError && <div className="text-sm text-red-600">{dutyError}</div>}

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  color="secondary"
                  onClick={() => setShowDutyModal(false)}
                  disabled={savingDuty}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={savingDuty}
                  className="w-full sm:w-auto"
                >
                  {savingDuty ? "Saving..." : "Save Duty Time"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SweeperList;
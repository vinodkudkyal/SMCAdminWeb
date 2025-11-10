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
import {
  WeeklyAttendanceChart,
  AttendancePieChart,
  ZoneAttendanceChart,
  TimeDistributionChart,
} from "../../components/charts/AttendanceCharts";
import { io } from "socket.io-client";

const API_BASE = "https://smc-backend-bjm5.onrender.com";

const SweeperList = () => {
  // ... keep all your existing state and helper functions ...

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-heading font-semibold">Sweeper List</h1>
        <div className="flex items-center gap-2">
          <Button color="black" onClick={() => loadData()} className="w-full sm:w-auto">
            <FaSync className="sm:mr-2" /> <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search sweepers..."
                className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <select
              className="w-full sm:w-48 py-2 px-4 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-sm"
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

          <div className="flex items-center gap-2">
            <Button color="black" onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none">
              <FaUserPlus className="sm:mr-2" /> <span className="hidden sm:inline">Add New Sweeper</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading sweepers...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Error: {error}</div>
          ) : filteredList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No sweepers found.</div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duty Time</th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today</th>
                    <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifications</th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredList.map((sweeper) => {
                    const isDeleting = deletingId && deletingId === (sweeper._id || sweeper.id);
                    return (
                      <tr key={sweeper._id || sweeper.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-sm">{sweeper.name || "—"}</div>
                          <div className="text-xs text-gray-500">{sweeper.email || ""}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">Zone: {sweeper.zone || "—"}</div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sweeper.zone || "—"}</td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge variant={(sweeper.status === "active" && "success") || "warning"} className="capitalize text-xs">
                            {sweeper.status || "unknown"}
                          </Badge>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          {sweeper.dutyTime && (sweeper.dutyTime.start || sweeper.dutyTime.end) ? (
                            <div className="text-sm">
                              <div>{sweeper.dutyTime.start || "—"} - {sweeper.dutyTime.end || "—"}</div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Not set</div>
                          )}
                          <div className="mt-2">
                            <Button size="sm" color="black" onClick={() => openDutyModal(sweeper)}>
                              <FaClock className="mr-2" /> <span className="hidden sm:inline">Duty Time</span>
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge variant={sweeper.hasToday ? "success" : "danger"} className="capitalize text-xs">
                            {sweeper.hasToday ? "present" : "pending"}
                          </Badge>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-1.5 mr-2">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${((sweeper.verifications || 0) / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span>{sweeper.verifications ?? 0}/5</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1 sm:space-x-2">
                            <Button size="sm" color="black" iconOnly title="Assign Route" className="p-1 sm:p-2">
                              <FaRoute />
                            </Button>
                            <Button size="sm" color="black" iconOnly title="Track Location" className="p-1 sm:p-2">
                              <FaMapMarkerAlt />
                            </Button>
                            <Button
                              size="sm"
                              color="black"
                              iconOnly
                              title="Delete Sweeper"
                              onClick={() => handleDeleteSweeper(sweeper)}
                              disabled={isDeleting}
                              className="p-1 sm:p-2"
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
            </div>
          )}
        </div>
      </Card>

      {/* Overview Section */}
      <Card>
        <h2 className="text-lg font-medium mb-6">Attendance Overview</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Staff:</span>
                <span className="font-semibold">{todaySummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Present:</span>
                <span className="font-semibold text-success">{todaySummary.verified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Absent/Pending:</span>
                <span className="font-semibold text-warning">{todaySummary.pending}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm">Attendance Rate:</span>
                  <span className="font-semibold text-primary">
                    {todaySummary.total > 0 ? (((todaySummary.verified / todaySummary.total) * 100).toFixed(1) + "%") : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Attendance</h3>
            <AttendancePieChart verified={todaySummary.verified} pending={todaySummary.pending} apiBase={API_BASE} />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Weekly Attendance Trends</h3>
          <div className="h-48 sm:h-64">
            <WeeklyAttendanceChart data={weeklyData} apiBase={API_BASE} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Zone-wise Attendance</h3>
            <div className="h-48 sm:h-64">
              <ZoneAttendanceChart apiBase={API_BASE} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Verification Time Distribution</h3>
            <div className="h-48 sm:h-64">
              <TimeDistributionChart apiBase={API_BASE} />
            </div>
          </div>
        </div>
      </Card>

      {/* Add Sweeper Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Sweeper</h3>

            <form onSubmit={handleAddSweeper} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" className="w-full border rounded px-3 py-2 text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2 text-sm" required />
                <p className="text-xs text-gray-500 mt-1">Passwords may be stored as-is depending on backend. Consider hashing in backend.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <input value={addZone} onChange={(e) => setAddZone(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={addStatus} onChange={(e) => setAddStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>

              {addError && <div className="text-sm text-red-600">{addError}</div>}

              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded text-sm bg-gray-200 hover:bg-gray-300 transition-colors" 
                  onClick={() => setShowAddModal(false)} 
                  disabled={adding}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded text-sm bg-primary text-black hover:bg-primary/90 transition-colors" 
                  disabled={adding}
                >
                  {adding ? "Adding..." : "Add Sweeper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duty Time Modal */}
      {showDutyModal && selectedSweeper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Duty Time - {selectedSweeper.name}</h3>

            <form onSubmit={handleSaveDuty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  value={dutyStart}
                  onChange={(e) => setDutyStart(e.target.value)}
                  type="time"
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  value={dutyEnd}
                  onChange={(e) => setDutyEnd(e.target.value)}
                  type="time"
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>

              {dutyError && <div className="text-sm text-red-600">{dutyError}</div>}

              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded text-sm bg-gray-200 hover:bg-gray-300 transition-colors" 
                  onClick={() => setShowDutyModal(false)} 
                  disabled={savingDuty}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded text-sm bg-primary text-black hover:bg-primary/90 transition-colors" 
                  disabled={savingDuty}
                >
                  {savingDuty ? "Saving..." : "Save Duty Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SweeperList;
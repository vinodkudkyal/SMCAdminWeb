import React, { useState } from "react";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { FaSearch, FaFilter, FaCalendarAlt, FaCheck, FaTimes, FaCamera, FaUser } from "react-icons/fa";

const DetectionLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Mock detection logs
  const detectionLogs = [
    {
      id: 1,
      sweeperName: "Rajesh Kumar",
      timestamp: "2025-07-18 08:15:32",
      location: "Central Zone - CP1",
      detections: ["face", "uniform"],
      status: "verified",
      imageUrl: "https://via.placeholder.com/100"
    },
    {
      id: 2,
      sweeperName: "Priya Singh",
      timestamp: "2025-07-18 08:45:17",
      location: "North Zone - CP2",
      detections: ["face"],
      status: "partial",
      imageUrl: "https://via.placeholder.com/100"
    },
    {
      id: 3,
      sweeperName: "Amit Patil",
      timestamp: "2025-07-18 09:20:05",
      location: "East Zone - CP1",
      detections: ["face", "uniform", "equipment"],
      status: "verified",
      imageUrl: "https://via.placeholder.com/100"
    },
    {
      id: 4,
      sweeperName: "Sunita Jadhav",
      timestamp: "2025-07-18 10:05:55",
      location: "South Zone - CP3",
      detections: [],
      status: "failed",
      imageUrl: "https://via.placeholder.com/100"
    },
    {
      id: 5,
      sweeperName: "Rajesh Kumar",
      timestamp: "2025-07-18 11:30:22",
      location: "Central Zone - CP4",
      detections: ["face", "uniform"],
      status: "verified",
      imageUrl: "https://via.placeholder.com/100"
    },
    {
      id: 6,
      sweeperName: "Ravi Sharma",
      timestamp: "2025-07-18 09:50:15",
      location: "West Zone - CP2",
      detections: ["face", "equipment"],
      status: "partial",
      imageUrl: "https://via.placeholder.com/100"
    }
  ];
  
  // Filter the logs based on search term and status filter
  const filteredLogs = detectionLogs.filter(log => {
    const matchesSearch = log.sweeperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">Detection Logs</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Detections</div>
              <div className="text-2xl font-semibold">{detectionLogs.length}</div>
            </div>
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <FaCamera size={20} />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Verified</div>
              <div className="text-2xl font-semibold text-success">
                {detectionLogs.filter(log => log.status === "verified").length}
              </div>
            </div>
            <div className="bg-success/10 p-3 rounded-full text-success">
              <FaCheck size={20} />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Partial</div>
              <div className="text-2xl font-semibold text-warning">
                {detectionLogs.filter(log => log.status === "partial").length}
              </div>
            </div>
            <div className="bg-warning/10 p-3 rounded-full text-warning">
              <FaUser size={20} />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Failed</div>
              <div className="text-2xl font-semibold text-danger">
                {detectionLogs.filter(log => log.status === "failed").length}
              </div>
            </div>
            <div className="bg-danger/10 p-3 rounded-full text-danger">
              <FaTimes size={20} />
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-lg font-medium">Detection Logs</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="date" 
                className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search logs..."
              className="pl-9 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">Filter:</div>
            <button 
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === 'verified' ? 'bg-success text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setStatusFilter("verified")}
            >
              Verified
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === 'partial' ? 'bg-warning text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setStatusFilter("partial")}
            >
              Partial
            </button>
            <button 
              className={`px-3 py-1 rounded-full text-xs font-medium ${statusFilter === 'failed' ? 'bg-danger text-white' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setStatusFilter("failed")}
            >
              Failed
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sweeper
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detections
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {log.sweeperName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {log.detections.length > 0 ? log.detections.map((detection, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full capitalize">
                          {detection}
                        </span>
                      )) : (
                        <span className="text-gray-400 text-xs">None detected</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={
                        log.status === "verified" ? "success" : 
                        log.status === "partial" ? "warning" : "danger"
                      }
                    >
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-md overflow-hidden">
                      <img 
                        src={log.imageUrl} 
                        alt="Detection" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DetectionLogs;
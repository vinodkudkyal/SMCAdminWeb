import React, { useState } from "react";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { 
  FaCalendarAlt, 
  FaCamera, 
  FaMapMarkedAlt, 
  FaSearch 
} from "react-icons/fa";

const History = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  
  // Mock verification history data
  const verificationHistory = [
    {
      id: 1,
      date: "2025-07-17",
      time: "09:15 AM",
      location: "Route Start",
      status: "verified",
      imageUrl: "https://via.placeholder.com/100",
      detections: ["face", "jacket"]
    },
    {
      id: 2,
      date: "2025-07-17",
      time: "10:30 AM",
      location: "Midway",
      status: "verified",
      imageUrl: "https://via.placeholder.com/100",
      detections: ["face", "jacket"]
    },
    {
      id: 3,
      date: "2025-07-17",
      time: "11:45 AM",
      location: "Route End",
      status: "verified",
      imageUrl: "https://via.placeholder.com/100",
      detections: ["face", "jacket"]
    },
    {
      id: 4,
      date: "2025-07-16",
      time: "09:05 AM",
      location: "Route Start",
      status: "verified",
      imageUrl: "https://via.placeholder.com/100",
      detections: ["face", "jacket"]
    },
    {
      id: 5,
      date: "2025-07-16",
      time: "10:20 AM",
      location: "Midway",
      status: "rejected",
      imageUrl: "https://via.placeholder.com/100",
      detections: ["face"]
    },
  ];

  // Mock attendance history
  const attendanceHistory = [
    { date: "2025-07-17", status: "present", verifications: 5, route: "Solapur Central" },
    { date: "2025-07-16", status: "present", verifications: 4, route: "Railway Station Area" },
    { date: "2025-07-15", status: "present", verifications: 5, route: "Market Zone" },
    { date: "2025-07-14", status: "absent", verifications: 0, route: "-" },
    { date: "2025-07-13", status: "weekend", verifications: 0, route: "-" },
    { date: "2025-07-12", status: "weekend", verifications: 0, route: "-" },
    { date: "2025-07-11", status: "present", verifications: 5, route: "Solapur Central" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">History</h1>
      
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'attendance' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance History
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'verifications' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveTab('verifications')}
        >
          Verification History
        </button>
      </div>
      
      {activeTab === 'attendance' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">Attendance History</h2>
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by date..."
                  className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-sm"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verifications
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        <span className="text-sm">{record.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          record.status === "present" ? "success" : 
                          record.status === "absent" ? "danger" : "default"
                        }
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.route}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.verifications}/5
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Verification History</h2>
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search verifications..."
                    className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-sm"
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verificationHistory.map((verification) => (
                <div key={verification.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    <img 
                      src={verification.imageUrl} 
                      alt="Verification" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <div className="text-white font-medium">
                        {verification.location}
                      </div>
                      <div className="text-white/90 text-sm flex items-center">
                        <FaMapMarkedAlt className="mr-1" />
                        {verification.date}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={verification.status === "verified" ? "success" : "danger"}
                        className="capitalize"
                      >
                        {verification.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{verification.time}</div>
                      <div className="text-sm text-gray-500">ID: #{verification.id}</div>
                    </div>
                    
                    <div className="flex space-x-2 mt-2">
                      {verification.detections.includes("face") && (
                        <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-full">
                          Face Detected
                        </span>
                      )}
                      {verification.detections.includes("jacket") && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          Jacket Detected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <div className="flex justify-center">
            <button className="text-primary hover:text-primary/80 font-medium text-sm">
              Load More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
import React, { useState } from "react";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { 
  FaFileExport, 
  FaFilePdf, 
  FaFileExcel, 
  FaHistory, 
  FaCalendarAlt, 
  FaChartBar, 
  FaUserCheck,
  FaMapMarkedAlt,
  FaClock,
  FaDownload
} from "react-icons/fa";

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("attendance");
  const [chartIncluded, setChartIncluded] = useState(true);
  const [rawDataIncluded, setRawDataIncluded] = useState(true);
  
  // Mock report templates
  const reportTemplates = [
    { id: "attendance", name: "Attendance Report", icon: <FaUserCheck />, description: "Daily, weekly or monthly attendance records of all sweepers" },
    { id: "performance", name: "Performance Report", icon: <FaChartBar />, description: "Metrics on route completion and verification rates" },
    { id: "route", name: "Route Coverage Report", icon: <FaMapMarkedAlt />, description: "Analysis of route coverage and deviations" },
    { id: "time", name: "Time Analysis Report", icon: <FaClock />, description: "Check-in/check-out times and duration analysis" },
  ];
  
  // Mock scheduled reports
  const scheduledReports = [
    { id: 1, name: "Weekly Attendance Summary", frequency: "Weekly", format: "PDF", recipients: 3, nextRun: "2025-07-22" },
    { id: 2, name: "Monthly Performance Report", frequency: "Monthly", format: "Excel", recipients: 5, nextRun: "2025-08-01" },
    { id: 3, name: "Daily Zone Coverage", frequency: "Daily", format: "PDF", recipients: 2, nextRun: "2025-07-19" }
  ];
  
  // Mock report history
  const reportHistory = [
    { id: 101, name: "Attendance Report - July Week 2", date: "2025-07-15", format: "PDF", size: "1.2 MB" },
    { id: 102, name: "Performance Report - June", date: "2025-07-01", format: "Excel", size: "3.5 MB" },
    { id: 103, name: "Route Coverage - Central Zone", date: "2025-06-30", format: "PDF", size: "2.1 MB" },
    { id: 104, name: "Time Analysis Report - Q2", date: "2025-06-15", format: "Excel", size: "4.2 MB" }
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">Export Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-medium mb-6">Generate Report</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {reportTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`
                    cursor-pointer rounded-lg border p-4 transition-all
                    ${selectedReport === template.id ? "border-primary bg-primary/5" : "hover:border-gray-300"}
                  `}
                  onClick={() => setSelectedReport(template.id)}
                >
                  <div className={`
                    w-10 h-10 rounded-full mb-3 flex items-center justify-center
                    ${selectedReport === template.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}
                  `}>
                    {template.icon}
                  </div>
                  <div className="font-medium mb-1">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.description}</div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Report Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Date Range
                  </label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none">
                    <option>Today</option>
                    <option>Yesterday</option>
                    <option>This Week</option>
                    <option>Last Week</option>
                    <option>This Month</option>
                    <option>Custom Range</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Zone
                  </label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none">
                    <option>All Zones</option>
                    <option>Central</option>
                    <option>North</option>
                    <option>South</option>
                    <option>East</option>
                    <option>West</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Format
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 flex items-center p-2 border rounded-lg cursor-pointer bg-primary/5 border-primary">
                      <FaFilePdf className="text-primary mr-2" />
                      <span className="text-sm">PDF</span>
                    </div>
                    <div className="flex-1 flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <FaFileExcel className="text-green-600 mr-2" />
                      <span className="text-sm">Excel</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Include
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="charts" 
                        className="mr-2" 
                        checked={chartIncluded}
                        onChange={(e) => setChartIncluded(e.target.checked)}
                      />
                      <label htmlFor="charts" className="text-sm">Charts and Graphs</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="raw-data" 
                        className="mr-2" 
                        checked={rawDataIncluded}
                        onChange={(e) => setRawDataIncluded(e.target.checked)}
                      />
                      <label htmlFor="raw-data" className="text-sm">Raw Data</label>
                    </div>
                  </div>
                </div>
                
                {selectedReport === "attendance" && (
                  <>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Group By
                      </label>
                      <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none">
                        <option>Sweeper</option>
                        <option>Zone</option>
                        <option>Date</option>
                        <option>Status</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Status Filter
                      </label>
                      <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none">
                        <option>All Statuses</option>
                        <option>Present Only</option>
                        <option>Absent Only</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button color="primary" className="flex items-center">
                  <FaFileExport className="mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </Card>
          
          <Card className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Recent Reports</h2>
              <button className="text-primary text-sm font-medium">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportHistory.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{report.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={report.format === "PDF" ? "danger" : "success"}
                          className="uppercase"
                        >
                          {report.format}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-primary hover:text-primary/80 flex items-center text-sm">
                          <FaDownload className="mr-1" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center mb-6">
              <FaCalendarAlt className="text-primary mr-2" />
              <h2 className="text-lg font-medium">Scheduled Reports</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              {scheduledReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 hover:border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{report.name}</span>
                    <Badge
                      variant={
                        report.frequency === "Daily" ? "primary" :
                        report.frequency === "Weekly" ? "secondary" : "success"
                      }
                    >
                      {report.frequency}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <span>Format: {report.format}</span>
                    <span>Recipients: {report.recipients}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Next run: {report.nextRun}
                  </div>
                </div>
              ))}
            </div>
            
            <Button color="secondary" className="w-full flex items-center justify-center">
              <FaCalendarAlt className="mr-2" />
              Schedule New Report
            </Button>
          </Card>
          
          <Card className="mt-6">
            <div className="flex items-center mb-6">
              <FaHistory className="text-primary mr-2" />
              <h2 className="text-lg font-medium">Report Templates</h2>
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="font-medium mb-2">Monthly Performance Summary</div>
                <div className="text-sm text-gray-600 mb-2">
                  Comprehensive monthly report with attendance and performance metrics
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>PDF & Excel</span>
                  <span>Last used: 2 days ago</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:border-gray-300">
                <div className="font-medium mb-2">Zone-wise Attendance</div>
                <div className="text-sm text-gray-600 mb-2">
                  Attendance breakdown by zones with comparison charts
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>PDF</span>
                  <span>Last used: 1 week ago</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:border-gray-300">
                <div className="font-medium mb-2">Verification Analytics</div>
                <div className="text-sm text-gray-600 mb-2">
                  Detailed analysis of verification success rates and patterns
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Excel</span>
                  <span>Last used: 2 weeks ago</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Quick Export</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-50">
                  <FaFilePdf className="text-danger mb-1" />
                  <span className="text-xs">Today's Report</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-gray-50">
                  <FaFileExcel className="text-green-600 mb-1" />
                  <span className="text-xs">Weekly Summary</span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
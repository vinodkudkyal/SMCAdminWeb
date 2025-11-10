import React, { useState } from "react";
import Card from "../../components/common/Card";
import MapView from "../../components/common/MapView";
import Badge from "../../components/common/Badge";
import { mockRoutes } from "../../utils/mockData";
import { FaMapMarkerAlt, FaRoute } from "react-icons/fa";

const MyRoutes = () => {
  const [selectedRoute, setSelectedRoute] = useState(mockRoutes[0]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [activeRouteTab, setActiveRouteTab] = useState("today");
  
  // More routes for demonstration
  const allRoutes = [
    mockRoutes[0],
    {
      ...mockRoutes[0],
      id: 2,
      name: "Railway Station Area",
      progress: 0.8,
      routeLength: 0.7,
    },
    {
      ...mockRoutes[0],
      id: 3,
      name: "Market Zone",
      progress: 1.0,
      routeLength: 0.4,
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold mb-6">My Routes</h1>
      
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeRouteTab === 'today' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveRouteTab('today')}
        >
          Today's Route
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeRouteTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveRouteTab('history')}
        >
          Route History
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeRouteTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
          onClick={() => setActiveRouteTab('upcoming')}
        >
          Upcoming Routes
        </button>
      </div>
      
      {activeRouteTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-96">
              <h2 className="text-lg font-medium mb-4">Route Map</h2>
              <div className="h-80 rounded-lg overflow-hidden">
                <MapView
                  selectedRoute={selectedRoute}
                  selectedCheckpoint={selectedCheckpoint}
                  setSelectedCheckpoint={setSelectedCheckpoint}
                />
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Route Details</h2>
                <Badge variant="success">Active</Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Route Name</div>
                  <div className="font-medium">{selectedRoute.name}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Distance</div>
                  <div className="font-medium">{selectedRoute.routeLength} km</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-success h-2.5 rounded-full" 
                      style={{ width: `${selectedRoute.progress * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-right mt-1 text-gray-600">
                    {(selectedRoute.progress * 100).toFixed(0)}% completed
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Scheduled Time</div>
                  <div className="font-medium">8:00 AM - 12:00 PM</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-2">Checkpoints</div>
                  <div className="space-y-2">
                    {selectedRoute.checkpoints.map((checkpoint, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedCheckpoint(checkpoint)}
                      >
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold
                          ${idx === 0 ? "bg-success" : idx === selectedRoute.checkpoints.length - 1 ? "bg-danger" : "bg-warning"}
                                                `}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{checkpoint.name}</div>
                          <div className="text-xs text-gray-500">
                            {idx === 0 ? "Start Point" : idx === selectedRoute.checkpoints.length - 1 ? "End Point" : "Checkpoint"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {activeRouteTab === 'history' && (
        <Card>
          <h2 className="text-lg font-medium mb-4">Route History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verifications
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allRoutes.map((route, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {`2025-07-${15 - idx}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {route.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {route.routeLength} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={idx === 0 ? "primary" : route.progress === 1 ? "success" : "warning"}
                      >
                        {idx === 0 ? "Today" : route.progress === 1 ? "Completed" : "Partial"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {idx === 0 ? "3/5" : route.progress === 1 ? "5/5" : "4/5"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {activeRouteTab === 'upcoming' && (
        <Card>
          <h2 className="text-lg font-medium mb-4">Upcoming Routes</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="bg-primary/10 p-3 rounded-full text-primary mr-4">
                    <FaRoute className="text-lg" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {["Solapur Central", "Railway Station Area", "Hospital Zone"][idx]}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <FaMapMarkerAlt className="mr-1 text-gray-400" />
                      {["Central Zone", "North Zone", "East Zone"][idx]}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">
                    {`2025-07-${19 + idx}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    8:00 AM - 12:00 PM
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MyRoutes;
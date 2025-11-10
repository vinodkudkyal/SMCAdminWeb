// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import { FaUser, FaUserTie } from "react-icons/fa";
// import { useAuth } from "./contexts/AuthContext";

// const Login = () => {
//   const { login } = useAuth();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Hardcoded backend URL so requests go to the Express server (not the Vite dev server)
//   const API_BASE = "https://smc-backend-bjm5.onrender.com";

//   const handleSubmit = async (e) => {
//     e && e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await fetch(`${API_BASE}/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       // Always read response as text first to avoid "Unexpected end of JSON input" when server responds with HTML/empty.
//       const text = await res.text();
//       let data = null;
//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch (parseErr) {
//         // server returned non-JSON (e.g., HTML 404). Show helpful error.
//         setError("Unexpected response from server. Check backend URL and server status.");
//         setLoading(false);
//         return;
//       }

//       if (!res.ok) {
//         setError(data?.message || "Login failed");
//       } else {
//         // data: { success, role, name, id }
//         if (data && data.success) {
//           const profile = { role: data.role, name: data.name, id: data.id };
//           login(profile);
//         } else {
//           setError(data?.message || "Login failed");
//         }
//       }
//     } catch (err) {
//       setError("Network error: " + (err.message || err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-8">
//       <motion.form
//         className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center"
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.5 }}
//         onSubmit={handleSubmit}
//       >
//         {/* Logo and Title */}
//         <motion.div
//           className="flex flex-col items-center mb-8"
//           initial={{ y: -20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.3, duration: 0.5 }}
//         >
//           <img
//             src="./assets/image.png"
//             alt="Solapur Municipal Corporation"
//             className="w-28 h-auto mb-4"
//           />
//           <motion.h1 className="text-2xl font-heading font-semibold text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
//             Sweeper Tracker System
//           </motion.h1>
//           <motion.p className="text-gray-500 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
//             Solapur Municipal Corporation
//           </motion.p>
//         </motion.div>

//         {/* Login Form */}
//         <div className="space-y-6 mb-6 text-left">
//           <div>
//             <label htmlFor="email" className="block mb-2 text-gray-700 font-medium">
//               Email
//             </label>
//             <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition" required />
//           </div>

//           <div>
//             <label htmlFor="password" className="block mb-2 text-gray-700 font-medium">
//               Password
//             </label>
//             <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition" required />
//           </div>
//         </div>

//         {error && <div className="text-red-600 mb-4">{error}</div>}

//         <div className="grid grid-cols-2 gap-4">
//           <button type="submit" disabled={loading} className="bg-primary text-black py-3 px-4 rounded-lg flex items-center justify-center font-medium">
//             <FaUser className="mr-2" />
//             {loading ? "Logging in..." : "Login"}
//           </button>

//           <button type="button" onClick={() => { setEmail("admin@example.com"); setPassword("adminpass"); }} className="bg-secondary text-black py-3 px-4 rounded-lg flex items-center justify-center font-medium">
//             <FaUserTie className="mr-2" />
//             Fill demo
//           </button>
//         </div>

//         <motion.p className="text-sm text-gray-500 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}>
//           © 2025 Solapur Municipal Corporation
//         </motion.p>
//       </motion.form>
//     </div>
//   );
// };

// export default Login;


import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "./contexts/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hardcoded backend URL so requests go to the Express server (not the Vite dev server)
  const API_BASE = "https://smc-backend-bjm5.onrender.com";

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        setError("Unexpected response from server. Check backend URL and server status.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data?.message || "Login failed");
      } else {
        if (data && data.success) {
          const profile = { role: data.role, name: data.name, id: data.id };
          login(profile);
        } else {
          setError(data?.message || "Login failed");
        }
      }
    } catch (err) {
      setError("Network error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/90 to-secondary/90 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 ring-1 ring-black/5"
        aria-label="Login form"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-primary to-secondary p-1 shadow-md">
            <img
              src="src/assets/image.png"
              alt="Solapur Municipal Corporation"
              className="w-20 h-20 object-contain select-none"
            />
          </div>

          <h1 className="mt-4 text-lg sm:text-2xl font-semibold text-gray-800">Sweeper Tracker</h1>
          <p className="text-xs sm:text-sm text-gray-500">Solapur Municipal Corporation</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaEnvelope />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
              required
              autoComplete="email"
              aria-required="true"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaLock />
            </span>

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
              required
              autoComplete="current-password"
              aria-required="true"
              aria-describedby="togglePassword"
            />

            <button
              type="button"
              id="togglePassword"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="mt-5">
          {error && (
            <div className="text-sm text-red-600 mb-3" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-black py-2.5 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-95 transition"
          >
            {loading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">© 2025 Solapur Municipal Corporation</p>
      </form>
    </div>
  );
};

export default Login;
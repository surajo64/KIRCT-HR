import React, { useState } from 'react';
import axios from 'axios'
import { toast } from "react-toastify";
import { useContext } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { AppContext, useAuth } from '../context/AppContext';
import LoadingOverlay from '../components/loadingOverlay.jsx';



const Login = () => {
  const { logout, login, user, token, setToken, backendUrl } = useContext(AppContext)
  const navigate = useNavigate();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
 setIsLoading(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/login', {
        email,
        password,
      });

      if (data.success && data.token && data.user) {
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Optional, in case app reloads before context sets
        setToken(data.token);
        login(data.user);

        toast.success("User login successful!");

        // Role-based redirect
        if (data.user.role === "admin") {
          navigate('/admin-dashboard');
        } else if (data.user.role === "employee") {
          navigate('/employee-dashboard');
        } else {
          navigate('/hod-dashboard');
        }
      } else {
        toast.error(data.message || "Invalid login response.");
      }

    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed!");
    }finally {
    setIsLoading(false); 
  }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-100 px-4">
       <img src="https://res.cloudinary.com/dyii5iyqq/image/upload/v1756986671/logo_arebic.png" alt="Logo" className="w-24 h-24 rounded-full border border-gray-300 object-cover" />
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-green-800 mb-6">
        KIRCT EMPLOYEE MANAGEMENT SYSTEM
      </h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">Login</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-green-800 font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-green-800 font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </Link>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default Login;

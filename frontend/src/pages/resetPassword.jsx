import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AppContext } from '../context/AppContext';

const ResetPassword = () => {
  const {backendUrl} = useContext(AppContext)
  const [password, setPassword] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  // debug: log when component loads
  React.useEffect(() => {
    console.log('ResetPassword mounted with token!:', token, 'path=', window.location.pathname);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Received Token:", token);
    console.log("New Password:", password);
   try {
  const { data } = await axios.post(`${backendUrl}/api/admin/reset-password/${token}`, { password });
  
      console.log("Received Token:", token);
      console.log("New Password:", password);
      toast.success( 'Password updated successfully');
        navigate("/login"); 
  
      
      
    
    } catch (error) {
      toast.error('Error resetting password');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">Reset Password</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded-md mb-5"
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-colors">
          Reset Password
        </button>
      </form>
      
    </div>
  );
};

export default ResetPassword;

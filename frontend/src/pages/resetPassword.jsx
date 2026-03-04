import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingOverlay from '../components/loadingOverlay';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const ResetPassword = () => {
  const {backendUrl} = useContext(AppContext)
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  // debug: log when component loads
  useEffect(() => {
    console.log('ResetPassword mounted with token!:', token, 'path=', window.location.pathname);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center min-h-screen p-4 relative">
      {loading && <LoadingOverlay />}
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
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      
    </div>
  );
};

export default ResetPassword;

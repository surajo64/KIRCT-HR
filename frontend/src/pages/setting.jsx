import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import LoadingOverlay from '../components/loadingOverlay.jsx';

const setting = () => {
  const navigate = useNavigate();
  const { token, backendUrl,user,setToken, setUser, } = useContext(AppContext); // ✅ Make sure docData exists
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);



  const handleChangePassword = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  // 🔴 Validation failures should stop loading
  if (!oldPassword || !newPassword || !confirmPassword) {
    toast.error("All fields are required");
    setIsLoading(false);
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error("New password and confirm password do not match");
    setIsLoading(false);
    return;
  }

  try {
    const { data } = await axios.post(
      `${backendUrl}/api/admin/change-password`,
      {
        oldPassword,
        newPassword,
        confirmPassword,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (data.success) {
      toast.success(data.message);
      logout(); // Might redirect to login
    } else {
      console.log("data response:", data.message);
      toast.error(data.message || "Password change failed.");
    }
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
  } finally {
    setIsLoading(false);
  }
};


  const logout = () => {
  
    if (token) {
      navigate('/login')
      token && setToken ('')
      token && localStorage.removeItem('token')

      }

  }
  return (
    <div className="flex flex-col items-center mt-10 w-full">
      <form
        onSubmit={handleChangePassword}
        className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">Change Password</h2>

        {/* Old Password */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Old Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* New Password */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit" 
        
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700">
          Change Password
        </button>
      </form>
       {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default setting;

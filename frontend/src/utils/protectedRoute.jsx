import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const { token, user, logoutInitiated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token || !user) {
      if (!logoutInitiated.current) {
        toast.error("Please login to access the page");
      }
      logoutInitiated.current = false; // Reset for next time
      navigate("/login", { replace: true, state: { from: location } });
    }
  }, [token, user, navigate, location]);

  return token && user ? children : null;
};

export default ProtectedRoute;

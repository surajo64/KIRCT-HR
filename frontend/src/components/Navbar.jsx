import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const { token, backendUrl, setToken, user, messages, setMessages, fetchMessages } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Remove duplicate modal state - we'll use a simpler approach
  const navigate = useNavigate();

  // ✅ Setup socket instance
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(backendUrl, {
      auth: { token },
    });

    socket.emit("join", user._id);

    socket.on("newMessage", () => {
      fetchMessages();
    });

    socket.on("messageRead", () => {
      fetchMessages();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token, backendUrl]);

  // initial load
  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token]);

  const logout = () => {
    if (token) {
      setToken("");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const markMessageRead = async (id) => {
    try {
      await axios.put(
        `${backendUrl}/api/auth/mark-read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error marking message read:", err);
    }
  };

  // ✅ Inbox Messages (messages where I am a recipient)
  const inboxMessages = (messages || []).filter((msg) =>
    msg.recipients?.some(
      (recipient) => {
        const recipientId = recipient._id?.toString() || recipient.toString();
        const userId = user._id?.toString() || user.id?.toString();
        return recipientId === userId;
      }
    )
  );

  // ✅ Unread Inbox Messages
  const unreadInboxMessages = inboxMessages.filter((msg) => {
    const myReadStatus = msg.isRead?.find(
      (readStatus) => {
        const statusUserId = readStatus.userId?.toString() || readStatus.userId;
        const userId = user._id?.toString() || user.id?.toString();
        return statusUserId === userId;
      }
    );
    return !myReadStatus || myReadStatus.read === false;
  });

  const latestUnreadMessages = unreadInboxMessages.slice(0, 5);

  const roleTitle =
    user?.role === "admin" ? "Admin" : user?.role === "HOD" ? "HOD" : "Employee";

  // Simplified message view handler - navigate to messages page instead of showing modal
  const handleViewMessage = (msg) => {
    markMessageRead(msg._id);
    setShowMessages(false);
    navigate("/messages", { state: { focusMessageId: msg._id } });
  };

  return (
    <div className="bg-white border-b rounded px-4 sm:px-10 py-4 shadow-sm relative">
      <div className="flex items-center justify-between flex-wrap">
        {/* Left: Title + Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start order-2 sm:order-1">
          <h1 className="text-green-500 text-xl font-bold uppercase tracking-wide">
            {token && roleTitle} Dashboard
          </h1>

          {/* Hamburger Toggle */}
          <button
            className="sm:hidden text-gray-600 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  isOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Center: Welcome */}
        <div className="hidden sm:block flex-grow text-center order-1 sm:order-2">
          <p className="text-lg sm:text-xl font-semibold text-green-600">
            Welcome Back: {user?.name || "Admin"}
          </p>
        </div>

        {/* Right: Notifications + Logout */}
        <div className="hidden sm:flex items-center gap-4 justify-end order-3 relative">
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="relative focus:outline-none"
            >
              {/* Bell Icon */}
              <svg
                className="w-7 h-7 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 
                  2.032 0 0118 14.158V11a6.002 
                  6.002 0 00-4-5.659V5a2 
                  2 0 10-4 0v.341C7.67 
                  6.165 6 8.388 6 
                  11v3.159c0 .538-.214 
                  1.055-.595 1.436L4 
                  17h5m6 0v1a3 3 0 
                  11-6 0v-1m6 0H9"
                />
              </svg>

              {/* Badge update */}
              {unreadInboxMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadInboxMessages.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showMessages && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b text-gray-700 font-bold flex justify-between items-center">
                  <span>Messages</span>
                  <span className="text-xs font-normal text-gray-500">
                    {unreadInboxMessages.length} unread
                  </span>
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {latestUnreadMessages.length > 0 ? (
                    latestUnreadMessages.map((msg) => (
                      <li
                        key={msg._id}
                        onClick={() => handleViewMessage(msg)}
                        className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b"
                      >
                        <div className="font-medium">{msg.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          From: {msg.createdBy?.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-gray-500 text-center">
                      No unread messages
                    </li>
                  )}
                </ul>

                <div className="p-3 text-center border-t">
                  <button
                    onClick={() => {
                      navigate("/messages");
                      setShowMessages(false);
                    }}
                    className="text-green-600 text-sm font-medium hover:underline"
                  >
                    View All Messages
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-6 py-2 rounded-full transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="sm:hidden mt-4 space-y-2 text-center">
          <p className="text-green-600 font-semibold text-lg">
            Welcome Back: {user?.name || "Admin"}
          </p>
          
          {/* Mobile notification button */}
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="relative mx-auto block p-2"
          >
            <svg
              className="w-6 h-6 text-gray-600 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 
                2.032 0 0118 14.158V11a6.002 
                6.002 0 00-4-5.659V5a2 
                2 0 10-4 0v.341C7.67 
                6.165 6 8.388 6 
                11v3.159c0 .538-.214 
                1.055-.595 1.436L4 
                17h5m6 0v1a3 3 0 
                11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadInboxMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadInboxMessages.length}
              </span>
            )}
          </button>
          
          {/* Mobile messages dropdown */}
          {showMessages && (
            <div className="bg-white border rounded-lg shadow-lg mt-2">
              <div className="p-2 border-b text-gray-700 font-bold">
                Messages ({unreadInboxMessages.length})
              </div>
              <ul className="max-h-40 overflow-y-auto">
                {latestUnreadMessages.length > 0 ? (
                  latestUnreadMessages.map((msg) => (
                    <li
                      key={msg._id}
                      onClick={() => handleViewMessage(msg)}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b"
                    >
                      <div className="font-medium">{msg.title}</div>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-gray-500 text-center">
                    No unread messages
                  </li>
                )}
              </ul>
              <div className="p-2 text-center border-t">
                <button
                  onClick={() => {
                    navigate("/messages");
                    setShowMessages(false);
                  }}
                  className="text-green-600 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-6 py-2 rounded-full transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
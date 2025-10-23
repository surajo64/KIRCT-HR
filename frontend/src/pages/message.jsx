import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import LoadingOverlay from '../components/loadingOverlay.jsx';

const SendMessage = () => {
  const { token, backendUrl, user, userData, messages, setMessages, fetchMessages } =
    useContext(AppContext);

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyToAll, setReplyToAll] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    userId: null,
    totalMessages: 0,
    inboxCount: 0,
    sentCount: 0,
    unreadCount: 0
  });

  // ✅ Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/admin/get-all-users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };
    fetchUsers();
  }, [token, backendUrl, user]);

  // ✅ FIXED: Improved message categorization with proper ID handling
  const { inboxMessages, sentMessages, unreadInboxMessages } = useMemo(() => {
 

    if (!messages || messages.length === 0) {

      return { inboxMessages: [], sentMessages: [], unreadInboxMessages: [] };
    }

    // Get user ID - try multiple possible fields
    const userId = user?.id || user?._id || user?.userId;
    const userIdStr = userId?.toString();


    if (!userIdStr) {
      return { inboxMessages: [], sentMessages: [], unreadInboxMessages: [] };
    }

    // Helper function to normalize IDs for comparison
    const normalizeId = (id) => {
      if (!id) return null;
      return id.toString ? id.toString() : String(id);
    };

    // Filter inbox messages (messages where user is a recipient)
    const inbox = messages.filter((msg) => {
      if (!msg.recipients || msg.recipients.length === 0) return false;

      const isRecipient = msg.recipients.some(recipient => {
        // Handle both populated user objects and raw IDs
        const recipientId = recipient._id ? recipient._id : recipient;
        const normalizedRecipientId = normalizeId(recipientId);
        const isMatch = normalizedRecipientId === userIdStr;

        if (isMatch) {
      
        }
        return isMatch;
      });

      return isRecipient;
    });

    // Filter sent messages (messages where user is the creator)
    const sent = messages.filter((msg) => {
      if (!msg.createdBy) return false;

      // Handle both populated user objects and raw IDs
      const createdById = msg.createdBy._id ? msg.createdBy._id : msg.createdBy;
      const normalizedCreatedById = normalizeId(createdById);
      const isMatch = normalizedCreatedById === userIdStr;

      if (isMatch) {
      
      }
      return isMatch;
    });

    // Filter unread messages from inbox
    const unreadInbox = inbox.filter((msg) => {
      if (!msg.isRead || msg.isRead.length === 0) {
       
        return true;
      }

      const myReadStatus = msg.isRead.find(readStatus => {
        const statusUserId = readStatus.userId?._id ?
          readStatus.userId._id :
          readStatus.userId;
        const normalizedStatusUserId = normalizeId(statusUserId);
        return normalizedStatusUserId === userIdStr;
      });

      const isUnread = !myReadStatus || myReadStatus.read === false;
      if (isUnread) {
       
      }
      return isUnread;
    });

    // Update debug info
    const newDebugInfo = {
      userId: userIdStr,
      totalMessages: messages.length,
      inboxCount: inbox.length,
      sentCount: sent.length,
      unreadCount: unreadInbox.length,
      sampleMessages: messages.slice(0, 2).map(msg => ({
        id: msg._id,
        title: msg.title,
        recipients: msg.recipients?.map(r => r._id || r),
        createdBy: msg.createdBy?._id || msg.createdBy,
        isRead: msg.isRead
      }))
    };

    setDebugInfo(newDebugInfo);

    console.log("📊 Final message counts:", {
      inbox: inbox.length,
      sent: sent.length,
      unread: unreadInbox.length
    });

    return {
      inboxMessages: inbox,
      sentMessages: sent,
      unreadInboxMessages: unreadInbox,
    };
  }, [messages, user?.id, user?._id, user?.userId]);

  // Apply search & tab filter
  useEffect(() => {
    let list = activeTab === "inbox" ? inboxMessages : sentMessages;

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter((m) =>
        m.title?.toLowerCase().includes(term) ||
        m.text?.toLowerCase().includes(term) ||
        m.createdBy?.name?.toLowerCase().includes(term) ||
        (activeTab === "sent" && m.recipients?.some(r =>
          r.name?.toLowerCase().includes(term)
        ))
      );
    }

    setFilteredMessages(list);
    setCurrentPage(1);
  }, [activeTab, searchTerm, inboxMessages, sentMessages]);

  // Pagination
  const totalItems = filteredMessages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mark message as read
  const markMessageRead = async (id) => {
    try {
      await axios.put(
        `${backendUrl}/api/auth/mark-read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages();
    } catch (err) {
      console.error("Error marking message read:", err);
      toast.error("Failed to mark message as read");
    }
  };

  // Send message
  const handleSend = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    if (!selectedUsers.length || !message.trim()) {
      setStatus("Please select at least one user and type a message.");
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-message`,
        { userIds: selectedUsers, text: message, title },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Message sent successfully ✅");
        setMessages(prev => [data.message, ...prev]);
        setTitle("");
        setMessage("");
        setSelectedUsers([]);
        setStatus("");
        setShowForm(false);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Error sending message ❌");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove User from Message
  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      const { data } = await axios.delete(
        backendUrl + `/api/auth/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Message removed from your inbox ✅");
        setMessages((prev) => prev.filter((m) => m._id !== id));
        setConfirmDeleteId(null);
      } else {
        toast.error("Failed to remove message");
      }
    } catch (err) {
      console.error("Error removing message:", err);
      toast.error("Error removing message ❌");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reply
  const handleReply = async () => {
    setIsLoading(true);
    try {
      if (!replyMessage.trim()) return;

      const { data } = await axios.post(
        `${backendUrl}/api/auth/messages/${selectedMessage._id}/reply`,
        { message: replyMessage, replyToAll },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setReplyMessage("");
        setShowReplyForm(false);
        setShowRead(false);
        fetchMessages();
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setIsLoading(false);
    }
  };

  // View message details
  const handleViewMessage = (message) => {
    markMessageRead(message._id);
    setSelectedMessage(message);
    setShowRead(true);
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle select all users
  const toggleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render recipients with toggle
  const renderRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) {
      return "Unknown";
    }

    if (recipients.length === 1) {
      return recipients[0].name || "Unknown User";
    }

    if (recipientsExpanded) {
      return (
        <span>
          {recipients.map((u, idx) => (
            <span key={u._id || idx}>
              {u.name || "Unknown User"}
              {idx < recipients.length - 1 ? ", " : ""}
            </span>
          ))}
          {" "}
          <button
            onClick={() => setRecipientsExpanded(false)}
            className="ml-1 text-blue-600 text-xs underline"
          >
            (show less)
          </button>
        </span>
      );
    } else {
      const othersCount = recipients.length - 1;
      return (
        <span>
          {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'}
          {" "}
          <button
            onClick={() => setRecipientsExpanded(true)}
            className="text-blue-600 text-xs underline"
          >
            (show details)
          </button>
        </span>
      );
    }
  };

  // Check if message is unread for current user
  const isMessageUnread = (message) => {
    const userId = user?.id || user?._id || user?.userId;
    const userIdStr = userId?.toString();

    if (!userIdStr || !message.isRead) return true;

    const myReadStatus = message.isRead.find(readStatus => {
      const statusUserId = readStatus.userId?._id ?
        readStatus.userId._id :
        readStatus.userId;
      return statusUserId?.toString() === userIdStr;
    });

    return !myReadStatus || myReadStatus.read === false;
  };

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-8 h-8 rounded text-sm ${currentPage === i
            ? 'bg-blue-500 text-white'
            : 'border hover:bg-gray-100'}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} messages
        </p>

        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {pages}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };


  if (!messages) return <LoadingOverlay />;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Message Center
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm">Total Messages</h3>
          <p className="text-2xl font-bold">{messages?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm">Inbox Messages</h3>
          <p className="text-2xl font-bold">{inboxMessages.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {debugInfo.inboxCount === 0 ? "No messages found for user" : "Your received messages"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-sm">Unread Messages</h3>
          <p className="text-2xl font-bold">{unreadInboxMessages.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-6 py-3 font-medium ${activeTab === "inbox"
            ? "border-b-2 border-green-500 text-green-600"
            : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("inbox")}
        >
          Inbox {inboxMessages.length > 0 && `(${inboxMessages.length})`}
          {unreadInboxMessages.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadInboxMessages.length} new
            </span>
          )}
        </button>
        <button
          className={`px-6 py-3 font-medium ${activeTab === "sent"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("sent")}
        >
          Sent {sentMessages.length > 0 && `(${sentMessages.length})`}
        </button>
      </div>

      {/* Show warning if no messages found */}
      {inboxMessages.length === 0 && sentMessages.length === 0 && messages.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">
            <strong>Warning:</strong> You have {messages.length} total messages but none are categorized as inbox or sent.
            This usually means there's a mismatch between your user ID and the message data.
          </p>
          <p className="text-sm text-red-600 mt-2">
            Check the debug panel above for details. Your user ID: {debugInfo.userId}
          </p>
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            🔍
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 flex items-center transition-colors"
        >
          <span className="mr-2">+</span> New Message
        </button>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_2fr_3fr_2fr_1.5fr] py-3 px-6 border-b text-sm font-semibold text-gray-700">
          <span>#</span>
          <span>{activeTab === "inbox" ? "From" : "To"}</span>
          <span>Title</span>
          <span>Message</span>
          <span>Date</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Messages */}
        <div className="divide-y">
          {paginatedMessages.length > 0 ? (
            paginatedMessages.map((item, index) => {
              const isUnread = activeTab === "inbox" && isMessageUnread(item);
              const dotColor = activeTab === "inbox"
                ? (isUnread ? "bg-red-500" : "bg-green-500")
                : "bg-blue-500";

              return (
                <div
                  key={item._id}
                  className={`grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_2fr_3fr_2fr_1.5fr] items-start sm:items-center py-4 px-6 hover:bg-blue-50 gap-3 transition-colors
                    ${isUnread ? "bg-blue-50 font-medium" : ""}`}
                >
                  {/* # + dot */}
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                  </div>

                  {/* From / To */}
                  <div>
                    <p className="font-medium">
                      {activeTab === "inbox"
                        ? item.createdBy?.name || "Unknown"
                        : renderRecipients(item.recipients)}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {isUnread && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                          Unread
                        </span>
                      )}
                      {activeTab === "sent" && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                          Sent
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <p className="font-medium text-gray-800">{item.title}</p>

                  {/* Message preview */}
                  <p className="text-gray-600 line-clamp-2">{item.text}</p>

                  {/* Date */}
                  <p className="text-sm text-gray-500">{formatDate(item.createdAt || new Date())}</p>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleViewMessage(item)}
                      className="bg-green-100 text-green-700 text-sm px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                    >
                      <span className="mr-1">👁️</span> View
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(item._id)}
                      className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                    >
                      <span className="mr-1">🗑️</span> Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No messages found</p>
              <p className="text-sm text-gray-400 mt-2">
                {activeTab === "inbox"
                  ? "Your inbox is empty"
                  : "You haven't sent any messages yet"}
              </p>
              {activeTab === "inbox" && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Send Your First Message
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Rest of your modals remain the same */}
      {/* Send Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            <button
              onClick={() => {
                setShowForm(false);
                fetchMessages();
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              ✖
            </button>
            <h2 className="text-lg font-bold mb-2">Send Message</h2>
            {status && <p className="text-red-500 mb-2">{status}</p>}

            <form onSubmit={handleSend}>
              <div className="mb-2 max-h-40 overflow-y-auto border p-2 rounded text-right">
                {/* Select All / Deselect All */}
                <label className="flex justify-end items-center font-semibold mb-1 space-x-2">
                  <span>Select All</span>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(user => user._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="ml-2"
                  />
                </label>

                {/* Individual users */}
                {users.map(user => (
                  <label key={user._id} className="flex justify-end items-center mb-1 space-x-2">
                    <span>{user.name} ({user.role})</span>
                    <input
                      type="checkbox"
                      value={user._id}
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => {
                        setSelectedUsers(prev =>
                          prev.includes(user._id)
                            ? prev.filter(id => id !== user._id)
                            : [...prev, user._id]
                        );
                      }}
                      className="ml-2"
                    />
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="border p-2 w-full mb-2 rounded" required
              />

              <textarea
                placeholder="Type your message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="border p-2 w-full mb-2 rounded" required
              />

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Read Message Modal */}
      {showRead && selectedMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowRead(false);
                setSelectedMessage(null);
                setShowReplyForm(false);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition-colors"
            >
              ✖
            </button>

            <h2 className="text-lg font-bold mb-4 text-blue-600">
              {selectedMessage.title}
            </h2>

            {/* Original Message Content */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4 border">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Original message:</span>
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedMessage.text}
              </p>
            </div>

            <div className="text-sm text-gray-500 space-y-2 mb-4">
              <p>
                <span className="font-semibold">From:</span>{" "}
                {selectedMessage.createdBy?.name}
              </p>
              <p>
                <span className="font-semibold">To:&nbsp;</span>
                {renderRecipients(selectedMessage.recipients)}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(selectedMessage.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Reply Button */}
            {!showReplyForm && (
              <button
                onClick={() => setShowReplyForm(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors w-full mb-4"
              >
                Reply
              </button>
            )}

            {/* Reply Form */}
            {showReplyForm && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => setReplyToAll(false)}
                    className={`px-3 py-1 rounded ${!replyToAll ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
                      } transition-colors`}
                  >
                    Reply to Sender
                  </button>
                  <button
                    onClick={() => setReplyToAll(true)}
                    className={`px-3 py-1 rounded ${replyToAll ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
                      } transition-colors`}
                  >
                    Reply to All
                  </button>
                </div>

                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={`Type your reply to ${selectedMessage.createdBy?.name}...`}
                  className="w-full p-3 border rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                />

                {/* Original message quoted */}
                <div className="bg-gray-100 p-3 rounded border text-sm">
                  <p className="text-gray-500 text-xs mb-1">
                    On {new Date(selectedMessage.createdAt).toLocaleString()}, {selectedMessage.createdBy?.name} wrote:
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.text}
                  </p>
                </div>

                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyMessage("");
                    }}
                    className="px-3 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyMessage.trim()}
                    className={`px-3 py-2 rounded text-sm ${!replyMessage.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                      } transition-colors`}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            )}

            {/* Display Existing Replies */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-3">Replies:</h3>
                {selectedMessage.replies.map((reply, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded mb-3">
                    <p className="text-gray-700">{reply.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      By: {reply.userId?.name || "Unknown"} •{" "}
                      {new Date(reply.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-sm">
            <p className="text-red-500 mb-4 font-semibold">
              Are you sure you want to delete this message?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <LoadingOverlay />}
    </div>
  )
};

export default SendMessage;
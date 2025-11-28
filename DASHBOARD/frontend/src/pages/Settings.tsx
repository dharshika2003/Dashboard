import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type NotificationType =
  | "update_available"
  | "license_expired"
  | "release_published"
  | "system_alert"
  | "user_mention";

type Notification = {
  notificationId: number;
  userId: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: {
    userId: number;
    clientId?: number | null;
    name: string;
    email: string;
    role: string;
  };
};

type User = {
  userId: number;
  clientId?: number | null;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "release_manager" | "approver" | "user";
};

const NotificationSettings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [showAddNotification, setShowAddNotification] = useState(false);
  const [newNotification, setNewNotification] = useState({
    type: "update_available" as NotificationType,
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch settings from backend ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();

        const user: User = {
          ...data.user,
          passwordHash: data.user.passwordHash || "hashed_password_abc123...",
        };

        const notifs: Notification[] = data.notifications.map((n: any) => ({
          ...n,
          user,
        }));

        setCurrentUser(user);
        setEditedUser(user);
        setNotifications(notifs);
        setLoading(false);
      } catch (err) {
        setError("Error fetching settings");
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

 

  // --- Helper functions ---
   
  
  const handleUserInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (!editedUser) return;
    setEditedUser((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleNotificationInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewNotification((prev) => ({ ...prev, [name]: value }));
  };

  // --- Save user to backend ---
  const handleSaveUser = async () => {
    if (!editedUser) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/settings/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedUser),
      });
      if (!res.ok) throw new Error("Failed to save user");
      setCurrentUser(editedUser);
      setIsEditingUser(false);
      alert("User settings saved!");
    } catch (err) {
      alert("Failed to save user");
    }
  };

  const handleCancelUser = () => {
    setEditedUser(currentUser);
    setIsEditingUser(false);
  };

  // --- Add new notification (backend + frontend) ---
  const handleAddNotification = async () => {
    if (!currentUser || !newNotification.message.trim()) return;

    const notificationToAdd = {
      userId: currentUser.userId,
      type: newNotification.type,
      message: newNotification.message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationToAdd),
      });
      if (!res.ok) throw new Error("Failed to add notification");
      const data = await res.json();

      const newNotif = { ...data.notification, user: currentUser };
      setNotifications((prev) => [newNotif, ...prev]);
      setNewNotification({ type: "update_available", message: "" });
      setShowAddNotification(false);
      alert("Notification sent!");
    } catch (err) {
      alert("Failed to add notification");
    }
  };

  // --- Mark as read (local only) ---
  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(
      notifications.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
    alert("Marked as read!");
  };

  // --- Delete notification (backend + frontend) ---
  const handleDeleteNotification = async (notificationId: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/settings/notifications/${notificationId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setNotifications(notifications.filter((n) => n.notificationId !== notificationId));
      alert("Notification deleted!");
    } catch (err) {
      alert("Failed to delete notification");
    }
  };

  const handleDeleteUser = () => {
    if (
      confirm(
        "Are you sure you want to delete this user? This will also delete associated notifications."
      )
    ) {
      alert("User deleted! (demo only)");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getTypeBadgeClass = (type: NotificationType) => {
    switch (type) {
      case "release_published":
        return "bg-green-100 text-green-800";
      case "license_expired":
        return "bg-red-100 text-red-800";
      case "update_available":
        return "bg-blue-100 text-blue-800";
      case "system_alert":
        return "bg-yellow-100 text-yellow-800";
      case "user_mention":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <p className="p-8 text-gray-600">Loading settings...</p>;
  if (error) return <p className="p-8 text-red-500">{error}</p>;
  if (!currentUser) return <p className="p-8 text-gray-500">No user found.</p>;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.div
  className="flex-1 p-8 bg-gray-100 min-h-screen"
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.25, ease: "easeInOut" }}
>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">Notification Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage notifications for {currentUser.name} ({currentUser.email}) | Role:{" "}
            {currentUser.role} | Unread: {unreadCount}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditingUser(!isEditingUser)}
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
          >
            {isEditingUser ? "Cancel" : "Edit"}
          </button>
          {/* {isEditingUser && (
            <button
              onClick={handleSaveUser}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
            >
              Save User Changes
            </button>
          )} */}
          <button
            onClick={() => setShowAddNotification(!showAddNotification)}
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
            disabled={isEditingUser}
          >
            Send Notification 
          </button>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-700"
          >
            Delete User
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-black border-b pb-2 mb-4">
          User Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div className="flex items-center">
            <label className="w-32">User ID:</label>
            <p className="flex-1 text-black font-mono bg-gray-100 px-3 py-2 border rounded">
              {currentUser.userId}
            </p>
          </div>

          <div className="flex items-center">
            <label className="w-32">Name:</label>
            {isEditingUser ? (
              <input
                type="text"
                name="name"
                value={editedUser?.name || ""}
                onChange={handleUserInputChange}
                className="flex-1 text-gray-700 px-3 py-2 border rounded"
              />
            ) : (
              <p className="flex-1 text-black bg-gray-100 px-3 py-2 border rounded">
                {currentUser.name}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32">Email:</label>
            {isEditingUser ? (
              <input
                type="email"
                name="email"
                value={editedUser?.email || ""}
                onChange={handleUserInputChange}
                className="flex-1 text-gray-700 px-3 py-2 border rounded"
              />
            ) : (
              <p className="flex-1 text-black bg-gray-100 px-3 py-2 border rounded">
                {currentUser.email}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32">Role:</label>
            {isEditingUser ? (
              <select
                name="role"
                value={editedUser?.role || ""}
                onChange={handleUserInputChange}
                className="flex-1 text-black px-3 py-2 border rounded"
              >
                <option value="admin">Admin</option>
                <option value="release_manager">Release Manager</option>
                <option value="approver">Approver</option>
                <option value="user">User</option>
              </select>
            ) : (
              <span
                className={`flex-1 inline-block px-3 py-2 border rounded font-medium text-sm ${
                  currentUser.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : currentUser.role === "release_manager"
                    ? "bg-blue-100 text-blue-800"
                    : currentUser.role === "approver"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentUser.role.charAt(0).toUpperCase() +
                  currentUser.role.slice(1)}
              </span>
            )}
          </div>

          <div className="flex items-center">
            <label className="w-32">Client ID:</label>
            <p className="flex-1 text-black bg-gray-100 px-3 py-2 border rounded">
              {currentUser.clientId || "Internal Staff (No Client)"}
            </p>
          </div>

          <div className="col-span-2 flex items-start">
            <label className="w-32 mt-1">Password Hash:</label>
            <div className="flex-1">
              <p className="text-gray-500 font-mono bg-gray-100 px-3 py-2 border rounded text-xs">
                {currentUser.passwordHash
                  ? `${currentUser.passwordHash.substring(0, 8)}... (masked)`
                  : "No password hash available."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Notification Form */}
      {showAddNotification && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black border-b pb-2 mb-4">
            Send New Notification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={newNotification.type}
                onChange={handleNotificationInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
              >
                <option value="update_available">Update Available</option>
                <option value="license_expired">License Expired</option>
                <option value="release_published">Release Published</option>
                <option value="system_alert">System Alert</option>
                <option value="user_mention">User Mention</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                name="message"
                value={newNotification.message}
                onChange={handleNotificationInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
                placeholder="Enter notification message"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button
              onClick={handleAddNotification}
              disabled={!newNotification.message.trim()}
              className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
            >
              Send Notification
            </button>
            <button
              onClick={() => setShowAddNotification(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-black">
            Notifications ({notifications.length})
          </h2>
          <button
            onClick={() =>
              notifications
                .filter((n) => !n.isRead)
                .forEach((n) => handleMarkAsRead(n.notificationId))
            }
            disabled={unreadCount === 0}
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
          >
            Mark All as Read
          </button>
        </div>

        {notifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((notification) => (
                    <tr
                      key={notification.notificationId}
                      className={`hover:bg-gray-50 ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {notification.notificationId}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(
                            notification.type
                          )}`}
                        >
                          {notification.type.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-900 max-w-md truncate"
                        title={notification.message}
                      >
                        {notification.message}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {notification.isRead ? (
                          <span className="text-green-600 font-semibold">
                            Read
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold">
                            Unread
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(notification.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium flex gap-2 justify-end">
                        {!notification.isRead && (
                          <button
                            onClick={() =>
                              handleMarkAsRead(notification.notificationId)
                            }
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.notificationId)
                          }
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No notifications available.
          </p>
        )}
      </div>






{/* Edit User Modal */}
{isEditingUser && (
  <dialog open className="modal">
    <div className="modal-box w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-bold text-xl text-black mb-4">Edit User</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveUser();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={editedUser?.name || ""}
              onChange={handleUserInputChange}
              required
              className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={editedUser?.email || ""}
              onChange={handleUserInputChange}
              required
              className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={editedUser?.role || ""}
              onChange={handleUserInputChange}
              className="select select-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
            >
              <option value="admin">Admin</option>
              <option value="release_manager">Release Manager</option>
              <option value="approver">Approver</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="number"
              name="clientId"
              value={editedUser?.clientId || ""}
              onChange={handleUserInputChange}
              className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
              placeholder="Enter client ID (optional)"
            />
          </div>
        </div>

        <div className="modal-action justify-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
          >
            Save
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 border border-gray-400"
            onClick={handleCancelUser}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </dialog>
)}



      
    </motion.div>
  );
};

export default NotificationSettings;

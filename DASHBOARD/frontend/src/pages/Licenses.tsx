import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const LicensePage = () => {
  type LicenseType = "subscription" | "perpetual";
  type LicenseStatus = "active" | "expired" | "revoked" | "suspended";

  const [license, setLicense] = useState({
    licenseId: 1,
    clientId: 123,
    productId: 1,
    licenseKey: "",
    type: "subscription" as LicenseType,
    startDate: "2023-10-01",
    endDate: "2024-12-31",
    status: "active" as LicenseStatus,
    client: { id: 123, name: "Example Client Corp" },
    product: { id: 1, name: "Analytics Pro ", sku: "ANPR-001" },
    audits: [
      { licenseAuditId: 1, action: "activated", timestamp: "2023-10-01T10:00:00Z" },
      { licenseAuditId: 2, action: "renewed", timestamp: "2024-01-15T14:30:00Z" },
      { licenseAuditId: 3, action: "expired", timestamp: "2024-12-31T00:00:00Z" },
    ] as Array<{ licenseAuditId: number; action: string; timestamp: string }>,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editedLicense, setEditedLicense] = useState({ ...license });
useEffect(() => {
  const fetchLicense = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/licenses/1`); // use your actual licenseId
      setLicense(res.data);
      setEditedLicense({ ...res.data });
    } catch (err) {
      console.error("Failed to fetch license:", err);
    }
  };

  fetchLicense();
}, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedLicense((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: LicenseType) => {
    setEditedLicense((prev) => ({ ...prev, type }));
  };

  const handleStatusChange = (status: LicenseStatus) => {
    setEditedLicense((prev) => ({ ...prev, status }));
  };

  const handleSave = async () => {
    if (!editedLicense.clientId || !editedLicense.productId || !editedLicense.licenseKey.trim() || !editedLicense.endDate) {
      alert("Please fill in all required fields: Client ID, Product ID, License Key, and End Date.");
      return;
    }

    try {
      const res = await axios.put(`http://localhost:8000/api/licenses/${license.licenseId}`, editedLicense);
      setLicense(res.data);
      setEditedLicense({ ...res.data });
      setShowEditModal(false);
      alert("License updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update license");
    }
  };

  const generateLicenseKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";
    for (let i = 0; i < 16; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Insert hyphen after 8 characters
    return key.slice(0, 8) + "-" + key.slice(8);
  };


  const handleGenerateKey = async () => {
    const newKey = generateLicenseKey();


    const auditEntry = {
      licenseAuditId:
        license.audits.length > 0 ? Math.max(...license.audits.map((a) => a.licenseAuditId)) + 1 : 1,
      action: "regenerated key",
      timestamp: new Date().toISOString(),
    };

    const updated = {
      ...license,
      licenseKey: newKey,
      audits: [...license.audits, auditEntry],
    };

    try {
      const res = await axios.put(`http://localhost:8000/api/licenses/${license.licenseId}`, updated);
      setLicense(res.data);
      setEditedLicense({ ...res.data });
      alert(`New license key generated: ${newKey}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate license key");
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this license? This action cannot be undone.")) return;

    const auditEntry = {
      licenseAuditId:
        license.audits.length > 0 ? Math.max(...license.audits.map((a) => a.licenseAuditId)) + 1 : 1,
      action: "revoked",
      timestamp: new Date().toISOString(),
    };

    const updated = {
      ...license,
      status: "revoked",
      audits: [...license.audits, auditEntry],
    };

    try {
      const res = await axios.put(`http://localhost:8000/api/licenses/${license.licenseId}`, updated);
      setLicense(res.data);
      setEditedLicense({ ...res.data });
      alert("License revoked!");
    } catch (err) {
      console.error(err);
      alert("Failed to revoke license");
    }
  };

  const handleOpenEditModal = () => {
    setEditedLicense({ ...license });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditedLicense({ ...license });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = () => new Date(license.endDate) < new Date();

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
          <h1 className="text-2xl font-bold text-black">License Management</h1>
          <p className="text-gray-600 mt-1">
            Manage license for {license.product.name} ({license.product.sku}) - Client: {license.client.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenEditModal}
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
          >
            Edit
          </button>
          <button
            onClick={handleGenerateKey}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Regenerate Key
          </button>
          <button
            onClick={handleRevoke}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-500"
            disabled={license.status === "revoked"}
          >
            Revoke License
          </button>
        </div>
      </div>

      <div className="grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-black border-b pb-2 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              {/* License ID */}
              <div className="flex items-center">
                <label className="w-32">License ID:</label>
                <p className="flex-1 text-black bg-gray-100 font-mono px-3 py-2 border rounded">
                  {license.licenseId}
                </p>
              </div>

              {/* Client ID */}
              <div className="flex items-center">
                <label className="w-32">Client ID:</label>
                <p className="flex-1 bg-gray-100 text-black px-3 py-2 border rounded">
                  {license.clientId} ({license.client.name})
                </p>
              </div>

              {/* Product ID */}
              <div className="flex items-center">
                <label className="w-32">Product ID:</label>
                <p className="flex-1 bg-gray-100 text-black px-3 py-2 border rounded">
                  {license.productId} ({license.product.name}, SKU: {license.product.sku})
                </p>
              </div>

              {/* License Key */}
              <div className="flex items-center">
                <label className="w-32">License Key:</label>
                <p className="flex-1 bg-gray-100 text-black font-mono px-3 py-2 border rounded break-all">
                  {license.licenseKey}
                </p>
              </div>

              {/* License Type */}
              <div className="flex items-center">
                <label className="w-32">License Type:</label>
                <span className="flex-1 px-3 py-2 border bg-gray-100 rounded text-black">
                  {license.type.charAt(0).toUpperCase() + license.type.slice(1)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <label className="w-32">Status:</label>
                <span className="flex-1 px-3 py-2 border bg-gray-100 rounded text-black">
                  {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                </span>
              </div>

              {/* Start Date */}
              <div className="flex items-center">
                <label className="w-32">Start Date:</label>
                <p className="flex-1 text-black bg-gray-100 px-3 py-2 border rounded">
                  {formatDate(license.startDate)}
                </p>
              </div>

              {/* End Date */}
              <div className="flex items-center">
                <label className="w-32">End Date:</label>
                <p
                  className={`flex-1 bg-gray-100 text-black px-3 py-2 border rounded ${isExpired() ? "text-red-500" : ""
                    }`}
                >
                  {formatDate(license.endDate)} {isExpired() && "(Expired)"}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Log Section */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-black border-b pb-2">Audit Log</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {license.audits.map((audit) => (
                    <tr key={audit.licenseAuditId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {audit.action.charAt(0).toUpperCase() + audit.action.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(audit.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit License Modal */}
      {showEditModal && (
        <dialog open className="modal">
          <div className="modal-box w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-xl text-black mb-4">Edit License</h3>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="number"
                    name="clientId"
                    value={editedLicense.clientId}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter client ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <input
                    type="number"
                    name="productId"
                    value={editedLicense.productId}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter product ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Key</label>
                  <input
                    type="text"
                    name="licenseKey"
                    value={editedLicense.licenseKey}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200 font-mono"
                    placeholder="Enter license key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                  <select
                    name="type"
                    value={editedLicense.type}
                    onChange={(e) => handleTypeChange(e.target.value as LicenseType)}
                    className="select select-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="perpetual">Perpetual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editedLicense.status}
                    onChange={(e) => handleStatusChange(e.target.value as LicenseStatus)}
                    className="select select-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={editedLicense.startDate}
                    onChange={handleInputChange}
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editedLicense.endDate}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="modal-action justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                  disabled={!editedLicense.clientId || !editedLicense.productId || !editedLicense.licenseKey.trim() || !editedLicense.endDate}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 border border-gray-400"
                  onClick={handleCloseEditModal}
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

export default LicensePage;

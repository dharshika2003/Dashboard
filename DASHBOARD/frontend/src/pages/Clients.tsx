
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
``
const ClientsPage: React.FC = () => {
  
  type ClientLocation = {
    clientLocationId: number;
    address: string;
    city: string;
    country: string;
  };

  type Client = {
    clientId: number;
    name: string;
    primaryContact: string;
    email: string;
    billingInfo?: string;
    createdAt: string;
    locations: ClientLocation[];
    productIds?: number[];
    releaseIds?: number[];
    updateLogIds?: number[];
  };

  type LocationForm = {
    address: string;
    city: string;
    country: string;
  };

  // --- State ---
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editedClient, setEditedClient] = useState<Client>({} as Client);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newClient, setNewClient] = useState<Client>({
    clientId: 0,
    name: "",
    primaryContact: "",
    email: "",
    billingInfo: undefined,
    createdAt: new Date().toISOString().split("T")[0],
    locations: [],
    productIds: [],
    releaseIds: [],
    updateLogIds: [],
  });

  const [newLocation, setNewLocation] = useState<LocationForm>({
    address: "",
    city: "",
    country: "",
  });

  const [editedLocation, setEditedLocation] = useState<LocationForm>({
    address: "",
    city: "",
    country: "",
  });

  const [tempRow, setTempRow] = useState<{ productId: number; releaseId: number; updateId: number }>({
    productId: 0,
    releaseId: 0,
    updateId: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [linkedOpen, setLinkedOpen] = useState(false); 

  const API_URL = "http://localhost:8000/api/clients";

   
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setClients(Array.isArray(data) ? data : data.clients || []))
      .catch(() => console.error("Error fetching clients"));
  }, []);

  
  const initialNewClient: Client = {
    clientId: 0,
    name: "",
    primaryContact: "",
    email: "",
    billingInfo: undefined,
    createdAt: new Date().toISOString().split("T")[0],
    locations: [],
    productIds: [],
    releaseIds: [],
    updateLogIds: [],
  };

  const initialLocation: LocationForm = { address: "", city: "", country: "" };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isEdit: boolean) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditedClient((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewClient((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const { name, value } = e.target;
    if (isEdit) {
      setEditedLocation((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewLocation((prev) => ({ ...prev, [name]: value }));
    }
  };

   
  const handleLinkedChange = (
    kind: "productIds" | "releaseIds" | "updateLogIds",
    index: number,
    value: string,
    isEdit: boolean
  ) => {
    const n = Number(value);
    if (isEdit) {
      const updated = [...(editedClient[kind] || [])];
      updated[index] = n;
      setEditedClient((prev) => ({ ...prev, [kind]: updated }));
    } else {
      const updated = [...(newClient[kind] || [])];
      updated[index] = n;
      setNewClient((prev) => ({ ...prev, [kind]: updated }));
    }
  };

  const addLinkedRow = (isEdit: boolean) => {
    if (isEdit) {
      setEditedClient((prev) => ({
        ...prev,
        productIds: [...(prev.productIds || []), tempRow.productId || 0],
        releaseIds: [...(prev.releaseIds || []), tempRow.releaseId || 0],
        updateLogIds: [...(prev.updateLogIds || []), tempRow.updateId || 0],
      }));
    } else {
      setNewClient((prev) => ({
        ...prev,
        productIds: [...(prev.productIds || []), tempRow.productId || 0],
        releaseIds: [...(prev.releaseIds || []), tempRow.releaseId || 0],
        updateLogIds: [...(prev.updateLogIds || []), tempRow.updateId || 0],
      }));
    }
    setTempRow({ productId: 0, releaseId: 0, updateId: 0 });
  };

  const removeLinkedRow = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditedClient((prev) => ({
        ...prev,
        productIds: (prev.productIds || []).filter((_, i) => i !== index),
        releaseIds: (prev.releaseIds || []).filter((_, i) => i !== index),
        updateLogIds: (prev.updateLogIds || []).filter((_, i) => i !== index),
      }));
    } else {
      setNewClient((prev) => ({
        ...prev,
        productIds: (prev.productIds || []).filter((_, i) => i !== index),
        releaseIds: (prev.releaseIds || []).filter((_, i) => i !== index),
        updateLogIds: (prev.updateLogIds || []).filter((_, i) => i !== index),
      }));
    }
  };

 
  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.primaryContact) {
      alert("Company name, Primary Contact and Email are required!");
      return;
    }

    const newClientData: Client = {
      ...newClient,
      locations: newLocation.address.trim()
        ? [{ clientLocationId: Date.now(), ...newLocation }]
        : [],
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClientData),
      });
      if (!res.ok) throw new Error("Failed to add client");

      const added = await res.json();
      setClients([added, ...clients]);
      setNewClient(initialNewClient);
      setNewLocation(initialLocation);
      setShowAddModal(false);
      setLinkedOpen(false);
      alert("✅ New client added!");
    } catch {
      alert("❌ Error adding client");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedClient || !editedClient.name || !editedClient.email || !editedClient.primaryContact) {
      alert("Company name, Primary Contact and Email are required!");
      return;
    }

    const updatedClient: Client = {
      ...editedClient,
      locations: editedLocation.address.trim()
        ? [{ clientLocationId: Date.now(), ...editedLocation }]
        : selectedClient.locations,
    };

    try {
      const res = await fetch(`${API_URL}/${selectedClient.clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClient),
      });
      if (!res.ok) throw new Error("Failed to update client");

      const updated = await res.json();
      setClients(clients.map((c) => (c.clientId === selectedClient.clientId ? updated : c)));
      setShowEditModal(false);
      setSelectedClient(null);
      setEditedClient({} as Client);
      setEditedLocation(initialLocation);
      setLinkedOpen(false);
      alert("✅ Client updated!");
    } catch {
      alert("❌ Error updating client");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setClients(clients.filter((c) => c.clientId !== id));
      if (selectedClient?.clientId === id) {
        setSelectedClient(null);
        setShowEditModal(false);
      }
      alert("✅ Client deleted");
    } catch {
      alert("❌ Error deleting client");
    }
  };

  
  const openAddModal = () => {
    setShowAddModal(true);
    setLinkedOpen(false);
    setNewClient(initialNewClient);
    setNewLocation(initialLocation);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewClient(initialNewClient);
    setNewLocation(initialLocation);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditedClient({ ...client });
    const loc = client.locations[0] || { address: "", city: "", country: "" };
    setEditedLocation(loc);
    setLinkedOpen(false);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedClient(null);
    setEditedClient({} as Client);
    setEditedLocation(initialLocation);
  };

 
  const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
    <motion.span
      initial={false}
      animate={{ rotate: open ? 90 : 0 }}
      transition={{ duration: 0.2 }}
      className="inline-block"
    >
      ▶
    </motion.span>
  );

  const Collapsible: React.FC<{
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }> = ({ title, open, onToggle, children }) => (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold text-gray-900">{title}</span>
        <Chevron open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-200"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
 
  return (
    <div className="flex-1 p-4 sm:p-8 bg-gray-100 min-h-screen">
     
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client accounts.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search clients by name, contact, or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 text-black px-3 py-2 rounded-lg shadow-sm focus:ring focus:ring-blue-200"
          />
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
          >
            Add Client
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Client Directory</h2>
          <p className="text-sm text-gray-600 mt-1">Click on a client to edit.</p>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div
                key={client.clientId}
                className="p-6 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => openEditModal(client)}
              >
                <div>
                  <h3 className="text-gray-900 font-semibold">{client.name}</h3>
                  <p className="text-gray-500">
                    {client.primaryContact} • {client.email}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {client.locations.length > 0
                      ? `${client.locations[0].city}, ${client.locations[0].country}`
                      : "No location"}{" "}
                    • Created on {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-gray-700 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(client);
                    }}
                    className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(client.clientId);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">No clients found. Try a different search.</div>
          )}
        </div>
      </div>

       
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-neutral/20 flex justify-center z-50 overflow-y-auto">
          <div className="flex min-h-screen items-start justify-center p-4 w-full">
              
            <button
              onClick={closeAddModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
            >
              ×
            </button>

            <h3 className="font-bold text-xl text-black mb-4">Add New Client</h3>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Company Name"
                value={newClient.name}
                onChange={(e) => handleInputChange(e, false)}
                className="input input-bordered w-full bg-gray-100 text-black"
              />
              <input
                type="text"
                name="primaryContact"
                placeholder="Primary Contact Name"
                value={newClient.primaryContact}
                onChange={(e) => handleInputChange(e, false)}
                className="input input-bordered w-full bg-gray-100 text-black"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newClient.email}
                onChange={(e) => handleInputChange(e, false)}
                className="input input-bordered w-full bg-gray-100 text-black"
              />
              <textarea
                name="billingInfo"
                placeholder="Billing Information (optional)"
                value={newClient.billingInfo || ""}
                onChange={(e) => handleInputChange(e, false)}
                rows={3}
                className="textarea textarea-bordered w-full bg-gray-100 text-black"
              />
              <h4 className="font-semibold text-black pt-2">Primary Location</h4>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={newLocation.address}
                onChange={(e) => handleLocationInputChange(e as any, false)}
                className="input input-bordered w-full bg-gray-100 text-black"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={newLocation.city}
                  onChange={(e) => handleLocationInputChange(e as any, false)}
                  className="input input-bordered w-full bg-gray-100 text-black"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={newLocation.country}
                  onChange={(e) => handleLocationInputChange(e as any, false)}
                  className="input input-bordered w-full bg-gray-100 text-black"
                />
              </div>
              <Collapsible
                title="Linked IDs (Product / Release / Update)"
                open={linkedOpen}
                onToggle={() => setLinkedOpen((o) => !o)}
              >
                
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="text-xs text-gray-600">Product ID</label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-100 text-black"
                      value={tempRow.productId || 0}
                      onChange={(e) => setTempRow((t) => ({ ...t, productId: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Release ID</label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-100 text-black"
                      value={tempRow.releaseId || 0}
                      onChange={(e) => setTempRow((t) => ({ ...t, releaseId: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Update ID</label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-100 text-black"
                      value={tempRow.updateId || 0}
                      onChange={(e) => setTempRow((t) => ({ ...t, updateId: Number(e.target.value) }))}
                    />
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    onClick={() => addLinkedRow(false)}
                  >
                    Row
                  </button>
                </div>
 
                <div className="grid grid-cols-4 gap-2 mt-4 text-xs font-semibold text-gray-600">
                  <span>Product ID</span>
                  <span>Release ID</span>
                  <span>Update ID</span>
                  <span>Actions</span>
                </div>
                {(newClient.productIds && newClient.productIds.length
                  ? newClient.productIds
                  : []
                ).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 mt-2 items-center">
                    <input
                      type="number"
                      value={newClient.productIds?.[idx] || 0}
                      onChange={(e) => handleLinkedChange("productIds", idx, e.target.value, false)}
                      className="input input-bordered w-full bg-gray-100 text-black"
                    />
                    <input
                      type="number"
                      value={newClient.releaseIds?.[idx] || 0}
                      onChange={(e) => handleLinkedChange("releaseIds", idx, e.target.value, false)}
                      className="input input-bordered w-full bg-gray-100 text-black"
                    />
                    <input
                      type="number"
                      value={newClient.updateLogIds?.[idx] || 0}
                      onChange={(e) => handleLinkedChange("updateLogIds", idx, e.target.value, false)}
                      className="input input-bordered w-full bg-gray-100 text-black"
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeLinkedRow(idx, false)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </Collapsible>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={handleAddClient}
                  className="px-4 py-2 bg-[#008dcd] text-white rounded hover:bg-[#006fa1]"
                   
                >
                  Save
                </button>
                <button
                  onClick={closeAddModal}
                  className="px-4 py-2 bg-[#666666] text-white rounded-lg hover:bg-[#555]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 backdrop-blur-sm bg-neutral/20 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl sm:max-w-lg p-6 relative mx-2">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
            >
              ×
            </button>

            <h3 className="font-bold text-xl text-black mb-4">Edit Client</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              className="space-y-4"
            >
             
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={selectedClient.clientId}
                    readOnly
                    className="input input-bordered w-full bg-gray-200 text-gray-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="w-full bg-gray-100 text-black px-3 py-2 rounded">
                    {new Date(selectedClient.createdAt).toLocaleString()}
                  </p>
                </div>
                <div />
              </div>

             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editedClient.name || ""}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
                  <input
                    type="text"
                    name="primaryContact"
                    value={editedClient.primaryContact || ""}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editedClient.email || ""}
                    onChange={(e) => handleInputChange(e, true)}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Info</label>
                  <textarea
                    name="billingInfo"
                    value={editedClient.billingInfo || ""}
                    onChange={(e) => handleInputChange(e, true)}
                    rows={3}
                    className="textarea textarea-bordered w-full bg-gray-100 text-black"
                  />
                </div>
              </div>

          
              <h4 className="font-semibold text-black pt-2">Primary Location</h4>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={editedLocation.address}
                onChange={(e) => handleLocationInputChange(e as any, true)}
                className="input input-bordered w-full bg-gray-100 text-black"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={editedLocation.city}
                  onChange={(e) => handleLocationInputChange(e as any, true)}
                  className="input input-bordered w-full bg-gray-100 text-black"
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={editedLocation.country}
                  onChange={(e) => handleLocationInputChange(e as any, true)}
                  className="input input-bordered w-full bg-gray-100 text-black"
                />
              </div>

         
              <Collapsible
                title="Linked IDs (Product / Release / Update)"
                open={linkedOpen}
                onToggle={() => setLinkedOpen((o) => !o)}
              >
          
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="text-xs text-gray-600">Product ID</label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-100 text-black"
                      value={tempRow.productId || 0}
                      onChange={(e) => setTempRow((t) => ({ ...t, productId: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Release ID</label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-100 text-black"
                      value={tempRow.releaseId || 0}
                      onChange={(e) => setTempRow((t) => ({ ...t, releaseId: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Update ID</label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-100 text-black"
                      value={tempRow.updateId || 0}
                      onChange={(e) => setTempRow((t) => ({ ...t, updateId: Number(e.target.value) }))}
                    />
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    onClick={() => addLinkedRow(true)}
                  >
                    Add
                  </button>
                </div>

                
                {(editedClient.productIds || []).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 mt-2 items-center">
                    <input
                      type="number"
                      value={editedClient.productIds?.[idx] || 0}
                      onChange={(e) => handleLinkedChange("productIds", idx, e.target.value, true)}
                      className="input input-bordered w-full bg-gray-100 text-black"
                    />
                    <input
                      type="number"
                      value={editedClient.releaseIds?.[idx] || 0}
                      onChange={(e) => handleLinkedChange("releaseIds", idx, e.target.value, true)}
                      className="input input-bordered w-full bg-gray-100 text-black"
                    />
                    <input
                      type="number"
                      value={editedClient.updateLogIds?.[idx] || 0}
                      onChange={(e) => handleLinkedChange("updateLogIds", idx, e.target.value, true)}
                      className="input input-bordered w-full bg-gray-100 text-black"
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeLinkedRow(idx, true)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </Collapsible>
 
              <div className="modal-action justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedClient.clientId)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-500"
                >
                  Delete
                </button>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#008dcd] text-white rounded hover:bg-[#006fa1]"
                    disabled={!editedClient.name || !editedClient.email || !editedClient.primaryContact}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#666666] text-white rounded-lg hover:bg-[#555]"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;

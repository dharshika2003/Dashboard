
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const ProductUpdatesPage = () => {
  type UpdateLogStatus = "completed" | "failed" | "in_progress";

  type Release = {
    releaseId: number;
    productId: number;
    version: string;
    status: string;  
    releaseDate: string;
    title: string;
    changelog: string[];
    downloadUrl: string;
    notes: string;  
    productName?: string;
  };

  type UpdateLog = {
    updateLogId: number;
    clientId: number;
    releaseId: number;
    clientLocationId?: number | null;
    installedAt: string;
    status: UpdateLogStatus;
    client: { clientId: number; name: string };
    release: Release;
    location?: { clientLocationId: number; name: string } | null;
  };

  type Product = {
    productId: number;
    name: string;
  };

  const [releases, setReleases] = useState<Release[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);

  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRelease, setEditedRelease] = useState<Release>({} as Release);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRelease, setNewRelease] = useState<Release>({
    releaseId: 0,
    productId: 0,
    version: "",
    status: "Planned",
    releaseDate: "",
    title: "",
    changelog: [],
    downloadUrl: "",
    notes: "",
  }); 
  const [spotlightText, setSpotlightText] = useState("");
  const [eventsText, setEventsText] = useState("");
  const [infraText, setInfraText] = useState("");
  // const [addSpotlight, setAddSpotlight] = useState("");
  // const [addEvents, setAddEvents] = useState("");
  // const [addInfra, setAddInfra] = useState("");

 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [releasesRes, productsRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/releases"),
          axios.get("http://127.0.0.1:8000/api/products"),
        ]);

        setProducts(productsRes.data);

        const mergedReleases = releasesRes.data.map((r: any) => ({
          ...r,
          productName:
            productsRes.data.find((p: any) => p.productId === r.productId)?.name ||
            "Unknown",
        }));

        setReleases(mergedReleases);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        alert("Failed to load releases or products.");
      }
    };
    fetchData();
  }, []);

 
  const toChangelog = (events: string, infra: string) => {
    const eventsArray = events
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => `event:${line.trim()}`);
    const infraArray = infra
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => `infra:${line.trim()}`);
    return [...eventsArray, ...infraArray];
  };

  const fromChangelog = (cl: string[] | undefined) => {
    const list = Array.isArray(cl) ? cl : [];
    const events = list
      .filter((c) => c.toLowerCase().startsWith("event:"))
      .map((e) => e.replace(/^event:/i, "").trim())
      .join("\n");
    const infra = list
      .filter((c) => c.toLowerCase().startsWith("infra:"))
      .map((i) => i.replace(/^infra:/i, "").trim())
      .join("\n");
    return { events, infra };
  };


 
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (isEditing && selectedRelease) {
      setEditedRelease((prev) => ({ ...prev, [name]: name === "productId" ? Number(value) : value }));
    } else {
      setNewRelease((prev) => ({ ...prev, [name]: name === "productId" ? Number(value) : value }));
    }
  };
 
  const handleAddRelease = async () => {
    if (!newRelease.version || !newRelease.title || !newRelease.productId) {
      alert("Please fill in version, title, and select a product.");
      return;
    }

    const payload = {
      ...newRelease,
      notes: spotlightText.trim(),
      changelog: toChangelog(eventsText, infraText),
    };

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/releases", payload);
      const withName = {
        ...response.data,
        productName: products.find((p) => p.productId === response.data.productId)?.name || "Unknown",
      };
      setReleases([withName, ...releases]);
      setShowAddForm(false);
 
      setNewRelease({
        releaseId: 0,
        productId: 0,
        version: "",
        status: "Planned",
        releaseDate: "",
        title: "",
        changelog: [],
        downloadUrl: "",
        notes: "",
      });
      setSpotlightText("");
      setEventsText("");
      setInfraText("");

      alert("New update added!");
    } catch (error) {
      console.error("Failed to add release:", error);
      alert("Failed to add update.");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRelease || !editedRelease.releaseId || !editedRelease.productId) {
      alert("Please select a product.");
      return;
    }

    const updated = {
      ...editedRelease,
      notes: spotlightText.trim(),
      changelog: toChangelog(eventsText, infraText),

    };


    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/releases/${selectedRelease.releaseId}`,
        updated
      );
      const withName = {
        ...response.data,
        productName: products.find((p) => p.productId === response.data.productId)?.name || "Unknown",
      };
      setReleases(releases.map((r) => (r.releaseId === selectedRelease.releaseId ? withName : r)));
      setIsEditing(false);
      setSelectedRelease(null);
      alert("Release updated!");
    } catch (error) {
      console.error("Failed to save release:", error);
      alert("Failed to save release.");
    }
  };

  const handleDelete = async (releaseId: number) => {
    if (!confirm("Are you sure you want to delete this release?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/releases/${releaseId}`);
      setReleases(releases.filter((r) => r.releaseId !== releaseId));
      setUpdateLogs(updateLogs.filter((log) => log.releaseId !== releaseId));
      if (selectedRelease?.releaseId === releaseId) {
        setSelectedRelease(null);
        setIsEditing(false);
      }
      alert("Release deleted!");
    } catch (error) {
      console.error("Failed to delete release:", error);
      alert("Failed to delete release.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedRelease(null);
    setShowAddForm(false);
    setEditedRelease(selectedRelease || ({} as Release));
 
    setSpotlightText("");
    setEventsText("");
    setInfraText("");

    setNewRelease({
      releaseId: 0,
      productId: 0,
      version: "",
      status: "Planned",
      releaseDate: "",
      title: "",
      changelog: [],
      downloadUrl: "",
      notes: "",
    });
  };

  const openEdit = (release: Release) => {
    setSelectedRelease(release);
    setEditedRelease({ ...release });
    setIsEditing(true);
    setShowAddForm(false);

    const { events, infra } = fromChangelog(release.changelog);
    setSpotlightText(release.notes || "");
    setEventsText(events);
    setInfraText(infra);


  };

  const openAddFormHandler = () => {
    setShowAddForm(true);
    setIsEditing(false);
    setSelectedRelease(null);
 
    setSpotlightText("");
    setEventsText("");
    setInfraText("");
  };
 
  const renderAddForm = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-black mb-4">Add New Update</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black mb-4">
        <select
          name="productId"
          value={newRelease.productId}
          onChange={handleInputChange}
          className="border border-gray-500 rounded p-2"
        >
          <option value={0}>Select Product</option>
          {products.map((p) => (
            <option key={p.productId} value={p.productId}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="version"
          value={newRelease.version}
          onChange={handleInputChange}
          placeholder="Version"
          className="border border-gray-500 rounded p-2"
        />

        <select
          name="status"
          value={newRelease.status}
          onChange={handleInputChange}
          className="border border-gray-500 rounded p-2"
        > 
          <option value="Planned">Planned</option>
          <option value="Beta">Beta</option>
          <option value="Released">Released</option>
          <option value="Deprecated">Deprecated</option>
        </select>

        <input
          type="date"
          name="releaseDate"
          value={newRelease.releaseDate}
          onChange={handleInputChange}
          className="border border-gray-500 rounded p-2"
        />

        <input
          type="text"
          name="title"
          value={newRelease.title}
          onChange={handleInputChange}
          placeholder="Title"
          className="border border-gray-500 rounded p-2 md:col-span-2"
        />

        <input
          type="text"
          name="downloadUrl"
          value={newRelease.downloadUrl}
          onChange={handleInputChange}
          placeholder="Download URL"
          className="border border-gray-500 rounded p-2 md:col-span-2"
        />
      </div>
 
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-semibold text-blue-700">🔦 Spotlight</h4>
          <textarea
            value={spotlightText}
            onChange={(e) => setSpotlightText(e.target.value)}
            placeholder="Enter spotlight text"
            className="border border-gray-500 text-gray-600 rounded p-2 w-full mt-1"
            rows={3}
          />
        </div>
        <div>
          <h4 className="text-md font-semibold text-purple-700">📅 Events Coming Up</h4>
          <textarea
            value={eventsText}
            onChange={(e) => setEventsText(e.target.value)}
            placeholder="Enter events (one per line)"
            className="border border-gray-500 text-gray-600 rounded p-2 w-full mt-1"
            rows={3}
          />
        </div>
        <div>
          <h4 className="text-md font-semibold text-green-700">🏗️ New Infrastructure</h4>
          <textarea
            value={infraText}
            onChange={(e) => setInfraText(e.target.value)}
            placeholder="Enter infra updates (one per line)"
            className="border border-gray-500 text-gray-600 rounded p-2 w-full mt-1"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleAddRelease}
          className="text-gray-700 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <AnimatePresence>
      {isEditing && (
        <motion.div
          className="fixed inset-0 backdrop-blur-sm bg-neutral/20 flex items-center justify-center z-50 overflow-y-auto p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          onClick={() => setIsEditing(false)}
          transition={{ duration: 0.25 }}
        >

          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-black mb-4">Edit Update</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black mb-4">
              <select
                name="productId"
                value={editedRelease.productId}
                onChange={handleInputChange}
                className="border border-gray-500 rounded p-2"
              >
                <option value={0}>Select Product</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="version"
                value={editedRelease.version}
                onChange={handleInputChange}
                placeholder="Version"
                className="border border-gray-500 rounded p-2"
              />
              <select
                name="status"
                value={editedRelease.status}
                onChange={handleInputChange}
                className="border border-gray-500 rounded p-2"
              >
                <option value="Planned">Planned</option>
                <option value="Beta">Beta</option>
                <option value="Released">Released</option>
                <option value="Deprecated">Deprecated</option>
              </select>
              <input
                type="date"
                name="releaseDate"
                value={editedRelease.releaseDate}
                onChange={handleInputChange}
                className="border border-gray-500 rounded p-2"
              />
              <input
                type="text"
                name="title"
                value={editedRelease.title}
                onChange={handleInputChange}
                placeholder="Title"
                className="border border-gray-500 rounded p-2 md:col-span-2"
              />
              <input
                type="text"
                name="downloadUrl"
                value={editedRelease.downloadUrl}
                onChange={handleInputChange}
                placeholder="Download URL"
                className="border border-gray-500 rounded p-2 md:col-span-2"
              />
            </div>
 
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-blue-700">🔦 Spotlight</h4>
                <textarea
                  value={spotlightText}
                  onChange={(e) => setSpotlightText(e.target.value)}
                  placeholder="Enter spotlight text"
                  className="border border-gray-500 text-gray-600 rounded p-2 w-full mt-1"
                  rows={3}
                />
              </div>
              <div>
                <h4 className="text-md font-semibold text-purple-700">📅 Events Coming Up</h4>
                <textarea
                  value={eventsText}
                  onChange={(e) => setEventsText(e.target.value)}
                  placeholder="Enter events (one per line)"
                  className="border text-gray-600 border-gray-500 rounded p-2 w-full mt-1"
                  rows={3}
                />
              </div>
              <div>
                <h4 className="text-md font-semibold text-green-700">🏗️ New Infrastructure</h4>
                <textarea
                  value={infraText}
                  onChange={(e) => setInfraText(e.target.value)}
                  placeholder="Enter infra updates (one per line)"
                  className="border border-gray-500 text-gray-600 rounded p-2 w-full mt-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderReleaseList = () => (
    <div className="bg-white rounded-lg shadow mb-6 border border-gray-200">
      <div className="p-6 border-b border-gray-500">
        <h2 className="text-lg font-semibold text-black">Office Newsletter</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {releases
          .sort(
            (a, b) =>
              new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
          )
          .map((r) => {
            const changelog = Array.isArray(r.changelog) ? r.changelog : [];
            const title = r.title || "(No Title)";
            const releaseDate = r.releaseDate
              ? new Date(r.releaseDate).toLocaleDateString()
              : "No date";

            const spotlight = r.notes || changelog[0] || "No spotlight today.";

            const events = changelog.filter((c: string) =>
              c.toLowerCase().startsWith("event:")
            );

            const infra = changelog.filter((c: string) =>
              c.toLowerCase().startsWith("infra:")
            );

            return (
              <div key={r.releaseId} className="p-6 hover:bg-gray-50 cursor-pointer"> 
                <h3 className="text-xl font-bold text-black mb-1">📰 Office Update {title}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  📦 {r.productName || "Unknown"} &nbsp; | &nbsp; v{r.version}
                </p>
                <p className="text-sm text-gray-600 mb-4">📅 {releaseDate}</p> 
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-blue-700">🔦 Spotlight</h4>
                  <p className="text-gray-800 mt-1">{spotlight}</p>
                </div>
 
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-purple-700">📅 Events Coming Up</h4>
                  {events.length ? (
                    <ul className="list-disc ml-5 text-gray-800 mt-1">
                      {events.map((e, idx) => (
                        <li key={idx}>{e.replace(/^(event:)/i, "").trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No events mentioned.</p>
                  )}
                </div>
 
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-green-700">🏗️ New Infrastructure</h4>
                  {infra.length ? (
                    <ul className="list-disc ml-5 text-gray-600 text-gray-800 mt-1">
                      {infra.map((i, idx) => (
                        <li key={idx}>{i.replace(/^(infra:)/i, "").trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No infra updates.</p>
                  )}
                </div>
 
                <div className="text-gray-700 flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(r)}
                    className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.releaseId)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <motion.div
      className="flex-1 p-4 sm:p-8 bg-gray-100 min-h-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">Updates</h1>
          <p className="text-gray-600 mt-1">Manage updates.</p>
        </div>
        <div>
          {!showAddForm && !isEditing && (
            <button
              onClick={openAddFormHandler}
              className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
            >
              Add New Updates
            </button>
          )}
        </div>
      </div>

      {showAddForm && renderAddForm()}
      {renderEditModal()}
      {!showAddForm && !isEditing && renderReleaseList()}
    </motion.div>
  );
};

export default ProductUpdatesPage;

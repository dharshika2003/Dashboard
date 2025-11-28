
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
 
type Product = {
  productId: number;
  name: string;
  lastModified?: string | null;
};

type Artifact = {
  artifactId: number;
  releaseId: number;
  fileUrl: string;
  hash: string;
  signature?: string | null;
  size: number;
  createdAt: string;
};

type UpdateLogStatus = "completed" | "failed" | "in_progress";
type Client = { clientId: number; name: string; lastModified?: string | null };
type ClientLocation = { clientLocationId: number; name: string };

type UpdateLog = {
  updateLogId: number;
  clientId: number;
  productId: number; 
  releaseId: number;
  clientLocationId?: number | null;
  installedAt: string;
  status: UpdateLogStatus;
  client: Client;
  location?: ClientLocation | null;
};

type ReleaseType = "major" | "minor" | "service_pack" | "patch";
type ReleaseStatus = "draft" | "approved" | "published";

type ReleaseDependency = {
  releaseDependencyId: number;
  releaseId: number;
  dependsOnReleaseId: number;
  dependsOn: any; // keep as-is per backend
};

type Release = {
  releaseId: number;
  productId: number;
  version: string;
  releaseType: ReleaseType | string;
  status: ReleaseStatus | string;
  releaseDate: string;
  notes?: string;
  product: { productId: number; name: string; lastModified?: string | null };
  artifacts: Artifact[];
  updateLogs: UpdateLog[];
  dependencies: ReleaseDependency[];
  lastModified?: string | null;
};
 
const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const fmtSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
const badgeForLog = (s: UpdateLogStatus) =>
  s === "completed"
    ? "bg-green-100 text-green-800"
    : s === "in_progress"
      ? "bg-blue-100 text-blue-800"
      : "bg-red-100 text-red-800";
const badgeForRelType = (t: ReleaseType | string) =>
  t === "major"
    ? "bg-red-100 text-red-800"
    : t === "minor"
      ? "bg-blue-100 text-blue-800"
      : t === "service_pack"
        ? "bg-gray-100 text-black"
        : "bg-yellow-100 text-yellow-800";
 
const ReleasesPage: React.FC = () => {
 
  const [products, setProducts] = useState<Product[]>([]);
  const [releasesByProduct, setReleasesByProduct] = useState<Record<number, Release[]>>({});  
 
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
 
  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, relRes] = await Promise.all([
          axios.get<Product[]>("http://127.0.0.1:8000/api/products"),
          axios.get<Release[]>("http://127.0.0.1:8000/api/releases"),
        ]);
        const prods = prodRes.data || [];
        setProducts(prods);

        const rels = relRes.data || [];
        const grouped: Record<number, Release[]> = {};
        rels.forEach((r) => {
          if (!grouped[r.productId]) grouped[r.productId] = [];
          grouped[r.productId].push(r);
        }); 
        Object.values(grouped).forEach((arr) =>
          arr.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
        );
        setReleasesByProduct(grouped);
      } catch (e) {
        console.error(e);
        alert("Failed to load data.");
      }
    };
    load();
  }, []);
 
  const artifacts = useMemo<Artifact[]>(() => {
    if (!selectedProduct) return [];
    const rels = releasesByProduct[selectedProduct.productId] || [];
    return rels.flatMap((r) => r.artifacts || []);
  }, [selectedProduct, releasesByProduct]);

  const logs = useMemo<UpdateLog[]>(() => {
    if (!selectedProduct) return [];
    const rels = releasesByProduct[selectedProduct.productId] || [];
    return rels.flatMap((r) => r.updateLogs || []);
  }, [selectedProduct, releasesByProduct]);

  const deps = useMemo<ReleaseDependency[]>(() => {
    if (!selectedProduct) return [];
    const rels = releasesByProduct[selectedProduct.productId] || [];
    return rels.flatMap((r) => r.dependencies || []);
  }, [selectedProduct, releasesByProduct]);
 
  const openModal = (p: Product) => {
    setSelectedProduct(p);
    setEditedProduct(p);
    setIsEditing(false);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedProduct(null);
    setEditedProduct(null);
  };
 
  const onFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => (prev ? { ...prev, [name]: value } : prev));
  };
  const saveProduct = async () => {
    if (!editedProduct || !editedProduct.productId) return;
    try {
      const res = await axios.put<Product>(
        `http://127.0.0.1:8000/api/products/${editedProduct.productId}`,
        editedProduct
      );
      const updated = res.data;
      setProducts((prev) =>
        prev.map((p) => (p.productId === updated.productId ? updated : p))
      );
      setSelectedProduct(updated);
      setEditedProduct(updated);
      setIsEditing(false);
      alert("Product saved.");
    } catch (e) {
      console.error(e);
      alert("Failed to save product.");
    }
  };
  const deleteProduct = async () => {
    if (!selectedProduct?.productId) return;
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/products/${selectedProduct.productId}`);
      setProducts((prev) =>
        prev.filter((p) => p.productId !== selectedProduct.productId)
      ); 
      setReleasesByProduct((prev) => {
        const cp = { ...prev };
        delete cp[selectedProduct.productId];
        return cp;
      });
      closeModal();
      alert("Product deleted.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete product.");
    }
  };
 
  const latestReleaseFor = (productId: number): Release | undefined => {
    const list = releasesByProduct[productId] || [];
    return list[0];  
  };

  const addRelease = async () => {
    if (!selectedProduct) return;

    const nowIso = new Date().toISOString();
    const newRelease: Release = {
      releaseId: Date.now(),
      productId: selectedProduct.productId,
      version: "1.0.0",
      releaseType: "minor",
      status: "draft",
      releaseDate: nowIso,
      notes: "",
      product: { productId: selectedProduct.productId, name: selectedProduct.name, lastModified: null },
      artifacts: [],
      updateLogs: [],
      dependencies: [],
      lastModified: null,
    };

    const res = await axios.post("http://127.0.0.1:8000/api/releases", newRelease);
    const saved: Release = res.data;

    setReleasesByProduct((prev) => {
      const list = prev[selectedProduct.productId] || [];
      const next = [saved, ...list];
      return { ...prev, [selectedProduct.productId]: next };
    });
  };

  const deleteRelease = async (releaseId: number) => {
    if (!selectedProduct) return;
    await axios.delete(`http://127.0.0.1:8000/api/releases/${releaseId}`);
    setReleasesByProduct((prev) => {
      const list = prev[selectedProduct.productId] || [];
      const next = list.filter((r) => r.releaseId !== releaseId);
      return { ...prev, [selectedProduct.productId]: next };
    });
  };
 
  const addArtifact = async () => {
    if (!selectedProduct) return;
 
    let rel = latestReleaseFor(selectedProduct.productId);
    if (!rel) {
      await addRelease();
      rel = latestReleaseFor(selectedProduct.productId);
      if (!rel) return;  
    }

    const nextId =
      (rel.artifacts?.length ? Math.max(...rel.artifacts.map((a) => a.artifactId)) : 0) + 1;

    const artifact: Artifact = {
      artifactId: nextId,
      releaseId: rel.releaseId,
      fileUrl: "https://example.com/new-artifact.bin",
      hash: "sha256:newhash",
      signature: null,
      size: Math.floor(Math.random() * 10_000_000) + 500_000,
      createdAt: new Date().toISOString(),
    };

    await axios.post(`http://127.0.0.1:8000/api/releases/${rel.releaseId}/artifacts`, artifact);
 
    setReleasesByProduct((prev) => {
      const list = prev[selectedProduct.productId] || [];
      const nextList = list.map((r) =>
        r.releaseId === rel!.releaseId ? { ...r, artifacts: [...(r.artifacts || []), artifact] } : r
      );
      return { ...prev, [selectedProduct.productId]: nextList };
    });
  };

  const removeArtifact = async (artifactId: number) => {
    if (!selectedProduct) return;
 
    const list = releasesByProduct[selectedProduct.productId] || [];
    const rel = list.find((r) => (r.artifacts || []).some((a) => a.artifactId === artifactId));
    if (!rel) return;

    await axios.delete(
      `http://127.0.0.1:8000/api/releases/${rel.releaseId}/artifacts/${artifactId}`
    );

    setReleasesByProduct((prev) => {
      const cur = prev[selectedProduct.productId] || [];
      const next = cur.map((r) =>
        r.releaseId === rel.releaseId
          ? { ...r, artifacts: (r.artifacts || []).filter((a) => a.artifactId !== artifactId) }
          : r
      );
      return { ...prev, [selectedProduct.productId]: next };
    });
  };
 
  const addLog = async () => {
    if (!selectedProduct) return;

    let rel = latestReleaseFor(selectedProduct.productId);
    if (!rel) {
      await addRelease();
      rel = latestReleaseFor(selectedProduct.productId);
      if (!rel) return;
    }

    const nextId =
      (rel.updateLogs?.length ? Math.max(...rel.updateLogs.map((l) => l.updateLogId)) : 0) + 1;

    const log: UpdateLog = {
      updateLogId: nextId,
      productId: selectedProduct.productId,  
      clientId: 999,
      releaseId: rel.releaseId,
      clientLocationId: null,
      installedAt: new Date().toISOString(),
      status: "in_progress",
      client: { clientId: 999, name: "New Client", lastModified: null },
      location: null,
    };

    const saved = await axios.post(
      `http://127.0.0.1:8000/api/releases/${rel.releaseId}/update-logs`,
      log
    );

    setReleasesByProduct((prev) => {
      const list = prev[selectedProduct.productId] || [];
      const next = list.map((r) =>
        r.releaseId === rel!.releaseId
          ? { ...r, updateLogs: [...(r.updateLogs || []), saved.data] }
          : r
      );
      return { ...prev, [selectedProduct.productId]: next };
    });
  };

  const removeLog = async (updateLogId: number) => {
    if (!selectedProduct) return;

    const list = releasesByProduct[selectedProduct.productId] || [];
    const rel = list.find((r) => (r.updateLogs || []).some((l) => l.updateLogId === updateLogId));
    if (!rel) return;

    await axios.delete(
      `http://127.0.0.1:8000/api/releases/${rel.releaseId}/update-logs/${updateLogId}`
    );

    setReleasesByProduct((prev) => {
      const cur = prev[selectedProduct.productId] || [];
      const next = cur.map((r) =>
        r.releaseId === rel.releaseId
          ? { ...r, updateLogs: (r.updateLogs || []).filter((l) => l.updateLogId !== updateLogId) }
          : r
      );
      return { ...prev, [selectedProduct.productId]: next };
    });
  };
 
  const addDep = async () => {
    if (!selectedProduct) return;

    let rel = latestReleaseFor(selectedProduct.productId);
    if (!rel) {
      await addRelease();
      rel = latestReleaseFor(selectedProduct.productId);
      if (!rel) return;
    }

    const nextId =
      (rel.dependencies?.length
        ? Math.max(...rel.dependencies.map((d) => d.releaseDependencyId))
        : 0) + 1;

    const dep: ReleaseDependency = {
      releaseDependencyId: nextId,
      releaseId: rel.releaseId,
      dependsOnReleaseId: 777,
      dependsOn: {
        releaseId: 777,
        productId: selectedProduct.productId,
        version: "3.1.4",
        releaseType: "patch",
        status: "draft",
        releaseDate: new Date().toISOString(),
        notes: "Generated dep",
        product: { productId: selectedProduct.productId, name: selectedProduct.name },
        artifacts: [],
        updateLogs: [],
        dependencies: [],
      },
    };

    const saved = await axios.post(
      `http://127.0.0.1:8000/api/releases/${rel.releaseId}/dependencies`,
      dep
    );

    setReleasesByProduct((prev) => {
      const list = prev[selectedProduct.productId] || [];
      const next = list.map((r) =>
        r.releaseId === rel!.releaseId
          ? { ...r, dependencies: [...(r.dependencies || []), saved.data] }
          : r
      );
      return { ...prev, [selectedProduct.productId]: next };
    });
  };

  const removeDep = async (depId: number) => {
    if (!selectedProduct) return;

    const list = releasesByProduct[selectedProduct.productId] || [];
    const rel = list.find((r) =>
      (r.dependencies || []).some((d) => d.releaseDependencyId === depId)
    );
    if (!rel) return;

    await axios.delete(
      `http://127.0.0.1:8000/api/releases/${rel.releaseId}/dependencies/${depId}`
    );

    setReleasesByProduct((prev) => {
      const cur = prev[selectedProduct.productId] || [];
      const next = cur.map((r) =>
        r.releaseId === rel.releaseId
          ? {
            ...r,
            dependencies: (r.dependencies || []).filter((d) => d.releaseDependencyId !== depId),
          }
          : r
      );
      return { ...prev, [selectedProduct.productId]: next };
    });
  };
 
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
          <h1 className="text-2xl font-bold text-black">Releases</h1>
          <p className="text-gray-600 mt-1">
            Click a product to view details.
          </p>
        </div>
      </div>
 
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-black mb-4">Products</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length ? (
                products.map((p) => (
                  <tr
                    key={p.productId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => openModal(p)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{p.productId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {fmtDateTime(p.lastModified)}

                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan={5}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
 
      {showModal && selectedProduct && editedProduct && (
        <dialog open className="modal">
          <div className="modal-box w-full max-w-5xl bg-white rounded-xl shadow-lg p-6">
             
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-black">
                Product #{selectedProduct.productId} — {selectedProduct.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
                {isEditing && (
                  <button
                    onClick={saveProduct}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-700"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={deleteProduct}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 border border-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
 
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-black border-b pb-2 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div className="flex items-center">
                  <label className="w-40">Product ID:</label>
                  <p className="flex-1 text-black bg-gray-100 font-mono px-3 py-2 border rounded">
                    {selectedProduct.productId}
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="w-40">Name:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editedProduct.name}
                      onChange={onFieldChange}
                      className="flex-1 text-gray-700 px-3 py-2 border rounded"
                    />
                  ) : (
                    <p className="flex-1 text-black bg-gray-100 px-3 py-2 border rounded">
                      {selectedProduct.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
 
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black">
                  Releases {(releasesByProduct[selectedProduct.productId] || []).length
                    ? `(${(releasesByProduct[selectedProduct.productId] || []).length})`
                    : ""}
                </h2>

                <button
                  onClick={addRelease}
                  className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                >
                  + Add Release
                </button>
              </div>

              {(releasesByProduct[selectedProduct.productId] || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Release ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Size
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(releasesByProduct[selectedProduct.productId] || []).map((r) => {
                        const totalSize = (r.artifacts || []).reduce((s, a) => s + (a.size || 0), 0);
                        return (
                          <tr key={r.releaseId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-700">{r.releaseId}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{fmtSize(totalSize)}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteRelease(r.releaseId)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No releases.</p>
              )}
            </div>
 
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black">
                  Artifacts ({artifacts.length})
                </h2>
                <button
                  onClick={addArtifact}
                  className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                >
                  + Add Artifact
                </button>
              </div>
              {artifacts.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File URL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hash</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signature</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {artifacts.map((a) => (
                        <tr key={a.artifactId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{a.artifactId}</td>
                          <td className="px-6 py-4 text-sm">
                            <a className="text-blue-600 underline" href={a.fileUrl} target="_blank" rel="noreferrer">
                              {a.fileUrl}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={a.hash}>
                            {a.hash}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{a.signature || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{fmtSize(a.size)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeArtifact(a.artifactId)}
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
                <p className="text-gray-500 text-center py-4">No artifacts.</p>
              )}
            </div>
 
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black">
                  Update Logs ({logs.length})
                </h2>
                <button
                  onClick={addLog}
                  className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                >
                  + Add Update Log
                </button>
              </div>
              {logs.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installed At</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th> 
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((l) => (
                        <tr key={l.updateLogId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{l.updateLogId}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{l.client?.name || `Client ${l.clientId}`}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{fmtDateTime(l.installedAt)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeForLog(l.status)}`}>
                              {l.status.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeLog(l.updateLogId)}
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
                <p className="text-gray-500 text-center py-4">No update logs.</p>
              )}
            </div>
 
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black">
                  Dependencies ({deps.length})
                </h2>
                <button
                  onClick={addDep}
                  className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
                >
                  + Add Dependency
                </button>
              </div>
              {deps.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Depends On (Release ID)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deps.map((d) => (
                        <tr key={d.releaseDependencyId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{d.releaseDependencyId}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{d.dependsOnReleaseId}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {d.dependsOn?.version || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeForRelType(d.dependsOn?.releaseType || "patch")}`}>
                              {(d.dependsOn?.releaseType || "patch").toString().replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {(d.dependsOn?.status || "draft").toString().toUpperCase()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {fmtDateTime(d.dependsOn?.releaseDate)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeDep(d.releaseDependencyId)}
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
                <p className="text-gray-500 text-center py-4">No dependencies.</p>
              )}
            </div>
          </div>
        </dialog>
      )}
    </motion.div>
  );
}; 

export default ReleasesPage;


import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

const ProductPage: React.FC = () => {
  const storedId = sessionStorage.getItem("selectedProductId");
  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

 
  type ReleaseStatus = "draft" | "approved" | "published";
  type ReleaseType = "major" | "minor" | "service_pack" | "patch";

  interface Artifact {
    artifactId: number;
    releaseId?: number;
    fileUrl: string;
    hash: string;
    signature?: string;
    size: number;
    createdAt: string;
  }

  interface ReleaseDependency {
    releaseDependencyId: number;
    releaseId?: number;
    dependsOnReleaseId: number;
    dependsOn: { version?: string; releaseId?: number; productId?: number };
  }

  interface Release {
    releaseId: number;
    productId: number;
    version: string;
    releaseType: ReleaseType;
    status: ReleaseStatus;
    releaseDate: string;
    lastModified?: string;
    notes?: string;
    artifacts: Artifact[];
    updateLogs: Array<{ updateLogId: number; status: string }>;
    dependencies: ReleaseDependency[];
  }

  type LicenseType = "subscription" | "perpetual";
  type LicenseStatus = "active" | "expired" | "revoked" | "suspended";

  interface License {
    licenseId: number;
    clientId: number;
    productId: number;
    licenseKey: string;
    type: LicenseType;
    startDate: string;
    endDate: string;
    status: LicenseStatus;
    client: { clientId?: number; id?: number; name: string };
  }

  interface Client {
    clientId: number;
    clientName: string;
  }

  interface Product {
    productId: number;
    name: string;
    sku: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    releases: Release[];
    licenses: License[];
    clients: Client[];
    lastModified?: string;
  }

 
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    description: "",
    clients: [] as Client[],
  });
  const [tempClient, setTempClient] = useState<Client>({
    clientId: 0,
    clientName: "",
  });

 
  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "—";

 
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: Product[] = await res.json();
      setProducts(data || []);

      if (data.length > 0) {
        const found =
          storedId && data.find((p) => p.productId === Number(storedId));
        const selected = found || data[0];
        setSelectedProduct(selected);
        setEditedProduct(selected);
      } else {
        setSelectedProduct(null);
        setEditedProduct(null);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
     
  }, []);

 
  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setEditedProduct({ ...p });
    sessionStorage.setItem("selectedProductId", String(p.productId));
    setShowEditModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editedProduct)
      setEditedProduct({ ...editedProduct, [name]: value } as Product);
  };

  const handleSave = async () => {
    if (!editedProduct) return;
    try {
      const url = editedProduct.productId
        ? `${API_BASE}/api/products/${editedProduct.productId}`
        : `${API_BASE}/api/products`;
      const method = editedProduct.productId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProduct),
      });
      if (!res.ok) throw new Error("Failed to save product");

      const result: Product = await res.json();
      if (method === "PUT") {
        setProducts((prev) =>
          prev.map((p) => (p.productId === result.productId ? result : p))
        );
      } else {
        setProducts((prev) => [...prev, result]);
      }

      setSelectedProduct(result);
      setEditedProduct(result);
      setShowEditModal(false);
      alert("✅ Product saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save product.");
    }
  };

  const handleDelete = async (id?: number) => {
    const pid = id ?? selectedProduct?.productId;
    if (!pid) return alert("No product selected");
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/${pid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setProducts((prev) => prev.filter((p) => p.productId !== pid));
      setShowEditModal(false);
      alert("✅ Product deleted.");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete product.");
    }
  };

  const handleNewInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;

    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) throw new Error("Add failed");

      const added: Product = await res.json();
      setProducts((prev) => [...prev, added]);
      setSelectedProduct(added);
      setEditedProduct(added);
      setNewProduct({ name: "", sku: "", description: "", clients: [] });
      setShowModal(false);
      alert("✅ Product added successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add product.");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewProduct({ name: "", sku: "", description: "", clients: [] });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditedProduct(null);
  };

 
  return (
    <motion.div
      className="flex-1 p-8 bg-gray-100 min-h-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
   
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Product Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
        >
          Add Product
        </button>
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-black">All Products</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length ? (
                products.map((p) => (
                  <tr
                    key={p.productId || p.sku}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectProduct(p)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{p.productId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                    <td className="px-2 py-4 text-sm text-gray-900">{p.sku}</td>
                    <td className="px-2 py-4 text-sm text-gray-900">{p.description || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

       
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-neutral/20 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl sm:max-w-lg p-6 relative mx-2">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
            >
              ×
            </button>

            <h3 className="font-bold text-xl text-black mb-4">Add New Product</h3>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleNewInputChange}
                  required
                  className="input input-bordered w-full bg-gray-100 text-black"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={newProduct.sku}
                  onChange={handleNewInputChange}
                  required
                  className="input input-bordered w-full bg-gray-100 text-black"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleNewInputChange}
                  rows={3}
                  className="textarea textarea-bordered w-full bg-gray-100 text-black"
                  placeholder="Enter product description (optional)"
                />
              </div>
 
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manage Clients
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Client ID"
                    className="input input-bordered w-32 bg-gray-100 text-black"
                    value={tempClient.clientId || ""}
                    onChange={(e) =>
                      setTempClient({
                        ...tempClient,
                        clientId: Number(e.target.value),
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Client Name"
                    className="input input-bordered flex-1 bg-gray-100 text-black"
                    value={tempClient.clientName}
                    onChange={(e) =>
                      setTempClient({ ...tempClient, clientName: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="px-3 bg-green-500 text-white rounded"
                    onClick={() => {
                      if (!tempClient.clientId || !tempClient.clientName) return;

                      const isEdit = newProduct.clients.some(
                        (c) => c.clientId === tempClient.clientId
                      );

                      setNewProduct((prev) => ({
                        ...prev,
                        clients: isEdit
                          ? prev.clients.map((c) =>
                            c.clientId === tempClient.clientId ? tempClient : c
                          )
                          : [...prev.clients, tempClient],
                      }));

                      setTempClient({ clientId: 0, clientName: "" });
                    }}
                  >
                    {newProduct.clients.some((c) => c.clientId === tempClient.clientId)
                      ? "Update"
                      : "Add"}
                  </button>
                </div>

                {newProduct.clients.length > 0 && (
                  <ul className="bg-gray-100 p-2 rounded text-black text-sm space-y-1">
                    {newProduct.clients.map((c, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center bg-white p-2 rounded border border-gray-200"
                      >
                        <span>
                          {c.clientId} — {c.clientName}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-sm"
                            onClick={() => setTempClient({ ...c })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:underline text-sm"
                            onClick={() =>
                              setNewProduct((prev) => ({
                                ...prev,
                                clients: prev.clients.filter(
                                  (client) => client.clientId !== c.clientId
                                ),
                              }))
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>


              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#008dcd] text-white rounded hover:bg-[#006fa1]"
                  disabled={!newProduct.name || !newProduct.sku}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-[#666666] text-white rounded-lg hover:bg-[#555]"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {showEditModal && editedProduct && (
        <div className="fixed inset-0 backdrop-blur-sm bg-neutral/20 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl sm:max-w-lg p-6 relative mx-2">
            <button
              onClick={handleCloseEditModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
            >
              ×
            </button>

            <h3 className="font-bold text-xl text-black mb-4">Edit Product</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            > 
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <input
                    type="text"
                    value={editedProduct.productId}
                    readOnly
                    className="input input-bordered w-full bg-gray-200 text-gray-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="w-full bg-gray-100 text-black px-3 py-2 rounded">
                    {formatDate(editedProduct.createdAt ?? editedProduct.updatedAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Modified</label>
                  <p className="w-full bg-gray-100 text-black px-3 py-2 rounded">
                    {formatDate(editedProduct.lastModified ?? editedProduct.updatedAt)}
                  </p>
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editedProduct.name || ""}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={editedProduct.sku || ""}
                    onChange={handleInputChange}
                    required
                    className="input input-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200 uppercase"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editedProduct.description || ""}
                    onChange={handleInputChange}
                    rows={4}
                    className="textarea textarea-bordered w-full bg-gray-100 text-black focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
 
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manage Clients
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Client ID"
                    className="input input-bordered w-32 bg-gray-100 text-black"
                    value={tempClient.clientId || ""}
                    onChange={(e) =>
                      setTempClient({
                        ...tempClient,
                        clientId: Number(e.target.value),
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Client Name"
                    className="input input-bordered flex-1 bg-gray-100 text-black"
                    value={tempClient.clientName}
                    onChange={(e) =>
                      setTempClient({ ...tempClient, clientName: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="px-3 bg-green-500 text-white rounded"
                    onClick={() => {
                      if (!tempClient.clientId || !tempClient.clientName) return;

                      const isEdit = (editedProduct?.clients || []).some(
                        (c) => c.clientId === tempClient.clientId
                      );

                      setEditedProduct((prev: any) => ({
                        ...prev,
                        clients: isEdit
                          ? prev.clients.map((c: Client) =>
                            c.clientId === tempClient.clientId ? tempClient : c
                          )
                          : [...(prev?.clients || []), tempClient],
                      }));

                      setTempClient({ clientId: 0, clientName: "" });
                    }}
                  >
                    {(editedProduct?.clients || []).some(
                      (c) => c.clientId === tempClient.clientId
                    )
                      ? "Update"
                      : "Add"}
                  </button>
                </div>

                {editedProduct.clients?.length > 0 && (
                  <ul className="bg-gray-100 p-2 rounded text-black text-sm space-y-1">
                    {editedProduct.clients.map((c, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center bg-white p-2 rounded border border-gray-200"
                      >
                        <span>
                          {c.clientId} — {c.clientName}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-sm"
                            onClick={() => setTempClient({ ...c })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:underline text-sm"
                            onClick={() =>
                              setEditedProduct((prev: any) => ({
                                ...prev,
                                clients: prev.clients.filter(
                                  (client: Client) => client.clientId !== c.clientId
                                ),
                              }))
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>


              <div className="modal-action justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(editedProduct.productId)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-500"
                >
                  Delete
                </button>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#008dcd] text-white rounded hover:bg-[#006fa1]"
                    disabled={!editedProduct.name || !editedProduct.sku}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductPage;

import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";

const Dashboard = () => {
  // -------------------------
  // Types
  // -------------------------
  type ProductStatus = "Published" | "Draft" | "Released";

  type Product = {
    productId: number;
    name: string;
    sku: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    status: ProductStatus;
    releases: Array<{
      releaseId: number;
      version: string;
      status: string;
      releaseDate: string;
    }>;
    licenses: Array<{
      licenseId: number;
      type: string;
      status: string;
      client: { name: string };
    }>;
  };

  // -------------------------
  // THEME COLORS
  // -------------------------
  const statusColors: Record<ProductStatus, string> = {
    Published: "bg-[#27ae6020] text-[#27ae60]", // success
    Draft: "bg-[#f39c1220] text-[#f39c12]", // warning
    Released: "bg-[#008dcd20] text-[#008dcd]", // primary
  };

  // -------------------------
  // Internal Product Card Component
  // -------------------------
  const ProductCard = (props: {
    productId: number;
    name: string;
    sku: string;
    status: ProductStatus;
    description?: string;
    createdAt: string;
    latestRelease?: string;
    activeLicenses?: number;
    onClick?: () => void;
  }) => {
    return (
      <div
        className="border border-[#e0e0e0] rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer bg-white"
        onClick={props.onClick}
      >
        <h3 className="font-semibold text-lg text-[#333333]">{props.name}</h3>

        <p className="text-sm text-[#666666]">SKU: {props.sku}</p>

        <p className="text-sm text-[#666666] mt-1">
          {props.description || "No description available"}
        </p>

        <p className="text-sm text-[#666666] mt-1">
          Created: {props.createdAt}
        </p>

        <p className="text-sm text-[#666666] mt-1">
          Latest Release: {props.latestRelease}
        </p>

        <p className="text-sm text-[#666666] mt-1">
          Active Licenses: {props.activeLicenses}
        </p>

        <span
          className={`mt-2 inline-block px-3 py-1 rounded-full text-sm ${statusColors[props.status]}`}
        >
          {props.status}
        </span>
      </div>
    );
  };

  // -------------------------
  // Dashboard Logic
  // -------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [recentActivity] = useState<
    Array<{ text: string; time: string; type: "audit" | "update" }>
  >([
    { text: "Service Pack 1 approved for Analytics Pro", time: "2 hours ago", type: "update" },
    { text: "New client added: Example Corp", time: "Yesterday", type: "audit" },
    { text: "Patch v2.1 installed for CRM Suite", time: "3 days ago", type: "update" },
    { text: "Subscription renewed for ANPR System", time: "1 week ago", type: "audit" },
    { text: "License activated for CCTV module", time: "2 weeks ago", type: "audit" },
    { text: "Update installed at New York Office", time: "1 month ago", type: "update" },
  ]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("http://localhost:8000/api/products");
      const data = await res.json();

      setProducts(
        data.map((p: Product) => ({
          ...p,
          releases: Array.isArray(p.releases) ? p.releases : [],
          licenses: Array.isArray(p.licenses) ? p.licenses : [],
        }))
      );
    };

    load();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    description: "",
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    const added = await res.json();
    setProducts([added, ...products]);
    setShowModal(false);
    setNewProduct({ name: "", sku: "", description: "" });
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <motion.div
      className="flex-1 p-8 bg-white min-h-screen text-[#333333]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">
            Dashboard
          </h1>

          <p className="text-[#666666] mt-1">
            Overview of products and licenses. Total Products:{" "}
            {products.length}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search products or SKUs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-[#e0e0e0] px-3 py-2 rounded-lg text-[#333333] focus:ring-2 focus:ring-[#33a7e0]"
          />

          <button
            className="px-4 py-2 bg-[#666666] text-white rounded-lg hover:bg-[#555]"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </button>

          {/* <button
            className="px-4 py-2 bg-[#008dcd] text-white rounded-lg hover:bg-[#006fa1]"
            onClick={() => setShowModal(true)}
          >
            + Add Product
          </button> */}
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {filteredProducts.map((p) => (
          <ProductCard
            key={p.productId}
            productId={p.productId}
            name={p.name}
            sku={p.sku}
            status={p.status}
            description={p.description}
            createdAt={formatDate(p.createdAt)}
            latestRelease={p.releases?.[0]?.version || "N/A"}
            activeLicenses={
              p.licenses.filter((l) => l.status === "active").length
            }
            onClick={() => {
              sessionStorage.setItem(
                "selectedProductId",
                p.productId.toString()
              );
              window.location.href = "/products";
            }}
          />
        ))}

        {searchTerm && filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-8 text-[#666666]">
            No products found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* ✅ RECENT ACTIVITY + QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white shadow text-[#333333]">
          <h2 className="font-semibold mb-3 text-lg border-b border-[#e0e0e0] pb-2">
            Recent Activity
          </h2>

          <ul className="text-sm space-y-3">
            {recentActivity.slice(0, 6).map((a, i) => (
              <li
                key={i}
                className="flex justify-between items-center p-3 bg-[#f5f5f5] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      a.type === "audit" ? "bg-[#008dcd]" : "bg-[#27ae60]"
                    }`}
                  ></span>

                  <span className="text-[#666666]">{a.text}</span>
                </div>

                <span className="text-[#999999]">{a.time}</span>
              </li>
            ))}
          </ul>

          {recentActivity.length > 6 && (
            <button className="mt-4 text-[#008dcd] hover:underline text-sm">
              View All Activity
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="p-6 rounded-lg bg-white shadow text-[#333333] space-y-4">
          <h2 className="font-semibold mb-3 text-lg border-b border-[#e0e0e0] pb-2">
            Quick Stats
          </h2>

          <div className="space-y-2 text-[#666666]">
            <div className="flex justify-between">
              <span>Total Releases:</span>
              <span className="font-semibold text-[#333333]">
                {products.reduce((acc, p) => acc + p.releases.length, 0)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Total Clients:</span>
              <span className="font-semibold text-[#333333]">
                {
                  [...new Set(products.flatMap((p) =>
                    p.licenses.map((l) => l.client.name)
                  ))].length
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span>Active Update Logs:</span>
              <span className="font-semibold text-[#333333]">12</span>
            </div>

            <div className="flex justify-between">
              <span>Pending Notifications:</span>
              <span className="font-semibold text-[#333333]">5</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showModal && (
        <dialog open className="modal">
          <div className="modal-box bg-white p-6 rounded-xl shadow-lg max-w-lg">
            <h3 className="text-xl font-bold text-[#333333] mb-4">
              Add New Product
            </h3>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                className="w-full border border-[#e0e0e0] px-3 py-2 rounded bg-gray-100"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="SKU"
                className="w-full border border-[#e0e0e0] px-3 py-2 rounded bg-gray-100"
                value={newProduct.sku}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sku: e.target.value })
                }
                required
              />

              <textarea
                placeholder="Description"
                className="w-full border border-[#e0e0e0] px-3 py-2 rounded bg-gray-100"
                rows={3}
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
              />

              <div className="modal-action">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#008dcd] text-white rounded hover:bg-[#006fa1]"
                >
                  Save
                </button>

                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-[#333333] rounded"
                  onClick={() => setShowModal(false)}
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

export default Dashboard;



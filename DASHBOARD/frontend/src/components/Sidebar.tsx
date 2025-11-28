import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#008dcd] text-white flex flex-col p-6 min-h-screen rounded-r-2xl shadow-lg">

      {/* PROFILE / LOGO */}
      <div className="flex items-center gap-3 mb-10">

        <div className="w-20 h-20 rounded-full bg-[#006fa1] flex items-center justify-center text-2xl font-bold">
          PT
        </div>

        <div>
          <h2 className="text-xl font-bold text-white"></h2>
          <p className="text-md text-[#cfefff]">Product Portal</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-3 text-lg">
        <Link
          to="/"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          🏠 Dashboard
        </Link>

        <Link
          to="/products"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          📦 Products
        </Link>

        <Link
          to="/releases"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          🚀 Releases
        </Link>

        <Link
          to="/clients"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          👥 Clients
        </Link>

        <Link
          to="/updates"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          🔄 Updates
        </Link>

        <Link
          to="/licenses"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          🔑 Licenses
        </Link>

        <Link
          to="/settings"
          className="px-3 py-2 rounded hover:bg-[#006fa1] transition"
        >
          ⚙ Settings
        </Link>
      </nav>

      {/* FOOTER */}
      <p className="mt-auto text-sm text-[#cfefff]">
        Signed in as <br />
        <span className="font-semibold text-white">
          admin@company.co.in
        </span>
      </p>
    </div>
  );
};

export default Sidebar;

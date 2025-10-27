import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ADD THIS IMPORT
import "../assets/scss/_sidebar.scss";
import {
  FaHome,
  FaCalendarAlt,
  FaBook,
  FaUser,
  FaGlobeAsia,
  FaBrain,
  FaUsers,
  FaLandmark,
  FaEllipsisH,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCandyCane,
} from "react-icons/fa";
import { useAuth } from "../context/GoogleAuthProvider";

export default function Sidebar() {
  const { user, logout } = useAuth();  // ✅ Get the signed-in user's data
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // ✅ Derive username from Supabase user or Gmail name
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Aspirant";
  const toggleSidebar = () => setCollapsed(!collapsed);
  const handleMenuClick = (menu) =>
    setOpenMenu(openMenu === menu ? null : menu);
  const handleSubmenuClick = (submenu) =>
    setOpenSubmenu(openSubmenu === submenu ? null : submenu);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // ADD THIS FUNCTION
  const handleNavigation = (id) => {
    const routes = {
      profile: "/dashboard/upsc-profile",
      planner: "/dashboard/planner",
      others: "/dashboard/others",
      // Add more routes as needed
    };
    if (routes[id]) {
      navigate(routes[id]);
    }
  };

  const getIconForTitle = (title) => {
    const t = title.toLowerCase();
    if (t.includes("profile")) return <FaUser />;
    if (t.includes("people")) return <FaUsers />;
    if (t.includes("philosopher") || t.includes("scientist")) return <FaBrain />;
    if (t.includes("ruler") || t.includes("landmark")) return <FaLandmark />;
    if (t.includes("region") || t.includes("world") || t.includes("india")) return <FaGlobeAsia />;
    if (t.includes("planner") || t.includes("calendar")) return <FaCalendarAlt />;
    if (t.includes("book") || t.includes("study") || t.includes("syllabus")) return <FaBook />;
    if (t.includes("home")) return <FaHome />;
    return <FaEllipsisH />;
  };

  const menuStructure = [
    { id: "profile", title: "UPSC Profile" },
    { id: "planner", title: "Study Planner" },
    {
      id: "region",
      title: "Region",
      children: [
        {
          id: "region_india",
          title: "India",
          children: [
            { id: "region_india_facts", title: "Facts & Figures" },
            { id: "region_india_geography", title: "Geography (Google Earth Viewer)" },
            { id: "region_india_history", title: "History" },
            { id: "region_india_polity", title: "Polity" },
          ],
        },
        {
          id: "region_kolkata",
          title: "Kolkata",
          children: [
            { id: "region_kolkata_facts", title: "Facts & Figures" },
            { id: "region_kolkata_geography", title: "Geography (Google Earth Viewer)" },
            { id: "region_kolkata_history", title: "History" },
            { id: "region_kolkata_polity", title: "Polity" },
          ],
        },
        {
          id: "region_wb",
          title: "West Bengal",
          children: [
            { id: "region_wb_facts", title: "Facts & Figures" },
            { id: "region_wb_geography", title: "Geography (Google Earth Viewer)" },
            { id: "region_wb_history", title: "History" },
            { id: "region_wb_polity", title: "Polity" },
          ],
        },
        {
          id: "region_world",
          title: "World",
          children: [
            { id: "region_world_facts", title: "Facts & Figures" },
            { id: "region_world_geography", title: "Geography (Google Earth Viewer)" },
            { id: "region_world_history", title: "History" },
            { id: "region_world_polity", title: "Polity" },
          ],
        },
      ],
    },
    {
      id: "religion",
      title: "Religion History",
      children: [
        {
          id: "religion_hindu",
          title: "Hindu",
          children: [{ id: "religion_hindu_facts", title: "Facts & Figures" }],
        },
        {
          id: "religion_nonhindu",
          title: "Non-Hindu",
          children: [{ id: "religion_nonhindu_facts", title: "Facts & Figures" }],
        },
      ],
    },
    {
      id: "people",
      title: "People",
      children: [
        {
          id: "people_ancient",
          title: "Ancient People",
          children: [
            { id: "people_ancient_philosophers", title: "Philosophers" },
            { id: "people_ancient_rulers", title: "Rulers" },
            { id: "people_ancient_scientists", title: "Scientists" },
          ],
        },
        {
          id: "people_medieval",
          title: "Medieval People",
          children: [
            { id: "people_medieval_philosophers", title: "Philosophers" },
            { id: "people_medieval_rulers", title: "Rulers" },
            { id: "people_medieval_scientists", title: "Scientists" },
          ],
        },
        {
          id: "people_current",
          title: "Current Era People",
          children: [
            { id: "people_current_philosophers", title: "Philosophers" },
            { id: "people_current_rulers", title: "Rulers" },
            { id: "people_current_scientists", title: "Scientists" },
          ],
        },
      ],
    },
    { id: "others", title: "Others / Upcoming Updates" },
  ];

  return (
    <>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      <nav className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="logo-area user-greeting">
          <div className="welcome-text">
            <FaCandyCane className="candy-icon" />
            <h4>Welcome, {userName}!</h4>
          </div>
          <small className="text-muted">Be ready for UPSC 💪</small>
        </div>

        <div className="menu">
          {menuStructure.map((menu) => (
            <div key={menu.id}>
              <div
                className={`sidebar-link ${openMenu === menu.id ? "active" : ""}`}
                onClick={() => {
                  if (menu.children) handleMenuClick(menu.id);
                  else handleNavigation(menu.id); // CHANGED THIS LINE
                }}
              >
                {getIconForTitle(menu.title)}
                <span>{menu.title}</span>
                {menu.children && <FaChevronDown className="chevron" />}
              </div>

              {openMenu === menu.id && menu.children && (
                <div className="submenu">
                  {menu.children.map((sub) => (
                    <div key={sub.id}>
                      <div
                        className={`sidebar-link ${openSubmenu === sub.id ? "active" : ""}`}
                        onClick={() => {
                          if (sub.children) handleSubmenuClick(sub.id);
                          else handleNavigation(sub.id); // CHANGED THIS LINE
                        }}
                      >
                        {getIconForTitle(sub.title)}
                        <span>{sub.title}</span>
                        {sub.children && <FaChevronDown className="chevron" />}
                      </div>

                      {openSubmenu === sub.id && sub.children && (
                        <div className="subsubmenu">
                          {sub.children.map((child) => (
                            <div
                              key={child.id}
                              className="sidebar-link"
                              onClick={() => handleNavigation(child.id)} // CHANGED THIS LINE
                            >
                              {getIconForTitle(child.title)}
                              <span>{child.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="profile-section">
          <img src="https://i.pravatar.cc/60?img=15" alt="Profile" />
          <div className="profile-info">
            <h6>{userName}</h6>
            <small>Admin</small>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}

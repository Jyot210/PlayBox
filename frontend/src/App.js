import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import AdminDeshboard from "./pages/AdminDeshboard";
import Deshboard from "./components/Deshboard";

import MenuPage from "./pages/MenuPage";

import Formpage from "./pages/Formpage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* <Route path="/admin-deshboard" element={<AdminDeshboard />} /> */}
        <Route path="/form" element={<Formpage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/movies" element={<AdminDeshboard />} />
        <Route path="/dashboard" element={< Deshboard/>} />
      </Routes>

      <div className="App">{/* < /> */}</div>
    </>
  );
}

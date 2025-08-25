import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentWorkspace from "./pages/StudentWorkspace";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teacher/:sessionId" element={<TeacherDashboard />} />
          <Route path="/student/:sessionId" element={<StudentWorkspace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Code, ArrowRight } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateSession = async () => {
    if (!name.trim()) {
      toast.error("Podaj swoje imię");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/create-session`, {
        teacherName: name,
      });

      const { sessionId, teacherId } = response.data;

      // Zapisz dane w localStorage
      localStorage.setItem("teacherId", teacherId);
      localStorage.setItem("teacherName", name);
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("role", "teacher");

      toast.success(`Sesja utworzona! Kod: ${sessionId}`);
      navigate(`/teacher/${sessionId}`);
    } catch (error) {
      toast.error("Błąd podczas tworzenia sesji");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!name.trim() || !sessionCode.trim()) {
      toast.error("Wypełnij wszystkie pola");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/join-session`, {
        sessionId: sessionCode.toUpperCase(),
        studentName: name,
      });

      const { sessionId, studentId, codeTemplate } = response.data;

      // Zapisz dane w localStorage
      localStorage.setItem("studentId", studentId);
      localStorage.setItem("studentName", name);
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("role", "student");
      localStorage.setItem("codeTemplate", codeTemplate);

      toast.success("Dołączono do sesji!");
      navigate(`/student/${sessionId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("Sesja o podanym kodzie nie istnieje");
      } else {
        toast.error("Błąd podczas dołączania do sesji");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Code className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Code Share - Nauka HTML
          </h1>
          <p className="text-gray-600">Współdziel kod w czasie rzeczywistym</p>
        </div>

        {!mode ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => setMode("teacher")}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <GraduationCap className="w-20 h-20 text-indigo-600 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  Jestem Nauczycielem
                </h2>
                <p className="text-gray-600">
                  Stwórz nową sesję zajęciową i zaproś uczniów
                </p>
              </div>
            </div>

            <div
              onClick={() => setMode("student")}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <Users className="w-20 h-20 text-green-600 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Jestem Uczniem</h2>
                <p className="text-gray-600">
                  Dołącz do istniejącej sesji używając kodu
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <button
              onClick={() => setMode(null)}
              className="text-gray-500 hover:text-gray-700 mb-4"
            >
              ← Powrót
            </button>

            {mode === "teacher" ? (
              <>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <GraduationCap className="w-8 h-8 text-indigo-600 mr-2" />
                  Utwórz Sesję
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twoje imię
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="np. Jan Kowalski"
                    />
                  </div>
                  <button
                    onClick={handleCreateSession}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      "Tworzenie..."
                    ) : (
                      <>
                        Utwórz Sesję
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Users className="w-8 h-8 text-green-600 mr-2" />
                  Dołącz do Sesji
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twoje imię
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="np. Anna Nowak"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kod sesji
                    </label>
                    <input
                      type="text"
                      value={sessionCode}
                      onChange={(e) =>
                        setSessionCode(e.target.value.toUpperCase())
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-lg"
                      placeholder="np. ABC123"
                      maxLength="6"
                    />
                  </div>
                  <button
                    onClick={handleJoinSession}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      "Dołączanie..."
                    ) : (
                      <>
                        Dołącz do Sesji
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;

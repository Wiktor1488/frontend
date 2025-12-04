import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import {
  Code,
  Eye,
  MessageSquare,
  Save,
  LogOut,
  BookOpen,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import TaskPanel from "./TaskPanel";
import Leaderboard from "./Leaderboard";

function StudentWorkspace() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [hints, setHints] = useState([]);
  const [connected, setConnected] = useState(false);
  const [showSidebar, setShowSidebar] = useState("tasks"); // 'tasks', 'ranking', 'hints'
  const [selectedTask, setSelectedTask] = useState(null);
  const [studentPoints, setStudentPoints] = useState(0);
  const [refreshRanking, setRefreshRanking] = useState(0);

  const socketRef = useRef(null);
  const codeUpdateTimeoutRef = useRef(null);

  useEffect(() => {
    // Pobierz dane z localStorage
    const studentId = localStorage.getItem("studentId");
    const studentName = localStorage.getItem("studentName");
    const codeTemplate = localStorage.getItem("codeTemplate");

    if (!studentId || !studentName) {
      toast.error("Brak danych sesji. Wróć do strony głównej.");
      navigate("/");
      return;
    }

    // Ustaw początkowy kod
    setCode(codeTemplate || "");

    // Połącz z serwerem WebSocket
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Połączono z serwerem");
      setConnected(true);

      // Dołącz do sesji
      socketRef.current.emit("join-session", {
        sessionId,
        userId: studentId,
        userName: studentName,
        role: "student",
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Rozłączono z serwerem");
      setConnected(false);
      toast.error("Utracono połączenie z serwerem");
    });

    // Dane początkowe (z punktami)
    socketRef.current.on("initial-data", (data) => {
      if (data.codeTemplate) {
        setCode(data.codeTemplate);
      }
      if (data.points !== undefined) {
        setStudentPoints(data.points);
      }
      if (data.currentTaskId) {
        // Można automatycznie załadować bieżące zadanie
      }
    });

    socketRef.current.on("template-updated", (template) => {
      setCode(template);
      toast("Nauczyciel zaktualizował szablon", {
        icon: "📝",
      });
    });

    socketRef.current.on("receive-hint", ({ hint }) => {
      setHints((prev) => [{ text: hint, timestamp: new Date() }, ...prev]);
      toast.success("Otrzymałeś nową podpowiedź!");
    });

    // Przypisanie zadania przez nauczyciela
    socketRef.current.on("task-assigned", ({ task }) => {
      setSelectedTask(task);
      setCode(task.starter_code || "");
      toast(`Nauczyciel przypisał zadanie: ${task.title}`, {
        icon: "📚",
        duration: 5000,
      });
      setShowSidebar("tasks");
    });

    // Aktualizacja punktów
    socketRef.current.on(
      "points-update",
      ({ studentId: updatedStudentId, points, taskCompleted }) => {
        const myStudentId = localStorage.getItem("studentId");
        if (updatedStudentId === myStudentId) {
          setStudentPoints(points);
          if (taskCompleted) {
            toast.success(`Gratulacje! Ukończyłeś zadanie: ${taskCompleted}`, {
              icon: "🎉",
              duration: 5000,
            });
          }
        }
        // Odśwież ranking
        setRefreshRanking((prev) => prev + 1);
      }
    );

    socketRef.current.on("error", ({ message }) => {
      toast.error(message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }
    };
  }, [sessionId, navigate]);

  const handleCodeChange = (value) => {
    setCode(value);

    // Debouncing - wyślij aktualizację po 500ms bezczynności
    if (codeUpdateTimeoutRef.current) {
      clearTimeout(codeUpdateTimeoutRef.current);
    }

    codeUpdateTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && connected) {
        const studentId = localStorage.getItem("studentId");
        socketRef.current.emit("code-update", {
          sessionId,
          userId: studentId,
          code: value,
        });
      }
    }, 500);
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setCode(task.starter_code || "");
  };

  const handleLeaveSession = () => {
    if (window.confirm("Czy na pewno chcesz opuścić sesję?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  const handleSaveCode = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "moja-strona.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kod został zapisany!");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Code className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold">Workspace Ucznia</h1>
            <span className="text-sm text-gray-500">Sesja: {sessionId}</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {connected ? "● Połączono" : "● Rozłączono"}
            </span>
            <div className="flex items-center bg-yellow-100 px-3 py-1 rounded">
              <Trophy className="w-4 h-4 text-yellow-600 mr-1" />
              <span className="font-bold text-yellow-700">
                {studentPoints} pkt
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveCode}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              Zapisz
            </button>
            <button
              onClick={handleLeaveSession}
              className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Opuść
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - używamy grid zamiast flex */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "384px 1fr 1fr",
          overflow: "hidden",
        }}
      >
        {/* Sidebar z zadaniami/rankingiem/hintami */}
        {/* DODANO: h-full i overflow-hidden aby naprawić przewijanie w Gridzie */}
        <div className="border-r bg-white flex flex-col h-full overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setShowSidebar("tasks")}
              className={`flex-1 px-4 py-2 flex items-center justify-center ${
                showSidebar === "tasks"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Zadania
            </button>
            <button
              onClick={() => setShowSidebar("ranking")}
              className={`flex-1 px-4 py-2 flex items-center justify-center ${
                showSidebar === "ranking"
                  ? "bg-yellow-50 text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Ranking
            </button>
            <button
              onClick={() => setShowSidebar("hints")}
              className={`flex-1 px-4 py-2 flex items-center justify-center relative ${
                showSidebar === "hints"
                  ? "bg-green-50 text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Hinty
              {hints.length > 0 && (
                <span className="absolute top-1 right-4 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {hints.length}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showSidebar === "tasks" && (
              <TaskPanel
                studentId={localStorage.getItem("studentId")}
                currentCode={code}
                onTaskSelect={handleTaskSelect}
                isTeacher={false}
              />
            )}

            {showSidebar === "ranking" && (
              <Leaderboard
                sessionId={sessionId}
                currentStudentId={localStorage.getItem("studentId")}
                onRefresh={refreshRanking}
              />
            )}

            {showSidebar === "hints" && (
              <div className="p-4 overflow-y-auto h-full">
                {hints.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center mt-8">
                    Brak podpowiedzi
                  </p>
                ) : (
                  <div className="space-y-3">
                    {hints.map((hint, index) => (
                      <div
                        key={index}
                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-3"
                      >
                        <p className="text-sm text-gray-800">{hint.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(hint.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex flex-col">
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <Code className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Edytor HTML</span>
            </div>
            {selectedTask && (
              <div className="flex items-center text-sm">
                <span className="text-gray-400 mr-2">Zadanie:</span>
                <span className="text-yellow-400 font-medium">
                  {selectedTask.title}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col border-l">
          <div className="bg-white px-4 py-2 flex items-center border-b">
            <Eye className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Podgląd</span>
          </div>
          <div className="flex-1 bg-white overflow-hidden">
            <iframe
              title="preview"
              className="w-full h-full border-0"
              sandbox=""
              srcdoc={code}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentWorkspace;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import {
  GraduationCap,
  Users,
  Code,
  Eye,
  Send,
  Copy,
  AlertCircle,
  UserCheck,
  MessageSquare,
  BookOpen,
  FileText,
  LogOut,
  Trophy,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import TaskPanel from "./TaskPanel";
import Leaderboard from "./Leaderboard";

function TeacherDashboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentCodes, setStudentCodes] = useState({});
  const [template, setTemplate] = useState("");
  const [hintText, setHintText] = useState("");
  const [connected, setConnected] = useState(false);
  const [activeView, setActiveView] = useState("students"); // 'students', 'tasks', 'ranking'
  const [selectedTask, setSelectedTask] = useState(null);
  const [refreshRanking, setRefreshRanking] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    // Pobierz dane z localStorage
    const teacherId = localStorage.getItem("teacherId");
    const teacherName = localStorage.getItem("teacherName");

    if (!teacherId || !teacherName) {
      toast.error("Brak danych sesji. Wróć do strony głównej.");
      navigate("/");
      return;
    }

    // Ustaw domyślny szablon
    const defaultTemplate = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moja strona</title>
</head>
<body>
    <h1>Witaj świecie!</h1>
    
</body>
</html>`;
    setTemplate(defaultTemplate);

    // Połącz z serwerem WebSocket
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Połączono z serwerem");
      setConnected(true);

      // Dołącz do sesji jako nauczyciel
      socketRef.current.emit("join-session", {
        sessionId,
        userId: teacherId,
        userName: teacherName,
        role: "teacher",
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Rozłączono z serwerem");
      setConnected(false);
      toast.error("Utracono połączenie z serwerem");
    });

    socketRef.current.on("students-list", (studentsList) => {
      setStudents(studentsList);
      // Pobierz kod każdego ucznia
      studentsList.forEach((student) => {
        socketRef.current.emit("get-student-code", {
          sessionId,
          studentId: student.id,
        });
      });
    });

    socketRef.current.on(
      "student-joined",
      ({ studentId, studentName, points }) => {
        setStudents((prev) => [
          ...prev,
          {
            id: studentId,
            name: studentName,
            points: points || 0,
          },
        ]);
        toast.success(`${studentName} dołączył do sesji`);
      }
    );

    socketRef.current.on("student-left", ({ studentId, studentName }) => {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setStudentCodes((prev) => {
        const newCodes = { ...prev };
        delete newCodes[studentId];
        return newCodes;
      });
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
      toast(`${studentName} opuścił sesję`, {
        icon: "👋",
      });
    });

    socketRef.current.on("student-code-update", ({ studentId, code }) => {
      setStudentCodes((prev) => ({
        ...prev,
        [studentId]: code,
      }));
    });

    socketRef.current.on("student-code", ({ studentId, code, points }) => {
      setStudentCodes((prev) => ({
        ...prev,
        [studentId]: code,
      }));
      // Aktualizuj punkty ucznia
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, points: points || s.points } : s
        )
      );
    });

    // Aktualizacja punktów
    socketRef.current.on(
      "points-update",
      ({ studentId, points, taskCompleted }) => {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, points } : s))
        );

        const student = students.find((s) => s.id === studentId);
        if (student && taskCompleted) {
          toast.success(`${student.name} ukończył zadanie: ${taskCompleted}`, {
            icon: "🎉",
          });
        }

        // Odśwież ranking
        setRefreshRanking((prev) => prev + 1);
      }
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, navigate]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);

    // Pobierz kod ucznia jeśli nie mamy go w cache
    if (socketRef.current && connected && !studentCodes[student.id]) {
      socketRef.current.emit("get-student-code", {
        sessionId,
        studentId: student.id,
      });
    }
  };

  const handleSendHint = () => {
    if (!selectedStudent) {
      toast.error("Wybierz ucznia");
      return;
    }

    if (!hintText.trim()) {
      toast.error("Wpisz treść podpowiedzi");
      return;
    }

    if (socketRef.current && connected) {
      socketRef.current.emit("send-hint", {
        sessionId,
        studentId: selectedStudent.id,
        hint: hintText,
      });
      toast.success(`Wysłano podpowiedź do ${selectedStudent.name}`);
      setHintText("");
    }
  };

  const handleUpdateTemplate = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit("update-template", {
        sessionId,
        template,
      });
      toast.success("Szablon został zaktualizowany dla wszystkich uczniów");
    }
  };

  const handleAssignTask = (task) => {
    if (!task) return;

    setSelectedTask(task);

    if (socketRef.current && connected) {
      socketRef.current.emit("set-task", {
        sessionId,
        taskId: task.id,
      });
      toast.success(`Przypisano zadanie: ${task.title}`, {
        icon: "📚",
      });
    }
  };

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success("Kod sesji skopiowany!");
  };

  const handleEndSession = () => {
    if (
      window.confirm(
        "Czy na pewno chcesz zakończyć sesję? Wszyscy uczniowie zostaną rozłączeni."
      )
    ) {
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold">Panel Nauczyciela</h1>
            <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded">
              <span className="text-sm text-gray-600">Kod sesji:</span>
              <span className="font-mono font-bold text-indigo-600">
                {sessionId}
              </span>
              <button
                onClick={copySessionCode}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <span
              className={`text-sm px-2 py-1 rounded ${
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {connected ? "● Połączono" : "● Rozłączono"}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Zakończ sesję
          </button>
        </div>
      </div>

      {/* Main Content with Grid Layout */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "320px 1fr 320px", // Sidebar (320px/w-80) | Middle (auto) | Template (320px/w-80)
          overflow: "hidden",
        }}
      >
        {/* Left Sidebar */}
        <div className="border-r bg-white flex flex-col h-full overflow-hidden">
          {/* View Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveView("students")}
              className={`flex-1 px-3 py-2 flex items-center justify-center ${
                activeView === "students"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users className="w-4 h-4 mr-1" />
              Uczniowie
            </button>
            <button
              onClick={() => setActiveView("tasks")}
              className={`flex-1 px-3 py-2 flex items-center justify-center ${
                activeView === "tasks"
                  ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Zadania
            </button>
            <button
              onClick={() => setActiveView("ranking")}
              className={`flex-1 px-3 py-2 flex items-center justify-center ${
                activeView === "ranking"
                  ? "bg-yellow-50 text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Trophy className="w-4 h-4 mr-1" />
              Ranking
            </button>
          </div>

          {/* Content based on active view */}
          <div className="flex-1 overflow-hidden">
            {activeView === "students" && (
              <div className="flex-1 overflow-y-auto h-full">
                {students.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Oczekiwanie na uczniów...</p>
                    <p className="text-xs mt-2">Podziel się kodem sesji:</p>
                    <p className="font-mono font-bold text-indigo-600 mt-1">
                      {sessionId}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={`w-full text-left px-3 py-2 rounded mb-1 flex items-center justify-between ${
                          selectedStudent?.id === student.id
                            ? "bg-indigo-100 text-indigo-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center">
                          <UserCheck className="w-4 h-4 mr-2" />
                          <span className="text-sm">{student.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-xs font-bold">
                            {student.points || 0}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeView === "tasks" && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <TaskPanel isTeacher={true} onTaskSelect={handleAssignTask} />
                </div>
                {selectedTask && (
                  <div className="border-t p-3 bg-green-50 shrink-0">
                    <p className="text-sm text-green-800">
                      <Target className="inline w-4 h-4 mr-1" />
                      Aktywne: <strong>{selectedTask.title}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeView === "ranking" && (
              <Leaderboard sessionId={sessionId} onRefresh={refreshRanking} />
            )}
          </div>
        </div>

        {/* Middle Content (Code & Preview) */}
        <div className="flex flex-col h-full overflow-hidden">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-600 mb-2">
                  Wybierz ucznia z listy
                </h2>
                <p className="text-gray-500">
                  Możesz podglądać kod ucznia i wysyłać podpowiedzi
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Student Code Viewer & Preview Split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Code Editor */}
                <div className="flex-1 flex flex-col">
                  <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Kod ucznia: {selectedStudent.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-bold text-yellow-400">
                        {selectedStudent.points || 0} pkt
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      defaultLanguage="html"
                      value={studentCodes[selectedStudent?.id] || ""}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="flex-1 flex flex-col border-l">
                  <div className="bg-white px-4 py-2 flex items-center border-b shrink-0">
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Podgląd</span>
                  </div>
                  <div className="flex-1 bg-white overflow-hidden">
                    <iframe
                      title="preview"
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                      srcdoc={studentCodes[selectedStudent?.id] || ""}
                    />
                  </div>
                </div>
              </div>

              {/* Hint Input */}
              <div className="bg-white border-t p-4 shrink-0">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={hintText}
                    onChange={(e) => setHintText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendHint()}
                    placeholder={`Wyślij podpowiedź do ${selectedStudent.name}...`}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendHint}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Wyślij
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar (Template Editor) */}
        <div className="border-l bg-white flex flex-col h-full overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center shrink-0">
            <FileText className="w-4 h-4 mr-2" />
            <span className="font-medium">Szablon kodu</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={template}
              onChange={setTemplate}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
          <div className="p-3 border-t shrink-0">
            <button
              onClick={handleUpdateTemplate}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Zaktualizuj szablon dla wszystkich
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;

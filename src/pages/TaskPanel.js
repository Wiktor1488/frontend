import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Target,
  AlertCircle,
  ChevronRight,
  Star,
  Zap,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

function TaskPanel({
  studentId,
  currentCode,
  onTaskSelect,
  isTeacher = false,
}) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});
  const [showHints, setShowHints] = useState(false);

  // Funkcje owinięte w useCallback (Poprawka ESLint)
  const loadTasks = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Błąd ładowania zadań:", error);
      toast.error("Błąd ładowania zadań");
    }
  }, [setTasks]);

  const loadProgress = useCallback(async () => {
    if (!studentId) return;

    try {
      const response = await axios.get(
        `${API_URL}/student/${studentId}/progress`
      );
      const progressMap = {};
      response.data.forEach((item) => {
        progressMap[item.task_id] = item;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error("Błąd ładowania postępów:", error);
    }
  }, [studentId, setProgress]);

  // useEffect z pełną tablicą zależności
  useEffect(() => {
    loadTasks();
    if (studentId && !isTeacher) {
      loadProgress();
    }
  }, [studentId, isTeacher, loadTasks, loadProgress]);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setValidationResult(null);
    setShowHints(false);

    if (onTaskSelect) {
      onTaskSelect(task);
    }
  };

  const handleValidate = useCallback(async () => {
    if (!selectedTask || !currentCode) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/validate-task`, {
        taskId: selectedTask.id,
        code: currentCode,
        studentId: studentId,
      });

      setValidationResult(response.data);

      if (response.data.passed) {
        toast.success(
          `🎉 Brawo! Zadanie zaliczone! +${selectedTask.points} pkt`
        );
        loadProgress(); // Odśwież postępy
      } else {
        const passedCount = response.data.results.filter(
          (r) => r.passed
        ).length;
        const totalCount = response.data.results.length;
        toast.error(`Zaliczono ${passedCount}/${totalCount} testów`);
      }
    } catch (error) {
      console.error("Błąd walidacji:", error);
      toast.error("Błąd podczas sprawdzania zadania");
    } finally {
      setLoading(false);
    }
  }, [
    selectedTask,
    currentCode,
    studentId,
    loadProgress,
    setLoading,
    setValidationResult,
  ]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return <Star className="w-4 h-4" />;
      case "medium":
        return <Zap className="w-4 h-4" />;
      case "hard":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTaskStatus = (taskId) => {
    const p = progress[taskId];
    if (!p) return "not_started";
    return p.status;
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.difficulty]) acc[task.difficulty] = [];
    acc[task.difficulty].push(task);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Jeśli nie ma wybranego zadania, pokaż listę */}
      {!selectedTask ? (
        // Ustawia h-full, aby wypełnić wysokość rodzica (flex-1)
        <div className="h-full flex flex-col">
          {/* Header listy zadań */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
              <span className="font-semibold">Zadania</span>
            </div>
            {!isTeacher && (
              <div className="flex items-center text-sm text-gray-600">
                <Award className="w-4 h-4 mr-1" />
                <span>
                  {
                    Object.values(progress).filter(
                      (p) => p.status === "completed"
                    ).length
                  }
                  /{tasks.length}
                </span>
              </div>
            )}
          </div>

          {/* Lista zadań - to jest element, który musi się przewijać */}
          <div className="flex-1 overflow-y-auto p-2">
            {["easy", "medium", "hard"].map(
              (difficulty) =>
                groupedTasks[difficulty] && (
                  <div key={difficulty} className="mb-4">
                    <div className="flex items-center px-2 py-1 mb-2">
                      {getDifficultyIcon(difficulty)}
                      <span className="ml-2 text-xs font-semibold text-gray-600 uppercase">
                        {difficulty === "easy"
                          ? "Łatwe"
                          : difficulty === "medium"
                          ? "Średnie"
                          : "Trudne"}
                      </span>
                    </div>

                    {groupedTasks[difficulty].map((task) => {
                      const status = getTaskStatus(task.id);
                      const isCompleted = status === "completed";

                      return (
                        <button
                          key={task.id}
                          onClick={() => handleTaskSelect(task)}
                          className={`w-full text-left p-3 mb-2 rounded-lg border transition-all hover:bg-gray-50 border-gray-200`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                {!isTeacher && (
                                  <>
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    ) : status === "in_progress" ? (
                                      <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                                    ) : (
                                      <Target className="w-4 h-4 text-gray-400 mr-2" />
                                    )}
                                  </>
                                )}
                                <span className="font-medium text-sm">
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center mt-1 space-x-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(
                                    task.difficulty
                                  )}`}
                                >
                                  {task.points} pkt
                                </span>
                                {progress[task.id]?.attempts > 0 && (
                                  <span className="text-xs text-gray-500">
                                    Próby: {progress[task.id].attempts}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
            )}

            {tasks.length === 0 && (
              <div className="text-center mt-8">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">
                  Brak dostępnych zadań
                </h3>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Szczegóły zadania - zajmują całą przestrzeń */
        <div className="h-full flex flex-col">
          <div className="bg-white border-b px-4 py-3">
            <button
              onClick={() => setSelectedTask(null)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
              Powrót do listy zadań
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">
                    {selectedTask.title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedTask.description}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(
                      selectedTask.difficulty
                    )}`}
                  >
                    {selectedTask.difficulty === "easy"
                      ? "Łatwe"
                      : selectedTask.difficulty === "medium"
                      ? "Średnie"
                      : "Trudne"}
                  </span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {selectedTask.points} pkt
                  </span>
                </div>
              </div>

              {/* Przyciski akcji */}
              {!isTeacher && (
                <div className="mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleValidate}
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        "Sprawdzanie..."
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Sprawdź rozwiązanie
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowHints(!showHints)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {showHints ? "Ukryj" : "Pokaż"} podpowiedzi
                    </button>
                  </div>
                </div>
              )}

              {/* Wyniki walidacji */}
              {validationResult && (
                <div className="bg-white rounded-lg border mb-4">
                  <div
                    className={`px-4 py-3 border-b ${
                      validationResult.passed ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center">
                      {validationResult.passed ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-semibold text-green-800">
                            Zadanie zaliczone! 🎉
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600 mr-2" />
                          <span className="font-semibold text-red-800">
                            Zadanie niezaliczone
                          </span>
                        </>
                      )}
                      <span className="ml-auto text-sm">
                        Wynik: {validationResult.score}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    {validationResult.results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-start p-2 rounded ${
                          result.passed ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            result.passed ? "text-green-800" : "text-red-800"
                          }`}
                        >
                          {result.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Podpowiedzi */}
              {showHints && selectedTask.hints && (
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-semibold text-yellow-800">
                      Podpowiedzi
                    </span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2">
                    {selectedTask.hints.map((hint, index) => (
                      <li key={index} className="text-sm text-yellow-800">
                        {hint}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskPanel;

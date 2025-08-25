import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, Star, TrendingUp, User } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function Leaderboard({ sessionId, currentStudentId, onRefresh }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [sessionId]);

  useEffect(() => {
    if (onRefresh) {
      loadRanking();
    }
  }, [onRefresh]);

  const loadRanking = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/session/${sessionId}/ranking`
      );
      setRanking(response.data);
    } catch (error) {
      console.error("Błąd ładowania rankingu:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return (
          <span className="w-5 h-5 text-center text-sm font-bold text-gray-500">
            {position}
          </span>
        );
    }
  };

  const getRankStyle = (position, isCurrentUser) => {
    if (isCurrentUser) {
      return "bg-indigo-50 border-indigo-300";
    }
    switch (position) {
      case 1:
        return "bg-yellow-50 border-yellow-300";
      case 2:
        return "bg-gray-50 border-gray-300";
      case 3:
        return "bg-orange-50 border-orange-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Ładowanie rankingu...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b flex items-center">
        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
        <span className="font-semibold">Ranking</span>
        <button
          onClick={loadRanking}
          className="ml-auto text-sm text-indigo-600 hover:text-indigo-700"
        >
          Odśwież
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {ranking.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Brak uczniów w sesji</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((student, index) => {
              const position = index + 1;
              const isCurrentUser = student.id === currentStudentId;

              return (
                <div
                  key={student.id}
                  className={`flex items-center p-3 rounded-lg border transition-all ${getRankStyle(
                    position,
                    isCurrentUser
                  )}`}
                >
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(position)}
                  </div>

                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span
                        className={`font-medium ${
                          isCurrentUser ? "text-indigo-700" : "text-gray-800"
                        }`}
                      >
                        {student.name}
                      </span>
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                          Ty
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-bold text-lg">
                        {student.points || 0}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">pkt</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ranking.length > 0 && (
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Uczniów w sesji: {ranking.length}
            </span>
            <span className="text-gray-600">
              Suma punktów:{" "}
              {ranking.reduce((sum, s) => sum + (s.points || 0), 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  Code,
  Palette,
  Zap,
  Play,
  Layout,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
} from "lucide-react";

function MultiEditor({
  initialHtml = "",
  initialCss = "",
  initialJs = "",
  onCodeChange,
  readOnly = false,
  showPreview = true,
  height = "100%",
}) {
  const [activeTab, setActiveTab] = useState("html");
  const [htmlCode, setHtmlCode] = useState(initialHtml);
  const [cssCode, setCssCode] = useState(initialCss);
  const [jsCode, setJsCode] = useState(initialJs);
  const [previewMode, setPreviewMode] = useState("side"); // 'side', 'bottom', 'full'
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const iframeRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Domyślne wartości dla nowych projektów
  const defaultHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moja strona</title>
</head>
<body>
    <h1>Witaj świecie!</h1>
    <p>Zacznij kodować...</p>
</body>
</html>`;

  const defaultCss = `/* Stylowanie CSS */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

h1 {
    color: white;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
    color: rgba(255,255,255,0.9);
    text-align: center;
    font-size: 18px;
}`;

  const defaultJs = `// JavaScript kod
console.log('Strona załadowana!');

// Przykład interakcji
document.addEventListener('DOMContentLoaded', function() {
    const h1 = document.querySelector('h1');
    if (h1) {
        h1.addEventListener('click', function() {
            alert('Kliknąłeś nagłówek!');
        });
    }
});`;

  useEffect(() => {
    setHtmlCode(initialHtml || defaultHtml);
    setCssCode(initialCss || defaultCss);
    setJsCode(initialJs || defaultJs);
  }, [initialHtml, initialCss, initialJs]);

  // Generuj pełny kod strony
  const generateFullCode = () => {
    // Wstrzykuj CSS i JS do HTML
    let fullHtml = htmlCode;

    // Jeśli HTML nie ma sekcji <head>, dodaj ją
    if (!fullHtml.includes("<head>")) {
      fullHtml = fullHtml.replace("<html>", "<html>\n<head>\n</head>");
    }

    // Dodaj CSS przed zamknięciem </head>
    if (cssCode && cssCode.trim()) {
      const cssTag = `<style>\n${cssCode}\n</style>`;
      if (fullHtml.includes("</head>")) {
        fullHtml = fullHtml.replace("</head>", `${cssTag}\n</head>`);
      } else {
        fullHtml = fullHtml.replace("<body>", `${cssTag}\n<body>`);
      }
    }

    // Dodaj JS przed zamknięciem </body>
    if (jsCode && jsCode.trim()) {
      const jsTag = `<script>\n${jsCode}\n</script>`;
      if (fullHtml.includes("</body>")) {
        fullHtml = fullHtml.replace("</body>", `${jsTag}\n</body>`);
      } else {
        fullHtml += jsTag;
      }
    }

    return fullHtml;
  };

  // Aktualizuj podgląd
  const updatePreview = () => {
    if (!showPreview) return;

    const fullCode = generateFullCode();

    if (iframeRef.current) {
      // Użyj srcdoc dla bezpiecznego renderowania
      iframeRef.current.srcdoc = fullCode;
    }
  };

  // Obsługa zmian kodu z debouncing
  const handleCodeChange = (value, language) => {
    if (language === "html") setHtmlCode(value);
    else if (language === "css") setCssCode(value);
    else if (language === "javascript") setJsCode(value);

    // Debouncing dla wydajności
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (autoRefresh) {
        updatePreview();
      }

      // Callback dla rodzica
      if (onCodeChange) {
        onCodeChange({
          html: language === "html" ? value : htmlCode,
          css: language === "css" ? value : cssCode,
          js: language === "javascript" ? value : jsCode,
          fullCode: generateFullCode(),
        });
      }
    }, 500);
  };

  // Manualny refresh
  const handleManualRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    updatePreview();
  };

  // Pobierz kod
  const handleDownload = () => {
    const fullCode = generateFullCode();
    const blob = new Blob([fullCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset do domyślnych wartości
  const handleReset = () => {
    if (
      window.confirm(
        "Czy na pewno chcesz zresetować kod do wartości domyślnych?"
      )
    ) {
      setHtmlCode(defaultHtml);
      setCssCode(defaultCss);
      setJsCode(defaultJs);
      updatePreview();
    }
  };

  const tabs = [
    { id: "html", label: "HTML", icon: Code, color: "text-orange-600" },
    { id: "css", label: "CSS", icon: Palette, color: "text-blue-600" },
    {
      id: "javascript",
      label: "JavaScript",
      icon: Zap,
      color: "text-yellow-600",
    },
  ];

  const getEditorValue = () => {
    switch (activeTab) {
      case "html":
        return htmlCode;
      case "css":
        return cssCode;
      case "javascript":
        return jsCode;
      default:
        return "";
    }
  };

  useEffect(() => {
    // Początkowy render
    updatePreview();
  }, []);

  return (
    <div
      className={`flex ${
        previewMode === "bottom" ? "flex-col" : "flex-row"
      } ${height}`}
    >
      {/* Panel edytora */}
      <div
        className={`${
          previewMode === "full"
            ? "hidden"
            : previewMode === "side"
            ? "w-1/2"
            : "h-1/2"
        } flex flex-col border-r border-gray-300`}
      >
        {/* Zakładki */}
        <div className="bg-gray-900 border-b border-gray-700 flex items-center justify-between">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 flex items-center space-x-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "bg-gray-800 border-blue-500 text-white"
                      : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      activeTab === tab.id ? tab.color : ""
                    }`}
                  />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Przyciski akcji */}
          <div className="flex items-center space-x-2 px-2">
            <button
              onClick={handleReset}
              title="Reset kodu"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              title="Pobierz plik HTML"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edytor kodu */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={activeTab}
            value={getEditorValue()}
            onChange={(value) => handleCodeChange(value, activeTab)}
            theme="vs-dark"
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Panel podglądu */}
      {showPreview && (
        <div
          className={`${
            previewMode === "full"
              ? "w-full h-full"
              : previewMode === "side"
              ? "w-1/2"
              : "h-1/2"
          } flex flex-col`}
        >
          {/* Pasek narzędzi podglądu */}
          <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Podgląd</span>
              <label className="flex items-center ml-4 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                Auto-refresh
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualRefresh}
                className="p-1.5 hover:bg-gray-100 rounded"
                title="Odśwież podgląd"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="flex bg-gray-100 rounded">
                <button
                  onClick={() => setPreviewMode("side")}
                  className={`p-1.5 ${
                    previewMode === "side" ? "bg-white" : ""
                  } rounded`}
                  title="Podgląd z boku"
                >
                  <Layout className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("bottom")}
                  className={`p-1.5 ${
                    previewMode === "bottom" ? "bg-white" : ""
                  } rounded`}
                  title="Podgląd na dole"
                >
                  <Layout className="w-4 h-4 rotate-90" />
                </button>
                <button
                  onClick={() => setPreviewMode("full")}
                  className={`p-1.5 ${
                    previewMode === "full" ? "bg-white" : ""
                  } rounded`}
                  title="Pełny ekran"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {previewMode === "full" && (
                <button
                  onClick={() => setPreviewMode("side")}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Wyjdź z pełnego ekranu"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* iframe z podglądem */}
          <div className="flex-1 bg-white">
            <iframe
              key={refreshKey}
              ref={iframeRef}
              title="preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-modals"
              srcdoc={generateFullCode()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiEditor;

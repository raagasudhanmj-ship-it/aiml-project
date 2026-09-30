import React, { useState, useEffect } from "react";
import { Sidebar, NavigationTab } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { EntityExplorer } from "./components/EntityExplorer";
import { MatchInvestigation } from "./components/MatchInvestigation";
import { PredictionResults } from "./components/PredictionResults";
import { ModelPerformance } from "./components/ModelPerformance";
import { DataQuality } from "./components/DataQuality";
import { Methodology } from "./components/Methodology";
import { SummaryKPIs, SystemHealth } from "./types";
import { fetchSummary, fetchHealth } from "./api";
import { ErrorBanner } from "./components/Common";

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>("dashboard");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("S1-778640743");
  const [explorerSearchQuery, setExplorerSearchQuery] = useState<string>("");

  const [summary, setSummary] = useState<SummaryKPIs | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGlobalData = async () => {
    try {
      setError(null);
      const [sumRes, healthRes] = await Promise.all([
        fetchSummary().catch(() => null),
        fetchHealth().catch(() => null)
      ]);
      if (sumRes) setSummary(sumRes);
      if (healthRes) setHealth(healthRes);
    } catch (err: any) {
      setError("Unable to connect to EntityResolve AI backend server. Please verify backend is running.");
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, []);

  const handleGlobalSearch = (query: string) => {
    if (query.toUpperCase().startsWith("S1-")) {
      setSelectedEntityId(query);
      setCurrentTab("investigation");
    } else {
      setExplorerSearchQuery(query);
      setCurrentTab("explorer");
    }
  };

  const handleSelectEntityForInvestigation = (entityId: string) => {
    setSelectedEntityId(entityId);
    setCurrentTab("investigation");
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-row">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        systemHealth={health}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopBar
          onQuickSearch={handleGlobalSearch}
          onSelectEntity={handleSelectEntityForInvestigation}
        />

        {/* Global Connection Warning if Backend is Down */}
        {error && (
          <div className="px-8 pt-4">
            <ErrorBanner message={error} onRetry={loadGlobalData} />
          </div>
        )}

        {/* Dynamic Main View */}
        <main className="flex-1 pb-16">
          {currentTab === "dashboard" && (
            <Dashboard
              summary={summary}
              onNavigate={setCurrentTab}
              onInvestigateSample={handleSelectEntityForInvestigation}
            />
          )}

          {currentTab === "explorer" && (
            <EntityExplorer
              initialQuery={explorerSearchQuery}
              onSelectEntityForInvestigation={handleSelectEntityForInvestigation}
            />
          )}

          {currentTab === "investigation" && (
            <MatchInvestigation
              selectedEntityId={selectedEntityId}
              onSelectNewEntity={setSelectedEntityId}
            />
          )}

          {currentTab === "results" && (
            <PredictionResults
              onInvestigate={handleSelectEntityForInvestigation}
            />
          )}

          {currentTab === "performance" && (
            <ModelPerformance />
          )}

          {currentTab === "data-quality" && (
            <DataQuality />
          )}

          {currentTab === "methodology" && (
            <Methodology />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

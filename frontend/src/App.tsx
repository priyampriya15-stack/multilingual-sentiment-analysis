import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { BatchAnalysisPage } from './pages/BatchAnalysisPage';
import { LanguageAnalyticsPage } from './pages/LanguageAnalyticsPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { ResearchLabPage } from './pages/ResearchLabPage';
import { PredictionHistoryPage } from './pages/PredictionHistoryPage';
import { DocumentationPage } from './pages/DocumentationPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application Layout & Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="analyzer" element={<AnalyzerPage />} />
          <Route path="batch" element={<BatchAnalysisPage />} />
          <Route path="languages" element={<LanguageAnalyticsPage />} />
          <Route path="models" element={<ModelComparisonPage />} />
          <Route path="datasets" element={<DatasetExplorerPage />} />
          <Route path="research" element={<ResearchLabPage />} />
          <Route path="history" element={<PredictionHistoryPage />} />
          <Route path="docs" element={<DocumentationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Redirect /login directly to dashboard */}
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

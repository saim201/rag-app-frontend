import { useEffect, useState } from 'react';
import type { Department } from './types';
import { DocumentsSidebar } from './components/DocumentsSidebar';
import { SearchChat } from './components/SearchChat';
import './App.css';

function App() {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('engineering');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Mobile top bar */}
      <div className="md:hidden px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Open documents sidebar"
        >
          Documents
        </button>
        <div className="text-sm text-gray-600">
          Dept: <span className="font-medium text-gray-900 capitalize">{selectedDepartment}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-72 shrink-0 border-r border-gray-200">
          <DocumentsSidebar
            currentDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
          />
        </div>

        {/* Main Content - Search Chat */}
        <div className="flex-1 min-h-0">
          <SearchChat key={selectedDepartment} currentDepartment={selectedDepartment} />
        </div>
      </div>

      {/* Mobile slide-over sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close documents sidebar"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(20rem,85vw)] bg-white shadow-xl border-r border-gray-200">
            <div className="h-full">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Documents</div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
              <DocumentsSidebar
                currentDepartment={selectedDepartment}
                onDepartmentChange={(dept) => {
                  setSelectedDepartment(dept);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

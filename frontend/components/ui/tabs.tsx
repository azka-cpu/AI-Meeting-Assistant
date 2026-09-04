
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Tab {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface TabsContextValue {
  activeTab: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  tabs: Tab[];
  defaultValue: string;
  children: ReactNode;
}

function Tabs({ tabs, defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab }}>
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </TabsContext.Provider>
  );
}

function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.Content must be used inside <Tabs>');
  if (ctx.activeTab !== value) return null;
  return <div className="fade-in">{children}</div>;
}

Tabs.Content = TabsContent;
export default Tabs;

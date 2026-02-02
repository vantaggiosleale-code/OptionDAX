import React from 'react';
import { Lightbulb } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ProposteView() {
  const { theme } = useTheme();
  
  const headerBg = theme === 'light' ? '#ffffff' : '#111827';
  const headerText = theme === 'light' ? '#111827' : '#ffffff';
  const headerTextSecondary = theme === 'light' ? '#6b7280' : '#9ca3af';
  const borderColor = theme === 'light' ? '#e5e7eb' : '#1f2937';
  const containerBg = theme === 'light' ? '#ffffff' : '#030712';
  
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: containerBg }}>
      {/* Header */}
      <div className="border-b p-6" style={{ 
        backgroundColor: headerBg,
        borderColor: borderColor,
      }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: headerText }}>
            Proposte e Segnalazioni
          </h1>
        </div>
        <p className="ml-13" style={{ color: headerTextSecondary }}>
          Aiutaci a migliorare Option DAX! Segnala bug, proponi nuove funzionalità o suggerisci miglioramenti.
        </p>
      </div>

      {/* Google Form Container */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: containerBg }}>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSdzw52iwYenknu3r8Rn2q2BTdANSCoVxAXUFnxfDfn3o7xSlg/viewform?embedded=true"
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          className="w-full h-full"
          title="Form Proposte e Segnalazioni"
        >
          Caricamento…
        </iframe>
      </div>
    </div>
  );
}

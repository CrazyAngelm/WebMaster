// CombatErrorBoundary.tsx - Error boundary for CombatScreen
// Catches render errors and shows message instead of black screen
// Used in App.tsx wrapping CombatScreen

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CombatErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[CombatErrorBoundary]', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-3xl mx-auto border-2 border-red-500/50 rounded bg-red-950/20 p-6">
          <h3 className="text-xl font-serif text-red-400 mb-4 uppercase">Ошибка отображения боя</h3>
          <pre className="text-sm text-red-300 overflow-auto max-h-48 font-mono whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="fantasy-button mt-4"
          >
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

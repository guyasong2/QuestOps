import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text p-6">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold font-display text-red-400 mb-2">Simulation Crashed</h1>
          <p className="text-text-muted mb-6 text-center max-w-lg">
            An unexpected error occurred in the terminal sandbox or UI engine.
          </p>
          <div className="bg-surface border-[3px] border-text shadow-[4px_4px_0_#111214] p-4 rounded-xl w-full max-w-2xl overflow-x-auto text-left">
            <pre className="text-red-400 text-xs font-mono">{this.state.error?.toString()}</pre>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg border-2 border-text shadow-[2px_2px_0_#111214] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

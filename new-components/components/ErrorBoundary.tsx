import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Terminal, Copy, Check } from 'lucide-react';
import StaticNoise from './StaticNoise';
import AnimatedMeshBackground from './AnimatedMeshBackground';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `Error: ${error?.toString()}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-900 font-mono select-none text-white">
          
          {/* Layer 1: Animated Mesh */}
          <AnimatedMeshBackground fixed={true} cursorForce={2.0} />

          {/* Layer 2: Static Noise */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <StaticNoise clarity={0.1} />
          </div>
          
          {/* Layer 3: CRT Overlays */}
          <div className="pointer-events-none fixed inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
          <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]"></div>

          {/* Content Container */}
          <div className="relative z-20 w-full max-w-3xl px-4">
            
            {/* Main Terminal Card */}
            <div className="bg-gray-900/90 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(220,38,38,0.3)] relative overflow-hidden flex flex-col max-h-[80vh]">
              
              {/* Red Alert Overlay */}
              <div className="absolute inset-0 bg-red-500/5 z-0 animate-pulse pointer-events-none"></div>

              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-6 border-b border-red-500/30 pb-4 relative z-10 flex-shrink-0">
                <div className="flex items-center">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  </div>
                  <div className="text-red-400 text-xs md:text-sm flex items-center font-bold tracking-wider">
                    <Terminal size={14} className="mr-2" />
                    CRITICAL_SYSTEM_FAILURE
                  </div>
                </div>
                <div className="text-xs font-bold text-red-500 animate-pulse flex items-center">
                   <AlertTriangle size={14} className="mr-1" /> ERROR_Code: 0xCRASH
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-6 relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                  Something went wrong.
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                  The system encountered an unrecoverable error. Please reboot or report this incident.
                </p>
              </div>

              {/* Error Log Area */}
              <div className="relative z-10 bg-black/50 rounded-lg border border-red-500/20 p-4 mb-6 flex-grow overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <span className="text-xs text-red-400 font-bold uppercase">System Log Dump</span>
                    <button 
                        onClick={this.handleCopyError}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        {this.state.copied ? <Check size={12} className="text-green-400"/> : <Copy size={12} />}
                        {this.state.copied ? 'COPIED' : 'COPY LOG'}
                    </button>
                </div>
                <div className="overflow-auto custom-scrollbar font-mono text-xs md:text-sm text-red-300 whitespace-pre-wrap break-words p-2">
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 mt-auto">
                <button 
                    onClick={this.handleReload}
                    className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all transform hover:scale-105 group"
                >
                    <RefreshCcw className="mr-2 group-hover:rotate-180 transition-transform duration-500" size={18} />
                    SYSTEM_REBOOT
                </button>
                <a 
                    href="/"
                    className="flex items-center justify-center px-6 py-3 border border-red-500/50 hover:border-red-400 text-red-400 hover:text-white font-bold rounded-xl hover:bg-red-500/10 transition-all"
                >
                    EMERGENCY_EXIT
                </a>
              </div>

            </div>
            
            <div className="mt-6 text-center">
                <p className="text-gray-600 text-xs tracking-widest font-mono">
                   CORE_DUMP_SAVED_TO_MEMORY
                </p>
             </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

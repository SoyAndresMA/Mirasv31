// Ruta del fichero: /frontend/src/components/common/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
 errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
 public state: State = {
   hasError: false
 };

 public static getDerivedStateFromError(error: Error): State {
   return { hasError: true, error };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
   console.error('Error capturado:', error, errorInfo);
   this.setState({
     error,
     errorInfo
   });
 }

 public render() {
   if (this.state.hasError) {
     return (
       this.props.fallback || (
         <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
           <div className="bg-red-900/20 rounded-lg p-6 max-w-lg w-full border border-red-800">
             <div className="flex items-center gap-3 mb-4">
               <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
               <h1 className="text-xl font-semibold text-red-500">
                 Error en la Aplicación
               </h1>
             </div>
             
             <div className="space-y-4">
               <p className="text-red-200">
                 Se ha producido un error inesperado. Por favor, recarga la página o contacta con soporte si el problema persiste.
               </p>
               
               {process.env.NODE_ENV === 'development' && this.state.error && (
                 <div className="mt-4">
                   <h2 className="text-sm font-semibold text-red-400 mb-2">
                     Detalles del Error (Solo Desarrollo):
                   </h2>
                   <pre className="bg-red-900/30 p-3 rounded text-xs text-red-300 overflow-auto">
                     {this.state.error.toString()}
                     {'\n\n'}
                     {this.state.errorInfo?.componentStack}
                   </pre>
                 </div>
               )}

               <div className="flex justify-end mt-4">
                 <button
                   onClick={() => window.location.reload()}
                   className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
                 >
                   Recargar Página
                 </button>
               </div>
             </div>
           </div>
         </div>
       )
     );
   }

   return this.props.children;
 }
}

export default ErrorBoundary;
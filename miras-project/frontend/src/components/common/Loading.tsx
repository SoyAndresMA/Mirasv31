// Ruta del fichero: /frontend/src/components/common/Loading.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
 message?: string;
 fullScreen?: boolean;
 size?: 'small' | 'medium' | 'large';
}

const Loading: React.FC<LoadingProps> = ({
 message = 'Cargando...',
 fullScreen = false,
 size = 'medium'
}) => {
 const sizeClasses = {
   small: 'h-4 w-4',
   medium: 'h-8 w-8',
   large: 'h-12 w-12'
 };

 const content = (
   <div className="flex flex-col items-center justify-center gap-3">
     <Loader2 
       className={`${sizeClasses[size]} text-blue-500 animate-spin`}
     />
     {message && (
       <p className="text-gray-400 animate-pulse">
         {message}
       </p>
     )}
   </div>
 );

 if (fullScreen) {
   return (
     <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
       {content}
     </div>
   );
 }

 return (
   <div className="flex items-center justify-center p-4">
     {content}
   </div>
 );
};

export default Loading;
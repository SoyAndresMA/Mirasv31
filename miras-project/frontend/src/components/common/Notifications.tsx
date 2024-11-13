// Ruta del fichero: /frontend/src/components/common/Notifications.tsx

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';

export interface Notification {
 id: string;
 type: 'success' | 'error' | 'info' | 'warning';
 message: string;
 duration?: number;
}

interface NotificationsProps {
 notifications: Notification[];
 onDismiss: (id: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
 notifications,
 onDismiss,
}) => {
 const icons = {
   success: <CheckCircle className="h-5 w-5 text-green-500" />,
   error: <XCircle className="h-5 w-5 text-red-500" />,
   warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
   info: <Info className="h-5 w-5 text-blue-500" />,
 };

 const bgColors = {
   success: 'bg-green-900/20 border-green-800',
   error: 'bg-red-900/20 border-red-800',
   warning: 'bg-yellow-900/20 border-yellow-800',
   info: 'bg-blue-900/20 border-blue-800',
 };

 useEffect(() => {
   notifications.forEach((notification) => {
     if (notification.duration) {
       const timer = setTimeout(() => {
         onDismiss(notification.id);
       }, notification.duration);

       return () => clearTimeout(timer);
     }
   });
 }, [notifications, onDismiss]);

 return (
   <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
     {notifications.map((notification) => (
       <div
         key={notification.id}
         className={`rounded-lg p-4 border ${bgColors[notification.type]} 
           shadow-lg transition-all duration-300 animate-slide-in`}
       >
         <div className="flex items-center gap-3">
           {icons[notification.type]}
           <p className="text-sm text-white flex-grow">
             {notification.message}
           </p>
           <button
             onClick={() => onDismiss(notification.id)}
             className="text-gray-400 hover:text-white transition-colors"
           >
             <X className="h-5 w-5" />
           </button>
         </div>
         
         {notification.duration && (
           <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden">
             <div
               className={`h-full ${
                 notification.type === 'success' ? 'bg-green-500' :
                 notification.type === 'error' ? 'bg-red-500' :
                 notification.type === 'warning' ? 'bg-yellow-500' :
                 'bg-blue-500'
               } transition-all duration-${notification.duration}ms`}
               style={{
                 width: '100%',
                 animation: `shrink ${notification.duration}ms linear forwards`,
               }}
             />
           </div>
         )}
       </div>
     ))}

     <style jsx>{`
       @keyframes shrink {
         from { width: 100%; }
         to { width: 0%; }
       }
       
       @keyframes slide-in {
         from {
           transform: translateX(100%);
           opacity: 0;
         }
         to {
           transform: translateX(0);
           opacity: 1;
         }
       }

       .animate-slide-in {
         animation: slide-in 0.3s ease-out forwards;
       }
     `}</style>
   </div>
 );
};

export default Notifications;
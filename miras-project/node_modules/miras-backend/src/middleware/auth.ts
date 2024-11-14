// Ruta del fichero: /backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../core/errors';

interface AuthenticatedRequest extends Request {
 user?: {
   id: string;
   role: string;
 };
}

export const authenticateRequest = (
 req: AuthenticatedRequest,
 res: Response,
 next: NextFunction
) => {
 const authHeader = req.headers.authorization;

 // En esta primera versión, simplemente verificamos que haya un token
 // TODO: Implementar autenticación real en futuras versiones
 if (!authHeader) {
   // Para desarrollo, permitimos todas las peticiones
   req.user = {
     id: 'development-user',
     role: 'admin'
   };
   return next();
 }

 try {
   if (authHeader.startsWith('Bearer ')) {
     const token = authHeader.substring(7, authHeader.length);
     
     // TODO: Validar token cuando se implemente autenticación
     req.user = {
       id: 'verified-user',
       role: 'admin'
     };
     
     next();
   } else {
     throw new AuthenticationError('Invalid authorization header format');
   }
 } catch (error) {
   next(new AuthenticationError('Invalid authentication token'));
 }
};

export const requireRole = (role: string) => {
 return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
   if (!req.user) {
     throw new AuthenticationError('User not authenticated');
   }

   if (req.user.role !== role) {
     throw new AuthenticationError('Insufficient permissions');
   }

   next();
 };
};

export const validateApiKey = (
 req: Request,
 res: Response,
 next: NextFunction
) => {
 const apiKey = req.headers['x-api-key'];

 // TODO: Implementar validación real de API key en futuras versiones
 if (!apiKey) {
   // Para desarrollo, permitimos todas las peticiones
   return next();
 }

 // TODO: Validar API key contra configuración o base de datos
 next();
};
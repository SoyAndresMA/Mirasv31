// Ruta del fichero: /backend/src/routes/api.ts

import express from 'express';
import { authenticateRequest } from '../middleware/auth';
import { ProjectManager } from '../core/ProjectManager';
import { DeviceManager } from '../core/DeviceManager';
import { ValidationError } from '../core/errors';

const router = express.Router();

export function createApiRouter(
 projectManager: ProjectManager,
 deviceManager: DeviceManager
) {
 // Middleware para todas las rutas API
 router.use(authenticateRequest);

 // Endpoints de Proyectos
 router.get('/projects', async (req, res, next) => {
   try {
     const projects = await projectManager.getAllProjects();
     res.json(projects);
   } catch (error) {
     next(error);
   }
 });

 router.get('/projects/:id', async (req, res, next) => {
   try {
     const project = await projectManager.getProject(parseInt(req.params.id));
     if (!project) {
       throw new ValidationError(`Project ${req.params.id} not found`);
     }
     res.json(project);
   } catch (error) {
     next(error);
   }
 });

 // Endpoints de Dispositivos
 router.get('/devices', async (req, res, next) => {
   try {
     const devices = await deviceManager.getAllDevices();
     res.json(devices);
   } catch (error) {
     next(error);
   }
 });

 router.get('/devices/:id/status', async (req, res, next) => {
   try {
     const status = await deviceManager.getDeviceStatus(req.params.id);
     res.json(status);
   } catch (error) {
     next(error);
   }
 });

 // Endpoints de Estado del Sistema
 router.get('/system/status', async (req, res, next) => {
   try {
     const status = {
       devices: await deviceManager.getSystemStatus(),
       projects: await projectManager.getActiveProjects()
     };
     res.json(status);
   } catch (error) {
     next(error);
   }
 });

 // Manejador de errores para la API
 router.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
   console.error('API Error:', err);

   if (err instanceof ValidationError) {
     res.status(400).json({ error: err.message });
   } else {
     res.status(500).json({ error: 'Internal server error' });
   }
 });

 return router;
}
// Ruta del fichero: /frontend/src/pages/ProjectEdit.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { useProjectOperations } from '../hooks/useProjectOperations';
import { useWebSocket } from '../hooks/useWebSocket';
import { useServerConnection } from '../hooks/useServerConnection';
import MEvent from '../components/common/MEvent/MEvent';
import Loading from '../components/common/Loading';
import type { Project, ProjectEvent } from '../core/state/types';

const ProjectEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { send } = useWebSocket();
  const { serverStatus } = useServerConnection();
  const { 
    project,
    isLoading,
    error,
    loadProject,
    saveProject,
    updateEvent
  } = useProjectOperations();

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject(parseInt(id));
    }
  }, [id, loadProject]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleEventChange = async (eventId: number, changes: Partial<ProjectEvent>) => {
    if (!project) return;

    // Actualización optimista
    updateEvent(eventId, changes);
    setHasUnsavedChanges(true);

    // Notificar al servidor vía WebSocket
    try {
      await send('EVENT_UPDATE', {
        projectId: project.id,
        eventId,
        changes
      });
    } catch (error) {
      console.error('Error updating event:', error);
      // Aquí deberías manejar el error y posiblemente revertir los cambios
    }
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      setIsSaving(true);
      await saveProject(project);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !project) return <Loading />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="text-xl font-semibold text-red-500">Error</div>
          <div className="text-gray-400">{error}</div>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Volver a proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.project_name}</h1>
            <p className="text-gray-400">{project.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {serverStatus !== 'connected' && (
            <div className="text-yellow-500 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Servidor desconectado</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md transition-colors
              ${hasUnsavedChanges && !isSaving 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
                // Implementar eliminación
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Events list */}
      <div className="space-y-4">
        {project.events?.map((event) => (
          <MEvent
            key={event.id}
            event={event}
            onEventChange={handleEventChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectEdit;
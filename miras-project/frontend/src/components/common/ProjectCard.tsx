// Ruta del fichero: /frontend/src/components/common/ProjectCard.tsx

import React from 'react';
import { CalendarDays, Clock, Edit, Trash2 } from 'lucide-react';
import { Project } from '../../core/state/types';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{project.project_name}</h3>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="p-2 hover:bg-gray-600 rounded-full transition-colors"
              title="Editar proyecto"
            >
              <Edit className="h-5 w-5 text-blue-400" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(project)}
              className="p-2 hover:bg-gray-600 rounded-full transition-colors"
              title="Eliminar proyecto"
            >
              <Trash2 className="h-5 w-5 text-red-400" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Creado: {formatDate(project.creation_date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Modificado: {formatDate(project.modification_date)}</span>
        </div>
      </div>

      {project.description && (
        <div className="mt-4 text-sm text-gray-300 border-t border-gray-700 pt-4">
          {project.description}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <span className="px-2 py-1 bg-blue-900/50 text-blue-200 rounded-full text-xs">
          {project.events?.length || 0} eventos
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;
// Ruta del fichero: /frontend/src/pages/ProjectList.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder, Search, Calendar } from 'lucide-react';
import { useProjectOperations } from '../hooks/useProjectOperations';
import { ProjectCard } from '../components/common/ProjectCard';
import Loading from '../components/common/Loading';
import type { Project } from '../core/state/types';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading, error, loadProjects } = useProjectOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!projects) return;
    
    const filtered = projects.filter(project => 
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error cargando proyectos: {error}</div>
        <button
          onClick={() => loadProjects()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Folder className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-white">Proyectos</h1>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar proyectos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-md focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Project grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          {searchTerm ? (
            <>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No se encontraron proyectos
              </h3>
              <p className="text-gray-500">
                No hay proyectos que coincidan con "{searchTerm}"
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No hay proyectos
              </h3>
              <p className="text-gray-500">
                Comienza creando tu primer proyecto
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
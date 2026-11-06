import React, { useState, useEffect } from 'react';
import { Project } from '../../data/portfolio';
import { subscribeToProjects, saveProject, deleteProject } from '../../services/projectFirebase';
import { Plus, Trash2, Edit2, Loader2, Save, X, Image as ImageIcon } from 'lucide-react';

export const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (project: Project) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(project.id, [project.mainScreenshot, ...project.additionalScreenshots]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Projects</h2>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <img src={project.mainScreenshot} alt={project.title} className="w-full h-40 object-cover rounded-xl mb-4" />
              <h3 className="font-bold text-lg">{project.title}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.shortDescription}</p>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(project)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

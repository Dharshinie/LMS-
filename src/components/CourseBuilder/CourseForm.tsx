import { useState } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  contentType: 'video' | 'document' | 'text' | 'external_link';
  content: string;
  durationMinutes: number;
}

interface CourseFormProps {
  onSave: (course: any) => void;
  onCancel: () => void;
  initialCourse?: any;
}

export function CourseForm({ onSave, onCancel, initialCourse }: CourseFormProps) {
  const [title, setTitle] = useState(initialCourse?.title || '');
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [durationHours, setDurationHours] = useState(initialCourse?.duration_hours || 0);
  const [passingScore, setPassingScore] = useState(initialCourse?.passing_score || 70);
  const [modules, setModules] = useState<Module[]>(
    initialCourse?.modules || []
  );
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'module' | 'lesson'; id: string; moduleId?: string } | null>(null);

  const addModule = () => {
    const newModule: Module = {
      id: `module_${Date.now()}`,
      title: 'New Module',
      description: '',
      lessons: [],
    };
    setModules([...modules, newModule]);
    setActiveModule(newModule.id);
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `lesson_${Date.now()}`,
      title: 'New Lesson',
      contentType: 'text',
      content: '',
      durationMinutes: 0,
    };

    setModules(
      modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: [...m.lessons, newLesson] }
          : m
      )
    );
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(
      modules.map(m => (m.id === moduleId ? { ...m, ...updates } : m))
    );
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    setModules(
      modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map(l =>
                l.id === lessonId ? { ...l, ...updates } : l
              ),
            }
          : m
      )
    );
  };

  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId));
    if (activeModule === moduleId) {
      setActiveModule(null);
    }
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(
      modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
          : m
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetModuleId: string, position: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.type === 'module') {
      const draggedIndex = modules.findIndex(m => m.id === draggedItem.id);
      const targetIndex = modules.findIndex(m => m.id === targetModuleId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newModules = [...modules];
        const [draggedModule] = newModules.splice(draggedIndex, 1);
        newModules.splice(targetIndex, 0, draggedModule);
        setModules(newModules);
      }
    }

    setDraggedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      duration_hours: durationHours,
      passing_score: passingScore,
      modules,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter course title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter course description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                  placeholder="70"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Course
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Course Preview</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Title</p>
              <p className="font-medium text-gray-900">{title || '(Untitled)'}</p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-medium text-gray-900">{durationHours} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Modules</p>
              <p className="font-medium text-gray-900">{modules.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Lessons</p>
              <p className="font-medium text-gray-900">
                {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Course Structure</h3>
          <button
            onClick={addModule}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>

        <div className="space-y-3">
          {modules.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No modules yet. Add a module to get started!
            </p>
          ) : (
            modules.map((module, moduleIndex) => (
              <div
                key={module.id}
                draggable
                onDragStart={(e) => handleDragStart(e, { type: 'module', id: module.id })}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, module.id, moduleIndex)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => updateModule(module.id, { title: e.target.value })}
                      placeholder="Module title"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={module.description}
                      onChange={(e) => updateModule(module.id, { description: e.target.value })}
                      placeholder="Module description (optional)"
                      rows={2}
                      className="w-full mt-2 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => deleteModule(module.id)}
                    className="text-red-600 hover:text-red-800 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="ml-8 space-y-2 mb-3">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="bg-gray-50 rounded p-3 flex items-start justify-between"
                    >
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) =>
                            updateLesson(module.id, lesson.id, { title: e.target.value })
                          }
                          placeholder="Lesson title"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <select
                            value={lesson.contentType}
                            onChange={(e) =>
                              updateLesson(module.id, lesson.id, {
                                contentType: e.target.value as any,
                              })
                            }
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="text">Text</option>
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="external_link">External Link</option>
                          </select>
                          <input
                            type="number"
                            value={lesson.durationMinutes}
                            onChange={(e) =>
                              updateLesson(module.id, lesson.id, {
                                durationMinutes: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="Minutes"
                            min="0"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => deleteLesson(module.id, lesson.id)}
                        className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addLesson(module.id)}
                  className="ml-8 flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Lesson
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

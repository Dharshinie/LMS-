import { X } from 'lucide-react';
import { CourseForm } from './CourseForm';

interface CourseBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: any) => void;
  initialCourse?: any;
}

export function CourseBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialCourse,
}: CourseBuilderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl my-8 mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialCourse ? 'Edit Course' : 'Create New Course'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <CourseForm
            initialCourse={initialCourse}
            onSave={(course) => {
              onSave(course);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

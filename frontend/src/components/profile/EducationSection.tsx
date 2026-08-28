import React, { useState } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, Calendar, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EducationModal } from './EducationModal';
import { EducationDto, EducationCreateInput } from '../../types';
import { useToast } from '../../context/ToastContext';

interface EducationSectionProps {
  educations: EducationDto[];
  isSelf: boolean;
  onAdd: (data: EducationCreateInput) => Promise<void>;
  onUpdate: (id: number, data: EducationCreateInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  educations,
  isSelf,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleOpenAdd = () => {
    setEditingEdu(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (edu: EducationDto) => {
    setEditingEdu(edu);
    setIsModalOpen(true);
  };

  const handleSave = async (data: EducationCreateInput, educationId?: number) => {
    setIsSaving(true);
    try {
      if (educationId) {
        await onUpdate(educationId, data);
        showToast('success', 'Education record updated successfully');
      } else {
        await onAdd(data);
        showToast('success', 'Education record added to profile');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save education');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, instName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${instName}" from your education?`)) {
      return;
    }
    try {
      await onDelete(id);
      showToast('info', 'Education record removed');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to remove education');
    }
  };

  return (
    <Card className="p-6 border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-subtle rounded-3xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-dark-text">Education</h2>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Academic qualifications & recognized institutions
            </p>
          </div>
        </div>
        {isSelf && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Education
          </Button>
        )}
      </div>

      {/* Education Entries List */}
      {educations.length > 0 ? (
        <div className="space-y-6">
          {educations.map((edu, index) => (
            <div
              key={edu.id}
              className={`flex items-start justify-between gap-4 group ${
                index !== educations.length - 1
                  ? 'pb-6 border-b border-slate-100 dark:border-dark-border/60'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Institution Logo or Fallback */}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                  {edu.institutionLogoUrl ? (
                    <img
                      src={edu.institutionLogoUrl}
                      alt={edu.institutionName}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-indigo-500" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
                    {edu.institutionName}
                  </h3>

                  <p className="text-xs font-semibold text-light-text dark:text-dark-text/90">
                    {edu.degree}
                    {edu.fieldOfStudy && <span>, {edu.fieldOfStudy}</span>}
                  </p>

                  <p className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {edu.startYear} {edu.endYear ? `– ${edu.endYear}` : ''}
                  </p>

                  {edu.grade && (
                    <p className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Grade: {edu.grade}
                    </p>
                  )}

                  {edu.description && (
                    <p className="text-xs text-light-text/90 dark:text-dark-text/80 pt-1 leading-relaxed whitespace-pre-line">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for Profile Owner */}
              {isSelf && (
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(edu)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
                    title="Edit education"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(edu.id, edu.institutionName)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete education"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-light-muted dark:text-dark-muted">
          {isSelf ? (
            <p>
              No education listed yet.{' '}
              <button
                onClick={handleOpenAdd}
                className="text-indigo-600 dark:text-indigo-400 font-semibold underline"
              >
                Add your degree or university
              </button>
            </p>
          ) : (
            <p>No academic education listed by this member.</p>
          )}
        </div>
      )}

      {/* Add / Edit Education Modal */}
      <EducationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingEdu}
        isLoading={isSaving}
      />
    </Card>
  );
};

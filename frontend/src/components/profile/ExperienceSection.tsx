import React, { useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, MapPin, Calendar, Layers, Building2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ExperienceModal } from './ExperienceModal';
import { ExperienceDto, ExperienceCreateInput } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ExperienceSectionProps {
  experiences: ExperienceDto[];
  isSelf: boolean;
  onAdd: (data: ExperienceCreateInput) => Promise<void>;
  onUpdate: (id: number, data: ExperienceCreateInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  isSelf,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleOpenAdd = () => {
    setEditingExp(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExperienceDto) => {
    setEditingExp(exp);
    setIsModalOpen(true);
  };

  const handleSave = async (data: ExperienceCreateInput, experienceId?: number) => {
    setIsSaving(true);
    try {
      if (experienceId) {
        await onUpdate(experienceId, data);
        showToast('success', 'Work experience updated successfully');
      } else {
        await onAdd(data);
        showToast('success', 'Work experience added to profile');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save experience');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your experience?`)) {
      return;
    }
    try {
      await onDelete(id);
      showToast('info', 'Work experience removed');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to remove experience');
    }
  };

  const formatPeriod = (startDate: string, endDate?: string | null, isCurrent?: boolean) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    let endStr = 'Present';
    let end = new Date();

    if (!isCurrent && endDate) {
      end = new Date(endDate);
      endStr = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Calculate duration in years and months
    const totalMonths =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    let durationStr = '';
    if (years > 0) {
      durationStr += `${years} yr${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
      if (durationStr) durationStr += ' ';
      durationStr += `${months} mo${months > 1 ? 's' : ''}`;
    }
    if (!durationStr) durationStr = '1 mo';

    return `${startStr} – ${endStr} • ${durationStr}`;
  };

  return (
    <Card className="p-6 border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-subtle rounded-3xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-dark-text">Experience</h2>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Professional career history & engineering roles
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
            <Plus className="w-4 h-4" /> Add Experience
          </Button>
        )}
      </div>

      {/* Experience Entries List */}
      {experiences.length > 0 ? (
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <div
              key={exp.id}
              className={`flex items-start justify-between gap-4 group ${
                index !== experiences.length - 1
                  ? 'pb-6 border-b border-slate-100 dark:border-dark-border/60'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Company Logo or Fallback */}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                  {exp.companyLogoUrl ? (
                    <img
                      src={exp.companyLogoUrl}
                      alt={exp.companyName}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-brand-500" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
                      {exp.title}
                    </h3>
                    {exp.isCurrentlyWorking && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Current Role
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-light-text dark:text-dark-text/90">
                    {exp.companyName}
                    {exp.employmentType && (
                      <span className="text-light-muted dark:text-dark-muted font-normal">
                        {' '}
                        • {exp.employmentType}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatPeriod(exp.startDate, exp.endDate, exp.isCurrentlyWorking)}
                  </p>

                  {exp.location && (
                    <p className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {exp.location}
                    </p>
                  )}

                  {exp.description && (
                    <p className="text-xs text-light-text/90 dark:text-dark-text/80 pt-1 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}

                  {/* Skills / Tech Stack Chips */}
                  {exp.skills && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <Layers className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                      {exp.skills.split(',').map((skill, idx) => {
                        const trimmed = skill.trim();
                        if (!trimmed) return null;
                        return (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-dark-border"
                          >
                            {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Profile Owner */}
              {isSelf && (
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(exp)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
                    title="Edit experience"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id, exp.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete experience"
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
              No experience listed yet.{' '}
              <button
                onClick={handleOpenAdd}
                className="text-brand-600 dark:text-brand-400 font-semibold underline"
              >
                Add your current or previous roles
              </button>
            </p>
          ) : (
            <p>No professional experience listed by this member.</p>
          )}
        </div>
      )}

      {/* Add / Edit Experience Modal */}
      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingExp}
        isLoading={isSaving}
      />
    </Card>
  );
};

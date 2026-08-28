import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Calendar, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { Autocomplete, AutocompleteItem } from '../ui/Autocomplete';
import { profileApi } from '../../api/profileApi';
import { EducationDto, EducationCreateInput } from '../../types';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EducationCreateInput, educationId?: number) => Promise<void>;
  initialData?: EducationDto | null;
  isLoading?: boolean;
}

export const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [isCustomInstitution, setIsCustomInstitution] = useState(false);
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setInstitutionId(initialData.institutionId || null);
      setInstitutionName(initialData.institutionName || '');
      setIsCustomInstitution(Boolean(initialData.isCustomInstitution));
      setDegree(initialData.degree || '');
      setFieldOfStudy(initialData.fieldOfStudy || '');
      setStartYear(initialData.startYear ? String(initialData.startYear) : '');
      setEndYear(initialData.endYear ? String(initialData.endYear) : '');
      setGrade(initialData.grade || '');
      setDescription(initialData.description || '');
    } else {
      setInstitutionId(null);
      setInstitutionName('');
      setIsCustomInstitution(false);
      setDegree('');
      setFieldOfStudy('');
      setStartYear('');
      setEndYear('');
      setGrade('');
      setDescription('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const fetchInstitutionOptions = async (query: string): Promise<AutocompleteItem[]> => {
    const institutions = await profileApi.searchInstitutions(query);
    return institutions.map((inst) => ({
      id: inst.id,
      title: inst.name,
      subtitle: `${inst.shortName || ''} • ${inst.location || ''}`,
      logoUrl: inst.logoUrl,
    }));
  };

  const handleInstitutionSelect = (item: AutocompleteItem) => {
    setInstitutionId(item.id || null);
    setInstitutionName(item.title);
    setIsCustomInstitution(Boolean(item.isCustom));
    if (errors.institutionName) {
      setErrors((prev) => ({ ...prev, institutionName: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!institutionName.trim()) {
      newErrors.institutionName = 'Institution / University is required';
    }
    if (!degree.trim()) {
      newErrors.degree = 'Degree is required (e.g. BTech, MS, BS)';
    }
    if (!startYear || isNaN(Number(startYear))) {
      newErrors.startYear = 'Valid start year is required';
    }
    if (endYear && !isNaN(Number(endYear)) && startYear && !isNaN(Number(startYear))) {
      if (Number(endYear) < Number(startYear)) {
        newErrors.endYear = 'Graduation year cannot be earlier than start year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: EducationCreateInput = {
      institutionId: isCustomInstitution ? null : institutionId,
      institutionName: institutionName.trim(),
      isCustomInstitution,
      degree: degree.trim(),
      fieldOfStudy: fieldOfStudy.trim() || undefined,
      startYear: parseInt(startYear, 10),
      endYear: endYear ? parseInt(endYear, 10) : undefined,
      grade: grade.trim() || undefined,
      description: description.trim() || undefined,
    };

    await onSave(payload, initialData?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-light-text dark:text-dark-text">
              {initialData ? 'Edit Education' : 'Add Education'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* University / College Autocomplete */}
          <Autocomplete
            label="University / College"
            placeholder="Search IIT Delhi, IIT Bombay, BITS Pilani, Stanford, MIT..."
            value={institutionName}
            selectedId={institutionId}
            onSelect={handleInstitutionSelect}
            fetchOptions={fetchInstitutionOptions}
            iconType="institution"
            required
            error={errors.institutionName}
          />

          {/* Degree */}
          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
              Degree <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={degree}
              onChange={(e) => {
                setDegree(e.target.value);
                if (errors.degree) setErrors((p) => ({ ...p, degree: '' }));
              }}
              placeholder="e.g. Bachelor of Technology (BTech) / Master of Science (MS)"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
                errors.degree ? 'border-rose-500' : 'border-slate-200 dark:border-dark-border'
              } rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
            />
            {errors.degree && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.degree}</p>}
          </div>

          {/* Field of Study */}
          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
              Field of Study
            </label>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              placeholder="e.g. Computer Science & Engineering / Information Systems"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Years (Start & Graduation) & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                Start Year <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1970"
                  max="2035"
                  value={startYear}
                  onChange={(e) => {
                    setStartYear(e.target.value);
                    if (errors.startYear) setErrors((p) => ({ ...p, startYear: '' }));
                  }}
                  placeholder="2020"
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
                    errors.startYear ? 'border-rose-500' : 'border-slate-200 dark:border-dark-border'
                  } rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
              {errors.startYear && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.startYear}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                Graduation Year
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1970"
                  max="2035"
                  value={endYear}
                  onChange={(e) => {
                    setEndYear(e.target.value);
                    if (errors.endYear) setErrors((p) => ({ ...p, endYear: '' }));
                  }}
                  placeholder="2024"
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
                    errors.endYear ? 'border-rose-500' : 'border-slate-200 dark:border-dark-border'
                  } rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
              {errors.endYear && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.endYear}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                Grade / CGPA
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 9.2 CGPA"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <Award className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
              Activities & Societies
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Highlight specializations, thesis projects, hackathons, clubs, or academic honors..."
              className="w-full p-3 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {initialData ? 'Save Changes' : 'Add Education'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

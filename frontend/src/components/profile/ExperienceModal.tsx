import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, MapPin, Layers, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Autocomplete, AutocompleteItem } from '../ui/Autocomplete';
import { profileApi } from '../../api/profileApi';
import { ExperienceDto, ExperienceCreateInput } from '../../types';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExperienceCreateInput, experienceId?: number) => Promise<void>;
  initialData?: ExperienceDto | null;
  isLoading?: boolean;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [title, setTitle] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCompanyId(initialData.companyId || null);
      setCompanyName(initialData.companyName || '');
      setIsCustomCompany(Boolean(initialData.isCustomCompany));
      setTitle(initialData.title || '');
      setEmploymentType(initialData.employmentType || 'Full-time');
      setLocation(initialData.location || '');
      setStartDate(initialData.startDate ? initialData.startDate.substring(0, 7) : ''); // YYYY-MM
      setEndDate(initialData.endDate ? initialData.endDate.substring(0, 7) : '');
      setIsCurrentlyWorking(Boolean(initialData.isCurrentlyWorking));
      setDescription(initialData.description || '');
      setSkills(initialData.skills || '');
    } else {
      setCompanyId(null);
      setCompanyName('');
      setIsCustomCompany(false);
      setTitle('');
      setEmploymentType('Full-time');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setIsCurrentlyWorking(false);
      setDescription('');
      setSkills('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const fetchCompanyOptions = async (query: string): Promise<AutocompleteItem[]> => {
    const companies = await profileApi.searchCompanies(query);
    return companies.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.industry || 'Tech'} • ${c.location || ''}`,
      logoUrl: c.logoUrl,
    }));
  };

  const handleCompanySelect = (item: AutocompleteItem) => {
    setCompanyId(item.id || null);
    setCompanyName(item.title);
    setIsCustomCompany(Boolean(item.isCustom));
    if (errors.companyName) {
      setErrors((prev) => ({ ...prev, companyName: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!title.trim()) {
      newErrors.title = 'Job title is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!isCurrentlyWorking) {
      if (!endDate) {
        newErrors.endDate = 'End date is required for past roles';
      } else if (startDate && endDate < startDate) {
        newErrors.endDate = 'End date cannot be earlier than start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Normalize YYYY-MM to YYYY-MM-01 for LocalDate
    const formattedStartDate = `${startDate}-01`;
    const formattedEndDate = isCurrentlyWorking ? null : `${endDate}-01`;

    const payload: ExperienceCreateInput = {
      companyId: isCustomCompany ? null : companyId,
      companyName: companyName.trim(),
      isCustomCompany,
      title: title.trim(),
      employmentType,
      location: location.trim() || undefined,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      isCurrentlyWorking,
      description: description.trim() || undefined,
      skills: skills.trim() || undefined,
    };

    await onSave(payload, initialData?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-light-text dark:text-dark-text">
              {initialData ? 'Edit Work Experience' : 'Add Work Experience'}
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
          {/* Company Search Autocomplete */}
          <Autocomplete
            label="Company"
            placeholder="Search Amazon, Google, Microsoft, Meta..."
            value={companyName}
            selectedId={companyId}
            onSelect={handleCompanySelect}
            fetchOptions={fetchCompanyOptions}
            iconType="company"
            required
            error={errors.companyName}
          />

          {/* Job Title */}
          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: '' }));
              }}
              placeholder="e.g. Senior Software Engineer / Full Stack Developer"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
                errors.title ? 'border-rose-500' : 'border-slate-200 dark:border-dark-border'
              } rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title}</p>}
          </div>

          {/* Employment Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India / Remote"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Currently Working Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="currentlyWorking"
              checked={isCurrentlyWorking}
              onChange={(e) => {
                setIsCurrentlyWorking(e.target.checked);
                if (e.target.checked) setEndDate('');
              }}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 dark:border-dark-border focus:ring-brand-500 cursor-pointer"
            />
            <label
              htmlFor="currentlyWorking"
              className="text-xs font-semibold text-light-text dark:text-dark-text cursor-pointer"
            >
              I am currently working in this role
            </label>
          </div>

          {/* Date Ranges (Start & End) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                Start Month & Year <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="month"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors((p) => ({ ...p, startDate: '' }));
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
                    errors.startDate ? 'border-rose-500' : 'border-slate-200 dark:border-dark-border'
                  } rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20`}
                />
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
              {errors.startDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
                End Month & Year {!isCurrentlyWorking && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="month"
                  value={endDate}
                  disabled={isCurrentlyWorking}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors((p) => ({ ...p, endDate: '' }));
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border ${
                    errors.endDate ? 'border-rose-500' : 'border-slate-200 dark:border-dark-border'
                  } rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    isCurrentlyWorking ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-dark-border/40' : ''
                  }`}
                />
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              </div>
              {errors.endDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.endDate}</p>}
            </div>
          </div>

          {/* Tech Stack / Skills Used */}
          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
              Tech Stack & Key Skills
            </label>
            <div className="relative">
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Java 21, Spring Boot, Kafka, AWS S3, React, PostgreSQL"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Layers className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1">
              Separate technologies with commas
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-light-text dark:text-dark-text mb-1.5">
              Role Responsibilities & Achievements
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your architectural achievements, core responsibilities, and high-impact contributions..."
                className="w-full p-3 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-sm text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {initialData ? 'Save Changes' : 'Add Experience'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

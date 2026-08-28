import React, { useState, useEffect } from 'react';
import { X, Code, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Autocomplete, AutocompleteItem } from '../ui/Autocomplete';
import { profileApi } from '../../api/profileApi';
import { AddSkillInput } from '../../types';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSkill: (data: AddSkillInput) => Promise<void>;
  isLoading?: boolean;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  onAddSkill,
  isLoading = false,
}) => {
  const [skillId, setSkillId] = useState<number | null>(null);
  const [skillName, setSkillName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSkillId(null);
    setSkillName('');
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchSkillOptions = async (query: string): Promise<AutocompleteItem[]> => {
    const skills = await profileApi.searchSkillsCatalog(query);
    return skills.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.category || 'Technical Skill',
    }));
  };

  const handleSelect = (item: AutocompleteItem) => {
    setSkillId(item.id || null);
    setSkillName(item.title);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setError('Please select or type a skill name');
      return;
    }

    await onAddSkill({
      skillId,
      skillName: skillName.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-light-text dark:text-dark-text">Add Skill</h2>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                Highlight your technical strengths
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Autocomplete
            label="Skill Name"
            placeholder="Search Java 21, Spring Boot, Kafka, React..."
            value={skillName}
            selectedId={skillId}
            onSelect={handleSelect}
            fetchOptions={fetchSkillOptions}
            iconType="skill"
            required
            error={error}
          />

          {/* Quick Suggestions */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-light-muted dark:text-dark-muted mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Core Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Java 21',
                'Distributed Systems',
                'Spring Boot',
                'Apache Kafka',
                'PostgreSQL',
                'React',
                'TypeScript',
                'AWS S3 & CloudFront CDN',
                'Docker',
                'System Design',
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSkillId(null);
                    setSkillName(s);
                    setError('');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 border border-slate-200/60 dark:border-dark-border transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Add to Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

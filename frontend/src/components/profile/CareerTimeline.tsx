import React from 'react';
import {
  Briefcase,
  GraduationCap,
  Calendar,
  Building2,
  Layers,
  MapPin,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { ExperienceDto, EducationDto } from '../../types';

interface TimelineItem {
  id: string;
  type: 'experience' | 'education';
  title: string;
  subtitle: string;
  organization: string;
  logoUrl?: string;
  location?: string;
  dateString: string;
  durationString?: string;
  sortTimestamp: number;
  isCurrent?: boolean;
  skills?: string;
  description?: string;
  grade?: string;
}

interface CareerTimelineProps {
  experiences: ExperienceDto[];
  educations: EducationDto[];
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  experiences,
  educations,
}) => {
  // Convert experiences and educations into a unified chronological timeline
  const items: TimelineItem[] = [];

  experiences.forEach((exp) => {
    const startDate = exp.startDate ? new Date(exp.startDate) : new Date();
    const startYear = startDate.getFullYear();
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });

    let endStr = 'Present';
    let end = new Date();
    if (!exp.isCurrentlyWorking && exp.endDate) {
      end = new Date(exp.endDate);
      endStr = `${end.toLocaleDateString('en-US', { month: 'short' })} ${end.getFullYear()}`;
    }

    const totalMonths =
      (end.getFullYear() - startDate.getFullYear()) * 12 +
      (end.getMonth() - startDate.getMonth()) +
      1;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    let dur = '';
    if (years > 0) dur += `${years} yr${years > 1 ? 's' : ''}`;
    if (months > 0) {
      if (dur) dur += ' ';
      dur += `${months} mo${months > 1 ? 's' : ''}`;
    }
    if (!dur) dur = '1 mo';

    items.push({
      id: `exp-${exp.id}`,
      type: 'experience',
      title: exp.title,
      subtitle: exp.employmentType ? `${exp.employmentType}` : 'Role',
      organization: exp.companyName,
      logoUrl: exp.companyLogoUrl,
      location: exp.location,
      dateString: `${startMonth} ${startYear} – ${endStr}`,
      durationString: dur,
      sortTimestamp: exp.isCurrentlyWorking ? 9999999999999 : startDate.getTime(),
      isCurrent: exp.isCurrentlyWorking,
      skills: exp.skills,
      description: exp.description,
    });
  });

  educations.forEach((edu) => {
    const startYear = edu.startYear;
    const endYear = edu.endYear;
    const dateStr = `${startYear}${endYear ? ` – ${endYear}` : ''}`;
    const sortTime = new Date(startYear, 0, 1).getTime();

    items.push({
      id: `edu-${edu.id}`,
      type: 'education',
      title: edu.degree,
      subtitle: edu.fieldOfStudy || 'Degree',
      organization: edu.institutionName,
      logoUrl: edu.institutionLogoUrl,
      dateString: dateStr,
      sortTimestamp: sortTime,
      isCurrent: false,
      grade: edu.grade,
      description: edu.description,
    });
  });

  // Sort chronologically descending (newest first)
  items.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-subtle rounded-3xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xs">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-light-text dark:text-dark-text">
            Career & Academic Timeline
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Chronological progression of engineering milestones & education
          </p>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-brand-500 before:via-indigo-500 before:to-slate-300 dark:before:to-dark-border">
        {items.map((item, index) => {
          const isExp = item.type === 'experience';

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Node Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full ring-4 ring-white dark:ring-dark-card flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                  item.isCurrent
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : isExp
                    ? 'bg-brand-500 text-white'
                    : 'bg-indigo-500 text-white'
                }`}
              >
                {isExp ? (
                  <Briefcase className="w-3 h-3" />
                ) : (
                  <GraduationCap className="w-3 h-3" />
                )}
              </div>

              {/* Timeline Content Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-dark-elevated/60 border border-slate-200/60 dark:border-dark-border/60 hover:border-brand-500/30 transition-all space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Organization Logo */}
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.organization}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : isExp ? (
                        <Building2 className="w-5 h-5 text-brand-500" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-light-text dark:text-dark-text">
                          {item.title}
                        </h3>
                        {item.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Current Role
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isExp
                              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {isExp ? 'Professional' : 'Academic'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-light-text dark:text-dark-text/90">
                        {item.organization}{' '}
                        {item.subtitle && (
                          <span className="font-normal text-light-muted dark:text-dark-muted">
                            • {item.subtitle}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-right">
                    <p className="text-xs font-bold text-light-text dark:text-dark-text flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.dateString}
                    </p>
                    {item.durationString && (
                      <p className="text-[11px] text-light-muted dark:text-dark-muted">
                        {item.durationString}
                      </p>
                    )}
                  </div>
                </div>

                {item.location && (
                  <p className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.location}
                  </p>
                )}

                {item.grade && (
                  <p className="text-xs text-light-muted dark:text-dark-muted flex items-center gap-1 font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Grade: {item.grade}
                  </p>
                )}

                {item.description && (
                  <p className="text-xs text-light-text/90 dark:text-dark-text/80 leading-relaxed whitespace-pre-line pt-1">
                    {item.description}
                  </p>
                )}

                {/* Skills Chips */}
                {item.skills && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    {item.skills.split(',').map((s, idx) => {
                      const trimmed = s.trim();
                      if (!trimmed) return null;
                      return (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border"
                        >
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

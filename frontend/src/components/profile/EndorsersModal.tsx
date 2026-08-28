import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, ThumbsUp, Calendar } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { EndorserSummaryDto } from '../../types';

interface EndorsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  endorsers: EndorserSummaryDto[];
  isLoading?: boolean;
}

export const EndorsersModal: React.FC<EndorsersModalProps> = ({
  isOpen,
  onClose,
  skillName,
  endorsers,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateUser = (userId: number) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-light-text dark:text-dark-text">
                Endorsements ({endorsers.length})
              </h2>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                1st-degree connections who endorsed <span className="font-semibold text-brand-600 dark:text-brand-400">{skillName}</span>
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

        {/* Endorsers List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100 dark:divide-dark-border/60">
          {endorsers.length > 0 ? (
            endorsers.map((endorser) => (
              <div
                key={endorser.id || endorser.userId}
                onClick={() => handleNavigateUser(endorser.userId)}
                className="flex items-center justify-between gap-3 pt-3 first:pt-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-elevated/60 p-2 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={endorser.avatarUrl}
                    name={endorser.name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-light-text dark:text-dark-text truncate hover:text-brand-600 transition-colors">
                      {endorser.name}
                    </p>
                    <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                      {endorser.headline || '1st-Degree Connection'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-light-muted dark:text-dark-muted flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 text-[10px] font-bold">
                    1st
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-light-muted dark:text-dark-muted">
              No endorsements yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

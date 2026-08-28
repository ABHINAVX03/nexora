import React, { useState } from 'react';
import { Code, Plus, Trash2, ThumbsUp, Check, Sparkles, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SkillModal } from './SkillModal';
import { EndorsersModal } from './EndorsersModal';
import { UserSkillDto, AddSkillInput, EndorserSummaryDto } from '../../types';
import { useToast } from '../../context/ToastContext';

interface SkillsSectionProps {
  skills: UserSkillDto[];
  isSelf: boolean;
  isConnected: boolean;
  onAddSkill: (data: AddSkillInput) => Promise<void>;
  onRemoveSkill: (userSkillId: number) => Promise<void>;
  onEndorseSkill: (userSkillId: number) => Promise<void>;
  onRemoveEndorsement: (userSkillId: number) => Promise<void>;
  onViewEndorsers: (userSkillId: number) => Promise<EndorserSummaryDto[]>;
  isLoading?: boolean;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  isSelf,
  isConnected,
  onAddSkill,
  onRemoveSkill,
  onEndorseSkill,
  onRemoveEndorsement,
  onViewEndorsers,
  isLoading = false,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeEndorsersModal, setActiveEndorsersModal] = useState<{
    skillName: string;
    endorsers: EndorserSummaryDto[];
  } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const handleAddSkill = async (data: AddSkillInput) => {
    try {
      await onAddSkill(data);
      showToast('success', `Added '${data.skillName}' to your profile`);
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: number, skillName: string) => {
    if (!window.confirm(`Are you sure you want to remove '${skillName}' from your profile?`)) {
      return;
    }
    try {
      await onRemoveSkill(skillId);
      showToast('info', `Removed '${skillName}'`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to remove skill');
    }
  };

  const handleToggleEndorse = async (skill: UserSkillDto) => {
    if (!isConnected) {
      showToast('warning', 'Only 1st-degree connections can endorse skills. Connect with this member first.');
      return;
    }

    setIsProcessingId(skill.id);
    try {
      if (skill.isEndorsedByViewer) {
        await onRemoveEndorsement(skill.id);
        showToast('info', `Removed endorsement for ${skill.skillName}`);
      } else {
        await onEndorseSkill(skill.id);
        showToast('success', `Endorsed ${skill.skillName}!`);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update endorsement');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleOpenEndorsers = async (skill: UserSkillDto) => {
    if (skill.endorsementCount === 0) return;
    try {
      const endorsers = await onViewEndorsers(skill.id);
      setActiveEndorsersModal({
        skillName: skill.skillName,
        endorsers,
      });
    } catch (err: any) {
      showToast('error', 'Failed to load endorsers');
    }
  };

  return (
    <Card className="p-6 border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-subtle rounded-3xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-light-text dark:text-dark-text">
              Skills & Endorsements
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Technical stack verified by 1st-degree engineering connections
            </p>
          </div>
        </div>
        {isSelf && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </Button>
        )}
      </div>

      {/* Skills Grid */}
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {skills.map((skill) => {
            const isProcessing = isProcessingId === skill.id;
            const topEndorsers = skill.topEndorsers || [];
            const remainingCount = Math.max(0, skill.endorsementCount - topEndorsers.length);

            return (
              <div
                key={skill.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-dark-elevated/70 border border-slate-200/70 dark:border-dark-border flex flex-col justify-between gap-3 group hover:border-brand-500/40 transition-all shadow-xs"
              >
                {/* Top Row: Skill Name & Category + Owner Delete / Connection Endorse */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-light-text dark:text-dark-text flex items-center gap-1.5 truncate">
                      {skill.skillName}
                    </h3>
                    <span className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                      {skill.category || 'Technical'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Endorse Toggle Button for 1st-Degree Connections */}
                    {!isSelf && isConnected && (
                      <button
                        onClick={() => handleToggleEndorse(skill)}
                        disabled={isProcessing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          skill.isEndorsedByViewer
                            ? 'bg-brand-500 text-white shadow-xs hover:bg-brand-600'
                            : 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/40'
                        }`}
                      >
                        {skill.isEndorsedByViewer ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Endorsed
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-3.5 h-3.5" /> Endorse
                          </>
                        )}
                      </button>
                    )}

                    {/* Delete Skill for Profile Owner */}
                    {isSelf && (
                      <button
                        onClick={() => handleRemoveSkill(skill.id, skill.skillName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Remove skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Endorsement Count & Endorser Avatars */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-dark-border/40">
                  <button
                    onClick={() => handleOpenEndorsers(skill)}
                    disabled={skill.endorsementCount === 0}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      skill.endorsementCount > 0
                        ? 'text-brand-600 dark:text-brand-400 hover:underline cursor-pointer'
                        : 'text-light-muted dark:text-dark-muted cursor-default'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      {skill.endorsementCount}{' '}
                      {skill.endorsementCount === 1 ? 'endorsement' : 'endorsements'}
                    </span>
                  </button>

                  {/* Overlapping Mutual Endorser Avatars */}
                  {topEndorsers.length > 0 && (
                    <div
                      onClick={() => handleOpenEndorsers(skill)}
                      className="flex items-center -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                      title="View endorsers"
                    >
                      {topEndorsers.map((endorser, idx) => (
                        <div
                          key={endorser.id || idx}
                          className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-dark-card overflow-hidden"
                        >
                          <Avatar
                            src={endorser.avatarUrl}
                            name={endorser.name}
                            size="xs"
                          />
                        </div>
                      ))}
                      {remainingCount > 0 && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-dark-border text-[10px] font-bold text-slate-700 dark:text-slate-300 ring-2 ring-white dark:ring-dark-card">
                          +{remainingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-light-muted dark:text-dark-muted">
          {isSelf ? (
            <p>
              No technical skills listed yet.{' '}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 font-semibold underline"
              >
                Add skills to receive 1st-degree endorsements
              </button>
            </p>
          ) : (
            <p>No technical skills listed on this profile.</p>
          )}
        </div>
      )}

      {/* Add Skill Modal */}
      <SkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSkill={handleAddSkill}
      />

      {/* Endorsers Modal */}
      {activeEndorsersModal && (
        <EndorsersModal
          isOpen={Boolean(activeEndorsersModal)}
          onClose={() => setActiveEndorsersModal(null)}
          skillName={activeEndorsersModal.skillName}
          endorsers={activeEndorsersModal.endorsers}
        />
      )}
    </Card>
  );
};

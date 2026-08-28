import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  User as UserIcon,
  Briefcase,
  Layers,
  Sparkles,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { connectionApi } from '../api/connectionApi';

export const OnboardingPage: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [headline, setHeadline] = useState(user?.headline || 'Software Engineer · Microservices');
  const [location, setLocation] = useState(user?.location || '');

  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Distributed Systems',
    'Apache Kafka',
    'React',
    'TypeScript',
  ]);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'System Design',
    'Agentic AI',
    'Cloud Native',
  ]);

  const availableSkills = [
    'Distributed Systems',
    'Apache Kafka',
    'React',
    'TypeScript',
    'Neo4j Graph',
    'Kubernetes',
    'Go / Golang',
    'PyTorch',
    'System Architecture',
  ];

  const availableInterests = [
    'System Design',
    'Agentic AI',
    'Cloud Native',
    'Engineering Management',
    'Open Source',
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleFinish = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    updateCurrentUser({
      headline,
      location,
      skills: selectedSkills,
    });

    showToast('success', 'Setup Complete', 'Welcome to your Nexora feed.');
    setTimeout(() => navigate('/feed'), 600);
  };

  const stepsList = [
    { num: 1, label: 'Identity', icon: <UserIcon className="w-4 h-4" /> },
    { num: 2, label: 'Profession', icon: <Briefcase className="w-4 h-4" /> },
    { num: 3, label: 'Skills', icon: <Layers className="w-4 h-4" /> },
    { num: 4, label: 'Interests', icon: <Sparkles className="w-4 h-4" /> },
    { num: 5, label: 'Circle', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col justify-center items-center p-4 sm:p-6 py-12 transition-colors">
      <div className="w-full max-w-xl space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            {stepsList.map((s) => {
              const isDone = s.num < step;
              const isCurrent = s.num === step;
              return (
                <div key={s.num} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white shadow-glow'
                        : 'bg-slate-100 dark:bg-dark-elevated text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="text-[10px] hidden sm:inline font-medium text-light-muted dark:text-dark-muted">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-dark-elevated overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Step 1: Your Identity</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Your verified identity on the Nexora platform
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 py-2">
                <Avatar name={user?.name || 'User'} size="2xl" className="ring-4 ring-brand-500/30" />
                <h4 className="text-base font-bold">{user?.name}</h4>
                <p className="text-xs text-light-muted dark:text-dark-muted font-mono">{user?.email}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified Nexora Member</p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Step 2: Your Profession</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Highlight your domain expertise and primary location
                </p>
              </div>

              <Input
                label="Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Software Engineer · Microservices"
              />

              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Step 3: Core Competencies</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Select your skills
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap py-2">
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-dark-elevated text-light-muted dark:text-dark-muted border-light-border dark:border-dark-border hover:border-brand-500'
                      }`}
                    >
                      {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Step 4: Your Interests</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted">
                  Select topics of interest
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 py-2">
                {availableInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <div
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 dark:text-brand-300'
                          : 'bg-slate-50 dark:bg-dark-elevated border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-slate-300'
                      }`}
                    >
                      <span>{interest}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight">Step 5: Grow Your Professional Circle</h3>
                <p className="text-xs text-light-muted dark:text-dark-muted max-w-sm mx-auto">
                  Find peers and leaders by direct name, full name, or work email in the Nexora Discover directory.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-elevated text-xs text-light-muted dark:text-dark-muted border border-light-border/60 dark:border-dark-border/60 max-w-sm mx-auto">
                <p className="font-semibold text-light-text dark:text-dark-text mb-1">🔍 Search anytime from anywhere</p>
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-dark-border font-mono text-[10px]">⌘K</kbd> to search members, topics, and posts instantly.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-light-border/60 dark:border-dark-border/60 mt-6">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="text-xs text-light-muted dark:text-dark-muted hover:underline"
              >
                Skip
              </button>
            )}

            {step < 5 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setStep(step + 1)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                variant="glow"
                size="md"
                onClick={handleFinish}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Launch Nexora
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

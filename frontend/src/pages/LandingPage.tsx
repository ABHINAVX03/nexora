import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Network,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] overflow-hidden pointer-events-none opacity-40 dark:opacity-20 z-0">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500 blur-[120px]" />
        <div className="absolute top-[-50px] right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500 blur-[100px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 p-0.5 shadow-glow flex items-center justify-center">
            <div className="w-full h-full bg-dark-bg/20 rounded-[10px] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 19V5l12 14V5" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
            Nexora
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Create Profile
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 text-center space-y-8">
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-50/50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 text-xs font-semibold shadow-xs animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Network Platform</span>
        </div>

        {/* Large Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-light-text dark:text-dark-text max-w-4xl mx-auto">
          Build your <span className="gradient-text">professional circle</span>.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-light-muted dark:text-dark-muted max-w-2xl mx-auto leading-relaxed">
          Connect with people who help you learn, build, and grow.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              variant="glow"
              size="lg"
              className="w-full sm:w-auto text-base px-8 h-12"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create your profile
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-base px-6 h-12"
            >
              Explore the network
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-8 flex items-center justify-center gap-6 text-xs text-light-muted dark:text-dark-muted flex-wrap">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Event-Driven Microservices
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Neo4j Graph-Indexed Connections
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kafka-Powered Notifications
          </span>
        </div>
      </section>

      {/* Feature Overview */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-light-border/60 dark:border-dark-border/60 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm space-y-3 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">1st-Degree Connections</h3>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              Verify relationships with mutual consent. Manage incoming invitations and view your network circle.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-light-border/60 dark:border-dark-border/60 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm space-y-3 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Real-Time Event Streams</h3>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              Kafka notification events delivered directly as connections are requested, accepted, and liked.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-light-border/60 dark:border-dark-border/60 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm space-y-3 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">JWT Authenticated</h3>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              Secure stateless microservices gateway authentication protecting profile and post authorizations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

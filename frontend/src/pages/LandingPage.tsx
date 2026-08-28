import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Network,
  CheckCircle2,
  Star,
  Github,
  Server,
  Cloud,
  Cpu,
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
          {/* GitHub Star Button in Navbar */}
          <a
            href="https://github.com/ABHINAVX03/nexora"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-light-border dark:border-dark-border bg-white/80 dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-dark-hover text-xs font-semibold transition-all group shadow-2xs"
            title="Star Nexora on GitHub"
          >
            <Github className="w-4 h-4 text-light-text dark:text-dark-text" />
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </a>

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
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 text-center space-y-8">
        {/* GitHub Star Pill Banner */}
        <div className="flex justify-center">
          <a
            href="https://github.com/ABHINAVX03/nexora"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-50/60 dark:bg-brand-950/40 hover:bg-brand-100/70 dark:hover:bg-brand-900/40 text-xs font-semibold shadow-xs transition-all transform hover:scale-105 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-brand-700 dark:text-brand-300">Nexora Distributed Platform</span>
            <span className="w-1 h-1 rounded-full bg-brand-400" />
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500" /> Star on GitHub
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Large Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-light-text dark:text-dark-text max-w-4xl mx-auto">
          Build your <span className="gradient-text">professional circle</span>.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-light-muted dark:text-dark-muted max-w-2xl mx-auto leading-relaxed">
          Connect with high-caliber engineers and professionals who help you learn, build, and grow on the next-generation distributed network.
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
          <a
            href="https://github.com/ABHINAVX03/nexora"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-base px-6 h-12 flex items-center justify-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>View on GitHub</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="pt-6 flex items-center justify-center gap-6 text-xs text-light-muted dark:text-dark-muted flex-wrap">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Java 21 Virtual Threads (100k Concurrent Users)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AWS S3 + CloudFront Global CDN
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Neo4j Graph-Indexed Connections
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Apache Kafka Event Streams
          </span>
        </div>
      </section>

      {/* Feature Overview */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-light-border/60 dark:border-dark-border/60 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm space-y-3 shadow-subtle hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Graph-Based Networking</h3>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              Powered by Neo4j graph database. Discover mutual relationships, manage invitations, and traverse 1st-degree circles in logarithmic time.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-light-border/60 dark:border-dark-border/60 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm space-y-3 shadow-subtle hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Global CloudFront CDN</h3>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              Media, avatars, and post attachments are accelerated by AWS S3 and 600+ CloudFront edge data centers worldwide with sub-10ms response times.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-light-border/60 dark:border-dark-border/60 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm space-y-3 shadow-subtle hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">High-Concurrency Engine</h3>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              Java 21 Project Loom virtual threads and Netty reactive gateway benchmarked to handle 100,000 concurrent virtual users with 0.00% errors.
            </p>
          </div>
        </div>
      </section>

      {/* GitHub Callout Footer Section */}
      <footer className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="p-8 rounded-3xl border border-light-border/80 dark:border-dark-border/80 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Github className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold">Open Source Distributed Engineering</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Explore the clean architecture, Java 21 microservices, Neo4j graph algorithms, and Kafka pipelines on GitHub. Star the repository to support the project!
            </p>
          </div>
          <a
            href="https://github.com/ABHINAVX03/nexora"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm shadow-lg transition-transform hover:scale-105 shrink-0"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

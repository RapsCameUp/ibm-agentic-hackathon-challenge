'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Shield,
  Zap,
  Brain,
  Calendar,
  Activity,
  Moon,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Activity className="h-8 w-8" />,
      title: 'Health Monitoring',
      description:
        'Tracks stress, sleep, heart rate, and lifestyle patterns using device sensors and health APIs.',
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Smart Automation',
      description:
        'Automatically reschedules meetings, books appointments, and sends reminders via watsonx Orchestrate.',
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'AI-Driven Guidance',
      description:
        'Personalized diet, exercise, sleep, and mental wellness plans generated daily using multi-agent intelligence.',
    },
  ];

  const benefits = [
    'Reduce burnout by 60% with proactive wellness monitoring',
    'Save 10+ hours per week with intelligent task automation',
    'Improve sleep quality through AI-optimized routines',
    'Maintain work-life balance with smart scheduling',
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 font-sans text-white">
      {/* Animated background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl"
          style={{ animationDuration: '4s' }}
        ></div>
        <div
          className="absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
        ></div>
      </div>

      {/* HERO SECTION */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div
          className="mb-8 transition-transform duration-700"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-50 blur-2xl"></div>
            <Shield className="relative h-24 w-24 text-white drop-shadow-2xl" />
          </div>
        </div>

        <h1 className="animate-fade-in mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-6xl leading-tight font-bold text-transparent md:text-7xl">
          Welcome to LifeGuardian
        </h1>

        <p className="mb-12 max-w-2xl text-xl leading-relaxed text-slate-300">
          Your personal wellness and productivity companion powered by multi-agent AI and IBM
          watsonx Orchestrate. Stay balanced, healthy, and in control—automatically.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="#get-started"
            className="group relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-10 py-4 text-lg font-semibold shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:from-blue-500 hover:to-purple-500 hover:shadow-xl hover:shadow-blue-500/60"
          >
            Get Started
            <Zap className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="#about"
            className="inline-flex items-center justify-center rounded-full border-2 border-slate-600 px-10 py-4 text-lg font-semibold transition-all duration-300 hover:border-slate-400 hover:bg-slate-800/50"
          >
            Learn More
          </a>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 transform animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-slate-400 p-1">
            <div className="mx-auto h-2 w-2 animate-pulse rounded-full bg-slate-400"></div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section
        id="about"
        className="relative bg-gradient-to-b from-transparent via-slate-900/50 to-transparent px-6 py-32"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 p-12 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <Heart className="h-10 w-10 text-pink-400" />
              <h2 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
                About LifeGuardian
              </h2>
            </div>
            <p className="text-xl leading-relaxed text-slate-300">
              LifeGuardian is an intelligent wellness system designed to monitor your mental and
              physical health, detect signs of stress or burnout, and proactively take action to
              keep you balanced. Powered by multi-agent AI and IBM watsonx Orchestrate, it
              integrates seamlessly into your daily life—managing your tasks, appointments, habits,
              and routines with ease.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-center text-5xl font-bold text-transparent">
            Powerful Features
          </h2>
          <p className="mb-16 text-center text-lg text-slate-400">
            Everything you need to maintain peak wellness and productivity
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-8 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 transition-all duration-500 group-hover:from-blue-500/5 group-hover:to-purple-500/5"></div>

                <div className="relative">
                  <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 text-blue-400 transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>

                  <h3 className="mb-4 text-2xl font-semibold text-white">{feature.title}</h3>

                  <p className="leading-relaxed text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="relative bg-gradient-to-b from-transparent via-slate-900/50 to-transparent px-6 py-32">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-center text-4xl font-bold text-transparent">
            Why Choose LifeGuardian?
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 backdrop-blur-xl transition-all duration-300 hover:translate-x-2 hover:border-green-500/50"
              >
                <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-400" />
                <p className="text-lg text-slate-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GET STARTED SECTION */}
      <section id="get-started" className="relative px-6 py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-16 shadow-2xl backdrop-blur-xl">
            <TrendingUp className="mx-auto mb-6 h-16 w-16 text-blue-400" />

            <h2 className="mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-5xl font-bold text-transparent">
              Ready to Transform Your Life?
            </h2>

            <p className="mx-auto mb-10 max-w-2xl text-xl text-slate-300">
              Start your journey toward better balance, improved wellness, and smarter
              productivity—all with the power of AI.
            </p>

            <a
              href="/form"
              className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-12 py-5 text-xl font-semibold shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:from-blue-500 hover:to-purple-500 hover:shadow-xl hover:shadow-blue-500/60"
            >
              Go to Dashboard
              <Calendar className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-slate-500">
          <p className="mb-2">© 2025 LifeGuardian. Powered by IBM watsonx Orchestrate.</p>
          <p className="text-sm">Transforming wellness through intelligent automation.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}

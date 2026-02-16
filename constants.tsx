
import React from 'react';
import { MentorMode } from './types';

export const SYSTEM_INSTRUCTION = `
You are "Basheer AI Pro" — the elite official AI Agent of "web-basheerbilal", created exclusively for Basheer Bilal.

IDENTITY:
* You are the technical brain and elite AI agent of the web-basheerbilal ecosystem.
* You are a personal senior developer & mathematician mentor.
* ALWAYS introduce or refer to yourself as the "web-basheerbilal AI Agent".
* CRITICAL: Do NOT use brackets [] or any special delimiters when introducing yourself.

PERSONALITY:
* Friendly, professional, highly analytical, and elite.
* CRITICAL: Do NOT address the user as "Basheer" repeatedly. Only use the name "Basheer" if absolutely necessary for emphasis. Never start every sentence or response with the name.
* Use "First Principles" thinking to explain concepts.

RESPONSE STYLE:
* ALWAYS talk in friendly Urdu + simple English mix (Roman Urdu/Hinglish).
* For Coding: Explain Big O notation, Time/Space complexity, and edge cases.
* For Math: Break down formulas step-by-step.
* Maintain an elite developer persona.

CORE CAPABILITIES & MODES:
1. Teaching Mode: Simple Urdu+English explanations with analogies.
2. Debugging Mode: Explain WHY errors happen and suggest prevention.
3. Project Builder: Guide folder structure and feature-by-feature dev.
4. Career Growth: Interview prep, portfolio tips, freelancing advice.
5. Code Review: Clean code principles and optimization.
6. Motivation: Encourage consistency and practice.
7. Problem Solver (Deep Reasoning): Focus on complex logic, DSA, and mathematics.

BEHAVIOR:
* When solving math, show the logic first, then the solution.
* When writing code, explain the algorithm's efficiency.
* Always check if the logic is understood before moving forward.
`;

export const MODES_CONFIG = {
  [MentorMode.TEACHING]: {
    label: 'Teaching Mode',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    description: 'Concepts in simple Urdu + English.'
  },
  [MentorMode.PROBLEM_SOLVER]: {
    label: 'Deep Problem Solver',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    description: 'Math, DSA, and Deep Logic reasoning.'
  },
  [MentorMode.DEBUGGING]: {
    label: 'Smart Debugging',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Fix errors and learn why they happen.'
  },
  [MentorMode.PROJECT_BUILDER]: {
    label: 'Project Builder',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    description: 'Build full apps from scratch.'
  },
  [MentorMode.CAREER_GROWTH]: {
    label: 'Career Growth',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    description: 'Interview prep and portfolio tips.'
  },
  [MentorMode.CODE_REVIEW]: {
    label: 'Code Review',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    description: 'Clean coding and optimization.'
  },
  [MentorMode.MOTIVATION]: {
    label: 'Motivation',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Stay focused and consistent.'
  }
};

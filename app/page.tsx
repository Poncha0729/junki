'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import WorkCard from '../components/WorkCard';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.contains('dark');
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
          }}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {document.documentElement.classList.contains('dark') ? (
            <SunIcon className="w-6 h-6 text-yellow-500" />
          ) : (
            <MoonIcon className="w-6 h-6 text-gray-700 dark:text-yellow-300" />
          )}
        </button>
      </div>
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            クリエイターのポートフォリオ
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            デザインと創造の世界へようこそ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <WorkCard 
            title="作品1" 
            description="説明文がここに表示されます"
            techStack={['Next.js', 'TypeScript', 'Tailwind CSS']}
            imageUrl="/placeholder.jpg"
          />
          <WorkCard 
            title="作品2" 
            description="説明文がここに表示されます"
            techStack={['React', 'Node.js', 'MongoDB']}
            imageUrl="/placeholder.jpg"
          />
          <WorkCard 
            title="作品3" 
            description="説明文がここに表示されます"
            techStack={['Vue.js', 'Python', 'Django']}
            imageUrl="/placeholder.jpg"
          />
        </div>
      </div>
    </main>
  );
}

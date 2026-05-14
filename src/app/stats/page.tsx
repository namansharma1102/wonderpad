import React from 'react'
import Navigation from '@/components/Navigation'

export default function StatsPage() {
  return (
    <div className="bg-background font-ui-body text-on-background min-h-screen pb-24 md:pb-0">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-12">
          <h1 className="font-display-lg text-[28px] font-bold text-on-surface mb-2">Reading Stats</h1>
          <p className="text-secondary font-ui-body">Track your progress and reading habits.</p>
        </div>

        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[#E8690A] text-4xl">bar_chart</span>
          </div>
          <h2 className="font-headline-md text-2xl font-bold text-on-surface mb-2">Coming Soon</h2>
          <p className="text-secondary max-w-md">
            We are building analytics to show you how many pages you read, your reading speed, and your daily streaks. Stay tuned!
          </p>
        </section>
      </main>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  // If already logged in, go straight to library
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/library')

  return (
    <div className="bg-background font-ui-body text-on-background antialiased">
      {/* TopAppBar */}
      <header className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 docked full-width top-0 sticky z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="text-xl font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2 font-inter antialiased">
            <span className="material-symbols-outlined">menu_book</span>
            <span>Wonderpad</span>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <Link className="text-orange-600 dark:text-orange-500 font-semibold hover:text-orange-700 transition-colors" href="/">Home</Link>
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-orange-700 transition-colors" href="#features">Features</Link>
            <Link className="text-slate-600 dark:text-slate-400 font-medium hover:text-orange-700 transition-colors" href="#pricing">Pricing</Link>
          </nav>
          <Link 
            href="/login"
            className="bg-primary hover:opacity-80 transition-opacity text-white px-6 py-2 rounded-full font-semibold text-sm"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-orange-50/50 to-background">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="font-display-lg text-display-lg text-on-background mb-6 max-w-3xl mx-auto">
              Read every book the way it deserves.
            </h1>
            <p className="font-ui-body text-headline-md text-secondary max-w-2xl mx-auto mb-10">
              Upload any PDF. Wonderpad turns it into a Wattpad-style reading experience — beautiful fonts, themes, and seamless chapter navigation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link 
                href="/login"
                className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-orange-200"
              >
                <span className="material-symbols-outlined">upload</span>
                Upload a Book
              </Link>
              <Link 
                href="#features"
                className="border-2 border-primary text-primary px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all"
              >
                See How It Works
              </Link>
            </div>

            {/* Reader Mockup */}
            <div className="relative max-w-[850px] mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-[#F5ECD7] rounded-xl border border-outline-variant shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9] flex flex-col">
                {/* Reader Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2D6C0]">
                  <span className="material-symbols-outlined text-[#5F4B32]">arrow_back</span>
                  <span className="font-semibold text-[#5F4B32] font-ui-body">The Great Gatsby — Chapter 1</span>
                  <span className="material-symbols-outlined text-[#5F4B32]">settings</span>
                </div>
                {/* Reader Content */}
                <div className="flex-1 overflow-y-auto p-12 text-left max-w-reader-width mx-auto">
                  <h2 className="font-reader-body text-4xl mb-8 text-[#3D3121] font-bold">Chapter 1</h2>
                  <p className="font-reader-body text-reader-body text-[#5F4B32] mb-6">
                    In my younger and more vulnerable years my father gave me some advice that I&apos;ve been turning over in my mind ever since. &ldquo;Whenever you feel like criticizing anyone,&rdquo; he told me, &ldquo;just remember that all the people in this world haven&apos;t had the advantages that you&apos;ve had.&rdquo;
                  </p>
                  <p className="font-reader-body text-reader-body text-[#5F4B32]">
                    He didn&apos;t say any more, but we&apos;ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I&apos;m inclined to reserve all judgements, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.
                  </p>
                </div>
                {/* Bottom Progress */}
                <div className="bg-white/20 backdrop-blur-sm p-4 flex items-center gap-4 px-12">
                  <span className="text-xs font-bold text-[#5F4B32] uppercase tracking-wider">12%</span>
                  <div className="flex-1 h-1 bg-[#5F4B32]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[12%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Row */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-start gap-4 p-8 rounded-2xl hover:bg-surface-container-low transition-colors duration-300 border border-transparent hover:border-slate-100">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background">Upload Any PDF</h3>
                <p className="font-ui-body text-secondary">Drag and drop your ebook. We extract every chapter automatically and optimize it for a clean, distraction-free reading experience.</p>
              </div>
              <div className="flex flex-col items-start gap-4 p-8 rounded-2xl hover:bg-surface-container-low transition-colors duration-300 border border-transparent hover:border-slate-100">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">auto_stories</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background">Wattpad-Style Reader</h3>
                <p className="font-ui-body text-secondary">Beautiful fonts, sepia/dark/light themes, font size control — read in comfort on any screen without the PDF zooming struggle.</p>
              </div>
              <div className="flex flex-col items-start gap-4 p-8 rounded-2xl hover:bg-surface-container-low transition-colors duration-300 border border-transparent hover:border-slate-100">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">bookmark</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background">Your Progress, Always Saved</h3>
                <p className="font-ui-body text-secondary">Pick up exactly where you left off, on any device. Your reading position and library sync across all your mobile and desktop devices.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Preview Section */}
        <section id="pricing" className="py-32 bg-[#0F172A] text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="font-display-lg text-display-lg mb-16">Three themes. Zero eye strain.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Light Mockup */}
              <div className="space-y-6">
                <div className="aspect-[9/16] bg-white rounded-3xl p-6 flex flex-col border-4 border-slate-700 shadow-2xl relative overflow-hidden">
                  <div className="h-4 w-24 bg-slate-100 rounded-full mx-auto mb-8"></div>
                  <div className="text-left space-y-4">
                    <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                    <div className="h-4 w-full bg-slate-100 rounded"></div>
                    <div className="h-4 w-full bg-slate-100 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                    <div className="h-4 w-full bg-slate-100 rounded"></div>
                  </div>
                </div>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-slate-400">Daylight Mode</p>
              </div>
              {/* Sepia Mockup */}
              <div className="space-y-6 md:scale-110 z-10">
                <div className="aspect-[9/16] bg-[#F5ECD7] rounded-3xl p-6 flex flex-col border-4 border-slate-700 shadow-2xl relative overflow-hidden">
                  <div className="h-4 w-24 bg-[#E2D6C0] rounded-full mx-auto mb-8"></div>
                  <div className="text-left space-y-4">
                    <div className="h-6 w-3/4 bg-[#E2D6C0] rounded"></div>
                    <div className="h-4 w-full bg-[#E2D6C0]/50 rounded"></div>
                    <div className="h-4 w-full bg-[#E2D6C0]/50 rounded"></div>
                    <div className="h-4 w-5/6 bg-[#E2D6C0]/50 rounded"></div>
                    <div className="h-4 w-full bg-[#E2D6C0]/50 rounded"></div>
                  </div>
                </div>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">Classic Sepia</p>
              </div>
              {/* Dark Mockup */}
              <div className="space-y-6">
                <div className="aspect-[9/16] bg-[#1A1A1A] rounded-3xl p-6 flex flex-col border-4 border-slate-700 shadow-2xl relative overflow-hidden">
                  <div className="h-4 w-24 bg-slate-800 rounded-full mx-auto mb-8"></div>
                  <div className="text-left space-y-4">
                    <div className="h-6 w-3/4 bg-slate-800 rounded"></div>
                    <div className="h-4 w-full bg-slate-800/50 rounded"></div>
                    <div className="h-4 w-full bg-slate-800/50 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-800/50 rounded"></div>
                    <div className="h-4 w-full bg-slate-800/50 rounded"></div>
                  </div>
                </div>
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-slate-400">Night Mode</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30"></div>
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="font-display-lg text-display-lg text-on-background mb-8">Start reading better today.</h2>
            <div className="p-12 bg-surface-container-lowest rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-200">
                  <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                </div>
                <p className="text-headline-md font-ui-body text-secondary">Join 20,000+ readers who transformed their PDF collection into a portable digital library.</p>
                <Link
                  href="/signup"
                  className="bg-primary text-white px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform"
                >
                  Create Your Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 full-width py-12">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-500">Wonderpad</div>
            <p className="text-sm font-inter text-slate-500 dark:text-slate-400">Read the new way.</p>
          </div>
          <div className="flex gap-8">
            <Link className="text-sm font-inter text-slate-500 hover:text-slate-900 dark:hover:text-slate-200" href="#">Privacy</Link>
            <Link className="text-sm font-inter text-slate-500 hover:text-slate-900 dark:hover:text-slate-200" href="#">Terms</Link>
            <Link className="text-sm font-inter text-slate-500 hover:text-slate-900 dark:hover:text-slate-200" href="#">Support</Link>
          </div>
          <div className="text-sm font-inter text-slate-500 dark:text-slate-400">
            © 2024 Wonderpad. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

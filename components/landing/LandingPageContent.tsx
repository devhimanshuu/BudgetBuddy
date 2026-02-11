"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Lock, PieChart, Shield, Smartphone, Zap, Coins, TrendingUp, Wallet, CreditCard, Sparkles, Trophy, Target, Bell, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import FeatureCard from "@/components/landing/FeatureCard";
import { motion } from "framer-motion";
import { MovingBorder } from "@/components/landing/MovingBorder";

import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LandingPageContent() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Map themes to their specific image URLs
    const themeImages: Record<string, string> = {
        dark: "v1770181853/dashboard-dark_ocosok.png",
        light: "v1770181879/dashboard-light_xvrjns.png",
        solaris: "v1770577023/solaris_pibuwk.png",
        cyberpunk: "v1770577013/cyberpunk_h4rvkt.png",
        midnight: "v1770577001/midnight_gnuolc.png",
        forest: "v1770576992/forest_kaqil7.png",
    };

    // Use resolvedTheme if theme is 'system' or not set
    const activeTheme = (theme === "system" ? resolvedTheme : theme) || "dark";
    const currentThemeImage = themeImages[activeTheme] || themeImages.dark;

    return (
        <div className="flex min-h-screen flex-col text-foreground selection:bg-primary/20 relative overflow-x-hidden">
            <ParticlesBackground />

            {/* Navbar */}
            <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/40 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/20">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6 3xl:h-24 4xl:h-32 3xl:px-12 4xl:px-20">
                    <div className="flex items-center gap-2">
                        <Logo />
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <ThemeCustomizer />
                        <Link href="/sign-in" className="hidden md:block">
                            <Button variant="ghost" className="text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                                Log In
                            </Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button className="font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300 text-sm px-4 md:text-base md:px-6">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative z-10">
                {/* Hero Section */}
                <section className="relative overflow-visible pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 3xl:pt-60 3xl:pb-48 4xl:pt-72 4xl:pb-60">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 blur-[120px] pointer-events-none opacity-70 dark:opacity-20 bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-amber-500/30 dark:from-primary/40 dark:via-purple-500/20 dark:to-amber-500/10" />

                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <div className="space-y-4 max-w-4xl relative">
                                {/* Floating Elements */}
                                <div className="absolute -top-6 -left-4 md:-top-12 md:-left-12 opacity-30 animate-float">
                                    <Coins className="w-8 h-8 md:w-12 md:h-12 text-amber-500" />
                                </div>
                                <div className="absolute -bottom-10 -right-4 md:-bottom-16 md:-right-16 opacity-30 animate-float" style={{ animationDelay: '1s' }}>
                                    <PieChart className="w-10 h-10 md:w-14 md:h-14 text-emerald-500" />
                                </div>
                                <div className="absolute top-10 -right-8 md:top-20 md:-right-24 opacity-20 animate-float" style={{ animationDelay: '2s' }}>
                                    <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-blue-500" />
                                </div>
                                <div className="absolute -bottom-20 -left-8 md:-bottom-24 md:-left-20 opacity-20 animate-float" style={{ animationDelay: '3s' }}>
                                    <Wallet className="w-8 h-8 md:w-12 md:h-12 text-purple-500" />
                                </div>
                                <div className="absolute top-1/2 -left-10 md:-left-16 opacity-30 animate-float" style={{ animationDelay: '4s' }}>
                                    <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-rose-500/80" />
                                </div>
                                <div className="absolute top-10/6 -right-10 md:-right-20 opacity-30 animate-float" style={{ animationDelay: '1.5s' }}>
                                    <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-amber-300/80" />
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <MovingBorder
                                        duration={3500}
                                        containerClassName="w-48 h-9 mb-6 mx-auto shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_-2px_rgba(16,185,129,0.6)] transition-all duration-300"
                                        className="text-emerald-500 font-medium flex items-center justify-center px-4"
                                    >
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                        AI Financial Analyst
                                    </MovingBorder>
                                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl 3xl:text-8xl 4xl:text-[10rem] drop-shadow-sm text-foreground">
                                        Master Your Money <br />
                                        <motion.span
                                            initial={{ backgroundPosition: "0% 50%" }}
                                            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                            className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-[length:200%_auto] bg-clip-text text-transparent"
                                        >
                                            Powered by AI
                                        </motion.span>
                                    </h1>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl 3xl:text-3xl 4xl:text-4xl 3xl:max-w-[1000px] 4xl:max-w-[1300px] leading-relaxed"
                                >
                                    Unlock the full potential of your finances. Precise tracking, intelligent forecasting, and personalized insights to help you <span className="text-primary font-semibold">build wealth faster</span>.
                                </motion.p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-4 pt-4 w-full px-6 sm:px-0"
                            >
                                <Link href="/sign-up" className="w-auto">
                                    <Button size="lg" className="h-11 px-8 min-w-[200px] text-sm md:h-14 md:px-8 md:text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 rounded-full 3xl:h-20 3xl:px-12 3xl:text-2xl 4xl:h-24 4xl:px-16 4xl:text-3xl">
                                        Start for Free <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 3xl:h-8 3xl:w-8" />
                                    </Button>
                                </Link>
                                <Link href="#features" className="w-auto">
                                    <Button size="lg" variant="outline" className="h-11 px-8 min-w-[200px] text-sm md:h-14 md:px-8 md:text-lg rounded-full border-border/40 bg-muted/50 hover:bg-muted text-foreground transition-all 3xl:h-20 3xl:px-12 3xl:text-2xl 4xl:h-24 4xl:px-16 4xl:text-3xl">
                                        Explore Features
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Dashboard Preview Mockup */}
                        <div className="relative mx-auto mt-20 md:mt-32 3xl:mt-40 4xl:mt-52 w-full max-w-6xl 3xl:max-w-[1400px] 4xl:max-w-[1800px] perspective-1000 group">
                            <div className="rounded-xl border border-border/50 bg-background/50 p-2 shadow-2xl backdrop-blur-md lg:p-4 3xl:p-8 4xl:p-12 transform transition-transform duration-700 hover:rotate-x-2">
                                <div className="aspect-[16/9] overflow-hidden rounded-lg border border-border/50 bg-background shadow-inner relative">
                                    {mounted && (
                                        <Image
                                            key={activeTheme}
                                            src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto:best,w_2000,c_limit,e_sharpen:100,e_improve/${currentThemeImage}`}
                                            alt={`${activeTheme} Dashboard Preview`}
                                            fill
                                            className="object-cover transition-all duration-700 group-hover:scale-[1.02]"
                                            priority
                                            unoptimized
                                        />
                                    )}
                                    {!mounted && (
                                        <div className="absolute inset-0 bg-muted animate-pulse" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -left-10 -z-10 h-72 w-72 rounded-full bg-amber-500/20 blur-[100px]" />
                            <div className="absolute -top-10 -right-10 -z-10 h-72 w-72 rounded-full bg-purple-500/20 blur-[100px]" />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="container px-4 py-24 md:px-6 lg:py-32 relative z-10 max-w-7xl 2xl:max-w-[1600px] 4xl:max-w-[2000px] mx-auto transition-all duration-300">
                    <div className="mb-16 text-center">
                        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
                            Features
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl mb-4 text-foreground">
                            Everything you need to grow
                        </h2>
                        <p className="mt-4 text-xl 3xl:text-3xl 4xl:text-4xl text-muted-foreground max-w-2xl 3xl:max-w-4xl mx-auto pl-2 pr-2">
                            Detailed analytics, privacy by default, and AI-driven insights wrapped in a beautiful interface.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            delay={0.1}
                            icon={<Zap className="h-full w-full" />}
                            title="AI Financial Analyst"
                            description="Chat with your finances. Ask questions like 'How much did I spend on food this month?' and get instant answers."
                        />
                        <FeatureCard
                            delay={0.2}
                            icon={<BarChart3 className="h-full w-full" />}
                            title="Smart Analytics"
                            description="Visualize your spending patterns with beautiful heatmaps, trend lines, and category breakdowns."
                        />
                        <FeatureCard
                            delay={0.3}
                            icon={<Shield className="h-full w-full" />}
                            title="Bank-Grade Privacy"
                            description="Your data is yours. We use advanced encryption and offer a Privacy Mode to mask sensitive numbers in public."
                        />
                        <FeatureCard
                            delay={0.4}
                            icon={<PieChart className="h-full w-full" />}
                            title="Budgeting Made Easy"
                            description="Set monthly budgets for categories and track your progress in real-time to avoid overspending."
                        />
                        <FeatureCard
                            delay={0.5}
                            icon={<Trophy className="h-full w-full" />}
                            title="Gamified Finance"
                            description="Stay motivated with steaks, levels, and achievements. Earn rewards for hitting your financial goals."
                        />
                        <FeatureCard
                            delay={0.6}
                            icon={<Lock className="h-full w-full" />}
                            title="Secure Authentication"
                            description="Powered by Clerk for seamless and secure sign-in options including Google, GitHub, and more."
                        />
                        <FeatureCard
                            delay={0.7}
                            icon={<Target className="h-full w-full" />}
                            title="Smart Goal Setting"
                            description="Create custom savings targets for holidays, gadgets, or emergency funds and track your progress visually."
                        />
                        <FeatureCard
                            delay={0.8}
                            icon={<Bell className="h-full w-full" />}
                            title="Bill Reminders"
                            description="Get timely notifications for upcoming bills and subscription renewals so you never pay late fees again."
                        />
                        <FeatureCard
                            delay={0.9}
                            icon={<FileText className="h-full w-full" />}
                            title="Export & Reports"
                            description="Need to share data with your accountant? Export your financial reports in CSV, PDF, or Excel formats instantly."
                        />
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="bg-muted/30 py-24 relative border-y border-border/40">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16">
                            <div className="inline-block rounded-lg bg-blue-500/10 px-3 py-1 text-sm text-blue-500 mb-4">
                                Process
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl 3xl:text-7xl 4xl:text-8xl text-foreground">How BudgetBuddy Works</h2>
                            <p className="mt-4 text-xl 3xl:text-3xl 4xl:text-4xl text-muted-foreground">Simple steps to financial freedom.</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-10 3xl:top-16 4xl:top-20 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary/30 z-0" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-20 h-20 3xl:w-32 3xl:h-32 4xl:w-40 4xl:h-40 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl 3xl:text-5xl 4xl:text-6xl font-bold text-foreground group-hover:scale-110 transition-transform">1</span>
                                    <div className="absolute -bottom-2 bg-purple-500 text-xs 3xl:text-sm 4xl:text-base font-bold px-2 py-0.5 rounded text-white">STEP</div>
                                </div>
                                <h3 className="text-xl 3xl:text-3xl 4xl:text-4xl font-bold text-foreground mb-2">Create Account</h3>
                                <p className="text-muted-foreground 3xl:text-xl 4xl:text-2xl">Simply sign up and manually input or import your financial data securely.</p>
                            </div>

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-20 h-20 3xl:w-32 3xl:h-32 4xl:w-40 4xl:h-40 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl 3xl:text-5xl 4xl:text-6xl font-bold text-foreground group-hover:scale-110 transition-transform">2</span>
                                    <div className="absolute -bottom-2 bg-blue-500 text-xs 3xl:text-sm 4xl:text-base font-bold px-2 py-0.5 rounded text-white">STEP</div>
                                </div>
                                <h3 className="text-xl 3xl:text-3xl 4xl:text-4xl font-bold text-foreground mb-2">Analyze Spending</h3>
                                <p className="text-muted-foreground 3xl:text-xl 4xl:text-2xl">Our AI analyzes your transactions to categorize them and find savings.</p>
                            </div>

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-20 h-20 3xl:w-32 3xl:h-32 4xl:w-40 4xl:h-40 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl 3xl:text-5xl 4xl:text-6xl font-bold text-foreground group-hover:scale-110 transition-transform">3</span>
                                    <div className="absolute -bottom-2 bg-emerald-500 text-xs 3xl:text-sm 4xl:text-base font-bold px-2 py-0.5 rounded text-white">STEP</div>
                                </div>
                                <h3 className="text-xl 3xl:text-3xl 4xl:text-4xl font-bold text-foreground mb-2">Achieve Goals</h3>
                                <p className="text-muted-foreground 3xl:text-xl 4xl:text-2xl">Set budgets, track limits, and watch your savings grow over time.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="border-t border-border/40 bg-gradient-to-b from-background to-muted/50 py-24 relative overflow-hidden">
                    {/* Background glow for CTA */}
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="container px-4 md:px-6 relative z-10">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl text-foreground">Ready to take control?</h2>
                            <p className="mx-auto max-w-[600px] 3xl:max-w-[900px] text-muted-foreground md:text-xl 3xl:text-3xl 4xl:text-4xl">
                                Be one of the first to master their financial life with Budget Buddy.
                            </p>
                            <Link href="/sign-up">
                                <Button size="lg" className="h-14 mt-6 px-10 text-lg font-bold shadow-2xl bg-foreground text-background hover:bg-foreground/90 rounded-full transition-transform hover:scale-105 3xl:h-20 3xl:px-16 3xl:text-2xl 4xl:h-24 4xl:px-20 4xl:text-3xl">
                                    Create Free Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 bg-background/80 backdrop-blur-md py-6 relative z-10">
                <div className="container flex flex-col md:grid md:grid-cols-3 items-center gap-6 px-4 md:px-6">
                    <div className="flex justify-center md:justify-start w-full">
                        <Logo />
                    </div>

                    <div className="flex justify-center w-full">
                        <div className="relative flex items-center gap-1 text-sm font-mono select-none cursor-default px-4 py-2 rounded-full border border-border/50 overflow-hidden group/footer-badge shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_-2px_rgba(239,68,68,0.6)] transition-all duration-300">
                            {/* The Moving Border Beam - Applied to Parent */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_180deg,#ef4444_270deg,transparent_360deg)] animate-spin-slow" style={{ width: '200%', height: '200%', left: '-50%', top: '-50%' }} />

                            {/* Inner Background for Contrast */}
                            <div className="absolute inset-[1px] bg-background/95 rounded-full z-0" />

                            <div className="relative z-10 flex items-center gap-1">
                                <span className="text-blue-500">&lt;</span>
                                <span className="text-foreground font-semibold">CreatedBy</span>
                                <span className="text-purple-500 pl-1">dev</span>
                                <span className="text-blue-500">=</span>
                                <span className="text-orange-500">&quot;</span>
                                <Link href="https://www.linkedin.com/in/himanshu-guptaa/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-all font-bold">
                                    <span className="text-orange-500">Himanshu Gupta</span>
                                </Link>
                                <span className="text-orange-500">&quot;</span>
                                <span className="text-blue-500">/&gt;</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end w-full">
                        <p className="text-sm text-muted-foreground text-center md:text-right">
                            © {new Date().getFullYear()} BudgetBuddy. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div >
    );
}

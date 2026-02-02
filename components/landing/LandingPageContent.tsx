"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Lock, PieChart, Shield, Smartphone, Zap, Coins } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import FeatureCard from "@/components/landing/FeatureCard";
import { motion } from "framer-motion";

import { ThemeSwitcherBtn } from "@/components/ThemeSwitcherBtn";

export default function LandingPageContent() {
    return (
        <div className="flex min-h-screen flex-col text-foreground selection:bg-primary/20 relative overflow-x-hidden">
            <ParticlesBackground />

            {/* Navbar */}
            <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/40 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/20">
                <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <Logo />
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <ThemeSwitcherBtn />
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
                <section className="relative overflow-visible pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 blur-[120px] pointer-events-none opacity-70 dark:opacity-20 bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-amber-500/30 dark:from-primary/40 dark:via-purple-500/20 dark:to-amber-500/10" />

                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <div className="space-y-4 max-w-4xl relative">
                                {/* Floating Elements */}
                                <div className="absolute -top-12 -left-12 opacity-50 animate-bounce delay-1000 hidden lg:block">
                                    <Coins className="w-12 h-12 text-amber-500 rotate-12" />
                                </div>
                                <div className="absolute -bottom-8 -right-12 opacity-50 animate-bounce delay-700 hidden lg:block">
                                    <PieChart className="w-10 h-10 text-emerald-500 -rotate-12" />
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="inline-flex items-center rounded-full border border-border/40 bg-muted/50 px-3 py-1 text-sm font-medium text-emerald-500 border-emerald-500 mb-6 backdrop-blur-sm">
                                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                        AI Financial Analyst
                                    </div>
                                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-sm text-foreground">
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
                                    className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl leading-relaxed"
                                >
                                    Unlock the full potential of your finances. Precise tracking, intelligent forecasting, and personalized insights to help you <span className="text-primary font-semibold">build wealth faster</span>.
                                </motion.p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="flex flex-col gap-4 min-[400px]:flex-row pt-4"
                            >
                                <Link href="/sign-up">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 rounded-full">
                                        Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="#features">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-border/40 bg-muted/50 hover:bg-muted text-foreground transition-all">
                                        Explore Features
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Dashboard Preview Mockup */}
                        <div className="relative mt-20 w-full max-w-6xl perspective-1000 group">
                            <div className="rounded-xl border border-border/50 bg-background/50 p-2 shadow-2xl backdrop-blur-md lg:p-4 transform transition-transform duration-700 hover:rotate-x-2">
                                <div className="aspect-[16/9] overflow-hidden rounded-lg border border-border/50 bg-background shadow-inner relative">
                                    {/* Abstract Representation of Dashboard for faster LCP */}
                                    <div className="grid h-full grid-cols-4 grid-rows-3 gap-4 p-6 opacity-90 overflow-hidden">
                                        <div className="col-span-1 row-span-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-pulse" />
                                        <div className="col-span-1 row-span-1 rounded-lg bg-rose-500/10 border border-rose-500/20" />
                                        <div className="col-span-1 row-span-1 rounded-lg bg-blue-500/10 border border-blue-500/20" />
                                        <div className="col-span-1 row-span-3 rounded-lg bg-muted/50 border border-border/40 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" style={{ animationDuration: '3s' }} />
                                        </div>
                                        <div className="col-span-3 row-span-2 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center relative overflow-hidden group-hover:border-primary/30 transition-colors">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] group-hover:animate-shine" />
                                            <p className="text-muted-foreground/30 font-medium text-2xl">Financial Dashboard Preview</p>
                                        </div>
                                    </div>
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
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
                            Everything you need to grow
                        </h2>
                        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                            Detailed analytics, privacy by default, and AI-driven insights wrapped in a beautiful interface.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5">
                        <FeatureCard
                            delay={0.1}
                            icon={<Zap className="h-6 w-6" />}
                            title="AI Financial Analyst"
                            description="Chat with your finances. Ask questions like 'How much did I spend on food this month?' and get instant answers."
                        />
                        <FeatureCard
                            delay={0.2}
                            icon={<BarChart3 className="h-6 w-6" />}
                            title="Smart Analytics"
                            description="Visualize your spending patterns with beautiful heatmaps, trend lines, and category breakdowns."
                        />
                        <FeatureCard
                            delay={0.3}
                            icon={<Shield className="h-6 w-6" />}
                            title="Bank-Grade Privacy"
                            description="Your data is yours. We use advanced encryption and offer a Privacy Mode to mask sensitive numbers in public."
                        />
                        <FeatureCard
                            delay={0.4}
                            icon={<PieChart className="h-6 w-6" />}
                            title="Budgeting Made Easy"
                            description="Set monthly budgets for categories and track your progress in real-time to avoid overspending."
                        />
                        <FeatureCard
                            delay={0.5}
                            icon={<Smartphone className="h-6 w-6" />}
                            title="Mobile First Design"
                            description="Manage your money on the go with our fully responsive interface designed for any device."
                        />
                        <FeatureCard
                            delay={0.6}
                            icon={<Lock className="h-6 w-6" />}
                            title="Secure Authentication"
                            description="Powered by Clerk for seamless and secure sign-in options including Google, GitHub, and more."
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
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">How BudgetBuddy Works</h2>
                            <p className="mt-4 text-xl text-muted-foreground">Simple steps to financial freedom.</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent border-t border-dashed border-border/40" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-24 h-24 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl font-bold text-foreground group-hover:scale-110 transition-transform">1</span>
                                    <div className="absolute -bottom-2 bg-purple-500 text-xs font-bold px-2 py-0.5 rounded text-white">STEP</div>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Create Account</h3>
                                <p className="text-muted-foreground">Simply sign up and manually input or import your financial data securely.</p>
                            </div>

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-24 h-24 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl font-bold text-foreground group-hover:scale-110 transition-transform">2</span>
                                    <div className="absolute -bottom-2 bg-blue-500 text-xs font-bold px-2 py-0.5 rounded text-white">STEP</div>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Analyze Spending</h3>
                                <p className="text-muted-foreground">Our AI analyzes your transactions to categorize them and find savings.</p>
                            </div>

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-24 h-24 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-3xl font-bold text-foreground group-hover:scale-110 transition-transform">3</span>
                                    <div className="absolute -bottom-2 bg-emerald-500 text-xs font-bold px-2 py-0.5 rounded text-white">STEP</div>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Achieve Goals</h3>
                                <p className="text-muted-foreground">Set budgets, track limits, and watch your savings grow over time.</p>
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
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">Ready to take control?</h2>
                            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                                Be one of the first to master their financial life with Budget Buddy.
                            </p>
                            <Link href="/sign-up">
                                <Button size="lg" className="h-14 mt-6 px-10 text-lg font-bold shadow-2xl bg-foreground text-background hover:bg-foreground/90 rounded-full transition-transform hover:scale-105">
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
                        <div className="flex items-center gap-1 text-sm font-mono opacity-80 hover:opacity-100 select-none cursor-default bg-muted/50 px-3 py-1.5 rounded-full border border-border/50 hover:border-border transition-colors">
                            <span className="text-blue-500">&lt;</span>
                            <span className="text-foreground font-semibold">CreatedBy</span>
                            <span className="text-purple-500 pl-1">dev</span>
                            <span className="text-blue-500">=</span>
                            <span className="text-orange-500">&quot;</span>
                            <Link href="https://www.linkedin.com/in/himanshu-guptaa/" target="_blank" rel="noopener noreferrer" className="hover:underline decoration-orange-500/50 underline-offset-2">
                                <span className="text-orange-500">Himanshu Gupta</span>
                            </Link>
                            <span className="text-orange-500">&quot;</span>
                            <span className="text-blue-500">/&gt;</span>
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

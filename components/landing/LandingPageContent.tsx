"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Lock,
  PieChart,
  Shield,
  ShieldCheck,
  Zap,
  Coins,
  TrendingUp,
  Wallet,
  CreditCard,
  Sparkles,
  Trophy,
  Command,
  Eye,
  Target,
  FileText,
  Globe,
  Brain,
  Gem,
  Crown,
  Radar,
  Users,
  Scan,
  LineChart,
  WifiOff,
  Plus,
  Key,
  Landmark,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";
import ParticlesBackground from "@/components/landing/ParticlesBackground";
import FeatureCard from "@/components/landing/FeatureCard";
import { motion } from "framer-motion";
import { MovingBorder } from "@/components/landing/MovingBorder";
import { cn } from "@/lib/utils";

import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { CustomCursor } from "@/components/CustomCursor";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

// FAQ Item Component for handling independent accordion states
const FAQItem = ({ item }: { item: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-3xl border transition-all duration-300 overflow-hidden",
        isOpen
          ? "bg-muted/30 border-primary/30 shadow-2xl scale-[1.02]"
          : "bg-muted/5 border-border/40 hover:bg-muted/10 hover:border-border/60",
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 md:p-8 flex items-center justify-between gap-4 text-left group"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-3 rounded-2xl bg-background border border-border/50 shadow-sm transition-transform",
              isOpen && "scale-110 shadow-primary/20 border-primary/20",
            )}
          >
            {item.icon}
          </div>
          <span className="font-black text-lg md:text-xl text-foreground leading-tight tracking-tight">
            {item.q}
          </span>
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border border-border/50 transition-all duration-300",
            isOpen
              ? "rotate-180 bg-primary border-primary text-primary-foreground"
              : "group-hover:bg-muted",
          )}
        >
          <Plus
            className={cn(
              "w-5 h-5 transition-transform",
              isOpen ? "rotate-45" : "",
            )}
          />
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
        className="overflow-hidden"
      >
        <div className="px-6 md:px-8 pb-8 flex gap-4">
          {/* Vertical connector line */}
          <div className="w-1 md:w-1.5 flex-shrink-0 bg-primary/20 rounded-full mb-2 ml-4 md:ml-6" />
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-medium pl-4">
            {item.a}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function LandingPageContent() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Premium geometric animal SVG silhouettes for persona cards
  const AnimalSilhouette = ({
    type,
    className,
  }: {
    type: string;
    className?: string;
  }) => {
    const svgProps = {
      className: cn("absolute pointer-events-none select-none", className),
      viewBox: "0 0 200 200",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    };
    // Shared SVG filter for soft glow effect behind strokes
    const glowFilter = (
      <defs>
        <filter
          id={`glow-${type}`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    );
    switch (type) {
      case "fox":
        return (
          <svg {...svgProps}>
            {glowFilter}
            {/* Soft filled shape beneath for depth */}
            <path
              d="M60 40 L100 10 L140 40 L135 90 L120 110 L100 120 L80 110 L65 90 Z"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M60 40 L50 10 L75 30 Z"
              fill="currentColor"
              opacity="0.04"
            />
            <path
              d="M140 40 L150 10 L125 30 Z"
              fill="currentColor"
              opacity="0.04"
            />
            {/* Glow layer */}
            <g filter={`url(#glow-${type})`} opacity="0.5">
              <path
                d="M60 40 L100 10 L140 40 L135 90 L120 110 L100 120 L80 110 L65 90 Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
            {/* Crisp detail layer */}
            <path
              d="M60 40 L100 10 L140 40 L135 90 L120 110 L100 120 L80 110 L65 90 Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity="0.7"
            />
            {/* Inner face structure */}
            <path
              d="M65 90 L80 75 L90 85 L100 70 L110 85 L120 75 L135 90"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            {/* Ears - triangular */}
            <path
              d="M60 40 L50 10 L75 30"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity="0.6"
            />
            <path
              d="M140 40 L150 10 L125 30"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Inner ear detail */}
            <path
              d="M62 36 L56 18 L72 32"
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.25"
            />
            <path
              d="M138 36 L144 18 L128 32"
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.25"
            />
            {/* Eyes - almond shaped */}
            <ellipse
              cx="82"
              cy="65"
              rx="5"
              ry="4"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <ellipse
              cx="118"
              cy="65"
              rx="5"
              ry="4"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <circle cx="83" cy="65" r="1.5" fill="currentColor" opacity="0.4" />
            <circle
              cx="119"
              cy="65"
              r="1.5"
              fill="currentColor"
              opacity="0.4"
            />
            {/* Nose */}
            <path
              d="M95 88 L100 94 L105 88 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              fillOpacity="0.1"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Whiskers */}
            <line
              x1="78"
              y1="80"
              x2="55"
              y2="75"
              stroke="currentColor"
              strokeWidth="0.7"
              opacity="0.25"
            />
            <line
              x1="78"
              y1="84"
              x2="55"
              y2="85"
              stroke="currentColor"
              strokeWidth="0.7"
              opacity="0.25"
            />
            <line
              x1="122"
              y1="80"
              x2="145"
              y2="75"
              stroke="currentColor"
              strokeWidth="0.7"
              opacity="0.25"
            />
            <line
              x1="122"
              y1="84"
              x2="145"
              y2="85"
              stroke="currentColor"
              strokeWidth="0.7"
              opacity="0.25"
            />
            {/* Tail sweep - elegant curve */}
            <path
              d="M25 175 Q50 120 80 140 Q105 155 100 185"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.35"
              strokeLinecap="round"
            />
            <path
              d="M28 172 Q52 125 78 142"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="none"
              opacity="0.15"
            />
          </svg>
        );
      case "squirrel":
        return (
          <svg {...svgProps}>
            {glowFilter}
            {/* Filled body silhouette */}
            <path
              d="M90 80 Q70 60 80 40 Q90 25 105 35 Q115 25 125 40 Q130 55 120 70 L130 90 Q135 110 120 120 L90 120 Q75 115 75 100 Z"
              fill="currentColor"
              opacity="0.05"
            />
            {/* Filled tail silhouette */}
            <path
              d="M120 120 Q155 100 165 70 Q170 45 155 30 Q140 20 135 40 Q145 55 140 80 Q138 95 130 110 Z"
              fill="currentColor"
              opacity="0.04"
            />
            {/* Glow layer */}
            <g filter={`url(#glow-${type})`} opacity="0.45">
              <path
                d="M90 80 Q70 60 80 40 Q90 25 105 35 Q115 25 125 40 Q130 55 120 70 L130 90 Q135 110 120 120 L90 120 Q75 115 75 100 Z"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M120 120 Q155 100 165 70 Q170 45 155 30 Q140 20 135 40 Q145 55 140 80 Q138 95 130 110"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </g>
            {/* Crisp body */}
            <path
              d="M90 80 Q70 60 80 40 Q90 25 105 35 Q115 25 125 40 Q130 55 120 70 L130 90 Q135 110 120 120 L90 120 Q75 115 75 100 Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              opacity="0.65"
            />
            {/* Signature bushy tail */}
            <path
              d="M120 120 Q155 100 165 70 Q170 45 155 30 Q140 20 135 40 Q145 55 140 80 Q138 95 130 110"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              strokeLinecap="round"
            />
            {/* Tail fluff texture */}
            <path
              d="M155 30 Q162 38 158 48"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <path
              d="M165 70 Q158 76 152 72"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <path
              d="M148 50 Q155 55 152 62"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            {/* Eye - big and expressive */}
            <circle
              cx="100"
              cy="50"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <circle cx="101" cy="49" r="2" fill="currentColor" opacity="0.5" />
            <circle
              cx="103"
              cy="47"
              r="0.8"
              fill="currentColor"
              opacity="0.3"
            />
            {/* Rounded ears */}
            <path
              d="M85 35 Q80 22 90 28"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.5"
            />
            <path
              d="M115 35 Q120 22 110 28"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.5"
            />
            {/* Little paws */}
            <path
              d="M88 105 Q80 98 78 108 Q80 114 86 112"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            {/* Acorn it's holding */}
            <ellipse
              cx="82"
              cy="105"
              rx="5"
              ry="4"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.35"
            />
            <path
              d="M77 102 Q82 97 87 102"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            {/* Ground accent */}
            <line
              x1="60"
              y1="125"
              x2="150"
              y2="125"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.12"
              strokeDasharray="6 4"
            />
          </svg>
        );
      case "peacock":
        return (
          <svg {...svgProps}>
            {glowFilter}
            {/* Filled fan backdrop */}
            <path
              d="M100 95 L30 20 L20 55 L18 90 Z"
              fill="currentColor"
              opacity="0.03"
            />
            <path
              d="M100 95 L170 20 L180 55 L182 90 Z"
              fill="currentColor"
              opacity="0.03"
            />
            {/* Glow layer - fan shape */}
            <g filter={`url(#glow-${type})`} opacity="0.4">
              <path
                d="M100 90 Q60 45 30 18"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M100 90 Q140 45 170 18"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M100 90 Q45 55 20 55"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M100 90 Q155 55 180 55"
                stroke="currentColor"
                strokeWidth="1"
              />
            </g>
            {/* Crisp body */}
            <path
              d="M95 135 Q85 115 90 95 Q95 78 100 72 Q105 78 110 95 Q115 115 105 135"
              stroke="currentColor"
              strokeWidth="1.8"
              opacity="0.55"
            />
            <path
              d="M95 135 Q85 115 90 95 Q95 78 100 72 Q105 78 110 95 Q115 115 105 135"
              fill="currentColor"
              opacity="0.04"
            />
            {/* Head */}
            <circle
              cx="100"
              cy="65"
              r="9"
              stroke="currentColor"
              strokeWidth="1.8"
              opacity="0.7"
            />
            <circle cx="100" cy="65" r="9" fill="currentColor" opacity="0.05" />
            {/* Crown plumes */}
            <line
              x1="100"
              y1="56"
              x2="100"
              y2="40"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <circle
              cx="100"
              cy="38"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.08"
              opacity="0.6"
            />
            <line
              x1="94"
              y1="57"
              x2="88"
              y2="43"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <circle
              cx="87"
              cy="41"
              r="2"
              stroke="currentColor"
              strokeWidth="1"
              fill="currentColor"
              fillOpacity="0.06"
              opacity="0.5"
            />
            <line
              x1="106"
              y1="57"
              x2="112"
              y2="43"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <circle
              cx="113"
              cy="41"
              r="2"
              stroke="currentColor"
              strokeWidth="1"
              fill="currentColor"
              fillOpacity="0.06"
              opacity="0.5"
            />
            {/* Fan tail - 8 feathers radiating */}
            {/* Left feathers */}
            <path
              d="M100 90 Q60 45 30 18"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            <circle
              cx="28"
              cy="15"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.4"
            />
            <circle
              cx="28"
              cy="15"
              r="2.5"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <circle
              cx="28"
              cy="15"
              r="2.5"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M100 90 Q45 55 20 55"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            <circle
              cx="17"
              cy="55"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.4"
            />
            <circle
              cx="17"
              cy="55"
              r="2.5"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <circle
              cx="17"
              cy="55"
              r="2.5"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M100 90 Q52 78 20 90"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            <circle
              cx="17"
              cy="91"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.4"
            />
            <circle
              cx="17"
              cy="91"
              r="2.5"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <circle
              cx="17"
              cy="91"
              r="2.5"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M100 90 Q65 35 45 10"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            {/* Right feathers - mirror */}
            <path
              d="M100 90 Q140 45 170 18"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            <circle
              cx="172"
              cy="15"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.4"
            />
            <circle
              cx="172"
              cy="15"
              r="2.5"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <circle
              cx="172"
              cy="15"
              r="2.5"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M100 90 Q155 55 180 55"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            <circle
              cx="183"
              cy="55"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.4"
            />
            <circle
              cx="183"
              cy="55"
              r="2.5"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <circle
              cx="183"
              cy="55"
              r="2.5"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M100 90 Q148 78 180 90"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.45"
            />
            <circle
              cx="183"
              cy="91"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.4"
            />
            <circle
              cx="183"
              cy="91"
              r="2.5"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            <circle
              cx="183"
              cy="91"
              r="2.5"
              fill="currentColor"
              opacity="0.06"
            />
            <path
              d="M100 90 Q135 35 155 10"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            {/* Eye detail */}
            <circle
              cx="97"
              cy="64"
              r="1.5"
              fill="currentColor"
              opacity="0.35"
            />
          </svg>
        );
      case "owl":
        return (
          <svg {...svgProps}>
            {glowFilter}
            {/* Filled head backdrop */}
            <circle
              cx="100"
              cy="80"
              r="48"
              fill="currentColor"
              opacity="0.04"
            />
            {/* Glow layer */}
            <g filter={`url(#glow-${type})`} opacity="0.4">
              <circle
                cx="100"
                cy="80"
                r="48"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="80"
                cy="72"
                r="16"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="120"
                cy="72"
                r="16"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </g>
            {/* Owl face - bold outer ring */}
            <circle
              cx="100"
              cy="80"
              r="48"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.55"
            />
            {/* Facial disc - layered rings for depth */}
            <circle
              cx="100"
              cy="80"
              r="42"
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.2"
            />
            <circle
              cx="100"
              cy="80"
              r="36"
              stroke="currentColor"
              strokeWidth="0.4"
              opacity="0.12"
            />
            {/* Big round eyes - signature owl feature */}
            <circle
              cx="80"
              cy="72"
              r="16"
              stroke="currentColor"
              strokeWidth="1.8"
              opacity="0.7"
            />
            <circle
              cx="120"
              cy="72"
              r="16"
              stroke="currentColor"
              strokeWidth="1.8"
              opacity="0.7"
            />
            <circle cx="80" cy="72" r="16" fill="currentColor" opacity="0.04" />
            <circle
              cx="120"
              cy="72"
              r="16"
              fill="currentColor"
              opacity="0.04"
            />
            {/* Iris rings */}
            <circle
              cx="80"
              cy="72"
              r="9"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.5"
            />
            <circle
              cx="120"
              cy="72"
              r="9"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.5"
            />
            {/* Pupils */}
            <circle cx="80" cy="72" r="4" fill="currentColor" opacity="0.3" />
            <circle cx="120" cy="72" r="4" fill="currentColor" opacity="0.3" />
            {/* Highlight reflections */}
            <circle cx="84" cy="68" r="2" fill="currentColor" opacity="0.15" />
            <circle cx="124" cy="68" r="2" fill="currentColor" opacity="0.15" />
            {/* Beak */}
            <path
              d="M94 88 L100 98 L106 88 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              fillOpacity="0.08"
              strokeLinejoin="round"
              opacity="0.6"
            />
            {/* Ear tufts - dramatic horns */}
            <path
              d="M62 48 L48 18 L76 40"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity="0.6"
            />
            <path
              d="M138 48 L152 18 L124 40"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              opacity="0.6"
            />
            <path
              d="M62 48 L48 18 L76 40 Z"
              fill="currentColor"
              opacity="0.04"
            />
            <path
              d="M138 48 L152 18 L124 40 Z"
              fill="currentColor"
              opacity="0.04"
            />
            {/* Feather cascade */}
            <path
              d="M65 110 Q82 128 100 122 Q118 128 135 110"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.35"
            />
            <path
              d="M70 118 Q85 134 100 128 Q115 134 130 118"
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.22"
            />
            <path
              d="M76 125 Q88 138 100 133 Q112 138 124 125"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const personas = [
    {
      name: "The Fox",
      badgeName: "Fox Analyst",
      icon: <Radar className="w-8 h-8 text-orange-600" />,
      emoji: "🦊",
      animal: "fox",
      animalColor: "text-orange-500/[0.15]",
      animalColorBack: "text-orange-500/[0.12]",
      role: "Balanced Style",
      hint: "Agile & Opportunity Spotter",
      description:
        "The Fox understands the balance of life. Quick to spot a deal and clever enough to avoid a trap. Perfect for those who want to live well.",
      trait: "Opportunity Radar",
      color: "from-orange-600/20 via-amber-500/10 to-background",
      iconBg: "bg-orange-600/10",
      traitBorder: "border-orange-600/30 text-orange-700 bg-orange-600/5",
      textColor: "text-orange-600",
      badgeBorder: "bg-[radial-gradient(rgb(234,88,12)_40%,transparent_60%)]",
      badgeGlow:
        "shadow-[0_0_15px_-3px_rgba(234,88,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.6)]",
    },
    {
      name: "The Squirrel",
      badgeName: "Squirrel Advisor",
      icon: <Wallet className="text-emerald-600" />,
      emoji: "🐿️",
      animal: "squirrel",
      animalColor: "text-emerald-600/[0.15]",
      animalColorBack: "text-emerald-600/[0.12]",
      role: "Wealth Builder",
      hint: "Safe & Compound King",
      description:
        "A true wealth builder. The Squirrel is obsessive about savings and protective of the future. Ideal for long-term compound growth.",
      trait: "Compound Interest Optimizer",
      color: "from-emerald-700/20 via-green-600/10 to-background",
      iconBg: "bg-emerald-700/10",
      traitBorder: "border-emerald-700/30 text-emerald-700 bg-emerald-700/5",
      textColor: "text-emerald-600",
      badgeBorder: "bg-[radial-gradient(rgb(5,150,105)_40%,transparent_60%)]",
      badgeGlow:
        "shadow-[0_0_15px_-3px_rgba(5,150,105,0.4)] hover:shadow-[0_0_25px_rgba(5,150,105,0.6)]",
    },
    {
      name: "The Peacock",
      badgeName: "Peacock Critic",
      icon: <Gem className="text-purple-600" />,
      emoji: "🦚",
      animal: "peacock",
      animalColor: "text-purple-600/[0.15]",
      animalColorBack: "text-purple-600/[0.12]",
      role: "Luxury Spender",
      hint: "Bold & Style-Conscious",
      description:
        "Glamorous and brutally honest. The Peacock isn't afraid to call out overpriced vanity. Great for spenders who value quality.",
      trait: "Reality Check Critic",
      color: "from-purple-700/20 via-fuchsia-600/10 to-background",
      iconBg: "bg-purple-700/10",
      traitBorder: "border-purple-700/30 text-purple-700 bg-purple-700/5",
      textColor: "text-purple-600",
      badgeBorder: "bg-[radial-gradient(rgb(147,51,234)_40%,transparent_60%)]",
      badgeGlow:
        "shadow-[0_0_15px_-3px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)]",
    },
    {
      name: "The Owl",
      badgeName: "Owl Strategist",
      icon: <Brain className="text-indigo-600" />,
      emoji: "🦉",
      animal: "owl",
      animalColor: "text-indigo-600/[0.15]",
      animalColorBack: "text-indigo-600/[0.12]",
      role: "The Strategist",
      hint: "Calm & Data Oracle",
      description:
        "Intelligent, calm, and predictive. The Owl uses data to see what's coming before it happens. Perfect for meticulous planners.",
      trait: "Predictive Foresight",
      color: "from-indigo-800/20 via-blue-700/10 to-background",
      iconBg: "bg-indigo-800/10",
      traitBorder: "border-indigo-800/30 text-indigo-700 bg-indigo-800/5",
      textColor: "text-indigo-600",
      badgeBorder: "bg-[radial-gradient(rgb(79,70,229)_40%,transparent_60%)]",
      badgeGlow:
        "shadow-[0_0_15px_-3px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]",
    },
  ];

  const [personaIndex, setPersonaIndex] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setPersonaIndex((prev) => (prev + 1) % personas.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [personas.length]);

  // Flip Card Component for compatibility
  const PersonaCard = ({ persona, index }: { persona: any; index: number }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleClick = () => {
      if (isFlipped) {
        setSelectedPersona(persona);
      } else {
        setIsFlipped(!isFlipped);
      }
    };

    return (
      <div
        className=" h-[400px] w-full group"
        onClick={handleClick}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{
            rotateY: { duration: 0.6, ease: "easeInOut" },
            opacity: { delay: index * 0.1, duration: 0.5 },
            y: { delay: index * 0.1, duration: 0.5 },
          }}
          viewport={{ once: true }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-full cursor-pointer"
        >
          {/* Front Face */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden rounded-2xl border border-border/50 p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br shadow-xl overflow-hidden",
              persona.color,
            )}
          >
            {/* Animal silhouette watermark */}
            <AnimalSilhouette
              type={persona.animal}
              className={cn(
                "w-[280px] h-[280px] -bottom-10 -right-10 transition-all duration-700 ease-out group-hover:scale-[1.15] group-hover:rotate-3",
                persona.animalColor,
              )}
            />

            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 shadow-inner relative z-10",
                persona.iconBg,
              )}
            >
              {React.cloneElement(persona.icon as React.ReactElement<any>, {
                className: cn("w-8 h-8", (persona.icon as any).props.className),
              })}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2 relative z-10">
              {persona.name}
            </h3>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary relative z-10">
              {persona.role}
            </p>

            <div className="mt-auto pt-6 border-t border-border/10 w-full flex items-center justify-center gap-2 relative z-10">
              <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                {persona.hint}
              </span>
              <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
            </div>

            <div className="absolute bottom-4 right-4 md:hidden z-10">
              <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">
                Tap to flip
              </span>
            </div>
          </div>

          {/* Back Face */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden rounded-2xl border border-border/50 p-8 flex flex-col justify-center bg-gradient-to-br rotate-y-180 shadow-2xl overflow-hidden",
              persona.color,
            )}
          >
            {/* Animal silhouette watermark - back */}
            <AnimalSilhouette
              type={persona.animal}
              className={cn(
                "w-[220px] h-[220px] -top-4 -left-4 rotate-[15deg]",
                persona.animalColorBack,
              )}
            />

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                  persona.iconBg,
                )}
              >
                {React.cloneElement(persona.icon as React.ReactElement<any>, {
                  className: cn(
                    "w-5 h-5",
                    (persona.icon as any).props.className,
                  ),
                })}
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {persona.name}
                </h4>
                <p className="text-[10px] uppercase font-black text-primary tracking-wider">
                  {persona.role}
                </p>
              </div>
            </div>

            <p className="text-sm text-balance leading-relaxed text-muted-foreground mb-8 relative z-10">
              {persona.description}
            </p>

            <div className="space-y-3 mt-auto relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Unique Intelligence
                </span>
              </div>
              <div
                className={cn(
                  "px-4 py-2 rounded-xl border text-[11px] font-bold shadow-sm",
                  persona.traitBorder,
                )}
              >
                {persona.trait}
              </div>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <Crown className="w-4 h-4 text-primary/20" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Map themes to their specific image URLs
  const themeImages: Record<string, string> = {
    dark: "v1775292690/Dark_tkiyfr.png",
    light: "v1775292690/Light_uil8tn.png",
    solaris: "v1775292690/Solaris_yg2f3x.png",
    cyberpunk: "v1775292690/CyberPunk_tpnkbe.png",
    midnight: "v1775292690/Midnight_wyoaez.png",
    forest: "v1775292690/Forest_i14use.png",
  };

  // Use resolvedTheme if theme is 'system' or not set
  const activeTheme = (theme === "system" ? resolvedTheme : theme) || "dark";
  const currentThemeImage = themeImages[activeTheme] || themeImages.dark;

  return (
    <div className="flex min-h-screen flex-col text-foreground selection:bg-primary/20 relative overflow-x-hidden custom-cursor-active">
      <CustomCursor />
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
              <Button
                variant="ghost"
                className="text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
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
                <div
                  className="absolute -bottom-10 -right-4 md:-bottom-16 md:-right-16 opacity-30 animate-float"
                  style={{ animationDelay: "1s" }}
                >
                  <PieChart className="w-10 h-10 md:w-14 md:h-14 text-emerald-500" />
                </div>
                <div
                  className="absolute top-10 -right-8 md:top-20 md:-right-24 opacity-20 animate-float"
                  style={{ animationDelay: "2s" }}
                >
                  <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-blue-500" />
                </div>
                <div
                  className="absolute -bottom-20 -left-8 md:-bottom-24 md:-left-20 opacity-20 animate-float"
                  style={{ animationDelay: "3s" }}
                >
                  <Wallet className="w-8 h-8 md:w-12 md:h-12 text-purple-500" />
                </div>
                <div
                  className="absolute top-1/2 -left-10 md:-left-16 opacity-30 animate-float"
                  style={{ animationDelay: "4s" }}
                >
                  <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-rose-500/80" />
                </div>
                <div
                  className="absolute top-10/6 -right-10 md:-right-20 opacity-30 animate-float"
                  style={{ animationDelay: "1.5s" }}
                >
                  <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-amber-300/80" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <MovingBorder
                    duration={3500}
                    containerClassName={cn(
                      "w-48 h-9 mb-6 mx-auto transition-all duration-700",
                      personas[personaIndex].badgeGlow,
                    )}
                    borderClassName={personas[personaIndex].badgeBorder}
                    className={cn(
                      "font-bold flex items-center justify-center px-4 transition-colors duration-700",
                      personas[personaIndex].textColor,
                    )}
                  >
                    <motion.span
                      key={personaIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-lg">
                        {personas[personaIndex].icon}
                      </span>
                      {personas[personaIndex].badgeName}
                    </motion.span>
                  </MovingBorder>
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl 3xl:text-8xl 4xl:text-[10rem] drop-shadow-sm text-foreground">
                    The Financial OS <br />
                    <motion.span
                      initial={{ backgroundPosition: "0% 50%" }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
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
                  BudgetBuddy isn&apos;t just a tracker — it&apos;s an{" "}
                  <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                    Enterprise-Grade Financial Command Center
                  </span>
                  . From Vision AI scanning to shared workspaces and offline
                  sync, it&apos;s everything you need to build a legacy.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-4 pt-4 w-full px-6 sm:px-0"
              >
                <Link href="/sign-up" className="w-auto">
                  <Button
                    size="lg"
                    className="h-11 px-8 min-w-[200px] text-sm md:h-14 md:px-8 md:text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-indigo-600 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 rounded-full 3xl:h-20 3xl:px-12 3xl:text-2xl 4xl:h-24 4xl:px-16 4xl:text-3xl"
                  >
                    Start for Free{" "}
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 3xl:h-8 3xl:w-8" />
                  </Button>
                </Link>
                <Link href="#features" className="w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 px-8 min-w-[200px] text-sm md:h-14 md:px-8 md:text-lg rounded-full border-border/40 bg-muted/50 hover:bg-muted text-foreground transition-all 3xl:h-20 3xl:px-12 3xl:text-2xl 4xl:h-24 4xl:px-16 4xl:text-3xl"
                  >
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
        <section
          id="features"
          className="container px-4 py-24 md:px-6 lg:py-32 relative z-10 max-w-7xl 2xl:max-w-[1600px] 4xl:max-w-[2000px] mx-auto transition-all duration-300"
        >
          <div className="mb-16 text-center">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl mb-4 text-foreground">
              Everything you need to grow
            </h2>
            <p className="mt-4 text-xl 3xl:text-3xl 4xl:text-4xl text-muted-foreground max-w-2xl 3xl:max-w-4xl mx-auto pl-2 pr-2">
              A complete suite of financial tools, built on top of
              high-performance architecture.
            </p>

            {/* Impact Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                <div className="text-3xl font-black text-foreground">99.9%</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Sync Parity
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                <div className="text-3xl font-black text-foreground">12s</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Avg Logging
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                <div className="text-3xl font-black text-foreground">
                  Vision
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  AI Engine
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                <div className="text-3xl font-black text-foreground">Bank</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Grade Security
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              delay={0.1}
              icon={<Brain className="h-full w-full" />}
              title="Active AI Command"
              description="Use the Command Center to execute complex financial tasks. 'Scan last 3 months and find leaks' or 'Log $50 for dinner' just by typing."
            />
            <FeatureCard
              delay={0.2}
              icon={<Zap className="h-full w-full" />}
              title="Smart Automation"
              description="From recurring Netflix bills to monthly salary, BudgetBuddy automates the mundane so you can focus on building wealth."
            />
            <FeatureCard
              delay={0.3}
              icon={<LineChart className="h-full w-full" />}
              title="Wealth & Forecasting"
              description="Track every Asset and Liability for a live Net Worth view. Use Active AI to forecast your financial growth 12 months into the future."
            />
            <FeatureCard
              delay={0.4}
              icon={<Users className="h-full w-full" />}
              title="Shared Workspaces"
              description="Collaborate with family or business partners. Shared real-time activity feeds and unified budgeting in 'Family Mode'."
            />
            <FeatureCard
              delay={0.5}
              icon={<WifiOff className="h-full w-full" />}
              title="Offline-First Engine"
              description="Never wait for a loading bar. Log transactions offline; our sync manager handles the cloud updates once you're back."
            />
            <FeatureCard
              delay={0.6}
              icon={<Scan className="h-full w-full" />}
              title="Vision AI Scanner"
              description="Powered by high-precision OCR technology. Upload receipts, invoices, or bank statements for instant transaction logging."
            />
            <FeatureCard
              delay={0.7}
              icon={<Trophy className="h-full w-full" />}
              title="Gamified Growth"
              description="Turn budgeting into a game. Earn points, maintain streaks, and unlock 17+ unique achievements as you hit your goals."
            />
            <FeatureCard
              delay={0.8}
              icon={<FileText className="h-full w-full" />}
              title="Professional Export"
              description="Generate tax-ready PDF, CSV, or Excel reports with a single click. High-fidelity financial summaries for you or your accountant."
            />
            <FeatureCard
              delay={0.9}
              icon={<Lock className="h-full w-full" />}
              title="Military-Grade Security"
              description="Your heritage is safe. PIN-protected Legacy Vault and bank-grade encryption ensure your data remains strictly yours."
            />
          </div>
        </section>

        {/* Legacy Vault Showcase */}
        <section className="bg-muted/30 py-24 relative border-y border-border/40 overflow-hidden">
          {/* Background glow matching other sections */}
          <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 blur-[140px] pointer-events-none opacity-15 bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-fuchsia-500/10" />

          <div className="container px-4 md:px-6">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
              {/* Left: Visual Mockup */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                viewport={{ once: true }}
                className="relative order-2 lg:order-1"
              >
                {/* Outer glow card */}
                <div className="relative rounded-2xl border border-border/60 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl p-6 shadow-2xl overflow-hidden group">
                  {/* Spotlight hover effect matching FeatureCard */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500"
                    style={{
                      background:
                        "radial-gradient(600px circle at 50% 50%, rgba(139,92,246,.08), transparent 60%)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                  {/* Header row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          Legacy Vault
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                          Secure Heritage
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        PIN Active
                      </span>
                    </div>
                  </div>

                  {/* PIN dots row */}
                  <div className="flex items-center justify-center gap-4 py-5 mb-6 rounded-xl border border-border/50 bg-muted/30">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{
                          delay: 0.4 + i * 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}
                        viewport={{ once: true }}
                        className="w-4 h-4 rounded-full bg-primary shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                      />
                    ))}
                  </div>

                  {/* Vault entry cards */}
                  <div className="space-y-3">
                    {[
                      {
                        icon: <Key className="w-4 h-4" />,
                        label: "Crypto Wallet Keys",
                        cat: "Crypto",
                        color: "text-orange-500",
                        bg: "bg-orange-500/10",
                        border: "border-orange-500/20",
                        sensitivity: "Critical",
                      },
                      {
                        icon: <FileText className="w-4 h-4" />,
                        label: "Will & Testament",
                        cat: "Legal",
                        color: "text-amber-500",
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20",
                        sensitivity: "High",
                      },
                      {
                        icon: <Landmark className="w-4 h-4" />,
                        label: "Primary Bank Account",
                        cat: "Banking",
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20",
                        sensitivity: "High",
                      },
                      {
                        icon: <Heart className="w-4 h-4" />,
                        label: "Medical Records",
                        cat: "Medical",
                        color: "text-rose-500",
                        bg: "bg-rose-500/10",
                        border: "border-rose-500/20",
                        sensitivity: "Medium",
                      },
                    ].map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background/80 hover:border-border/70 transition-all duration-200 group/entry"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${entry.bg} border ${entry.border} ${entry.color}`}
                          >
                            {entry.icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-none">
                              {entry.label}
                            </p>
                            <p
                              className={`text-[10px] font-bold mt-0.5 ${entry.color}`}
                            >
                              {entry.cat}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/60 px-2 py-0.5 rounded-full border border-border/30">
                            {entry.sensitivity}
                          </span>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/entry:text-primary transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Beneficiaries footer row */}
                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex -space-x-2">
                      {["#7c3aed", "#2563eb", "#059669"].map((color, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {["M", "S", "A"][i]}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      3 Beneficiaries Trusted
                    </p>
                  </div>
                </div>

                {/* Decorative floating badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="absolute -bottom-4 -right-4 z-10 rounded-xl border border-border/50 bg-background/90 backdrop-blur-lg px-4 py-2 shadow-xl flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Bank-Grade Encrypted
                  </span>
                </motion.div>
              </motion.div>

              {/* Right: Copy */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                viewport={{ once: true }}
                className="space-y-6 order-1 lg:order-2"
              >
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary mb-2">
                  Legacy Vault
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl text-foreground">
                  Your Digital{" "}
                  <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Heritage
                  </span>
                  , <br />
                  Safeguarded Forever.
                </h2>
                <p className="text-lg md:text-xl 3xl:text-3xl 4xl:text-4xl text-muted-foreground leading-relaxed max-w-[520px]">
                  A high-security sanctuary for your most critical life
                  documents and financial assets — protected by a dedicated PIN
                  lock and accessible only to you and your trusted
                  beneficiaries.
                </p>
                <ul className="space-y-5 pt-2">
                  {[
                    {
                      icon: <Lock className="h-4 w-4" />,
                      title: "PIN-Protected Access",
                      desc: "A standalone security layer for critical data, separate from your main account login.",
                    },
                    {
                      icon: <Users className="h-4 w-4" />,
                      title: "Beneficiary Designations",
                      desc: "Define trusted family members with access in an emergency, ensuring nothing is ever lost.",
                    },
                    {
                      icon: <Shield className="h-4 w-4" />,
                      title: "7 Asset Categories",
                      desc: "Organize insurance, legal, crypto, banking, property, and medical records with sensitivity levels.",
                    },
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex gap-4 group/item"
                    >
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25 flex items-center justify-center transition-transform group-hover/item:scale-110 duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground 3xl:text-2xl 4xl:text-3xl group-hover/item:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground 3xl:text-lg 4xl:text-xl leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Net Worth & Assets Section */}
        <section className="py-24 relative overflow-hidden bg-background/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
              <div className="space-y-6">
                <div className="inline-block rounded-lg bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500 mb-2">
                  Net Worth 2.0
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl text-foreground">
                  Full-Spectrum <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                    Wealth Tracking
                  </span>
                </h2>
                <p className="text-lg md:text-xl 3xl:text-3xl 4xl:text-4xl text-muted-foreground leading-relaxed max-w-[520px]">
                  BudgetBuddy goes beyond monthly spending. Track your real-time
                  net worth by monitoring every asset you own and every
                  liability you owe.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-2xl border border-border/50 bg-background/40 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold">Assets</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Property, Crypto, Savings, and Investments.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/50 bg-background/40 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />
                      <span className="text-sm font-bold">Liabilities</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mortgages, Loans, and Credit Card Debts.
                    </p>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl border border-border/50 bg-gradient-to-br from-background/80 to-muted/20 p-8 shadow-2xl relative overflow-hidden group">
                  {/* Mock Graph Visual */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          Estimated Net Worth
                        </p>
                        <h3 className="text-4xl font-black text-foreground">
                          $248,590.00
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2 text-emerald-500 text-xs font-bold">
                          <TrendingUp className="w-3 h-3" />
                          +12.4% THIS MONTH
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <LineChart className="w-6 h-6 text-primary" />
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-2 h-32 mt-8">
                      {[40, 55, 45, 60, 75, 65, 85, 95, 100].map(
                        (height, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            whileInView={{ height: `${height}%` }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="flex-1 bg-gradient-to-t from-primary/40 to-primary/10 rounded-t-sm relative group/bar"
                          />
                        ),
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-8">
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-xs text-muted-foreground">
                          Real Estate
                        </span>
                        <span className="text-xs font-bold">$180,000</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-xs text-muted-foreground">
                          Investments
                        </span>
                        <span className="text-xs font-bold">$42,500</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-xs text-muted-foreground">
                          Total Debt
                        </span>
                        <span className="text-xs font-bold text-rose-500">
                          -$24,000
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-xs text-muted-foreground">
                          Liquid Cash
                        </span>
                        <span className="text-xs font-bold">$50,090</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
                </div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* AI Personalities Section */}
        <section className="py-24 relative overflow-hidden bg-background">
          <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-full -translate-x-1/2 blur-[120px] pointer-events-none opacity-20 bg-gradient-to-b from-primary/20 via-transparent to-transparent" />

          <div className="container px-4 md:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl text-foreground">
                Meet Your <span className="text-primary">AI Personalities</span>
              </h2>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed">
                Our AI adapts its personality based on your spending habits,
                providing advice that resonates with your financial style.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {personas.map((persona, i) => (
                <PersonaCard key={persona.name} persona={persona} index={i} />
              ))}
            </div>
          </div>

          {/* Persona Detail Modal */}
          {selectedPersona && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg"
              onClick={() => setSelectedPersona(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "relative max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-8 md:p-10 shadow-2xl bg-gradient-to-br",
                  selectedPersona.color,
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedPersona(null)}
                  className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-background/90 hover:bg-background flex items-center justify-center transition-all hover:scale-110 border-2 border-border/50 shadow-lg"
                >
                  <span className="text-3xl text-foreground font-light">×</span>
                </button>

                {/* Large Animal Silhouette Background */}
                <AnimalSilhouette
                  type={selectedPersona.animal}
                  className={cn(
                    "w-[500px] h-[500px] absolute -bottom-24 -right-24 opacity-[0.08] pointer-events-none",
                  )}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-6 mb-10">
                    <div
                      className={cn(
                        "w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl",
                        selectedPersona.iconBg,
                      )}
                    >
                      {React.cloneElement(
                        selectedPersona.icon as React.ReactElement<any>,
                        {
                          className: cn(
                            "w-12 h-12",
                            (selectedPersona.icon as any).props.className,
                          ),
                        },
                      )}
                    </div>
                    <div>
                      <h3 className="text-5xl font-black text-foreground mb-2 leading-tight">
                        {selectedPersona.name}
                      </h3>
                      <p className="text-base font-black uppercase tracking-[0.25em] text-primary">
                        {selectedPersona.role}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Personality Profile
                    </h4>
                    <p className="text-xl leading-relaxed text-foreground font-medium">
                      {selectedPersona.description}
                    </p>
                  </div>

                  {/* Trait Badge */}
                  <div className="mb-10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Core Strength
                    </h4>
                    <div
                      className={cn(
                        "px-8 py-5 rounded-2xl border-2 text-lg font-bold shadow-xl",
                        selectedPersona.traitBorder,
                      )}
                    >
                      {selectedPersona.trait}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="p-6 rounded-2xl bg-background/70 border-2 border-border/50 shadow-lg">
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Style
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {selectedPersona.hint}
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-background/70 border-2 border-border/50 shadow-lg">
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Best For
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {selectedPersona.name === "The Fox" &&
                          "Balanced Budgeters"}
                        {selectedPersona.name === "The Squirrel" &&
                          "Serious Savers"}
                        {selectedPersona.name === "The Peacock" &&
                          "Luxury Lovers"}
                        {selectedPersona.name === "The Owl" && "Data Analysts"}
                      </div>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="mb-10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Key Features
                    </h4>
                    <div className="space-y-3">
                      {selectedPersona.name === "The Fox" && (
                        <>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Identifies smart spending opportunities and warns
                              against financial traps
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Balances enjoyment with financial responsibility
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Quick to adapt strategies based on changing
                              circumstances
                            </p>
                          </div>
                        </>
                      )}
                      {selectedPersona.name === "The Squirrel" && (
                        <>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Maximizes compound interest and long-term wealth
                              building
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Protective of emergency funds and future security
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Encourages consistent saving habits and frugal
                              living
                            </p>
                          </div>
                        </>
                      )}
                      {selectedPersona.name === "The Peacock" && (
                        <>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Provides honest reality checks on luxury purchases
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Distinguishes between quality investments and
                              wasteful vanity
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Helps maintain style while staying financially
                              conscious
                            </p>
                          </div>
                        </>
                      )}
                      {selectedPersona.name === "The Owl" && (
                        <>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Uses advanced analytics to predict future spending
                              patterns
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Provides data-driven insights for strategic
                              planning
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-border/30">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                            <p className="text-base text-foreground/90">
                              Calm, methodical approach to financial
                              decision-making
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Communication Style */}
                  <div className="mb-10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Communication Style
                    </h4>
                    <div className="p-6 rounded-2xl bg-background/70 border-2 border-border/50 shadow-lg">
                      <p className="text-lg leading-relaxed text-foreground/90">
                        {selectedPersona.name === "The Fox" &&
                          "Witty and clever, offering practical advice with a touch of humor. Speaks in terms of opportunities and smart moves."}
                        {selectedPersona.name === "The Squirrel" &&
                          "Cautious and protective, emphasizing security and long-term thinking. Uses metaphors about preparation and future planning."}
                        {selectedPersona.name === "The Peacock" &&
                          "Bold and direct, not afraid to call out poor financial choices. Speaks with confidence about quality and value."}
                        {selectedPersona.name === "The Owl" &&
                          "Calm and analytical, presenting data-backed insights. Communicates with precision and foresight."}
                      </p>
                    </div>
                  </div>

                  {/* Ideal Scenarios */}
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Ideal Scenarios
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedPersona.name === "The Fox" && (
                        <>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Finding Deals
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Perfect for spotting cashback opportunities and
                              discount strategies
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Balanced Lifestyle
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Great for those who want to enjoy life while
                              staying financially smart
                            </p>
                          </div>
                        </>
                      )}
                      {selectedPersona.name === "The Squirrel" && (
                        <>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Retirement Planning
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Excellent for long-term wealth accumulation and
                              compound growth
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Emergency Funds
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ideal for building and maintaining financial
                              safety nets
                            </p>
                          </div>
                        </>
                      )}
                      {selectedPersona.name === "The Peacock" && (
                        <>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Luxury Purchases
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Helps evaluate if high-end items are worth the
                              investment
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Lifestyle Choices
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Perfect for maintaining quality of life while
                              being financially aware
                            </p>
                          </div>
                        </>
                      )}
                      {selectedPersona.name === "The Owl" && (
                        <>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Financial Forecasting
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Best for predicting trends and planning ahead
                              strategically
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                            <p className="text-base font-semibold text-foreground mb-1">
                              Complex Analysis
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ideal for detailed budget optimization and
                              data-driven decisions
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </section>

        {/* Comparison Section (The Differential) */}
        <section className="py-32 bg-background relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 blur-[150px] pointer-events-none opacity-[0.15] bg-[radial-gradient(circle_at_center,var(--primary),transparent)]" />

          <div className="container px-4 md:px-6">
            <div className="text-center mb-20 space-y-4">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary mb-2 border border-primary/20">
                Feature Parity
              </div>
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
                The Differential
              </h2>
              <p className="mt-4 text-muted-foreground text-xl max-w-2xl mx-auto">
                Why a standard tracker is a liability in a modern economy.
              </p>
            </div>

            <div className="max-w-5xl mx-auto relative">
              {/* Comparison Headers */}
              <div className="grid grid-cols-12 gap-4 mb-8 px-8 items-end">
                <div className="col-span-4 pb-4">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    Capability
                  </span>
                </div>
                <div className="col-span-4 text-center pb-4">
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    Standard Apps
                  </span>
                </div>
                <div className="col-span-4 text-center p-6 bg-primary/5 rounded-t-3xl border-x border-t border-primary/20 backdrop-blur-sm">
                  <Logo />
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">
                    Next-Gen OS
                  </div>
                </div>
              </div>

              {/* Comparison Rows */}
              <div className="space-y-3">
                {[
                  {
                    f: "Data Entry",
                    s: "Manual Input",
                    b: "AI Command Center",
                    icon: <Command className="w-5 h-5" />,
                  },
                  {
                    f: "Document Logic",
                    s: "Form Fills",
                    b: "Vision AI Analysis",
                    icon: <Eye className="w-5 h-5" />,
                  },
                  {
                    f: "Scope of View",
                    s: "Expenses Only",
                    b: "Full Asset/Liability Graph",
                    icon: <PieChart className="w-5 h-5" />,
                  },
                  {
                    f: "Insight Depth",
                    s: "Basic Charts",
                    b: "Adaptive AI Personas",
                    icon: <Brain className="w-5 h-5" />,
                  },
                  {
                    f: "Access Reliability",
                    s: "Cloud Sync Only",
                    b: "Offline-First Sync Engine",
                    icon: <Globe className="w-5 h-5" />,
                  },
                  {
                    f: "Security Layer",
                    s: "Standard Login",
                    b: "AES-256 Legacy Vault",
                    icon: <ShieldCheck className="w-5 h-5" />,
                  },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-12 gap-4 items-center p-2 group hover:scale-[1.01] transition-transform duration-300"
                  >
                    <div className="col-span-4 p-6 bg-muted/20 rounded-3xl border border-border/40 flex items-center gap-4 group-hover:bg-muted/40 transition-colors">
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        {row.icon}
                      </div>
                      <span className="font-bold text-foreground text-sm lg:text-base">
                        {row.f}
                      </span>
                    </div>

                    <div className="col-span-4 text-center p-6 text-muted-foreground/80 font-medium italic text-sm">
                      {row.s}
                    </div>

                    <div className="col-span-4 p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl flex items-center justify-center gap-3 relative overflow-hidden group/pro">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/pro:opacity-100 transition-opacity" />
                      <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                      <span className="text-foreground font-black text-sm lg:text-base relative z-10">
                        {row.b}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating Comparison Footer */}
              <div className="mt-12 flex justify-end px-8">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50">
                  + more exclusive enterprise capabilities
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wealth Membership Tiers */}
        <section className="py-24 relative overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Choose Your Path
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Transparent tiers designed for every stage of your financial
                journey.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {[
                {
                  name: "Standard",
                  price: "$0",
                  desc: "Perfect for basic expense tracking.",
                  features: [
                    "1 Workspace",
                    "Manual Transactions",
                    "Basic Analytics",
                    "Community Support",
                  ],
                  cta: "Get Started",
                  popular: false,
                },
                {
                  name: "Professional",
                  price: "$9",
                  desc: "Powerful AI for active wealth builders.",
                  features: [
                    "Unlimited Workspaces",
                    "Vision AI Scanning",
                    "Assets & Liabilities",
                    "Priority Sync",
                  ],
                  cta: "Go Pro",
                  popular: true,
                },
                {
                  name: "Legacy",
                  price: "$19",
                  desc: "The ultimate financial operating system.",
                  features: [
                    "All Pro Features",
                    "Shared Vault Access",
                    "Custom AI Personas",
                    "Estate Planning Tools",
                  ],
                  cta: "Unlock Legacy",
                  popular: false,
                },
              ].map((tier, i) => (
                <div
                  key={tier.name}
                  className={cn(
                    "p-8 rounded-3xl border transition-all duration-300 relative group",
                    tier.popular
                      ? "bg-primary text-primary-foreground border-primary shadow-2xl scale-105 z-10"
                      : "bg-background border-border/50 hover:border-primary/50",
                  )}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-black mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black">{tier.price}</span>
                    <span className="text-xs opacity-70">/month</span>
                  </div>
                  <p
                    className={cn(
                      "text-sm mb-8",
                      tier.popular
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {tier.desc}
                  </p>
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <ShieldCheck
                          className={cn(
                            "h-4 w-4 shrink-0",
                            tier.popular
                              ? "text-primary-foreground"
                              : "text-primary",
                          )}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full rounded-xl font-bold h-12",
                      tier.popular
                        ? "bg-background text-primary hover:bg-background/90"
                        : "bg-foreground text-background",
                    )}
                  >
                    {tier.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-muted/30 py-24 relative border-y border-border/40">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <div className="inline-block rounded-lg bg-blue-500/10 px-3 py-1 text-sm text-blue-500 mb-4">
                Process
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl 3xl:text-7xl 4xl:text-8xl text-foreground">
                How BudgetBuddy Works
              </h2>
              <p className="mt-4 text-xl 3xl:text-3xl 4xl:text-4xl text-muted-foreground">
                Simple steps to financial freedom.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-10 3xl:top-16 4xl:top-20 left-[16%] right-[16%] h-px border-t-2 border-dashed border-primary/30 z-0" />

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 3xl:w-32 3xl:h-32 4xl:w-40 4xl:h-40 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-3xl 3xl:text-5xl 4xl:text-6xl font-bold text-foreground group-hover:scale-110 transition-transform">
                    1
                  </span>
                  <div className="absolute -bottom-2 bg-purple-500 text-xs 3xl:text-sm 4xl:text-base font-bold px-2 py-0.5 rounded text-white">
                    SYNC
                  </div>
                </div>
                <h3 className="text-xl 3xl:text-3xl 4xl:text-4xl font-bold text-foreground mb-2">
                  Create Account
                </h3>
                <p className="text-muted-foreground 3xl:text-xl 4xl:text-2xl">
                  Simply sign up and manually input or import your financial
                  data securely.
                </p>
              </div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 3xl:w-32 3xl:h-32 4xl:w-40 4xl:h-40 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-3xl 3xl:text-5xl 4xl:text-6xl font-bold text-foreground group-hover:scale-110 transition-transform">
                    2
                  </span>
                  <div className="absolute -bottom-2 bg-blue-500 text-xs 3xl:text-sm 4xl:text-base font-bold px-2 py-0.5 rounded text-white">
                    AI
                  </div>
                </div>
                <h3 className="text-xl 3xl:text-3xl 4xl:text-4xl font-bold text-foreground mb-2">
                  Analyze Spending
                </h3>
                <p className="text-muted-foreground 3xl:text-xl 4xl:text-2xl">
                  Our AI analyzes your transactions to categorize them and find
                  savings.
                </p>
              </div>

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 3xl:w-32 3xl:h-32 4xl:w-40 4xl:h-40 rounded-full bg-background border border-border/50 flex items-center justify-center mb-6 shadow-xl relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-3xl 3xl:text-5xl 4xl:text-6xl font-bold text-foreground group-hover:scale-110 transition-transform">
                    3
                  </span>
                  <div className="absolute -bottom-2 bg-emerald-500 text-xs 3xl:text-sm 4xl:text-base font-bold px-2 py-0.5 rounded text-white">
                    GOAL
                  </div>
                </div>
                <h3 className="text-xl 3xl:text-3xl 4xl:text-4xl font-bold text-foreground mb-2">
                  Achieve Goals
                </h3>
                <p className="text-muted-foreground 3xl:text-xl 4xl:text-2xl">
                  Set budgets, track limits, and watch your savings grow over
                  time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section (Accordion Style) */}
        <section className="py-32 bg-background relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 -translate-y-1/2 blur-[150px] pointer-events-none opacity-10 bg-gradient-to-tr from-primary/30 to-blue-500/20" />

          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16 space-y-4">
                <div className="inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Support Center
                </div>
                <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
                  Common Questions
                </h2>
                <p className="text-muted-foreground text-lg">
                  Everything you need to know about navigating the platform.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    q: "Is my financial data secure?",
                    a: "Absolutely. We use bank-grade AES-256 encryption. Your physical keys and legal documents in the Legacy Vault are further protected by your private PIN and never hit our servers in plain text.",
                    icon: <Shield className="w-5 h-5 text-emerald-500" />,
                  },
                  {
                    q: "How does the Vision AI work?",
                    a: "Our proprietary AI engine uses Advanced OCR to scan receipts and bank statements synchronously. It automatically extracts tax info, currency, and merchant tags with 99.8% precision.",
                    icon: <Scan className="w-5 h-5 text-blue-500" />,
                  },
                  {
                    q: "Can I collaborate with my partner?",
                    a: "Yes. Multi-Tenant Workspaces allow for shared family accounts. Multiple users can contribute to a single pool of assets while maintaining private vaults for individual legacy planning.",
                    icon: <Users className="w-5 h-5 text-purple-500" />,
                  },
                  {
                    q: "Does it work without internet?",
                    a: "BudgetBuddy is architected as Offline-First. Log your expenses and assets in the most remote locations; our sync buffer ensures a seamless merge once you're back on grid.",
                    icon: <WifiOff className="w-5 h-5 text-orange-500" />,
                  },
                ].map((item, i) => (
                  <FAQItem key={i} item={item} />
                ))}
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
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl 3xl:text-7xl 4xl:text-8xl text-foreground">
                Ready to take control?
              </h2>
              <p className="mx-auto max-w-[600px] 3xl:max-w-[900px] text-muted-foreground md:text-xl 3xl:text-3xl 4xl:text-4xl">
                Be one of the first to master their financial life with Budget
                Buddy.
              </p>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-14 mt-6 px-10 text-lg font-bold shadow-2xl bg-foreground text-background hover:bg-foreground/90 rounded-full transition-transform hover:scale-105 3xl:h-20 3xl:px-16 3xl:text-2xl 4xl:h-24 4xl:px-20 4xl:text-3xl"
                >
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
              <div
                className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_180deg,#ef4444_270deg,transparent_360deg)] animate-spin-slow"
                style={{
                  width: "200%",
                  height: "200%",
                  left: "-50%",
                  top: "-50%",
                }}
              />

              {/* Inner Background for Contrast */}
              <div className="absolute inset-[1px] bg-background/95 rounded-full z-0" />

              <div className="relative z-10 flex items-center gap-1">
                <span className="text-blue-500">&lt;</span>
                <span className="text-foreground font-semibold">CreatedBy</span>
                <span className="text-purple-500 pl-1">dev</span>
                <span className="text-blue-500">=</span>
                <span className="text-orange-500">&quot;</span>
                <Link
                  href="https://www.linkedin.com/in/himanshu-guptaa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-500 transition-all font-bold"
                >
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
    </div>
  );
}

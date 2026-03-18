"use client";

import React, { useState } from "react";
import Logo, { LogoMobile } from "./Logo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import {
	Menu,
	LayoutDashboard,
	PiggyBank,
	Settings,
	Wallet,
	LineChart,
	Calendar,
	TrendingUp,
	Eye,
	EyeOff,
	Pencil,
	ShieldCheck,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { usePrivacyMode } from "./providers/PrivacyProvider";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const Navbar = () => {
	return (
		<>
			<DesktopNavbar />
			<MobileNavbar />
		</>
	);
};

const items = [
	{
		label: "Dashboard",
		link: "/dashboard",
		icon: <LayoutDashboard className="h-4 w-4" />,
	},
	{
		label: "Transactions",
		link: "/transactions",
		icon: <Wallet className="h-4 w-4" />,
	},
	{
		label: "Budgets",
		link: "/budgets",
		icon: <PiggyBank className="h-4 w-4" />,
	},
	{
		label: "Assets",
		link: "/assets",
		icon: <TrendingUp className="h-4 w-4" />,
	},
	{
		label: "Calendar",
		link: "/calendar",
		icon: <Calendar className="h-4 w-4" />,
	},
	{
		label: "Analytics",
		link: "/analytics",
		icon: <LineChart className="h-4 w-4" />,
	},
	{
		label: "Vault",
		link: "/vault",
		icon: <ShieldCheck className="h-4 w-4" />,
	},
	{ label: "Manage", link: "/manage", icon: <Settings className="h-4 w-4" /> },
];

import { useWorkspaceRole } from "./PermissionGuard";
import { Badge } from "./ui/badge";

function NavbarActions() {
	const [isMounted, setIsMounted] = useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) return null;

	return (
		<div className="flex items-center gap-2 3xl:gap-3 4xl:gap-4 shrink-0">
			<div className="hidden sm:block">
				<WorkspaceSwitcher />
			</div>
			<div className="hidden sm:block">
				<PrivacyModeToggle />
			</div>
			<div className="hidden sm:block">
				<ThemeCustomizer />
			</div>
			<UserButton
				afterSignOutUrl="/sign-in"
				appearance={{
					elements: {
						userButtonAvatarBox: "w-8 h-8 3xl:w-10 3xl:h-10 4xl:w-12 4xl:h-12 border border-border hover:opacity-80 transition-all",
						userButtonPopoverCard: "bg-background border border-border shadow-xl rounded-xl overflow-hidden",
						userButtonPopoverFooter: "hidden", // Removes "Powered by Clerk"
						userButtonPopoverActionButton: "hover:bg-muted/80 transition-colors",
						userButtonPopoverActionButtonText: "text-foreground font-medium",
						userButtonPopoverActionButtonIcon: "text-primary",
						userButtonPopoverUserPreviewMainIdentifier: "text-foreground font-semibold",
						userButtonPopoverUserPreviewSecondaryIdentifier: "text-muted-foreground text-xs",
					},
				}}
			/>
		</div>
	);
}

function MobileNavbar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) return null;

	return (
		<div className="block border-separate bg-background/80 backdrop-blur-md xl:hidden fixed top-0 left-0 right-0 z-50 border-b shadow-sm">
			<nav className="container flex items-center justify-between px-4">
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant={"ghost"} size={"icon"}>
							<Menu className="h-5 w-5" />
						</Button>
					</SheetTrigger>
					<SheetContent className="w-[320px] sm:w-[540px]" side={"left"}>
						<SheetTitle className="sr-only">Navigation Menu</SheetTitle>
						<Logo />
						<div className="flex flex-col gap-1 pt-4">
							{items.map((item) => (
								<NavbarItem
									key={item.label}
									link={item.link}
									label={item.label}
									icon={item.icon}
									clickCallback={() => setIsOpen((prev) => !prev)}
								/>
							))}
						</div>
						<div className="pt-4 border-t border-border mt-4 sm:hidden">
							<div className="mb-4">
								<p className="text-xs text-muted-foreground mb-2 px-2">Workspace</p>
								<div className="px-2">
									<WorkspaceSwitcher />
								</div>
							</div>
							<div className="flex flex-row items-center justify-start gap-8 px-2">
								<div className="flex flex-col gap-2">
									<p className="text-xs text-muted-foreground">Privacy</p>
									<div className="flex justify-start">
										<PrivacyModeToggle />
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<p className="text-xs text-muted-foreground">Theme</p>
									<div className="flex justify-start">
										<ThemeCustomizer />
									</div>
								</div>
							</div>
						</div>
					</SheetContent>
				</Sheet>
				<div className="flex h-[80px] min-h-[60px] items-center gap-x-4">
					<LogoMobile />
				</div>
				<NavbarActions />
			</nav>
		</div>
	);
}

function DesktopNavbar() {
	return (
		<div className="hidden border-separate border-b bg-background/80 backdrop-blur-md xl:block fixed top-0 left-0 right-0 z-50 shadow-sm">
			<nav className="container flex items-center justify-between px-8 3xl:px-12 4xl:px-16">
				<div className="flex h-[25px] min-h-[60px] items-center gap-x-4 3xl:h-[100px] 3xl:gap-x-6 4xl:h-[120px] 4xl:gap-x-8">
					<Logo />
					<div className="flex h-full ">
						{items.map((item) => (
							<NavbarItem
								key={item.label}
								link={item.link}
								label={item.label}
							/>
						))}
					</div>
				</div>
				<NavbarActions />
			</nav>
		</div>
	);
}

function NavbarItem({
	link,
	label,
	icon,
	clickCallback,
}: {
	link: string;
	label: string;
	icon?: React.ReactNode;
	clickCallback?: () => void;
}) {
	const pathname = usePathname();
	const isActive = pathname === link;

	return (
		<div className="relative flex items-center">
			<Link
				href={link}
				className={cn(
					buttonVariants({ variant: "ghost" }),
					"w-full justify-start text-sm text-muted-foreground hover:text-foreground 3xl:text-base 4xl:text-lg gap-2",
					isActive && "text-foreground",
				)}
				onClick={() => {
					if (clickCallback) clickCallback();
				}}>
				{icon}
				{label}
			</Link>
			{isActive && (
				<div className="absolute -bottom-[2px] left-1/2 hidden h-[2px] w-[80%] -translate-x-1/2 rounded-xl bg-foreground md:block"></div>
			)}
		</div>
	);
}

function PrivacyModeToggle() {
	const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode();
	const [isMounted, setIsMounted] = useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	// Don't render the icon until the component is mounted on the client
	// to avoid hydration mismatch since the privacy mode is loaded from localStorage
	if (!isMounted) {
		return (
			<Button
				variant="ghost"
				size="icon"
				disabled
				className="text-muted-foreground hover:text-foreground rounded-full">
				<Eye className="h-[1.2rem] w-[1.2rem]" />
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={togglePrivacyMode}
			title={isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
			className="text-muted-foreground hover:text-foreground rounded-full">
			{isPrivacyMode ? (
				<EyeOff className="h-[1.2rem] w-[1.2rem]" />
			) : (
				<Eye className="h-[1.2rem] w-[1.2rem]" />
			)}
		</Button>
	);
}

export default Navbar;

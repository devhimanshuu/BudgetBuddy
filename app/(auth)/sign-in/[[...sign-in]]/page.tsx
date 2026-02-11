import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-full max-w-md 2xl:max-w-lg mx-auto px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-card backdrop-blur-xl border border-border shadow-2xl shadow-primary/20 rounded-2xl p-8 2xl:p-12 transition-all hover:shadow-primary/30",
            headerTitle: "text-foreground font-bold text-3xl 2xl:text-4xl tracking-tight",
            headerSubtitle: "text-muted-foreground/80 text-sm 2xl:text-base mt-2",

            // Social buttons with gradient hover
            socialButtonsBlockButton:
              "bg-secondary hover:bg-secondary/90 text-secondary-foreground border-2 border-border/60 transition-all duration-300 h-12 2xl:h-14 px-4 2xl:px-6 rounded-xl hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 font-medium text-sm 2xl:text-base",
            socialButtonsBlockButtonText: "font-semibold",
            socialButtonsIconButton: "border-2 border-border/60 hover:border-primary/50 transition-all w-12 2xl:w-14 h-12 2xl:h-14",

            // Divider
            dividerLine: "bg-gradient-to-r from-transparent via-border to-transparent h-[1px] my-2 2xl:my-4",
            dividerText: "text-muted-foreground bg-card/60 px-2 2xl:px-4 text-xs 2xl:text-sm uppercase tracking-wider font-semibold backdrop-blur-sm",

            // Form fields with focus glow
            formFieldLabel: "text-foreground font-bold text-sm 2xl:text-base mb-2.5 2xl:mb-3",
            formFieldInput:
              "bg-background backdrop-blur-sm border-2 border-border text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card focus:border-primary rounded-xl h-12 2xl:h-14 px-4 2xl:px-6 transition-all duration-300 hover:border-primary/60 font-medium text-base 2xl:text-lg",
            formFieldInputShowPasswordButton: "text-muted-foreground hover:text-primary transition-colors w-10 2xl:w-12 h-10 2xl:h-12",

            // Primary button with gradient
            formButtonPrimary:
              "bg-gradient-to-r from-primary via-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground font-bold h-12 2xl:h-14 rounded-xl transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.03] mt-2 2xl:mt-4 text-base 2xl:text-lg",

            // Footer links
            footerActionLink: "text-primary hover:text-primary/80 font-semibold transition-colors underline-offset-4 hover:underline text-sm 2xl:text-base",
            footerActionText: "text-muted-foreground text-sm 2xl:text-base",

            // Identity preview
            identityPreviewText: "text-foreground font-medium text-sm 2xl:text-base",
            identityPreviewEditButton: "text-primary hover:text-primary/80 transition-colors text-sm 2xl:text-base",

            // Form field error
            formFieldErrorText: "text-red-500 text-xs 2xl:text-sm mt-1",

            // Alert
            alertText: "text-sm 2xl:text-base",

            // Other elements
            formResendCodeLink: "text-primary hover:text-primary/80 font-semibold transition-colors underline-offset-4 hover:underline text-sm 2xl:text-base",
            otpCodeFieldInput: "border-2 border-border/80 bg-background/90 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all rounded-lg h-12 2xl:h-16 w-12 2xl:w-16 text-center font-bold text-xl 2xl:text-2xl",

            // Hide Clerk branding
            footer: "hidden",
          },
          layout: {
            socialButtonsPlacement: "bottom",
            socialButtonsVariant: "blockButton",
          },
        }}
      />

      {/* Sign Up Link */}
      <div className="mt-6 2xl:mt-8 text-center">
        <p className="text-sm 2xl:text-base text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-primary hover:text-primary/80 font-semibold transition-colors underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

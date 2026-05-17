import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-ocean mb-2">
            Mogador Connect
          </h1>
          <p className="text-text-secondary text-[15px]">
            🌊 اكتشف الصويرة وتواصل مع حرفييها
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white border border-warm-border shadow-[0_8px_40px_rgba(0,0,0,0.08)] rounded-[24px]",
              headerTitle: "font-display text-text-primary",
              headerSubtitle: "text-text-secondary",
              formButtonPrimary:
                "bg-gradient-to-r from-terracotta to-saffron hover:opacity-90 shadow-[0_8px_20px_rgba(193,68,14,0.3)]",
              footerActionLink: "text-ocean hover:text-ocean/80",
              formFieldInput:
                "bg-warm-sand border-warm-border focus:border-ocean/50 focus:ring-ocean/10 rounded-xl",
              socialButtonsBlockButton:
                "border-warm-border hover:bg-warm-sand rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}

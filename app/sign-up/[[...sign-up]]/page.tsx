import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Branding header */}
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold text-[#18181B]">Souk Essaouira</h2>
          <p className="text-xs text-[#CA8A04] uppercase tracking-widest font-semibold mt-1">سوق الصويرة الجماعي</p>
        </div>
        
        {/* Clerk Sign Up component */}
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in"
          appearance={{
            variables: {
              colorPrimary: '#CA8A04',
              colorBackground: '#ffffff',
              colorText: '#18181B',
            }
          }}
        />
      </div>
    </div>
  );
}

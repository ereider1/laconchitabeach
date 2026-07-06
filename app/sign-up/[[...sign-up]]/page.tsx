import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-6 py-16">
      <div className="">
        <p className="mb-6 text-center font-display text-2xl text-marina">La Conchita</p>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#1B3A4B",
              colorBackground: "#F6F3EA",
              fontFamily: "var(--font-body)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </div>
    </main>
  );
}

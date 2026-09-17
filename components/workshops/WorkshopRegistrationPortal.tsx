import WorkshopAuthGate from "@/components/workshops/WorkshopAuthGate";
import WorkshopRegistrationForm from "@/components/workshops/WorkshopRegistrationForm";

type Props = {
  user: {
    email: string;
    fullName: string;
  } | null;
};

export default function WorkshopRegistrationPortal({ user }: Props) {
  if (!user) {
    return (
      <main className="min-h-screen bg-[#f5f9f8] px-4 py-12 text-slate-950 sm:px-6">
        <WorkshopAuthGate />
      </main>
    );
  }

  return <WorkshopRegistrationForm accountEmail={user.email} accountName={user.fullName} />;
}

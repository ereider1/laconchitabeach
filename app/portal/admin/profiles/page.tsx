import AdminResidents from "@/components/AdminResidents";

export default function AdminProfilesPage() {
  return (
    <div>
      <h2 className="font-display text-xl text-ink">Profiles</h2>
      <p className="mt-1 text-sm text-ink/60">
        Add, edit, or remove resident records — including full contact details and
        directory visibility.
      </p>

      <div className="mt-6">
        <AdminResidents />
      </div>
    </div>
  );
}

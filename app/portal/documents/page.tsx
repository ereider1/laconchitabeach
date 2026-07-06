import { connectToDatabase } from "@/lib/mongodb";
import Document from "@/lib/models/Document";

async function getDocuments() {
  await connectToDatabase();
  const docs = await Document.find().sort({ category: 1, title: 1 }).lean();
  return JSON.parse(JSON.stringify(docs));
}

const categoryLabels: Record<string, string> = {
  governing: "Governing documents",
  minutes: "Meeting minutes",
  financial: "Financials & budgets",
  forms: "Forms",
  other: "Other",
};

export default async function DocumentsPage() {
  let documents: Array<{ _id: string; title: string; description?: string; category: string; fileUrl: string }> = [];
  let dbError = false;

  try {
    documents = await getDocuments();
  } catch {
    dbError = true;
  }

  const grouped = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    (acc[doc.category] ??= []).push(doc);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Documents</h1>
      <p className="mt-2 text-ink/60">
        CC&amp;Rs, bylaws, budgets, and meeting minutes. Files are stored
        externally (e.g. S3 or Google Drive) — this page just links out.
      </p>

      {dbError && (
        <p className="mt-6 rounded-lg border border-dune/30 bg-sand/40 p-4 text-sm text-ink/60">
          Connect MongoDB to list documents here.
        </p>
      )}

      {!dbError && documents.length === 0 && (
        <p className="mt-6 text-sm text-ink/60">No documents uploaded yet.</p>
      )}

      <div className="mt-8 space-y-8">
        {Object.entries(grouped).map(([category, docs]) => (
          <section key={category}>
            <h2 className="font-display text-lg text-marina">
              {categoryLabels[category] ?? category}
            </h2>
            <ul className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10">
              {docs.map((d) => (
                <li key={d._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{d.title}</p>
                    {d.description && <p className="text-sm text-ink/60">{d.description}</p>}
                  </div>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-marina underline underline-offset-4"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import Document from "@/lib/models/Document";
import { isAdmin } from "@/lib/isAdmin";
import { normalizeDocumentCategory } from "@/lib/documentCategories";
import PortalDocuments from "@/components/PortalDocuments";

async function getDocuments() {
  await connectToDatabase();
  const docs = await Document.find().sort({ category: 1, title: 1 }).lean();
  return JSON.parse(JSON.stringify(docs.map((document) => ({
    ...document,
    category: normalizeDocumentCategory(document.category),
  }))));
}

export default async function DocumentsPage() {
  const { userId } = await auth();
  if (!(await isAdmin(userId))) redirect("/portal");

  let documents: Array<{
    _id: string;
    title: string;
    description?: string;
    category: string;
    fileUrl: string;
    createdAt: string;
  }> = [];
  let dbError = false;

  try {
    documents = await getDocuments();
  } catch {
    dbError = true;
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Documents</h1>
      <p className="mt-2 text-ink/60">
        CC&amp;Rs, bylaws, budgets, and meeting minutes.
      </p>

      {dbError && (
        <p className="mt-6 rounded-lg border border-dune/30 bg-sand/40 p-4 text-sm text-ink/60">
          Connect MongoDB to list documents here.
        </p>
      )}

      {!dbError && documents.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">No documents uploaded yet.</p>
      ) : (
        !dbError && <PortalDocuments documents={documents} />
      )}
    </div>
  );
}

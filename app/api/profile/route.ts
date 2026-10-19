import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Resident from "@/lib/models/Resident";
import { Resend } from "resend";

// The signed-in resident's own directory profile (if any).
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const resident = await Resident.findOne({ clerkUserId: userId }).lean();
  return NextResponse.json({ resident: resident ?? null });
}

// Self-service create/update of the signed-in resident's own profile.
// Body: { firstName, lastName, fullName?, address, alternateAddress?, email, phone?, moveInYear?, listedInDirectory }
export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const legacyFullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || legacyFullName;
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (
    !fullName ||
    fullName.length > 200 ||
    !address ||
    address.length > 300 ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { error: "Enter a valid name, address, and email" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const fields = {
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    fullName,
    address,
    alternateAddress:
      typeof body.alternateAddress === "string"
        ? body.alternateAddress.trim() || undefined
        : undefined,
    email,
    phone: typeof body.phone === "string" ? body.phone.trim() || undefined : undefined,
    moveInYear: body.moveInYear || undefined,
    listedInDirectory: !!body.listedInDirectory,
    clerkUserId: userId,
  };

  let resident = await Resident.findOne({ clerkUserId: userId });

  if (!resident) {
    // An admin may have already added this person to the roster by email
    // before they ever signed up — link that record instead of duplicating it.
    const unclaimed = await Resident.find({ clerkUserId: { $exists: false } });
    resident = unclaimed.find((r) => r.email.toLowerCase() === email) ?? null;

    if (resident) {
      Object.assign(resident, fields, { registrationStatus: "pending" });
      await resident.save();
    } else {
      resident = await Resident.create({
        ...fields,
        registrationStatus: "pending",
      });
    }
  } else {
    Object.assign(resident, fields);
    await resident.save();
  }

  if (resident.registrationStatus === "pending" && !resident.adminNotifiedAt) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !from || !to) {
      console.error(
        "Registration notification is not configured; set RESEND_API_KEY, RESEND_FROM_EMAIL, and CONTACT_TO_EMAIL."
      );
      return NextResponse.json(
        {
          error:
            "Your registration was saved, but the admin notification could not be sent. Please try again later.",
        },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    let result;
    try {
      result = await resend.emails.send({
        from,
        to: [to],
        replyTo: resident.email,
        subject: "New resident registration request",
        text: [
          "A new resident registration request needs review.",
          "",
          `Name: ${resident.fullName}`,
          `Address: ${resident.address}`,
          `Email: ${resident.email}`,
          resident.phone ? `Phone: ${resident.phone}` : "",
          "",
          "Sign in to the resident portal and open Admin → Profiles to approve or deny this request.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (error) {
      console.error("Unable to reach Resend while sending a registration notification.", error);
      return NextResponse.json(
        {
          error:
            "Your registration was saved, but the admin notification could not be sent. Please try again later.",
        },
        { status: 502 }
      );
    }

    if (result.error) {
      console.error("Resend rejected a registration notification.", result.error);
      return NextResponse.json(
        {
          error:
            "Your registration was saved, but the admin notification could not be sent. Please try again later.",
        },
        { status: 502 }
      );
    }

    resident.adminNotifiedAt = new Date();
    await resident.save();
  }

  return NextResponse.json({ resident });
}

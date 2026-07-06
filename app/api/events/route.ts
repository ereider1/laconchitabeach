import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const events = await Event.find().sort({ startsAt: 1 }).lean();
  return NextResponse.json({ events });
}

// Body: { eventId: string, guests?: number }
// Toggling: calling again removes the caller's existing RSVP.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, guests = 0 } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  const user = await currentUser();
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const existingIndex = event.rsvps.findIndex((r) => r.clerkUserId === userId);
  if (existingIndex >= 0) {
    event.rsvps.splice(existingIndex, 1);
  } else {
    event.rsvps.push({
      clerkUserId: userId,
      name: user?.fullName ?? user?.username ?? "Resident",
      guests,
    });
  }
  await event.save();

  return NextResponse.json({ event });
}

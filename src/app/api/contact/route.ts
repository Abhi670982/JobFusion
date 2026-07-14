import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";
import Settings from "@/models/Settings";
import { sendContactNotification } from "@/lib/email";
import sanitizeHtml from "sanitize-html";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validate inputs exist
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    // Input cleaning/validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    // Check sizes & empty
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return NextResponse.json(
        { success: false, error: "Fields cannot be blank." },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Name must be less than 100 characters." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (trimmedSubject.length > 200) {
      return NextResponse.json(
        { success: false, error: "Subject must be less than 200 characters." },
        { status: 400 }
      );
    }

    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Message must be between 10 and 5000 characters." },
        { status: 400 }
      );
    }

    // Sanitization
    const cleanName = sanitizeHtml(trimmedName, { allowedTags: [], allowedAttributes: {} });
    const cleanSubject = sanitizeHtml(trimmedSubject, { allowedTags: [], allowedAttributes: {} });
    const cleanMessage = sanitizeHtml(trimmedMessage, { allowedTags: [], allowedAttributes: {} });

    // Store in MongoDB
    const newMessage = await ContactMessage.create({
      name: cleanName,
      email: trimmedEmail,
      subject: cleanSubject,
      message: cleanMessage,
      status: "unread",
    });

    // Retrieve configured support email
    let supportEmail = "akchauhan1172@gmail.com";
    try {
      const globalSettings = await Settings.findOne({ settingsId: "global" });
      if (globalSettings && globalSettings.contactEmail) {
        supportEmail = globalSettings.contactEmail;
      }
    } catch (dbErr) {
      console.error("[Contact API] Error reading support email from settings:", dbErr);
    }

    // Trigger email sending
    try {
      await sendContactNotification({
        to: supportEmail,
        name: cleanName,
        email: trimmedEmail,
        subject: cleanSubject,
        message: cleanMessage,
      });
    } catch (emailErr) {
      console.error("[Contact API] Notification email failed:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you as soon as possible.",
      data: { id: newMessage._id },
    });
  } catch (error: any) {
    console.error("[Contact API] Internal Server Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

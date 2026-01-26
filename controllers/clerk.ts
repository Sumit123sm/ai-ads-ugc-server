import { Request, Response } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { prisma } from "../configs/prisma.js";
// import * as SEntry from "@sentry/node"

const clerkWebhooks = async (req: Request, res: Response) => {
  try {
    console.log("📥 Webhook received:", req.body);
    
    const evt: any = await verifyWebhook(req);
    const { data, type } = evt;
    
    console.log("✅ Webhook verified - Event type:", type);

    switch (type) {
      case "user.created": {
        console.log("👤 User created in Clerk:", data.id);
        // Handled automatically when user makes first request via getUserCredits
        break;
      }

      case "user.updated": {
        console.log("👤 Updating user:", data.id);
        await prisma.user.update({
          where: { id: data.id },
          data: {
            email: data?.email_addresses[0]?.email_address || "",
            name: (data?.first_name || "") + " " + (data?.last_name || ""),
            image: data?.image_url || "",
          },
        });
        console.log("✅ User updated successfully");
        break;
      }

      case "user.deleted": {
        console.log("🗑️ Deleting user:", data.id);
        await prisma.user.delete({ where: { id: data.id } });
        console.log("✅ User deleted successfully");
        break;
      }

      case "paymentAttempt.updated": {
        console.log("💳 Payment attempt data:", JSON.stringify(data, null, 2));
        
        if (
          (data.charge_type === "recurring" || data.charge_type === "checkout") &&
          data.status === "paid"
        ) {
          const credits = { pro: 80, premium: 240 };
          const clerkUserId = data?.payer?.user_id;
          const planId: keyof typeof credits = data?.subscription_items?.[0]?.plan?.slug;

          if (!clerkUserId) {
            console.error("❌ No user_id in payment data");
            return res.status(400).json({ message: "Missing user_id" });
          }

          if (planId === "pro" || planId === "premium") {
            console.log(`💰 Adding ${credits[planId]} credits for ${planId} plan to user ${clerkUserId}`);
            
            await prisma.user.update({
              where: { id: clerkUserId },
              data: {
                credits: { increment: credits[planId] },
              },
            });
            console.log("✅ Credits added successfully");
          } else {
            console.log("⚠️ Unknown plan:", planId);
          }
        }
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", type);
        break;
    }

    res.status(200).json({ success: true, message: "Webhook received: " + type });

  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    // Sentry.captureException(error)
    res.status(500).json({ success: false, message: error.message });
  }
};

export default clerkWebhooks;
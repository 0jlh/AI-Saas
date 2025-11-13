import Stripe from "stripe";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe signature", { status: 400 });
  }

  const body = await req.arrayBuffer();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(body), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId)
      return new NextResponse("User id is required", { status: 400 });

    await prismadb.userSubscription.upsert({
      where: {
        userId: session.metadata.userId,
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        userId: session.metadata.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    if (!invoice.subscription) {
      return new NextResponse("Subscription id is required", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );

    try {
      await prismadb.userSubscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });
    } catch (error) {
      console.error("[WEBHOOK_UPDATE_SUBSCRIPTION_ERROR]", error);
    }
  }

  return new NextResponse(null, { status: 200 });
}

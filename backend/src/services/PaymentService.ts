// backend/src/services/PaymentService.ts

import Stripe from 'stripe';
import { query } from '../database/index';
import { cardPackService } from './CardPackService'; // Import the new CardPackService
import { v4 as uuidv4 } from 'uuid'; // Import uuid for purchase ID

interface Purchase {
  userId: string;
  productType: string;
  productId: string;
  quantity: number;
  amountUsd: number;
  currency: string;
  paymentMethod: string;
  paymentId: string;
  status: string;
}

export class PaymentService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil', // Use the API version expected by the project
    });
  }

  public async createCheckoutSession(
    userId: string,
    packType: string,
    quantity: number = 1
  ): Promise<{ sessionId: string; url: string } | undefined> {
    try {
      const packDetails = await cardPackService.getPackDetails(packType);
      if (!packDetails) {
        throw new Error(`Pack type ${packType} not found.`);
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: packDetails.pack_name,
                description: `Digital card pack: ${packDetails.pack_name}`,
              },
              unit_amount: Math.round(packDetails.price_usd * 100), // Amount in cents
            },
            quantity: quantity,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          userId: userId,
          packType: packType,
          quantity: quantity,
        },
      });

      return { sessionId: session.id, url: session.url! };
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw error;
    }
  }

  public async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set.');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.fulfillOrder(session);
        break;
      // Handle other event types as needed (e.g., 'invoice.payment_succeeded', 'customer.subscription.deleted')
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  private async fulfillOrder(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, packType, quantity } = session.metadata as {
      userId: string;
      packType: string;
      quantity: string;
    };

    if (!userId || !packType || !quantity) {
      console.error('Missing metadata in checkout session:', session.metadata);
      return;
    }

    try {
      // Record the purchase in our database
      await query(
        `INSERT INTO purchases (id, user_id, product_type, product_id, quantity, amount_usd, currency, payment_method, payment_id, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          userId,
          'pack',
          packType,
          parseInt(quantity),
          session.amount_total! / 100, // Convert cents to dollars
          session.currency?.toUpperCase() || 'USD',
          'stripe',
          session.id,
          'completed',
        ]
      );

      // Mint digital cards for the user
      const mintedCards = await cardPackService.mintDigitalCards(userId, packType);
      console.log(`Minted ${mintedCards.length} cards for user ${userId} from pack ${packType}.`);

      // Optionally, update user's currency if packs can be bought with gems
      // For now, assuming USD purchase.
    } catch (error) {
      console.error('Error fulfilling order:', error);
      // Implement robust error handling, e.g., refund, retry mechanism
    }
  }
}

export const paymentService = new PaymentService();
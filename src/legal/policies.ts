import { SHOP_NAME } from '../brand';

export { SHOP_NAME };

export const LEGAL_PATHS = {
  terms: '/legal/terms',
  refund: '/legal/refund',
  returns: '/legal/returns',
} as const;

export type LegalSlug = keyof typeof LEGAL_PATHS;

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  slug: LegalSlug;
  title: string;
  path: string;
  updated: string;
  summary: string;
  sections: LegalSection[];
}

const PLATFORM =
  'Tokri is a neighborhood grocery delivery service. Orders are placed in the Tokri customer app and fulfilled by the local shop for the service area covering your delivery address.';

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  terms: {
    slug: 'terms',
    title: 'Terms and Conditions',
    path: LEGAL_PATHS.terms,
    updated: '29 September 2026',
    summary: 'Rules for using Tokri to shop groceries with cash on delivery.',
    sections: [
      {
        heading: '1. The service',
        paragraphs: [
          PLATFORM,
          'Tokri currently accepts cash on delivery only. There is no card, UPI, wallet, or other prepaid checkout in the app.',
          'Delivery is limited to active service areas. An address is accepted only when its PIN code and map location are inside a live coverage area. If coverage changes, an address that previously worked may be rejected at quote or checkout.',
        ],
      },
      {
        heading: '2. Accounts',
        paragraphs: [
          'You create and sign in to a customer account with an Indian mobile number. Tokri sends a one-time verification code by SMS. You must keep that code confidential. We do not ask you to share the code with anyone other than by entering it in the app.',
          'The mobile number on an account cannot be changed after signup. You may update your delivery name and optional email from Profile. You may review and sign out of devices from Signed-in devices.',
        ],
      },
      {
        heading: '3. Orders',
        paragraphs: [
          'A quoted total is calculated by the server from the products in your bag, stock, and the delivery fee for your address. Placing an order authorizes Tokri to send that cash-on-delivery ticket to the shop.',
          'You may cancel an order only while its status is Placed. After the shop accepts the order, cancellation is no longer available in the app. Cancelled orders restore item stock.',
          'Pay the COD total in cash when the order is delivered. Payment stays pending in the app until then. Tokri does not collect prepaid funds and does not process card or UPI charges.',
        ],
      },
      {
        heading: '4. Catalogue and availability',
        paragraphs: [
          'Product names, prices, photos, and stock are set by operators. Items can go out of stock or become unavailable between browsing and checkout. If a quote or place request fails because a product is unavailable, the order is not created.',
        ],
      },
      {
        heading: '5. Acceptable use',
        paragraphs: [
          'Use Tokri only to shop for delivery to an address you are authorized to receive. Do not attempt to interfere with other customers, operators, or the service.',
        ],
      },
      {
        heading: '6. Related policies',
        paragraphs: [
          'Returns are described in the Order return policy. Because checkout is cash on delivery, money movement is described in the Refund policy. Those pages are part of these terms.',
        ],
      },
    ],
  },
  refund: {
    slug: 'refund',
    title: 'Refund policy',
    path: LEGAL_PATHS.refund,
    updated: '29 September 2026',
    summary: 'How Tokri handles money when checkout is cash on delivery only.',
    sections: [
      {
        heading: '1. No prepaid checkout',
        paragraphs: [
          'Tokri V1 checkout is cash on delivery only. The app does not charge cards, UPI, net banking, or wallets, and it does not store a prepaid balance.',
          'The order total remains pending until you pay cash on delivery. Tokri cannot issue an in-app refund to a card or UPI account because those payments are not taken.',
        ],
      },
      {
        heading: '2. Cancelled orders',
        paragraphs: [
          'If you cancel while the order is still Placed, item stock is restored and no cash is collected for that order. There is nothing for Tokri to refund.',
          'After the shop accepts an order, the app cannot cancel it. Any dispute about goods already on the way is handled as a return after delivery, if a return is available under the Order return policy.',
        ],
      },
      {
        heading: '3. Completed returns',
        paragraphs: [
          'When a shop completes an accepted return, Tokri restores the returned items to stock. Completing a return does not create an automated cash refund in the app.',
          'Cash paid to the rider or shop is not reversed by Tokri software. Any cash settlement after a completed return is between you and the shop and is not processed, tracked, or guaranteed in the app.',
        ],
      },
      {
        heading: '4. Rejected or expired returns',
        paragraphs: [
          'If a return request is declined, or if the return window closed before a request was made, Tokri does not refund the COD total and does not restore stock for that order through a return.',
        ],
      },
    ],
  },
  returns: {
    slug: 'returns',
    title: 'Order return policy',
    path: LEGAL_PATHS.returns,
    updated: '29 September 2026',
    summary: 'When you can request a return and what the shop can do with it.',
    sections: [
      {
        heading: '1. When a return can be requested',
        paragraphs: [
          'You may request a return only after the order is delivered (shown as completed or delivered in the app).',
          'The request must be made within 30 minutes of delivery completion. The window is measured from the delivery completion time stored on the order. After 30 minutes the app will not accept a new return request.',
          'An order can have only one return request. If a request is already on file, you cannot submit another for the same order.',
        ],
      },
      {
        heading: '2. How to request',
        paragraphs: [
          'Open the order in Order history and use Request return. A reason is optional. Submitting the request notifies the shop. It does not by itself restore stock or change the COD total.',
        ],
      },
      {
        heading: '3. Shop decisions',
        paragraphs: [
          'The shop may accept, complete, or reject an open return request.',
          'Accept means the shop has agreed to process the return. Stock is not restored at accept.',
          'Complete means the shop has finished the return. Tokri then restores stock for the order lines. Cash on delivery is not refunded in the app.',
          'Reject means the shop declined the request. Stock is not restored.',
        ],
      },
      {
        heading: '4. What this policy does not cover',
        paragraphs: [
          'Returns are not available for orders that are still placed, accepted, or cancelled, or after the 30-minute window. Tokri does not offer an automatic replacement order from a return request.',
        ],
      },
    ],
  },
};

export const LEGAL_LINKS: { slug: LegalSlug; label: string; path: string }[] = [
  { slug: 'terms', label: 'Terms and Conditions', path: LEGAL_PATHS.terms },
  { slug: 'refund', label: 'Refund policy', path: LEGAL_PATHS.refund },
  { slug: 'returns', label: 'Order return policy', path: LEGAL_PATHS.returns },
];

/**
 * Google Analytics 4 event tracking service
 */

const GA_MEASUREMENT_ID = (import.meta as any).env.VITE_GA_MEASUREMENT_ID;

// Initial config
if (GA_MEASUREMENT_ID && typeof window !== 'undefined' && (window as any).gtag) {
  (window as any).gtag('config', GA_MEASUREMENT_ID);
}

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (GA_MEASUREMENT_ID && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      ...eventParams,
      send_to: GA_MEASUREMENT_ID,
    });
  } else {
    // Fallback for development/missing ID
    console.debug(`[Analytics] Event tracked: ${eventName}`, eventParams);
  }
};

/**
 * Ecommerce Events
 */

export const trackViewItem = (product: any) => {
  trackEvent('view_item', {
    currency: 'BDT',
    value: product.price,
    items: [
      {
        item_id: product.id?.toString() || product.title,
        item_name: product.title,
        item_category: product.category,
        price: product.price,
        quantity: 1
      }
    ]
  });
};

export const trackAddToCart = (product: any) => {
  trackEvent('add_to_cart', {
    currency: 'BDT',
    value: product.price,
    items: [
      {
        item_id: product.id?.toString() || product.title,
        item_name: product.title,
        item_category: product.category,
        price: product.price,
        quantity: 1
      }
    ]
  });
};

export const trackPurchase = (items: any[], totalAmount: number, orderId: string) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: totalAmount,
    currency: 'BDT',
    items: items.map(item => ({
      item_id: item.id?.toString() || item.productId?.toString() || item.title,
      item_name: item.title,
      price: item.price,
      quantity: item.quantity
    }))
  });
};

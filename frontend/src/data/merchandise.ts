// Merchandise Store System for _____ Wars
// Digital and physical products, bundles, and purchase flows

export type ProductType = 'digital' | 'physical' | 'bundle' | 'subscription';
export type ProductCategory = 'cosmetics' | 'apparel' | 'collectibles' | 'boosts' | 'characters' | 'bundles' | 'premium';
export type CurrencyType = 'gems' | 'coins' | 'usd' | 'premium_currency';
export type ProductRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'exclusive';

export interface ProductPrice {
  currency: CurrencyType;
  amount: number;
  originalPrice?: number; // For sales/discounts
  discount?: number; // Percentage discount
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  type: ProductType;
  rarity: ProductRarity;
  prices: ProductPrice[];
  image: string;
  previewImages?: string[];
  isLimited?: boolean;
  limitedQuantity?: number;
  remaining?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  releaseDate: Date;
  expirationDate?: Date;
  requiredLevel?: number;
  tags: string[];
  effects?: ProductEffect[];
  variants?: ProductVariant[];
  bundleContents?: string[]; // Product IDs for bundles
  unlockConditions?: string[];
}

export interface ProductEffect {
  type: 'stat_boost' | 'xp_boost' | 'cosmetic' | 'unlock' | 'special';
  description: string;
  value?: number;
  duration?: number; // in hours, null for permanent
  target?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  description: string;
  additionalPrice?: number;
  image?: string;
  attributes: Record<string, string>; // size, color, etc.
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: Date;
}

export interface PurchaseHistory {
  id: string;
  userId: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    priceAtPurchase: ProductPrice;
  }[];
  totalAmount: ProductPrice;
  purchaseDate: Date;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
}

export interface UserInventory {
  userId: string;
  ownedProducts: {
    productId: string;
    variantId?: string;
    quantity: number;
    purchaseDate: Date;
    isActive?: boolean; // For cosmetics, boosts, etc.
    expirationDate?: Date; // For temporary items
  }[];
  activatedCosmetics: {
    avatar?: string;
    title?: string;
    cardBack?: string;
    profileFrame?: string;
    badge?: string;
  };
}

// Product catalog
export const digitalProducts: Product[] = [
  {
    id: 'avatar_achilles_gold',
    name: 'Golden Achilles Avatar',
    description: 'Show your warrior spirit with this exclusive golden Achilles avatar frame',
    category: 'cosmetics',
    type: 'digital',
    rarity: 'legendary',
    prices: [{ currency: 'gems', amount: 500 }],
    image: '/store/avatars/achilles_gold.png',
    isNew: true,
    isFeatured: true,
    releaseDate: new Date('2024-06-01'),
    tags: ['avatar', 'achilles', 'gold', 'legendary'],
    effects: [
      {
        type: 'cosmetic',
        description: 'Exclusive golden avatar frame with animation effects'
      }
    ]
  },
  {
    id: 'title_arena_champion',
    name: 'Arena Champion Title',
    description: 'Display your mastery with the prestigious Arena Champion title',
    category: 'cosmetics',
    type: 'digital',
    rarity: 'epic',
    prices: [{ currency: 'gems', amount: 300 }],
    image: '/store/titles/arena_champion.png',
    releaseDate: new Date('2024-05-15'),
    tags: ['title', 'champion', 'arena', 'epic'],
    requiredLevel: 25,
    effects: [
      {
        type: 'cosmetic',
        description: 'Prestigious title shown next to your name'
      }
    ]
  },
  {
    id: 'cardback_ancient_ruins',
    name: 'Ancient Ruins Card Back',
    description: 'Mystical card back featuring the ruins of ancient civilizations',
    category: 'cosmetics',
    type: 'digital',
    rarity: 'rare',
    prices: [{ currency: 'gems', amount: 200 }],
    image: '/store/cardbacks/ancient_ruins.png',
    releaseDate: new Date('2024-06-10'),
    tags: ['cardback', 'ancient', 'ruins', 'mystical'],
    effects: [
      {
        type: 'cosmetic',
        description: 'Custom card back design for your deck'
      }
    ]
  },
  {
    id: 'boost_xp_mega',
    name: 'Mega XP Boost',
    description: 'Double XP gain for 24 hours - perfect for power leveling!',
    category: 'boosts',
    type: 'digital',
    rarity: 'common',
    prices: [{ currency: 'gems', amount: 100 }],
    image: '/store/boosts/xp_mega.png',
    releaseDate: new Date('2024-06-01'),
    tags: ['boost', 'xp', 'temporary', 'leveling'],
    effects: [
      {
        type: 'xp_boost',
        description: '+100% XP gain from all sources',
        value: 100,
        duration: 24
      }
    ]
  },
  {
    id: 'character_loki_premium',
    name: 'Premium Loki Skin',
    description: 'Exclusive premium skin for Loki with unique animations and effects',
    category: 'characters',
    type: 'digital',
    rarity: 'mythic',
    prices: [{ currency: 'gems', amount: 1000 }],
    image: '/store/skins/loki_premium.png',
    isLimited: true,
    limitedQuantity: 1000,
    remaining: 847,
    isFeatured: true,
    releaseDate: new Date('2024-06-15'),
    expirationDate: new Date('2024-07-15'),
    tags: ['loki', 'skin', 'premium', 'limited', 'mythic'],
    effects: [
      {
        type: 'cosmetic',
        description: 'Exclusive character skin with unique visual effects'
      },
      {
        type: 'stat_boost',
        description: '+5% critical hit chance when using Loki',
        value: 5
      }
    ]
  }
];

export const physicalProducts: Product[] = [
  {
    id: 'tshirt_wars_logo',
    name: '_____ Wars Logo T-Shirt',
    description: 'Premium cotton t-shirt featuring the iconic _____ Wars logo',
    category: 'apparel',
    type: 'physical',
    rarity: 'common',
    prices: [{ currency: 'usd', amount: 24.99 }],
    image: '/store/apparel/tshirt_logo.png',
    previewImages: [
      '/store/apparel/tshirt_logo_front.png',
      '/store/apparel/tshirt_logo_back.png'
    ],
    releaseDate: new Date('2024-06-01'),
    tags: ['tshirt', 'apparel', 'logo', 'cotton'],
    variants: [
      {
        id: 'size_s',
        name: 'Small',
        description: 'Size S',
        attributes: { size: 'S', color: 'black' }
      },
      {
        id: 'size_m',
        name: 'Medium',
        description: 'Size M',
        attributes: { size: 'M', color: 'black' }
      },
      {
        id: 'size_l',
        name: 'Large',
        description: 'Size L',
        attributes: { size: 'L', color: 'black' }
      },
      {
        id: 'size_xl',
        name: 'X-Large',
        description: 'Size XL',
        attributes: { size: 'XL', color: 'black' }
      }
    ]
  },
  {
    id: 'hoodie_achilles_design',
    name: 'Achilles Warrior Hoodie',
    description: 'Premium hoodie featuring epic Achilles artwork',
    category: 'apparel',
    type: 'physical',
    rarity: 'rare',
    prices: [
      { currency: 'usd', amount: 54.99, originalPrice: 64.99, discount: 15 }
    ],
    image: '/store/apparel/hoodie_achilles.png',
    isOnSale: true,
    isFeatured: true,
    releaseDate: new Date('2024-05-20'),
    tags: ['hoodie', 'achilles', 'warrior', 'artwork'],
    variants: [
      {
        id: 'size_color_s_black',
        name: 'Small - Black',
        description: 'Size S in Black',
        attributes: { size: 'S', color: 'black' }
      },
      {
        id: 'size_color_m_black',
        name: 'Medium - Black',
        description: 'Size M in Black',
        attributes: { size: 'M', color: 'black' }
      },
      {
        id: 'size_color_l_grey',
        name: 'Large - Grey',
        description: 'Size L in Grey',
        attributes: { size: 'L', color: 'grey' }
      }
    ]
  },
  {
    id: 'poster_character_collection',
    name: 'Character Collection Poster Set',
    description: 'High-quality poster set featuring all legendary characters',
    category: 'collectibles',
    type: 'physical',
    rarity: 'epic',
    prices: [{ currency: 'usd', amount: 29.99 }],
    image: '/store/collectibles/poster_set.png',
    releaseDate: new Date('2024-06-05'),
    tags: ['poster', 'collection', 'art', 'characters'],
    effects: [
      {
        type: 'unlock',
        description: 'Includes digital wallpaper downloads'
      }
    ]
  },
  {
    id: 'figurine_fenrir',
    name: 'Fenrir Collectible Figurine',
    description: 'Limited edition hand-painted Fenrir figurine',
    category: 'collectibles',
    type: 'physical',
    rarity: 'legendary',
    prices: [{ currency: 'usd', amount: 89.99 }],
    image: '/store/collectibles/fenrir_figure.png',
    isLimited: true,
    limitedQuantity: 500,
    remaining: 247,
    isFeatured: true,
    releaseDate: new Date('2024-06-20'),
    tags: ['figurine', 'fenrir', 'collectible', 'limited'],
    effects: [
      {
        type: 'unlock',
        description: 'Unlocks exclusive Fenrir avatar and title in-game'
      }
    ]
  }
];

export const bundleProducts: Product[] = [
  {
    id: 'bundle_starter_pack',
    name: 'Ultimate Starter Pack',
    description: 'Everything you need to begin your legendary journey!',
    category: 'bundles',
    type: 'bundle',
    rarity: 'epic',
    prices: [
      { currency: 'gems', amount: 1500, originalPrice: 2000, discount: 25 }
    ],
    image: '/store/bundles/starter_pack.png',
    isNew: true,
    isFeatured: true,
    isOnSale: true,
    releaseDate: new Date('2024-06-01'),
    tags: ['bundle', 'starter', 'value', 'beginner'],
    bundleContents: [
      'avatar_achilles_gold',
      'boost_xp_mega',
      'cardback_ancient_ruins',
      'title_arena_champion'
    ],
    effects: [
      {
        type: 'special',
        description: 'Includes bonus 500 gems and exclusive bundle badge'
      }
    ]
  },
  {
    id: 'bundle_collector_edition',
    name: 'Collector\'s Edition Bundle',
    description: 'The ultimate collection for true _____ Wars fans',
    category: 'bundles',
    type: 'bundle',
    rarity: 'mythic',
    prices: [{ currency: 'usd', amount: 149.99 }],
    image: '/store/bundles/collector_edition.png',
    isLimited: true,
    limitedQuantity: 100,
    remaining: 23,
    isFeatured: true,
    releaseDate: new Date('2024-06-10'),
    expirationDate: new Date('2024-08-10'),
    tags: ['bundle', 'collector', 'exclusive', 'premium'],
    bundleContents: [
      'tshirt_wars_logo',
      'figurine_fenrir',
      'character_loki_premium',
      'poster_character_collection'
    ],
    effects: [
      {
        type: 'unlock',
        description: 'Exclusive Collector title and unique profile frame'
      },
      {
        type: 'special',
        description: 'Lifetime premium membership included'
      }
    ]
  }
];

export const premiumProducts: Product[] = [
  {
    id: 'subscription_premium_monthly',
    name: 'Premium Membership (Monthly)',
    description: 'Unlock premium features, exclusive content, and special bonuses',
    category: 'premium',
    type: 'subscription',
    rarity: 'rare',
    prices: [{ currency: 'usd', amount: 9.99 }],
    image: '/store/premium/monthly_sub.png',
    releaseDate: new Date('2024-06-01'),
    tags: ['subscription', 'premium', 'monthly', 'benefits'],
    effects: [
      {
        type: 'stat_boost',
        description: '+50% XP gain from all sources',
        value: 50
      },
      {
        type: 'unlock',
        description: 'Access to premium training facilities'
      },
      {
        type: 'special',
        description: 'Monthly gem allowance and exclusive cosmetics'
      }
    ]
  },
  {
    id: 'currency_gems_large',
    name: 'Large Gem Pack',
    description: '2500 premium gems for purchasing exclusive items',
    category: 'premium',
    type: 'digital',
    rarity: 'common',
    prices: [{ currency: 'usd', amount: 19.99 }],
    image: '/store/currency/gems_large.png',
    releaseDate: new Date('2024-06-01'),
    tags: ['gems', 'currency', 'premium', 'value'],
    effects: [
      {
        type: 'special',
        description: 'Adds 2500 gems to your account balance'
      }
    ]
  }
];

// All products combined
export const allProducts: Product[] = [
  ...digitalProducts,
  ...physicalProducts,
  ...bundleProducts,
  ...premiumProducts
];

// Helper functions
export function getProductsByCategory(category: ProductCategory): Product[] {
  return allProducts.filter(product => product.category === category);
}

export function getProductsByType(type: ProductType): Product[] {
  return allProducts.filter(product => product.type === type);
}

export function getFeaturedProducts(): Product[] {
  return allProducts.filter(product => product.isFeatured);
}

export function getNewProducts(): Product[] {
  return allProducts.filter(product => product.isNew);
}

export function getOnSaleProducts(): Product[] {
  return allProducts.filter(product => product.isOnSale);
}

export function getLimitedProducts(): Product[] {
  return allProducts.filter(product => product.isLimited);
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return allProducts.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getProductById(id: string): Product | undefined {
  return allProducts.find(product => product.id === id);
}

export function calculateProductPrice(product: Product, currencyType: CurrencyType): ProductPrice | null {
  const price = product.prices.find(p => p.currency === currencyType);
  if (!price) return null;

  if (price.discount && price.originalPrice) {
    return {
      currency: price.currency,
      amount: Math.round(price.originalPrice * (1 - price.discount / 100)),
      originalPrice: price.originalPrice,
      discount: price.discount
    };
  }

  return price;
}

export function calculateCartTotal(items: CartItem[], currency: CurrencyType): number {
  return items.reduce((total, item) => {
    const product = getProductById(item.productId);
    if (!product) return total;

    const price = calculateProductPrice(product, currency);
    if (!price) return total;

    return total + (price.amount * item.quantity);
  }, 0);
}

export function canAffordProduct(product: Product, userCurrencies: Record<CurrencyType, number>, currency: CurrencyType): boolean {
  const price = calculateProductPrice(product, currency);
  if (!price) return false;

  return (userCurrencies[currency] || 0) >= price.amount;
}

export function isProductAvailable(product: Product): boolean {
  const now = new Date();
  
  // Check if product has expired
  if (product.expirationDate && now > product.expirationDate) {
    return false;
  }

  // Check if limited product is sold out
  if (product.isLimited && product.remaining !== undefined && product.remaining <= 0) {
    return false;
  }

  return true;
}

export function getProductRarityColor(rarity: ProductRarity): string {
  const colors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-orange-500 to-yellow-500',
    mythic: 'from-pink-500 to-red-500',
    exclusive: 'from-rainbow-500 to-rainbow-600'
  };
  return colors[rarity] || colors.common;
}

export function formatPrice(price: ProductPrice): string {
  const symbols = {
    gems: '💎',
    coins: '🪙',
    usd: '$',
    premium_currency: '⭐'
  };

  const symbol = symbols[price.currency] || '';
  
  if (price.currency === 'usd') {
    return `${symbol}${price.amount.toFixed(2)}`;
  }
  
  return `${symbol}${price.amount.toLocaleString()}`;
}
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart,
  Star,
  Crown,
  Sparkles,
  Filter,
  Search,
  Grid,
  List,
  Heart,
  Eye,
  ShoppingBag,
  Package,
  Zap,
  Clock,
  Tag,
  Gift,
  Percent,
  CreditCard,
  Coins,
  Diamond,
  Badge,
  Shirt,
  Award,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  Truck,
  Download
} from 'lucide-react';
import { 
  Product,
  ProductCategory,
  ProductType,
  CurrencyType,
  CartItem,
  allProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getNewProducts,
  getOnSaleProducts,
  getLimitedProducts,
  searchProducts,
  getProductById,
  calculateProductPrice,
  calculateCartTotal,
  formatPrice,
  getProductRarityColor,
  isProductAvailable
} from '@/data/merchandise';

interface MerchStoreProps {
  currentUserId: string;
  userCurrencies?: Record<CurrencyType, number>;
  userInventory?: string[];
}

export default function MerchStore({
  currentUserId,
  userCurrencies = { gems: 1500, coins: 25000, usd: 50, premium_currency: 100 },
  userInventory = []
}: MerchStoreProps) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'featured' | 'all'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('gems');

  // Filter products based on active category and search
  const getFilteredProducts = (): Product[] => {
    let products: Product[] = [];

    switch (activeCategory) {
      case 'featured':
        products = getFeaturedProducts();
        break;
      case 'all':
        products = allProducts;
        break;
      default:
        products = getProductsByCategory(activeCategory);
    }

    if (searchTerm) {
      products = searchProducts(searchTerm);
    }

    return products.filter(isProductAvailable);
  };

  const filteredProducts = getFilteredProducts();

  // Cart functions
  const addToCart = (product: Product, variantId?: string) => {
    const existingItem = cart.find(item => 
      item.productId === product.id && item.variantId === variantId
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id && item.variantId === variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        variantId,
        quantity: 1,
        addedAt: new Date()
      }]);
    }
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(cart.filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    ));
  };

  const updateCartQuantity = (productId: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId && item.variantId === variantId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return calculateCartTotal(cart, selectedCurrency);
  };

  // UI helper functions
  const getCategoryIcon = (category: ProductCategory | 'featured' | 'all') => {
    const icons = {
      featured: <Star className="w-5 h-5" />,
      all: <Grid className="w-5 h-5" />,
      cosmetics: <Sparkles className="w-5 h-5" />,
      apparel: <Shirt className="w-5 h-5" />,
      collectibles: <Award className="w-5 h-5" />,
      boosts: <Zap className="w-5 h-5" />,
      characters: <Crown className="w-5 h-5" />,
      bundles: <Package className="w-5 h-5" />,
      premium: <Diamond className="w-5 h-5" />
    };
    return icons[category] || <Grid className="w-5 h-5" />;
  };

  const getCurrencyIcon = (currency: CurrencyType) => {
    const icons = {
      gems: <Diamond className="w-4 h-4 text-blue-400" />,
      coins: <Coins className="w-4 h-4 text-yellow-400" />,
      usd: <CreditCard className="w-4 h-4 text-green-400" />,
      premium_currency: <Star className="w-4 h-4 text-purple-400" />
    };
    return icons[currency];
  };

  const isOwned = (productId: string) => {
    return userInventory.includes(productId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <ShoppingBag className="w-8 h-8 text-green-400" />
          Merch Store
        </h1>
        <p className="text-gray-400 text-lg">
          Legendary gear for legendary warriors
        </p>
      </div>

      {/* Currency Display & Cart */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h3 className="text-white font-semibold">Your Balance:</h3>
            <div className="flex gap-4">
              {Object.entries(userCurrencies).map(([currency, amount]) => (
                <div key={currency} className="flex items-center gap-2">
                  {getCurrencyIcon(currency as CurrencyType)}
                  <span className="text-white font-bold">{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart
            {getCartItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {getCartItemCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Navigation & Controls */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Category Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 lg:pb-0">
            {[
              { id: 'featured', label: 'Featured' },
              { id: 'all', label: 'All Items' },
              { id: 'cosmetics', label: 'Cosmetics' },
              { id: 'apparel', label: 'Apparel' },
              { id: 'collectibles', label: 'Collectibles' },
              { id: 'boosts', label: 'Boosts' },
              { id: 'characters', label: 'Characters' },
              { id: 'bundles', label: 'Bundles' },
              { id: 'premium', label: 'Premium' }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {getCategoryIcon(category.id as any)}
                <span className="hidden sm:inline">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
          </div>

          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as CurrencyType)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            <option value="gems">💎 Gems</option>
            <option value="coins">🪙 Coins</option>
            <option value="usd">💵 USD</option>
            <option value="premium_currency">⭐ Premium</option>
          </select>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">{filteredProducts.length} products</span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      {activeCategory === 'featured' && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Limited Time Offers
              </h3>
              <p className="text-gray-300">Exclusive deals that won&apos;t last long!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Sale ends in:</div>
              <div className="text-xl font-bold text-white">23:45:12</div>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid/List */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {filteredProducts.map((product) => {
          const price = calculateProductPrice(product, selectedCurrency);
          const owned = isOwned(product.id);
          const rarityColor = getProductRarityColor(product.rarity);

          return (
            <motion.div
              key={product.id}
              layout
              className={`bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden hover:border-green-500 transition-all cursor-pointer ${
                viewMode === 'list' ? 'flex gap-4 p-4' : ''
              }`}
              whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1 }}
              onClick={() => setSelectedProduct(product)}
            >
              {/* Product Image */}
              <div className={`${viewMode === 'list' ? 'w-32 h-32' : 'aspect-square'} bg-gradient-to-br ${rarityColor}/20 flex items-center justify-center relative`}>
                <div className="text-6xl opacity-50">
                  {product.category === 'cosmetics' && '✨'}
                  {product.category === 'apparel' && '👕'}
                  {product.category === 'collectibles' && '🏆'}
                  {product.category === 'boosts' && '⚡'}
                  {product.category === 'characters' && '👑'}
                  {product.category === 'bundles' && '📦'}
                  {product.category === 'premium' && '💎'}
                </div>

                {/* Product Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isNew && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                  {product.isOnSale && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      SALE
                    </span>
                  )}
                  {product.isLimited && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      LIMITED
                    </span>
                  )}
                </div>

                {/* Owned Badge */}
                {owned && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-6 h-6 text-green-400 bg-gray-900 rounded-full p-1" />
                  </div>
                )}

                {/* Rarity Badge */}
                <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${rarityColor} text-white`}>
                  {product.rarity.toUpperCase()}
                </div>
              </div>

              {/* Product Info */}
              <div className={`${viewMode === 'grid' ? 'p-4' : 'flex-1'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg leading-tight">{product.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">{product.category} • {product.type}</p>
                  </div>
                  
                  {product.isLimited && product.remaining !== undefined && (
                    <div className="text-right ml-2">
                      <div className="text-xs text-orange-400 font-semibold">
                        {product.remaining} left
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>

                {/* Effects */}
                {product.effects && product.effects.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">Effects:</div>
                    <div className="space-y-1">
                      {product.effects.slice(0, 2).map((effect, index) => (
                        <div key={index} className="text-xs text-blue-400">
                          • {effect.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    {price ? (
                      <div className="flex items-center gap-2">
                        {getCurrencyIcon(selectedCurrency)}
                        <span className="text-lg font-bold text-white">
                          {formatPrice(price)}
                        </span>
                        {price.originalPrice && price.discount && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice({...price, amount: price.originalPrice})}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not available in {selectedCurrency}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!owned && price && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Products Found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'No products available in this category'
            }
          </p>
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">{selectedProduct.name}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Image */}
                <div className={`aspect-square bg-gradient-to-br ${getProductRarityColor(selectedProduct.rarity)}/20 rounded-lg flex items-center justify-center relative`}>
                  <div className="text-8xl opacity-50">
                    {selectedProduct.category === 'cosmetics' && '✨'}
                    {selectedProduct.category === 'apparel' && '👕'}
                    {selectedProduct.category === 'collectibles' && '🏆'}
                    {selectedProduct.category === 'boosts' && '⚡'}
                    {selectedProduct.category === 'characters' && '👑'}
                    {selectedProduct.category === 'bundles' && '📦'}
                    {selectedProduct.category === 'premium' && '💎'}
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                    <p className="text-gray-300">{selectedProduct.description}</p>
                  </div>

                  {selectedProduct.effects && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Effects</h4>
                      <div className="space-y-2">
                        {selectedProduct.effects.map((effect, index) => (
                          <div key={index} className="text-blue-400">
                            • {effect.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.variants && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Variants</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant.id)}
                            className={`p-2 text-sm rounded border transition-colors ${
                              selectedVariant === variant.id
                                ? 'border-green-500 bg-green-500/20 text-white'
                                : 'border-gray-600 text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            {variant.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      {calculateProductPrice(selectedProduct, selectedCurrency) ? (
                        <div className="flex items-center gap-2">
                          {getCurrencyIcon(selectedCurrency)}
                          <span className="text-2xl font-bold text-white">
                            {formatPrice(calculateProductPrice(selectedProduct, selectedCurrency)!)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not available in {selectedCurrency}</span>
                      )}
                    </div>

                    {!isOwned(selectedProduct.id) && calculateProductPrice(selectedProduct, selectedCurrency) && (
                      <button
                        onClick={() => {
                          addToCart(selectedProduct, selectedVariant || undefined);
                          setSelectedProduct(null);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Shopping Cart ({getCartItemCount()})
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = getProductById(item.productId);
                    if (!product) return null;

                    const price = calculateProductPrice(product, selectedCurrency);
                    if (!price) return null;

                    return (
                      <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">
                            {product.category === 'cosmetics' && '✨'}
                            {product.category === 'apparel' && '👕'}
                            {product.category === 'collectibles' && '🏆'}
                            {product.category === 'boosts' && '⚡'}
                            {product.category === 'characters' && '👑'}
                            {product.category === 'bundles' && '📦'}
                            {product.category === 'premium' && '💎'}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{product.name}</h4>
                          <p className="text-sm text-gray-400">{product.category}</p>
                          {item.variantId && (
                            <p className="text-xs text-blue-400">
                              {product.variants?.find(v => v.id === item.variantId)?.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="w-8 text-center text-white font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              {getCurrencyIcon(selectedCurrency)}
                              <span className="font-bold text-white">
                                {formatPrice({ currency: selectedCurrency, amount: price.amount * item.quantity })}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.productId, item.variantId)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-white">Total:</span>
                      <div className="flex items-center gap-2">
                        {getCurrencyIcon(selectedCurrency)}
                        <span className="text-2xl font-bold text-white">
                          {formatPrice({ currency: selectedCurrency, amount: getCartTotal() })}
                        </span>
                      </div>
                    </div>

                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Checkout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-400 mb-2">Your cart is empty</h4>
                  <p className="text-gray-500 mb-4">Add some amazing items to get started!</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  ChevronRight, 
  Trophy, 
  ShieldCheck, 
  Truck, 
  Instagram, 
  Facebook, 
  ArrowRight,
  Star,
  MessageCircle,
  X,
  CreditCard,
  Zap,
  Check,
  ChevronLeft,
  ChevronDown,
  User as UserIcon,
  LayoutDashboard,
  Heart
} from 'lucide-react';
import { db } from './lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useAuth } from './components/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { CartOverlay } from './components/CartOverlay';
import { trackViewItem, trackAddToCart } from './lib/analytics';

// --- Types ---
interface Product {
  id: number;
  title: string;
  category: 'National' | 'Club' | 'Player Edition' | 'Fan Edition' | 'Collector';
  player: string;
  team: string;
  price: number;
  image: string;
  description: string;
  sizes: string[];
}

const PRODUCTS: Product[] = [
  { 
    id: 1,
    title: "Arsenal Home 24/25", 
    category: "Player Edition", 
    player: "Bukayo Saka",
    team: "Arsenal",
    price: 3800, 
    image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2574&auto=format&fit=crop",
    description: "Authentic player edition jersey featuring moisture-wicking technology and athletic fit as worn by Bukayo Saka.",
    sizes: ['S', 'M', 'L', 'XL']
  },
  { 
    id: 2,
    title: "Brazil National 24/25", 
    category: "Fan Edition", 
    player: "Vinicius Jr",
    team: "Brazil",
    price: 1800, 
    image: "https://images.unsplash.com/photo-1614632537190-23e414d4494e?q=80&w=2670&auto=format&fit=crop",
    description: "Classic Seleção yellow with sustainable materials and casual fit for high comfort during matchdays.",
    sizes: ['M', 'L', 'XL']
  },
  { 
    id: 3,
    title: "Argentina Heritage", 
    category: "National", 
    player: "Lionel Messi",
    team: "Argentina",
    price: 4500, 
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2693&auto=format&fit=crop",
    description: "Commemorative three-star edition celebrating the world champions. Gold detailing throughout.",
    sizes: ['S', 'M', 'L']
  },
  { 
    id: 4,
    title: "Man City Away", 
    category: "Player Edition", 
    player: "Phil Foden",
    team: "Manchester City",
    price: 3600, 
    image: "https://images.unsplash.com/photo-1621274403997-37aae1830810?q=80&w=2670&auto=format&fit=crop",
    description: "Striking away kit with premium heat-applied crests and advanced ventilation panels.",
    sizes: ['M', 'L', 'XL', 'XXL']
  },
  { 
    id: 5,
    title: "Real Madrid Home", 
    category: "Collector", 
    player: "Jude Bellingham",
    team: "Real Madrid",
    price: 5200, 
    image: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=2670&auto=format&fit=crop",
    description: "Special limited edition with gold embroidery and premium presentation box.",
    sizes: ['L', 'XL']
  },
  { 
    id: 6,
    title: "Inter Milan Special", 
    category: "Collector", 
    player: "Lautaro Martinez",
    team: "Inter Milan",
    price: 4800, 
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2572&auto=format&fit=crop",
    description: "Collaboration kit with local designers. Exclusive pattern and high-density textures.",
    sizes: ['S', 'M', 'L']
  }
];

const REVIEWS = [
  { id: 1, user: "Asif R.", rating: 5, comment: "The Player Edition quality is insane. Feels exactly like what Messi wears!" },
  { id: 2, user: "Tahsin A.", rating: 5, comment: "Fast delivery to Dhaka. The packaging was very premium." },
  { id: 3, user: "Sakib H.", rating: 4, comment: "Great fit for the Argentina jersey. Will order the Brazil one next." }
];

// --- Components ---

const FlashSaleDivider = () => (
  <div className="bg-gold py-2 overflow-hidden border-y border-gold-dark/20">
    <div className="ticker-wrap">
      <div className="ticker-content flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-rich-black">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-12">
            <span>Flash Sale: Up to 20% Off Player Editions</span>
            <Zap size={14} fill="currentColor" />
            <span>New Season Kits Arriving Next Week</span>
            <Zap size={14} fill="currentColor" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Navbar = ({ 
  onSearchClick, 
  onAuthClick, 
  onDashboardClick, 
  onAdminClick, 
  onCartClick,
  cartCount, 
  isScrolled, 
  user, 
  isAdmin 
}: { 
  onSearchClick: () => void, 
  onAuthClick: () => void, 
  onDashboardClick: () => void, 
  onAdminClick: () => void, 
  onCartClick: () => void,
  cartCount: number, 
  isScrolled: boolean, 
  user: any, 
  isAdmin: boolean 
}) => (
  <motion.nav 
    animate={{ 
      backgroundColor: isScrolled ? 'rgba(5, 5, 5, 0.9)' : 'rgba(5, 5, 5, 0)',
      paddingTop: isScrolled ? '1rem' : '1.5rem',
      paddingBottom: isScrolled ? '1rem' : '1.5rem',
      backdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)'
    }}
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 transition-all duration-500 border-b border-white/5"
  >
    <div className="flex items-center gap-12">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-dark to-gold flex items-center justify-center glow-gold">
          <span className="font-display font-bold text-rich-black text-sm">L</span>
        </div>
        <span className="font-display font-bold text-xl tracking-tighter uppercase">Lunivo</span>
      </motion.div>
      
      <div className="hidden md:flex items-center gap-8">
        {['Collections', 'Player', 'Fan', 'National'].map((item) => (
          <a key={item} href="#" className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-gold transition-colors">
            {item}
          </a>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-6">
      <button 
        onClick={onSearchClick}
        className="text-white/60 hover:text-white transition-colors"
      >
        <Search size={18} strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
             {isAdmin && (
              <button 
                onClick={onAdminClick}
                className="text-[9px] font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors flex items-center gap-2 border border-gold/20 px-3 py-1"
              >
                <LayoutDashboard size={12} /> Admin
              </button>
            )}
            <button 
              onClick={onDashboardClick}
              className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
            >
              <UserIcon size={18} strokeWidth={1.5} />
              <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">{user.displayName || 'Profile'}</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={onAuthClick}
            className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors border border-white/10 px-4 py-2 hover:border-gold transition-all"
          >
            Sign In
          </button>
        )}
      </div>

      <button 
        onClick={onCartClick}
        className="relative text-white/60 hover:text-white transition-colors group"
      >
        <ShoppingBag size={18} strokeWidth={1.5} />
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-rich-black text-[9px] font-black flex items-center justify-center glow-gold"
            >
              {cartCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <button className="md:hidden text-white/60">
        <Menu size={20} />
      </button>
    </div>
  </motion.nav>
);

const Toast = ({ message, isVisible }: { message: string, isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 50, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
        className="fixed bottom-12 left-1/2 z-[200] flex items-center gap-4 glass-morph px-8 py-5 shadow-2xl border border-gold/20"
      >
        <div className="p-2 bg-gold/10 rounded-full">
          <Check size={16} className="text-gold" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Added to Bag</span>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white">{message}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const QuickViewModal = ({ product, onClose, onAddToCart }: { product: Product | null, onClose: () => void, onAddToCart: (product: Product) => void }) => {
  const [productReviews, setProductReviews] = useState<any[]>([]);

  useEffect(() => {
    if (product) {
      trackViewItem(product);
      const fetchReviews = async () => {
        try {
          const q = query(collection(db, 'reviews'), where('productId', '==', product.id), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setProductReviews(snap.docs.map(d => d.data()));
        } catch (error) {
          console.error("Error fetching reviews:", error);
        }
      };
      fetchReviews();
    }
  }, [product]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-rich-black/90 backdrop-blur-md" onClick={onClose} />
          
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative z-10 w-full max-w-6xl bg-rich-black border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-2xl h-[90vh] md:h-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 text-white/40 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="w-full md:w-1/2 h-80 md:h-[700px] overflow-hidden bg-white/5 relative">
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                src={product.image} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6">
                <span className="px-4 py-2 bg-white text-rich-black text-[10px] font-black uppercase tracking-widest leading-none">
                  {product.category}
                </span>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar bg-rich-black/50">
              <div className="mb-8">
                <span className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">{product.team}</span>
                <h2 className="font-display font-bold text-4xl md:text-5xl uppercase tracking-tighter mb-4 leading-none">{product.title}</h2>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-gold">৳{product.price.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < 4 ? "#D4AF37" : "none"} className="text-gold" />)}
                    <span className="text-[9px] text-white/30 font-black ml-2 uppercase tracking-widest">(24 REVIEWS)</span>
                  </div>
                </div>
              </div>
              
              <p className="text-white/50 text-sm leading-relaxed mb-8 border-l-2 border-gold/20 pl-6">
                {product.description}
              </p>
              
              <div className="mb-8">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-4">Select Size</span>
                <div className="grid grid-cols-4 gap-3">
                  {product.sizes.map(size => (
                    <button key={size} className="border border-white/10 hover:border-gold py-3 text-xs font-bold transition-colors uppercase">
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-4 mb-12">
                <button 
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  className="w-full bg-gold text-rich-black py-5 font-black uppercase tracking-widest text-xs hover:bg-gold-light transition-colors duration-500 glow-gold"
                >
                  Add to Cart
                </button>
                <div className="flex items-center justify-between text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-2"><CreditCard size={12} /> Secure Billing</span>
                  <span className="flex items-center gap-2"><Truck size={12} /> Worldwide Delivery</span>
                </div>
              </div>

              {/* Dynamic Reviews Snippet */}
              <div className="border-t border-white/5 pt-12">
                <h4 className="font-display font-bold text-xl uppercase tracking-tighter mb-8 italic">Elite <span className="text-white/30">Feedback</span></h4>
                <div className="space-y-8">
                  {productReviews.length > 0 ? productReviews.map((rev, i) => (
                    <div key={i} className="border-b border-white/5 pb-8">
                       <div className="flex gap-1 mb-3">
                        {[...Array(rev.rating)].map((_, j) => <Star key={j} size={8} fill="#D4AF37" className="text-gold" />)}
                       </div>
                       <p className="text-[11px] text-white/60 mb-3 italic">"{rev.comment}"</p>
                       <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">— {rev.userName}</span>
                    </div>
                  )) : (
                    <div className="py-12 border border-dashed border-white/10 text-center">
                       <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] italic">Be the first to leave a legacy review</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SearchOverlay = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const filteredProducts = query === "" ? [] : PRODUCTS.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.player.toLowerCase().includes(query.toLowerCase()) ||
    p.team.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-rich-black/98 backdrop-blur-2xl px-8 pt-32 overflow-y-auto"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Close [Esc]</span>
            <X size={18} />
          </button>

          <div className="max-w-4xl mx-auto">
            <div className="relative mb-16 group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gold opacity-50 group-focus-within:opacity-100 transition-opacity" size={32} strokeWidth={1.5} />
              <input 
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find Your Kit..."
                className="w-full bg-transparent border-b border-white/10 pb-6 pl-16 text-3xl md:text-6xl font-display font-medium uppercase tracking-tighter outline-none focus:border-gold transition-all placeholder:text-white/5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-32">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-6 items-center group cursor-pointer border-b border-white/5 pb-6 hover:border-gold/30 transition-colors"
                  >
                    <div className="w-20 h-28 overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-[9px] text-gold font-black uppercase tracking-widest mb-1 block">{p.category}</span>
                      <h4 className="font-display font-bold text-xl uppercase tracking-tight group-hover:text-gold transition-colors">{p.title}</h4>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-bold">{p.player} • ৳{p.price}</p>
                    </div>
                  </motion.div>
                ))
              ) : query !== "" ? (
                <div className="col-span-2 text-center py-24 opacity-20">
                  <p className="text-white uppercase tracking-widest text-sm italic">No elite matches discovered for "{query}"</p>
                </div>
              ) : (
                <div className="col-span-2">
                  <span className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-8 block">Curated Suggestions</span>
                  <div className="flex flex-wrap gap-4">
                    {['24/25 Season', 'Messi', 'Real Madrid', 'Player Edition'].map(trend => (
                      <button 
                        key={trend}
                        onClick={() => setQuery(trend)}
                        className="px-8 py-3 border border-white/10 hover:border-gold transition-colors text-[10px] uppercase tracking-[0.2em] font-black"
                      >
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SectionHeading = ({ children, eyebrow }: { children: React.ReactNode, eyebrow: string }) => (
  <div className="mb-20 overflow-hidden">
    <motion.span 
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="text-gold text-[10px] font-black tracking-[0.4em] uppercase mb-4 block"
    >
      {eyebrow}
    </motion.span>
    <motion.h2 
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
      className="font-display font-bold text-5xl md:text-7xl uppercase tracking-tighter leading-none"
    >
      {children}
    </motion.h2>
  </div>
);

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onQuickView: (product: Product) => void;
  onWishlistToggle: (id: number) => any;
  isWishlisted: boolean;
  [key: string]: any;
}

const ProductCard = ({ product, onAddToCart, onQuickView, onWishlistToggle, isWishlisted }: ProductCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -10 }}
    className="group"
  >
    <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-white/5 border border-white/5 transition-colors duration-500 group-hover:border-gold/20">
      <img 
        src={product.image} 
        alt={product.title} 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-rich-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <span className="px-3 py-1 bg-white text-rich-black text-[9px] font-black uppercase tracking-widest leading-none">
          {product.category}
        </span>
        {product.id % 2 === 0 && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-3 py-1 bg-gold text-rich-black text-[9px] font-black uppercase tracking-widest leading-none flex items-center gap-1 shadow-xl"
          >
            <Zap size={8} fill="currentColor" /> Trending
          </motion.span>
        )}
      </div>

      <AnimatePresence>
        {product.id % 4 === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 left-4 right-4 z-10 bg-red-500/90 backdrop-blur-sm p-2 text-center"
          >
            <p className="text-white text-[8px] font-black uppercase tracking-widest">Rare Stock: Only {Math.floor(Math.random() * 3) + 1} Remaining</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onWishlistToggle(product.id); }}
          className={`p-2 rounded-full backdrop-blur-md transition-colors ${isWishlisted ? 'bg-gold text-rich-black' : 'bg-rich-black/40 text-white/50 hover:text-white'}`}
        >
          <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center gap-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-500 transition-all">
        <button 
          onClick={() => onQuickView(product)}
          className="bg-white text-rich-black p-4 rounded-full hover:bg-gold transition-colors duration-300 shadow-2xl"
        >
          <Search size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={() => onAddToCart()}
          className="bg-gold text-rich-black p-4 rounded-full hover:bg-gold-light transition-colors duration-300 shadow-2xl glow-gold"
        >
          <ShoppingBag size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>

    <div className="flex justify-between items-start cursor-pointer" onClick={() => onQuickView(product)}>
      <div>
        <h4 className="font-display font-medium text-sm tracking-widest uppercase mb-1 group-hover:text-gold transition-colors">{product.title}</h4>
        <div className="flex items-center gap-2 text-[9px] text-white/30 uppercase tracking-widest font-black">
          <Trophy size={10} className="text-gold" />
          {product.player}
        </div>
      </div>
      <p className="font-display font-bold text-gold text-sm">৳{product.price.toLocaleString()}</p>
    </div>
  </motion.div>
);

const FloatingSupport = () => {
  const [showWATip, setShowWATip] = useState(false);
  const [showFBTip, setShowFBTip] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
      <div className="relative group">
        <AnimatePresence>
          {showWATip && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-rich-black px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap pointer-events-none shadow-2xl"
            >
              Chat on WhatsApp
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.a 
          href="https://wa.me/8801590070358"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowWATip(true)}
          onMouseLeave={() => setShowWATip(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.4)] text-white glow-gold transition-all"
        >
          <MessageCircle size={28} fill="currentColor" className="text-white" />
        </motion.a>
      </div>

      <div className="relative group">
        <AnimatePresence>
          {showFBTip && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-rich-black px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap pointer-events-none shadow-2xl"
            >
              Visit our Facebook Page
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.a 
          href="https://www.facebook.com/profile.php?id=61569082710863"
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowFBTip(true)}
          onMouseLeave={() => setShowFBTip(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-gradient-to-tr from-[#1877F2] to-[#00A3FF] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(24,119,242,0.4)] text-white"
        >
          <Facebook size={24} fill="currentColor" />
        </motion.a>
      </div>
    </div>
  );
};

// --- Main App ---

interface CartItem {
  id: number;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export default function App() {
  const { user, profile, isAdmin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const toggleWishlist = async (productId: number) => {
    if (!user || !profile) {
      setIsAuthOpen(true);
      return;
    }
    
    const newWishlist = profile.wishlist.includes(productId)
      ? profile.wishlist.filter(id => id !== productId)
      : [...profile.wishlist, productId];
      
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        wishlist: newWishlist,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Wishlist sync error:", error);
    }
  };

  const handleAddToCart = (product: Product | any) => {
    trackAddToCart(product);
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 }];
    });
    setLastAddedItem(product.title);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen selection:bg-gold selection:text-rich-black">
      <Navbar 
        onSearchClick={() => setIsSearchOpen(true)} 
        onAuthClick={() => setIsAuthOpen(true)}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onAdminClick={() => setIsAdminOpen(true)}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cartCount} 
        isScrolled={isScrolled}
        user={user}
        isAdmin={isAdmin}
      />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <Dashboard isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <CartOverlay 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
      />
      
      <QuickViewModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={() => selectedProduct && handleAddToCart(selectedProduct)}
      />
      <Toast isVisible={showToast} message={lastAddedItem || ''} />
      <FloatingSupport />

      <main>
        {/* Animated Hero */}
        <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-8">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-rich-black/60 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1639016507742-df21f2deea9b?q=80&w=2670&auto=format&fit=crop" 
              className="w-full h-full object-cover grayscale scale-110" 
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="relative z-20 text-center max-w-5xl">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-gold/30 mb-10 bg-gold/5 backdrop-blur-md"
            >
              <Zap size={14} className="text-gold animate-pulse" fill="currentColor" />
              <span className="text-gold text-[10px] font-black tracking-[0.4em] uppercase">The Elite Standard</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-display font-medium text-7xl md:text-[140px] tracking-tighter leading-[0.85] mb-12 uppercase italic"
            >
              Lunivo <br />
              <span className="text-luxury-gradient drop-shadow-2xl">Elite</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <button 
                onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-rich-black px-12 py-5 font-black uppercase tracking-widest text-[10px] hover:bg-gold transition-all duration-500 group flex items-center gap-3 overflow-hidden"
              >
                Discover Collection
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500" />
              </button>
              <span className="text-white/20 font-black text-[10px] uppercase tracking-widest hidden sm:block">Explore The Heritage</span>
            </motion.div>
          </div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-12 flex flex-col items-center gap-4 opacity-30"
          >
            <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-gold to-transparent" />
          </motion.div>
        </section>

        <FlashSaleDivider />

        {/* Features Reveal */}
        <section className="py-32 px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: "Authenticity", desc: "Every kit is sourced from elite-grade manufacturers with lifetime authenticity guarantee." },
              { icon: Zap, title: "Express Logistics", desc: "Priority delivery to your doorstep in premium protective packaging." },
              { icon: Trophy, title: "Limited Release", desc: "Direct access to rare match-worn player versions and centenary heritage editions." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-10 bg-white/2 border border-white/5 hover:border-gold/30 transition-all group"
              >
                <div className="w-14 h-14 bg-gold/5 flex items-center justify-center mb-10 group-hover:bg-gold/20 transition-colors">
                  <f.icon className="text-gold" size={24} />
                </div>
                <h3 className="font-display font-bold text-xl mb-4 uppercase tracking-tighter">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed uppercase tracking-widest text-[11px] font-bold">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Dynamic Collections Section */}
        <section id="collection" className="py-32 px-8 max-w-7xl mx-auto overflow-hidden">
          <SectionHeading eyebrow="Curated Collections">Signature <span className="text-white/40 italic">Series</span></SectionHeading>
          
          <div className="flex flex-wrap gap-8 mb-20">
            {['All', 'Player Edition', 'National', 'Collector'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-black uppercase tracking-[0.3em] pb-3 border-b-2 transition-all ${activeCategory === cat ? 'border-gold text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onAddToCart={() => handleAddToCart(p)} 
                  onQuickView={setSelectedProduct} 
                  onWishlistToggle={toggleWishlist}
                  isWishlisted={profile?.wishlist.includes(p.id) || false}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Cinematic Showcase Section */}
        <section className="py-40 relative overflow-hidden bg-rich-black">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 blur-[120px] rounded-full translate-x-1/2 opacity-20" />
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="relative aspect-[3/4] bg-white/5 overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=2574&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale opacity-60 hover:scale-110 transition-transform duration-[2s]" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rich-black via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12 right-12">
                 <span className="text-gold text-[10px] font-black tracking-[0.3em] uppercase mb-4 block">Seasonal Edit</span>
                 <h3 className="font-display font-bold text-5xl uppercase tracking-tighter italic">Player <span className="text-luxury-gradient">Exclusives</span></h3>
              </div>
            </motion.div>

            <div className="space-y-12">
              <SectionHeading eyebrow="Expertise">The Art of <br /> <span className="text-white/40">Performance</span></SectionHeading>
              <p className="text-white/50 text-xl leading-relaxed tracking-wide italic">
                "Our kits are more than just fabric; they are a legacy stitched together with passion and precision for the ultimate athlete."
              </p>
              <div className="flex gap-12 pt-8">
                <div>
                  <h4 className="font-display font-bold text-3xl text-gold mb-1 uppercase tracking-tighter">150+</h4>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">Elite Designs</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-3xl text-gold mb-1 uppercase tracking-tighter">4.9/5</h4>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">Satisfaction</span>
                </div>
              </div>
              <button className="flex items-center gap-4 text-xs font-black uppercase tracking-widest group">
                Read Our Story <ArrowRight size={20} className="group-hover:translate-x-3 transition-transform text-gold" />
              </button>
            </div>
          </div>
        </section>

        {/* Animated Reviews */}
        <section className="py-32 px-8 max-w-7xl mx-auto bg-white/2 rounded-[4rem] my-20">
          <div className="text-center mb-24">
            <h2 className="font-display font-bold text-6xl uppercase tracking-tighter drop-shadow-lg mb-4">Elite Circle <span className="text-white/30">Feedback</span></h2>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] font-black">Trusted by Athletes Worldwide</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {REVIEWS.map((r, i) => (
              <motion.div 
                key={r.id}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass-morph p-10 border border-white/5 relative"
              >
                <div className="flex gap-1 mb-8">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} size={10} fill="#D4AF37" className="text-gold" />
                  ))}
                </div>
                <p className="text-white/60 mb-8 italic text-lg leading-relaxed">"{r.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-gold" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">{r.user}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Subscription */}
        <section className="py-40 bg-rich-black relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
            <h2 className="font-display font-bold text-6xl md:text-8xl uppercase tracking-tighter mb-10 italic">Join The <span className="text-luxury-gradient">Elite List</span></h2>
            <p className="text-white/40 mb-16 text-xl font-light tracking-wide italic">Be the first to secure limited centenary editions and season drops.</p>
            <div className="flex flex-col md:flex-row max-w-xl mx-auto gap-4 p-2 glass-morph">
              <input 
                type="email" 
                placeholder="YOUR PLAYER EMAIL" 
                className="flex-1 bg-transparent px-8 py-5 text-sm tracking-[0.1em] focus:outline-none placeholder:text-white/10 uppercase font-bold"
              />
              <button className="bg-gold text-rich-black px-12 py-5 font-black uppercase tracking-widest text-[10px] hover:bg-gold-light transition-all grow md:grow-0 glow-gold">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-rich-black py-32 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-32 pb-32 border-b border-white/5">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-12">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-dark to-gold flex items-center justify-center glow-gold">
                  <span className="font-display font-bold text-rich-black text-lg">L</span>
                </div>
                <span className="font-display font-bold text-3xl tracking-tighter uppercase">Lunivo</span>
              </div>
              <p className="text-white/40 text-lg italic max-w-md mb-12">
                "Crafting legends through fabric. The ultimate destination for the elite football enthusiast."
              </p>
              <div className="flex flex-col gap-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Connect with Elite Support</span>
                <div className="flex gap-4">
                  <a 
                    href="https://wa.me/8801590070358" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative w-14 h-14 border border-white/10 rounded-full flex items-center justify-center hover:border-gold transition-colors"
                  >
                    <MessageCircle size={20} className="group-hover:text-gold transition-colors" />
                  </a>
                  <a 
                    href="https://www.facebook.com/profile.php?id=61569082710863" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative w-14 h-14 border border-white/10 rounded-full flex items-center justify-center hover:border-gold transition-colors"
                  >
                    <Facebook size={20} className="group-hover:text-gold transition-colors" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 col-span-1 md:col-span-2 gap-16">
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Collections</h5>
                <ul className="space-y-6 text-[11px] font-bold uppercase tracking-widest text-white/50">
                  <li><a href="#" className="hover:text-gold transition-colors">Season 24/25</a></li>
                  <li><a href="#" className="hover:text-gold transition-colors">Player Kits</a></li>
                  <li><a href="#" className="hover:text-gold transition-colors">National Pride</a></li>
                  <li><a href="#" className="hover:text-gold transition-colors">Limited Drop</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Concierge</h5>
                <ul className="space-y-6 text-[11px] font-bold uppercase tracking-widest text-white/50">
                  <li><a href="#" className="hover:text-gold transition-colors">VIP Shipping</a></li>
                  <li><a href="#" className="hover:text-gold transition-colors">Size Guide</a></li>
                  <li><a href="#" className="hover:text-gold transition-colors">Returns</a></li>
                  <li><a href="#" className="hover:text-gold transition-colors">Authenticity</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-16 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">© 2024 LUNIVO ELITE STITCHING. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-12 text-[10px] text-white/20 uppercase tracking-[0.3em] font-black uppercase underline-offset-8">
              <a href="#" className="hover:text-gold transition-colors">Privacy</a>
              <a href="#" className="hover:text-gold transition-colors">Terms</a>
              <a href="#" className="hover:text-gold transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

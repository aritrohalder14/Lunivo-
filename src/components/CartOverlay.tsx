import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Zap,
  Tag
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { trackPurchase } from '../lib/analytics';

interface CartItem {
  id: number;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export const CartOverlay = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[], 
  onUpdateQuantity: (id: number, delta: number) => void,
  onRemove: (id: number) => void
}) => {
  const { user, profile } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const handleCheckout = async () => {
    if (!user) {
      alert("Please sign in to complete your purchase");
      return;
    }
    
    setIsCheckingOut(true);
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        email: user.email,
        items: items.map(i => ({ productId: i.id, title: i.title, quantity: i.quantity, price: i.price, image: i.image })),
        totalAmount: total,
        status: 'pending',
        shippingAddress: profile?.address || 'Standard Delivery',
        phone: profile?.phoneNumber || 'Not provided',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      trackPurchase(items, total, orderRef.id);
      alert("Order placed successfully! Check your dashboard for updates.");
      onClose();
      // In a real app, clear cart here
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] bg-rich-black/90 backdrop-blur-md"
        >
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-rich-black border-l border-white/10 flex flex-col pt-32 p-8"
          >
            <button onClick={onClose} className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <div className="mb-12">
              <h2 className="font-display font-bold text-4xl uppercase tracking-tighter mb-2">Your <span className="text-luxury-gradient">Bag</span></h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{items.length} ELITE SELECTIONS</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
              {items.length > 0 ? items.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-24 h-32 bg-white/5 overflow-hidden shrink-0">
                    <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-display font-bold text-lg uppercase tracking-tight">{item.title}</h4>
                        <button onClick={() => onRemove(item.id)} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <p className="text-gold font-bold text-xs uppercase tracking-widest">৳{item.price.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-white/10">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-2 hover:text-gold disabled:opacity-20"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-2 hover:text-gold"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 opacity-20 italic">
                   <ShoppingBag size={48} className="mx-auto mb-6" />
                   <p className="uppercase tracking-widest text-[10px]">Your collection is currently empty</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text" 
                  placeholder="PROMO CODE" 
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-12 py-4 text-[10px] tracking-widest outline-none focus:border-gold transition-colors font-bold uppercase"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30">
                  <span>Subtotal</span>
                  <span className="text-white">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/30">
                  <span>Shipping</span>
                  <span className="text-white uppercase">Complimentary</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-white/5">
                   <span className="text-xs font-black uppercase tracking-[0.2em]">Total Amount</span>
                   <span className="text-2xl font-display font-bold text-gold">৳{total.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={items.length === 0 || isCheckingOut}
                className="w-full bg-gold text-rich-black py-5 font-black uppercase tracking-widest text-xs hover:bg-gold-light transition-all glow-gold flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {isCheckingOut ? <Zap size={18} className="animate-pulse" /> : (
                  <>Checkout <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 opacity-20 py-4">
                 <ShieldCheck size={18} />
                 <CreditCard size={18} />
                 <Zap size={18} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

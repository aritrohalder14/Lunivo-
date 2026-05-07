import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Tag, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  X,
  TrendingUp,
  Package,
  Check,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

export const AdminPanel = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeView, setActiveView] = useState<'overview' | 'products' | 'orders' | 'coupons'>('overview');
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    team: '',
    price: 0,
    category: 'Club Jersey',
    player: 'CUSTOM',
    description: '',
    image: '',
    sizes: ['S', 'M', 'L', 'XL']
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find max id to increment (in a real app, use Firestore auto-ids or a counter)
      const maxId = products.length > 0 ? Math.max(...products.map(p => p.id || 0)) : 100;
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        id: maxId + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAddingProduct(false);
      // Refresh list
      const productsSnap = await getDocs(collection(db, 'products'));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Add product error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const productsSnap = await getDocs(collection(db, 'products'));
          const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
          const usersSnap = await getDocs(collection(db, 'users'));
          
          setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setOrders(ordersData);
          
          const totalRevenue = ordersData.reduce((acc, curr: any) => acc + (curr.totalAmount || 0), 0);
          setStats({
            revenue: totalRevenue,
            orders: ordersData.length,
            customers: usersSnap.size
          });
        } catch (error) {
          console.error("Admin fetch error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[300] bg-rich-black overflow-hidden flex flex-col"
    >
      {/* Header */}
      <header className="border-b border-white/5 p-8 flex items-center justify-between bg-rich-black/50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
              <span className="font-bold text-rich-black text-xs">A</span>
            </div>
            <span className="font-display font-bold text-xl uppercase tracking-tighter">Command <span className="text-white/30">Center</span></span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'Inventory', icon: ShoppingBag },
              { id: 'orders', label: 'Shipments', icon: Package },
              { id: 'coupons', label: 'Offers', icon: Tag }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${activeView === item.id ? 'bg-gold text-rich-black' : 'text-white/30 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-white/20 hover:text-white transition-colors"><Search size={20} /></button>
          <button onClick={onClose} className="bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        {activeView === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'Total Revenue', value: `৳${stats.revenue.toLocaleString()}`, trend: '+12.5%', icon: TrendingUp },
                { label: 'Active Orders', value: stats.orders, trend: '4 Pending', icon: Package },
                { label: 'Elite Members', value: stats.customers, trend: '+3 New', icon: Users },
                { label: 'Average Value', value: stats.orders > 0 ? `৳${Math.round(stats.revenue/stats.orders).toLocaleString()}` : '৳0', trend: 'STABLE', icon: BarChart3 }
              ].map((stat, i) => (
                <div key={i} className="p-8 bg-white/2 border border-white/5 hover:border-gold/20 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-gold/5 rounded-lg text-gold"><stat.icon size={20} /></div>
                    <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-md">{stat.trend}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">{stat.label}</span>
                  <p className="text-4xl font-display font-medium uppercase tracking-tighter italic">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white/2 border border-white/5 p-8">
                <div className="flex justify-between items-center mb-10">
                  <h4 className="font-display font-bold text-xl uppercase tracking-tighter">Recent <span className="text-white/30">Acquisitions</span></h4>
                  <button className="text-[9px] font-black uppercase tracking-widest text-gold">View Ledger</button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-rich-black/30 border border-white/5 hover:border-gold/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gold"><Package size={16} /></div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</p>
                          <span className="text-[9px] text-white/30 uppercase font-black">{order.status}</span>
                        </div>
                      </div>
                      <p className="text-xs font-black tracking-widest text-gold font-mono">৳{order.totalAmount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/2 border border-white/5 p-8">
                <div className="flex justify-between items-center mb-10">
                  <h4 className="font-display font-bold text-xl uppercase tracking-tighter">Inventory <span className="text-white/30">Alerts</span></h4>
                  <button className="text-[9px] font-black uppercase tracking-widest text-gold font-mono">Manage Stock</button>
                </div>
                <div className="flex items-center justify-center py-20 text-white/20 italic uppercase tracking-widest text-[10px]">
                  <AlertCircle size={32} className="mr-4 opacity-50" /> All channels operating within thresholds
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'products' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-display font-bold text-3xl uppercase tracking-tighter">Elite <span className="text-white/30">Inventory</span></h3>
               <button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-gold text-rich-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gold-light transition-all glow-gold flex items-center gap-3"
               >
                 <Plus size={16} /> Incorporate Asset
               </button>
            </div>

            <div className="bg-white/2 border border-white/5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                    <th className="p-8">Visual</th>
                    <th className="p-8">Asset Identifier</th>
                    <th className="p-8">Collective</th>
                    <th className="p-8">Valuation</th>
                    <th className="p-8 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-8">
                        <div className="w-12 h-16 bg-white/5 overflow-hidden">
                          <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </td>
                      <td className="p-8">
                         <p className="text-xs font-bold uppercase tracking-widest mb-1">{p.title}</p>
                         <span className="text-[9px] text-white/20 uppercase font-black">{p.category}</span>
                      </td>
                      <td className="p-8 text-[10px] font-bold uppercase tracking-widest text-white/40">{p.team}</td>
                      <td className="p-8 text-gold font-bold text-xs tracking-widest">৳{p.price.toLocaleString()}</td>
                      <td className="p-8 text-right">
                         <button className="text-white/20 hover:text-white"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isAddingProduct && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-rich-black/95 backdrop-blur-xl" onClick={() => setIsAddingProduct(false)} />
              <motion.form 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onSubmit={handleAddProduct}
                className="relative z-10 w-full max-w-2xl bg-rich-black border border-white/10 p-12 space-y-8"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold text-3xl uppercase tracking-tighter">New <span className="text-luxury-gradient">Asset</span></h3>
                  <button type="button" onClick={() => setIsAddingProduct(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Asset Name</label>
                     <input required className="w-full bg-white/5 border border-white/10 p-4 text-xs font-bold outline-none focus:border-gold transition-colors" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Team Collection</label>
                     <input required className="w-full bg-white/5 border border-white/10 p-4 text-xs font-bold outline-none focus:border-gold transition-colors" value={newProduct.team} onChange={e => setNewProduct({...newProduct, team: e.target.value})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Price (BDT)</label>
                     <input required type="number" className="w-full bg-white/5 border border-white/10 p-4 text-xs font-bold outline-none focus:border-gold transition-colors text-gold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Category</label>
                     <select className="w-full bg-white/5 border border-white/10 p-4 text-xs font-bold outline-none focus:border-gold transition-colors" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                        <option value="Club Jersey">Club Jersey</option>
                        <option value="National Team">National Team</option>
                        <option value="Player Edition">Player Edition</option>
                        <option value="Fan Edition">Fan Edition</option>
                     </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Visual URL (CDN)</label>
                   <input required className="w-full bg-white/5 border border-white/10 p-4 text-xs font-bold outline-none focus:border-gold transition-colors" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-gold text-rich-black py-5 font-black uppercase tracking-widest text-xs hover:bg-gold-light transition-all glow-gold">
                   Authenticate & Commit Asset
                </button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
        {activeView === 'orders' && (
          <div className="bg-white/2 border border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
                  <th className="p-8">Reference</th>
                  <th className="p-8">Customer</th>
                  <th className="p-8">Quantum</th>
                  <th className="p-8">Timeline</th>
                  <th className="p-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-8 font-mono text-xs font-bold uppercase tracking-widest">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="p-8">
                       <p className="text-xs font-bold uppercase tracking-widest mb-1">{order.userId.slice(0, 8)}</p>
                       <span className="text-[9px] text-white/20 uppercase font-black">{order.email || 'Elite Guest'}</span>
                    </td>
                    <td className="p-8 text-gold font-bold text-xs">৳{order.totalAmount.toLocaleString()}</td>
                    <td className="p-8">
                       <div className="flex items-center gap-3">
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-rich-black border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1 outline-none focus:border-gold"
                        >
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                       </div>
                    </td>
                    <td className="p-8 text-right">
                       <button className="text-white/20 hover:text-white"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </motion.div>
  );
};

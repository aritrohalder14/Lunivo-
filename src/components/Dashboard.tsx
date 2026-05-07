import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Package, 
  Heart, 
  LogOut, 
  Settings,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  X,
  CreditCard
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface Order {
  id: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: any;
}

export const Dashboard = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user && activeTab === 'orders') {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          setOrders(ordersData);
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user, activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date()
      });
      setEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-rich-black/98 backdrop-blur-2xl flex flex-col md:flex-row"
    >
      <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-20">
        <X size={24} />
      </button>

      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-white/5 p-12 flex flex-col pt-32 md:pt-12">
        <div className="mb-16">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mb-6">
            <UserIcon size={32} className="text-gold" />
          </div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-tighter mb-2">{profile?.displayName || 'Elite Member'}</h2>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{profile?.email}</p>
        </div>

        <nav className="space-y-4 flex-1">
          {[
            { id: 'profile', label: 'Profile', icon: Settings },
            { id: 'orders', label: 'Order History', icon: Package },
            { id: 'wishlist', label: 'Wishlist', icon: Heart }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between p-4 bg-white/2 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-widest ${activeTab === item.id ? 'border-l-2 border-gold text-white' : 'text-white/40'}`}
            >
              <span className="flex items-center gap-3"><item.icon size={16} /> {item.label}</span>
              <ChevronRight size={14} className={activeTab === item.id ? 'text-gold' : 'opacity-0'} />
            </button>
          ))}
        </nav>

        <button 
          onClick={() => { logout(); onClose(); }}
          className="mt-12 flex items-center gap-3 text-red-500/60 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-12 md:p-24 overflow-y-auto pt-12 md:pt-24">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl"
            >
              <div className="flex justify-between items-center mb-12">
                <h3 className="font-display font-bold text-4xl uppercase tracking-tighter">Member <span className="text-white/30">Profile</span></h3>
                {!editingProfile && (
                  <button 
                    onClick={() => setEditingProfile(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-gold hover:text-gold-light transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Display Name</label>
                      <input 
                        type="text" 
                        value={formData.displayName} 
                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-5 text-sm uppercase font-bold tracking-widest outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.phoneNumber} 
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-5 text-sm uppercase font-bold tracking-widest outline-none focus:border-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Shipping Address</label>
                      <textarea 
                        rows={4}
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-5 text-sm uppercase font-bold tracking-widest outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-gold text-rich-black py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gold-light transition-all">Save Changes</button>
                    <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 border border-white/10 py-4 text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-12">
                  {[
                    { icon: MapPin, label: 'Default Shipping', value: profile?.address || 'No address saved' },
                    { icon: Phone, label: 'Contact Number', value: profile?.phoneNumber || 'No phone saved' },
                    { icon: CreditCard, label: 'Payment Method', value: 'Saved Card: **** 4421' }
                  ].map((info, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="w-12 h-12 bg-white/2 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-gold/20 transition-colors">
                        <info.icon size={20} className="text-white/30 group-hover:text-gold transition-colors" />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2 block">{info.label}</span>
                        <p className="text-lg font-display font-medium uppercase tracking-tight">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="font-display font-bold text-4xl uppercase tracking-tighter mb-12">Purchase <span className="text-white/30">Legacy</span></h3>
              
              <div className="space-y-6">
                {orders.length > 0 ? orders.map((order) => (
                  <div key={order.id} className="p-8 bg-white/2 border border-white/5 hover:border-gold/20 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 block">Order ID: #{order.id.slice(-8).toUpperCase()}</span>
                        <div className="flex items-center gap-4">
                           <Clock size={14} className="text-gold" />
                           <span className="text-xs font-bold uppercase tracking-widest">{order.createdAt?.toDate().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 border border-gold/20 rounded-full">
                        {order.status === 'delivered' ? <CheckCircle2 size={14} className="text-green-500" /> : <Truck size={14} className="text-gold animate-pulse" />}
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">{order.status}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-8">
                       <div className="flex -space-x-4">
                        {order.items.slice(0, 3).map((item, idx) => (
                           <div key={idx} className="w-12 h-16 bg-white/10 border-2 border-rich-black overflow-hidden relative">
                              <img src={item.image} className="w-full h-full object-cover" />
                           </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-16 bg-gold/20 border-2 border-rich-black flex items-center justify-center text-[10px] font-black">+{order.items.length - 3}</div>
                        )}
                       </div>
                       <p className="text-2xl font-display font-bold text-gold">৳{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-32 opacity-20 italic">
                    <Package size={64} className="mx-auto mb-8" />
                    <p className="uppercase tracking-[0.2em] text-sm">No historical match acquisitions detected</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'wishlist' && (
             <motion.div
              key="wishlist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="font-display font-bold text-4xl uppercase tracking-tighter mb-12">Saved <span className="text-white/30">Grails</span></h3>
              <div className="text-center py-32 opacity-20 italic">
                  <Heart size={64} className="mx-auto mb-8" />
                  <p className="uppercase tracking-[0.2em] text-sm">Your most coveted selections will appear here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

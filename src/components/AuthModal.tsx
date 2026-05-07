import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: any) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-rich-black/90 backdrop-blur-md"
        >
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-md bg-rich-black border border-white/10 p-8 md:p-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={onClose}
                className="text-white/20 hover:text-white transition-colors"
                id="close-auth-modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl uppercase tracking-tighter mb-2">
                {isLogin ? 'Welcome Back' : 'Join The Elite'}
              </h2>
              <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">
                {isLogin ? 'Access your curated collection' : 'Begin your legacy stitching journey'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input
                    type="text"
                    placeholder="FULL NAME"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-12 py-4 text-xs tracking-widest outline-none focus:border-gold transition-colors placeholder:text-white/10 uppercase font-bold"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-12 py-4 text-xs tracking-widest outline-none focus:border-gold transition-colors placeholder:text-white/10 uppercase font-bold"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  type="password"
                  placeholder="PASSWORD"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-12 py-4 text-xs tracking-widest outline-none focus:border-gold transition-colors placeholder:text-white/10 uppercase font-bold"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {message && (
                <div className="flex items-center gap-2 text-gold text-[10px] font-black uppercase tracking-widest">
                  <AlertCircle size={14} />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-rich-black py-4 font-black uppercase tracking-widest text-[10px] hover:bg-gold transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
              <div className="flex gap-4">
                <button 
                  onClick={() => handleSocialSignIn(googleProvider)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleSocialSignIn(facebookProvider)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-[#1877F2]" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-4 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-gold transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
                {isLogin && (
                  <button
                    onClick={handleResetPassword}
                    className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-gold transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

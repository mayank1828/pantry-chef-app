import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Refrigerator, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Search, 
  ShoppingBag, 
  Check, 
  ArrowRight,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
  LogOut,
  Mail,
  Send
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCZGI_kaTc2OPE5hL8eQ7DJ5iQ51jMF5L8",
  authDomain: "pantry-chef-app-19f65.firebaseapp.com",
  projectId: "pantry-chef-app-19f65",
  storageBucket: "pantry-chef-app-19f65.firebasestorage.app",
  messagingSenderId: "569222077550",
  appId: "1:569222077550:web:904a90b0d43e9368c49a7f",
  measurementId: "G-W213848JL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'kitchen-system-v1';

// --- Mock Recipe Database ---
const RECIPE_DB = [
  { id: 'r1', title: 'Garlic Butter Chicken', category: 'Dinner', time: '20m', calories: 450, ingredients: ['chicken breast', 'garlic', 'butter', 'parsley', 'lemon'] },
  { id: 'r2', title: 'Vegetable Stir Fry', category: 'Dinner', time: '25m', calories: 320, ingredients: ['broccoli', 'bell pepper', 'carrot', 'soy sauce', 'garlic', 'rice'] },
  { id: 'r3', title: 'Classic Omelette', category: 'Breakfast', time: '10m', calories: 280, ingredients: ['eggs', 'milk', 'cheese', 'butter', 'salt'] },
  { id: 'r4', title: 'Spaghetti Aglio e Olio', category: 'Dinner', time: '15m', calories: 400, ingredients: ['spaghetti', 'garlic', 'olive oil', 'red pepper flakes', 'parsley'] },
  { id: 'r5', title: 'Chicken Caesar Salad', category: 'Lunch', time: '15m', calories: 350, ingredients: ['chicken breast', 'lettuce', 'croutons', 'parmesan', 'caesar dressing'] },
  { id: 'r6', title: 'Avocado Toast', category: 'Breakfast', time: '5m', calories: 220, ingredients: ['bread', 'avocado', 'lemon', 'salt', 'pepper'] },
  { id: 'r7', title: 'Beef Tacos', category: 'Dinner', time: '30m', calories: 500, ingredients: ['ground beef', 'taco shells', 'lettuce', 'cheese', 'salsa'] },
  { id: 'r12', title: 'Pancakes', category: 'Breakfast', time: '20m', calories: 450, ingredients: ['flour', 'eggs', 'milk', 'sugar', 'baking powder', 'butter'] },
  { id: 'r13', title: 'Fried Rice', category: 'Dinner', time: '20m', calories: 400, ingredients: ['rice', 'eggs', 'peas', 'carrots', 'soy sauce', 'onion'] },
  { id: 'r14', title: 'Caprese Salad', category: 'Lunch', time: '10m', calories: 280, ingredients: ['tomatoes', 'mozzarella', 'basil', 'balsamic glaze', 'olive oil'] }
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Spices', 'Other'];

// --- LOGIN COMPONENT ---
function LoginPage({ onLoginSent }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendLink = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');

    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSent(true);
      if(onLoginSent) onLoginSent();
    } catch (error) {
      console.error(error);
      setError("Error sending link. Did you enable 'Email Link' in Firebase Console?");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-indigo-500">
           <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Check size={32} />
           </div>
           <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your inbox!</h2>
           <p className="text-slate-500 mb-6">
             We sent a magic login link to <strong>{email}</strong>.<br/>
             Click the link in that email to sign in instantly.
           </p>
           <button onClick={() => setSent(false)} className="text-indigo-600 font-medium text-sm hover:underline">
             Try a different email
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-indigo-50/50 border-b border-indigo-100">
          <div className="bg-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <UtensilsCrossed size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Kitchen System</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your pantry</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSendLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chef@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={sending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {sending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              {sending ? 'Sending Link...' : 'Send Verification Link'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Secure passwordless access. We'll send a magic link to your email.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pantry'); 
  
  // Data States
  const [pantryItems, setPantryItems] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [shoppingList, setShoppingList] = useState([]); // Added explicit state for safer render
  
  // UI States
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Produce');
  const [searchRecipe, setSearchRecipe] = useState('');
  const [selectedDayForAdd, setSelectedDayForAdd] = useState(null);

  // --- Auth & Init ---
  useEffect(() => {
    // 1. Check if user arrived via Email Link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          window.localStorage.removeItem('emailForSignIn');
          // Clear URL to prevent re-triggering
          window.history.replaceState({}, document.title, "/");
        })
        .catch((error) => {
          console.error("Link Sign In Error", error);
        });
    }

    // 2. Listen for Auth State
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user) return;

    // Listen to Pantry
    const pantryQuery = query(collection(db, 'artifacts', appId, 'users', user.uid, 'pantry'));
    const unsubPantry = onSnapshot(pantryQuery, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        setPantryItems(items);
      },
      (error) => console.error("Pantry sync error:", error)
    );

    // Listen to Meal Plan
    const planRef = doc(db, 'artifacts', appId, 'users', user.uid, 'plans', 'weekly');
    const unsubPlan = onSnapshot(planRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setMealPlan(docSnap.data());
        } else {
          setMealPlan({});
        }
      },
      (error) => console.error("Plan sync error:", error)
    );

    return () => {
      unsubPantry();
      unsubPlan();
    };
  }, [user]);

  // --- Actions ---

  const handleAddPantryItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !user) return;
    const name = newItemText.trim().toLowerCase();
    if (pantryItems.some(item => item.name === name)) {
      setNewItemText('');
      return; 
    }
    try {
      await setDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'pantry')), {
        name,
        category: newItemCategory,
        createdAt: serverTimestamp()
      });
      setNewItemText('');
    } catch (err) { console.error(err); }
  };

  const handleDeletePantryItem = async (id) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'pantry', id)); } catch (err) { console.error(err); }
  };

  const handleAddToPlan = async (recipe, day) => {
    if (!user) return;
    const updatedPlan = { ...mealPlan };
    if (!updatedPlan[day]) updatedPlan[day] = [];
    updatedPlan[day].push({ ...recipe, instanceId: Date.now().toString() });
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'plans', 'weekly'), updatedPlan);
      setActiveTab('plan');
      setSelectedDayForAdd(null);
    } catch (err) { console.error(err); }
  };

  const handleRemoveFromPlan = async (day, instanceId) => {
    if (!user) return;
    const updatedPlan = { ...mealPlan };
    if (updatedPlan[day]) {
      updatedPlan[day] = updatedPlan[day].filter(m => m.instanceId !== instanceId);
      try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'plans', 'weekly'), updatedPlan); } catch (err) { console.error(err); }
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // --- Computed Data ---
  const matchedRecipes = useMemo(() => {
    const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase()));
    return RECIPE_DB.map(recipe => {
      const totalIngredients = recipe.ingredients.length;
      const presentIngredients = recipe.ingredients.filter(ing => {
        return Array.from(pantryNames).some(pName => pName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(pName));
      });
      const missingIngredients = recipe.ingredients.filter(ing => 
        !Array.from(pantryNames).some(pName => pName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(pName))
      );
      const matchPercentage = Math.round((presentIngredients.length / totalIngredients) * 100);
      return { ...recipe, matchPercentage, missingIngredients };
    })
    .filter(r => !searchRecipe || r.title.toLowerCase().includes(searchRecipe.toLowerCase()))
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [pantryItems, searchRecipe]);

  const computedShoppingList = useMemo(() => {
    const needed = new Set();
    const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase()));
    Object.values(mealPlan).flat().forEach(meal => {
        meal.ingredients.forEach(ing => {
            const hasIt = Array.from(pantryNames).some(pName => pName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(pName));
            if (!hasIt) needed.add(ing);
        });
    });
    return Array.from(needed).sort();
  }, [mealPlan, pantryItems]);


  // --- AUTH GUARD ---
  if (authLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-indigo-600"><Loader2 className="animate-spin w-8 h-8"/></div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  // --- DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 md:pb-0">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg text-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <UtensilsCrossed size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Kitchen System</h1>
              <p className="text-xs text-indigo-100 opacity-90">Welcome, Chef</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-md">
              {[
                { id: 'pantry', label: 'Inventory', icon: LayoutDashboard },
                { id: 'recipes', label: 'Recipes', icon: Search },
                { id: 'plan', label: 'Planning', icon: CalendarDays },
                { id: 'shopping', label: 'Orders', icon: ShoppingBag },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>

            <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/30 p-2 rounded-lg text-red-100 hover:text-white transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* PANTRY TAB */}
        {activeTab === 'pantry' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                 <span className="text-3xl font-bold text-indigo-600">{pantryItems.length}</span>
                 <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">In Stock</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                 <span className="text-3xl font-bold text-violet-600">{computedShoppingList.length}</span>
                 <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">To Buy</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                 <span className="text-3xl font-bold text-pink-500">{Object.values(mealPlan).flat().length}</span>
                 <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Meals</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Kitchen Inventory</h2>
                  <p className="text-sm text-slate-500">Manage your available ingredients</p>
                </div>
                <form onSubmit={handleAddPantryItem} className="flex gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add item..."
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full"
                  />
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="submit" disabled={!newItemText.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
                    <Plus size={20} />
                  </button>
                </form>
              </div>

              <div className="p-6">
                {pantryItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Refrigerator className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Inventory is empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pantryItems.map((item) => (
                      <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.category === 'Produce' ? 'bg-green-400' : item.category === 'Meat' ? 'bg-red-400' : item.category === 'Dairy' ? 'bg-yellow-400' : 'bg-slate-300'}`} />
                          <span className="font-medium text-slate-700 capitalize">{item.name}</span>
                        </div>
                        <button onClick={() => handleDeletePantryItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Recipe Database</h2>
                <p className="text-slate-500">Suggestions based on inventory</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search database..."
                  value={searchRecipe}
                  onChange={(e) => setSearchRecipe(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full md:w-64"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {matchedRecipes.map((recipe) => (
                <div key={recipe.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  <div className={`h-2 w-full ${recipe.matchPercentage === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : recipe.matchPercentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-slate-200'}`} />
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{recipe.title}</h3>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{recipe.time}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">{recipe.category}</span>
                      <span>{recipe.calories} kcal</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-slate-500">Availability</span>
                        <span className={`font-bold ${recipe.matchPercentage === 100 ? 'text-emerald-500' : recipe.matchPercentage > 50 ? 'text-orange-500' : 'text-slate-400'}`}>{recipe.matchPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                        <div className={`h-1.5 rounded-full ${recipe.matchPercentage === 100 ? 'bg-emerald-400' : recipe.matchPercentage > 50 ? 'bg-orange-400' : 'bg-slate-300'}`} style={{ width: `${recipe.matchPercentage}%` }}></div>
                      </div>
                      {recipe.missingIngredients.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {recipe.missingIngredients.slice(0, 3).map(ing => <span key={ing} className="px-2 py-1 bg-red-50 text-red-500 rounded text-[10px] uppercase font-bold tracking-wide border border-red-100">{ing}</span>)}
                            {recipe.missingIngredients.length > 3 && <span className="px-2 py-1 text-slate-400 text-[10px] font-bold">+{recipe.missingIngredients.length - 3}</span>}
                        </div>
                      ) : (
                          <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><Check size={12} /> Ready to cook</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                    {selectedDayForAdd === recipe.id ? (
                      <div className="animate-in zoom-in duration-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Assign to day</p>
                        <div className="grid grid-cols-4 gap-1">
                          {DAYS_OF_WEEK.map(day => <button key={day} onClick={() => handleAddToPlan(recipe, day)} className="px-1 py-2 text-xs rounded bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors shadow-sm">{day.slice(0, 3)}</button>)}
                          <button onClick={() => setSelectedDayForAdd(null)} className="px-1 py-2 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-600">×</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSelectedDayForAdd(recipe.id)} className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">Add to Plan</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAN TAB */}
        {activeTab === 'plan' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Weekly Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map(day => {
                const meals = mealPlan[day] || [];
                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                return (
                  <div key={day} className={`rounded-xl border ${isToday ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200'} bg-white overflow-hidden flex flex-col h-full min-h-[200px]`}>
                    <div className={`px-4 py-3 border-b ${isToday ? 'bg-indigo-50 text-indigo-800' : 'bg-white text-slate-700'} font-bold flex justify-between items-center`}>
                      {day}
                      {isToday && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Today</span>}
                    </div>
                    <div className="p-3 flex-1 space-y-2 bg-slate-50/50">
                      {meals.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                          <span className="text-xs italic">No meals</span>
                          <button onClick={() => setActiveTab('recipes')} className="mt-2 text-xs text-indigo-500 font-bold uppercase tracking-wide hover:underline">+ Add</button>
                        </div>
                      ) : (
                        meals.map(meal => (
                          <div key={meal.instanceId} className="group relative bg-white border border-slate-200 shadow-sm rounded-lg p-3 hover:border-indigo-300 transition-colors">
                             <h4 className="font-medium text-slate-800 text-sm mb-1 leading-snug">{meal.title}</h4>
                             <div className="flex justify-between items-center text-xs text-slate-500"><span>{meal.calories} kcal</span><span className="capitalize">{meal.category}</span></div>
                             <button onClick={() => handleRemoveFromPlan(day, meal.instanceId)} className="absolute -top-2 -right-2 bg-white shadow-sm border border-red-100 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={12} /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SHOPPING TAB */}
        {activeTab === 'shopping' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                   <h2 className="text-2xl font-bold flex items-center gap-3"><ShoppingBag className="text-indigo-300" />Order List</h2>
                   <p className="text-slate-300 mt-1 text-sm">Generated based on your weekly meal plan shortages.</p>
                </div>
                <div className="p-0">
                  {computedShoppingList.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                       <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="text-green-500" size={32} /></div>
                       <p className="text-lg font-medium text-slate-700">All stocked up!</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {computedShoppingList.map((item, idx) => (
                        <li key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                            onClick={(e) => {
                               const text = e.currentTarget.querySelector('span');
                               const box = e.currentTarget.querySelector('.check-box');
                               text.classList.toggle('line-through');
                               text.classList.toggle('text-slate-400');
                               box.classList.toggle('bg-indigo-500');
                               box.classList.toggle('border-indigo-500');
                            }}
                        >
                           <div className="check-box w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center transition-colors"><Check size={12} className="text-white pointer-events-none" /></div>
                           <span className="text-slate-700 font-medium capitalize flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {computedShoppingList.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button onClick={() => { const text = "Order List:\n" + computedShoppingList.map(i => `- ${i}`).join('\n'); try { navigator.clipboard.writeText(text); } catch (e) {} alert("Copied to clipboard!"); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide">Copy to Clipboard</button>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {[ { id: 'pantry', icon: LayoutDashboard }, { id: 'recipes', icon: Search }, { id: 'plan', icon: CalendarDays }, { id: 'shopping', icon: ShoppingBag } ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'text-slate-400'}`}><tab.icon size={20} /></button>
          ))}
          <button onClick={handleLogout} className="p-3 rounded-xl text-red-400 hover:text-red-600"><LogOut size={20} /></button>
      </div>

    </div>
  );
}

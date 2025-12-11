import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
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
  ChefHat, 
  Refrigerator, 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  ShoppingBag, 
  Check, 
  Utensils, 
  ArrowRight,
  Filter,
  AlertCircle,
  Loader2
} from 'lucide-react';

// --- Firebase Configuration ---
// TODO: Replace the lines below with your actual Firebase config object
// You can get this from Firebase Console -> Project Settings -> General -> "Your apps"
const firebaseConfig = {
  // apiKey: "AIzaSy...",
  // authDomain: "your-app.firebaseapp.com",
  // projectId: "your-app",
  // storageBucket: "your-app.appspot.com",
  // messagingSenderId: "123456789",
  // appId: "1:123456789:web:..."
};

// Initialize Firebase
// Ensure firebaseConfig is valid before running.
// If you are testing locally without keys, this might error.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'my-pantry-app-v1';

// --- Mock Recipe Database ---
const RECIPE_DB = [
  {
    id: 'r1',
    title: 'Garlic Butter Chicken',
    category: 'Dinner',
    time: '20m',
    calories: 450,
    ingredients: ['chicken breast', 'garlic', 'butter', 'parsley', 'lemon']
  },
  {
    id: 'r2',
    title: 'Vegetable Stir Fry',
    category: 'Dinner',
    time: '25m',
    calories: 320,
    ingredients: ['broccoli', 'bell pepper', 'carrot', 'soy sauce', 'garlic', 'rice']
  },
  {
    id: 'r3',
    title: 'Classic Omelette',
    category: 'Breakfast',
    time: '10m',
    calories: 280,
    ingredients: ['eggs', 'milk', 'cheese', 'butter', 'salt']
  },
  {
    id: 'r4',
    title: 'Spaghetti Aglio e Olio',
    category: 'Dinner',
    time: '15m',
    calories: 400,
    ingredients: ['spaghetti', 'garlic', 'olive oil', 'red pepper flakes', 'parsley']
  },
  {
    id: 'r5',
    title: 'Chicken Caesar Salad',
    category: 'Lunch',
    time: '15m',
    calories: 350,
    ingredients: ['chicken breast', 'lettuce', 'croutons', 'parmesan', 'caesar dressing']
  },
  {
    id: 'r6',
    title: 'Avocado Toast',
    category: 'Breakfast',
    time: '5m',
    calories: 220,
    ingredients: ['bread', 'avocado', 'lemon', 'salt', 'pepper']
  },
  {
    id: 'r7',
    title: 'Beef Tacos',
    category: 'Dinner',
    time: '30m',
    calories: 500,
    ingredients: ['ground beef', 'taco shells', 'lettuce', 'cheese', 'salsa']
  },
  {
    id: 'r8',
    title: 'Greek Yogurt Parfait',
    category: 'Breakfast',
    time: '5m',
    calories: 200,
    ingredients: ['greek yogurt', 'honey', 'granola', 'berries']
  },
  {
    id: 'r9',
    title: 'Tomato Basil Soup',
    category: 'Lunch',
    time: '30m',
    calories: 250,
    ingredients: ['tomatoes', 'basil', 'onion', 'garlic', 'vegetable broth']
  },
  {
    id: 'r10',
    title: 'Grilled Cheese Sandwich',
    category: 'Lunch',
    time: '10m',
    calories: 380,
    ingredients: ['bread', 'cheese', 'butter']
  },
  {
    id: 'r11',
    title: 'Tuna Salad',
    category: 'Lunch',
    time: '10m',
    calories: 300,
    ingredients: ['canned tuna', 'mayonnaise', 'celery', 'onion', 'lemon']
  },
  {
    id: 'r12',
    title: 'Pancakes',
    category: 'Breakfast',
    time: '20m',
    calories: 450,
    ingredients: ['flour', 'eggs', 'milk', 'sugar', 'baking powder', 'butter']
  },
  {
    id: 'r13',
    title: 'Fried Rice',
    category: 'Dinner',
    time: '20m',
    calories: 400,
    ingredients: ['rice', 'eggs', 'peas', 'carrots', 'soy sauce', 'onion']
  },
  {
    id: 'r14',
    title: 'Caprese Salad',
    category: 'Lunch',
    time: '10m',
    calories: 280,
    ingredients: ['tomatoes', 'mozzarella', 'basil', 'balsamic glaze', 'olive oil']
  },
  {
    id: 'r15',
    title: 'Banana Smoothie',
    category: 'Breakfast',
    time: '5m',
    calories: 180,
    ingredients: ['banana', 'milk', 'yogurt', 'honey']
  }
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Pantry', 'Spices', 'Other'];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pantry'); // pantry, recipes, plan, shopping
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [pantryItems, setPantryItems] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  
  // UI States
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Produce');
  const [searchRecipe, setSearchRecipe] = useState('');
  const [selectedDayForAdd, setSelectedDayForAdd] = useState(null);

  // --- Auth & Init ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
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
        // Sort by category then name
        items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        setPantryItems(items);
      },
      (error) => console.error("Pantry sync error:", error)
    );

    // Listen to Meal Plan (stored as a single doc for simplicity in this demo)
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
    
    // Check if exists
    if (pantryItems.some(item => item.name === name)) {
      setNewItemText('');
      return; // Already exists
    }

    try {
      await setDoc(doc(collection(db, 'artifacts', appId, 'users', user.uid, 'pantry')), {
        name,
        category: newItemCategory,
        createdAt: serverTimestamp()
      });
      setNewItemText('');
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const handleDeletePantryItem = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'pantry', id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const handleAddToPlan = async (recipe, day) => {
    if (!user) return;
    
    const updatedPlan = { ...mealPlan };
    if (!updatedPlan[day]) updatedPlan[day] = [];
    
    // Add unique ID for the meal instance
    updatedPlan[day].push({
      ...recipe,
      instanceId: Date.now().toString()
    });

    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'plans', 'weekly'), updatedPlan);
      setActiveTab('plan');
      setSelectedDayForAdd(null);
    } catch (err) {
      console.error("Error updating plan:", err);
    }
  };

  const handleRemoveFromPlan = async (day, instanceId) => {
    if (!user) return;
    
    const updatedPlan = { ...mealPlan };
    if (updatedPlan[day]) {
      updatedPlan[day] = updatedPlan[day].filter(m => m.instanceId !== instanceId);
      try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'plans', 'weekly'), updatedPlan);
      } catch (err) {
        console.error("Error removing meal:", err);
      }
    }
  };

  // --- Computed Data ---

  // Match logic
  const matchedRecipes = useMemo(() => {
    const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase()));
    
    return RECIPE_DB.map(recipe => {
      const totalIngredients = recipe.ingredients.length;
      const presentIngredients = recipe.ingredients.filter(ing => {
        // Simple fuzzy check: checks if pantry item includes ingredient name or vice versa
        // In a real app, this would use a more robust search/stemming
        return Array.from(pantryNames).some(pName => 
          pName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(pName)
        );
      });
      
      const missingIngredients = recipe.ingredients.filter(ing => 
        !Array.from(pantryNames).some(pName => 
          pName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(pName)
        )
      );

      const matchPercentage = Math.round((presentIngredients.length / totalIngredients) * 100);

      return {
        ...recipe,
        matchPercentage,
        missingIngredients
      };
    })
    .filter(r => {
        if (!searchRecipe) return true;
        return r.title.toLowerCase().includes(searchRecipe.toLowerCase());
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [pantryItems, searchRecipe]);

  // Shopping List logic
  const shoppingList = useMemo(() => {
    const needed = new Set();
    const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase()));

    Object.values(mealPlan).flat().forEach(meal => {
        meal.ingredients.forEach(ing => {
            const hasIt = Array.from(pantryNames).some(pName => 
                pName.includes(ing.toLowerCase()) || ing.toLowerCase().includes(pName)
            );
            if (!hasIt) {
                needed.add(ing);
            }
        });
    });
    return Array.from(needed).sort();
  }, [mealPlan, pantryItems]);


  // --- Render Helpers ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-emerald-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-0">
      
      {/* Top Navigation / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg text-white">
            <ChefHat size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">PantryChef</h1>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'pantry', label: 'My Pantry', icon: Refrigerator },
            { id: 'recipes', label: 'Cookbook', icon: Search },
            { id: 'plan', label: 'Meal Plan', icon: Calendar },
            { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        
        {/* --- PANTRY TAB --- */}
        {activeTab === 'pantry' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-emerald-50/50">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">What's in your kitchen?</h2>
                <p className="text-slate-500">Add ingredients you have. We'll suggest recipes based on this list.</p>
                
                <form onSubmit={handleAddPantryItem} className="mt-6 flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="e.g. Chicken Breast, Rice, Eggs..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button 
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add
                  </button>
                </form>
              </div>

              <div className="p-6">
                {pantryItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Refrigerator className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Your pantry is empty. Add some items to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pantryItems.map((item) => (
                      <div key={item.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            item.category === 'Produce' ? 'bg-green-400' :
                            item.category === 'Meat' ? 'bg-red-400' :
                            item.category === 'Dairy' ? 'bg-yellow-400' :
                            'bg-slate-300'
                          }`} />
                          <span className="font-medium text-slate-700 capitalize">{item.name}</span>
                        </div>
                        <button 
                          onClick={() => handleDeletePantryItem(item.id)}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
               <button 
                 onClick={() => setActiveTab('recipes')}
                 className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700"
               >
                 Find Recipes <ArrowRight size={18} />
               </button>
            </div>
          </div>
        )}

        {/* --- RECIPES TAB --- */}
        {activeTab === 'recipes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Recipe Suggestions</h2>
                <p className="text-slate-500">Based on your {pantryItems.length} pantry items</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchRecipe}
                  onChange={(e) => setSearchRecipe(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full md:w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {matchedRecipes.map((recipe) => (
                <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {/* Match Banner */}
                  <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center ${
                    recipe.matchPercentage === 100 ? 'bg-emerald-100 text-emerald-700' :
                    recipe.matchPercentage >= 50 ? 'bg-yellow-50 text-yellow-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <span>{recipe.matchPercentage}% Match</span>
                    {recipe.matchPercentage === 100 && <Check size={14} />}
                  </div>

                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{recipe.title}</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{recipe.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span>{recipe.category}</span>
                      <span>•</span>
                      <span>{recipe.calories} kcal</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      {recipe.missingIngredients.length > 0 ? (
                        <div className="text-sm">
                          <p className="text-slate-500 mb-1 flex items-center gap-1">
                            <AlertCircle size={14} className="text-amber-500" />
                            Missing:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {recipe.missingIngredients.map(ing => (
                              <span key={ing} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs border border-red-100">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                         <p className="text-sm text-emerald-600 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg">
                           <Check size={14} /> You have everything!
                         </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {selectedDayForAdd === recipe.id ? (
                      <div className="animate-in zoom-in duration-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Add to which day?</p>
                        <div className="grid grid-cols-4 gap-1">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day}
                              onClick={() => handleAddToPlan(recipe, day)}
                              className="px-1 py-2 text-xs rounded bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                          <button
                             onClick={() => setSelectedDayForAdd(null)}
                             className="px-1 py-2 text-xs rounded bg-slate-200 hover:bg-slate-300 text-slate-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedDayForAdd(recipe.id)}
                        className="w-full py-2 bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 text-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar size={16} />
                        Add to Meal Plan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PLAN TAB --- */}
        {activeTab === 'plan' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Weekly Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map(day => {
                const meals = mealPlan[day] || [];
                const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
                
                return (
                  <div key={day} className={`rounded-xl border ${isToday ? 'border-emerald-400 shadow-md ring-1 ring-emerald-400/20' : 'border-slate-200'} bg-white overflow-hidden flex flex-col h-full min-h-[200px]`}>
                    <div className={`px-4 py-3 border-b ${isToday ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'} font-bold flex justify-between items-center`}>
                      {day}
                      {isToday && <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wide">Today</span>}
                    </div>
                    
                    <div className="p-3 flex-1 space-y-2">
                      {meals.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 border-2 border-dashed border-slate-100 rounded-lg">
                          <span className="text-sm">No meals planned</span>
                          <button 
                             onClick={() => setActiveTab('recipes')}
                             className="mt-2 text-xs text-emerald-600 font-medium hover:underline"
                          >
                             + Add Recipe
                          </button>
                        </div>
                      ) : (
                        meals.map(meal => (
                          <div key={meal.instanceId} className="group relative bg-white border border-slate-100 shadow-sm rounded-lg p-3 hover:border-emerald-200 transition-colors">
                             <h4 className="font-medium text-slate-800 text-sm mb-1">{meal.title}</h4>
                             <div className="flex justify-between items-center text-xs text-slate-500">
                               <span>{meal.calories} kcal</span>
                               <span className="capitalize">{meal.category}</span>
                             </div>
                             
                             <button 
                               onClick={() => handleRemoveFromPlan(day, meal.instanceId)}
                               className="absolute -top-2 -right-2 bg-white shadow-sm border border-red-100 text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                             >
                               <Trash2 size={12} />
                             </button>
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

        {/* --- SHOPPING TAB --- */}
        {activeTab === 'shopping' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-amber-50/50">
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                     <ShoppingBag className="text-amber-500" />
                     Shopping List
                   </h2>
                   <p className="text-slate-500 mt-1">
                     Items needed for your weekly plan that aren't in your pantry.
                   </p>
                </div>
                
                <div className="p-6">
                  {shoppingList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                       <Check className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                       <p className="text-lg font-medium text-slate-600">All set!</p>
                       <p>You have all the ingredients for your planned meals.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {shoppingList.map((item, idx) => (
                        <li key={idx} className="py-3 flex items-center gap-3 group">
                           <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-500"
                                onClick={(e) => {
                                   // Visual toggle for now
                                   e.currentTarget.classList.toggle('bg-emerald-500');
                                   e.currentTarget.classList.toggle('border-emerald-500');
                                   e.currentTarget.nextSibling.classList.toggle('line-through');
                                   e.currentTarget.nextSibling.classList.toggle('text-slate-400');
                                }}
                           >
                             <Check size={12} className="text-white pointer-events-none" />
                           </div>
                           <span className="text-slate-700 capitalize flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {shoppingList.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button 
                       onClick={() => {
                           const text = "Shopping List:\n" + shoppingList.map(i => `- ${i}`).join('\n');
                           try { navigator.clipboard.writeText(text); } catch (e) {}
                           alert("Copied to clipboard!");
                       }}
                       className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                )}
             </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center z-50 pb-safe">
          {[
            { id: 'pantry', icon: Refrigerator },
            { id: 'recipes', icon: Search },
            { id: 'plan', icon: Calendar },
            { id: 'shopping', icon: ShoppingBag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-xl transition-colors ${
                activeTab === tab.id 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-slate-400'
              }`}
            >
              <tab.icon size={24} />
            </button>
          ))}
      </div>

    </div>
  );
}

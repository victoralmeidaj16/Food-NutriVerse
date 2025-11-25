import React, { useState, useEffect, useRef } from 'react';
import { UserGoal, Recipe, UserProfile, Tab, RESTRICTION_OPTIONS, RECIPE_CATEGORIES, ActivityLevel, AppUsageMode } from './types';
import { generateFitnessRecipe, identifyIngredientsFromImage } from './services/geminiService';
// Firebase imports removed for Mock Mode
import { HomeIcon, SearchIcon, CameraIcon, BookHeartIcon, UserIcon, ChefHatIcon, FlameIcon, SparklesIcon, ArrowRightIcon, CheckIcon, PlayIcon, PauseIcon, CloseIcon, LeafIcon, TimerIcon, RefreshIcon, LightbulbIcon, PlusIcon, TrashIcon, ExchangeIcon, CalendarIcon, ActivityIcon, FaceFrownIcon, FaceSmileIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, PencilIcon, BellIcon } from './components/Icons';

// --- Components ---

const LoadingOverlay = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-[60] p-6 animate-fade-in">
    <div className="bg-surface border border-surfaceHighlight p-8 rounded-[2rem] flex flex-col items-center max-w-sm w-full text-center shadow-2xl shadow-black/5">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-surfaceHighlight rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-2xl text-primary">N</div>
      </div>
      <h3 className="text-2xl font-display font-bold text-text mb-2">{message}</h3>
    </div>
  </div>
);

// --- Auth Screens (Mock) ---

const LoginScreen = ({ onNavigateToSignUp, onLoginSuccess }: { onNavigateToSignUp: () => void, onLoginSuccess: (name: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setLoading(false);
        onLoginSuccess("Usuário Demo");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-6 animate-fade-in">
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center border-[3px] border-primary/20 shadow-xl shadow-primary/30 mb-6">
          <span className="text-4xl font-extrabold text-white">N</span>
        </div>
        <h1 className="text-3xl font-display font-extrabold text-center text-text mb-2 tracking-tight">Bem-vindo de volta</h1>
        <p className="text-center text-subtext">Entre na sua conta para continuar</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4 max-w-sm w-full mx-auto">
        <div className="relative">
          <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-surfaceHighlight rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
          />
        </div>
        
        <div className="relative">
          <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white border border-surfaceHighlight rounded-2xl py-4 pl-12 pr-12 text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text"
          >
            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
             <span className="animate-pulse">Entrando...</span>
          ) : (
             <>Entrar <ArrowRightIcon className="w-5 h-5" /></>
          )}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-subtext text-sm">Não tem uma conta?</p>
        <button onClick={onNavigateToSignUp} className="text-primary font-bold hover:underline mt-1 text-base">Criar conta gratuita</button>
      </div>
    </div>
  );
};

const SignUpScreen = ({ onNavigateToLogin, onSignUpSuccess }: { onNavigateToLogin: () => void, onSignUpSuccess: (name: string) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setLoading(false);
        onSignUpSuccess(name);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-6 animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-display font-extrabold text-center text-text mb-2 tracking-tight">Crie sua conta</h1>
        <p className="text-center text-subtext">Comece sua transformação hoje</p>
      </div>
      
      <form onSubmit={handleSignUp} className="space-y-4 max-w-sm w-full mx-auto">
        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Nome completo"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white border border-surfaceHighlight rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
          />
        </div>

        <div className="relative">
          <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-surfaceHighlight rounded-2xl py-4 pl-12 pr-4 text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
          />
        </div>
        
        <div className="relative">
          <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Senha (min. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white border border-surfaceHighlight rounded-2xl py-4 pl-12 pr-12 text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-sm"
          />
           <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text"
          >
            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-black py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? 'Criando...' : 'Criar conta'} <ArrowRightIcon className="w-5 h-5" />
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-subtext text-sm">Já tem uma conta?</p>
        <button onClick={onNavigateToLogin} className="text-black font-bold hover:underline mt-1 text-base">Fazer login</button>
      </div>
    </div>
  );
};

// --- Helper Components ---

const EditProfileModal = ({ userProfile, onClose, onSave }: { userProfile: UserProfile, onClose: () => void, onSave: (u: UserProfile) => void }) => {
    const [name, setName] = useState(userProfile.name);
    const [image, setImage] = useState(userProfile.profilePicture);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave({ ...userProfile, name, profilePicture: image });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-bold text-xl text-text">Editar Perfil</h3>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-subtext" /></button>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <div 
                        className="relative w-28 h-28 rounded-full bg-gray-100 cursor-pointer overflow-hidden border-4 border-white shadow-lg group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {image ? (
                            <img src={image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <UserIcon className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="text-primary font-bold text-sm mt-2">Alterar foto</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-subtext uppercase tracking-wider mb-2">Nome</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-surfaceHighlight rounded-2xl text-text font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg mt-8 active:scale-[0.98] transition hover:bg-gray-900"
                >
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

// Extracts time in minutes from a string (e.g. "20 minutos", "1 hora")
const extractTimeFromText = (text: string): number | null => {
    // Regex for "X minutos", "X min", "X m"
    const minMatch = text.match(/(\d+)\s*(?:minutos?|min|m)\b/i);
    if (minMatch) return parseInt(minMatch[1]);

    // Regex for "X horas", "X h"
    const hourMatch = text.match(/(\d+)\s*(?:horas?|h)\b/i);
    if (hourMatch) return parseInt(hourMatch[1]) * 60;

    return null;
};

const SmartCookingTimer = ({ text }: { text: string }) => {
    const minutes = extractTimeFromText(text);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        // Reset state when instruction changes
        setIsActive(false);
        setIsFinished(false);
        setTimeLeft(0);
    }, [text]);

    useEffect(() => {
        let interval: number;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsFinished(true);
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const startTimer = () => {
        if (!minutes) return;
        setTimeLeft(minutes * 60);
        setIsActive(true);
        setIsFinished(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!minutes) return null;

    return (
        <div className="mt-6">
            {!isActive && !isFinished && (
                <button 
                    onClick={startTimer}
                    className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition mx-auto hover:bg-gray-900"
                >
                    <TimerIcon className="w-5 h-5" />
                    Iniciar Timer ({minutes} min)
                </button>
            )}

            {(isActive || isFinished) && (
                <div className={`rounded-xl p-4 flex items-center justify-between border shadow-sm transition-colors ${isFinished ? 'bg-red-50 border-red-200' : 'bg-primary/10 border-primary/20'}`}>
                    <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFinished ? 'bg-red-100 text-red-500 animate-bounce' : 'bg-white text-primary'}`}>
                             {isFinished ? <BellIcon className="w-5 h-5" /> : <TimerIcon className="w-5 h-5" />}
                         </div>
                         <div>
                             <p className={`text-[10px] font-bold uppercase tracking-wide ${isFinished ? 'text-red-500' : 'text-green-800'}`}>
                                 {isFinished ? 'Tempo Esgotado' : 'Cozinhando'}
                             </p>
                             <p className={`font-display font-bold text-xl tabular-nums ${isFinished ? 'text-red-600' : 'text-text'}`}>
                                 {formatTime(timeLeft)}
                             </p>
                         </div>
                    </div>
                    <button 
                        onClick={() => { setIsActive(false); setIsFinished(false); }}
                        className="p-2 hover:bg-black/5 rounded-full text-subtext"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};

const DailyTipCard = () => (
    <div className="bg-white rounded-3xl p-5 mb-8 border border-surfaceHighlight relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
        <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <LightbulbIcon className="w-32 h-32 rotate-12 text-black" />
        </div>
        <div className="relative z-10 flex gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                <LightbulbIcon className="w-6 h-6 text-green-700" />
            </div>
            <div>
                <h3 className="font-display font-bold text-text mb-1 flex items-center gap-2">
                    Dica do Dia <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full">Nova</span>
                </h3>
                <p className="text-sm text-subtext leading-relaxed">
                    Substituir o sal por ervas e especiarias não só realça o sabor, mas também adiciona antioxidantes poderosos.
                </p>
            </div>
        </div>
    </div>
);

const CookingMode = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
  const [step, setStep] = useState(0);
  
  return (
    <div className="fixed inset-0 bg-background z-[70] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-surfaceHighlight bg-white/80 backdrop-blur-md">
        <button onClick={onClose} className="text-subtext hover:text-text p-2 -ml-2">
          <CloseIcon className="w-6 h-6" />
        </button>
        <span className="font-display font-bold text-lg text-text">Modo Cozinha</span>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 flex flex-col items-center justify-center min-h-0">
        <div className="w-full max-w-md">
            <div className="mb-8 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-green-800 text-xs font-bold mb-3">
                    Passo {step + 1} de {recipe.instructions.length}
                </span>
                <h2 className="text-2xl font-display font-extrabold text-text leading-tight">{recipe.name}</h2>
            </div>

            <div className="bg-white border border-surfaceHighlight rounded-[2rem] p-8 shadow-xl shadow-black/5 mb-6 min-h-[240px] flex flex-col items-center justify-center relative overflow-hidden transition-all">
                <div className="absolute top-0 left-0 w-full h-1 bg-surfaceHighlight">
                    <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${((step + 1) / recipe.instructions.length) * 100}%` }}
                    ></div>
                </div>
                <p className="text-xl text-center font-medium leading-relaxed text-text">
                    {recipe.instructions[step]}
                </p>

                {/* Smart Timer - Only shows if time detected */}
                <SmartCookingTimer text={recipe.instructions[step]} />
            </div>

            {/* Next Steps Preview */}
            {step < recipe.instructions.length - 1 && (
                <div className="opacity-60 pointer-events-none transition-opacity">
                    <p className="text-xs uppercase tracking-widest text-subtext mb-2 text-center">A seguir</p>
                    <div className="bg-white border border-surfaceHighlight p-4 rounded-xl text-sm text-subtext text-center line-clamp-2">
                        {recipe.instructions[step + 1]}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-surfaceHighlight p-6 pb-safe">
        <div className="max-w-lg mx-auto flex gap-4">
          <button 
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-6 py-4 rounded-2xl bg-surfaceHighlight text-subtext font-bold disabled:opacity-30 hover:bg-gray-200 transition"
          >
            Anterior
          </button>
          <button 
            onClick={() => {
              if (step < recipe.instructions.length - 1) {
                setStep(step + 1);
              } else {
                onClose();
              }
            }}
            className="flex-1 bg-primary text-black py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-[#a6f000]"
          >
            {step === recipe.instructions.length - 1 ? 'Finalizar' : 'Próximo Passo'}
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const RecipeDetailModal = ({ recipe, onClose, onSave, isSaved }: { recipe: Recipe; onClose: () => void; onSave: (r: Recipe) => void; isSaved: boolean }) => {
  const [cooking, setCooking] = useState(false);

  if (cooking) return <CookingMode recipe={recipe} onClose={() => setCooking(false)} />;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto animate-fade-in text-text">
      <div className="relative">
        <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-80 object-cover" />
        {/* Dark gradient only on top of image for button contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent h-32 top-auto bottom-0"></div>
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pt-safe mt-2">
          <button onClick={onClose} className="bg-white/90 backdrop-blur-md p-2.5 rounded-full text-black shadow-lg shadow-black/5 hover:bg-white transition hover:scale-105 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={() => onSave(recipe)} 
            className={`p-2.5 rounded-full backdrop-blur-md transition shadow-lg shadow-black/5 hover:scale-105 active:scale-95 ${isSaved ? 'bg-primary text-black' : 'bg-white/90 text-black hover:bg-white'}`}
          >
             <BookHeartIcon className={`transition-transform w-6 h-6 ${isSaved ? "fill-current animate-heart-pop" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-6 relative -mt-10 pb-32">
        {/* Header Card */}
        <div className="bg-white border border-surfaceHighlight rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-text text-[10px] font-bold rounded-full uppercase tracking-wider border border-gray-200">
                {recipe.category}
            </span>
            {recipe.tags.slice(0,3).map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-green-900 text-[10px] font-bold rounded-full uppercase tracking-wider border border-primary/20">
                {tag}
                </span>
            ))}
            </div>
            
            <h1 className="text-3xl font-display font-extrabold text-text leading-tight mb-2 tracking-tight">{recipe.name}</h1>
            {recipe.originalName && <p className="text-subtext text-sm mb-4">Versão fit de: <span className="text-text font-medium">{recipe.originalName}</span></p>}
            <p className="text-subtext text-sm leading-relaxed">{recipe.description}</p>
        </div>

        {/* Impact Row (Macros) */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-white border border-surfaceHighlight p-3 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] text-subtext font-bold uppercase tracking-wider mb-1">Kcal</span>
            <span className="block text-lg font-display font-extrabold text-orange-500">{recipe.macros.calories}</span>
          </div>
          <div className="bg-white border border-surfaceHighlight p-3 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] text-subtext font-bold uppercase tracking-wider mb-1">Prot</span>
            <span className="block text-lg font-display font-extrabold text-blue-600">{recipe.macros.protein}g</span>
          </div>
          <div className="bg-white border border-surfaceHighlight p-3 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] text-subtext font-bold uppercase tracking-wider mb-1">Carb</span>
            <span className="block text-lg font-display font-extrabold text-yellow-600">{recipe.macros.carbs}g</span>
          </div>
          <div className="bg-white border border-surfaceHighlight p-3 rounded-2xl text-center shadow-sm">
            <span className="block text-[10px] text-subtext font-bold uppercase tracking-wider mb-1">Gord</span>
            <span className="block text-lg font-display font-extrabold text-purple-600">{recipe.macros.fats}g</span>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold text-text mb-4 flex items-center gap-2">
            <LeafIcon className="w-5 h-5 text-primary" /> Ingredientes
          </h2>
          {/* Revised Ingredients List - Card Style with Emoji Left */}
          <div className="space-y-3">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-surfaceHighlight rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition hover:scale-[1.01] hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-4">
                  {/* Emoji Container - iOS style light circle */}
                  <div className="w-12 h-12 bg-[#F2F2F7] rounded-full flex items-center justify-center text-2xl shrink-0">
                    {typeof ing === 'object' ? ing.icon : '🥘'}
                  </div>
                  <span className="font-display font-bold text-text text-base leading-tight">
                    {typeof ing === 'object' ? ing.name : ing}
                  </span>
                </div>
                <span className="font-medium text-subtext text-sm whitespace-nowrap ml-4">
                  {typeof ing === 'object' ? ing.quantity : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Instructions List (Preparation Method) - Added here */}
        <div className="mb-8">
            <h2 className="text-xl font-display font-bold text-text mb-4 flex items-center gap-2">
                <ChefHatIcon className="w-5 h-5 text-primary" /> Modo de Preparo
            </h2>
            <div className="bg-white border border-surfaceHighlight rounded-[2rem] p-6 shadow-sm">
                <ol className="space-y-6">
                    {recipe.instructions.map((step, idx) => (
                        <li key={idx} className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-md">
                                {idx + 1}
                            </span>
                            <p className="text-text leading-relaxed text-sm pt-1">{step}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
        
        {/* FitSwap Engine Visualizer */}
        {recipe.substitutions && recipe.substitutions.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-xl font-display font-bold text-text mb-4 flex items-center gap-2">
              <ExchangeIcon className="w-5 h-5 text-primary" /> Motor FitSwap
            </h2>
            <div className="flex flex-col gap-3">
              {recipe.substitutions.map((swap, idx) => (
                <div key={idx} className="bg-white border border-surfaceHighlight rounded-2xl p-4 flex items-stretch gap-3 shadow-sm">
                  <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 border border-gray-100 rounded-xl p-2">
                     <span className="text-[10px] uppercase text-subtext font-bold mb-1">Original</span>
                     <span className="text-sm text-subtext text-center leading-tight">{swap.original}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-primary">
                     <ArrowRightIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center bg-primary/5 border border-primary/20 rounded-xl p-2">
                     <span className="text-[10px] uppercase text-green-800 font-bold mb-1">Fit</span>
                     <span className="text-sm text-text font-bold text-center leading-tight">{swap.replacement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Tip */}
        <div className="bg-gradient-to-br from-[#FAFAFA] to-white border border-primary/20 p-5 rounded-2xl mb-8 shadow-sm">
          <h3 className="font-bold text-green-700 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
            <SparklesIcon className="w-4 h-4 text-primary" /> NutriVerse Insight
          </h3>
          <p className="text-sm text-text leading-relaxed">{recipe.healthTips}</p>
        </div>
      </div>

      {/* Sticky CTA - Prominent Save & Cook Buttons */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-surfaceHighlight p-4 pb-safe z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-lg mx-auto flex gap-3">
            <button 
                onClick={() => onSave(recipe)}
                className={`flex-1 font-bold text-lg py-4 rounded-2xl transition flex items-center justify-center gap-2 border active:scale-[0.98] ${
                    isSaved 
                    ? 'bg-primary/10 border-primary text-green-800' 
                    : 'bg-white border-surfaceHighlight text-text hover:bg-gray-50'
                }`}
            >
                <BookHeartIcon className={`w-6 h-6 ${isSaved ? "fill-current animate-heart-pop" : "text-subtext"}`} />
                {isSaved ? 'Salvo' : 'Salvar'}
            </button>
            
            <button 
                onClick={() => setCooking(true)}
                className="flex-[2] bg-primary text-black font-bold text-lg py-4 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition flex items-center justify-center gap-3 hover:bg-[#a6f000]"
            >
                <PlayIcon className="w-6 h-6 fill-current" />
                Cozinhar
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Onboarding Flow (7 Screens) ---

const Onboarding = ({ onComplete }: { onComplete: (profile: UserProfile) => void }) => {
  const [step, setStep] = useState(0);
  
  // State for all onboarding data
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [mealSlots, setMealSlots] = useState<string[]>(['morning', 'lunch', 'dinner']);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState('');
  const [usageModes, setUsageModes] = useState<AppUsageMode[]>([]);

  const toggleRestriction = (r: string) => {
    if (restrictions.includes(r)) setRestrictions(restrictions.filter(i => i !== r));
    else setRestrictions([...restrictions, r]);
  };

  const toggleUsageMode = (mode: AppUsageMode) => {
    if (usageModes.includes(mode)) setUsageModes(usageModes.filter(m => m !== mode));
    else setUsageModes([...usageModes, mode]);
  };

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
    else {
      onComplete({
        name: "Usuário", 
        goal: goal!,
        activityLevel: activityLevel!,
        mealsPerDay,
        mealSlots,
        dietaryRestrictions: restrictions,
        dislikes,
        usageModes,
        profilePicture: undefined
      });
    }
  };

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      // 0. Splash
      case 0:
        return (
          <div className="flex flex-col items-center text-center justify-center h-full animate-fade-in">
             <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 rotate-3">
                <ChefHatIcon className="text-black w-12 h-12" />
             </div>
             <h1 className="text-4xl font-display font-extrabold text-text mb-4 tracking-tight">NutriVerse</h1>
             <p className="text-lg text-subtext max-w-xs leading-relaxed">
               O universo da sua alimentação saudável, do jeito que cabe na sua rotina.
             </p>
          </div>
        );

      // 1. Emotion (Dor)
      case 1:
        return (
          <div className="animate-fade-in pt-8">
            <h2 className="text-3xl font-display font-extrabold text-text mb-4 leading-tight">Você anda se alimentando no modo aleatório?</h2>
            <p className="text-subtext text-lg mb-8 leading-relaxed">
              Pula refeição, belisca qualquer coisa, e quando vê… já era o dia. 
              O NutriVerse organiza sua alimentação pra você comer bem sem viver de dieta maluca.
            </p>
            <div className="bg-white border border-surfaceHighlight rounded-[2rem] p-8 flex items-center justify-between shadow-sm mb-8">
               <div className="flex flex-col items-center gap-2">
                 <FaceFrownIcon className="w-12 h-12 text-gray-300" />
                 <span className="text-xs font-bold text-subtext uppercase">Antes</span>
               </div>
               <ArrowRightIcon className="w-6 h-6 text-primary" />
               <div className="flex flex-col items-center gap-2">
                 <FaceSmileIcon className="w-12 h-12 text-primary" />
                 <span className="text-xs font-bold text-primary uppercase">Depois</span>
               </div>
            </div>
          </div>
        );

      // 2. Goal
      case 2:
        return (
          <div className="animate-fade-in space-y-3 pt-4">
             <h2 className="text-3xl font-display font-extrabold text-text mb-6">Qual é seu objetivo principal agora?</h2>
             {[
               { id: UserGoal.LOSE_WEIGHT, label: 'Perder gordura / secar', icon: '🔥' },
               { id: UserGoal.GAIN_MUSCLE, label: 'Ganhar massa / hipertrofia', icon: '💪' },
               { id: UserGoal.EAT_HEALTHY, label: 'Comer melhor sem neura', icon: '🥗' },
               { id: UserGoal.MAINTAIN, label: 'Manter resultado com organização', icon: '⚖️' }
             ].map((item) => (
               <button
                key={item.id}
                onClick={() => setGoal(item.id)}
                className={`w-full p-6 rounded-3xl text-left transition border shadow-sm flex items-center gap-4 active:scale-[0.98] ${goal === item.id ? 'bg-primary border-primary text-black ring-4 ring-primary/20' : 'bg-white border-surfaceHighlight text-text hover:bg-gray-50'}`}
               >
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-bold font-display text-lg">{item.label}</span>
               </button>
             ))}
          </div>
        );

      // 3. Routine
      case 3:
        return (
          <div className="animate-fade-in pt-4">
            <h2 className="text-3xl font-display font-extrabold text-text mb-8">Como é seu dia a dia na prática?</h2>
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-subtext mb-3 uppercase tracking-wider">Nível de Atividade</label>
              <div className="space-y-2">
                {[
                  { id: ActivityLevel.LOW, label: 'Fico mais sentado(a)' },
                  { id: ActivityLevel.MEDIUM, label: 'Me mexo durante o dia' },
                  { id: ActivityLevel.HIGH, label: 'Treino quase todos os dias' },
                ].map(lvl => (
                  <button
                    key={lvl.id}
                    onClick={() => setActivityLevel(lvl.id)}
                    className={`w-full p-4 rounded-2xl text-left text-sm font-bold border transition ${activityLevel === lvl.id ? 'bg-black text-white border-black' : 'bg-white border-surfaceHighlight text-subtext'}`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-subtext mb-3 uppercase tracking-wider">Quantas refeições quer fazer?</label>
               <div className="flex justify-between gap-2 bg-gray-100 p-1.5 rounded-2xl">
                 {[3, 4, 5, 6].map(num => (
                   <button
                    key={num}
                    onClick={() => setMealsPerDay(num)}
                    className={`flex-1 py-3 rounded-xl font-bold transition shadow-sm ${mealsPerDay === num ? 'bg-white text-black shadow' : 'text-subtext hover:text-text'}`}
                   >
                     {num}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        );

      // 4. Restrictions
      case 4:
        return (
          <div className="animate-fade-in pt-4">
            <h2 className="text-3xl font-display font-extrabold text-text mb-2">Tem alguma restrição ou estilo alimentar?</h2>
            <p className="text-subtext mb-6">Não vamos sugerir nada que você não possa comer.</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
                {RESTRICTION_OPTIONS.map(opt => (
                    <button
                        key={opt}
                        onClick={() => toggleRestriction(opt)}
                        className={`px-4 py-3 rounded-2xl text-sm font-bold transition border shadow-sm active:scale-95 ${
                            restrictions.includes(opt) 
                            ? 'bg-primary/20 border-primary text-green-900 ring-2 ring-primary/10' 
                            : 'bg-white border-surfaceHighlight text-subtext hover:text-text hover:bg-gray-50'
                        }`}
                    >
                        {opt} {restrictions.includes(opt) && '✓'}
                    </button>
                ))}
                <button 
                  onClick={() => setRestrictions([])}
                  className={`px-4 py-3 rounded-2xl text-sm font-bold border transition ${restrictions.length === 0 ? 'bg-black text-white border-black' : 'bg-white border-surfaceHighlight text-subtext'}`}
                >
                  Nenhuma
                </button>
            </div>

            <label className="block text-xs font-bold text-subtext mb-3 uppercase tracking-wider">Tem algo que você NÃO suporta?</label>
            <input 
              type="text" 
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              placeholder="Ex: não gosto de pepino e ovo..."
              className="w-full p-5 bg-white border border-surfaceHighlight rounded-2xl text-lg text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition placeholder:text-gray-300 shadow-sm font-medium"
            />
          </div>
        );

      // 5. Usage Modes
      case 5:
        return (
          <div className="animate-fade-in pt-4">
             <h2 className="text-3xl font-display font-extrabold text-text mb-6">Onde o NutriVerse mais te ajudaria hoje?</h2>
             <div className="space-y-3">
               {[
                 { id: AppUsageMode.PANTRY, label: 'Modo Despensa', desc: 'Receitas com o que já tenho em casa.' },
                 { id: AppUsageMode.FIT_SWAP, label: 'Fitzar Receitas', desc: 'Transformar receitas que amo em versão saudável.' },
                 { id: AppUsageMode.PLANNING, label: 'Planejar a semana', desc: 'Plano simples de refeições.' },
                 { id: AppUsageMode.MENUS, label: 'Cardápios prontos', desc: 'Focados em perda de peso ou massa.' },
                 { id: AppUsageMode.SNACKS, label: 'Momentos de ansiedade', desc: 'Ideias de lanches leves.' },
               ].map(mode => (
                 <button 
                   key={mode.id}
                   onClick={() => toggleUsageMode(mode.id)}
                   className={`w-full p-4 rounded-2xl text-left border transition flex items-start gap-4 ${usageModes.includes(mode.id) ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white border-surfaceHighlight hover:bg-gray-50'}`}
                 >
                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${usageModes.includes(mode.id) ? 'bg-primary border-primary text-black' : 'border-gray-300 bg-white'}`}>
                     {usageModes.includes(mode.id) && <CheckIcon className="w-4 h-4" />}
                   </div>
                   <div>
                     <span className="block font-bold text-text">{mode.label}</span>
                     <span className="text-xs text-subtext">{mode.desc}</span>
                   </div>
                 </button>
               ))}
             </div>
          </div>
        );

      // 6. Summary
      case 6:
        return (
          <div className="animate-fade-in pt-4 pb-20">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-heart-pop">
               <CheckIcon className="w-8 h-8 text-green-700" />
             </div>
             <h2 className="text-3xl font-display font-extrabold text-text mb-2 leading-tight">Montamos seu universo de alimentação</h2>
             <p className="text-subtext mb-8">Seu plano personalizado está pronto.</p>
             
             <div className="space-y-4 mb-8">
               <div className="bg-white border border-surfaceHighlight p-5 rounded-2xl shadow-sm">
                 <h3 className="text-xs font-bold text-subtext uppercase tracking-wider mb-2">Objetivo</h3>
                 <p className="font-bold text-text text-lg">
                   Foco em <span className="text-primary bg-black px-1.5 rounded">{goal === UserGoal.LOSE_WEIGHT ? 'perder gordura' : goal === UserGoal.GAIN_MUSCLE ? 'ganhar massa' : 'saúde'}</span> com {mealsPerDay} refeições/dia.
                 </p>
               </div>
               
               <div className="bg-white border border-surfaceHighlight p-5 rounded-2xl shadow-sm">
                 <h3 className="text-xs font-bold text-subtext uppercase tracking-wider mb-2">Estilo</h3>
                 <p className="font-medium text-text">
                   {restrictions.length > 0 ? `Sem ${restrictions.join(', ')}` : 'Sem restrições'} 
                   {dislikes && ` e sem ${dislikes}`}.
                 </p>
               </div>

               <div className="bg-white border border-surfaceHighlight p-5 rounded-2xl shadow-sm">
                 <h3 className="text-xs font-bold text-subtext uppercase tracking-wider mb-2">Seu Kit NutriVerse</h3>
                 <ul className="space-y-2">
                   {usageModes.includes(AppUsageMode.PANTRY) && <li className="flex items-center gap-2 text-sm"><CheckIcon className="w-4 h-4 text-primary" /> Modo Despensa anti-desperdício</li>}
                   {usageModes.includes(AppUsageMode.FIT_SWAP) && <li className="flex items-center gap-2 text-sm"><CheckIcon className="w-4 h-4 text-primary" /> Motor de trocas inteligentes</li>}
                   <li className="flex items-center gap-2 text-sm"><CheckIcon className="w-4 h-4 text-primary" /> Organização de rotina</li>
                 </ul>
               </div>
             </div>
             
             <p className="text-center text-sm font-medium text-text bg-gray-100 p-4 rounded-xl">
               "Em 10 minutos por semana você organiza suas refeições e deixa de comer 'no improviso'."
             </p>
          </div>
        );
    }
  };

  const getButtonLabel = () => {
    switch(step) {
      case 0: return 'Começar';
      case 1: return 'Quero organizar minha alimentação';
      case 3: return 'Montar plano em cima disso';
      case 6: return 'Ver meu plano e receitas';
      default: return 'Continuar';
    }
  };

  const isNextDisabled = () => {
    if (step === 2 && !goal) return true;
    if (step === 3 && !activityLevel) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Progress Bar (except splash) */}
      {step > 0 && (
        <div className="w-full h-1 bg-gray-200 rounded-full mb-6 mt-safe">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }}></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {renderContent()}
      </div>

      {/* Footer Button */}
      <div className="pt-6 pb-safe">
        <button 
          onClick={handleNext}
          disabled={isNextDisabled()}
          className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-xl disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-gray-900"
        >
          {getButtonLabel()} <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const RecipeCard: React.FC<{ recipe: Recipe; onClick: () => void }> = ({ recipe, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-surfaceHighlight overflow-hidden mb-6 active:scale-[0.98] transition-all duration-300 group cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
  >
    <div className="relative h-52 w-full overflow-hidden">
      <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute top-4 left-4 z-10">
         <span className="bg-white/95 backdrop-blur-md text-text text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            {recipe.category}
         </span>
      </div>
      
      {/* Badges positioned over image */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10">
            {recipe.prepTime}
        </span>
        <span className="bg-primary text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-primary/20">
            {recipe.macros.calories} kcal
        </span>
      </div>
    </div>
    
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-display font-bold text-text leading-snug text-xl line-clamp-1 group-hover:text-primary transition-colors">{recipe.name}</h3>
      </div>
      <p className="text-sm text-subtext mb-5 line-clamp-2">{recipe.description}</p>
      
      {/* Micro Macros */}
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
            <div className="text-[9px] text-subtext uppercase tracking-wide mb-0.5">Prot</div>
            <div className="text-sm font-bold text-blue-600">{recipe.macros.protein}g</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
            <div className="text-[9px] text-subtext uppercase tracking-wide mb-0.5">Carb</div>
            <div className="text-sm font-bold text-yellow-600">{recipe.macros.carbs}g</div>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-2 text-center">
            <div className="text-[9px] text-subtext uppercase tracking-wide mb-0.5">Gord</div>
            <div className="text-sm font-bold text-purple-600">{recipe.macros.fats}g</div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Replaced authUser with boolean
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  const [history, setHistory] = useState<Recipe[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set()); 
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  
  // Category State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Explore State
  const [exploreMode, setExploreMode] = useState<'TEXT' | 'PANTRY'>('TEXT');
  const [dishInput, setDishInput] = useState('');
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
  const [manualIngredient, setManualIngredient] = useState(''); // New state for manual entry
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOnboardingComplete = (profile: UserProfile) => {
      const fullProfile = { ...profile, name: userProfile?.name || "Usuário" };
      setUserProfile(fullProfile);
  };

  const handlePantryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingMsg("Analisando despensa...");
    
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const detected = await identifyIngredientsFromImage(base64String);
        setPantryIngredients(detected);
        setLoading(false);
    };
    reader.readAsDataURL(file);
  };
  
  const addManualIngredient = () => {
    if (manualIngredient.trim()) {
      setPantryIngredients([...pantryIngredients, manualIngredient.trim()]);
      setManualIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...pantryIngredients];
    newIngredients.splice(index, 1);
    setPantryIngredients(newIngredients);
  };

  const handleGenerate = async () => {
    if (!userProfile) return;
    
    const input = exploreMode === 'TEXT' ? dishInput : pantryIngredients;
    
    if (exploreMode === 'TEXT' && !dishInput.trim()) return;
    if (exploreMode === 'PANTRY' && pantryIngredients.length === 0) return;

    setLoading(true);
    setLoadingMsg(exploreMode === 'TEXT' ? "Fitzando receita..." : "Criando com o que você tem...");

    try {
      const result = await generateFitnessRecipe(input, userProfile.goal, userProfile.dietaryRestrictions);
      if (result) {
        // Save to local history
        setHistory(prev => [result, ...prev]);
        setSelectedRecipe(result); 
        setDishInput('');
      } else {
        alert("Ocorreu um erro. Tente novamente.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (recipe: Recipe) => {
    const newSet = new Set(saved);
    const isSaving = !newSet.has(recipe.id);

    if (isSaving) {
      newSet.add(recipe.id);
    } else {
      newSet.delete(recipe.id);
    }
    setSaved(newSet);
  };

  const quickAction = (mode: 'TEXT' | 'PANTRY') => {
      setExploreMode(mode);
      setActiveTab('EXPLORE');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setHistory([]);
    setSaved(new Set());
  };

  // Mock Login Success
  const handleAuthSuccess = (name: string) => {
      setIsLoggedIn(true);
      // If we had a profile locally, we could load it, but for mock let's trigger onboarding
      // unless we hardcode a profile. Let's trigger onboarding for demo purposes
      // or check if we want to bypass it.
      // setUserProfile({ name, goal: UserGoal.EAT_HEALTHY, ... }); // Uncomment to skip onboarding
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
      setUserProfile(updatedProfile);
  };

  // Filter history based on category
  const filteredHistory = selectedCategory 
    ? history.filter(r => r.category === selectedCategory)
    : history;
  
  // Logic for LIBRARY TAB - Show ONLY saved recipes
  const libraryRecipes = history.filter(r => saved.has(r.id));

  // --- Render Views ---

  if (!isLoggedIn) {
    return authView === 'LOGIN' 
      ? <LoginScreen onNavigateToSignUp={() => setAuthView('SIGNUP')} onLoginSuccess={handleAuthSuccess} /> 
      : <SignUpScreen onNavigateToLogin={() => setAuthView('LOGIN')} onSignUpSuccess={handleAuthSuccess} />;
  }

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="bg-background min-h-screen pb-28 font-sans text-text">
      
      {/* Top Header (Mobile) */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-surfaceHighlight flex justify-between items-center transition-all">
        <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <ChefHatIcon className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-display font-extrabold tracking-tight text-text">NutriVerse</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-white border border-surfaceHighlight flex items-center justify-center shadow-sm hover:shadow-md transition" onClick={() => setActiveTab('PROFILE')}>
          {userProfile.profilePicture ? (
             <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
          ) : (
             <UserIcon className="w-5 h-5 text-text" />
          )}
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        
        {activeTab === 'HOME' && (
          <>
            {/* Welcome Banner */}
            <div className="mb-8">
                <h2 className="text-3xl font-display font-extrabold tracking-tight text-text mb-1">Olá, {userProfile.name?.split(' ')[0] || 'Atleta'}</h2>
                <p className="text-subtext">Seu foco hoje: <span className="text-green-800 font-bold bg-primary/20 px-2 py-0.5 rounded-md text-sm">{userProfile.goal === 'LOSE_WEIGHT' ? 'Queimar' : userProfile.goal === 'GAIN_MUSCLE' ? 'Construir' : 'Viver'}</span></p>
            </div>

            {/* Daily Tip Card */}
            <DailyTipCard />

            {/* Quick Actions Grid - New Requirement */}
            <h3 className="text-xs font-bold text-subtext mb-4 uppercase tracking-wider">Acesso Rápido</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                   onClick={() => quickAction('TEXT')}
                   className="bg-white p-5 rounded-[2rem] border border-surfaceHighlight shadow-sm text-left hover:shadow-md transition group active:scale-[0.98]"
                >
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition">
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                    <span className="block font-display font-bold text-lg leading-tight mb-1">Fitzar Receita</span>
                    <span className="text-xs text-subtext">Transformar prato</span>
                </button>

                <button 
                   onClick={() => quickAction('PANTRY')}
                   className="bg-primary p-5 rounded-[2rem] border border-primary shadow-lg shadow-primary/20 text-left transition group active:scale-[0.98]"
                >
                    <div className="w-12 h-12 bg-black/10 text-black rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white/20 transition">
                        <CameraIcon className="w-6 h-6" />
                    </div>
                    <span className="block font-display font-bold text-lg leading-tight mb-1 text-black">Modo Despensa</span>
                    <span className="text-xs text-black/70">Usar o que tenho</span>
                </button>
            </div>

             {/* Category Catalog */}
             <div className="mb-8">
                <h3 className="text-xs font-bold text-subtext mb-3 uppercase tracking-wider">Categorias</h3>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                    {RECIPE_CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button 
                                key={cat.id}
                                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                                className={`w-24 h-24 shrink-0 rounded-3xl flex flex-col items-center justify-center transition border active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${
                                    isSelected 
                                    ? 'bg-black border-black text-primary shadow-lg' 
                                    : 'bg-white border-surfaceHighlight text-subtext hover:bg-gray-50 hover:text-text'
                                }`}
                            >
                                <span className="text-2xl mb-2">{cat.icon}</span>
                                <span className="text-[10px] font-bold text-center leading-tight px-1">{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
             </div>

            <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-display font-bold text-text">
                    {selectedCategory ? `Receitas de ${RECIPE_CATEGORIES.find(c => c.id === selectedCategory)?.label}` : 'Destaques para você'}
                </h2>
                {!selectedCategory && <button className="text-xs text-green-700 font-bold bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition" onClick={() => setActiveTab('LIBRARY')}>Ver tudo</button>}
            </div>
            
            {filteredHistory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-surfaceHighlight rounded-[2rem] bg-gray-50">
                    <p className="text-subtext text-sm mb-3">
                        {selectedCategory 
                         ? `Nenhuma receita de ${selectedCategory.toLowerCase()} encontrada.` 
                         : "Nenhuma receita criada ainda."}
                    </p>
                    <button onClick={() => quickAction('TEXT')} className="text-black font-bold text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50">Criar agora</button>
                </div>
            ) : (
                filteredHistory.slice(0, selectedCategory ? undefined : 3).map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                ))
            )}
          </>
        )}

        {activeTab === 'EXPLORE' && (
          <div className="mt-2">
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl mb-8 border border-gray-200">
                <button 
                    onClick={() => setExploreMode('TEXT')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition shadow-sm ${exploreMode === 'TEXT' ? 'bg-white text-text shadow-md' : 'text-subtext hover:text-text shadow-none'}`}
                >
                    Desejo Específico
                </button>
                <button 
                    onClick={() => setExploreMode('PANTRY')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition shadow-sm ${exploreMode === 'PANTRY' ? 'bg-white text-text shadow-md' : 'text-subtext hover:text-text shadow-none'}`}
                >
                    Modo Despensa
                </button>
            </div>
            
            {exploreMode === 'TEXT' ? (
                <div className="animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <SparklesIcon className="w-8 h-8 text-green-700" />
                        </div>
                        <h2 className="text-3xl font-display font-extrabold tracking-tight text-text mb-2">O que quer comer hoje?</h2>
                        <p className="text-subtext text-sm">Digite qualquer prato e faremos a versão fit.</p>
                    </div>
                    
                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={dishInput}
                            onChange={(e) => setDishInput(e.target.value)}
                            placeholder="Ex: Pizza, Lasanha, Brigadeiro..."
                            className="w-full p-6 bg-white border border-surfaceHighlight rounded-[2rem] focus:border-primary text-text text-lg outline-none transition placeholder:text-gray-300 shadow-sm focus:shadow-md"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={!dishInput.trim() || loading}
                            className="absolute right-2 top-2 bottom-2 bg-black text-white w-14 rounded-[1.5rem] flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition"
                        >
                            <ArrowRightIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-display font-bold text-text mb-6">Escaneie sua cozinha</h2>
                    
                    {/* Input Method Toggle or Dual View */}
                    <div className="mb-6 grid grid-cols-2 gap-4">
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 bg-white rounded-[2rem] h-40 flex flex-col items-center justify-center cursor-pointer transition group"
                        >
                            <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mb-3 shadow-lg shadow-primary/20 group-hover:scale-110 transition">
                                <CameraIcon className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-text">Tirar foto</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePantryImageUpload}
                            />
                        </div>
                         <div className="bg-white border border-surfaceHighlight rounded-[2rem] h-40 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                             <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    value={manualIngredient}
                                    onChange={(e) => setManualIngredient(e.target.value)}
                                    placeholder="Add item..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-text focus:border-primary outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && addManualIngredient()}
                                 />
                                 <button onClick={addManualIngredient} className="bg-black text-white rounded-xl w-10 shrink-0 flex items-center justify-center hover:bg-gray-800">
                                     <PlusIcon className="w-4 h-4" />
                                 </button>
                             </div>
                             <p className="text-[10px] text-subtext text-center mt-2 leading-tight">Adicione ingredientes manualmente caso a foto não pegue tudo.</p>
                         </div>
                    </div>

                    {pantryIngredients.length > 0 && (
                        <div className="bg-white p-6 rounded-[2rem] border border-surfaceHighlight animate-fade-in shadow-lg shadow-black/5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-text flex items-center gap-2"><CheckIcon className="w-4 h-4 text-primary" /> {pantryIngredients.length} itens</h3>
                                <button onClick={() => setPantryIngredients([])} className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100">Limpar</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {pantryIngredients.map((ing, i) => (
                                    <span key={i} className="bg-gray-50 pl-3 pr-2 py-1.5 rounded-xl text-sm border border-gray-200 flex items-center gap-2 text-text font-medium">
                                        {ing}
                                        <button onClick={() => removeIngredient(i)} className="text-gray-400 hover:text-red-500 transition"><CloseIcon className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-[#a6f000]"
                            >
                                <ChefHatIcon className="w-5 h-5" /> Criar Receita Única
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        )}

        {activeTab === 'LIBRARY' && (
          <>
            <h2 className="text-3xl font-display font-bold tracking-tight text-text mb-6">Sua Coleção</h2>
            
            {/* Filter Tabs (Simplified) */}
            <div className="flex gap-2 mb-6 p-1 bg-white rounded-xl border border-surfaceHighlight w-fit shadow-sm">
                <button className="text-xs font-bold bg-gray-100 text-black px-4 py-2 rounded-lg shadow-sm">Salvas</button>
            </div>

            <div className="space-y-4">
                {libraryRecipes.length > 0 ? libraryRecipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                )) : (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-surfaceHighlight border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookHeartIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-subtext text-sm">Você ainda não salvou nenhuma receita.</p>
                        <button onClick={() => { setActiveTab('HOME'); setSelectedCategory(null); }} className="mt-4 text-primary font-bold text-sm">Explorar receitas</button>
                    </div>
                )}
            </div>
          </>
        )}

        {activeTab === 'PROFILE' && userProfile && (
          <div className="pt-4">
            <div className="relative bg-white border border-surfaceHighlight rounded-[2.5rem] p-8 text-center mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <button 
                 onClick={() => setShowEditProfile(true)}
                 className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-text hover:bg-gray-200 transition"
              >
                <PencilIcon className="w-5 h-5" />
              </button>

              <div className="w-28 h-28 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-4 border-[6px] border-white shadow-lg shadow-black/5 overflow-hidden">
                {userProfile.profilePicture ? (
                     <img src={userProfile.profilePicture} alt={userProfile.name} className="w-full h-full object-cover" />
                ) : (
                     <UserIcon className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <h2 className="text-3xl font-display font-extrabold text-text mb-1 tracking-tight">{userProfile.name}</h2>
              <p className="text-subtext text-sm mb-4">Membro NutriVerse</p>
              <div className="flex justify-center gap-2">
                <span className="px-4 py-1.5 bg-primary text-black rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20">
                    {userProfile.goal === UserGoal.LOSE_WEIGHT ? 'Queimar Gordura' : userProfile.goal === UserGoal.GAIN_MUSCLE ? 'Ganhar Massa' : 'Saudável'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
                <div className="bg-white p-5 rounded-[2rem] border border-surfaceHighlight flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-xs">
                           {userProfile.dietaryRestrictions.length}
                        </div>
                        <span className="text-sm font-bold text-text">Restrições Alimentares</span>
                    </div>
                    <span className="text-xs text-subtext">Gerenciar</span>
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                    {userProfile.dietaryRestrictions.map(r => (
                        <span key={r} className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-subtext shadow-sm">{r}</span>
                    ))}
                </div>
            </div>
            
            <button 
                onClick={handleLogout}
                className="w-full mt-12 py-5 text-red-500 font-bold text-sm bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition shadow-sm"
            >
                Sair da conta
            </button>
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-surfaceHighlight pb-safe pt-2 px-6 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center max-w-lg mx-auto h-20">
          <button 
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center gap-1.5 w-16 transition-all ${activeTab === 'HOME' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}
          >
            <HomeIcon className={`w-7 h-7 ${activeTab === 'HOME' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('EXPLORE')}
            className={`flex flex-col items-center gap-1.5 w-16 transition-all ${activeTab === 'EXPLORE' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}
          >
            <SearchIcon className="w-7 h-7" />
            <span className="text-[10px] font-bold">Explorar</span>
          </button>

          {/* FAB for quick add */}
          <div className="relative -top-6">
             <button 
                onClick={() => { setActiveTab('EXPLORE'); setExploreMode('PANTRY'); }}
                className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-2xl shadow-black/30 text-primary active:scale-90 transition border-[6px] border-background"
             >
                 <CameraIcon className="w-7 h-7" />
             </button>
          </div>

          <button 
            onClick={() => setActiveTab('LIBRARY')}
            className={`flex flex-col items-center gap-1.5 w-16 transition-all ${activeTab === 'LIBRARY' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}
          >
            <BookHeartIcon className={`w-7 h-7 ${activeTab === 'LIBRARY' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">Favoritos</span>
          </button>
          
           <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center gap-1.5 w-16 transition-all ${activeTab === 'PROFILE' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}
          >
             {userProfile && userProfile.profilePicture ? (
                 <img src={userProfile.profilePicture} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
             ) : (
                <UserIcon className={`w-7 h-7 ${activeTab === 'PROFILE' ? 'fill-current' : ''}`} />
             )}
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Overlays */}
      {loading && <LoadingOverlay message={loadingMsg} />}
      
      {showEditProfile && userProfile && (
          <EditProfileModal 
              userProfile={userProfile} 
              onClose={() => setShowEditProfile(false)} 
              onSave={handleUpdateProfile} 
          />
      )}

      {selectedRecipe && (
        <RecipeDetailModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          onSave={(r) => toggleSave(r)}
          isSaved={saved.has(selectedRecipe.id)}
        />
      )}
    </div>
  );
}
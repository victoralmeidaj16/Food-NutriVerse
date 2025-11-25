import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserGoal, Recipe, UserProfile, Tab, RESTRICTION_OPTIONS, RECIPE_CATEGORIES, ActivityLevel, AppUsageMode, WeeklyPlan, ShoppingList, ShoppingItem } from './types';
import { generateFitnessRecipe, identifyIngredientsFromImage, generateWeeklyPlan, generateShoppingList } from './services/geminiService';
import { MOCK_RECIPES } from './services/mockData';
// Firebase imports removed for Mock Mode
import { HomeIcon, SearchIcon, CameraIcon, BookHeartIcon, UserIcon, ChefHatIcon, FlameIcon, SparklesIcon, ArrowRightIcon, CheckIcon, PlayIcon, PauseIcon, CloseIcon, LeafIcon, TimerIcon, RefreshIcon, LightbulbIcon, PlusIcon, TrashIcon, ExchangeIcon, CalendarIcon, ActivityIcon, FaceFrownIcon, FaceSmileIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, PencilIcon, BellIcon, ShoppingBagIcon, WandIcon, CopyIcon } from './components/Icons';

// --- Components ---

const LoadingOverlay = ({ message = "Carregando..." }: { message?: string }) => {
  const [subMessageIndex, setSubMessageIndex] = useState(0);

  // Determine context-based sub-messages
  const subMessages = useMemo(() => {
    const msgLower = message.toLowerCase();
    
    if (msgLower.includes("semana") || msgLower.includes("plano")) {
      return [
        "Analisando suas preferências...",
        "Equilibrando os macronutrientes...",
        "Verificando variedade de sabores...",
        "Otimizando o tempo de preparo...",
        "Finalizando seu calendário..."
      ];
    }
    if (msgLower.includes("lista") || msgLower.includes("compras")) {
      return [
        "Agrupando ingredientes...",
        "Categorizando itens...",
        "Calculando quantidades exatas...",
        "Otimizando a lista..."
      ];
    }
    if (msgLower.includes("despensa") || msgLower.includes("analisando")) {
      return [
        "Identificando alimentos na imagem...",
        "Consultando banco de dados nutricional...",
        "Gerando combinações possíveis...",
        "Criando sugestões..."
      ];
    }
    if (msgLower.includes("trocando")) {
        return [
            "Buscando novas opções...",
            "Mantendo o equilíbrio calórico...",
            "Ajustando a receita..."
        ];
    }
    // Default (Recipe Generation)
    return [
      "Selecionando os melhores ingredientes...",
      "Calculando tabela nutricional...",
      "Aplicando trocas inteligentes (FitSwap)...",
      "Gerando imagem do prato...",
      "Finalizando detalhes..."
    ];
  }, [message]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubMessageIndex((prev) => (prev + 1) % subMessages.length);
    }, 1800); // Change text every 1.8 seconds
    return () => clearInterval(interval);
  }, [subMessages]);

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-[80] p-6 animate-fade-in">
      <div className="bg-surface border border-surfaceHighlight p-8 rounded-[2rem] flex flex-col items-center max-w-sm w-full text-center shadow-2xl shadow-black/5">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-surfaceHighlight rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-2xl text-primary">N</div>
        </div>
        <h3 className="text-xl font-display font-bold text-text mb-2 tracking-tight">{message}</h3>
        <p className="text-sm text-subtext h-5 animate-pulse transition-all duration-500">
            {subMessages[subMessageIndex]}
        </p>
      </div>
    </div>
  );
};

// --- Auth Screens (Mock) ---
// (Authentication screens retained but hidden for brevity as they are unchanged)
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
        <p className="text-center text-subtext">Para salvar seu plano, entre na sua conta</p>
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
        <p className="text-center text-subtext">Salve seu plano NutriVerse</p>
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
// (EditProfileModal, SmartCookingTimer, DailyTipCard kept same, focusing on new/changed components below)
const EditProfileModal = ({ userProfile, onClose, onSave }: { userProfile: UserProfile, onClose: () => void, onSave: (u: UserProfile) => void }) => {
    const [name, setName] = useState(userProfile.name);
    const [image, setImage] = useState(userProfile.profilePicture);
    const [goal, setGoal] = useState(userProfile.goal);
    const [isGoalExpanded, setIsGoalExpanded] = useState(false);
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
        onSave({ ...userProfile, name, profilePicture: image, goal });
        onClose();
    };
    
    const currentGoal = [
        { id: UserGoal.LOSE_WEIGHT, label: 'Perder gordura / secar', icon: '🔥' },
        { id: UserGoal.GAIN_MUSCLE, label: 'Ganhar massa / hipertrofia', icon: '💪' },
        { id: UserGoal.EAT_HEALTHY, label: 'Comer melhor sem neura', icon: '🥗' },
        { id: UserGoal.MAINTAIN, label: 'Manter resultado', icon: '⚖️' }
    ].find(g => g.id === goal);

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
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

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-subtext uppercase tracking-wider mb-2">Nome</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-surfaceHighlight rounded-2xl text-text font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-subtext uppercase tracking-wider mb-2">Objetivo</label>
                        
                        {!isGoalExpanded ? (
                             <button 
                                onClick={() => setIsGoalExpanded(true)}
                                className="w-full p-4 bg-gray-100 rounded-2xl flex items-center justify-center gap-3 shadow-inner hover:bg-gray-200 transition"
                             >
                                 <span className="text-xl">{currentGoal?.icon}</span>
                                 <span className="font-bold text-text">{currentGoal?.label}</span>
                                 <PencilIcon className="w-4 h-4 text-gray-400 absolute right-6" />
                             </button>
                        ) : (
                            <div className="space-y-2 animate-fade-in">
                                {[
                                { id: UserGoal.LOSE_WEIGHT, label: 'Perder gordura / secar', icon: '🔥' },
                                { id: UserGoal.GAIN_MUSCLE, label: 'Ganhar massa / hipertrofia', icon: '💪' },
                                { id: UserGoal.EAT_HEALTHY, label: 'Comer melhor sem neura', icon: '🥗' },
                                { id: UserGoal.MAINTAIN, label: 'Manter resultado', icon: '⚖️' }
                                ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setGoal(item.id); setIsGoalExpanded(false); }}
                                    className={`w-full p-3 rounded-xl text-left transition border flex items-center gap-3 ${goal === item.id ? 'bg-primary/10 border-primary text-black' : 'bg-gray-50 border-gray-200 text-subtext hover:bg-gray-100'}`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-bold text-sm">{item.label}</span>
                                </button>
                                ))}
                            </div>
                        )}
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

const SmartCookingTimer = ({ text }: { text: string }) => {
    // (Implementation same as previous)
    const minutes = React.useMemo(() => {
        const minMatch = text.match(/(\d+)\s*(?:minutos?|min|m)\b/i);
        if (minMatch) return parseInt(minMatch[1]);
        const hourMatch = text.match(/(\d+)\s*(?:horas?|h)\b/i);
        if (hourMatch) return parseInt(hourMatch[1]) * 60;
        return null;
    }, [text]);

    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
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

// --- Planning Components ---

const PlanningWizard = ({ onClose, onGenerate }: { onClose: () => void, onGenerate: (pref: string, mealsCount: number, allowRepeats: boolean) => void }) => {
    const [preferences, setPreferences] = useState<string[]>(["Equilibrado"]);
    const [mealsCount, setMealsCount] = useState(3); // Default 3
    const [allowRepeats, setAllowRepeats] = useState(false);
    
    const togglePreference = (opt: string) => {
        if (preferences.includes(opt)) {
            if (preferences.length > 1) {
                setPreferences(preferences.filter(p => p !== opt));
            }
        } else {
            setPreferences([...preferences, opt]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
             <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]">
                 <div className="text-center mb-6">
                     <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                         <WandIcon className="w-8 h-8" />
                     </div>
                     <h3 className="font-display font-extrabold text-2xl text-text">Planejar Semana</h3>
                     <p className="text-subtext text-sm">Personalize sua rotina</p>
                 </div>
                 
                 {/* Meals per day */}
                 <div className="mb-6">
                     <label className="text-xs font-bold text-subtext uppercase tracking-wider mb-3 block">Refeições por dia</label>
                     <div className="flex justify-between gap-2">
                         {[3, 4, 5, 6].map(count => (
                             <button
                                key={count}
                                onClick={() => setMealsCount(count)}
                                className={`flex-1 py-3 rounded-xl font-bold border transition ${mealsCount === count ? 'bg-black text-white border-black' : 'bg-white border-surfaceHighlight text-subtext'}`}
                             >
                                 {count}
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Focus */}
                 <div className="mb-6">
                    <label className="text-xs font-bold text-subtext uppercase tracking-wider mb-3 block">Foco da Semana</label>
                    <div className="space-y-2">
                        {["Mais Barato", "Mais Rápido", "Variedade", "Equilibrado", "Low Carb Rigoroso"].map(opt => {
                            const isSelected = preferences.includes(opt);
                            return (
                                <button 
                                    key={opt}
                                    onClick={() => togglePreference(opt)}
                                    className={`w-full p-3 rounded-xl text-left font-bold border transition text-sm ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-surfaceHighlight text-subtext'}`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                 </div>
                 
                 {/* Repetition Strategy */}
                 <div className="mb-8">
                     <label className="text-xs font-bold text-subtext uppercase tracking-wider mb-3 block">Estratégia</label>
                     <div className="flex gap-2">
                        <button 
                             onClick={() => setAllowRepeats(false)}
                             className={`flex-1 p-3 rounded-xl text-left border transition ${!allowRepeats ? 'bg-primary/20 border-primary text-black' : 'bg-white border-surfaceHighlight text-subtext opacity-50'}`}
                        >
                            <span className="block font-bold text-sm">Variedade</span>
                            <span className="text-[10px]">Pratos diferentes sempre</span>
                        </button>
                        <button 
                             onClick={() => setAllowRepeats(true)}
                             className={`flex-1 p-3 rounded-xl text-left border transition ${allowRepeats ? 'bg-primary/20 border-primary text-black' : 'bg-white border-surfaceHighlight text-subtext opacity-50'}`}
                        >
                            <span className="block font-bold text-sm">Praticidade</span>
                            <span className="text-[10px]">Repetir para cozinhar menos</span>
                        </button>
                     </div>
                 </div>

                 <button 
                     onClick={() => onGenerate(preferences.join(", "), mealsCount, allowRepeats)}
                     className="w-full bg-primary text-black py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-[0.98] transition hover:bg-[#a6f000]"
                 >
                     Gerar Plano Mágico
                 </button>
                 <button onClick={onClose} className="w-full mt-4 text-sm font-bold text-gray-400">Cancelar</button>
             </div>
        </div>
    );
};

const DuplicateMealModal = ({ 
    onClose, 
    onConfirm, 
    sourceDayIndex 
}: { 
    onClose: () => void, 
    onConfirm: (targetDayIndex: number) => void,
    sourceDayIndex: number
}) => {
    const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    
    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
             <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
                 <h3 className="font-display font-bold text-xl text-text mb-2 text-center">Copiar refeição para...</h3>
                 <p className="text-subtext text-center text-sm mb-6">Escolha o dia para repetir este prato.</p>
                 
                 <div className="grid grid-cols-2 gap-3 mb-6">
                     {days.map((day, idx) => (
                         <button
                            key={day}
                            onClick={() => onConfirm(idx)}
                            disabled={idx === sourceDayIndex}
                            className={`p-3 rounded-xl font-bold text-sm border transition ${idx === sourceDayIndex ? 'opacity-30 bg-gray-100' : 'bg-white border-surfaceHighlight hover:bg-gray-50 active:bg-black active:text-white'}`}
                         >
                             {day}
                         </button>
                     ))}
                 </div>
                 
                 <button onClick={onClose} className="w-full py-3 text-sm font-bold text-gray-400">Cancelar</button>
             </div>
        </div>
    );
};

const ShoppingListModal = ({ list, onClose, onToggle }: { list: ShoppingList, onClose: () => void, onToggle: (id: string) => void }) => {
    // (Implementation same as previous)
    const grouped = list.items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>);

    return (
        <div className="fixed inset-0 bg-background z-[60] flex flex-col animate-fade-in">
             <div className="px-6 py-4 flex justify-between items-center border-b border-surfaceHighlight bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <button onClick={onClose} className="text-subtext hover:text-text p-2 -ml-2">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <span className="font-display font-bold text-lg text-text">Lista de Compras</span>
                <div className="w-6" />
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 pb-24">
                 {Object.entries(grouped).map(([category, items]) => (
                     <div key={category} className="mb-6">
                         <h3 className="font-bold text-primary text-sm uppercase tracking-wider mb-3">{category}</h3>
                         <div className="bg-white border border-surfaceHighlight rounded-2xl overflow-hidden shadow-sm">
                             {items.map((item, idx) => (
                                 <div 
                                     key={item.id} 
                                     onClick={() => onToggle(item.id)}
                                     className={`p-4 flex items-center gap-4 cursor-pointer transition hover:bg-gray-50 ${idx !== items.length - 1 ? 'border-b border-surfaceHighlight' : ''}`}
                                 >
                                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${item.checked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                         {item.checked && <CheckIcon className="w-4 h-4 text-black" />}
                                     </div>
                                     <div className={`flex-1 ${item.checked ? 'opacity-40' : ''}`}>
                                         <p className={`font-bold text-sm ${item.checked ? 'line-through' : 'text-text'}`}>{item.name}</p>
                                         <p className="text-xs text-subtext">{item.quantity}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
                 
                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-sm text-blue-800 text-center">
                     Essa lista foi gerada automaticamente com base no seu plano semanal.
                 </div>
             </div>
        </div>
    );
};

// --- Missing Components Implementation ---

const RecipeCard = ({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) => (
  <div onClick={onClick} className="bg-white rounded-3xl p-4 mb-4 border border-surfaceHighlight shadow-sm active:scale-[0.98] transition cursor-pointer hover:shadow-md">
    <div className="relative h-48 rounded-2xl overflow-hidden mb-4 bg-gray-100">
      <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
        {recipe.category}
      </div>
      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-bold flex items-center gap-1">
        <TimerIcon className="w-3 h-3" /> {recipe.prepTime}
      </div>
    </div>
    <h3 className="font-display font-bold text-lg text-text leading-tight mb-2">{recipe.name}</h3>
    <div className="flex gap-4 text-xs text-subtext mb-3">
       <span className="flex items-center gap-1"><FlameIcon className="w-3.5 h-3.5 text-orange-500" /> {recipe.macros.calories} kcal</span>
       <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {recipe.difficulty}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {recipe.tags.slice(0, 3).map(tag => (
        <span key={tag} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wide">{tag}</span>
      ))}
    </div>
  </div>
);

const CompactRecipeCard = ({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) => (
  <div onClick={onClick} className="bg-white rounded-3xl p-3 border border-surfaceHighlight shadow-sm active:scale-[0.98] transition cursor-pointer hover:shadow-md h-full flex flex-col">
      <div className="relative h-28 rounded-2xl overflow-hidden mb-3 bg-gray-100 shrink-0">
         <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="font-display font-bold text-sm text-text leading-tight mb-1 line-clamp-2">{recipe.name}</h3>
      <p className="text-xs text-subtext mb-2 flex items-center gap-1"><FlameIcon className="w-3 h-3 text-orange-400" /> {recipe.macros.calories}</p>
  </div>
);

const RecipeDetailModal = ({ recipe, onClose, onSave, isSaved }: { recipe: Recipe; onClose: () => void; onSave: (r: Recipe) => void; isSaved: boolean }) => {
    const [activeTab, setActiveTab] = useState<'ING' | 'PREP'>('ING');

    return (
        <div className="fixed inset-0 bg-background z-[70] flex flex-col animate-fade-in overflow-hidden">
            <div className="relative h-72 shrink-0">
                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <button onClick={onClose} className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"><ArrowRightIcon className="w-5 h-5 rotate-180" /></button>
                <button onClick={() => onSave(recipe)} className={`absolute top-6 right-6 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition ${isSaved ? 'bg-primary text-black' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    <BookHeartIcon className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                    <span className="px-3 py-1 bg-primary text-black text-xs font-bold rounded-lg uppercase tracking-wider mb-2 inline-block">{recipe.category}</span>
                    <h2 className="text-3xl font-display font-extrabold text-white leading-tight mb-2">{recipe.name}</h2>
                    <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                        <span className="flex items-center gap-1"><TimerIcon className="w-4 h-4" /> {recipe.prepTime}</span>
                        <span className="flex items-center gap-1"><FlameIcon className="w-4 h-4" /> {recipe.macros.calories} kcal</span>
                        <span className="flex items-center gap-1">{recipe.difficulty}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-t-[2.5rem] -mt-6 relative z-10 overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="px-8 pt-8 pb-4">
                     <div className="flex justify-between items-center mb-6 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                         <button onClick={() => setActiveTab('ING')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'ING' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Ingredientes</button>
                         <button onClick={() => setActiveTab('PREP')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'PREP' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>Preparo</button>
                     </div>
                </div>
                
                <div className="px-8 pb-24 overflow-y-auto">
                    {activeTab === 'ING' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {Object.entries(recipe.macros).map(([key, val]) => (
                                    <div key={key} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                                        <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{key === 'protein' ? 'Prot' : key === 'carbs' ? 'Carb' : key === 'fats' ? 'Gord' : 'Cal'}</span>
                                        <span className="font-display font-bold text-lg text-text">{val}</span>
                                        <span className="text-[10px] text-gray-400">{key === 'calories' ? '' : 'g'}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-lg mb-4">Lista de Compras</h3>
                                <div className="space-y-3">
                                    {recipe.ingredients.map((ing, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{ing.icon}</div>
                                            <div>
                                                <p className="font-bold text-text">{ing.name}</p>
                                                <p className="text-sm text-subtext">{ing.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {recipe.substitutions && recipe.substitutions.length > 0 && (
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                                    <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2"><ExchangeIcon className="w-5 h-5" /> FitSwap (Trocas)</h3>
                                    <div className="space-y-3">
                                        {recipe.substitutions.map((sub, i) => (
                                            <div key={i} className="text-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-red-400 line-through">{sub.original}</span>
                                                    <ArrowRightIcon className="w-3 h-3 text-green-600" />
                                                    <span className="font-bold text-green-700">{sub.replacement}</span>
                                                </div>
                                                <p className="text-xs text-green-600/80 italic">"{sub.reason}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <SmartCookingTimer text={recipe.prepTime} />
                            
                            <div className="space-y-6 mt-4">
                                {recipe.instructions.map((step, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-black/20">{i + 1}</div>
                                        <p className="text-subtext leading-relaxed pt-1">{step}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-8">
                                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><LightbulbIcon className="w-5 h-5" /> Dica do Chef</h3>
                                <p className="text-sm text-blue-700 leading-relaxed">{recipe.healthTips}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Onboarding = ({ onComplete, onLogin }: { onComplete: (profile: UserProfile) => void; onLogin: () => void }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [goal, setGoal] = useState<UserGoal>(UserGoal.LOSE_WEIGHT);
    const [activity, setActivity] = useState<ActivityLevel>(ActivityLevel.MEDIUM);
    const [restrictions, setRestrictions] = useState<string[]>([]);
    
    const totalSteps = 4;

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
        } else {
            // Complete
            const profile: UserProfile = {
                name: name || 'Atleta',
                goal,
                activityLevel: activity,
                mealsPerDay: 3, // Default
                mealSlots: ['Café da Manhã', 'Almoço', 'Jantar'],
                dietaryRestrictions: restrictions,
                dislikes: [],
                usageModes: [AppUsageMode.FIT_SWAP],
                profilePicture: undefined
            };
            onComplete(profile);
        }
    };

    const toggleRestriction = (r: string) => {
        if (restrictions.includes(r)) {
            setRestrictions(restrictions.filter(i => i !== r));
        } else {
            setRestrictions([...restrictions, r]);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col p-6 relative overflow-hidden">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-100 rounded-full mb-8 overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                ></div>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full animate-fade-in">
                {step === 0 && (
                    <div className="text-center">
                        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 rotate-3">
                            <span className="text-5xl">👋</span>
                        </div>
                        <h1 className="text-4xl font-display font-extrabold text-text mb-4 tracking-tight">Bem-vindo ao NutriVerse</h1>
                        <p className="text-subtext text-lg mb-8 leading-relaxed">Sua jornada para uma alimentação inteligente e sem esforço começa agora.</p>
                        
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Como podemos te chamar?" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-5 bg-white border border-surfaceHighlight rounded-2xl text-center text-lg font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition shadow-sm"
                            />
                        </div>
                        <div className="mt-8">
                            <p className="text-subtext text-sm mb-2">Já tem uma conta?</p>
                            <button onClick={onLogin} className="text-black font-bold hover:underline">Fazer Login</button>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <h2 className="text-3xl font-display font-extrabold text-text mb-2 text-center">Qual seu objetivo principal?</h2>
                        <p className="text-center text-subtext mb-8">Vamos personalizar tudo para você chegar lá.</p>
                        <div className="space-y-3">
                            {[
                                { id: UserGoal.LOSE_WEIGHT, icon: '🔥', label: 'Queimar gordura', desc: 'Definição e perda de peso' },
                                { id: UserGoal.GAIN_MUSCLE, icon: '💪', label: 'Ganhar massa', desc: 'Hipertrofia e força' },
                                { id: UserGoal.EAT_HEALTHY, icon: '🥗', label: 'Comer melhor', desc: 'Reeducação alimentar' },
                            ].map((opt) => (
                                <button 
                                    key={opt.id}
                                    onClick={() => setGoal(opt.id)}
                                    className={`w-full p-5 rounded-2xl text-left transition border-2 flex items-center gap-4 ${goal === opt.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]' : 'border-transparent bg-white shadow-sm hover:scale-[1.01]'}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border border-gray-50">{opt.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-text text-lg">{opt.label}</h3>
                                        <p className="text-sm text-subtext">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 className="text-3xl font-display font-extrabold text-text mb-2 text-center">Nível de Atividade</h2>
                        <p className="text-center text-subtext mb-8">Para calcularmos suas calorias ideais.</p>
                        <div className="space-y-3">
                             {[
                                { id: ActivityLevel.LOW, icon: '🪑', label: 'Leve', desc: 'Trabalho sentado, pouco exercício' },
                                { id: ActivityLevel.MEDIUM, icon: '🚶', label: 'Moderado', desc: 'Caminhadas, exercícios 2-3x/sem' },
                                { id: ActivityLevel.HIGH, icon: '⚡', label: 'Intenso', desc: 'Treinos diários ou trabalho físico' },
                            ].map((opt) => (
                                <button 
                                    key={opt.id}
                                    onClick={() => setActivity(opt.id)}
                                    className={`w-full p-5 rounded-2xl text-left transition border-2 flex items-center gap-4 ${activity === opt.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]' : 'border-transparent bg-white shadow-sm hover:scale-[1.01]'}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border border-gray-50">{opt.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-text text-lg">{opt.label}</h3>
                                        <p className="text-sm text-subtext">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                         <h2 className="text-3xl font-display font-extrabold text-text mb-2 text-center">Alguma restrição?</h2>
                         <p className="text-center text-subtext mb-8">Seleciona o que você NÃO pode comer.</p>
                         
                         <div className="flex flex-wrap gap-3 justify-center mb-8">
                             {RESTRICTION_OPTIONS.map((opt) => {
                                 const isSelected = restrictions.includes(opt);
                                 return (
                                     <button
                                        key={opt}
                                        onClick={() => toggleRestriction(opt)}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition border-2 ${isSelected ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-subtext border-transparent shadow-sm hover:bg-gray-50'}`}
                                     >
                                         {opt}
                                     </button>
                                 )
                             })}
                         </div>
                    </div>
                )}
            </div>

            <div className="mt-8 max-w-sm mx-auto w-full">
                <button 
                    onClick={handleNext}
                    className="w-full bg-primary text-black py-5 rounded-2xl font-bold text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 group"
                >
                    {step === totalSteps - 1 ? 'Começar Jornada' : 'Continuar'} 
                    <ArrowRightIcon className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  // ... (State same as before)
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('SIGNUP');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  const [history, setHistory] = useState<Recipe[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set()); 
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exploreMode, setExploreMode] = useState<'TEXT' | 'PANTRY'>('TEXT');
  const [dishInput, setDishInput] = useState('');
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
  const [manualIngredient, setManualIngredient] = useState(''); 
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // --- Planning Feature State ---
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [activePlanningDay, setActivePlanningDay] = useState(0); 
  const [showPlanningWizard, setShowPlanningWizard] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  
  // New State for Duplicate Feature
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [mealToDuplicate, setMealToDuplicate] = useState<{dayIdx: number, mealIdx: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (Handlers same as before: handleOnboardingComplete, handleAuthSuccess, handlePantryImageUpload, etc.)

  const handleOnboardingComplete = (profile: UserProfile) => {
      setUserProfile(profile);
      setOnboardingComplete(true);
      setAuthView('SIGNUP');
  };

  const handleAuthSuccess = (name: string) => {
      if (userProfile) {
          const fullProfile = { ...userProfile, name };
          setUserProfile(fullProfile);
      } else {
           setUserProfile({
               name,
               goal: UserGoal.EAT_HEALTHY,
               activityLevel: ActivityLevel.MEDIUM,
               mealsPerDay: 3,
               mealSlots: ['morning', 'lunch', 'dinner'],
               dietaryRestrictions: [],
               dislikes: [],
               usageModes: [AppUsageMode.FIT_SWAP]
           });
      }
      setIsLoggedIn(true);
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

  // --- Planning Handlers ---
  const handleGeneratePlan = async (preference: string, mealsCount: number, allowRepeats: boolean) => {
      if (!userProfile) return;
      setShowPlanningWizard(false);
      setLoading(true);
      setLoadingMsg("A IA está montando sua semana...");

      const plan = await generateWeeklyPlan(userProfile, preference, mealsCount, allowRepeats);
      if (plan) {
          setWeeklyPlan(plan);
          setActivePlanningDay(0);
      } else {
          alert("Erro ao criar plano. Tente novamente.");
      }
      setLoading(false);
  };

  const handleSwapMeal = async (dayIdx: number, mealIdx: number) => {
      if (!userProfile || !weeklyPlan) return;
      const currentMeal = weeklyPlan.days[dayIdx].meals[mealIdx];
      
      setLoading(true);
      setLoadingMsg(`Trocando ${currentMeal.timeSlot.toLowerCase()}...`);

      try {
          const newRecipe = await generateFitnessRecipe(
              `Sugestão de ${currentMeal.timeSlot} diferente e criativa`, 
              userProfile.goal, 
              userProfile.dietaryRestrictions
          );

          if (newRecipe) {
              const newWeeklyPlan = { ...weeklyPlan };
              newWeeklyPlan.days[dayIdx].meals[mealIdx].recipe = newRecipe;
              setWeeklyPlan(newWeeklyPlan);
          }
      } catch (error) {
          console.error("Failed to swap meal", error);
      } finally {
          setLoading(false);
      }
  };

  const openDuplicateModal = (dayIdx: number, mealIdx: number) => {
      setMealToDuplicate({ dayIdx, mealIdx });
      setDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = (targetDayIndex: number) => {
      if (!weeklyPlan || !mealToDuplicate) return;
      
      const newPlan = { ...weeklyPlan };
      const sourceMeal = newPlan.days[mealToDuplicate.dayIdx].meals[mealToDuplicate.mealIdx];
      
      // Find matching slot in target day (try to match Lunch to Lunch)
      // If exact slot name doesn't exist, use the same index, or append.
      // Assuming consistent structure generated by AI:
      const targetMeals = newPlan.days[targetDayIndex].meals;
      
      // Try to find same slot name
      let targetMealIndex = targetMeals.findIndex(m => m.timeSlot === sourceMeal.timeSlot);
      
      if (targetMealIndex === -1) {
          // If no matching slot name, fallback to same index if available
          targetMealIndex = Math.min(mealToDuplicate.mealIdx, targetMeals.length - 1);
      }

      if (targetMealIndex >= 0) {
          // Copy recipe
          newPlan.days[targetDayIndex].meals[targetMealIndex].recipe = {
              ...sourceMeal.recipe,
              id: crypto.randomUUID() // New ID for the copy
          };
          setWeeklyPlan(newPlan);
      }
      
      setDuplicateModalOpen(false);
      setMealToDuplicate(null);
  };

  // ... (Other handlers same as before: handleCreateShoppingList, toggleShoppingItem, toggleSave, etc.)
  const handleCreateShoppingList = async () => {
      if (!weeklyPlan) return;
      setLoading(true);
      setLoadingMsg("Calculando lista de compras...");
      const list = await generateShoppingList(weeklyPlan);
      if (list) {
          setShoppingList(list);
          setShowShoppingList(true);
      }
      setLoading(false);
  };

  const toggleShoppingItem = (id: string) => {
      if (!shoppingList) return;
      const updatedItems = shoppingList.items.map(item => 
          item.id === id ? { ...item, checked: !item.checked } : item
      );
      setShoppingList({ ...shoppingList, items: updatedItems });
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

  const handleLogout = () => { setIsLoggedIn(false); };
  const handleUpdateProfile = (updatedProfile: UserProfile) => { setUserProfile(updatedProfile); };
  
  const allRecipes = [...history, ...MOCK_RECIPES];
  const filteredHistory = selectedCategory ? allRecipes.filter(r => r.category === selectedCategory) : allRecipes;
  const libraryRecipes = allRecipes.filter(r => saved.has(r.id));

  // --- Render Views Flow ---
  if (!onboardingComplete) {
      return <Onboarding onComplete={handleOnboardingComplete} onLogin={() => { setOnboardingComplete(true); setAuthView('LOGIN'); }} />;
  }
  if (!isLoggedIn) {
      return authView === 'LOGIN' ? <LoginScreen onNavigateToSignUp={() => setAuthView('SIGNUP')} onLoginSuccess={handleAuthSuccess} /> : <SignUpScreen onNavigateToLogin={() => setAuthView('LOGIN')} onSignUpSuccess={handleAuthSuccess} />;
  }

  // 3. Main App
  if (userProfile) {
    return (
        <div className="bg-background min-h-screen pb-28 font-sans text-text">
            {/* Header omitted for brevity, keeping existing structure */}
             <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-surfaceHighlight flex justify-between items-center transition-all">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <ChefHatIcon className="w-5 h-5 text-black" />
                    </div>
                    <h1 className="text-xl font-display font-extrabold tracking-tight text-text">NutriVerse</h1>
                </div>
                <button className="w-10 h-10 rounded-full bg-white border border-surfaceHighlight flex items-center justify-center shadow-sm hover:shadow-md transition" onClick={() => setActiveTab('PROFILE')}>
                {userProfile.profilePicture ? (
                    <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-5 h-5 text-text" />
                )}
                </button>
            </header>

            <main className="p-6 max-w-lg mx-auto">
                {/* Tabs Rendering - HOME, EXPLORE, LIBRARY, PROFILE (Kept same logic, hidden for brevity) */}
                {activeTab === 'HOME' && (
                    <>
                    {/* Welcome Banner */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-display font-extrabold tracking-tight text-text mb-1">Olá, {userProfile.name?.split(' ')[0] || 'Atleta'}</h2>
                        <p className="text-subtext">Seu foco hoje: <span className="text-green-800 font-bold bg-primary/20 px-2 py-0.5 rounded-md text-sm">{userProfile.goal === 'LOSE_WEIGHT' ? 'Queimar' : userProfile.goal === 'GAIN_MUSCLE' ? 'Construir' : 'Viver'}</span></p>
                    </div>

                    {/* Primary CTA */}
                    <div 
                        onClick={() => quickAction('TEXT')}
                        className="bg-black text-white rounded-[2rem] p-6 mb-8 shadow-xl shadow-black/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition group relative overflow-hidden"
                    >
                         <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                            <SparklesIcon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-display font-extrabold text-2xl mb-1">Fitzar Receita</h3>
                            <p className="text-gray-400 text-sm">Transforme qualquer prato em versão saudável.</p>
                        </div>
                        <div className="bg-primary p-3 rounded-full relative z-10">
                            <ArrowRightIcon className="w-6 h-6 text-black -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                        </div>
                         <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full opacity-50"></div>
                    </div>
                    
                    {/* Categories */}
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
                        <div className="text-center py-12 border-2 border-dashed border-surfaceHighlight rounded-[2rem] bg-gray-50 mb-8">
                            <p className="text-subtext text-sm mb-3">
                                {selectedCategory 
                                ? `Nenhuma receita de ${selectedCategory.toLowerCase()} encontrada.` 
                                : "Nenhuma receita criada ainda."}
                            </p>
                            <button onClick={() => quickAction('TEXT')} className="text-black font-bold text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50">Criar agora</button>
                        </div>
                    ) : (
                        selectedCategory ? (
                             <div className="grid grid-cols-2 gap-4 mb-8">
                                 {filteredHistory.slice(0, 6).map(recipe => (
                                     <CompactRecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                                 ))}
                             </div>
                        ) : (
                            <div className="mb-8">
                                {filteredHistory.slice(0, 3).map(recipe => (
                                    <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                                ))}
                            </div>
                        )
                    )}
                    <DailyTipCard />
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
                        {/* Explore Content (Text/Pantry Inputs) kept same */}
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
                                    <button onClick={handleGenerate} disabled={!dishInput.trim() || loading} className="absolute right-2 top-2 bottom-2 bg-black text-white w-14 rounded-[1.5rem] flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition"><ArrowRightIcon className="w-6 h-6" /></button>
                                </div>
                            </div>
                        ) : (
                             <div className="animate-fade-in">
                                <h2 className="text-2xl font-display font-bold text-text mb-6">Escaneie sua cozinha</h2>
                                <div className="mb-6 grid grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 bg-white rounded-[2rem] h-40 flex flex-col items-center justify-center cursor-pointer transition group"
                                    >
                                        <div className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center mb-3 shadow-lg shadow-primary/20 group-hover:scale-110 transition"><CameraIcon className="w-6 h-6" /></div>
                                        <p className="text-xs font-bold text-text">Tirar foto</p>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePantryImageUpload} />
                                    </div>
                                    <div className="bg-white border border-surfaceHighlight rounded-[2rem] h-40 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                                        <div className="flex gap-2">
                                            <input type="text" value={manualIngredient} onChange={(e) => setManualIngredient(e.target.value)} placeholder="Add item..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-text focus:border-primary outline-none" onKeyDown={(e) => e.key === 'Enter' && addManualIngredient()} />
                                            <button onClick={addManualIngredient} className="bg-black text-white rounded-xl w-10 shrink-0 flex items-center justify-center hover:bg-gray-800"><PlusIcon className="w-4 h-4" /></button>
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
                                                <span key={i} className="bg-gray-50 pl-3 pr-2 py-1.5 rounded-xl text-sm border border-gray-200 flex items-center gap-2 text-text font-medium">{ing}<button onClick={() => removeIngredient(i)} className="text-gray-400 hover:text-red-500 transition"><CloseIcon className="w-3 h-3" /></button></span>
                                            ))}
                                        </div>
                                        <button onClick={handleGenerate} disabled={loading} className="w-full bg-primary text-black font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition flex items-center justify-center gap-2 hover:bg-[#a6f000]"><ChefHatIcon className="w-5 h-5" /> Criar Receita Única</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'LIBRARY' && (
                     <>
                        <h2 className="text-3xl font-display font-bold tracking-tight text-text mb-6">Sua Coleção</h2>
                        <div className="flex gap-2 mb-6 p-1 bg-white rounded-xl border border-surfaceHighlight w-fit shadow-sm">
                            <button className="text-xs font-bold bg-gray-100 text-black px-4 py-2 rounded-lg shadow-sm">Salvas</button>
                        </div>
                        <div className="space-y-4">
                            {libraryRecipes.length > 0 ? libraryRecipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                            )) : (
                                <div className="text-center py-20 bg-white rounded-[2rem] border border-surfaceHighlight border-dashed">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><BookHeartIcon className="w-8 h-8 text-gray-300" /></div>
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
                        <button onClick={() => setShowEditProfile(true)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-text hover:bg-gray-200 transition"><PencilIcon className="w-5 h-5" /></button>
                        <div className="w-28 h-28 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-4 border-[6px] border-white shadow-lg shadow-black/5 overflow-hidden">
                            {userProfile.profilePicture ? (
                                <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-gray-300" />
                            )}
                        </div>
                        <h2 className="text-3xl font-display font-extrabold text-text mb-1 tracking-tight">{userProfile.name}</h2>
                        <p className="text-subtext text-sm mb-4">Membro NutriVerse</p>
                        <div className="flex justify-center gap-2">
                            <span className="px-4 py-1.5 bg-primary text-black rounded-full text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20">{userProfile.goal === UserGoal.LOSE_WEIGHT ? 'Queimar Gordura' : userProfile.goal === UserGoal.GAIN_MUSCLE ? 'Ganhar Massa' : 'Saudável'}</span>
                        </div>
                        </div>
                        {/* Profile Details & Logout */}
                         <div className="space-y-3">
                            <div className="bg-white p-5 rounded-[2rem] border border-surfaceHighlight flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-xs">{userProfile.dietaryRestrictions.length}</div>
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
                        <button onClick={handleLogout} className="w-full mt-12 py-5 text-red-500 font-bold text-sm bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition shadow-sm">Sair da conta</button>
                    </div>
                )}

                {activeTab === 'PLANNING' && (
                    <div className="pt-2 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-display font-extrabold tracking-tight text-text">Sua Semana</h2>
                            {weeklyPlan && (
                                 <button 
                                    onClick={handleCreateShoppingList}
                                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-gray-900"
                                 >
                                     <ShoppingBagIcon className="w-4 h-4 text-primary" />
                                     Lista
                                 </button>
                            )}
                        </div>

                        {!weeklyPlan ? (
                            <div className="text-center py-16 bg-white rounded-[2.5rem] border border-surfaceHighlight shadow-sm">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CalendarIcon className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="font-bold text-xl text-text mb-2">Semana não planejada</h3>
                                <p className="text-subtext text-sm max-w-xs mx-auto mb-8">
                                    Transforme sua alimentação com um clique. Economize tempo e coma melhor.
                                </p>
                                <button 
                                    onClick={() => setShowPlanningWizard(true)}
                                    className="bg-primary text-black px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition hover:bg-[#a6f000]"
                                >
                                    Gerar Plano Mágico
                                </button>
                            </div>
                        ) : (
                            <div>
                                 {/* Day Selector */}
                                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
                                     {weeklyPlan.days.map((day, idx) => (
                                         <button
                                             key={idx}
                                             onClick={() => setActivePlanningDay(idx)}
                                             className={`shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition ${
                                                 activePlanningDay === idx 
                                                 ? 'bg-black border-black text-primary shadow-lg' 
                                                 : 'bg-white border-surfaceHighlight text-subtext hover:bg-gray-50'
                                             }`}
                                         >
                                             <span className="text-[10px] uppercase font-bold">{day.dayName.substring(0,3)}</span>
                                             <span className="text-xl font-bold font-display">{idx + 1}</span>
                                         </button>
                                     ))}
                                 </div>

                                 {/* Meals List */}
                                 <div className="space-y-4 mb-24">
                                     {weeklyPlan.days[activePlanningDay].meals.map((meal, mealIdx) => (
                                         <div 
                                             key={meal.id} 
                                             className="bg-white p-4 rounded-2xl border border-surfaceHighlight flex gap-4 shadow-sm transition group"
                                         >
                                             <div className="cursor-pointer" onClick={() => setSelectedRecipe(meal.recipe)}>
                                                <img src={meal.recipe.imageUrl} alt={meal.recipe.name} className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
                                             </div>
                                             <div className="flex-1 min-w-0 py-1 flex flex-col">
                                                 <div className="flex justify-between items-start">
                                                     <span className="text-[10px] font-bold text-subtext uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md mb-1 inline-block">
                                                         {meal.timeSlot}
                                                     </span>
                                                     <div className="flex gap-1">
                                                         {/* Duplicate Button */}
                                                          <button 
                                                            onClick={() => openDuplicateModal(activePlanningDay, mealIdx)}
                                                            className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition"
                                                            title="Copiar para outro dia"
                                                        >
                                                            <CopyIcon className="w-4 h-4" />
                                                        </button>
                                                         {/* Swap Button */}
                                                         <button 
                                                            onClick={() => handleSwapMeal(activePlanningDay, mealIdx)}
                                                            className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition"
                                                            title="Trocar Sugestão"
                                                        >
                                                            <RefreshIcon className="w-4 h-4" />
                                                        </button>
                                                     </div>
                                                 </div>
                                                 <h4 onClick={() => setSelectedRecipe(meal.recipe)} className="font-bold text-text truncate mb-1 cursor-pointer hover:underline">
                                                    {meal.recipe.name}
                                                 </h4>
                                                 <div className="flex items-center gap-3 text-xs text-subtext mt-auto">
                                                     <span className="flex items-center gap-1"><TimerIcon className="w-3 h-3" /> {meal.recipe.prepTime}</span>
                                                     <span className="flex items-center gap-1"><FlameIcon className="w-3 h-3 text-orange-400" /> {meal.recipe.macros.calories} kcal</span>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                                 
                                 <button onClick={() => setShowPlanningWizard(true)} className="w-full py-4 text-sm font-bold text-gray-400 hover:text-black transition">
                                     Não gostou? Refazer semana inteira
                                 </button>
                            </div>
                        )}
                    </div>
                )}

            </main>
            
            {/* Bottom Navigation (Kept Same, omitted for brevity) */}
            <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-surfaceHighlight pb-safe pt-2 px-6 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center max-w-lg mx-auto h-20">
                <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center gap-1.5 w-12 transition-all ${activeTab === 'HOME' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}><HomeIcon className={`w-6 h-6 ${activeTab === 'HOME' ? 'fill-current' : ''}`} /><span className="text-[9px] font-bold">Início</span></button>
                <button onClick={() => setActiveTab('EXPLORE')} className={`flex flex-col items-center gap-1.5 w-12 transition-all ${activeTab === 'EXPLORE' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}><SearchIcon className="w-6 h-6" /><span className="text-[9px] font-bold">Explorar</span></button>
                <div className="relative -top-5"><button onClick={() => { setActiveTab('EXPLORE'); setExploreMode('PANTRY'); }} className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-2xl shadow-black/30 text-primary active:scale-90 transition border-[4px] border-background"><CameraIcon className="w-6 h-6" /></button></div>
                <button onClick={() => setActiveTab('PLANNING')} className={`flex flex-col items-center gap-1.5 w-12 transition-all ${activeTab === 'PLANNING' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}><CalendarIcon className={`w-6 h-6 ${activeTab === 'PLANNING' ? 'fill-current' : ''}`} /><span className="text-[9px] font-bold">Agenda</span></button>
                <button onClick={() => setActiveTab('PROFILE')} className={`flex flex-col items-center gap-1.5 w-12 transition-all ${activeTab === 'PROFILE' ? 'text-primary' : 'text-gray-400 hover:text-text'}`}>{userProfile && userProfile.profilePicture ? (<img src={userProfile.profilePicture} alt="Profile" className="w-6 h-6 rounded-full object-cover" />) : (<UserIcon className={`w-6 h-6 ${activeTab === 'PROFILE' ? 'fill-current' : ''}`} />)}<span className="text-[9px] font-bold">Perfil</span></button>
                </div>
            </nav>

            {/* Overlays */}
            {loading && <LoadingOverlay message={loadingMsg} />}
            {showEditProfile && userProfile && <EditProfileModal userProfile={userProfile} onClose={() => setShowEditProfile(false)} onSave={handleUpdateProfile} />}
            {showPlanningWizard && <PlanningWizard onClose={() => setShowPlanningWizard(false)} onGenerate={handleGeneratePlan} />}
            {showShoppingList && shoppingList && <ShoppingListModal list={shoppingList} onClose={() => setShowShoppingList(false)} onToggle={toggleShoppingItem} />}
            {selectedRecipe && <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} onSave={(r) => toggleSave(r)} isSaved={saved.has(selectedRecipe.id)} />}
            
            {duplicateModalOpen && mealToDuplicate && (
                <DuplicateMealModal 
                    sourceDayIndex={mealToDuplicate.dayIdx} 
                    onClose={() => setDuplicateModalOpen(false)} 
                    onConfirm={handleConfirmDuplicate} 
                />
            )}
        </div>
    );
  }
  return null;
}

import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Lock, 
  Palette, 
  Sparkles,
  Moon,
  Sun,
  Search,
  History,
  Heart,
  Scale,
  Zap,
  Package,
  Cpu,
  StickyNote,
  Shield,
  FileJson,
  Banknote,
  Regex,
  Brush,
  Link,
  Code,
  Layers,
  Activity,
  Settings
} from 'lucide-react';
import { ToolId, ToolCategory } from './types';
import { NeuButton } from './components/ui/NeuButton';
import { PasswordGenerator } from './components/tools/PasswordGenerator';
import { ColorMixer } from './components/tools/ColorMixer';
import { AiAssistant } from './components/tools/AiAssistant';
import { UnitConverter } from './components/tools/UnitConverter';
import { BmiCalculator } from './components/tools/BmiCalculator';
import { MyNotes } from './components/tools/MyNotes';
import { CryptoTool } from './components/tools/CryptoTool';
import { JsonFormatter } from './components/tools/JsonFormatter';
import { CurrencyConverter } from './components/tools/CurrencyConverter';
import { RegexTester } from './components/tools/RegexTester';
import { PaletteGenerator } from './components/tools/PaletteGenerator';
import { UrlEncoder } from './components/tools/UrlEncoder';
import { CodeFormatter } from './components/tools/CodeFormatter';
import { GradientGenerator } from './components/tools/GradientGenerator';
import { SettingsModal } from './components/ui/SettingsModal';
import { AppIcon } from './components/ui/AppIcon';
import { AppProvider, useAppStore } from './utils/store';

// Component for the dashboard grid
const Dashboard: React.FC<{ 
  onSelect: (id: ToolId) => void,
  filterCategory?: ToolCategory 
}> = ({ onSelect, filterCategory }) => {
  const { t, recentTools, favoriteTools, toggleFavorite } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const tools = [
    // Productivity (Reduced)
    { 
      id: ToolId.MY_NOTES, 
      name: t.tools.myNotes.name, 
      icon: <StickyNote size={28} />, 
      desc: t.tools.myNotes.desc,
      category: ToolCategory.PRODUCTIVITY
    },

    // Utilities (Reordered)
    // 1. Crypto
    { 
      id: ToolId.CRYPTO_TOOL, 
      name: t.tools.cryptoTool.name, 
      icon: <Shield size={28} />, 
      desc: t.tools.cryptoTool.desc,
      category: ToolCategory.UTILITIES
    },
    // 2. JSON
    { 
      id: ToolId.JSON_FORMATTER, 
      name: t.tools.jsonFormatter.name, 
      icon: <FileJson size={28} />, 
      desc: t.tools.jsonFormatter.desc,
      category: ToolCategory.UTILITIES
    },
    // 3. Password Gen (Swapped with Regex)
    { 
      id: ToolId.PASSWORD_GEN, 
      name: t.tools.passwordGen.name, 
      icon: <Lock size={28} />, 
      desc: t.tools.passwordGen.desc,
      category: ToolCategory.UTILITIES
    },
    // 4. URL
    { 
      id: ToolId.URL_ENCODER, 
      name: t.tools.urlEncoder.name, 
      icon: <Link size={28} />, 
      desc: t.tools.urlEncoder.desc,
      category: ToolCategory.UTILITIES
    },
    // 5. Code
    { 
      id: ToolId.CODE_FORMATTER, 
      name: t.tools.codeFormatter.name, 
      icon: <Code size={28} />, 
      desc: t.tools.codeFormatter.desc,
      category: ToolCategory.UTILITIES
    },
    // 6. Currency
    { 
      id: ToolId.CURRENCY_CONVERTER, 
      name: t.tools.currencyConverter.name, 
      icon: <Banknote size={28} />, 
      desc: t.tools.currencyConverter.desc,
      category: ToolCategory.UTILITIES
    },
    // 7. Color Mixer
    { 
      id: ToolId.COLOR_MIXER, 
      name: t.tools.colorMixer.name, 
      icon: <Palette size={28} />, 
      desc: t.tools.colorMixer.desc,
      category: ToolCategory.UTILITIES 
    },
    // 8. Palette
    { 
      id: ToolId.PALETTE_GENERATOR, 
      name: t.tools.paletteGenerator.name, 
      icon: <Brush size={28} />, 
      desc: t.tools.paletteGenerator.desc,
      category: ToolCategory.UTILITIES
    },
    // 9. Gradient
    { 
      id: ToolId.GRADIENT_GENERATOR, 
      name: t.tools.gradientGenerator.name, 
      icon: <Layers size={28} />, 
      desc: t.tools.gradientGenerator.desc,
      category: ToolCategory.UTILITIES
    },
    
    // Remaining Utilities
    // Regex Tester (Swapped with Password Gen)
    { 
      id: ToolId.REGEX_TESTER, 
      name: t.tools.regexTester.name, 
      icon: <Regex size={28} />, 
      desc: t.tools.regexTester.desc,
      category: ToolCategory.UTILITIES
    },
    { 
      id: ToolId.UNIT_CONVERTER, 
      name: t.tools.unitConverter.name, 
      icon: <Scale size={28} />, 
      desc: t.tools.unitConverter.desc,
      category: ToolCategory.UTILITIES
    },
    { 
      id: ToolId.BMI_CALCULATOR, 
      name: t.tools.bmiCalculator.name, 
      icon: <Activity size={28} />, 
      desc: t.tools.bmiCalculator.desc,
      category: ToolCategory.UTILITIES
    },

    // AI
    { 
      id: ToolId.AI_IDEA, 
      name: t.tools.aiIdea.name, 
      icon: <Sparkles size={28} />, 
      desc: t.tools.aiIdea.desc,
      category: ToolCategory.AI
    },
  ];

  // Filter based on View Context (Category) and Search
  const visibleTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? tool.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Get recent tool objects (filtered by current category context)
  const recentToolObjects = recentTools
    .map(id => tools.find(tool => tool.id === id))
    .filter((tool): tool is typeof tools[0] => !!tool && (filterCategory ? tool.category === filterCategory : true));

  // Get favorite tool objects (filtered by current category context)
  const favoriteToolObjects = favoriteTools
    .map(id => tools.find(tool => tool.id === id))
    .filter((tool): tool is typeof tools[0] => !!tool && (filterCategory ? tool.category === filterCategory : true));

  const ToolCard: React.FC<{ tool: typeof tools[0] }> = ({ tool }) => {
    const isFav = favoriteTools.includes(tool.id);
    return (
      <button
        onClick={() => onSelect(tool.id)}
        className="group relative flex flex-col items-center p-6 rounded-[24px] bg-neu-base shadow-neu-flat hover:shadow-neu-pressed hover:scale-[0.98] transition-all duration-300 w-full h-full min-h-[160px]"
      >
        <div 
          className="absolute top-4 right-4 text-neu-text/20 hover:text-red-500 transition-colors z-10 p-2"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(tool.id);
          }}
        >
          <Heart size={20} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-red-500" : ""} />
        </div>
        <div className="w-14 h-14 rounded-full bg-neu-base shadow-neu-flat flex items-center justify-center text-neu-accent mb-4 group-hover:text-neu-text transition-colors">
          {tool.icon}
        </div>
        <h3 className="text-lg font-bold text-neu-text mb-1 line-clamp-1">{tool.name}</h3>
        <p className="text-sm text-neu-text/60 font-medium line-clamp-2">{tool.desc}</p>
      </button>
    );
  };

  const getPageTitle = () => {
    if (filterCategory) return t.categories[filterCategory];
    return t.app.title === 'FrankenMonster' ? 'Franken' : t.app.title;
  };

  const showRecents = !searchQuery && recentToolObjects.length > 0;
  const showFavorites = !searchQuery && favoriteToolObjects.length > 0;

  return (
    <div className="animate-fade-in pb-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-neu-text mb-4 tracking-tight">
          {getPageTitle()}
          {!filterCategory && t.app.title === 'FrankenMonster' && <span className="text-neu-accent">Monster</span>}
        </h1>
        <p className="text-lg text-neu-text/60 max-w-md mx-auto">
          {filterCategory ? t.app.subtitle : t.app.subtitle}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md mx-auto mb-12 relative">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neu-text/40">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder={t.app.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neu-base rounded-full pl-14 pr-6 py-4 text-neu-text shadow-neu-pressed outline-none focus:ring-2 focus:ring-neu-accent/10 placeholder-neu-text/30 transition-all font-semibold"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-12">
        
        {/* Favorites Section */}
        {showFavorites && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-base font-bold text-red-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                <Heart size={16} fill="currentColor" />
                {t.app.favorites}
              </h3>
              <div className="h-0.5 w-full bg-neu-base shadow-neu-pressed rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {favoriteToolObjects.map((tool) => (
                  <div key={`fav-${tool.id}`} className="relative">
                     <ToolCard tool={tool} />
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* Recently Used Section */}
        {showRecents && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-base font-bold text-neu-accent uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                <History size={16} />
                {t.app.recent}
              </h3>
              <div className="h-0.5 w-full bg-neu-base shadow-neu-pressed rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentToolObjects.map((tool) => (
                  <div key={`recent-${tool.id}`} className="relative">
                     <ToolCard tool={tool} />
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tools (or Filtered Category Tools) */}
        <div className="animate-slide-up">
           {(showFavorites || showRecents) && (
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-base font-bold text-neu-text/50 uppercase tracking-widest whitespace-nowrap">
                  {filterCategory ? t.categories[filterCategory] : t.app.allTools}
                </h3>
                <div className="h-0.5 w-full bg-neu-base shadow-neu-pressed rounded-full"></div>
              </div>
           )}

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
           </div>
        </div>

        {visibleTools.length === 0 && (
           <div className="text-center py-12 opacity-50">
             <p className="text-xl font-bold text-neu-text">No tools found matching "{searchQuery}"</p>
           </div>
        )}
      </div>
    </div>
  );
};

const MainLayout = () => {
  const [activeTool, setActiveTool] = useState<ToolId>(ToolId.DASHBOARD);
  const { theme, toggleTheme, language, setLanguage, t, addRecentTool, setSettingsOpen } = useAppStore();

  // Update document title when language changes
  useEffect(() => {
    if (t && t.app && t.app.browserTitle) {
      document.title = t.app.browserTitle;
    }
  }, [t]);

  const handleToolSelect = (id: ToolId) => {
    setActiveTool(id);
    // Only track actual tools, not dashboard or category views
    if (!id.startsWith('CATEGORY_') && id !== ToolId.DASHBOARD) {
      addRecentTool(id);
    }
  };

  const renderContent = () => {
    switch (activeTool) {
      // Category Views
      case ToolId.CATEGORY_PRODUCTIVITY:
        return <Dashboard onSelect={handleToolSelect} filterCategory={ToolCategory.PRODUCTIVITY} />;
      case ToolId.CATEGORY_UTILITIES:
        return <Dashboard onSelect={handleToolSelect} filterCategory={ToolCategory.UTILITIES} />;
      case ToolId.CATEGORY_AI:
        return <Dashboard onSelect={handleToolSelect} filterCategory={ToolCategory.AI} />;
      
      // Individual Tools
      case ToolId.MY_NOTES: return <MyNotes />;
      case ToolId.PASSWORD_GEN: return <PasswordGenerator />;
      case ToolId.COLOR_MIXER: return <ColorMixer />;
      case ToolId.AI_IDEA: return <AiAssistant />;
      case ToolId.UNIT_CONVERTER: return <UnitConverter />;
      case ToolId.BMI_CALCULATOR: return <BmiCalculator />;
      case ToolId.CRYPTO_TOOL: return <CryptoTool />;
      case ToolId.JSON_FORMATTER: return <JsonFormatter />;
      case ToolId.CURRENCY_CONVERTER: return <CurrencyConverter />;
      case ToolId.REGEX_TESTER: return <RegexTester />;
      case ToolId.PALETTE_GENERATOR: return <PaletteGenerator />;
      case ToolId.URL_ENCODER: return <UrlEncoder />;
      case ToolId.CODE_FORMATTER: return <CodeFormatter />;
      case ToolId.GRADIENT_GENERATOR: return <GradientGenerator />;
      
      // Home
      case ToolId.DASHBOARD:
      default:
        return <Dashboard onSelect={handleToolSelect} />;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-neu-base flex flex-col md:flex-row font-sans text-neu-text selection:bg-neu-accent/20 selection:text-neu-accent transition-colors duration-300">
      <SettingsModal />
      
      {/* Sidebar Navigation (Desktop) */}
      <nav className="z-50 md:fixed md:left-0 md:top-0 md:h-screen w-full md:w-24 bg-neu-base flex md:flex-col items-center justify-between p-0 md:py-8 shadow-neu-flat md:shadow-none border-t md:border-t-0 border-neu-text/10 md:border-r fixed bottom-0 transition-colors duration-300">
        <div className="hidden md:flex flex-col items-center gap-2">
           <div 
             className="w-12 h-12 rounded-xl bg-neu-accent shadow-neu-icon flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform"
             onClick={() => handleToolSelect(ToolId.DASHBOARD)}
           >
             <AppIcon className="w-8 h-8" />
           </div>
        </div>

        <div className="flex md:flex-col gap-4 w-full md:w-auto justify-evenly md:justify-center overflow-x-auto md:overflow-visible no-scrollbar p-0 md:p-0">
          <div className="p-2 md:p-0">
          <NeuButton 
            className="!p-2 rounded-xl flex-shrink-0"
            active={activeTool === ToolId.DASHBOARD}
            onClick={() => handleToolSelect(ToolId.DASHBOARD)}
            title={t.app.dashboard}
          >
            <LayoutGrid size={24} />
          </NeuButton>
          </div>
          
          <div className="w-full h-0.5 bg-neu-text/10 rounded-full hidden md:block my-2"></div>

          <div className="p-2 md:p-0">
          <NeuButton 
            className="!p-2 rounded-xl flex-shrink-0"
            active={activeTool === ToolId.CATEGORY_PRODUCTIVITY}
            onClick={() => handleToolSelect(ToolId.CATEGORY_PRODUCTIVITY)}
            title={t.categories.PRODUCTIVITY}
          >
            <Zap size={24} />
          </NeuButton>
          </div>

          <div className="p-2 md:p-0">
          <NeuButton 
            className="!p-2 rounded-xl flex-shrink-0"
            active={activeTool === ToolId.CATEGORY_UTILITIES}
            onClick={() => handleToolSelect(ToolId.CATEGORY_UTILITIES)}
            title={t.categories.UTILITIES}
          >
            <Package size={24} />
          </NeuButton>
          </div>

          <div className="p-2 md:p-0">
          <NeuButton 
            className="!p-2 rounded-xl flex-shrink-0"
            active={activeTool === ToolId.CATEGORY_AI}
            onClick={() => handleToolSelect(ToolId.CATEGORY_AI)}
            title={t.categories.AI}
          >
            <Cpu size={24} />
          </NeuButton>
          </div>
        </div>

        {/* Settings Group */}
        <div className="hidden md:flex flex-col gap-4">
           <button 
             onClick={toggleLanguage}
             className="w-10 h-10 rounded-full flex items-center justify-center text-neu-text/60 hover:text-neu-accent transition-colors"
             title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
           >
             <span className="font-bold text-sm">{language === 'en' ? 'ZH' : 'EN'}</span>
           </button>

           <button 
             onClick={toggleTheme}
             className="w-10 h-10 rounded-full flex items-center justify-center text-neu-text/60 hover:text-neu-accent transition-colors"
             title="Toggle Theme"
           >
             {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
           </button>
           
           <button 
             onClick={() => setSettingsOpen(true)}
             className="w-10 h-10 rounded-full flex items-center justify-center text-neu-text/60 hover:text-neu-accent transition-colors"
             title="Settings"
           >
             <Settings size={20} />
           </button>
        </div>
      </nav>

      {/* Mobile Header for Settings (Visible only on mobile) */}
      <div className="md:hidden fixed top-0 left-0 w-full p-4 flex justify-between items-center z-40 bg-neu-base/90 backdrop-blur-sm">
        <div 
          className="w-8 h-8 rounded-lg bg-neu-accent flex items-center justify-center text-white cursor-pointer"
          onClick={() => handleToolSelect(ToolId.DASHBOARD)}
        >
          <AppIcon className="w-5 h-5" />
        </div>
        <div className="flex gap-4">
           <button onClick={toggleLanguage} className="text-neu-text/80 font-bold">
             {language === 'en' ? 'ZH' : 'EN'}
           </button>
           <button onClick={toggleTheme} className="text-neu-text/80">
             {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
           </button>
           <button onClick={() => setSettingsOpen(true)} className="text-neu-text/80">
             <Settings size={20} />
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-24 p-6 md:p-12 pb-32 md:pb-12 min-h-screen overflow-y-auto pt-20 md:pt-12">
        <div className="w-full mx-auto h-full flex flex-col justify-center">
          {renderContent()}
        </div>
      </main>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

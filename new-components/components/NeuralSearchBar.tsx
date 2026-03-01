import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Tag, Check } from 'lucide-react';

interface NeuralSearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onTagSelect: (tag: string | null) => void;
  availableTags: string[];
  placeholder?: string;
  activeTag: string | null;
}

const NeuralSearchBar: React.FC<NeuralSearchBarProps> = ({
  searchQuery,
  onSearch,
  onTagSelect,
  availableTags,
  placeholder = "Search...",
  activeTag
}) => {
  const [showTags, setShowTags] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const clearSearch = () => {
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-end gap-2 relative z-30">
      <div className="flex items-center gap-2">
        {/* Minimal Search Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pl-9 pr-8 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full text-sm w-40 focus:w-64 transition-all duration-300 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowTags(!showTags)}
          className={`p-2 rounded-full border transition-all duration-300 ${
            showTags || activeTag 
              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400' 
              : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Toggle Filters"
        >
          <Filter size={14} />
        </button>
      </div>

      {/* Collapsible Tags Area - Floating Dropdown */}
      <AnimatePresence>
        {showTags && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 sm:w-80 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 origin-top-right"
          >
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter by Tag</span>
                {activeTag && (
                    <button 
                        onClick={() => onTagSelect(null)}
                        className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                        Clear Filter
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                <FilterChip 
                    label="All" 
                    isActive={activeTag === null} 
                    onClick={() => onTagSelect(null)} 
                />
                {availableTags.map(tag => (
                <FilterChip
                    key={tag}
                    label={tag}
                    isActive={activeTag === tag}
                    onClick={() => onTagSelect(activeTag === tag ? null : tag)}
                />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Active Filter Indicator (shown when menu is closed) */}
      {!showTags && activeTag && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800"
        >
            <Tag size={10} />
            <span>{activeTag}</span>
            <button onClick={() => onTagSelect(null)} className="ml-1 hover:text-blue-800 dark:hover:text-blue-200"><X size={10}/></button>
        </motion.div>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center space-x-1.5 ${
      isActive
        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-700'
    }`}
  >
    <span>{label}</span>
    {isActive && <Check size={10} className="text-white" />}
  </button>
);

export default NeuralSearchBar;
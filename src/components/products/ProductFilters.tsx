'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface ProductFiltersProps {
  onFiltersChange: (filters: any) => void;
  categories: Array<{ id: string; name: string; nameAr: string; slug: string }>;
}

export function ProductFilters({ onFiltersChange, categories }: ProductFiltersProps) {
  const { language } = useLanguage();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  const handleFilterChange = () => {
    onFiltersChange({
      search: searchTerm,
      category: selectedCategory,
      priceMin: priceRange.min,
      priceMax: priceRange.max,
      sortBy,
      inStock: showOnlyInStock
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setShowOnlyInStock(false);
    onFiltersChange({});
  };

  return (
    <div className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] rounded-3xl p-6 shadow-2xl border border-[#DAA520]/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#DAA520]">
          {language === 'ar' ? 'تصفية المنتجات' : 'Filter Products'}
        </h3>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="md:hidden p-2 text-[#DAA520] hover:text-[#B8860B] transition-colors"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-white mb-2">
          {language === 'ar' ? 'البحث' : 'Search'}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#DAA520] w-5 h-5" />
          <input
            id="product-search"
            name="productSearch"
            type="search"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Search for products...'}
            className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#DAA520]/30 rounded-xl text-white focus:border-[#DAA520] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filters */}
      <div className={`space-y-6 ${isFiltersOpen ? 'block' : 'hidden md:block'}`}>
        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {language === 'ar' ? 'الأقسام' : 'Categories'}
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedCategory === ''
                  ? 'bg-[#DAA520] text-white'
                  : 'bg-[#3e5258]/20 text-white hover:bg-[#3e5258]/40'
                }`}
            >
              {language === 'ar' ? 'جميع الأقسام' : 'All Categories'}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedCategory === category.id
                    ? 'bg-[#DAA520] text-white'
                    : 'bg-[#3e5258]/20 text-white hover:bg-[#3e5258]/40'
                  }`}
              >
                {language === 'ar' ? ((category as any).nameAr || category.name) : category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {language === 'ar' ? 'نطاق السعر' : 'Price Range'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              id="price-min"
              name="priceMin"
              type="number"
              autoComplete="off"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              placeholder={language === 'ar' ? 'من' : 'Min'}
              className="px-3 py-2 bg-[#1a1a1a] border border-[#DAA520]/30 rounded-lg text-white focus:border-[#DAA520] focus:outline-none transition-colors"
            />
            <input
              id="price-max"
              name="priceMax"
              type="number"
              autoComplete="off"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              placeholder={language === 'ar' ? 'إلى' : 'Max'}
              className="px-3 py-2 bg-[#1a1a1a] border border-[#DAA520]/30 rounded-lg text-white focus:border-[#DAA520] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {language === 'ar' ? 'ترتيب حسب' : 'Sort By'}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#DAA520]/30 rounded-xl text-white focus:border-[#DAA520] focus:outline-none transition-colors"
          >
            <option value="newest">{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
            <option value="oldest">{language === 'ar' ? 'الأقدم' : 'Oldest'}</option>
            <option value="price-low">{language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
            <option value="price-high">{language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
            <option value="name">{language === 'ar' ? 'الاسم' : 'Name'}</option>
            <option value="popular">{language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}</option>
          </select>
        </div>

        {/* In Stock Only */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="inStock"
            checked={showOnlyInStock}
            onChange={(e) => setShowOnlyInStock(e.target.checked)}
            className="w-4 h-4 text-[#DAA520] bg-[#1a1a1a] border-[#DAA520]/30 rounded focus:ring-[#DAA520]"
          />
          <label htmlFor="inStock" className="text-white cursor-pointer">
            {language === 'ar' ? 'المتوفر فقط' : 'In Stock Only'}
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleFilterChange}
            className="flex-1 bg-[#DAA520] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#B8860B] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {language === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters'}
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-3 bg-[#3e5258] text-white rounded-xl hover:bg-[#3e5258]/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

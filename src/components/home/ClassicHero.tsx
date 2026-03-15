'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Eye, Heart } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { getFirstImageSrc } from '@/lib/image-utils';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  stockQuantity: number;
  category: {
    id: number;
    name: string;
  };
  rating?: number;
  reviewCount?: number;
}

interface HeroSlide {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  image: string;
}

interface ClassicHeroProps {
  products: Product[];
}

export function ClassicHero({ products }: ClassicHeroProps) {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Hero slides data
  const heroSlides: HeroSlide[] = [
    {
      title: language === 'ar' ? 'اكتشف مجموعتنا الأحدث' : 'Discover Our Latest Collection',
      subtitle: language === 'ar' ? 'وصل حديثاً' : 'New Arrivals',
      description: language === 'ar'
        ? 'اكتشف أحدث صيحات الموضة العربية الأصيلة والأنيقة. مجموعة متنوعة من الأزياء التقليدية والحديثة تناسب جميع المناسبات.'
        : 'Discover the latest authentic and elegant Arabic fashion trends. A diverse collection of traditional and modern clothing for all occasions.',
      buttonText: language === 'ar' ? 'تسوق الوافدات الجديدة' : 'Shop New Arrivals',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80'
    },
    {
      title: language === 'ar' ? 'تخفيضات الموسم حتى 50%' : 'Season Sale Up To 50% Off',
      subtitle: language === 'ar' ? 'وقت محدود' : 'Limited Time',
      description: language === 'ar'
        ? 'لا تفوت الفرصة! عروض خاصة على منتجات مختارة لفترة محدودة. احصل على أفضل الأسعار على الأزياء العربية الأصيلة.'
        : 'Don\'t miss out! Special offers on selected products for a limited time. Get the best prices on authentic Arabic fashion.',
      buttonText: language === 'ar' ? 'تسوق التخفيضات' : 'Shop Sale',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80'
    },
    {
      title: language === 'ar' ? 'منتجات عالية الجودة' : 'Premium Quality Products',
      subtitle: language === 'ar' ? 'مجموعة مميزة' : 'Featured Collection',
      description: language === 'ar'
        ? 'اكتشف مجموعتنا المميزة من الأزياء العربية الأصيلة. جودة عالية وتصميم أنيق مع ضمان مدى الحياة.'
        : 'Discover our premium collection of authentic Arabic fashion. High quality and elegant design with lifetime guarantee.',
      buttonText: language === 'ar' ? 'اكتشف المجموعة' : 'Explore Collection',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80'
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity > 0) {
      const result = addToCart({
        productId: product.id.toString(),
        name: product.name,
        nameAr: product.name,
        price: product.price,
        image: getFirstImageSrc(product.images as any, 'https://placehold.co/600x400/eeeeee/999999?text=No+Image'),
        quantity: 1,
        stockQuantity: product.stockQuantity,
      });

      if (result.success) {
        showToast(
          language === 'ar' ? 'تم إضافة المنتج للسلة!' : 'Product added to cart!',
          'success',
          3000
        );
      } else if (result.message) {
        showToast(
          result.message,
          'error',
          3000
        );
      }
    } else {
      showToast(
        language === 'ar' ? 'المنتج غير متوفر في المخزون' : 'Product is out of stock',
        'error',
        3000
      );
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

          {/* Left Block - Text Content */}
          <ScrollReveal
            direction="left"
            delay={200}
            className={`space-y-8 transition-all duration-1000 ease-out ${isVisible
                ? 'opacity-100 transform translate-x-0'
                : 'opacity-0 transform -translate-x-12'
              }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>{heroSlides[currentSlide].subtitle}</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {heroSlides[currentSlide].title}
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                {heroSlides[currentSlide].description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="group bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-3">
                {heroSlides[currentSlide].buttonText}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="group border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3">
                {language === 'ar' ? 'استكشف المجموعة' : 'Explore Collection'}
                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#DAA520]">500+</div>
                <div className="text-sm text-gray-600">{language === 'ar' ? 'منتج' : 'Products'}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#DAA520]">10K+</div>
                <div className="text-sm text-gray-600">{language === 'ar' ? 'عميل سعيد' : 'Happy Customers'}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#DAA520]">4.9</div>
                <div className="text-sm text-gray-600">{language === 'ar' ? 'تقييم' : 'Rating'}</div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Block - Product Showcase */}
          <ScrollReveal
            direction="right"
            delay={400}
            className={`relative transition-all duration-1000 ease-out ${isVisible
                ? 'opacity-100 transform translate-x-0'
                : 'opacity-0 transform translate-x-12'
              }`}
          >
            <div className="relative">
              {/* Main Product Image */}
              <div className="relative bg-white rounded-3xl overflow-hidden border-0 group">
                <div className="aspect-[4/3] relative">
                  <img
                    src={heroSlides[currentSlide].image}
                    alt={heroSlides[currentSlide].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-900 p-3 rounded-full hover:bg-white transition-all duration-300 shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-900 p-3 rounded-full hover:bg-white transition-all duration-300 shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Slide Indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index
                        ? 'bg-purple-600 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

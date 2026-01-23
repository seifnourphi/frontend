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

interface ModernHeroOldStyleProps {
  products: Product[];
}

export function ModernHeroOldStyle({ products }: ModernHeroOldStyleProps) {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Get featured products for hero
  const featuredProducts = products.filter(product => product.isFeatured || product.isNew).slice(0, 4);

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

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

  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity > 0) {
      const result = addToCart({
        productId: product.id.toString(),
        name: product.name,
        nameAr: product.name,
        price: product.price,
        image: getFirstImageSrc(product.images as any, '/uploads/good.png'),
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

  const getDefaultImage = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('shirt') || name.includes('t-shirt')) {
      return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('jeans')) {
      return 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('dress')) {
      return 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('suit')) {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    } else if (name.includes('jacket')) {
      return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80';
  };

  return (
    <section
      ref={heroRef}
      className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

          {/* Left Block - Promotional Banner */}
          <ScrollReveal
            direction="up"
            delay={200}
            className={`space-y-8 transition-all duration-1000 ease-out ${isVisible
                ? 'opacity-100 transform translate-y-0 translate-x-0'
                : 'opacity-0 transform translate-y-12 -translate-x-12'
              }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>{language === 'ar' ? 'وصل حديثاً' : 'New Arrivals'}</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {language === 'ar' ? (
                  <>
                    اكتشف <span className="text-purple-600">أحدث</span><br />
                    مجموعتنا
                  </>
                ) : (
                  <>
                    Discover Our <span className="text-purple-600">Latest</span><br />
                    Collection
                  </>
                )}
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                {language === 'ar'
                  ? 'اكتشف أحدث صيحات الموضة العربية الأصيلة والأنيقة. مجموعة متنوعة من الأزياء التقليدية والحديثة تناسب جميع المناسبات.'
                  : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget tortor risus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.'
                }
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button className="group bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-3">
                {language === 'ar' ? 'تسوق الوافدات الجديدة' : 'Shop New Arrivals'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </ScrollReveal>

          {/* Right Block - Product Grid/Carousel */}
          <ScrollReveal
            direction="up"
            delay={400}
            className={`relative transition-all duration-1000 ease-out ${isVisible
                ? 'opacity-100 transform translate-y-0 translate-x-0'
                : 'opacity-0 transform translate-y-12 translate-x-12'
              }`}
          >
            <div className="relative">
              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-6">
                {featuredProducts.slice(0, 4).map((product, index) => (
                  <ScrollReveal
                    key={product.id}
                    direction="up"
                    delay={600 + (index * 200)}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.images[0] || getDefaultImage(product.name)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Product Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {product.isNew && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {language === 'ar' ? 'جديد' : 'New'}
                          </span>
                        )}
                        {product.isBestseller && (
                          <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {language === 'ar' ? 'الأكثر مبيعاً' : 'Bestseller'}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-white text-gray-900 p-2 rounded-full hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-lg"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button className="bg-white text-gray-900 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#DAA520]">
                          {language === 'ar'
                            ? `ج.م ${product.price.toLocaleString('en-US')}`
                            : `EGP ${product.price.toLocaleString('en-US')}`
                          }
                        </span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              {/* Carousel Controls */}
              <ScrollReveal direction="up" delay={1400}>
                <div className="flex items-center justify-center mt-8 space-x-4">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length)}
                    className="bg-white text-gray-600 hover:text-purple-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex space-x-2">
                    {featuredProducts.slice(0, 3).map((_, index) => (
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

                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredProducts.length)}
                    className="bg-white text-gray-600 hover:text-purple-600 p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </ScrollReveal>
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

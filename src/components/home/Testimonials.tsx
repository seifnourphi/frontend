'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  rating: number;
  avatar?: string;
  avatarAr?: string;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

export function Testimonials({ testimonials = [] }: TestimonialsProps) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Default testimonials if none provided
  const defaultTestimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Ahmed',
      nameAr: 'سارة أحمد',
      title: 'Fashion Designer',
      titleAr: 'مصممة أزياء',
      content: 'The quality and elegance of RIDAA products exceeded my expectations. Every piece reflects true Arabic heritage with modern sophistication.',
      contentAr: 'جودة وأناقة منتجات رِداء تجاوزت توقعاتي. كل قطعة تعكس التراث العربي الأصيل مع الأناقة العصرية.',
      rating: 5,
      avatar: '/uploads/testimonials/sarah.jpg',
      avatarAr: '/uploads/testimonials/sarah-ar.jpg'
    },
    {
      id: '2',
      name: 'Mohamed Hassan',
      nameAr: 'محمد حسن',
      title: 'Business Owner',
      titleAr: 'صاحب شركة',
      content: 'RIDAA has become my go-to brand for authentic Arabic fashion. The attention to detail and craftsmanship is remarkable.',
      contentAr: 'أصبحت رِداء علامتي التجارية المفضلة للأزياء العربية الأصيلة. الاهتمام بالتفاصيل والحرفية رائع.',
      rating: 5,
      avatar: '/uploads/testimonials/mohamed.jpg',
      avatarAr: '/uploads/testimonials/mohamed-ar.jpg'
    },
    {
      id: '3',
      name: 'Fatima Al-Zahra',
      nameAr: 'فاطمة الزهراء',
      title: 'Fashion Blogger',
      titleAr: 'مدونة أزياء',
      content: 'The designs are absolutely stunning! RIDAA perfectly captures the essence of Arabic elegance while staying contemporary.',
      contentAr: 'التصاميم رائعة تماماً! رِداء تلتقط جوهر الأناقة العربية بشكل مثالي مع البقاء عصرية.',
      rating: 5,
      avatar: '/uploads/testimonials/fatima.jpg',
      avatarAr: '/uploads/testimonials/fatima-ar.jpg'
    },
    {
      id: '4',
      name: 'Ahmed Khalil',
      nameAr: 'أحمد خليل',
      title: 'Architect',
      titleAr: 'مهندس معماري',
      content: 'The fusion of traditional Arabic elements with modern design is exceptional. RIDAA truly understands authentic style.',
      contentAr: 'دمج العناصر العربية التقليدية مع التصميم العصري استثنائي. رِداء تفهم حقاً الأسلوب الأصيل.',
      rating: 5,
      avatar: '/uploads/testimonials/ahmed.jpg',
      avatarAr: '/uploads/testimonials/ahmed-ar.jpg'
    },
    {
      id: '5',
      name: 'Nour Ibrahim',
      nameAr: 'نور إبراهيم',
      title: 'Fashion Stylist',
      titleAr: 'مصممة أزياء',
      content: 'Working with RIDAA has been a dream. Their pieces are versatile, elegant, and perfect for any occasion.',
      contentAr: 'العمل مع رِداء كان حلماً. قطعهم متعددة الاستخدام وأنيقة ومثالية لأي مناسبة.',
      rating: 5,
      avatar: '/uploads/testimonials/nour.jpg',
      avatarAr: '/uploads/testimonials/nour-ar.jpg'
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayTestimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating
          ? 'text-[#DAA520] fill-current'
          : 'text-gray-300'
          }`}
      />
    ));
  };

  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#DAA520]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#3e5258]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-1 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-full"></div>
            <span className="text-[#DAA520] font-semibold text-sm uppercase tracking-wider">
              {language === 'ar' ? 'آراء العملاء' : 'TESTIMONIALS'}
            </span>
            <div className="w-12 h-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] rounded-full"></div>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#DAA520] via-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-6">
            {language === 'ar' ? 'ماذا يقولون' : 'What They Say'}
          </h2>

          <p className="text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            {language === 'ar'
              ? 'اكتشف آراء عملائنا الكرام حول تجربتهم مع منتجات رِداء'
              : 'Discover what our valued customers say about their experience with RIDAA products'
            }
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-full flex items-center justify-center shadow-xl hover:shadow-[#DAA520]/25 hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
            aria-label={language === 'ar' ? 'السابق' : 'Previous'}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-gradient-to-r from-[#B8860B] to-[#DAA520] rounded-full flex items-center justify-center shadow-xl hover:shadow-[#DAA520]/25 hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
            aria-label={language === 'ar' ? 'التالي' : 'Next'}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Testimonials Container */}
          <div className="overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {displayTestimonials.map((testimonial, index) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-card rounded-3xl p-8 md:p-12 shadow-2xl border border-default relative overflow-hidden">
                      {/* Background Quote Icon */}
                      <div className="absolute top-8 right-8 text-[#DAA520]/10">
                        <Quote className="w-24 h-24" />
                      </div>

                      <div className="relative z-10">
                        {/* Testimonial Content */}
                        <div className="text-center mb-8">
                          {/* Avatar */}
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#DAA520]/30 shadow-xl">
                            <img
                              src={testimonial.avatar || '/placeholder-avatar.jpg'}
                              alt={language === 'ar' ? testimonial.nameAr : testimonial.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-avatar.jpg';
                              }}
                            />
                          </div>

                          {/* Rating */}
                          <div className="flex justify-center gap-1 mb-6">
                            {renderStars(testimonial.rating)}
                          </div>

                          {/* Quote */}
                          <blockquote className="text-lg md:text-xl text-foreground/90 leading-relaxed max-w-3xl mx-auto italic">
                            "{language === 'ar' ? testimonial.contentAr : testimonial.content}"
                          </blockquote>
                        </div>

                        {/* Author Info */}
                        <div className="text-center">
                          <h4 className="text-xl font-bold text-[#DAA520] mb-2">
                            {language === 'ar' ? testimonial.nameAr : testimonial.name}
                          </h4>
                          <p className="text-foreground/70 font-medium">
                            {language === 'ar' ? testimonial.titleAr : testimonial.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {displayTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                  ? 'bg-[#DAA520] scale-125'
                  : 'bg-white/30 hover:bg-white/50'
                  }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Auto-play Toggle */}
        <div className="text-center mt-8">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${isAutoPlaying
              ? 'bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-white shadow-xl hover:shadow-[#DAA520]/25'
              : 'bg-[#3e5258]/20 text-[#3e5258] border border-[#3e5258]/40 hover:bg-[#3e5258]/30'
              }`}
          >
            <div className={`w-3 h-3 rounded-full ${isAutoPlaying ? 'bg-white' : 'bg-[#3e5258]'}`}></div>
            <span>
              {isAutoPlaying
                ? (language === 'ar' ? 'إيقاف التشغيل التلقائي' : 'Stop Auto-play')
                : (language === 'ar' ? 'تشغيل تلقائي' : 'Auto-play')
              }
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

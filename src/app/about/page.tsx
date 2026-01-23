'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ArrowRight, CheckCircle, Users, Award, Heart, Globe, Sparkles, ShieldCheck, Headphones } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [storeSettings, setStoreSettings] = useState({
    phone: '',
    email: '',
    name: '',
    nameAr: ''
  });
  const [pagesContent, setPagesContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [storeRes, pagesRes] = await Promise.all([
          fetch('/api/settings/store'),
          fetch('/api/settings/pages-content')
        ]);

        if (storeRes.ok) {
          const data = await storeRes.json();
          setStoreSettings(data.storeSettings || data.data?.storeSettings || {
            name: 'RIDAA',
            nameAr: 'رِداء'
          });
        }

        if (pagesRes.ok) {
          const data = await pagesRes.json();
          const content = data.pagesContent || data.data?.pagesContent;
          if (content) {
            setPagesContent(content);
            if (content.about?.enabled === false) {
              router.push('/');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const defaultFeatures = [
    {
      icon: <Users className="w-8 h-8" />,
      titleAr: 'عملاء سعداء',
      titleEn: 'Happy Customers',
      descriptionAr: 'أكثر من 10,000 عميل راضي يثقون بنا.',
      descriptionEn: 'Over 10,000 satisfied customers trust us.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      titleAr: 'جودة عالية',
      titleEn: 'High Quality',
      descriptionAr: 'نستخدم أفضل الخامات لضمان الجودة.',
      descriptionEn: 'We use the finest materials to ensure quality.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      titleAr: 'شغف بالتفاصيل',
      titleEn: 'Passion for Details',
      descriptionAr: 'نحن نهتم بكل التفاصيل الدقيقة في تصاميمنا.',
      descriptionEn: 'We care about every fine detail in our designs.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      titleAr: 'توصيل لكل المحافظات',
      titleEn: 'Nationwide Delivery',
      descriptionAr: 'توصيل سريع وآمن لجميع محافظات مصر.',
      descriptionEn: 'Fast and secure delivery to all governorates of Egypt.'
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      titleAr: 'تسوق آمن',
      titleEn: 'Secure Shopping',
      descriptionAr: 'طرق دفع آمنة وحماية كاملة لبياناتك.',
      descriptionEn: 'Secure payment methods and full data protection.'
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      titleAr: 'دعم مستمر',
      titleEn: '24/7 Support',
      descriptionAr: 'فريقنا متاح دائماً للإجابة على استفساراتك.',
      descriptionEn: 'Our team is always available to answer your inquiries.'
    }
  ];

  const features = defaultFeatures.map((feature: any, index: number) => {
    const contentFeature = pagesContent?.about?.features?.[index];
    return {
      ...feature,
      title: contentFeature
        ? (language === 'ar' ? contentFeature.titleAr : contentFeature.titleEn)
        : (language === 'ar' ? feature.titleAr : feature.titleEn),
      description: contentFeature
        ? (language === 'ar' ? contentFeature.descriptionAr : contentFeature.descriptionEn)
        : (language === 'ar' ? feature.descriptionAr : feature.descriptionEn)
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#DAA520] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - New Luxury Background */}
      <section className="relative h-[65vh] min-h-[550px] flex items-center justify-center overflow-hidden bg-[#0A0C10]">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={pagesContent?.about?.heroImage || "/uploads/ridaa_abstract_luxury_hero.png"}
            alt="RIDAA Luxury"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0A0C10] z-[11]" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DAA520]/10 border border-[#DAA520]/20 text-[#DAA520] text-[10px] font-bold uppercase tracking-[0.3em] mb-8 animate-in fade-in zoom-in duration-1000">
            <Sparkles className="w-3 h-3" />
            {language === 'ar' ? 'فخامة بلا حدود' : 'Limitless Luxury'}
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter animate-in fade-in slide-in-from-top-12 duration-1000">
            <span className="block text-[#DAA520] text-xl md:text-2xl font-bold tracking-[0.4em] mb-4 uppercase opacity-80">
              {storeSettings[language === 'ar' ? 'nameAr' : 'name'] || 'RIDAA'}
            </span>
            {pagesContent?.about?.heroTitleAr && pagesContent?.about?.heroTitleEn
              ? (language === 'ar' ? pagesContent.about.heroTitleAr : pagesContent.about.heroTitleEn)
              : (language === 'ar' ? 'من نحن' : 'About Us')}
          </h1>

          <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light animate-in fade-in duration-1000 delay-300">
            {pagesContent?.about?.heroSubtitleAr && pagesContent?.about?.heroSubtitleEn
              ? (language === 'ar' ? pagesContent.about.heroSubtitleAr : pagesContent.about.heroSubtitleEn)
              : (language === 'ar'
                ? 'قصتنا ترويها التفاصيل، وتكتمل بوجودك.. نُقدم لك عالماً من الأناقة العربية الفاخرة.'
                : 'Our story is told by details, and completed by your presence.. We offer you a world of luxurious Arabic elegance.'
              )}
          </p>

          <div className="mt-16 animate-pulse duration-[3000ms]">
            <div className="w-px h-24 bg-gradient-to-b from-[#DAA520] to-transparent mx-auto" />
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="animate-slide-right">
              <div className="w-12 h-1.5 bg-[#DAA520] mb-8 rounded-full" />
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                {pagesContent?.about?.storyTitleAr && pagesContent?.about?.storyTitleEn
                  ? (language === 'ar' ? pagesContent.about.storyTitleAr : pagesContent.about.storyTitleEn)
                  : (language === 'ar' ? 'إرث من الأناقة' : 'A Legacy of Elegance')}
              </h2>
              <div className="space-y-8 text-xl text-gray-500 font-light leading-relaxed">
                {pagesContent?.about?.storyContentAr && pagesContent?.about?.storyContentEn
                  ? (language === 'ar' ? pagesContent.about.storyContentAr : pagesContent.about.storyContentEn)
                    .split('\n\n')
                    .map((paragraph: string, index: number) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  : (
                    <>
                      <p>
                        {language === 'ar'
                          ? 'رِداء هو وجهتك للأناقة الأصيلة والذوق الرفيع. نقدّم تصاميم تجمع بين الأصالة والحداثة ممزوجة بحب التفاصيل.'
                          : 'RIDAA is your destination for authentic elegance and refined taste. We offer designs that blend authenticity and modernism.'
                        }
                      </p>
                      <p>
                        {language === 'ar'
                          ? 'في رِداء، نؤمن أن اللباس تعبير عن الهوية والثقة، وأن كل قطعة تحمل بصمة فريدة لصاحبها.'
                          : 'At RIDAA, we believe clothing is an expression of identity and confidence, with every piece carrying a unique fingerprint.'
                        }
                      </p>
                    </>
                  )}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-6 bg-[#DAA520]/5 rounded-[60px] blur-2xl group-hover:bg-[#DAA520]/10 transition-all duration-700" />
              <div className="relative bg-white rounded-[48px] p-16 h-[550px] flex items-center justify-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#DAA520 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="text-center relative z-10">
                  <div className="text-9xl mb-8 transform group-hover:scale-110 transition-all duration-500 cursor-default">✨</div>
                  <h3 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">
                    {pagesContent?.about?.storyImageTextAr && pagesContent?.about?.storyImageTextEn
                      ? (language === 'ar' ? pagesContent.about.storyImageTextAr : pagesContent.about.storyImageTextEn)
                      : (language === 'ar' ? 'فلسفة رِداء' : 'RIDAA Philosophy')}
                  </h3>
                  <p className="text-gray-400 text-lg max-w-xs mx-auto font-medium">
                    {pagesContent?.about?.storyImageSubtextAr && pagesContent?.about?.storyImageSubtextEn
                      ? (language === 'ar' ? pagesContent.about.storyImageSubtextAr : pagesContent.about.storyImageSubtextEn)
                      : (language === 'ar' ? 'نصنع الجمال لنلهم حواسك ونبرز تميزك' : 'We create beauty to inspire your senses and highlight your uniqueness.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Enhanced Grid */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              {pagesContent?.about?.featuresTitleAr && pagesContent?.about?.featuresTitleEn
                ? (language === 'ar' ? pagesContent.about.featuresTitleAr : pagesContent.about.featuresTitleEn)
                : (language === 'ar' ? 'لماذا تختار رِداء؟' : 'Why Choose RIDAA?')}
            </h2>
            <div className="w-24 h-1.5 mx-auto rounded-full bg-[#DAA520] mb-6 shadow-[0_2px_10px_rgba(218,165,32,0.4)]" />
            <p className="text-gray-400 max-w-2xl mx-auto font-medium">
              {pagesContent?.about?.featuresDescriptionAr && pagesContent?.about?.featuresDescriptionEn
                ? (language === 'ar' ? pagesContent.about.featuresDescriptionAr : pagesContent.about.featuresDescriptionEn)
                : (language === 'ar' ? 'نحن نضع معايير جديدة للفخامة والخدمة.' : 'We set new standards for luxury and service.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature: any, index: number) => (
              <div key={index} className="bg-white rounded-[40px] p-12 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 group hover:-translate-y-2">
                <div className="w-20 h-20 bg-[#DAA520]/10 rounded-3xl flex items-center justify-center mb-10 text-[#DAA520] group-hover:bg-[#DAA520] group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                  {feature.icon}
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-6">{feature.title}</h4>
                <p className="text-gray-500 text-base leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-[#111827] text-white p-20 rounded-[64px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#DAA520]/5 rounded-full blur-[100px] group-hover:bg-[#DAA520]/10 transition-all duration-700" />
              <ShieldCheck className="w-16 h-16 text-[#DAA520] mb-12 animate-pulse" />
              <h3 className="text-4xl font-black mb-8">
                {pagesContent?.about?.missionTitleAr && pagesContent?.about?.missionTitleEn
                  ? (language === 'ar' ? pagesContent.about.missionTitleAr : pagesContent.about.missionTitleEn)
                  : (language === 'ar' ? 'مهمتنا' : 'Our Mission')}
              </h3>
              <p className="text-2xl text-gray-400 leading-relaxed font-light">
                {pagesContent?.about?.missionContentAr && pagesContent?.about?.missionContentEn
                  ? (language === 'ar' ? pagesContent.about.missionContentAr : pagesContent.about.missionContentEn)
                  : (language === 'ar'
                    ? 'إثراء خزانة كل شخص بقطع تعيد تعريف الثقة والأناقة العربية.'
                    : 'Enriching every person\'s wardrobe with pieces that redefine Arabic confidence and elegance.'
                  )}
              </p>
            </div>

            <div className="bg-[#DAA520] text-white p-20 rounded-[64px] relative overflow-hidden group shadow-[0_40px_80px_-20px_rgba(218,165,32,0.3)]">
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/20 rounded-full blur-[100px] group-hover:bg-white/30 transition-all duration-700" />
              <Award className="w-16 h-16 text-white mb-12" />
              <h3 className="text-4xl font-black mb-8">
                {pagesContent?.about?.visionTitleAr && pagesContent?.about?.visionTitleEn
                  ? (language === 'ar' ? pagesContent.about.visionTitleAr : pagesContent.about.visionTitleEn)
                  : (language === 'ar' ? 'رؤيتنا' : 'Our Vision')}
              </h3>
              <p className="text-2xl text-white leading-relaxed font-medium">
                {pagesContent?.about?.visionContentAr && pagesContent?.about?.visionContentEn
                  ? (language === 'ar' ? pagesContent.about.visionContentAr : pagesContent.about.visionContentEn)
                  : (language === 'ar'
                    ? 'أن نكون الخيار الأول لمن يبحث عن الفخامة الحقيقية بعيداً عن التقليد.'
                    : 'To be the first choice for those seeking true luxury away from imitation.'
                  )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-[#DAA520]/5 rounded-[80px] py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#DAA520 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <h2 className="text-5xl md:text-7xl font-black text-gray-900 mb-12 tracking-tighter">
            {pagesContent?.about?.ctaTitleAr && pagesContent?.about?.ctaTitleEn
              ? (language === 'ar' ? pagesContent.about.ctaTitleAr : pagesContent.about.ctaTitleEn)
              : (language === 'ar' ? 'ابدأ رحلتك الآن' : 'Start Your Journey Now')}
          </h2>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <a
              href={pagesContent?.about?.ctaButton1Link || "/products"}
              className="group px-14 py-6 bg-gray-900 text-white rounded-3xl font-bold text-xl hover:bg-black transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-4 hover:-translate-y-2 duration-300"
            >
              {pagesContent?.about?.ctaButton1TextAr && pagesContent?.about?.ctaButton1TextEn
                ? (language === 'ar' ? pagesContent.about.ctaButton1TextAr : pagesContent.about.ctaButton1TextEn)
                : (language === 'ar' ? 'تسوّق المجموعة' : 'Shop Collection')}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </a>
            <a
              href={pagesContent?.about?.ctaButton2Link || "/contact"}
              className="px-14 py-6 bg-white text-gray-900 border-2 border-gray-200 rounded-3xl font-bold text-xl hover:border-gray-900 transition-all duration-300"
            >
              {pagesContent?.about?.ctaButton2TextAr && pagesContent?.about?.ctaButton2TextEn
                ? (language === 'ar' ? pagesContent.about.ctaButton2TextAr : pagesContent.about.ctaButton2TextEn)
                : (language === 'ar' ? 'تواصل معنا' : 'Contact Us')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
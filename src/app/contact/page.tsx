'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Mail, MapPin, Clock, MessageCircle, Facebook, Send } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [storeSettings, setStoreSettings] = useState<any>({
    phone: '',
    email: '',
    name: '',
    nameAr: '',
    socialMedia: {
      facebook: { url: '', enabled: false }
    }
  });
  const [whatsappNumber, setWhatsappNumber] = useState('+201000000000');
  const [pagesContent, setPagesContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const response = await fetch('/api/settings/store');
        if (response.ok) {
          const data = await response.json();
          setStoreSettings(data.storeSettings || {
            phone: '+20 100 000 0000',
            email: 'ridaa.store.team@gmail.com',
            name: 'RIDAA Fashion',
            nameAr: 'رِداء للأزياء'
          });
        }
      } catch (error) {
        console.error('Error fetching store settings:', error);
      }
    };

    const fetchWhatsappNumber = async () => {
      try {
        const response = await fetch('/api/settings/whatsapp');
        if (response.ok) {
          const data = await response.json();
          const number = data.whatsappNumber || data.whatsapp?.number || '+201000000000';
          if (number) {
            setWhatsappNumber(number);
          }
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
      }
    };

    const fetchPagesContent = async () => {
      try {
        const response = await fetch('/api/settings/pages-content');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.pagesContent) {
            setPagesContent(data.pagesContent);
            if (data.pagesContent.contact?.enabled === false) {
              router.push('/');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pages content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreSettings();
    fetchWhatsappNumber();
    fetchPagesContent();
  }, [router]);

  const handleGmailRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = formData.subject || (language === 'ar' ? 'استفسار جديد' : 'New Inquiry');
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${storeSettings.email}&su=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Direct & Professional */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#DAA520]/5 -z-10" />
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#DAA520]/10 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[#DAA520] font-bold tracking-[0.4em] uppercase text-[10px] md:text-sm mb-6 animate-fade-in opacity-80">
            {language === 'ar' ? 'رداء • تواصل مباشر' : 'RIDAA • DIRECT CONTACT'}
          </span>
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-gray-900 mb-8 tracking-tighter">
            {pagesContent?.contact?.heroTitleAr && pagesContent?.contact?.heroTitleEn
              ? (language === 'ar' ? pagesContent.contact.heroTitleAr : pagesContent.contact.heroTitleEn)
              : (language === 'ar' ? 'اتصل بنا' : 'Contact Us')}
          </h1>
          <div className="w-16 h-[2px] bg-[#DAA520] mx-auto mb-10 opacity-50" />
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            {pagesContent?.contact?.heroDescriptionAr && pagesContent?.contact?.heroDescriptionEn
              ? (language === 'ar' ? pagesContent.contact.heroDescriptionAr : pagesContent.contact.heroDescriptionEn)
              : (language === 'ar'
                ? 'فريقنا متاح دائماً للإجابة على استفساراتكم وتقديم المساعدة في أسرع وقت.'
                : 'Our team is always available to answer your inquiries and provide assistance promptly.'
              )}
          </p>
        </div>
      </section>

      {/* Main Content - Split Layout */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

            {/* Left Column: Contact Form */}
            <div className="flex-1 w-full order-2 lg:order-1">
              <div className="bg-white rounded-[40px] p-8 md:p-14 border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
                <div className="mb-10">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                    {language === 'ar' ? 'أرسل لنا رسالة' : 'Send a Message'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {language === 'ar' ? 'سيتم تحويلك إلى Gmail لإرسال رسالتك مباشرة.' : 'You will be redirected to Gmail to send your message directly.'}
                  </p>
                </div>

                <form className="space-y-8" onSubmit={handleGmailRedirect}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === 'ar' ? 'ادخل اسمك هنا' : 'Your name here'}
                        className="w-full bg-gray-50/50 border-b border-gray-200 focus:border-[#DAA520] transition-colors py-4 px-1 text-gray-900 placeholder:text-gray-300 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full bg-gray-50/50 border-b border-gray-200 focus:border-[#DAA520] transition-colors py-4 px-1 text-gray-900 placeholder:text-gray-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                      {language === 'ar' ? 'الموضوع' : 'Subject'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={language === 'ar' ? 'عن ماذا تود الاستفسار؟' : 'What are you inquiring about?'}
                      className="w-full bg-gray-50/50 border-b border-gray-200 focus:border-[#DAA520] transition-colors py-4 px-1 text-gray-900 placeholder:text-gray-300 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                      {language === 'ar' ? 'الرسالة' : 'Message'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                      className="w-full bg-gray-50/50 border-b border-gray-200 focus:border-[#DAA520] transition-colors py-4 px-1 text-gray-900 placeholder:text-gray-300 focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <button type="submit" className="group relative w-full bg-gray-900 text-white rounded-2xl py-6 font-bold text-sm tracking-widest uppercase overflow-hidden transition-all hover:bg-black active:scale-[0.99] shadow-2xl shadow-gray-400/20">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {language === 'ar' ? 'تواصل عبر Gmail' : 'Contact via Gmail'}
                      <Mail className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-all" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Connection Hub Sidebar */}
            <div className="lg:w-[420px] flex flex-col gap-10 order-1 lg:order-2">

              {/* Connection Sidebar */}
              <div className="space-y-6">
                <h3 className="text-[11px] font-bold text-[#DAA520] uppercase tracking-[.4em] mb-4">
                  {language === 'ar' ? 'قنواتنا الرسمية' : 'OFFICIAL CHANNELS'}
                </h3>

                {/* Refined WhatsApp Card */}
                <div className="bg-white rounded-[32px] border border-[#25D366]/10 p-8 transition-all hover:shadow-2xl hover:shadow-[#25D366]/5 group">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-[#25D366]/5 rounded-2xl flex items-center justify-center text-[#128C7E] group-hover:bg-[#25D366]/10 transition-colors">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <span className="bg-[#25D366]/10 text-[#128C7E] text-[10px] font-bold px-3 py-1 rounded-full">
                      {language === 'ar' ? 'متاح الآن' : 'LIVE NOW'}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'ar' ? 'دردشة واتساب' : 'WhatsApp Chat'}
                  </h4>
                  <p className="text-gray-400 text-xs leading-relaxed mb-8">
                    {pagesContent?.contact?.whatsappDescriptionAr && pagesContent?.contact?.whatsappDescriptionEn
                      ? (language === 'ar' ? pagesContent.contact.whatsappDescriptionAr : pagesContent.contact.whatsappDescriptionEn)
                      : (language === 'ar' ? 'تحدث مباشرة مع فريق المبيعات للحصول على مساعدة فورية.' : 'Speak directly with our sales team for immediate assistance.')}
                  </p>

                  <a
                    href={`https://wa.me/${(whatsappNumber || '+201000000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(language === 'ar' ? (pagesContent?.contact?.whatsappMessageAr || 'مرحباً، أريد الاستفسار عن المنتجات') : (pagesContent?.contact?.whatsappMessageEn || 'Hello, I want to inquire about products'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-[#128C7E] text-[#128C7E] font-bold text-sm tracking-wider uppercase hover:bg-[#128C7E] hover:text-white transition-all"
                  >
                    {pagesContent?.contact?.whatsappButtonTextAr && pagesContent?.contact?.whatsappButtonTextEn
                      ? (language === 'ar' ? pagesContent.contact.whatsappButtonTextAr : pagesContent.contact.whatsappButtonTextEn)
                      : (language === 'ar' ? 'ابدأ المحادثة' : 'Talk to Us')}
                  </a>
                </div>

                {/* Facebook Card */}
                {(pagesContent?.contact?.facebookUrl || storeSettings.socialMedia?.facebook?.url) && (
                  <div className="bg-white rounded-[32px] border border-blue-600/10 p-8 transition-all hover:shadow-2xl hover:shadow-blue-600/5 group">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 bg-blue-600/5 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600/10 transition-colors">
                        <Facebook className="w-7 h-7" />
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {language === 'ar' ? 'فيسبوك' : 'Facebook Messenger'}
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed mb-8">
                      {pagesContent?.contact?.facebookDescriptionAr && pagesContent?.contact?.facebookDescriptionEn
                        ? (language === 'ar' ? pagesContent.contact.facebookDescriptionAr : pagesContent.contact.facebookDescriptionEn)
                        : (language === 'ar' ? 'تواصل معنا عبر صفحتنا الرسمية على فيسبوك.' : 'Connect with us through our official Facebook page.')}
                    </p>

                    <a
                      href={(() => {
                        const fbUrl = pagesContent?.contact?.facebookUrl || storeSettings.socialMedia?.facebook?.url;
                        if (fbUrl && (fbUrl.includes('facebook.com') || fbUrl.includes('fb.com')) && !fbUrl.includes('m.me')) {
                          try {
                            const urlObj = new URL(fbUrl);
                            // Handle profile.php?id=...
                            if (urlObj.pathname.includes('profile.php')) {
                              const id = urlObj.searchParams.get('id');
                              if (id) return `https://m.me/${id}`;
                            }
                            // Handle standard /username
                            const path = urlObj.pathname.replace(/\/$/, '').split('/');
                            const username = path[path.length - 1];
                            if (username && username !== 'facebook.com') return `https://m.me/${username}`;
                          } catch (e) {
                            return fbUrl;
                          }
                        }
                        return fbUrl;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-blue-600 text-blue-600 font-bold text-sm tracking-wider uppercase hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {pagesContent?.contact?.facebookButtonTextAr && pagesContent?.contact?.facebookButtonTextEn
                        ? (language === 'ar' ? pagesContent.contact.facebookButtonTextAr : pagesContent.contact.facebookButtonTextEn)
                        : (language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message')}
                    </a>
                  </div>
                )}

                {/* Additional Info Block */}
                <div className="bg-gray-950 rounded-[40px] p-10 text-white relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] bg-[#DAA520]/10 rounded-full blur-[60px]" />

                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#DAA520]" />
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-1">
                          {language === 'ar' ? 'البريد الإلكتروني' : 'EMAIL ADDRESS'}
                        </p>
                        <p className="text-sm font-medium tracking-tight">{storeSettings.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#DAA520]" />
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-1">
                          {language === 'ar' ? 'الموقع' : 'LOCATION'}
                        </p>
                        <p className="text-sm font-medium">
                          {pagesContent?.contact?.addressAr && pagesContent?.contact?.addressEn
                            ? (language === 'ar' ? pagesContent.contact.addressAr : pagesContent.contact.addressEn)
                            : (language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#DAA520]" />
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-1">
                          {language === 'ar' ? 'ساعات العمل' : 'BUSINESS HOURS'}
                        </p>
                        <p className="text-sm font-medium">
                          {pagesContent?.contact?.workingHoursAr && pagesContent?.contact?.workingHoursEn
                            ? (language === 'ar' ? pagesContent.contact.workingHoursAr : pagesContent.contact.workingHoursEn)
                            : (language === 'ar' ? '9 ص - 10 م يومياً' : '9 AM - 10 PM daily')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
                    <p className="text-[11px] text-[#DAA520] font-bold italic tracking-wide">
                      {language === 'ar' ? 'نتشرف بخدمتكم دائماً في رِداء.' : 'We are honored to serve you at RIDAA.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
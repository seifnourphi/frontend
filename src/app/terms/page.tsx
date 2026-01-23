'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FileText, Shield, Lock, Eye, CreditCard, Truck, RotateCcw, Users, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [storeSettings, setStoreSettings] = useState({
    phone: '',
    email: '',
    name: '',
    nameAr: ''
  });
  const [termsContent, setTermsContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const response = await fetch('/api/settings/store');
        if (response.ok) {
          const data = await response.json();
          setStoreSettings(data.storeSettings);
        }
      } catch (error) {
        console.error('Error fetching store settings:', error);
      }
    };

    const fetchTermsContent = async () => {
      try {
        const response = await fetch('/api/settings/pages-content');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.pagesContent?.terms) {
            setTermsContent(data.pagesContent.terms);
            // Redirect if disabled
            if (data.pagesContent.terms?.enabled === false) {
              router.push('/');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching terms content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreSettings();
    fetchTermsContent();
  }, [router]);

  // Default content if API fails
  const defaultTermsContent = {
    heroTitleAr: 'الشروط وسياسة الخصوصية',
    heroTitleEn: 'Terms & Privacy Policy',
    heroDescriptionAr: 'اقرأ شروط الاستخدام وسياسة الخصوصية الخاصة بنا',
    heroDescriptionEn: 'Read our terms of use and privacy policy',
    termsTitleAr: 'شروط وأحكام الاستخدام',
    termsTitleEn: 'Terms and Conditions',
    termsLastUpdatedAr: 'آخر تحديث: 2025',
    termsLastUpdatedEn: 'Last Updated: 2025',
    termsSections: [
      {
        subtitleAr: '1. القبول',
        subtitleEn: '1. Acceptance',
        textAr: 'باستخدام موقع رِداء، أنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام موقعنا.',
        textEn: 'By using the RIDAA website, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use our website.'
      },
      {
        subtitleAr: '2. استخدام الموقع',
        subtitleEn: '2. Use of the Website',
        textAr: 'أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور.',
        textEn: 'You are responsible for maintaining the confidentiality of your account information and password.'
      },
      {
        subtitleAr: '3. المنتجات والأسعار',
        subtitleEn: '3. Products and Pricing',
        textAr: 'نحتفظ بالحق في تغيير الأسعار والمعلومات المتعلقة بالمنتجات في أي وقت دون إشعار مسبق. جميع الصور والنصوص هي لأغراض توضيحية وقد تختلف عن المنتج الفعلي.',
        textEn: 'We reserve the right to change prices and product information at any time without prior notice. All images and descriptions are for illustrative purposes and may differ from the actual product.'
      },
      {
        subtitleAr: '4. الطلبات والدفع',
        subtitleEn: '4. Orders and Payment',
        textAr: 'عند تقديم طلب، فإنك توافق على شراء المنتجات بالأسعار المذكورة. جميع المدفوعات تتم بشكل آمن من خلال أنظمة الدفع المعتمدة.',
        textEn: 'By placing an order, you agree to purchase products at the stated prices. All payments are processed securely through approved payment systems.'
      },
      {
        subtitleAr: '5. الشحن والتسليم',
        subtitleEn: '5. Shipping and Delivery',
        textAr: 'نوفر خدمة الشحن لجميع محافظات مصر. وقت التسليم التقريبي يتراوح بين 3-7 أيام عمل حسب الموقع. قد تتغير التواريخ بسبب ظروف خارجة عن إرادتنا.',
        textEn: 'We provide shipping services to all governorates in Egypt. Estimated delivery time ranges from 3-7 business days depending on location. Delivery dates may change due to circumstances beyond our control.'
      },
      {
        subtitleAr: '6. الإرجاع والاستبدال',
        subtitleEn: '6. Returns and Exchanges',
        textAr: 'يمكنك إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام بشرط أن تكون في حالتها الأصلية وبلا ضرر. بعض المنتجات قد لا تكون قابلة للإرجاع.',
        textEn: 'You may return products within 14 days of receipt, provided they are in their original condition and undamaged. Some products may not be returnable.'
      },
      {
        subtitleAr: '7. الملكية الفكرية',
        subtitleEn: '7. Intellectual Property',
        textAr: 'جميع محتويات الموقع بما في ذلك النصوص والصور والشعارات محمية بحقوق الطبع والنشر. يحظر استخدام أو نسخ أي محتوى دون إذن كتابي.',
        textEn: 'All website content including text, images, and logos are protected by copyright. Use or reproduction of any content without written permission is prohibited.'
      },
      {
        subtitleAr: '8. التعديلات',
        subtitleEn: '8. Modifications',
        textAr: 'نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. يُنصح بمراجعة هذه الصفحة بانتظام.',
        textEn: 'We reserve the right to modify these terms and conditions at any time. It is recommended to review this page regularly.'
      }
    ],
    privacyTitleAr: 'سياسة الخصوصية',
    privacyTitleEn: 'Privacy Policy',
    privacyLastUpdatedAr: 'آخر تحديث: 2025',
    privacyLastUpdatedEn: 'Last Updated: 2025',
    privacySections: [
      {
        subtitleAr: '1. المعلومات التي نجمعها',
        subtitleEn: '1. Information We Collect',
        textAr: 'نجمع المعلومات التي تقدمها لنا مباشرة مثل الاسم، البريد الإلكتروني، رقم الهاتف، والعنوان عند إتمام عملية الشراء.',
        textEn: 'We collect information you provide directly to us such as name, email, phone number, and address when completing a purchase.'
      },
      {
        subtitleAr: '2. استخدام المعلومات',
        subtitleEn: '2. How We Use Information',
        textAr: 'نستخدم المعلومات التي نجمعها لمعالجة الطلبات، التواصل معك، تحسين خدماتنا، وإرسال التحديثات والعروض الخاصة (إذا وافقت على ذلك).',
        textEn: 'We use the information we collect to process orders, communicate with you, improve our services, and send updates and special offers (if you have agreed to this).'
      },
      {
        subtitleAr: '3. حماية المعلومات',
        subtitleEn: '3. Information Protection',
        textAr: 'نتخذ تدابير أمنية قوية لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التغيير أو الكشف. جميع المعاملات تتم عبر قنوات آمنة.',
        textEn: 'We implement strong security measures to protect your personal information from unauthorized access, alteration, or disclosure. All transactions are conducted through secure channels.'
      },
      {
        subtitleAr: '4. مشاركة المعلومات',
        subtitleEn: '4. Information Sharing',
        textAr: 'لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات مع شركاء الشحن وخدمات الدفع فقط لتنفيذ طلباتك.',
        textEn: 'We do not sell or rent your personal information to third parties. We may share information with shipping partners and payment services only to fulfill your orders.'
      },
      {
        subtitleAr: '5. ملفات تعريف الارتباط (Cookies)',
        subtitleEn: '5. Cookies',
        textAr: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا، تتبع سلوك الشراء، وتخصيص المحتوى. يمكنك إدارة ملفات تعريف الارتباط من إعدادات المتصفح.',
        textEn: 'We use cookies to enhance your experience on our website, track purchasing behavior, and personalize content. You can manage cookies through your browser settings.'
      },
      {
        subtitleAr: '6. حقوقك',
        subtitleEn: '6. Your Rights',
        textAr: 'لديك الحق في الوصول إلى معلوماتك الشخصية، تحديثها، أو حذفها في أي وقت. يمكنك أيضاً إلغاء الاشتراك في رسائل البريد الإلكتروني التسويقية.',
        textEn: 'You have the right to access, update, or delete your personal information at any time. You can also unsubscribe from marketing emails.'
      },
      {
        subtitleAr: '7. روابط خارجية',
        subtitleEn: '7. External Links',
        textAr: 'قد يحتوي موقعنا على روابط لمواقع خارجية. نحن لسنا مسؤولين عن ممارسات الخصوصية لتلك المواقع.',
        textEn: 'Our website may contain links to external sites. We are not responsible for the privacy practices of those websites.'
      },
      {
        subtitleAr: '8. التغييرات على السياسة',
        subtitleEn: '8. Policy Changes',
        textAr: 'قد نحدث سياسة الخصوصية هذه من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.',
        textEn: 'We may update this privacy policy from time to time. You will be notified of any significant changes via email or a notice on the website.'
      }
    ],
    contactTitleAr: 'هل لديك أسئلة؟',
    contactTitleEn: 'Have Questions?',
    contactDescriptionAr: 'إذا كان لديك أي استفسارات حول شروط الاستخدام أو سياسة الخصوصية، يرجى التواصل معنا',
    contactDescriptionEn: 'If you have any questions about our terms or privacy policy, please contact us',
    importantNoticeTitleAr: 'مهم',
    importantNoticeTitleEn: 'Important Notice',
    importantNoticeTextAr: 'باستخدام موقع رِداء وخدماته، فإنك تقر بأنك قد قرأت وفهمت ووافقت على هذه الشروط والأحكام وسياسة الخصوصية. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام موقعنا.',
    importantNoticeTextEn: 'By using the RIDAA website and its services, you acknowledge that you have read, understood, and agree to these terms and conditions and privacy policy. If you do not agree to these terms, please do not use our website.',
    backToRegistrationTextAr: 'العودة إلى صفحة التسجيل',
    backToRegistrationTextEn: 'Back to Registration'
  };

  const content = termsContent || defaultTermsContent;

  const sections = [
    {
      icon: <FileText className="w-6 h-6" />,
      id: 'terms',
      title: language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions',
      content: {
        title: language === 'ar' ? content.termsTitleAr : content.termsTitleEn,
        lastUpdated: language === 'ar' ? content.termsLastUpdatedAr : content.termsLastUpdatedEn,
        sections: (content.termsSections || []).map((section: any) => ({
          subtitle: language === 'ar' ? section.subtitleAr : section.subtitleEn,
          text: language === 'ar' ? section.textAr : section.textEn
        }))
      }
    },
    {
      icon: <Shield className="w-6 h-6" />,
      id: 'privacy',
      title: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
      content: {
        title: language === 'ar' ? content.privacyTitleAr : content.privacyTitleEn,
        lastUpdated: language === 'ar' ? content.privacyLastUpdatedAr : content.privacyLastUpdatedEn,
        sections: (content.privacySections || []).map((section: any) => ({
          subtitle: language === 'ar' ? section.subtitleAr : section.subtitleEn,
          text: language === 'ar' ? section.textAr : section.textEn
        }))
      }
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#DAA520] to-[#B8860B] py-24 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none"
          style={{
            backgroundImage: 'url(/uploads/1761573409020-island-night-moon-scenery-digital-art-8k-wallpaper-uhdpaper.com-289@0@j.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-4 animate-slide-down">
            <span className="bg-gradient-to-r from-[#fffbe6] to-[#FFD700] bg-clip-text text-transparent block mb-2">
              {storeSettings[language === 'ar' ? 'nameAr' : 'name'] || 'RIDAA'}
            </span>
            {language === 'ar' ? content.heroTitleAr : content.heroTitleEn}
          </h1>
          <div className="w-44 h-2 mx-auto rounded-full bg-gradient-to-r from-[#fffbe6]/80 to-[#FFD700]/40 mb-4" />
          <p className="text-xl text-white/90 max-w-3xl mx-auto animate-fade-in [animation-delay:200ms]">
            {language === 'ar' ? content.heroDescriptionAr : content.heroDescriptionEn}
          </p>
        </div>
      </section>

      {/* Navigation Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <a
            href="#terms"
            className="flex items-center gap-2 bg-white border-2 border-[#DAA520] text-[#DAA520] px-6 py-3 rounded-lg font-semibold hover:bg-[#DAA520] hover:text-white transition-all shadow-md"
          >
            <FileText className="w-5 h-5" />
            {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </a>
          <a
            href="#privacy"
            className="flex items-center gap-2 bg-white border-2 border-[#DAA520] text-[#DAA520] px-6 py-3 rounded-lg font-semibold hover:bg-[#DAA520] hover:text-white transition-all shadow-md"
          >
            <Shield className="w-5 h-5" />
            {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </a>
          <Link
            href="/"
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>

      {/* Terms and Privacy Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {sections.map((section, sectionIndex) => (
          <section
            key={section.id}
            id={section.id}
            className={`mb-16 scroll-mt-24 ${sectionIndex > 0 ? 'pt-16 border-t border-gray-200' : ''}`}
          >
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#DAA520] via-[#FFD700] to-[#B8860B] rounded-full flex items-center justify-center text-white shadow-lg">
                {section.icon}
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.content.lastUpdated && (
                  <p className="text-gray-500 mt-1">
                    {section.content.lastUpdated}
                  </p>
                )}
              </div>
            </div>

            {/* Section Content */}
            <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
              {section.content.sections.map((item: any, index: number) => (
                <div key={index} className="border-l-4 border-[#DAA520] pl-6 py-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.subtitle}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Contact Section */}
        <section className="mt-16 bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-2xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              {language === 'ar' ? content.contactTitleAr : content.contactTitleEn}
            </h3>
            <p className="text-white/90 mb-6">
              {language === 'ar' ? content.contactDescriptionAr : content.contactDescriptionEn}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`mailto:${storeSettings.email || 'ridaa.store.team@gmail.com'}`}
                className="flex items-center gap-2 bg-white text-[#DAA520] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                <Mail className="w-5 h-5" />
                {storeSettings.email || 'ridaa.store.team@gmail.com'}
              </a>
              <a
                href={`tel:${storeSettings.phone || '+201000000000'}`}
                className="flex items-center gap-2 bg-white/10 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                <Users className="w-5 h-5" />
                {storeSettings.phone || '+20 100 000 0000'}
              </a>
            </div>
          </div>
        </section>

        {/* Agreement Notice */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                {language === 'ar' ? content.importantNoticeTitleAr : content.importantNoticeTitleEn}
              </h4>
              <p className="text-blue-800 leading-relaxed">
                {language === 'ar' ? content.importantNoticeTextAr : content.importantNoticeTextEn}
              </p>
            </div>
          </div>
        </div>

        {/* Back to Registration Link */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-[#DAA520] hover:text-[#B8860B] font-semibold transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            {language === 'ar' ? content.backToRegistrationTextAr : content.backToRegistrationTextEn}
          </Link>
        </div>
      </div>
    </div>
  );
}


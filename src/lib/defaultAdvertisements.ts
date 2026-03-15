// Default advertisements from old project - can be shown/hidden via settings

export interface DefaultAdvertisement {
  id: string;
  title: string;
  titleAr: string;
  subtitle?: string;
  subtitleAr?: string;
  badge?: string;
  badgeAr?: string;
  description: string;
  descriptionAr: string;
  buttonText?: string;
  buttonTextAr?: string;
  image: string;
  price?: number;
  originalPrice?: number;
  isActive: boolean;
  sortOrder: number;
  displayType: string;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    altAr?: string;
    name?: string;
    nameAr?: string;
    price?: number;
    sortOrder: number;
  }>;
  highlightedWord?: string;
  highlightedWordAr?: string;
  highlightedWordColor?: string;
  highlightedWordUnderline?: boolean;
  showDiscountBadge?: boolean;
  discountBadgePosition?: string;
}

export const DEFAULT_ADVERTISEMENTS: DefaultAdvertisement[] = [
  {
    id: 'default-2',
    title: 'Elevate Your Everyday Style',
    titleAr: 'ارتقِ بأسلوبك اليومي',
    subtitle: '',
    subtitleAr: '',
    badge: 'FALL COLLECTION 2025',
    badgeAr: 'مجموعة الخريف 2025',
    description: 'Discover our curated collection of premium essentials designed for comfort and versatility. Timeless pieces that transition seamlessly from day to night.',
    descriptionAr: 'اكتشف مجموعتنا المختارة من الأساسيات المميزة المصممة للراحة والتنوع. قطع خالدة تنتقل بسلاسة من النهار إلى الليل.',
    buttonText: 'Shop Collection',
    buttonTextAr: 'تسوق المجموعة',
    image: 'https://placehold.co/600x400/eeeeee/999999?text=No+Image',
    price: 89.99,
    originalPrice: 129.99,
    displayType: 'SINGLE',
    sortOrder: 2,
    isActive: true,
    images: [],
    highlightedWord: undefined,
    highlightedWordAr: undefined,
    highlightedWordColor: undefined,
    highlightedWordUnderline: false,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right'
  },
  {
    id: 'default-3',
    title: 'Season Sale',
    titleAr: 'عروض الموسم',
    subtitle: 'Up To 50% Off',
    subtitleAr: 'خصم حتى 50%',
    badge: 'Limited Time',
    badgeAr: 'عرض محدود',
    description: 'Discover our new collection of modern fashion at unbeatable prices. Limited time offers.',
    descriptionAr: 'اكتشف مجموعتنا الجديدة من الأزياء العصرية بأسعار لا تُقاوم. عروض محدودة لفترة قصيرة.',
    buttonText: 'Shop Sale',
    buttonTextAr: 'تسوق العروض',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    price: 64.99,
    originalPrice: 129.99,
    displayType: 'SINGLE',
    sortOrder: 3,
    isActive: true,
    images: [],
    highlightedWord: undefined,
    highlightedWordAr: undefined,
    highlightedWordColor: undefined,
    highlightedWordUnderline: false,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right'
  },
  {
    id: 'default-4',
    title: 'Premium Quality Products',
    titleAr: 'منتجات عالية الجودة',
    subtitle: 'Products',
    subtitleAr: 'المنتجات',
    badge: 'Featured Collection',
    badgeAr: 'مجموعة مميزة',
    description: 'Discover our high-quality products made from the finest materials. Handcrafted quality and lifetime warranty.',
    descriptionAr: 'اكتشف منتجاتنا عالية الجودة المصنوعة من أفضل المواد. جودة يدوية وضمان مدى الحياة.',
    buttonText: 'Explore Collection',
    buttonTextAr: 'استكشف المجموعة',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80',
    price: 89.99,
    originalPrice: 129.99,
    displayType: 'FEATURED',
    sortOrder: 4,
    isActive: true,
    images: [],
    highlightedWord: undefined,
    highlightedWordAr: undefined,
    highlightedWordColor: undefined,
    highlightedWordUnderline: false,
    showDiscountBadge: true,
    discountBadgePosition: 'top-right'
  }
];


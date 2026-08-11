export type NicheType =
  | "agency"
  | "ecommerce"
  | "portfolio"
  | "saas"
  | "restaurant"
  | "blog"
  | "education"
  | "realestate"
  | "personal";

export type FontStyle = "sans" | "serif" | "mono" | "display";
export type LanguageMode = "bn" | "en" | "bilingual";

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontStyle: FontStyle;
  borderRadius: "rounded-none" | "rounded-md" | "rounded-xl" | "rounded-3xl";
  darkMode: boolean;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
}

export interface HeroSection {
  badge: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  heroImage: string;
  showHeroImage: boolean;
  align: "left" | "center";
}

export interface AboutSection {
  title: string;
  subtitle: string;
  story: string;
  stats: StatItem[];
  image: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  badge?: string;
  icon?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  ctaText: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactConfig {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  showSocials: boolean;
  facebookUrl: string;
  linkedinUrl: string;
  whatsappNumber: string;
}

export interface ComingSoonConfig {
  enabled: boolean;
  headline: string;
  subheadline: string;
  targetLaunchDate: string;
  subscribePlaceholder: string;
  subscribeButtonText: string;
  socialMessage: string;
}

export type SectionKey =
  | "header"
  | "hero"
  | "features"
  | "services"
  | "about"
  | "testimonials"
  | "pricing"
  | "faq"
  | "contact"
  | "footer";

export interface SectionMeta {
  id: SectionKey;
  name: string;
  nameBn: string;
  visible: boolean;
}

export interface SiteConfig {
  domainName: string;
  brandName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  niche: NicheType;
  language: LanguageMode;
  theme: ThemeConfig;
  sections: SectionMeta[];
  hero: HeroSection;
  about: AboutSection;
  features: FeatureItem[];
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  pricing: PricingPlan[];
  faq: FaqItem[];
  contact: ContactConfig;
  comingSoon: ComingSoonConfig;
}

export type ViewMode = "desktop" | "tablet" | "mobile";
export type TabType = "builder" | "theme" | "ai_tools" | "domain_launch" | "export" | "sms_dashboard";

export interface FeedNumber {
  id: string;
  number: string;
  status: "SUCCESS" | "MULTI SUCCESS" | "PENDING" | "FAILED";
  country: string;
  operator: string;
  timeAgo: string;
  service: string;
  otpCode?: string;
  rawMessage?: string;
  messages?: Array<{
    code?: string;
    raw: string;
    timestamp: number;
  }>;
  requestedAt?: number;
}

export interface SmsMessage {
  id: string;
  timeAgo: string;
  operator: string;
  country: string;
  countryIso: string;
  service: string;
  serviceColor: string;
  number: string;
  otpCode: string;
  rawMessage: string;
  timestamp?: number;
}

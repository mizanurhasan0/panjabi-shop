import type { NavItem } from "@/lib/types";
import searchConfig from "./search-config.json";

export const mainNav: NavItem[] = [
  { label: "New Arrival", href: "/collections/fall-2026" },
  {
    label: "Panjabi",
    href: "/collections/men-s-panjabi",
    children: [
      {
        label: "Panjabi Collections",
        href: "/collections/men-s-panjabi",
        children: [
          { label: "Premium Panjabi", href: "/collections/premium-panjabi" },
          {
            label: "Signature Panjabi",
            href: "/collections/signature-panjabi",
          },
          { label: "Printed Panjabi", href: "/collections/printed-panjabi" },
          { label: "Luxury Panjabi", href: "/collections/luxury-panjabi" },
          { label: "Sequence Panjabi", href: "/collections/sequence-panjabi" },
        ],
      },
      {
        label: "Complete the Look",
        href: "/collections/men",
        children: [
          { label: "Waistcoat", href: "/collections/waistcoat" },
          { label: "Premium Trousers", href: "/collections/premium-trousers" },
          { label: "Watches", href: "/collections/watches" },
        ],
      },
    ],
  },
  { label: "Waistcoat", href: "/collections/waistcoat" },
  { label: "Trousers", href: "/collections/premium-trousers" },
  { label: "Watches", href: "/collections/watches" },
  { label: "All Products", href: "/collections/men" },
];

export const trendingTags = searchConfig.mobileTrendingTerms;

export const footerLinks = {
  information: [
    { label: "About YELLOW", href: "/pages/about-us" },
    { label: "Store Locator", href: "/pages/store-locator" },
    { label: "Contact Us", href: "/pages/contact-us" },
    { label: "Blogs and News", href: "/blogs/blogs-news" },
  ],
  policies: [
    { label: "Delivery Policy", href: "/pages/delivery-information" },
    { label: "Exchange Policy", href: "/pages/exchange-policy" },
    { label: "Privacy Policy", href: "/pages/privacy-policy" },
    { label: "Safety Advisory", href: "/pages/safety-advisory" },
    {
      label: "Community Guidelines",
      href: "/pages/social-media-community-guidelines",
    },
  ],
  customerService: {
    phone: "+8801958227060",
    hours: "SUNDAY-THURSDAY (10:30 AM-5:00 PM)",
    email: "customerservice@yellowclothing.net",
  },
  social: [
    { label: "Facebook", href: "https://www.facebook.com/yellowclothing" },
    { label: "Instagram", href: "https://www.instagram.com/yellowclothing" },
    { label: "TikTok", href: "https://www.tiktok.com/@yellowclothing" },
    { label: "YouTube", href: "https://www.youtube.com/yellowclothing" },
  ],
};

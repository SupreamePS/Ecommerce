import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export const NAV_LINKS = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/#menu" },
    { name: "Experience", href: "/#experience" },
    { name: "About", href: "/about" },
    { name: "Locations", href: "/#locations" },
];

export const FOOTER_LOCATIONS = [
    {
        name: "Liabduan Branch",
        address: "Address: 228/1 Soi Yothin Phatthana 7, Khlong Chan, Bang Kapi, Bangkok 10240",
        addressLines: ["228/1 Soi Yothin Phatthana 7, Khlong Chan", "Bang Kapi, Bangkok 1024"]
    },
    {
        name: "Rama 9 Branch",
        address: "15 Rama9 Soi 45 SuanLuang Bangkok 10250",
        addressLines: ["15 Rama9 Soi 45 SuanLuang", "Bangkok 10250"]
    }
];

export const FOOTER_CONTACT = [
    { type: "Liabduan Phone", value: "098 529 4032 (Liabduan)", icon: Phone },
    { type: "Rama 9 Phone", value: "092 765 5880 (Rama 9)", icon: Phone },
    { type: "Email", value: "thaanfai.bkk@gmail.com", icon: Mail }
];

export const FOOTER_HOURS = {
    title: "Open Daily",
    lunch: "Lunch: 11:00 - 14:30",
    dinner: "Dinner: 16:30 - 23:00"
};

export const FOOTER_SOCIALS = [
    { icon: Instagram, href: "https://www.instagram.com/thaanfai.bkk/" },
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61567190462212" }
];

export const FOOTER_EXPLORE = [
    { name: "Our Menus", href: "/#menu" },
    { name: "Chef's Table", href: "/#experience" },
    { name: "Catering", href: "/#catering" },
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/#careers" },
];

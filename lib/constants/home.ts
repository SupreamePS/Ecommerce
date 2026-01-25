export const HERO_CONTENT = {
    subtitle: "Borderless Grillhouse",
    title: "THAANFAI",
    description: "Where modern techniques meet the primal art of charcoal cooking.",
    cta: "Explore Menu"
};

export const HOME_INTRO = {
    text: [
        "At ",
        { text: "Thaanfai", highlight: true },
        ", we don't just grill meat. We master the flame. ",
        "A borderless exploration of flavor, cooked over primal heat."
    ]
};

export const MENU_CATEGORIES = ["Prime Selections", "Thaanfai's Signature", "Preordered Menu", "Menu", "Drinks and Desserts"];

export const MENU_ITEMS = [
    {
        category: "Prime Selections",
        items: [
            { name: "Porterhouse Wagyu MB6/7", price: "4,990 baht", desc: "Premium Australian Wagyu, raised and graded for quality and consistency.", image: "/images/porterhouse.jpg" },
            { name: "Beef au Poivre", price: "690 baht", desc: "Served with signature Au Poivre sauce", image: "/images/beef_ap.jpg" },
            { name: "Tomahawk Wagyu Steak (1.5kg)", price: "2,990 baht", desc: "Premium Australian Wagyu Tomahawk", image: "/images/tomahawk.jpg" },
            { name: "Padoo Ribeye Wagyu MB6/7", price: "1,990 baht", desc: "Australian Padoo Farm Beef — Intensely beefy, rich in flavour, and crafted for those who love a strong, authentic meat taste.", image: "/images/padoo.jpg" },
            { name: "King River Denver", price: "1,990 baht", desc: "Highly marbled Wagyu offering melt-in-the-mouth tenderness and refined richness.", image: "/images/king_river1.jpg" },
            { name: "Japanese Tenderloin Wagyu (A4-A5)", price: "2,550 baht/2,990 baht", desc: "Sourced from authentic Japanese Wagyu, this prized cut offers unmatched tenderness, subtle marbling, and an elegant, melt-in-the-mouth finish.", image: "/images/japanese_wagyu.jpg" },
        ]
    },
    {
        category: "Thaanfai's Signature",
        items: [
            { name: "Thaanfai Fried Rice", price: "990 baht", desc: "Special Beef fat fried rice with whole steak, Foie Gras, Marinated Egg Yolk and Red Onion Chips", image: "/images/thaanfai_friedrice.jpg" },
            { name: "Beef Fat Fried Rice", price: "300 baht", desc: "Beef fat fried rice with Marinated Egg Yolk and Red Onion Chips", image: "/images/beef_fried_rice.jpg" },
            { name: "Truffle Pizza with Champignon", price: "590 baht", desc: "Homemade Pizza with Truffle Sauce, Champignon, and Cheese", image: "/images/pizza_truffle1.jpg" },
            { name: "Grilled Shrimp with Spicy Sauce", price: "300 baht", desc: "Charcoal Grilled Shrimp with Spicy Sauce", image: "/images/shrimp.jpg" },
            { name: "Burrata Pesto Salad", price: "380 baht", desc: "Fresh Burrata Cheese with Pesto Sauce and Cherry Tomatoes", image: "/images/burrata1.jpg" },
            { name: "Spicy Tomato Rigatoni", price: "380 baht", desc: "Spicy Tomato chilis flakes with Rigatoni", image: "/images/rigatonni1.jpg" },
        ]
    },
    {
        category: "Preordered Menu",
        items: [
            { name: "Beef Wellington", price: "5,000 baht", desc: "A centre-cut tenderloin fillet layered with savoury mushroom duxelles and Parma ham, baked in crisp puff pastry.", image: "/images/beef_wellington.jpg" }
        ]
    },
    {
        category: "Menu",
        menuImage: "/images/menu_pic.jpg"
    },
    {
        category: "Drinks and Desserts",
        menuImage: "/images/drinks_desserts.jpg"
    }
];

export const FEATURES_DATA = [
    {
        id: "experience",
        title: "Chef's Table",
        subtitle: "Intimate Dining",
        description: "Experience the fire up close. A 12-course tasting menu prepared right in front of you by our head chef.",
        image: "/images/cheftable.jpg", // Chef cooking
        action: "Reserve Seats"
    },
    {
        id: "catering",
        title: "Catering",
        subtitle: "Private Events",
        description: "Bring the Thaanfai experience to your home or venue. Full-service charcoal grill catering for any occasion.",
        image: "/images/catering.jpg", // Banquet/Catering
        action: "Inquire Now"
    },
    {
        id: "events",
        title: "Private Events",
        subtitle: "Celebrate with Us",
        description: "Host your celebration at Thaanfai. Private rooms available for groups of 10 to 50 guests.",
        image: "/images/privateevent.jpg", // Party/Event
        action: "Book Room"
    }
];

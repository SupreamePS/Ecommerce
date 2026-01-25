"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/shared/navbar";
import LocationFooter from "@/components/shared/footer/location-footer";
import Image from "next/image";

import { ABOUT_CONTENT } from "@/lib/constants/about";

export default function AboutPage() {
    return (
        <div className="min-h-screen text-neutral-100 font-sans">
            <Navbar />

            {/* Header */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={ABOUT_CONTENT.heroImage}
                        alt="Charcoal Embers"
                        fill
                        className="object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
                </div>
                <div className="container relative z-10 px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                    >
                        {ABOUT_CONTENT.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-neutral-400 max-w-2xl mx-auto"
                    >
                        {ABOUT_CONTENT.subtitle}
                    </motion.p>
                </div>
            </section>

            {/* Content */}
            <section className="py-24 container px-4 max-w-4xl mx-auto space-y-24">
                {ABOUT_CONTENT.sections.map((section, idx) => (
                    <div key={idx} className={`grid md:grid-cols-2 gap-12 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                        <div className={`space-y-6 ${idx % 2 !== 0 ? 'order-last md:order-first' : ''}`}>
                            <h2 className="text-3xl font-bold text-primary">{section.title}</h2>
                            {section.content.map((p, i) => (
                                <p key={i} className="text-lg leading-relaxed text-neutral-300">{p}</p>
                            ))}
                        </div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900">
                            <Image
                                src={section.image}
                                alt={section.imageAlt}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                ))}
            </section>

            <LocationFooter />
        </div>
    );
}

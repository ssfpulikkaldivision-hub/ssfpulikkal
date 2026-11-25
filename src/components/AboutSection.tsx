"use client";

import { motion } from "framer-motion";
import { formatSSF } from "@/lib/ssf-formatter";

export function AboutSection() {
    return (
        <section className="py-32 bg-white">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-4">
                        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 font-sans">Our History</h2>
                        <h3 className="text-5xl md:text-6xl font-display font-medium text-black leading-tight">About {formatSSF("SSF")}</h3>
                    </div>
                    <div className="lg:col-span-8 lg:pt-14">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6">
                                {formatSSF("SSF is a movement founded in 1973 with the mission of purposefully channeling the active potential of creative studenthood and integrating it into the process of nation-building. Samastha Kerala Jamiyyathul Ulama established its student wing to bring about a moral awakening within student discourse and to cultivate a mature, organic environment for students to engage socially, culturally, and intellectually.")}
                            </p>
                            <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6">
                                {formatSSF("SSF actively intervenes across diverse spheres including value-based education, social justice, arts, constructive media, and critical politics. The organization fulfills this mission by imparting sound knowledge and direction, and by introducing students to practical social realities alongside their academic pursuits. Cultural Kerala closely watches every initiative put forward by SSF, from its campaigns, struggles, discussions, and debates to its art festivals, expos, and welfare projects.")}
                            </p>
                            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                                {formatSSF("SSF possesses a robust cadre system and organizational structure operating across national, state, district, division, sector, unit, and block levels. Overcoming social insecurities such as apoliticism, communalism, and extremism, the movement manifests the true beauty of Islam rooted in the fundamental principles of compassion for fellow beings, friendship, and tolerance. Speaking in the language of moderation and hope, SSF keeps humane thoughts alive and vibrant.")}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

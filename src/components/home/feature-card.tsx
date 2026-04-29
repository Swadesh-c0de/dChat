"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

export function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-2xl p-6 sm:p-8 bg-white/[0.02] border border-white/[0.06] cursor-default group hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="relative mb-6">
        <div className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/20 transition-all duration-300">
          {icon}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';

export function WishSection({ name, wishes }: { name: string; wishes: readonly string[] }) {
  return (
    <section className="wish-section content-section" aria-labelledby="wish-title">
      <div className="wish-card">
        <div className="wish-glint" aria-hidden="true" />
        <span className="wish-kicker">Một lá thư dành riêng cho bạn</span>
        <h2 id="wish-title">Gửi {name},</h2>
        <div className="wish-copy">
          {wishes.map((wish, index) => (
            <motion.p
              key={wish}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 0.8, delay: index * 0.12, ease: [0.65, 0, 0.35, 1] }}
            >
              {wish}
            </motion.p>
          ))}
        </div>
        <span className="wish-signature">— with all the warmest wishes</span>
      </div>
    </section>
  );
}

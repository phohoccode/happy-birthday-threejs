'use client';

import { motion } from 'framer-motion';

export function IntroScene({ name, intro, onOpen }: { name: string; intro: string; onOpen: () => void }) {
  return (
    <div className="intro-screen">
      <div className="intro-light-spill" aria-hidden="true" />
      <motion.p className="spark-message" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 1.1 }}>
        {intro.replace('nhỏ muốn gửi đến', 'đặc biệt đang chờ')}
      </motion.p>
      <button className="magic-spark" type="button" onClick={onOpen} aria-label={`Mở trải nghiệm sinh nhật dành cho ${name}`}>
        <span className="spark-core" />
        <span className="spark-orbit spark-orbit-one"><i /><i /><i /></span>
        <span className="spark-orbit spark-orbit-two"><i /><i /></span>
      </button>
      <motion.span className="spark-instruction" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.45, duration: 1 }}>
        Chạm vào ánh sáng.
      </motion.span>
    </div>
  );
}

export type Memory = {
  src: string;
  alt: string;
  caption: string;
};

export const birthdayConfig = {
  name: 'Quốc Việt',
  birthday: '15/09',
  age: 22,
  intro: 'Có một điều nhỏ muốn gửi đến bạn...',
  wishes: [
    'Chúc bạn luôn dịu dàng với chính mình, ngay cả trong những ngày mọi thứ chẳng đi theo kế hoạch.',
    'Chúc những điều bạn đang ấp ủ sẽ tìm được đúng thời điểm để nở hoa.',
    'Và chúc bạn luôn có thật nhiều lý do để mỉm cười — theo cách rạng rỡ nhất của riêng bạn.',
  ],
  finalMessage: 'Cảm ơn vì đã xuất hiện trên thế giới này.',
  secretMessage: 'Món quà đẹp nhất của hôm nay, chính là nụ cười của bạn.',
  memories: [
    {
      src: '/memories/rooftop.png',
      alt: 'Một buổi tối ấm áp dưới ánh đèn trên sân thượng',
      caption: 'Những buổi tối chẳng cần vội vàng.',
    },
    {
      src: '/memories/shoreline.png',
      alt: 'Hai người bạn đi bên nhau trên bờ biển lúc hoàng hôn',
      caption: 'Những con đường đẹp hơn khi mình đi cùng nhau.',
    },
    {
      src: '/memories/candlelight.png',
      alt: 'Một chiếc bàn kỷ niệm dưới ánh nến',
      caption: 'Những điều nhỏ bé mà mình sẽ nhớ thật lâu.',
    },
  ] satisfies Memory[],
  music: '/music/birthday.mp3',
  cinematicTimeline: {
    portal: 0,
    warp: 2.7,
    worldReveal: 6.5,
    cakeReveal: 9.3,
    candle: 11.2,
    fireworks: 14.4,
  },
} as const;

export type BirthdayConfig = typeof birthdayConfig;

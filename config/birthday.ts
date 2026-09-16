export const BIRTHDAY_TEMPLATES = [
  { id: 'midnight-wish', name: 'Midnight Wish' },
  { id: 'pink-dream', name: 'Pink Dream' },
  { id: 'golden-night', name: 'Golden Night' },
  { id: 'galaxy-birthday', name: 'Galaxy Birthday' },
  { id: 'minimal-birthday', name: 'Minimal Birthday' },
] as const;

export type BirthdayTemplateId = (typeof BIRTHDAY_TEMPLATES)[number]['id'];

export type Memory = {
  id: string;
  src: string;
  storagePath?: string;
  alt: string;
  caption: string;
};

export type BirthdayEffects = {
  balloons: boolean;
  fireworks: boolean;
  confetti: boolean;
  aurora: boolean;
  memoryGalaxy: boolean;
  giftScene: boolean;
};

export type GuestBookConfig = {
  enabled: boolean;
  showGalaxy: boolean;
  showAuthor: boolean;
};

export const DEFAULT_GUEST_BOOK_CONFIG: GuestBookConfig = {
  enabled: true,
  showGalaxy: true,
  showAuthor: true,
};

export function getGuestBookConfig(config: Pick<BirthdayConfig, 'guestBook'>): GuestBookConfig {
  return { ...DEFAULT_GUEST_BOOK_CONFIG, ...config.guestBook };
}

export type BirthdayConfig = {
  recipientName: string;
  age: number;
  birthday: string;
  title: string;
  intro: string;
  wishes: string[];
  finalMessage: string;
  secretMessage: string;
  primaryColor: string;
  theme: BirthdayTemplateId;
  memories: Memory[];
  music: {
    src: string;
    storagePath?: string;
    name: string;
    volume: number;
  } | null;
  effects: BirthdayEffects;
  guestBook?: GuestBookConfig;
  cinematicTimeline: {
    portal: number;
    warp: number;
    worldReveal: number;
    cakeReveal: number;
    candle: number;
    fireworks: number;
  };
};

export const birthdayConfig: BirthdayConfig = {
  recipientName: 'Quốc Việt',
  age: 22,
  birthday: '15/09',
  title: 'Một bầu trời dành riêng cho bạn',
  intro: 'Có một điều đặc biệt đang chờ bạn...',
  wishes: [
    'Chúc bạn luôn dịu dàng với chính mình, ngay cả trong những ngày mọi thứ chẳng đi theo kế hoạch.',
    'Chúc những điều bạn đang ấp ủ sẽ tìm được đúng thời điểm để nở hoa.',
    'Và chúc bạn luôn có thật nhiều lý do để mỉm cười — theo cách rạng rỡ nhất của riêng bạn.',
  ],
  finalMessage: 'Cảm ơn vì đã xuất hiện trên thế giới này.',
  secretMessage: 'Món quà đẹp nhất của hôm nay, chính là nụ cười của bạn.',
  primaryColor: '#f7d774',
  theme: 'midnight-wish',
  memories: [
    {
      id: 'rooftop',
      src: '/memories/rooftop.png',
      alt: 'Một buổi tối ấm áp dưới ánh đèn trên sân thượng',
      caption: 'Những buổi tối chẳng cần vội vàng.',
    },
    {
      id: 'shoreline',
      src: '/memories/shoreline.png',
      alt: 'Hai người bạn đi bên nhau trên bờ biển lúc hoàng hôn',
      caption: 'Những con đường đẹp hơn khi mình đi cùng nhau.',
    },
    {
      id: 'candlelight',
      src: '/memories/candlelight.png',
      alt: 'Một chiếc bàn kỷ niệm dưới ánh nến',
      caption: 'Những điều nhỏ bé mà mình sẽ nhớ thật lâu.',
    },
  ],
  music: {
    src: '/music/birthday.mp3',
    name: 'Birthday melody',
    volume: 0.35,
  },
  effects: {
    balloons: true,
    fireworks: true,
    confetti: true,
    aurora: true,
    memoryGalaxy: true,
    giftScene: true,
  },
  guestBook: {
    enabled: true,
    showGalaxy: true,
    showAuthor: true,
  },
  cinematicTimeline: {
    portal: 0,
    warp: 2.7,
    worldReveal: 6.5,
    cakeReveal: 9.3,
    candle: 11.2,
    fireworks: 14.4,
  },
};

export function createBirthdayConfig(): BirthdayConfig {
  return structuredClone(birthdayConfig);
}

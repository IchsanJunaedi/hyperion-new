export interface GalleryEntry {
  slug: string;
  title: string;
  division: string;
  tournament_date: string;
  position: string;
  status: string;
  logo: string | null;
  preview_images: string[];
  description: string;
}

export const GALLERIES: GalleryEntry[] = [
  {
    slug: "liga-esport-nasional-pelajar-2024",
    title: "Liga Esport Nasional Pelajar 2024",
    division: "Mobile Legends: Bang Bang",
    tournament_date: "2024",
    position: "Juara 1",
    status: "Online",
    logo: null,
    preview_images: [
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
    ],
    description:
      "Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara.",
  },
  {
    slug: "rrq-mabar-esports-tournament-season-4",
    title: "RRQ MABAR Esports Tournament Season 4",
    division: "Mobile Legends: Bang Bang",
    tournament_date: "2024",
    position: "Champion",
    status: "Online",
    logo: null,
    preview_images: [
      "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
    ],
    description:
      "Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final melawan SMAK Yos Sudarso Batam.",
  },
  {
    slug: "h3ro-rookie-tournament-4",
    title: "H3RO ROOKIE TOURNAMENT 4.0",
    division: "Mobile Legends: Bang Bang",
    tournament_date: "2023",
    position: "Champion",
    status: "Offline",
    logo: null,
    preview_images: [
      "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
    ],
    description:
      "H3RO Esports 4.0 is the 4th edition of the event organized by H3RO. Champion qualifies to Seleknas IESF 2023.",
  },
];

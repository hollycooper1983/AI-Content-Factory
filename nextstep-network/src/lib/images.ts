// Images generated with fal.ai (nano-banana-2 for photography, FLUX.1 schnell for
// fictional headshots). They load from fal's CDN by default. Run
// `node scripts/fetch-images.mjs` to download them into public/images and set
// NEXT_PUBLIC_LOCAL_IMAGES=true to serve them from your own site instead.

const FAL = "https://v3b.fal.media/files/b/0aaf8dc8/";
const local = process.env.NEXT_PUBLIC_LOCAL_IMAGES === "true";

export const IMAGE_SOURCES = {
  hero: ["9PslRPr2GbXCccfKwXJsT_ShNAcUV4.webp", "hero-students.webp"],
  banner: ["5lqOJ8TVeJLam5rmECC1B_KGOxjYY4.webp", "banner-network.webp"],
  lab: ["ZT7tvUR65vmo8vnUD-xqu_IKMEAs78.webp", "lab-student.webp"],
  online: ["LBr8VObD-NBnqOdckkd41_6jA9EnfC.webp", "online-student.webp"],
  jordan: ["49cBzDGtqjN2d7rgeJXmp.jpg", "avatar-jordan.jpg"],
  maya: ["mjtfBsV01py6jKkQ6LG96.jpg", "avatar-maya.jpg"],
  sofia: ["pFgq_MNDOGC8Ncnt8zJef.jpg", "avatar-sofia.jpg"],
  aaliyah: ["rg1WtV5Q8XmPZ8UDAAIYj.jpg", "avatar-aaliyah.jpg"],
  counselor: ["KPxaF4bmIUPLB3jhAN6O3.jpg", "avatar-counselor.jpg"],
  mentor: ["G-677zQz5mvV2yyd22qdB.jpg", "avatar-mentor.jpg"],
  daniel: ["OS6ZD8gXCj4LDb7_ovtAu.jpg", "avatar-daniel.jpg"],
  ethan: ["TKosCZrLCr1a2FeAtiGdo.jpg", "avatar-ethan.jpg"],
} as const;

export type ImageKey = keyof typeof IMAGE_SOURCES;

export const img = (k: ImageKey) => (local ? `/images/${IMAGE_SOURCES[k][1]}` : FAL + IMAGE_SOURCES[k][0]);

import { IN, ART_HANG_CENTER } from '../constants.js';
import { sanityClient } from '../lib/sanity.js';
import { fetchSanityArtworks } from '../utils/sanityArtworks.js';

// Seed catalogue — the single source for the SQLite seed (server.js) and the
// client's offline fallback when the API is unreachable.
export const seedArtworks = [
  {
    id: '55734ebd-d18e-44cd-845f-79f5df7f069f',
    sanityId: '55734ebd-d18e-44cd-845f-79f5df7f069f',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Mount Everest Sunrise",
    artist: "G. B. Thapa",
    year: "2016",
    medium: "Oil on Canvas",
    description: "Mount Everest Sunrise by G. B. Thapa. Oil on Canvas, 2016. From $340.",
    audioText: "Mount Everest Sunrise by G. B. Thapa, 2016. Oil on Canvas. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F30473663488419a8f590620ae0fa5d5b5ac6d46c-1440x1080.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F30473663488419a8f590620ae0fa5d5b5ac6d46c-1440x1080.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'partition_front',
    position: [0,1.8,2.2],
    rotation: [0,0,0],
    widthIn: 22,
    heightIn: 15,
    status: 'available',
  },
  {
    id: 'cc5b043f-d0d5-4a53-b404-2f4c82b8372a',
    sanityId: 'cc5b043f-d0d5-4a53-b404-2f4c82b8372a',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Machhapuchhre in the Himalayas",
    artist: "G. B. Thapa",
    year: "2019",
    medium: "Oil on Canvas",
    description: "Machhapuchhre in the Himalayas by G. B. Thapa. Oil on Canvas, 2019. From $320.",
    audioText: "Machhapuchhre in the Himalayas by G. B. Thapa, 2019. Oil on Canvas. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F800677037e924e8527bd321229c95f54fdfcd56f-1438x1055.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F800677037e924e8527bd321229c95f54fdfcd56f-1438x1055.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'partition_front',
    position: [-2.2,1.8,2.2],
    rotation: [0,0,0],
    widthIn: 22,
    heightIn: 15,
    status: 'available',
  },
  {
    id: '347ae1d0-6253-40d7-919d-6e361d2428b2',
    sanityId: '347ae1d0-6253-40d7-919d-6e361d2428b2',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Peaceful Buddha ",
    artist: "Mangol Putra",
    year: "2022",
    medium: "Acrylic on Canvas",
    description: "Peaceful Buddha  by Mangol Putra. Acrylic on Canvas, 2022. From $300.",
    audioText: "Peaceful Buddha  by Mangol Putra, 2022. Acrylic on Canvas. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F12fc1b65ce679cdbd8cb9d080bfe351e8b8bd682-1440x1920.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F12fc1b65ce679cdbd8cb9d080bfe351e8b8bd682-1440x1920.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'partition_front',
    position: [2.2,1.8,2.2],
    rotation: [0,0,0],
    widthIn: 18,
    heightIn: 24,
    status: 'available',
  },
  {
    id: 'dd5778cd-7e51-40fb-b553-6d8c722b5fe0',
    sanityId: 'dd5778cd-7e51-40fb-b553-6d8c722b5fe0',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Textured Red & Blue Buddha Portrait – Contemporary Nepal Art",
    artist: "Chandra",
    year: "2022",
    medium: "Acrylic on Canvas with Sand-Texture Finish.",
    description: "This piece uses splattered textures and contrasting cool/warm tones to symbolize enlightenment. Focuses on Unique Buddha Painting and Kathmandu Fine Art.\n\n\n",
    audioText: "Textured Red & Blue Buddha Portrait – Contemporary Nepal Art by Chandra, 2022. Acrylic on Canvas with Sand-Texture Finish.. This piece uses splattered textures and contrasting cool/warm tones to symbolize enlightenment. Focuses on Unique Buddha Painting and Kathmandu Fine Art.\n\n\n",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F7486f258be568937193d61bb87cc439173033cc2-1440x1920.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F7486f258be568937193d61bb87cc439173033cc2-1440x1920.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'partition_back',
    position: [0,1.8,1.8],
    rotation: [0,3.141592653589793,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '75982f4b-8e3c-46c0-8165-d4e38f81169f',
    sanityId: '75982f4b-8e3c-46c0-8165-d4e38f81169f',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Kathmandu Valley with Ganesh Himal",
    artist: "G. B. Thapa",
    year: "2019",
    medium: "Oil on Canvas",
    description: "Kathmandu Valley with Ganesh Himal",
    audioText: "Kathmandu Valley with Ganesh Himal by G. B. Thapa, 2019. Oil on Canvas. Kathmandu Valley with Ganesh Himal",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Ff696eedf2a197a7e9f8878f4e3e54a7783a64193-1439x753.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Ff696eedf2a197a7e9f8878f4e3e54a7783a64193-1439x753.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'partition_back',
    position: [-2.2,1.8,1.8],
    rotation: [0,3.141592653589793,0],
    widthIn: 48,
    heightIn: 24,
    status: 'available',
  },
  {
    id: '8b571588-47d2-48fd-87b3-dc8db3193e58',
    sanityId: '8b571588-47d2-48fd-87b3-dc8db3193e58',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Eternal Calm Buddha",
    artist: "Mangol Putra",
    year: "2019",
    medium: "Acrylic on Canvas",
    description: "Eternal Calm Buddha by Mangol Putra. Acrylic on Canvas, 2019. From $500.",
    audioText: "Eternal Calm Buddha by Mangol Putra, 2019. Acrylic on Canvas. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F0f39fff5e2669b33ab85cb89fc8d2e04384b682a-1440x1919.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F0f39fff5e2669b33ab85cb89fc8d2e04384b682a-1440x1919.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'partition_back',
    position: [2.2,1.8,1.8],
    rotation: [0,3.141592653589793,0],
    widthIn: 16,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '9b5a1321-261f-4438-8917-eb27bcd99bcd',
    sanityId: '9b5a1321-261f-4438-8917-eb27bcd99bcd',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Moody Crimson Red Buddha Acrylic Art – Fine Art Nepal",
    artist: "Chandra",
    year: "2022",
    medium: "Acrylic on Canvas with Sand-Texture Finish.",
    description: "Moody Crimson Red Buddha Acrylic Art – Fine Art Nepal by Chandra. Acrylic on Canvas with Sand-Texture Finish., 2022. From $240.",
    audioText: "Moody Crimson Red Buddha Acrylic Art – Fine Art Nepal by Chandra, 2022. Acrylic on Canvas with Sand-Texture Finish.. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F91fdf5dcf05c79b4fd1a7d86c2a422dbf3cd37b0-1196x1661.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F91fdf5dcf05c79b4fd1a7d86c2a422dbf3cd37b0-1196x1661.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [0,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '6995f2a4-ba17-43ec-bea9-972aa5a27546',
    sanityId: '6995f2a4-ba17-43ec-bea9-972aa5a27546',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Original Blue & Gold Buddha Face Acrylic Painting",
    artist: "Chandra",
    year: "2022",
    medium: "Acrylic on Canvas with Sand-Texture Finish.",
    description: "Royal peace. This high-texture piece blends cobalt curls with a golden face and a striking red tilak. Targets keywords like Blue Buddha Art, Original Art Kathmandu, and Modern Spiritual Decor.\"\n\n\n",
    audioText: "Original Blue & Gold Buddha Face Acrylic Painting by Chandra, 2022. Acrylic on Canvas with Sand-Texture Finish.. Royal peace. This high-texture piece blends cobalt curls with a golden face and a striking red tilak. Targets keywords like Blue Buddha Art, Original Art Kathmandu, and Modern Spiritual Decor.\"\n\n\n",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F5cb9a49e6f882a606c1bfad05ee75bb237f0bd04-1255x1864.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F5cb9a49e6f882a606c1bfad05ee75bb237f0bd04-1255x1864.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [-2.25,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: 'f993bcb2-140e-47d9-9aca-b3d226f2e885',
    sanityId: 'f993bcb2-140e-47d9-9aca-b3d226f2e885',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Original Jade Green Buddha Painting – Biophilic Design Art",
    artist: "Chandra",
    year: "2022",
    medium: "Acrylic on Canvas with Sand-Texture Finish.",
    description: "Original Jade Green Buddha Painting – Biophilic Design Art by Chandra. Acrylic on Canvas with Sand-Texture Finish., 2022. From $240.",
    audioText: "Original Jade Green Buddha Painting – Biophilic Design Art by Chandra, 2022. Acrylic on Canvas with Sand-Texture Finish.. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F2a05639087420d12c404b2237990cc9a7119251c-1355x1875.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F2a05639087420d12c404b2237990cc9a7119251c-1355x1875.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [2.25,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '31b52c6f-dde0-43e9-a392-3341f7276e2d',
    sanityId: '31b52c6f-dde0-43e9-a392-3341f7276e2d',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Heritage Gold & Blue Buddha Face – Luxury Nepalese Artwork",
    artist: "Chandra",
    year: "2022",
    medium: "Acrylic on Canvas with Sand-Texture Finish.",
    description: "A classic pairing for Heritage Maximalism. The golden glow and vibrant blue hair capture the Soul of the Valley. Keywords: Luxury Nepal Art, Gold Buddha Wall Art, Authentic Kathmandu Painting.\n\n\n",
    audioText: "Heritage Gold & Blue Buddha Face – Luxury Nepalese Artwork by Chandra, 2022. Acrylic on Canvas with Sand-Texture Finish.. A classic pairing for Heritage Maximalism. The golden glow and vibrant blue hair capture the Soul of the Valley. Keywords: Luxury Nepal Art, Gold Buddha Wall Art, Authentic Kathmandu Painting.\n\n\n",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F4688af0f58588d4971eeb5c6300c3896ce6f2885-1274x1924.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F4688af0f58588d4971eeb5c6300c3896ce6f2885-1274x1924.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [-4.5,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '2940edb7-3713-4017-8829-e30ff1cf2fa3',
    sanityId: '2940edb7-3713-4017-8829-e30ff1cf2fa3',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Vibrant Chartreuse Buddha Art – Modern Zen Statement Piece",
    artist: "Chandra",
    year: "2022",
    medium: "Acrylic on Canvas with Sand-Texture Finish.",
    description: "Bold and Neo-Pop. This neon-lime and gold variation targets the Floral Pop and vibrant color intensity trends of 2026. Keywords: Bold Buddha Painting, Modern Zen Art, Neon Spiritual Decor.\n",
    audioText: "Vibrant Chartreuse Buddha Art – Modern Zen Statement Piece by Chandra, 2022. Acrylic on Canvas with Sand-Texture Finish.. Bold and Neo-Pop. This neon-lime and gold variation targets the Floral Pop and vibrant color intensity trends of 2026. Keywords: Bold Buddha Painting, Modern Zen Art, Neon Spiritual Decor.\n",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F186f5f0d1213ab57cf3d7dbc8bac320e599c5ea3-1276x1786.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F186f5f0d1213ab57cf3d7dbc8bac320e599c5ea3-1276x1786.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [4.5,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'sold',
  },
  {
    id: '0fe7951b-7092-44f1-9afb-dbf8afae984d',
    sanityId: '0fe7951b-7092-44f1-9afb-dbf8afae984d',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "The Iconic Spire of Machapuchare (Fishtail Mountain)",
    artist: "G. B. Thapa",
    year: "2018",
    medium: "Oil on Canvas",
    description: "Known as the \"Holy Mountain,\" Machapuchare is a forbidden gem of the Himalayas. Because it is sacred to the local people, it remains unclimbed. This perspective shows why it's called \"Fishtail\"—the sheer rock and ice rise sharply, dominating the skyline of the Annapurna trekking circuit and serving as a silent guardian of the sanctuary.",
    audioText: "The Iconic Spire of Machapuchare (Fishtail Mountain) by G. B. Thapa, 2018. Oil on Canvas. Known as the \"Holy Mountain,\" Machapuchare is a forbidden gem of the Himalayas. Because it is sacred to the local people, it remains unclimbed. This perspective shows why it's called \"Fishtail\"—the sheer rock and ice rise sharply, dominating the skyline of the Annapurna trekking circuit and serving as a silent guardian of the sanctuary.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F8528605b5cc757383a51d2a5c7376a3f67ce9388-883x1318.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F8528605b5cc757383a51d2a5c7376a3f67ce9388-883x1318.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [-6.75,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '1e3b0d28-dd63-4893-9b98-a0647ba8fe4b',
    sanityId: '1e3b0d28-dd63-4893-9b98-a0647ba8fe4b',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Mount Everest and the Nuptse Ridge",
    artist: "G. B. Thapa",
    year: "2020",
    medium: "Oil on Canvas",
    description: "From the top of Kala Patthar, the scale of the world changes. The massive wall of Nuptse stands in the foreground, draped in snow, while the dark, windswept pyramid of Mount Everest—the highest point on Earth—peeks out from behind. It’s a breathtaking moment where the golden hour light turns the \"Roof of the World\" into a masterpiece of rock and ice.",
    audioText: "Mount Everest and the Nuptse Ridge by G. B. Thapa, 2020. Oil on Canvas. From the top of Kala Patthar, the scale of the world changes. The massive wall of Nuptse stands in the foreground, draped in snow, while the dark, windswept pyramid of Mount Everest—the highest point on Earth—peeks out from behind. It’s a breathtaking moment where the golden hour light turns the \"Roof of the World\" into a masterpiece of rock and ice.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F2c58635ce6c366ed38a00bee9bf1f7fc75a3bab0-915x1393.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F2c58635ce6c366ed38a00bee9bf1f7fc75a3bab0-915x1393.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'back',
    position: [6.75,1.8,-9.8],
    rotation: [0,0,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '7dc628dd-3cbd-4181-a429-35d06521c6e4',
    sanityId: '7dc628dd-3cbd-4181-a429-35d06521c6e4',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "The Majestic Peak of Ama Dablam, Nepal Himalayas",
    artist: "G. B. Thapa",
    year: "2018",
    medium: "Oil on Canvas",
    description: "Ama Dablam is often called the \"Mother’s Necklace.\" The name refers to the long ridges that spread out like a mother’s arms and the hanging glacier that resembles a traditional Sherpa pendant. For many trekkers, this is the most beautiful mountain in Nepal, standing as a sharp, elegant needle against the deep Himalayan sky.",
    audioText: "The Majestic Peak of Ama Dablam, Nepal Himalayas by G. B. Thapa, 2018. Oil on Canvas. Ama Dablam is often called the \"Mother’s Necklace.\" The name refers to the long ridges that spread out like a mother’s arms and the hanging glacier that resembles a traditional Sherpa pendant. For many trekkers, this is the most beautiful mountain in Nepal, standing as a sharp, elegant needle against the deep Himalayan sky.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Ff7986fb0561f331dd56ba49e98a858a1e7019aff-917x1389.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Ff7986fb0561f331dd56ba49e98a858a1e7019aff-917x1389.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,0],
    rotation: [0,1.5707963267948966,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '9a8166c6-688e-4abf-a92e-f4d97df1462e',
    sanityId: '9a8166c6-688e-4abf-a92e-f4d97df1462e',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Massive Snow Wall of Annapurna South and Hiunchuli",
    artist: "G. B. Thapa",
    year: "2020",
    medium: "Oil on Canvas",
    description: "Standing at the base of Annapurna South is a humbling experience. This massive wall of snow and ice creates a natural amphitheater within the Annapurna Sanctuary. The mountain is so large it seems to create its own weather, with clouds often swirling around the 7,219-meter summit, reminding every visitor of the raw, untamed power of the high Himalayas.",
    audioText: "Massive Snow Wall of Annapurna South and Hiunchuli by G. B. Thapa, 2020. Oil on Canvas. Standing at the base of Annapurna South is a humbling experience. This massive wall of snow and ice creates a natural amphitheater within the Annapurna Sanctuary. The mountain is so large it seems to create its own weather, with clouds often swirling around the 7,219-meter summit, reminding every visitor of the raw, untamed power of the high Himalayas.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F7d5aac1cb4baae1c35a3bc77e024ed1b05f7e6bc-923x1389.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F7d5aac1cb4baae1c35a3bc77e024ed1b05f7e6bc-923x1389.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,-2.25],
    rotation: [0,1.5707963267948966,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: 'f642eef9-f45b-498e-a574-2e36fdb261f2',
    sanityId: 'f642eef9-f45b-498e-a574-2e36fdb261f2',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Machapuchare Mountain Nepal - Heavy Impasto Oil Painting",
    artist: "G. B. Thapa",
    year: "2020",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A majestic Himalayan landscape featuring the iconic, pointed peak of Mount Machapuchare (Fishtail) rising above the clouds. In the foreground, a traditional suspension bridge spans a deep gorge, carrying a line of pack animals and a herder.\n\nSymbolism (Key details): The painting contrasts the eternal majesty of the sacred mountain with the daily resilience of human life and trade below. The bridge acts as a symbol of connection in an awe-inspiring, unforgiving environment.\n\nTechnique (Materials/Craft): The artist uses a heavy impasto technique, applying thick layers of oil paint with a palette knife. This method creates a tangible, three-dimensional texture on the canvas, bringing the jagged rock faces, fluffy clouds, and dense gorge foliage to life.",
    audioText: "Machapuchare Mountain Nepal - Heavy Impasto Oil Painting by G. B. Thapa, 2020. Oil on Canvas. Subject (Scene): A majestic Himalayan landscape featuring the iconic, pointed peak of Mount Machapuchare (Fishtail) rising above the clouds. In the foreground, a traditional suspension bridge spans a deep gorge, carrying a line of pack animals and a herder.\n\nSymbolism (Key details): The painting contrasts the eternal majesty of the sacred mountain with the daily resilience of human life and trade below. The bridge acts as a symbol of connection in an awe-inspiring, unforgiving environment.\n\nTechnique (Materials/Craft): The artist uses a heavy impasto technique, applying thick layers of oil paint with a palette knife. This method creates a tangible, three-dimensional texture on the canvas, bringing the jagged rock faces, fluffy clouds, and dense gorge foliage to life.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Ff6fea5a587d4bda902ad21b20008a6e0c1c1d8ae-915x1376.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Ff6fea5a587d4bda902ad21b20008a6e0c1c1d8ae-915x1376.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,2.25],
    rotation: [0,1.5707963267948966,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: '8f4c2261-7b1b-49d6-a486-62ca321874fa',
    sanityId: '8f4c2261-7b1b-49d6-a486-62ca321874fa',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Mount Everest Glacier Landscape - Original Impasto Oil Painting",
    artist: "G. B. Thapa",
    year: "2020",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A breathtaking, high-altitude view of the Mount Everest (Sagarmatha) massif. The composition highlights the windswept, dark rock pyramid of the peak, a massive, tumbling glacier in the valley below, and a still glacial lake.\n\nSymbolism (Key details): The mountain represents the absolute pinnacle of the natural world—a place of immense power and cold isolation. The prayer flags at the base introduce a human element of reverence, offering prayers to the \"Goddess Mother of the World.\"\n\nTechnique (Materials/Craft): This piece is defined by extremely aggressive, sculptural impasto. The artist uses a palette knife to physically sculpt the ridges, snowdrifts, and broken glacial ice directly onto the canvas with heavy oil paint, emphasizing the freezing, harsh reality of the alpine environment.",
    audioText: "Mount Everest Glacier Landscape - Original Impasto Oil Painting by G. B. Thapa, 2020. Oil on Canvas. Subject (Scene): A breathtaking, high-altitude view of the Mount Everest (Sagarmatha) massif. The composition highlights the windswept, dark rock pyramid of the peak, a massive, tumbling glacier in the valley below, and a still glacial lake.\n\nSymbolism (Key details): The mountain represents the absolute pinnacle of the natural world—a place of immense power and cold isolation. The prayer flags at the base introduce a human element of reverence, offering prayers to the \"Goddess Mother of the World.\"\n\nTechnique (Materials/Craft): This piece is defined by extremely aggressive, sculptural impasto. The artist uses a palette knife to physically sculpt the ridges, snowdrifts, and broken glacial ice directly onto the canvas with heavy oil paint, emphasizing the freezing, harsh reality of the alpine environment.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fa49f0f68eb18b6ead94fa017fdc8ec56abfe4260-1273x1754.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fa49f0f68eb18b6ead94fa017fdc8ec56abfe4260-1273x1754.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,-4.5],
    rotation: [0,1.5707963267948966,0],
    widthIn: 24,
    heightIn: 29,
    status: 'available',
  },
  {
    id: 'b5772f6b-3475-4fdf-a101-ff5aa0465a61',
    sanityId: 'b5772f6b-3475-4fdf-a101-ff5aa0465a61',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Ama Dablam Himalayan Trail - Textured Palette Knife Oil Painting",
    artist: "G. B. Thapa",
    year: "2020",
    medium: "Oil on Canvas",
    description: "Subject (Scene): The recognizable, steep ridges of Ama Dablam dominate the background. Below the misty mid-ground, a herder guides heavily laden yaks or mules along a rugged mountain pass, framed by fluttering prayer flags and a carved Mani stone.\n\nSymbolism (Key details): The prayer flags (Lungta) scatter blessings of peace and strength to the winds, symbolizing spiritual protection for travelers. The Mani stone grounds the awe-inspiring landscape in the deep-rooted Buddhist faith of the Himalayas.\n\nTechnique (Materials/Craft): Executed with masterful palette knife strokes, the artist builds crisp ridges on the mountain peaks using thick, stark white and deep shadow oil colors. The foreground uses dynamic, textured dabs of vibrant oil paint to represent the flapping flags and the uneven earth.",
    audioText: "Ama Dablam Himalayan Trail - Textured Palette Knife Oil Painting by G. B. Thapa, 2020. Oil on Canvas. Subject (Scene): The recognizable, steep ridges of Ama Dablam dominate the background. Below the misty mid-ground, a herder guides heavily laden yaks or mules along a rugged mountain pass, framed by fluttering prayer flags and a carved Mani stone.\n\nSymbolism (Key details): The prayer flags (Lungta) scatter blessings of peace and strength to the winds, symbolizing spiritual protection for travelers. The Mani stone grounds the awe-inspiring landscape in the deep-rooted Buddhist faith of the Himalayas.\n\nTechnique (Materials/Craft): Executed with masterful palette knife strokes, the artist builds crisp ridges on the mountain peaks using thick, stark white and deep shadow oil colors. The foreground uses dynamic, textured dabs of vibrant oil paint to represent the flapping flags and the uneven earth.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F0b8ec02eb3c7ca015002a244cfecf2c0ea0e8bd6-1765x1289.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F0b8ec02eb3c7ca015002a244cfecf2c0ea0e8bd6-1765x1289.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,4.5],
    rotation: [0,1.5707963267948966,0],
    widthIn: 22,
    heightIn: 15,
    status: 'available',
  },
  {
    id: 'd99369a0-e774-4066-add7-60febcdd6780',
    sanityId: 'd99369a0-e774-4066-add7-60febcdd6780',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Himalayan Porters River Gorge - Nepal Trekking Oil Painting",
    artist: "G. B. Thapa",
    year: "2019",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A deep, V-shaped river valley with a fast-flowing river. On the left, local porters carrying massive loads and trekkers navigate a narrow, precarious path carved directly into the sheer cliff face, with a sunlit snow peak visible in the distance.\n\nSymbolism (Key details): The painting highlights the incredible scale of nature compared to the small, resilient human figures. It is a tribute to the immense physical strength of local porters and the spirit of exploration required to travel these remote mountain corridors.\n\nTechnique (Materials/Craft): The artist applies thick, vibrant greens, yellows, and earthy browns with a palette knife to create the dense textures of the gorge walls. The physical thickness of the oil paint makes the rock face pop from the canvas, emphasizing the steep drop and rugged trail.",
    audioText: "Himalayan Porters River Gorge - Nepal Trekking Oil Painting by G. B. Thapa, 2019. Oil on Canvas. Subject (Scene): A deep, V-shaped river valley with a fast-flowing river. On the left, local porters carrying massive loads and trekkers navigate a narrow, precarious path carved directly into the sheer cliff face, with a sunlit snow peak visible in the distance.\n\nSymbolism (Key details): The painting highlights the incredible scale of nature compared to the small, resilient human figures. It is a tribute to the immense physical strength of local porters and the spirit of exploration required to travel these remote mountain corridors.\n\nTechnique (Materials/Craft): The artist applies thick, vibrant greens, yellows, and earthy browns with a palette knife to create the dense textures of the gorge walls. The physical thickness of the oil paint makes the rock face pop from the canvas, emphasizing the steep drop and rugged trail.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F2891aa66243546bea9e53e5dc24780e259927873-1300x1791.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F2891aa66243546bea9e53e5dc24780e259927873-1300x1791.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,-6.75],
    rotation: [0,1.5707963267948966,0],
    widthIn: 24,
    heightIn: 29,
    status: 'available',
  },
  {
    id: '3b9ab7ea-1a8d-4e1c-b438-c43735b7080e',
    sanityId: '3b9ab7ea-1a8d-4e1c-b438-c43735b7080e',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Mount Everest Peak and Stone Cairn - Impasto Oil Painting",
    artist: "G. B. Thapa",
    year: "2018",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A towering, high-altitude view of the Mount Everest (Sagarmatha) range under a clear blue sky. In the rugged, shadowy foreground, a traditional stone cairn (or chorten) stands proudly on a rocky outcrop, seemingly floating above a layer of low-lying mist.\n\nSymbolism (Key details): The stone cairn is a powerful symbol of navigation, human endurance, and spiritual offering in the Himalayas, marking safe passage through treacherous terrain. Placed against the ultimate backdrop of Everest, it represents the delicate balance between human humility and the immense, enduring power of the mountains.\n\nTechnique (Materials/Craft): The artist uses aggressive palette knife strokes to build thick, structural impasto layers of oil paint. The sharp contrast between the bright, sculpted white snow and the deep, dark blues and browns of the rock faces masterfully captures the harsh, freezing reality of the alpine zone.",
    audioText: "Mount Everest Peak and Stone Cairn - Impasto Oil Painting by G. B. Thapa, 2018. Oil on Canvas. Subject (Scene): A towering, high-altitude view of the Mount Everest (Sagarmatha) range under a clear blue sky. In the rugged, shadowy foreground, a traditional stone cairn (or chorten) stands proudly on a rocky outcrop, seemingly floating above a layer of low-lying mist.\n\nSymbolism (Key details): The stone cairn is a powerful symbol of navigation, human endurance, and spiritual offering in the Himalayas, marking safe passage through treacherous terrain. Placed against the ultimate backdrop of Everest, it represents the delicate balance between human humility and the immense, enduring power of the mountains.\n\nTechnique (Materials/Craft): The artist uses aggressive palette knife strokes to build thick, structural impasto layers of oil paint. The sharp contrast between the bright, sculpted white snow and the deep, dark blues and browns of the rock faces masterfully captures the harsh, freezing reality of the alpine zone.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fcad7e5f3baa1d4684aad0aaa03cf1dfb8c4521a8-2048x1536.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fcad7e5f3baa1d4684aad0aaa03cf1dfb8c4521a8-2048x1536.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'left',
    position: [-9.8,1.8,6.75],
    rotation: [0,1.5707963267948966,0],
    widthIn: 22,
    heightIn: 15,
    status: 'available',
  },
  {
    id: '36f39e68-701f-43a8-bd88-72574f1f42ef',
    sanityId: '36f39e68-701f-43a8-bd88-72574f1f42ef',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Machapuchare Sunset Alpenglow - Nepal Mountain Oil Painting",
    artist: "G. B. Thapa",
    year: "2020",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A striking portrait of the sacred Mount Machapuchare (Fishtail mountain) caught in the fleeting, fiery light of a sunrise or sunset (alpenglow). The warm, glowing peaks rise dramatically out of the misty valleys, while a dark, silhouetted tree line anchors the bottom of the canvas.\n\nSymbolism (Key details): The golden illumination on the unclimbed, sacred peak highlights its divine, untouchable nature. The dramatic lighting symbolizes hope, the passage of time, and the breathtaking, transient moments of beauty found in the high Himalayas.\n\nTechnique (Materials/Craft): This piece is a masterclass in lighting and texture. The artist uses a palette knife to apply vibrant, warm oranges, pinks, and golds on the mountain's sunlit ridges, contrasting them sharply against the deep, cool blues and purples of the shadows. The silhouetted foreground is painted with thick, dark strokes to push the glowing mountain further into the distance.",
    audioText: "Machapuchare Sunset Alpenglow - Nepal Mountain Oil Painting by G. B. Thapa, 2020. Oil on Canvas. Subject (Scene): A striking portrait of the sacred Mount Machapuchare (Fishtail mountain) caught in the fleeting, fiery light of a sunrise or sunset (alpenglow). The warm, glowing peaks rise dramatically out of the misty valleys, while a dark, silhouetted tree line anchors the bottom of the canvas.\n\nSymbolism (Key details): The golden illumination on the unclimbed, sacred peak highlights its divine, untouchable nature. The dramatic lighting symbolizes hope, the passage of time, and the breathtaking, transient moments of beauty found in the high Himalayas.\n\nTechnique (Materials/Craft): This piece is a masterclass in lighting and texture. The artist uses a palette knife to apply vibrant, warm oranges, pinks, and golds on the mountain's sunlit ridges, contrasting them sharply against the deep, cool blues and purples of the shadows. The silhouetted foreground is painted with thick, dark strokes to push the glowing mountain further into the distance.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fc1ce15f050016e87c1edb52eeb978335a3d37885-1444x992.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fc1ce15f050016e87c1edb52eeb978335a3d37885-1444x992.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,0],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 22,
    heightIn: 15,
    status: 'available',
  },
  {
    id: '03728e11-8106-46ef-b762-8423f08908f5',
    sanityId: '03728e11-8106-46ef-b762-8423f08908f5',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Mera Peak Trekking Nepal - Textured Mountain Oil Painting",
    artist: "G. B. Thapa",
    year: "2014",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A rugged, high-altitude trekking scene capturing the approach to Mera Peak, recognized as Nepal's highest trekking peak at 6,476 meters. Two porters carrying heavy loads navigate a steep, rocky trail that winds upward through the remote Hinku Valley. In the background, the colossal, multi-summited snow peak of Mera pierces through a thick layer of valley clouds.\n\nSymbolism (Key details): This painting is a testament to human grit and endurance. The porters, dwarfed by the landscape, symbolize the immense physical labor required to navigate these remote mountain corridors. The sweeping clouds separating the hikers from the peak emphasize the vast scale of the journey and the alluring, monumental challenge that Mera Peak represents to climbers and trekkers alike.\n\nTechnique (Materials/Craft): G.B. Thapa uses extremely thick oil paint to create a highly tactile surface. The foreground rocks and autumn foliage are sculpted with short, sharp palette knife dabs, making the harsh terrain feel physically real to the viewer. The mountain peak is similarly textured, while the mist is rendered with softer, blended strokes to create a sense of depth and atmospheric separation.",
    audioText: "Mera Peak Trekking Nepal - Textured Mountain Oil Painting by G. B. Thapa, 2014. Oil on Canvas. Subject (Scene): A rugged, high-altitude trekking scene capturing the approach to Mera Peak, recognized as Nepal's highest trekking peak at 6,476 meters. Two porters carrying heavy loads navigate a steep, rocky trail that winds upward through the remote Hinku Valley. In the background, the colossal, multi-summited snow peak of Mera pierces through a thick layer of valley clouds.\n\nSymbolism (Key details): This painting is a testament to human grit and endurance. The porters, dwarfed by the landscape, symbolize the immense physical labor required to navigate these remote mountain corridors. The sweeping clouds separating the hikers from the peak emphasize the vast scale of the journey and the alluring, monumental challenge that Mera Peak represents to climbers and trekkers alike.\n\nTechnique (Materials/Craft): G.B. Thapa uses extremely thick oil paint to create a highly tactile surface. The foreground rocks and autumn foliage are sculpted with short, sharp palette knife dabs, making the harsh terrain feel physically real to the viewer. The mountain peak is similarly textured, while the mist is rendered with softer, blended strokes to create a sense of depth and atmospheric separation.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F5c5324c1fd9640ad88e0578f826a6b546cb58f7a-1736x1271.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F5c5324c1fd9640ad88e0578f826a6b546cb58f7a-1736x1271.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,-2.25],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 29,
    heightIn: 24,
    status: 'available',
  },
  {
    id: 'bfee6d85-8a27-4cd3-ac2c-3a34f9fbef2e',
    sanityId: 'bfee6d85-8a27-4cd3-ac2c-3a34f9fbef2e',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Rural Nepali Village and Machapuchare - Landscape Oil Painting",
    artist: "G. B. Thapa",
    year: "2015",
    medium: "Oil on Canvas",
    description: "Subject (Scene): A serene, pastoral view from the middle hills of Nepal. In the foreground, daily life unfolds: a villager walks along a stone path, a cow grazes, and traditional houses with thatched roofs and drying crops sit nestled in the hills. The iconic, twin-peaked summit of Mount Machapuchare looms peacefully in the background above a sea of clouds.\n\nSymbolism (Key details): Unlike the harsh alpine scenes, this painting symbolizes the harmony between the Nepali people and their environment. The fertile, golden tones of the village life contrast with the cold, distant blue of the mountain, illustrating how the sacred peaks quietly watch over and provide for the valleys below.\n\nTechnique (Materials/Craft): The artist uses a palette knife to create distinct textural zones. The golden haystacks and rustic village architecture are built up with thick, warm, earthy tones, giving them a rustic, organic feel. The background mountain is painted with slightly smoother, cooler blues and whites, utilizing atmospheric perspective to make the giant peak feel towering yet distant.",
    audioText: "Rural Nepali Village and Machapuchare - Landscape Oil Painting by G. B. Thapa, 2015. Oil on Canvas. Subject (Scene): A serene, pastoral view from the middle hills of Nepal. In the foreground, daily life unfolds: a villager walks along a stone path, a cow grazes, and traditional houses with thatched roofs and drying crops sit nestled in the hills. The iconic, twin-peaked summit of Mount Machapuchare looms peacefully in the background above a sea of clouds.\n\nSymbolism (Key details): Unlike the harsh alpine scenes, this painting symbolizes the harmony between the Nepali people and their environment. The fertile, golden tones of the village life contrast with the cold, distant blue of the mountain, illustrating how the sacred peaks quietly watch over and provide for the valleys below.\n\nTechnique (Materials/Craft): The artist uses a palette knife to create distinct textural zones. The golden haystacks and rustic village architecture are built up with thick, warm, earthy tones, giving them a rustic, organic feel. The background mountain is painted with slightly smoother, cooler blues and whites, utilizing atmospheric perspective to make the giant peak feel towering yet distant.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F69b18f37e53610240c0bfe34df2b477794199a79-982x1468.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F69b18f37e53610240c0bfe34df2b477794199a79-982x1468.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,2.25],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
  {
    id: 'ca7f2837-3336-4bdd-a57c-50c564c02562',
    sanityId: 'ca7f2837-3336-4bdd-a57c-50c564c02562',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Manang Mustang Temple",
    artist: "Gyanmani Ray",
    year: "2024",
    medium: "Acrylic on Canvas",
    description: "Manang Mustang Temple by Gyanmani Ray. Acrylic on Canvas, 2024. From $190.",
    audioText: "Manang Mustang Temple by Gyanmani Ray, 2024. Acrylic on Canvas. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fb9be7579bac5465eae2bacb52574a9bbd30d1496-2641x6312.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fb9be7579bac5465eae2bacb52574a9bbd30d1496-2641x6312.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,-4.5],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 10,
    heightIn: 23,
    status: 'available',
  },
  {
    id: 'd6d392cc-f8b0-4203-bda4-4ec496c05756',
    sanityId: 'd6d392cc-f8b0-4203-bda4-4ec496c05756',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Mt. Kaliash from Tibet",
    artist: "G. B. Thapa",
    year: "2023",
    medium: "Oil on Canvas",
    description: "Early morning sunlight bursts across the icy summit of Mount Kailash, transforming cold stone and snow into a glowing beacon of gold. Lush oil glazes and deliberate palette knife work capture the raw, spiritual power of dawn in Tibet.",
    audioText: "Mt. Kaliash from Tibet by G. B. Thapa, 2023. Oil on Canvas. Early morning sunlight bursts across the icy summit of Mount Kailash, transforming cold stone and snow into a glowing beacon of gold. Lush oil glazes and deliberate palette knife work capture the raw, spiritual power of dawn in Tibet.",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fba6958e23831b269ac5950758257b40f037e17ae-3101x2268.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fba6958e23831b269ac5950758257b40f037e17ae-3101x2268.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,4.5],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 29,
    heightIn: 24,
    status: 'available',
  },
  {
    id: '7bf8414a-cc6a-42d4-9de1-8ad1574ecf0a',
    sanityId: '7bf8414a-cc6a-42d4-9de1-8ad1574ecf0a',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Kalvairab temple at basantapur",
    artist: "Suresh Syangtan",
    year: "2024",
    medium: "Watercolor",
    description: "Kalvairab temple at basantapur by Suresh Syangtan. Watercolor, 2024. From $75.",
    audioText: "Kalvairab temple at basantapur by Suresh Syangtan, 2024. Watercolor. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fedac884955c5fa8ac56ea2f4f235915bebcac623-3116x2268.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2Fedac884955c5fa8ac56ea2f4f235915bebcac623-3116x2268.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,-6.75],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 15,
    heightIn: 11,
    status: 'available',
  },
  {
    id: 'f4b32b25-c977-4718-bdb4-6039bf65ae3a',
    sanityId: 'f4b32b25-c977-4718-bdb4-6039bf65ae3a',
    roomId: 'room-main',
    artistId: 'artist-group',
    title: "Echoes Along the Galli",
    artist: "Gyanmani Ray",
    year: "2024",
    medium: "Acrylic on Canvas",
    description: "Echoes Along the Galli by Gyanmani Ray. Acrylic on Canvas, 2024. From $450.",
    audioText: "Echoes Along the Galli by Gyanmani Ray, 2024. Acrylic on Canvas. ",
    imageUrl: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F9986f776e72e4fa5c95b17e416275d5703ade1af-2268x3295.jpg%3Fw%3D2048%26q%3D85%26auto%3Dformat",
    imageUrlSm: "/api/image-proxy?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fqeqv70yn%2Fproduction%2F9986f776e72e4fa5c95b17e416275d5703ade1af-2268x3295.jpg%3Fw%3D1024%26q%3D80%26auto%3Dformat",
    wallId: 'right',
    position: [9.8,1.8,6.75],
    rotation: [0,-1.5707963267948966,0],
    widthIn: 15,
    heightIn: 22,
    status: 'available',
  },
];

export const fallbackArtworks = seedArtworks.map((art) => ({
  ...art,
  width: art.widthIn * IN,
  height: art.heightIn * IN,
}));

// Persistent curator artwork overrides key for zero-latency instant updates
const OVERRIDES_STORAGE_KEY = 'shakya_curator_artworks_v5';

// One-time auto-purge on client load to clear any stale or fallback-corrupted overrides
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('shakya_curator_artworks_v4');
    localStorage.removeItem('shakya_curator_artworks_v3');
    localStorage.removeItem('shakya_curator_artworks_v2');
    localStorage.removeItem('shakya_curator_artworks_v1');
  } catch {
    /* ignore */
  }
}

const LEGACY_SEED_IDS = new Set([
  'starry-horizon', 'echoes-silence', 'golden-symphony', 'neon-prism',
  'solitude', 'velocity-light', 'crimson-mirage', 'whispering-winds',
  'monolith-shadow', 'uploaded-4', 'uploaded-7', 'uploaded-8', 'uploaded-9',
  'uploaded-10', 'artwork-1790262470466'
]);

export function getLocalArtworkOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    let modified = false;
    for (const key of Object.keys(parsed)) {
      if (LEGACY_SEED_IDS.has(key) || key.startsWith('uploaded-') || key.startsWith('artwork-178') || key.startsWith('artwork-179')) {
        delete parsed[key];
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return {};
  }
}


export function saveLocalArtworkOverride(art) {
  if (typeof window === 'undefined' || !art || !art.id) return;
  try {
    const map = getLocalArtworkOverrides();
    const cleanArt = {
      ...art,
      isHung: true,
      unhung: false,
      showIn3D: true,
      updatedAt: Date.now(),
    };
    map[art.id] = cleanArt;
    if (art.sanityId) {
      map[art.sanityId] = cleanArt;
    }
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not save local artwork override:', e);
  }
}

export function removeLocalArtworkOverride(id) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const map = getLocalArtworkOverrides();
    delete map[id];
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not remove local artwork override:', e);
  }
}

export function markLocalArtworkUnhung(id) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const map = getLocalArtworkOverrides();
    map[id] = { id, unhung: true, isHung: false, showIn3D: false, updatedAt: Date.now() };
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Could not mark local artwork unhung:', e);
  }
}

export function clearLocalArtworkOverrides() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OVERRIDES_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear local artwork overrides:', e);
  }
}

/**
 * Fetch artworks from Sanity Content Lake, merged with instant curator overrides
 * and falling back to Express REST API / static catalogue.
 */
export async function fetchArtworksAPI(roomId = null, includeUnhung = false) {
  let list = [];

  // 1. Try querying Sanity Content Lake directly
  try {
    const sanityArtworks = await fetchSanityArtworks(includeUnhung);
    if (Array.isArray(sanityArtworks) && sanityArtworks.length > 0) {
      list = sanityArtworks;
    }
  } catch (sanityErr) {
    console.warn('Direct Sanity query failed, falling back to API:', sanityErr);
  }

  // 2. Fallback to Express REST API
  if (list.length === 0) {
    try {
      const params = new URLSearchParams();
      if (roomId && !includeUnhung) params.set('roomId', roomId);
      if (includeUnhung) params.set('includeUnhung', 'true');
      params.set('_t', Date.now().toString());

      const url = `/api/artworks?${params.toString()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          list = data;
        }
      }
    } catch (err) {
      console.warn('Could not reach backend API, using fallback local static artworks:', err);
    }
  }

  if (list.length === 0) {
    list = fallbackArtworks;
  }

  // 3. Overlay any active curator overrides (instant local changes before CDN purges)
  const overrides = getLocalArtworkOverrides();
  const overriddenIds = new Set();

  let merged = list.map((art) => {
    const override = overrides[art.id] || overrides[art.sanityId];
    if (override) {
      overriddenIds.add(art.id);
      if (art.sanityId) overriddenIds.add(art.sanityId);
      const wIn = override.widthIn !== undefined ? parseFloat(override.widthIn) : art.widthIn;
      const hIn = override.heightIn !== undefined ? parseFloat(override.heightIn) : art.heightIn;
      // Ensure the authentic artwork image is never clobbered by a generic database default
      const finalImageUrl = (override.imageUrl && !override.imageUrl.includes('starry-horizon'))
        ? override.imageUrl
        : art.imageUrl;
      const finalImageUrlSm = (override.imageUrlSm && !override.imageUrlSm.includes('starry-horizon'))
        ? override.imageUrlSm
        : art.imageUrlSm;

      return {
        ...art,
        ...override,
        imageUrl: finalImageUrl,
        imageUrlSm: finalImageUrlSm,
        position: override.position || art.position,
        rotation: override.rotation || art.rotation,
        wallId: override.wallId || art.wallId,
        widthIn: wIn,
        heightIn: hIn,
        width: wIn * IN,
        height: hIn * IN,
        roomId: override.roomId || art.roomId,
      };
    }
    return art;
  });

  // 4. Also include any locally created artworks that aren't in Sanity yet
  Object.values(overrides).forEach((ov) => {
    if (!overriddenIds.has(ov.id) && ov.title) {
      overriddenIds.add(ov.id);
      const wIn = parseFloat(ov.widthIn) || 48;
      const hIn = parseFloat(ov.heightIn) || 36;
      merged.push({
        ...ov,
        widthIn: wIn,
        heightIn: hIn,
        width: wIn * IN,
        height: hIn * IN,
      });
    }
  });

  // 5. Exclude unhung / vaulted artworks from 3D display unless includeUnhung is requested
  if (!includeUnhung) {
    merged = merged.filter((art) => {
      const override = overrides[art.id] || overrides[art.sanityId];
      if (override) {
        if (override.unhung === true || override.isHung === false || override.showIn3D === false) return false;
        if (override.isHung === true && override.wallId) return true;
      }
      if (art.unhung === true || art.showIn3D === false || art.isHung === false) return false;
      return true;
    });
  }

  // 6. Filter by requested exhibition room (unless includeUnhung is requested)
  if (roomId && !includeUnhung) {
    return merged.filter((a) => !a.roomId || a.roomId === roomId);
  }

  return merged;
}

/**
 * Fetch list of rooms from Express REST API with dynamic Sanity gallery wing discovery
 */
export async function fetchRoomsAPI() {
  const roomMap = new Map();

  // 1. Try fetching configured rooms from backend API
  try {
    const res = await fetch(`/api/rooms?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const dbRooms = await res.json();
      if (Array.isArray(dbRooms)) {
        dbRooms.forEach((r) => roomMap.set(r.id, r));
      }
    }
  } catch (err) {
    console.warn('Could not fetch rooms from API:', err);
  }

  // 2. Ensure main default gallery exists
  if (!roomMap.has('room-main')) {
    roomMap.set('room-main', {
      id: 'room-main',
      title: 'Main Permanent Exhibition',
      artist_name: 'Shakya Gallery Masters',
      hall_layout: 'classic',
    });
  }

  // 3. Scan Sanity artworks to see if any artworks are assigned to secondary wings
  try {
    const sanityArtworks = await fetchSanityArtworks();
    if (Array.isArray(sanityArtworks)) {
      sanityArtworks.forEach((art) => {
        if (art.roomId && !roomMap.has(art.roomId)) {
          const isWing2 = art.roomId === 'room-wing-2';
          roomMap.set(art.roomId, {
            id: art.roomId,
            title: isWing2 ? 'Pavilion Wing II' : `Gallery Wing (${art.roomId})`,
            artist_name: 'Shakya Gallery Masters',
            hall_layout: 'classic',
          });
        }
      });
    }
  } catch (sanityErr) {
    // ignore
  }

  return Array.from(roomMap.values());
}

/**
 * Fetch list of artists from Sanity Content Lake with fallback to Express REST API
 */
export async function fetchArtistsAPI() {
  // 1. Try Sanity Content Lake
  try {
    const artists = await sanityClient.fetch(
      `*[_type == "artist"] | order(name asc) { "id": _id, name, bio, "slug": slug.current }`
    );
    if (Array.isArray(artists) && artists.length > 0) {
      return artists;
    }
  } catch (sanityErr) {
    console.warn('Could not fetch artists from Sanity, trying API:', sanityErr);
  }

  // 2. Fallback to Express REST API
  try {
    const res = await fetch(`/api/artists?_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch artists from API:', err);
    return [{ id: 'artist-group', name: 'Shakya Gallery Masters' }];
  }
}

export interface PandaVideo {
  id: string
  title: string
  thumbnail: string
  duration: number // in seconds
}

// This is a mock service. In a real application, this would
// make an API call to Panda Video using the API key.
const mockVideos: PandaVideo[] = Array.from({ length: 20 }, (_, i) => ({
  id: `panda_video_${i + 1}`,
  title: `Aula de ${['Matemática', 'Física', 'Química', 'Biologia'][i % 4]} - Tópico ${Math.floor(i / 4) + 1}`,
  thumbnail: `https://img.usecurling.com/p/160/90?q=video%20lesson%20${i}`,
  duration: Math.floor(Math.random() * (25 * 60)) + 5 * 60, // 5 to 30 minutes
}))

export const getPandaVideos = async (
  searchTerm: string = '',
): Promise<PandaVideo[]> => {
  console.log('Fetching Panda Videos with search term:', searchTerm)
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (searchTerm) {
    return mockVideos.filter((video) =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  return mockVideos
}

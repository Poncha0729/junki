import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '作品 | ポートフォリオ',
  description: 'クリエイターの作品を展示します',
};

export default function Works() {
  const works = [
    {
      title: '作品1',
      description: '説明文がここに表示されます',
      imageUrl: '/placeholder.jpg',
      tech: ['Next.js', 'TypeScript', 'Tailwind CSS']
    },
    {
      title: '作品2',
      description: '説明文がここに表示されます',
      imageUrl: '/placeholder.jpg',
      tech: ['React', 'Node.js', 'MongoDB']
    },
    {
      title: '作品3',
      description: '説明文がここに表示されます',
      imageUrl: '/placeholder.jpg',
      tech: ['Vue.js', 'Python', 'Django']
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">作品</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map((work, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">{work.title}</h2>
              <p className="text-gray-600 mb-4">{work.description}</p>
              <div className="flex flex-wrap gap-2">
                {work.tech.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

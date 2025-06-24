'use client';

interface WorkCardProps {
  title: string;
  description: string;
  techStack?: string[];
  imageUrl?: string;
}

export default function WorkCard({ title, description, techStack, imageUrl }: WorkCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
      {/* サムネイル画像 */}
      {imageUrl && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={imageUrl}
            alt={title}
            className="object-cover w-full h-full dark:brightness-90"
          />
        </div>
      )}

      {/* カードのコンテンツ */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {description}
        </p>

        {/* 技術スタック */}
        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ホバー時のオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent dark:from-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-400 dark:hover:bg-blue-500 rounded-lg transform hover:scale-105 transition-transform duration-300">
            詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
}

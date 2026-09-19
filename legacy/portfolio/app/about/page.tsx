import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'について | ポートフォリオ',
  description: 'クリエイターについての詳細情報',
};

export default function About() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">について</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">クリエイター名</h2>
            <p className="text-gray-600">プロフィールがここに表示されます</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">スキル</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <span>Web開発</span>
                </li>
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span>デザイン</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">経歴</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-yellow-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>20XX年 - 現在</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

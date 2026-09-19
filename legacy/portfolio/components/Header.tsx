import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed w-full bg-white shadow-md">
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            Portfolio
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ホーム
            </Link>
            <Link href="/works" className="text-gray-600 hover:text-gray-900">
              作品
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              について
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">
              お問い合わせ
            </Link>
          </div>
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              メニュー
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

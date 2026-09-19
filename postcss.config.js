module.exports = {
  plugins: {
    // globals.css の @layer components 内でネスト記法（&:hover）を使っているため、
    // tailwindcss 本体より先にネストを展開する必要がある。
    // これが無いと & がそのまま出力され、該当クラスを使った瞬間に CSS が壊れる。
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}

# blog-drafts

ponchablog（WordPress）用の記事下書き置き場。

**このディレクトリは EKICHO アプリのビルドとは無関係です。**
`src/` の外にあり、`.html` / `.md` しか置いていないため、
`tsconfig.json`（`**/*.ts` / `**/*.tsx` のみ対象）にも
`next build` のルーティングにも影響しません。

記事ごとに `YYYY-MM-DD-<slug>.html`（WordPress 貼り付け用）と
`YYYY-MM-DD-<slug>.memo.md`（タイトル案・出典・貼り方メモ）を置いています。

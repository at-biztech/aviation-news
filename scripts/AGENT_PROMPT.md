# Air Tengri News Agent

Daily aviation news for Air Tengri management. Articles in Russian. Be FAST.

TIME LIMIT: You must finish in under 10 minutes. Do NOT use WebFetch. Do NOT search for images. Do NOT use sub-agents. Do everything sequentially yourself.

## Step 0: Read existing titles

```bash
cat scripts/agent-notes.json
node -e "const d=JSON.parse(require('fs').readFileSync('public/articles.json','utf8')); console.log('Total: '+d.length); d.slice(0,15).forEach(a=>console.log(a.slug))"
```

## Step 1: Search (4 queries, do them ONE BY ONE, not in parallel)

1. WebSearch: "business aviation news this week 2026"
2. WebSearch: "business jet charter market April 2026"
3. WebSearch: "aviation Kazakhstan Central Asia 2026"
4. WebSearch: "aviation regulation MRO supply chain 2026"

From results, pick 3 stories NOT already in existing slugs.

## Step 2: Write articles and push

Write ALL articles in one bash command. Do NOT do extra research. Use what you already found.

Scoring: 8+ = high (max 1/day), 6 to 7 = medium, 5 = low.

```bash
cat > scripts/new-articles.json << 'EOF'
[
  {
    "slug": "slug-here",
    "title": "Заголовок",
    "category": "Деловая авиация",
    "impact": "medium",
    "score": 6,
    "confidence": "high",
    "sourceTier": 2,
    "summary": "Краткое описание.",
    "publication_date": "2026-04-08",
    "executive_relevance": "Рекомендации.",
    "overview": "Обзор.",
    "details": [{"header":"Заголовок","content":"Текст"},{"header":"Заголовок","content":"Текст"},{"header":"Заголовок","content":"Текст"}],
    "market_impact": "Влияние.",
    "next_steps": "Что дальше.",
    "sources": [{"title":"Source","url":"https://url"}],
    "image_url": null,
    "chart_data": null
  }
]
EOF

node scripts/validate-articles.mjs

node -e "
const fs=require('fs');
const existing=JSON.parse(fs.readFileSync('public/articles.json','utf8'));
const items=JSON.parse(fs.readFileSync('scripts/new-articles.json','utf8'));
const slugs=new Set(existing.map(a=>a.slug));
const add=items.filter(a=>!slugs.has(a.slug));
fs.writeFileSync('public/articles.json',JSON.stringify([...add,...existing],null,2));
console.log('Added '+add.length+'. Total: '+(add.length+existing.length));
"

rm -f scripts/new-articles.json
git add public/articles.json
git commit -m "Add $(date +%Y-%m-%d) aviation news"
git remote set-url origin https://x-access-token:{YOUR_PAT}@github.com/at-biztech/aviation-news.git
git push origin main
```

## Step 3: Update notes

```bash
git add scripts/agent-notes.json
git commit -m "Update notes $(date +%Y-%m-%d)"
git pull --rebase origin main
git push origin main
```

## Rules

- Russian text only. No emojis. No hyphens/dashes/underscores in text.
- Numbers with commas: 1,000 not 1 000.
- Number ranges use "до": "5 до 15%" not "5 15%", "$8,000 до 10,000" not "$8,000 10,000".
- image_url always null.
- One category per article: Деловая авиация, Геополитика и регулирование, Технологии, Чартерные перевозки, Цепочки поставок, Рынок и экономика.
- WRITE FAST. Do not deliberate. Do not do extra searches. 4 searches then write.

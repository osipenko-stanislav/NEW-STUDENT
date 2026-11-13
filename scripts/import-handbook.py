"""Read publicly accessible TEAMLY articles and export the undergraduate handbook.
Run: python3 scripts/import-handbook.py. No authentication or source writes.
"""
import concurrent.futures, json, pathlib, re, tempfile, urllib.request
BASE = 'https://note.cu.ru'
ROOT = 'db3f475e-b70a-4423-abc0-b030db55c80b'
SPACE = 'dff5a22f-c6bf-4db2-9138-b7f830e4e921'
PROGRAM = 'd455d7d6-de8a-44b8-a77d-88d13827edf9'
PROGRAM_ALIAS = '9fc10273-942d-4172-8dfc-21b559f4bb52'
CACHE = pathlib.Path(tempfile.gettempdir()) / 'cu-handbook-cache'
CACHE.mkdir(exist_ok=True)
OUT = pathlib.Path('public/handbook'); OUT.mkdir(exist_ok=True)
issues = []; omissions = []
EXCLUDED = {
 '6c9518bb-49d1-492b-a799-ff157abe8ee6': 'Карьерные менторы доступны со второго курса',
 '737c0727-1c15-41f1-a9b4-df8c9947a73a': 'Реферальная программа доступна со второго курса',
 'acac2e6f-eb3f-46c9-bf73-1e1f99b5c69e': 'Совместные стажировки для третьего курса и магистратуры',
 '156b67fb-bb3b-4da3-a9d3-b20f37758ee4': 'Технические собеседования доступны со второго курса',
 '04133ba4-1343-4c46-ab8f-b43ff033b3f7': 'Программа магистратуры',
 'b1173e02-ceee-493a-a6af-aa378f7a26f8': 'График магистратуры',
 '103c35e5-3965-4a02-9f3f-14873049975f': 'График онлайн-магистратуры',
 '197be9be-6d19-45f6-9238-e4eda1889a40': 'ВКР старших курсов',
 '6140c4ba-bc4a-49ea-8117-7f556b011732': 'Проектный трек ВКР',
 '3d1ae3e5-073f-42db-b218-a5ef56330567': 'Научный трек ВКР',
 'acc32ce8-d7b6-4f72-9619-4f442581abf4': 'Обучение уже зачисленных на двойной диплом; отбор для первокурсников сохранен',
 '48345d83-f31d-4a89-8647-edda2b14e59b': 'Партнерские программы для 2–4 курсов',
 '13462eef-5909-4d08-a9b7-13732687af86': 'Архив проектов осени 2025',
}
def request(path, body=None):
 req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body else None,
                              headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
 with urllib.request.urlopen(req, timeout=45) as r: return json.load(r)
def cached(id, suffix, path, body=None):
 p = CACHE / (id + '-' + suffix + '.json')
 if p.exists(): return json.loads(p.read_text())
 data = request(path, body); p.write_text(json.dumps(data, ensure_ascii=False)); return data
def children(id):
 return cached(id, 'children', '/api/v1/wiki/ql/article_content', {'query': {
  '__filter': {'space_id': SPACE, 'article_id': id}, '__pagination': {'page': 1, 'per_page': 300},
  'source_id': True, 'parent_id': True, 'has_nested': True, 'article': {'id': True, 'title': True}}}).get('data', [])
def excluded_title(t):
 return bool(re.search(r'школа дизайна|школа естественных|магистратур', t, re.I))
def text(n): return n.get('text', '') + ''.join(text(c) for c in n.get('content', []))
nodes = [{'id': ROOT, 'parentId': None, 'title': 'Хендбук студента'}]; seen = {ROOT}; queue = [ROOT]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 while queue:
  next_queue = []
  for parent, entries in zip(queue, pool.map(children, queue)):
   for entry in entries:
    a = entry.get('article')
    if not a or a['id'] in seen: continue
    id = a['id']; seen.add(id)
    if id in EXCLUDED or excluded_title(a['title']):
     omissions.append({'id': id, 'title': a['title'], 'reason': EXCLUDED.get(id, 'Другая школа или ступень образования')}); continue
    nodes.append({'id': id, 'parentId': parent, 'title': a['title']})
    if entry.get('has_nested'): next_queue.append(id)
  queue = next_queue
# The source reuses one undergraduate program block at two addresses. Keep its school location.
nodes = [{**n, 'parentId': PROGRAM if n['parentId'] == PROGRAM_ALIAS else n['parentId']} for n in nodes if n['id'] != PROGRAM_ALIAS]
selected = {n['id'] for n in nodes}
removed = set(EXCLUDED) | {n['id'] for n in omissions}
def resolve(n, ancestry=()):
 if n['type'] == 'syncedContent':
  a = n.get('attrs', {}); id = a.get('contentId')
  if id in ancestry: raise ValueError('Cyclic synchronized block')
  try:
   j = cached(id, 'sync', '/api/v2/collaboration/syncblocks/' + id + '?blockId=' + a['id'] + '&latestVersionAt=1')
   return resolve(j['currentVersion']['body'], (*ancestry, id))
  except urllib.error.HTTPError as e:
   if a.get('content'): return resolve(json.loads(a['content']), (*ancestry, id))
   issues.append({'block': id, 'status': e.code, 'reason': 'Source does not grant public access'})
   return {'type': 'paragraph'}
 return {**n, **({'content': [resolve(c, ancestry) for c in n['content']]} if 'content' in n else {})}
def references_removed(n):
 links = [m.get('attrs', {}).get('link', {}).get('url', '') for m in n.get('marks', []) if m['type'] == 'link']
 return any(any('/' + id in u for id in removed) for u in links if u) or any(references_removed(c) for c in n.get('content', []))
# Explicit audience branches; do not remove general explanations mentioning future study.
OTHER = re.compile(r'^(?:[12] курс онлайн-магистратуры|2 и 3 курсы бакалавриата|Наставники 2 и 3 курсов|Для бакалавров 2\+ курса|Социальные связи|Хендбук онлайн-магистратуры|Дизайн 1.0|Академия ML-2025|Стипендиальная программа Сбера|В магистратуре|Магистратура|Онлайн-магистратура|Очная магистратура|Школа дизайна|Школа естественных наук|Бакалавриат,? [23]\+? курс|[234] курс \(|Выбор курсов для потока 202[45])', re.I)
def clean(n):
 t = n['type']; a = n.get('attrs', {}); label = text(n).strip()
 if t == 'media' and not a.get('src'):
  issues.append({'media': a.get('id'), 'reason': 'Unfinished upload in source, no file URL'}); return None
 if t == 'tableOfContents': return None  # A single generated TOC is rendered beside the article.
 if t in ('expandSection', 'tabContent'):
  title = text(n.get('content', [{}])[0]).strip() if t == 'expandSection' else a.get('title', '')
  if OTHER.search(title): return None
 if t == 'table_row':
  first = text(n.get('content', [{}])[0]).strip()
  if OTHER.search(first) or 'Сбер' in first: return None
 if t in ('paragraph', 'list_item', 'panel'):
  if len(label) < 200 and (OTHER.search(label) or (references_removed(n) and len(label) < 100)): return None
  if t == 'list_item' and re.search(r'копию диплома бакалавра.*магистратур', label, re.I): return None
 children_out = []; skip_level = None
 # Mixed-program paragraphs can contain a trailing magistracy-only sentence.
 trim_masters = t == 'paragraph' and 'Магистрантам' in label and 'бакалавриата' in label
 for child in n.get('content', []):
  if trim_masters and child.get('type') == 'text' and 'Магистрантам' in child.get('text', ''):
   prefix = child['text'].split('Магистрантам')[0].rstrip()
   if prefix: children_out.append({**child, 'text': prefix})
   break
  if child['type'] == 'heading':
   level = child.get('attrs', {}).get('level', 2)
   if skip_level is not None and level <= skip_level: skip_level = None
   if OTHER.search(text(child).strip()): skip_level = level; continue
  if skip_level is not None: continue
  value = clean(child)
  if value: children_out.append(value)
 attrs = {k: v for k, v in a.items() if k in ('id', 'level', 'title', 'type', 'start', 'colspan', 'rowspan', 'src', '_meta', '_mimetype', 'latex', 'url', 'formula')}
 if '_meta' in attrs: attrs['_meta'] = {k:v for k,v in attrs['_meta'].items() if k in ('title','simpleType','size')}
 out = {'type': t}
 if attrs: out['attrs'] = attrs
 if 'text' in n: out['text'] = n['text']
 marks = []
 for m in n.get('marks', []):
  if m['type'] == 'link':
   link = m.get('attrs', {}).get('link', {})
   if link.get('url'): marks.append({'type': 'link', 'attrs': {'href': link['url']}})
  elif m['type'] in ('bold', 'italic', 'strike', 'underline', 'code', 'subscript', 'superscript'): marks.append({'type': m['type']})
 if marks: out['marks'] = marks
 if children_out: out['content'] = children_out
 if t not in ('text', 'media', 'hardBreak', 'horizontal_rule', 'database', 'inlineMath', 'remoteIframe', 'remoteIframeTitle', 'remoteIframeContent') and not children_out: return None
 return out
def fetch_page(n):
 j = cached(n['id'], 'article', '/api/v1/wiki/articles/' + n['id'] + '?viewMode=edit&latestVersionAt=1')
 return n, resolve(json.loads(j['editorContentObject']['content']))
# Remove stale exports when audience selection becomes narrower.
for old in OUT.glob('*.json'):
 if re.fullmatch(r'[a-f0-9-]{36}', old.stem) and old.stem not in selected: old.unlink()
manifest = []; search = []
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for n, doc in pool.map(fetch_page, nodes):
  doc = clean(doc) or {'type': 'doc'}
  (OUT / (n['id'] + '.json')).write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')))
  # Boundaries separate adjacent paragraphs for useful full-text search excerpts.
  def searchable(node): return node.get('text', '') + ' '.join(searchable(c) for c in node.get('content', []))
  body = re.sub(r'\s+', ' ', searchable(doc)).strip()
  manifest.append({**n, 'summary': body[:180]})
  search.append({'id': n['id'], 'text': body})
pathlib.Path('src/data/handbook-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
(OUT / 'search.json').write_text(json.dumps(search, ensure_ascii=False, separators=(',', ':')))
report_dir = pathlib.Path('docs/handbook'); report_dir.mkdir(parents=True, exist_ok=True)
(report_dir / 'import-report.json').write_text(json.dumps({
 'source': BASE + '/at/' + ROOT, 'role': 'Бакалавриат, Школа технологий, 1 курс', 'importedAt': '2026-11-13',
 'pages': len(manifest), 'aliases': {PROGRAM_ALIAS: PROGRAM}, 'excluded': omissions, 'unavailableBlocks': issues,
 'attachments': 'Original public source URLs; institutional services remain external links',
 'filtering': 'Removed explicit audience branches and senior-only pages; future trajectory explanations retained',
}, ensure_ascii=False, indent=2))
print('Exported', len(manifest), 'pages;', len(issues), 'unavailable blocks')

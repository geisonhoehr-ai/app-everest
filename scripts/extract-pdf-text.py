import fitz, sys, json, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
doc = fitz.open(sys.argv[1])
pages = []
for i in range(doc.page_count):
    pages.append(doc[i].get_text())
print(json.dumps(pages, ensure_ascii=False))
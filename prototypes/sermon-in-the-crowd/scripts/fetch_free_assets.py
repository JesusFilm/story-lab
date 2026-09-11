import urllib.request,urllib.parse,re,json,http.cookiejar,pathlib,concurrent.futures
out=pathlib.Path(__file__).resolve().parents[1]/'.cache/free-models'
out.mkdir(parents=True,exist_ok=True)
def get(slug):
 dest=out/(slug+'.zip')
 if dest.exists(): return print('Present',slug,flush=True)
 o=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 base='https://quaternius.itch.io/'+slug
 s=o.open(base).read().decode();token=re.search('name="csrf_token" value="([^"]+)',s).group(1)
 def post(url):return json.load(o.open(urllib.request.Request(url,data=urllib.parse.urlencode({'csrf_token':token}).encode(),headers={'Referer':base,'X-Requested-With':'XMLHttpRequest'})))
 page=post(base+'/download_url')['url'];s=o.open(page).read().decode();token=re.search('name="csrf_token" value="([^"]+)',s).group(1)
 ids=re.findall('data-upload_id="(\d+)"',s);assert len(ids)==1,(slug,ids)
 data=post(base+'/file/'+ids[0]);print(slug,'downloading',flush=True)
 with o.open(data['url'],timeout=120) as response,open(dest,'wb') as f:
  while True:
   chunk=response.read(1024*1024)
   if not chunk:break
   f.write(chunk)
 print(slug,dest.stat().st_size,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as p:list(p.map(get,['universal-base-characters','modular-character-outfits-fantasy','universal-animation-library']))

# The robe is a separate CC0 work, not the ShareAlike animated derivative.
monk=out/'MONK_1.blend'
if not monk.exists():urllib.request.urlretrieve('https://opengameart.org/sites/default/files/MONK_1.blend',monk)
import zipfile
for slug in ['universal-base-characters','modular-character-outfits-fantasy','universal-animation-library']:
 with zipfile.ZipFile(out/(slug+'.zip')) as z:
  for info in z.infolist():
   target=(out/slug/info.filename).resolve()
   if not target.is_relative_to((out/slug).resolve()):raise ValueError('Invalid archive path')
  z.extractall(out/slug)
print('Free CC0 source assets ready.')

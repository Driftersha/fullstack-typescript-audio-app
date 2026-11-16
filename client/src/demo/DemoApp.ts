interface Track { id:string; title:string; artist:string; url:string; origin:'local'|'cc0'; source?:string }
interface CatalogEntry { file:string; title:string; artist:string; sourceUrl:string }
function time(s:number):string {return Number.isFinite(s)&&s>=0 ? `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` : '0:00';}
function catalog(data:unknown):CatalogEntry[] {
  if(!Array.isArray(data)) return [];
  const used=new Set<string>();
  return data.filter((row:unknown):row is CatalogEntry=>{
    if(!row||typeof row!=='object') return false;
    const t=row as Record<string,unknown>;
    const ok=typeof t.file==='string' && /^[a-z0-9_-]+\.mp3$/i.test(t.file) && !used.has(t.file)
       && typeof t.title==='string' && t.title.trim().length>0
       && typeof t.artist==='string' && t.artist.trim().length>0
       && typeof t.sourceUrl==='string' && t.sourceUrl.startsWith('https://freemusicarchive.org/music/');
    if(ok) used.add(t.file as string);
    return ok;
  });
}
/** Offline-friendly demo. Never uploads visitor files to a server. */
export class DemoApp {
  readonly el=document.createElement('div');
  private readonly audio=new Audio();
  private readonly tracks:Track[]=[];
  private readonly favorites=new Set<string>();
  private readonly objectUrls=new Set<string>();
  private selected:string|null=null;
  private favoritesOnly=false;
  private repeat=false;
  private sequence=0;
  private query='';
  private list!:HTMLElement;
  private status!:HTMLElement;
  private count!:HTMLElement;
  private now!:HTMLElement;
  private nowArtist!:HTMLElement;
  private playBtn!:HTMLButtonElement;
  private progress!:HTMLInputElement;
  private clock!:HTMLElement;
  private allTab!:HTMLButtonElement;
  private favTab!:HTMLButtonElement;
  constructor(){
    this.el.className='demo';
    this.el.innerHTML=`
    <div class="demo__shell">
      <aside class="demo__sidebar">
        <a href="#/tracks" class="demo__brand">◉ AUDIO<span>PLAYER</span></a>
        <p class="demo__eyebrow">HAKVIRA · PORTFOLIO</p>
        <nav class="demo__nav"><button id="all" class="is-active" type="button">♫ Все треки</button><button id="favorites" type="button">♡ Избранное</button></nav>
        <p class="demo__privacy">Файлы остаются на вашем устройстве.</p>
      </aside>
      <main class="demo__main">
        <div class="demo__top"><span>WEB AUDIO EXPERIENCE</span><span>DEMO MODE</span></div>
        <section class="demo__hero"><p>ТВОЯ МУЗЫКА · ТВОЙ РИТМ</p><h1>Слушай по-своему<span>.</span></h1><p>Полноценный аудиоплеер без регистрации и загрузки файлов на сервер.</p><label class="demo__upload">＋ Добавить MP3<input id="files" type="file" accept=".mp3,audio/mpeg" multiple></label></section>
        <section class="demo__library"><div class="demo__library-head"><h2>Музыкальная библиотека</h2><span id="count">0 треков</span></div><input id="search" type="search" placeholder="Поиск по названию или исполнителю" aria-label="Поиск по библиотеке"><p id="status" role="status"></p><div id="list"></div></section>
        <p class="demo__footnote">Публичный CC0-каталог будет подключён после проверки файлов и лицензий. <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer">Что такое CC0</a></p>
      </main>
    </div>
    <footer class="demo__player"><div class="demo__playing"><strong id="now">Трек не выбран</strong><span id="nowArtist">Добавьте MP3 для прослушивания</span></div><div class="demo__center"><div class="demo__controls"><button id="repeat" type="button" aria-pressed="false">↻</button><button id="prev" type="button" aria-label="Предыдущий трек">⏮</button><button id="play" type="button" aria-label="Воспроизвести или поставить на паузу">▶</button><button id="next" type="button" aria-label="Следующий трек">⏭</button></div><div class="demo__timeline"><input id="progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Позиция трека"><span id="clock">0:00 / 0:00</span></div></div><label class="demo__volume">♫ <input id="volume" type="range" min="0" max="1" step="0.01" value="0.85" aria-label="Громкость"></label></footer>`;
    const el=<T extends Element>(id:string)=>this.el.querySelector<T>('#'+id)!;
    this.list=el('list');this.status=el('status');this.count=el('count');this.now=el('now');
    this.nowArtist=el('nowArtist');this.playBtn=el('play');this.progress=el('progress');
    this.clock=el('clock');this.allTab=el('all');this.favTab=el('favorites');
    this.allTab.onclick=()=>this.filter(false);
    this.favTab.onclick=()=>this.filter(true);
    el<HTMLInputElement>('search').oninput=(ev)=>{this.query=(ev.target as HTMLInputElement).value.trim().toLocaleLowerCase();this.render();};
    const input=el<HTMLInputElement>('files');
    input.onchange=()=>{let added=0;for(const file of Array.from(input.files||[])){
      if(!/\.mp3$/i.test(file.name)||file.size<1||file.size>75*1024*1024)continue;
      const url=URL.createObjectURL(file);this.objectUrls.add(url);
      this.tracks.push({id:'local:'+ ++this.sequence,title:file.name.replace(/\.mp3$/i,'').replace(/_/g,' '),artist:'Локальный файл',url,origin:'local'});added++;
    }
    input.value='';this.message(added?`Добавлено MP3: ${added}. Ничего не отправлено на сервер.`:'Выберите MP3 размером до 75 МБ.');this.render();};
    this.playBtn.onclick=()=>{void this.toggle();};
    el<HTMLButtonElement>('prev').onclick=()=>this.skip(-1);
    el<HTMLButtonElement>('next').onclick=()=>this.skip(1);
    el<HTMLButtonElement>('repeat').onclick=()=>{this.repeat=!this.repeat;this.audio.loop=this.repeat;el<HTMLButtonElement>('repeat').setAttribute('aria-pressed',String(this.repeat));};
    this.progress.oninput=()=>{if(Number.isFinite(this.audio.duration)&&this.audio.duration>0)this.audio.currentTime=Number(this.progress.value)/100*this.audio.duration;};
    const volume=el<HTMLInputElement>('volume');this.audio.volume=Number(volume.value);
    volume.oninput=()=>{this.audio.volume=Number(volume.value);};
    this.audio.addEventListener('timeupdate',()=>this.updateTime());
    this.audio.addEventListener('loadedmetadata',()=>this.updateTime());
    this.audio.addEventListener('play',()=>{this.playBtn.textContent='Ⅱ';});
    this.audio.addEventListener('pause',()=>{this.playBtn.textContent='▶';});
    this.audio.addEventListener('ended',()=>{this.skip(1);});
    this.audio.addEventListener('error',()=>this.message('Не удалось воспроизвести файл.'));
    window.addEventListener('beforeunload',()=>{this.audio.pause();this.objectUrls.forEach(url=>URL.revokeObjectURL(url));});
    this.render();void this.loadCatalog();
  }
  private message(m:string){this.status.textContent=m;}
  private filter(fav:boolean){this.favoritesOnly=fav;this.allTab.classList.toggle('is-active',!fav);this.favTab.classList.toggle('is-active',fav);this.render();}
  private async loadCatalog(){
    try{
      const response=await fetch('/audio/catalog.json',{cache:'no-store'});
      if(response.status===404)return;
      if(!response.ok)throw new Error('Catalog unavailable');
      for(const item of catalog(await response.json())){
        this.tracks.push({id:'cc0:'+item.file,title:item.title,artist:item.artist,url:'/audio/'+item.file,origin:'cc0',source:item.sourceUrl});
      }
      this.render();
    }catch{this.message('Публичный музыкальный каталог пока не подключён. Добавьте свои MP3.');}
  }
  private async select(track:Track){
    if(this.selected!==track.id){this.selected=track.id;this.audio.pause();this.audio.src=track.url;this.now.textContent=track.title;this.nowArtist.textContent=track.artist;this.updateTime();this.render();}
    await this.toggle(true);
  }
  private async toggle(force=false){
    if(!this.selected){if(this.tracks.length)await this.select(this.tracks[0]);else this.message('Сначала добавьте MP3.');return;}
    if(!force&&!this.audio.paused){this.audio.pause();return;}
    try{await this.audio.play();this.message('');}catch{this.message('Не удалось начать воспроизведение. Проверьте файл.');}
  }
  private skip(direction:number){
    if(!this.tracks.length)return;const current=this.tracks.findIndex(t=>t.id===this.selected);
    const next=current<0?0:(current+direction+this.tracks.length)%this.tracks.length;
    void this.select(this.tracks[next]);
  }
  private updateTime(){
    const total=this.audio.duration;this.clock.textContent=`${time(this.audio.currentTime)} / ${time(total)}`;
    this.progress.value=Number.isFinite(total)&&total>0?String(this.audio.currentTime/total*100):'0';
  }
  private render(){
    this.count.textContent=`${this.tracks.length} треков`;this.list.replaceChildren();
    const visible=this.tracks.filter(t=>(!this.favoritesOnly||this.favorites.has(t.id))&&(`${t.title} ${t.artist}`.toLocaleLowerCase().includes(this.query)));
    if(!visible.length){const p=document.createElement('p');p.className='demo__empty';p.textContent=this.tracks.length?'Ничего не найдено.':'Здесь пока нет музыки. Добавьте MP3 с устройства.';this.list.append(p);return;}
    for(const track of visible){
      const row=document.createElement('div');row.className='demo__track';if(track.id===this.selected)row.classList.add('is-selected');
      const open=document.createElement('button');open.type='button';open.className='demo__track-open';open.onclick=()=>{void this.select(track);};
      const art=document.createElement('span');art.className='demo__track-art';art.textContent='♫';
      const info=document.createElement('span');info.className='demo__track-text';
      const title=document.createElement('strong');title.textContent=track.title;
      const artist=document.createElement('small');artist.textContent=track.artist;info.append(title,artist);open.append(art,info);
      const source=track.source?document.createElement('a'):document.createElement('span');
      source.className='demo__source';source.textContent=track.source?'CC0 · источник':'С устройства';
      if(source instanceof HTMLAnchorElement&&track.source){source.href=track.source;source.target='_blank';source.rel='noopener noreferrer';}
      const fav=document.createElement('button');fav.type='button';fav.className='demo__favorite';fav.textContent=this.favorites.has(track.id)?'♥':'♡';
      fav.setAttribute('aria-label',this.favorites.has(track.id)?'Убрать из избранного':'Добавить в избранное');
      fav.onclick=()=>{if(this.favorites.has(track.id))this.favorites.delete(track.id);else this.favorites.add(track.id);this.render();};
      row.append(open,source,fav);this.list.append(row);
    }
  }
}

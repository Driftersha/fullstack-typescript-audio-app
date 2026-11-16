import logoUrl from '../assets/sprite/icon-logo.svg';
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
  private shuffle=false;
  private readonly durationById=new Map<string,number>();
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
        <a href="#/tracks" class="demo__brand" aria-label="Главная — аудиокомпозиции"><img src="${logoUrl}" alt="Vibe Music" width="185" height="31"></a>
        <nav class="demo__nav" aria-label="Разделы плеера">
          <button id="favorites" type="button"><span aria-hidden="true">♡</span> Избранное</button>
          <button id="all" class="is-active" type="button"><span aria-hidden="true">♫</span> Аудиокомпозиции</button>
        </nav>
      </aside>
      <header class="demo__header">
        <label class="demo__search-box"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Поиск по названию или исполнителю" aria-label="Поиск по музыке"></label>
        <div class="demo__account" aria-label="Демонстрационный режим"><span class="demo__avatar" aria-hidden="true">♫</span><span>Гость</span><span class="demo__chevron" aria-hidden="true">⌄</span></div>
      </header>
      <main class="demo__main">
        <section class="demo__library">
          <div class="demo__library-head"><h1>Аудиофайлы и треки</h1><label class="demo__upload">＋ Добавить MP3<input id="files" type="file" accept=".mp3,audio/mpeg" multiple></label></div>
          <div class="demo__table-head" aria-hidden="true"><span>№</span><span>Название</span><span>Альбом</span><span>Добавлено</span><span>Длительность</span><span></span></div>
          <p id="status" role="status" aria-live="polite"></p>
          <div id="list" class="demo__rows"></div>
          <p class="demo__footnote"><span id="count">0 треков</span> · Без регистрации: ваши файлы остаются на устройстве. <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer">О лицензии CC0</a></p>
        </section>
      </main>
    </div>
    <footer class="demo__player">
      <div class="demo__playing"><div class="demo__player-art" aria-hidden="true">♫</div><div class="demo__player-info"><strong id="now">Нет трека</strong><span id="nowArtist">Добавьте MP3</span></div></div>
      <div class="demo__center">
        <div class="demo__controls">
          <button id="repeat" type="button" aria-pressed="false" aria-label="Повтор трека">↻</button>
          <button id="prev" type="button" aria-label="Предыдущий трек">⏮</button>
          <button id="play" type="button" aria-label="Воспроизвести или поставить на паузу">▶</button>
          <button id="next" type="button" aria-label="Следующий трек">⏭</button>
          <button id="shuffle" type="button" aria-pressed="false" aria-label="Случайный порядок">⇄</button>
        </div>
        <div class="demo__timeline"><input id="progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Позиция трека"><span id="clock">0:00 / 0:00</span></div>
      </div>
      <label class="demo__volume"><span aria-hidden="true">♫</span><input id="volume" type="range" min="0" max="1" step="0.01" value="0.85" aria-label="Громкость"></label>
    </footer>`;
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
    el<HTMLButtonElement>('shuffle').onclick=()=>{
      this.shuffle=!this.shuffle;
      if(this.shuffle){this.repeat=false;this.audio.loop=false;el<HTMLButtonElement>('repeat').setAttribute('aria-pressed','false');}
      el<HTMLButtonElement>('shuffle').setAttribute('aria-pressed',String(this.shuffle));
    };
    el<HTMLButtonElement>('repeat').onclick=()=>{this.repeat=!this.repeat;if(this.repeat){this.shuffle=false;el<HTMLButtonElement>('shuffle').setAttribute('aria-pressed','false');}this.audio.loop=this.repeat;el<HTMLButtonElement>('repeat').setAttribute('aria-pressed',String(this.repeat));};
    this.progress.oninput=()=>{if(Number.isFinite(this.audio.duration)&&this.audio.duration>0)this.audio.currentTime=Number(this.progress.value)/100*this.audio.duration;};
    const volume=el<HTMLInputElement>('volume');this.audio.volume=Number(volume.value);
    volume.oninput=()=>{this.audio.volume=Number(volume.value);};
    this.audio.addEventListener('timeupdate',()=>this.updateTime());
    this.audio.addEventListener('loadedmetadata',()=>{if(this.selected&&Number.isFinite(this.audio.duration)){this.durationById.set(this.selected,this.audio.duration);this.render();}this.updateTime();});
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
    let next=current<0?0:(current+direction+this.tracks.length)%this.tracks.length;
    if(this.shuffle&&this.tracks.length>1){next=Math.floor(Math.random()*(this.tracks.length-1));if(next>=current)next++;}
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
      const index=document.createElement('span');index.className='demo__track-index';index.textContent=String(visible.indexOf(track)+1);
      const album=document.createElement('span');album.className='demo__album';album.textContent=track.origin==='cc0'?'CC0 1.0':'—';
      const date=document.createElement('span');date.className='demo__date';date.textContent='—';
      const duration=document.createElement('span');duration.className='demo__duration';const seconds=this.durationById.get(track.id);duration.textContent=seconds===undefined?'—':time(seconds);
      row.append(index,open,album,date,duration,fav);this.list.append(row);
    }
  }
}

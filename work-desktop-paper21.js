
/* Work-only desktop visual renderer, ported from the approved CENTER Demo 21.
   The existing work.js remains the single owner of scrolling, 19 cards,
   index metadata, details, and all mobile handling. */
import { gsap } from 'gsap';
const mq=matchMedia('(min-width:851px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
const articles=[...document.querySelectorAll('#work-stack .work-card')],counter=document.querySelector('#work-number');
if(articles.length&&counter){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),N=articles.length,wrap=n=>((n%N)+N)%N;
const delta=(i,p)=>{let d=wrap(i-p);return d>N/2?d-N:d};
const cfg={depth:.94,focal:1160,angle:8.4,pitch:4,yaw:2,shear:.22,spacing:2.4,flat:.24,top:.50,bottom:.74};
let W=innerWidth,H=innerHeight,pos=0,lastPos=0,lastT=performance.now(),soft=0,velocity=0,scheduled=false,active=false;
const skew={value:0},hover={lift:0,x:0,y:0},images=articles.map((article,i)=>({i,img:article.querySelector('img'),tex:null}));
const stage=document.createElement('div'),canvas=document.createElement('canvas'),masks=document.createElement('div');
stage.className='work-paper-stage';canvas.className='work-paper-canvas';stage.append(canvas);document.body.append(stage);
masks.className='work-paper-masks';document.body.append(masks);
const layers=Array.from({length:9},()=>{const e=document.createElement('div'),n=document.createElement('span');e.className='work-paper-mask';n.className='work-paper-number-white';e.append(n);masks.append(e);return {e,n}});
const hit=document.createElement('button'),cursor=document.createElement('div');
hit.className='work-paper-hotspot';hit.type='button';hit.setAttribute('aria-label','Open selected project');
cursor.className='work-paper-cursor';cursor.textContent='CLICK ↗';
document.body.append(hit,cursor);
const ease=t=>t*t*(3-2*t),width=()=>Math.min(W*.246,390);
function pose(d){
const a=Math.abs(d),t=ease(clamp(a,0,1)),far=Math.min(Math.max(0,a-1),3.1),top=d<0;
const lower=top?0:clamp(4-a,0,3)*t,dx=top?Math.min(W*.122,188):Math.min(W*.174,260);
const x=d===0?0:top?dx*t+far*15*cfg.spacing:-dx*t+lower*16*cfg.spacing;
const y=top?-H*cfg.top*t-far*15*cfg.spacing:H*cfg.bottom*t-lower*20*cfg.spacing;
const z=cfg.depth*(30-102*t-27*(top?far:lower))+(a<.72?hover.lift*42*(1-a/.72):0);
const leaf=Math.sin(Math.PI*clamp(a,0,1));
return {x,y:y-(a<.72?hover.lift*13*(1-a/.72):0),z,w:width(),h:width()*.775,
pitch:cfg.depth*cfg.pitch*t+(top?1:-1)*17*leaf-(a<.72?hover.y*2.7:0),
yaw:cfg.depth*cfg.yaw*t+(top?1:-1)*2.4*leaf+(a<.72?hover.x*3.3:0),
roll:1.05+(cfg.angle-1.05)*t,shear:cfg.shear*t,
alpha:a>3.45?Math.max(0,(4.25-a)/.8):1};
}
function deform(d){
const a=Math.abs(d),u=clamp((a-cfg.flat)/(.88-cfg.flat),0,1),flat=ease(u);
const amp=reduce.matches?0:soft*Math.exp(-Math.max(0,a-.45)*.65)*flat;
return {fold:.95*amp*.78,bend:.95*amp*19,twist:.14*amp*.4*(skew.value<0?-1:1),
skew:reduce.matches?0:skew.value*Math.exp(-Math.max(0,a-.45)*.65)*flat,
curl:reduce.matches?0:Math.pow(Math.sin(Math.PI*clamp(a,0,1)),1.1)*flat*(.62+.38*soft),
side:d<0?-1:1};
}
function point(x,y,p,b){
const axis=x+.11*y,f=b.fold;
let px=(f>.00001?(Math.sin(f*axis)/f-.11*y)*p.w:x*p.w)+y*p.w*b.skew*.015;
let py=y*p.h,pz=f>.00001?p.w*(1-Math.cos(f*axis))/f:0;
pz+=b.bend*Math.sin(Math.PI*(x+.5))*(.7+.3*Math.cos(y*Math.PI))+b.twist*x*y*12;
const edge=b.side>0?x+.5:.5-x,c=edge*edge*(3-2*edge);
px-=b.curl*b.side*c*13.5;pz+=b.curl*(33*c+4*Math.sin(Math.PI*edge)*Math.sin(Math.PI*(y+.5)));
py+=b.curl*4*Math.sin(Math.PI*edge)*Math.sin(Math.PI*(y+.5));px+=py*p.shear;
let a=p.yaw*Math.PI/180,co=Math.cos(a),si=Math.sin(a);[px,pz]=[co*px+si*pz,-si*px+co*pz];
a=p.pitch*Math.PI/180;co=Math.cos(a);si=Math.sin(a);[py,pz]=[co*py-si*pz,si*py+co*pz];
a=p.roll*Math.PI/180;co=Math.cos(a);si=Math.sin(a);[px,py]=[co*px-si*py,si*px+co*py];
const q=cfg.focal/Math.max(320,cfg.focal-(pz+p.z));
return {x:W*.489+(px+p.x)*q,y:H*.48+(py+p.y)*q};
}
function exposure(d){
const p=pose(d),b=deform(d);let top=Infinity,bottom=-Infinity;
for(let i=0;i<=12;i++){const v=-.5+i/12;for(const [x,y] of [[v,-.5],[v,.5],[-.5,v],[.5,v]]){const q=point(x,y,p,b);top=Math.min(top,q.y);bottom=Math.max(bottom,q.y)}}
return bottom>top?clamp((Math.min(H,bottom)-Math.max(0,top))/(bottom-top),0,1):0;
}
function fit(){for(const [key,d,goal] of [['top',-1,.70],['bottom',1,.45]]){let lo=.18,hi=1.10;for(let i=0;i<21;i++){let mid=(lo+hi)/2;cfg[key]=mid;if(exposure(d)>goal)lo=mid;else hi=mid;}cfg[key]=(lo+hi)/2;}}
const order=d=>Math.abs(d)<.13?90:d>0?8+Math.min(d,4.2)*5:34+d*4;
let gl,uni,count=0,cpu=null;
const VS='precision highp float;attribute vec2 ap,au;uniform vec2 uv,uo,us;uniform vec3 uc,ur;uniform float uf,ub,uw,ut,uk,ul,uh,ud;varying vec2 vt;varying float shade;const float PI=3.14159265;void main(){float x=ap.x,y=ap.y,axis=x+.11*y;float px=x*us.x,py=y*us.y,pz=0.;if(ub>.00001){px=(sin(ub*axis)/ub-.11*y)*us.x;pz=us.x*(1.-cos(ub*axis))/ub;}px+=y*us.x*uk*.015;float bow=sin(PI*(x+.5))*(.7+.3*cos(y*PI));pz+=uw*bow+ut*x*y*12.;float edge=ud>0.?x+.5:.5-x;float curve=edge*edge*(3.-2.*edge);px-=ul*ud*curve*13.5;pz+=ul*(33.*curve+4.*sin(PI*edge)*sin(PI*(y+.5)));py+=ul*4.*sin(PI*edge)*sin(PI*(y+.5));px+=py*uh;vec3 p=vec3(px,py,pz);float a=radians(ur.y),c=cos(a),s=sin(a);p.xz=mat2(c,-s,s,c)*p.xz;a=radians(ur.x);c=cos(a);s=sin(a);p.yz=mat2(c,s,-s,c)*p.yz;a=radians(ur.z);c=cos(a);s=sin(a);p.xy=mat2(c,s,-s,c)*p.xy;p+=uc;float f=uf/max(320.,uf-p.z);vec2 v=uo+p.xy*f;gl_Position=vec4(v.x/uv.x*2.-1.,1.-v.y/uv.y*2.,0.,1.);vt=au;shade=clamp(1.-.023*(ub/.6)*x-.065*ul*curve,.86,1.035);}';
const FS='precision mediump float;uniform sampler2D tex;uniform float alpha;varying vec2 vt;varying float shade;void main(){vec4 v=texture2D(tex,vt);gl_FragColor=vec4(clamp(v.rgb*shade,0.,1.),v.a*alpha);}';
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function initialize(){
gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false})||canvas.getContext('experimental-webgl',{alpha:true,antialias:true,depth:false});
if(!gl)return false;
const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const v=[],ids=[],nx=44,ny=30;
for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)v.push(x/nx-.5,y/ny-.5,x/nx,y/ny);
for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*(nx+1)+x;ids.push(i,i+nx+1,i+1,i+1,i+nx+1,i+nx+2)}
const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ids),gl.STATIC_DRAW);
for(const [key,offset] of [['ap',0],['au',8]]){const a=gl.getAttribLocation(prog,key);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,16,offset)}
gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
uni={};for(const k of ['uv','uo','us','uc','ur','uf','ub','uw','ut','uk','ul','uh','ud','alpha','tex'])uni[k]=gl.getUniformLocation(prog,k);
gl.uniform1i(uni.tex,0);count=ids.length;return true;
}
const ready=(()=>{try{if(initialize())return true}catch(e){console.warn('Work Demo21 GPU initialization failed',e)} if(!gl){cpu=canvas.getContext('2d',{alpha:true});return !!cpu}return false})();
function upload(item){
if(!ready||item.tex||!item.img?.naturalWidth)return;
if(cpu){item.tex=item.img;schedule();return;}
try{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,item.img);item.tex=t;
}catch(e){console.warn('Work texture',e)}schedule();
}
function silhouette(d){
const p=pose(d),b=deform(d),points=[],add=(x,y)=>{const q=point(x,y,p,b);points.push((q.x/W*100).toFixed(3)+'% '+(q.y/H*100).toFixed(3)+'%')};
for(let i=0;i<=10;i++)add(-.5+i/10,-.5);
for(let i=1;i<=8;i++)add(.5,-.5+i/8);
for(let i=9;i>=0;i--)add(-.5+i/10,.5);
for(let i=7;i>=1;i--)add(-.5,-.5+i/8);
return 'polygon('+points.join(',')+')';
}
function masksUpdate(visible){
const rect=counter.getBoundingClientRect(),s=getComputedStyle(counter);let j=0;
for(const {item,d} of visible){if(!item.tex||j>=layers.length)continue;
const z=layers[j++];z.e.hidden=false;z.e.style.clipPath=silhouette(d);z.n.textContent=counter.textContent;
Object.assign(z.n.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing});
}for(;j<layers.length;j++)layers[j].e.hidden=true;
}

function updateHit(){
const p=pose(0),a=point(-.5,-.5,p,deform(0)),b=point(.5,.5,p,deform(0));
Object.assign(hit.style,{left:Math.min(a.x,b.x)+'px',top:Math.min(a.y,b.y)+'px',
width:Math.abs(b.x-a.x)+'px',height:Math.abs(b.y-a.y)+'px'});
}
// Canvas 2D mesh fallback uses the same Demo 21 paperPoint/pile geometry
// and stable shuffled paint order. Only used when WebGL is unavailable.
function drawCPU(list){
const ctx=cpu,dpr=canvas.width/Math.max(1,W),nx=13,ny=9;
ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
for(const {item,d} of list){
if(!item.tex)continue;
const img=item.img,p=pose(d),b=deform(d);
if(Math.abs(d)<.012&&Math.abs(hover.x)<.03&&Math.abs(hover.y)<.03){
const factor=cfg.focal/Math.max(320,cfg.focal-p.z);
ctx.save();ctx.globalAlpha=p.alpha;ctx.translate(W*.489+p.x*factor,H*.48+p.y*factor);
ctx.rotate(p.roll*Math.PI/180);ctx.drawImage(img,-p.w*factor/2,-p.h*factor/2,p.w*factor,p.h*factor);ctx.restore();continue;
}
const pts=[];
for(let y=0;y<=ny;y++){const row=[];for(let x=0;x<=nx;x++)row.push(point(x/nx-.5,y/ny-.5,p,b));pts.push(row)}
const sw=img.naturalWidth||img.width,sh=img.naturalHeight||img.height;
ctx.globalAlpha=p.alpha;
for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
const q=[[x,y],[x+1,y],[x,y+1],[x+1,y+1]];
for(const indices of [[0,2,1],[1,2,3]]){
const src=indices.map(k=>({x:q[k][0]*sw/nx,y:q[k][1]*sh/ny}));
const dst=indices.map(k=>pts[q[k][1]][q[k][0]]);
const a=src[1].x-src[0].x,b=src[1].y-src[0].y,c=src[2].x-src[0].x,d=src[2].y-src[0].y;
const det=a*d-c*b;if(Math.abs(det)<1e-6)continue;
const dx=dst[1].x-dst[0].x,dy=dst[1].y-dst[0].y,ex=dst[2].x-dst[0].x,ey=dst[2].y-dst[0].y;
const aa=(dx*d-ex*b)/det,bb=(dy*d-ey*b)/det,cc=(ex*a-dx*c)/det,dd=(ey*a-dy*c)/det;
const ee=dst[0].x-aa*src[0].x-cc*src[0].y,ff=dst[0].y-bb*src[0].x-dd*src[0].y;
ctx.save();ctx.beginPath();
const midX=(dst[0].x+dst[1].x+dst[2].x)/3,midY=(dst[0].y+dst[1].y+dst[2].y)/3;
for(let j=0;j<3;j++){const v=dst[j],vx=v.x-midX,vy=v.y-midY,len=Math.max(1,Math.hypot(vx,vy));
const xx=v.x+vx/len*1.1,yy=v.y+vy/len*1.1;
if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}
ctx.closePath();ctx.clip();ctx.setTransform(aa,bb,cc,dd,ee,ff);ctx.drawImage(img,0,0);ctx.restore();
}
}
}
ctx.globalAlpha=1;
}

function draw(){
if(!ready||!mq.matches||!active)return;
const visible=images.map((item,i)=>({item,d:delta(i,pos)})).filter(x=>Math.abs(x.d)<4.2).sort((a,b)=>order(a.d)-order(b.d));
if(cpu){drawCPU(visible);masksUpdate(visible);updateHit();return;}
gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
gl.uniform2f(uni.uv,W,H);gl.uniform2f(uni.uo,W*.489,H*.48);gl.uniform1f(uni.uf,cfg.focal);
for(const {item,d} of visible){if(!item.tex)continue;const p=pose(d),b=deform(d);
gl.uniform2f(uni.us,p.w,p.h);gl.uniform3f(uni.uc,p.x,p.y,p.z);gl.uniform3f(uni.ur,p.pitch,p.yaw,p.roll);
gl.uniform1f(uni.ub,b.fold);gl.uniform1f(uni.uw,b.bend);gl.uniform1f(uni.ut,b.twist);gl.uniform1f(uni.uk,b.skew);gl.uniform1f(uni.ul,b.curl);gl.uniform1f(uni.uh,p.shear);gl.uniform1f(uni.ud,b.side);gl.uniform1f(uni.alpha,p.alpha);
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.tex);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
}masksUpdate(visible);
updateHit();
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(frame)}}
function frame(){scheduled=false;const wanted=Math.min(1,Math.abs(skew.value)/10.5+Math.abs(velocity)*.1);
soft+=(wanted-soft)*(1-Math.exp(-.019/(wanted>soft?.105:.29)));
if(soft<.00025&&wanted<.00025)soft=0;draw();velocity*=.84;
if(soft>.001||Math.abs(skew.value)>.01||Math.abs(velocity)>.005)schedule();
}
function activate(){
if(!ready||!mq.matches||!images[0]?.tex)return;
W=innerWidth;H=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.8);
canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);fit();
active=true;document.body.classList.add('work-paper-ready');schedule();
}
if(ready){
for(const item of images){if(!item.img)continue;item.img.loading='eager';if(item.img.complete)upload(item);
item.img.addEventListener('load',()=>{upload(item);if(item.i===0)activate()})}
if(images[0]?.tex)activate();
}
window.addEventListener('work:position',e=>{if(!ready||!mq.matches)return;
const p=e.detail?.position??0,now=performance.now(),dt=clamp(now-lastT,12,100);
velocity+=( ((p-lastPos)/dt*1000)-velocity)*.3;lastPos=p;lastT=now;pos=p;
const candidate=clamp(-velocity*1.65,-16,16);
if(!reduce.matches&&Math.abs(candidate)>Math.abs(skew.value)){skew.value=candidate;gsap.to(skew,{value:0,duration:.85,ease:'power3.out',overwrite:true,onUpdate:schedule})}
schedule()});
hit.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;cursor.classList.add('show');gsap.to(hover,{lift:1,duration:.5,onUpdate:schedule})});
hit.addEventListener('pointermove',e=>{gsap.set(cursor,{x:e.clientX-48,y:e.clientY-48});
const r=hit.getBoundingClientRect();gsap.to(hover,{x:clamp((e.clientX-r.left)/r.width*2-1,-1,1),y:clamp((e.clientY-r.top)/r.height*2-1,-1,1),duration:.32,onUpdate:schedule})});
hit.addEventListener('pointerleave',()=>{cursor.classList.remove('show');gsap.to(hover,{lift:0,x:0,y:0,duration:.6,onUpdate:schedule})});
hit.addEventListener('click',()=>document.getElementById('work-visit')?.click());
window.addEventListener('resize',()=>{document.body.classList.remove('work-paper-ready');active=false;if(mq.matches)activate();schedule()});
window.__portfolioWorkPaper21={state:()=>({position:pos,topVisible:exposure(-1),bottomVisible:exposure(1),center:deform(0),loaded:images.filter(i=>i.tex).length,engine:gl?'WebGL':cpu?'Canvas2D Mesh':'original'})};
}

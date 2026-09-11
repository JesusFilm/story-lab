// Portable PNG writer. Grayscale, 8 bit, lossless, no palette, no antialiasing.
// Stored DEFLATE blocks avoid any browser, Node or third-party codec dependency.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function u32(n){return new Uint8Array([n>>>24,n>>>16&255,n>>>8&255,n&255]);}
function concat(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
function chunk(type,data){const body=concat([new TextEncoder().encode(type),data]);return concat([u32(data.length),body,u32(crc32(body))]);}
export function encodePNG({width,height,pixels}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||pixels.length!==width*height)throw new Error('Invalid raster dimensions.');
  const raw=new Uint8Array((width+1)*height);for(let y=0;y<height;y++)raw.set(pixels.subarray(y*width,(y+1)*width),y*(width+1)+1);
  const blocks=[new Uint8Array([0x78,0x01])];
  for(let i=0;i<raw.length;i+=65535){const length=Math.min(65535,raw.length-i),inverse=(~length)&65535;blocks.push(new Uint8Array([i+length===raw.length?1:0,length&255,length>>>8,inverse&255,inverse>>>8]),raw.subarray(i,i+length));}
  let a=1,b=0;for(const byte of raw){a=(a+byte)%65521;b=(b+a)%65521;}blocks.push(u32((b*65536+a)>>>0));
  return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',concat([u32(width),u32(height),new Uint8Array([8,0,0,0,0])])),chunk('IDAT',concat(blocks)),chunk('IEND',new Uint8Array())]);
}

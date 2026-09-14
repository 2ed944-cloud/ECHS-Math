/** ECHS vessel model v1. Units: cm, cm², cm³, s. No rendering or learner state. */
export const VESSELS = Object.freeze({
  cylinder: Object.freeze({label:'Straight-sided cylinder', radius:3, slope:0, height:12}),
  widening: Object.freeze({label:'Vessel that widens upward', radius:1, slope:0.25, height:12}),
  narrowing: Object.freeze({label:'Vessel that narrows upward', radius:4, slope:-0.25, height:12})
});
function finite(value, min, max) {
  if (typeof value!=='number'||!Number.isFinite(value)||value<min||value>max) throw new RangeError('Value outside the vessel model domain.');
  return value;
}
function vessel(name) { if (!Object.hasOwn(VESSELS,name)) throw new RangeError('Unknown vessel.'); return VESSELS[name]; }
export function radiusAt(name,height) { const s=vessel(name); finite(height,0,s.height); return s.radius+s.slope*height; }
export function volumeAt(name,height) {
  const s=vessel(name); finite(height,0,s.height);
  return Math.PI*(s.radius*s.radius*height+s.radius*s.slope*height*height+s.slope*s.slope*height*height*height/3);
}
export function heightAtVolume(name,volume) {
  const s=vessel(name); const total=volumeAt(name,s.height); finite(volume,0,total);
  if(volume===0)return 0;if(volume===total)return s.height;
  let lo=0,hi=s.height;
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(volumeAt(name,mid)<volume)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
export function vesselState({shape='widening',fraction=0.5,flow=10}={}) {
  const s=vessel(shape); finite(fraction,0,1); finite(flow,0.1,100);
  const capacity=volumeAt(shape,s.height),volume=capacity*fraction,height=heightAtVolume(shape,volume);
  const rows=Array.from({length:7},(_,i)=>{
    const v=capacity*i/6; return Object.freeze({time:v/flow,volume:v,height:heightAtVolume(shape,v)});
  });
  const rates=rows.slice(1).map((row,i)=>(row.height-rows[i].height)/(row.time-rows[i].time));
  return Object.freeze({shape,fraction,flow,volume,capacity,height,radius:radiusAt(shape,height),area:Math.PI*radiusAt(shape,height)**2,time:volume/flow,duration:capacity/flow,rows:Object.freeze(rows),rates:Object.freeze(rates)});
}
/** Bounded 3D surface samples; true geometric dimensions, with y as height. */
export function vesselMesh(shape,{height=12,levels=12,segments=24}={}) {
  vessel(shape); finite(height,0,12);
  if(!Number.isInteger(levels)||levels<1||levels>24||!Number.isInteger(segments)||segments<8||segments>48)throw new RangeError('Mesh budget exceeded.');
  const rings=Array.from({length:levels+1},(_,j)=>Array.from({length:segments},(_,i)=>{
    const y=height*j/levels,r=radiusAt(shape,y),theta=2*Math.PI*i/segments;
    return Object.freeze({x:r*Math.cos(theta),y,z:r*Math.sin(theta)});
  }));
  return Object.freeze(rings.map(Object.freeze));
}
export function projectPoint(point,{azimuth=35,elevation=18,scale=18}={}) {
  if(!point||['x','y','z'].some(k=>typeof point[k]!=='number'||!Number.isFinite(point[k])||Math.abs(point[k])>100))throw new RangeError('Invalid model point.');
  finite(azimuth,-180,180);finite(elevation,-60,60);finite(scale,1,40);
  const a=azimuth*Math.PI/180,e=elevation*Math.PI/180;
  const x=point.x*Math.cos(a)+point.z*Math.sin(a),z=-point.x*Math.sin(a)+point.z*Math.cos(a);
  return Object.freeze({x:190+scale*x,y:280-scale*(point.y*Math.cos(e)-z*Math.sin(e)),depth:point.y*Math.sin(e)+z*Math.cos(e)});
}

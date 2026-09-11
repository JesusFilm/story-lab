import edit from './edit-manifest.json' with { type: 'json' };
export const EDIT = edit;
export function segmentAt(time:number){return edit.segments.find(s=>time>=s.editStart&&time<s.editEnd);}
export function sourceTimeAt(time:number){const s=segmentAt(time);return s?s.start+time-s.editStart:null;}
export function editedTimeAt(source:number){for(const s of edit.segments){if(source<s.start)return s.editStart;if(source<=s.end)return s.editStart+source-s.start;}return edit.duration;}
export type Pose={x:number;z:number;yaw:number;armL:number;armR:number;elbowL:number;elbowR:number;spreadL:number;spreadR:number;bend:number;crouch:number;head:number;nod:number};
const neutral:Pose={x:-.65,z:-.35,yaw:.18,armL:0,armR:0,elbowL:-.12,elbowR:-.12,spreadL:0,spreadR:0,bend:0,crouch:0,head:0,nod:0};
// Observed source-film beats, compressed into the teaching edit. Positions are
// adapted to the prototype's clear central aisle, never frame-exact tracking.
const sourceKeys:[number,Partial<Pose>][]=[
 [4.9,{}],[9.65,{head:.22}],
 [21.5,{x:-.6,z:-.3,yaw:.1}],[25.9,{x:-.2,z:.18,head:-.18}],
 [29.35,{x:-.2,z:.18,yaw:0}],[36.8,{head:.22}],
 [40,{x:.05,z:.34,yaw:.28,head:-.1}],[46,{x:.6,z:.55,yaw:-.22}],[53.8,{x:.7,z:.6,head:.18}],
 [60.9,{x:.7,z:.6,yaw:-.32,elbowL:-.65}],
 [62.6,{armR:-.75,elbowR:-.8,spreadR:.25,head:-.2}],
 [65.1,{armR:-.91,elbowR:-.72,spreadR:.3,nod:.06}],
 [67.3,{armR:-.05,elbowR:-.18,spreadR:0}],
 [72.75,{x:.7,z:.5,yaw:1.0,armL:0,elbowL:-.3}],
 [77,{x:1.1,z:-.1,yaw:1.75,nod:.15}],
 [79.3,{x:1.1,z:-.1,yaw:1.8,bend:.3,crouch:.23,armR:-.45,elbowR:-.35,nod:.2}],
 [82.1,{armL:-.32,elbowL:-.65}],
 [83.85,{head:-.4,nod:-.05}],
 [88.7,{head:-.25,bend:.22,crouch:.23}],
 [92.1,{x:1.08,z:-.08,crouch:0,bend:0,armR:0,elbowR:-.12,armL:0,elbowL:-.12,yaw:.25,nod:0}],
 [96.5,{head:.2}],
 [102.05,{x:.4,z:.2,yaw:-.7,head:0}],
 [107,{x:-.45,z:.35,yaw:-.9}],
 [111.7,{x:-.6,z:.3,yaw:-.55,armL:-.35,elbowL:-.5}],
 [120.5,{head:.25,armL:-.08,elbowL:-.2}],
 [136.08,{x:-.6,z:.3,yaw:-.45,head:.12}],
 [141,{x:-.3,z:.4,yaw:.18,head:-.22}],
 [149,{x:-.1,z:.65,yaw:.28,head:.1}],
 [156.4,{head:-.17,armL:0,elbowL:-.12}],
 [162.5,{x:-.1,z:.65,yaw:.05,head:.12,nod:-.025}],
 [167.8,{head:-.16,nod:-.035}],[174.7,{head:.12,nod:.025}],
 [182.15,{x:-.05,z:.6,yaw:-.55,armR:-.25,elbowR:-.4}],
 [187.5,{x:-.4,z:.05,yaw:-.6,head:.22,armR:-.4}],
 [191.4,{x:-.4,z:.05,yaw:.3,armR:-.05,elbowR:-.15}],
 [196.5,{head:-.28,armL:-.25,elbowL:-.45}],
 [200,{yaw:.2,head:.08,armR:-.55,elbowR:-.7,spreadR:.24}],
 [203.6,{armR:-.05,elbowR:-.15,armL:0,elbowL:-.12,spreadR:0,nod:.03}],
];
let prior={...neutral};
export const motionKeys=sourceKeys.map(([source,changes])=>{prior={...prior,...changes};return {time:editedTimeAt(source),pose:{...prior}};});
export function teacherPose(time:number):Pose{
 if(time<=motionKeys[0].time)return {...motionKeys[0].pose};
 const i=motionKeys.findIndex(k=>k.time>time);if(i<0)return {...motionKeys.at(-1)!.pose};
 const a=motionKeys[i-1],b=motionKeys[i];let f=(time-a.time)/(b.time-a.time);f=f*f*(3-2*f);
 const p={...neutral};for(const key of Object.keys(p) as (keyof Pose)[])p[key]=a.pose[key]+(b.pose[key]-a.pose[key])*f;return p;
}

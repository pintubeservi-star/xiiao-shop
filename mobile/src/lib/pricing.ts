export const BASE_FARE=100;
export const PER_KM=25;
export const MIN_FARE=100;
export function distanceKm(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){const rad=(v:number)=>v*Math.PI/180;const dLat=rad(b.latitude-a.latitude),dLng=rad(b.longitude-a.longitude);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
export function estimateFare(km:number){return Math.max(MIN_FARE,Math.ceil((BASE_FARE+Math.max(0,km)*PER_KM)/5)*5);}
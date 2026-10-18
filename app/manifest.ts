import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{return {name:'Abuelitas — Carnet de famille',short_name:'Abuelitas',description:'Les recettes qui nous réunissent',start_url:'/',display:'standalone',background_color:'#faf8f4',theme_color:'#334d39',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]}}

import type {Metadata} from 'next';
import './globals.css';
import './workspace.css';
export const metadata:Metadata={title:'Abuelitas — Les recettes qui nous réunissent',appleWebApp:{capable:true,statusBarStyle:'default',title:'Abuelitas'},icons:{icon:'/mamie-cheffe.png',apple:'/mamie-cheffe.png'},description:'Votre carnet de recettes familial privé. Préservez les recettes, les histoires et les petits secrets de ceux que vous aimez.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}

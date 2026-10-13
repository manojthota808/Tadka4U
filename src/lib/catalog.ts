import p10 from '@/assets/poster-one-0.jpg';
import p11 from '@/assets/poster-one-1.jpg';
import p12 from '@/assets/poster-one-2.jpg';
import p20 from '@/assets/poster-two-0.jpg';
import p21 from '@/assets/poster-two-1.jpg';
import p22 from '@/assets/poster-two-2.jpg';
import p30 from '@/assets/poster-three-0.jpg';
import p31 from '@/assets/poster-three-1.jpg';
import p32 from '@/assets/poster-three-2.jpg';
export type Show = {id:string;title:string;genre:string;image:string;episodes:number;badge?:string;description:string;rating:string};
export const shows: Show[] = [
{id:'midnight-promise',title:'Midnight Promise',genre:'Romance',image:p10,episodes:4,badge:'NEW EPISODES',rating:'4.8',description:'One unexpected encounter. A promise that changes everything. When two strangers cross paths, love becomes the most dangerous secret of all.'},
{id:'the-last-alibi',title:'The Last Alibi',genre:'Thriller',image:p11,episodes:4,badge:'TRENDING',rating:'4.7',description:'A missing witness. A perfect alibi. An investigator discovers that the truth is never what it seems in a city built on secrets.'},
{id:'royal-hearts',title:'Royal Hearts',genre:'Drama',image:p12,episodes:4,badge:'NEW',rating:'4.8',description:'Behind the palace doors, a young heiress must choose between the family she belongs to and the life she wants.'},
{id:'the-haunting',title:'The Haunting',genre:'Horror',image:p20,episodes:4,rating:'4.6',description:'Returning to her ancestral home, Mira discovers that some memories never sleep—and some doors should stay closed.'},
{id:'unfiltered',title:'Unfiltered',genre:'Comedy',image:p21,episodes:4,badge:'NEW',rating:'4.5',description:'A new city, a terrible first date, and a thousand fresh starts. Follow Aanya as she figures out life on her own terms.'},
{id:'ishq-again',title:'Ishq, Again',genre:'Romance',image:p22,episodes:4,rating:'4.9',description:'Five years after goodbye, an old love returns. This time, can they write a different ending?'},
{id:'shadow-files',title:'The Shadow Files',genre:'Thriller',image:p30,episodes:4,badge:'NEW',rating:'4.7',description:'Every clue leads somewhere darker. A relentless detective takes on the one case nobody wants solved.'},
{id:'the-wedding-pact',title:'The Wedding Pact',genre:'Drama',image:p31,episodes:4,rating:'4.8',description:'A marriage of convenience becomes an unexpected love story. But every family has a secret, and theirs could change everything.'},
{id:'almost-adult',title:'Almost Adult',genre:'Comedy',image:p32,episodes:4,rating:'4.6',description:'Three friends, one apartment, and absolutely no idea what comes next. Growing up was never part of the plan.'},
];
export const genres = ['All','Romance','Thriller','Drama','Horror','Comedy'];
export function filterShows(list:Show[],genre:string,search=''){return list.filter(s=>(genre==='All'||s.genre===genre)&&s.title.toLowerCase().includes(search.toLowerCase().trim()));}

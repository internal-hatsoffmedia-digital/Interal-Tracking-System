export function productionTeamName(name:string,type=''){
 const key=name.trim().toLowerCase().replace(/[–—]/g,'-');
 if(type==='web_development'||key==='digital ninjas - w'||key.includes('web crafter')||key.includes('web development'))return 'Digital Ninjas - W';
 if(['digital_marketing','digital_ninjas','social_media'].includes(type)||key==='digital ninjas'||key==='digital ninjas - m'||key==='digital marketing')return 'Digital Ninjas - M';
 if(key==='cut master'||key==='cut masters')return 'Cut Masters';
 if(key==='creative clan')return 'Creative Clan';
 return name;
}

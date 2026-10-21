const greetings = [
 'Wishing you a day filled with laughter and lovely surprises.',
 'May your birthday bring you happiness and beautiful memories.',
 'Here’s to a wonderful year of new adventures and possibilities.',
 'Wishing you good health, peace and plenty of reasons to smile.',
 'May the year ahead bring you closer to the dreams you cherish.',
 'Hope your special day is as bright and cheerful as you are.',
 'Wishing you a joyful celebration with the people you love.',
 'May today be the beginning of a happy and fulfilling year.',
 'Here’s to another year of learning, growing and making memories.',
 'Wishing you a year full of kindness, friendship and happy moments.',
 'May your birthday be filled with your favourite things.',
 'Hope this new chapter brings you exciting opportunities.',
 'Wishing you time to relax, celebrate and enjoy your special day.',
 'May your year ahead be full of meaningful achievements.',
 'Here’s to fresh beginnings and wonderful experiences.',
 'Wishing you confidence, creativity and joy in the year ahead.',
 'May this birthday bring you fresh energy and happy memories.',
 'Hope the coming year brings you good news and great company.',
 'Wishing you sunshine, smiles and moments worth celebrating.',
 'May you find something to look forward to every day this year.',
];
const endings = [
 'Have a fantastic birthday!',
 'Enjoy every moment of your celebration!',
 'Sending warm wishes from all of us at Hatsoff!',
 'Here’s to a brilliant year ahead!',
 'Celebrate today in your own special way!',
];

/** 100 distinct, reusable greetings; these are templates, not colleague messages. */
export const birthdayGreetings = greetings.flatMap(greeting=>endings.map(ending=>`${greeting} ${ending}`));

export function birthdayGreeting(employeeId:string,day:string){
 let hash=0;
 for(const letter of `${employeeId}:${day}`)hash=(Math.imul(hash,31)+letter.charCodeAt(0))>>>0;
 return birthdayGreetings[hash % birthdayGreetings.length];
}

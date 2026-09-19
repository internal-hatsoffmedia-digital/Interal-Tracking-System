import { employeeIdentity } from './employee-account-plan.mjs';

const fullRoster = [
  { sNo: 1, fullName: 'Sabarinathan K', personalEmail: 'sabarinathan', officialEmail: 'sabarinathan@hatsoffmedia.in', role: 'director', team: 'Management' },
  { sNo: 2, fullName: 'Veena Sai S', personalEmail: 'veenasai95@gmail.com', officialEmail: 'veenasai@hatsoffmedia.in', role: 'director', team: 'Management' },
  { sNo: 3, fullName: 'Harish Raghavendra K', personalEmail: 'harishraghavendra2001@gmail.com', officialEmail: 'harishraghavendra@hatsoffmedia.in', role: 'employee', team: 'Sales & Marketing' },
  { sNo: 4, fullName: 'Ram Kumar M', personalEmail: 'ramk089820@gmail.com', officialEmail: 'ramkumar@hatsoffmedia.in', role: 'employee', team: 'Production' },
  { sNo: 5, fullName: 'Abinaya', personalEmail: 'abinayakannan275@gmail.com', officialEmail: 'abinaya@hatsoffmedia.in', role: 'employee', team: 'Production' },
  { sNo: 6, fullName: 'Esther', personalEmail: 'estherdevasundar@gmail.com', officialEmail: 'esther@hatsoffmedia.in', role: 'project_coordinator', team: 'Project Coordinators' },
  { sNo: 7, fullName: 'Ganesh Kanth.K', personalEmail: 'ganeshkanth1970@gmail.com', officialEmail: 'ganeshkanth@hatsoffmedia.in', role: 'associate_lead', team: 'Graphic Design Team (Creative Clan)' },
  { sNo: 8, fullName: 'Hariharan', personalEmail: 'harisk020903@gmail.com', officialEmail: 'hariharan@hatsoffmedia.in', role: 'employee', team: 'Digital Marketing' },
  { sNo: 9, fullName: 'Janani R', personalEmail: 'janani17ja@gmail.com', officialEmail: 'janani@hatsoffmedia.in', role: 'associate_lead', team: 'Digital Marketing' },
  { sNo: 10, fullName: 'Kailash Bhushan Rao', personalEmail: 'kailashbhushanrao@gmail.com', officialEmail: 'kailash@hatsoffmedia.in', role: 'employee', team: 'Production' },
  { sNo: 11, fullName: 'Kamalesh Gandhii G', personalEmail: 'kamalesh07siddu@gmail.com', officialEmail: 'kamaleshgandhi@hatsoffmedia.in', role: 'team_lead', team: 'Operations / Graphic Design' },
  { sNo: 12, fullName: 'Keerthana', personalEmail: 'keerthanavelayudham4@gmail.com', officialEmail: 'keerthana@hatsoffmedia.in', role: 'employee', team: 'Video Editing Team (Cut Masters)' },
  { sNo: 13, fullName: 'Kesavan A', personalEmail: 'kesavananandhan5334@gmail.com', officialEmail: 'kesavan@hatsoffmedia.in', role: 'employee', team: 'Graphic Design Team (Creative Clan)' },
  { sNo: 14, fullName: 'Lalith Balakumar', personalEmail: 'lalithbalakumar090303@gmail.com', officialEmail: 'lalithbalakumar@hatsoffmedia.in', role: 'employee', team: 'Graphic Design Team (Creative Clan)' },
  { sNo: 15, fullName: 'Lavanya M', personalEmail: 'lavanyaljs18@gmail.com', officialEmail: 'lavanya@hatsoffmedia.in', role: 'project_coordinator', team: 'Project Coordinators' },
  { sNo: 16, fullName: 'Muskan Kumari S', personalEmail: 'muskanchaudhary205@gmail.com', officialEmail: 'muskanchaudhary@hatsoffmedia.in', role: 'associate_lead', team: 'Project Coordinators' },
  { sNo: 17, fullName: 'Nathimulla', personalEmail: 'nadeemanalyst42@gmail.com', officialEmail: 'nadeem@hatsoffmedia.in', role: 'employee', team: 'Website Development & Deployment' },
  { sNo: 18, fullName: 'Prashanth', personalEmail: 'prasanththangaraj04@gmail.com', officialEmail: 'prasanth@hatsoffmedia.in', role: 'employee', team: 'Video Editing Team (Cut Masters)' },
  { sNo: 19, fullName: 'Rajasekar V', personalEmail: 'rajasekarmech1911@gmail.com', officialEmail: 'rajasekar@hatsoffmedia.in', role: 'employee', team: 'Video Editing Team (Cut Masters)' },
  { sNo: 20, fullName: 'Saraswathy', personalEmail: 'narayanansaras18@gmail.com', officialEmail: 'saraswathy@hatsoffmedia.in', role: 'employee', team: 'Video Editing Team (Cut Masters)' },
  { sNo: 21, fullName: 'Snega', personalEmail: 'snegavenkatesan@gamil.com', officialEmail: 'snega@hatsoffmedia.in', role: 'employee', team: 'Website Development & Deployment' },
  { sNo: 22, fullName: 'Sudeesh Krish G', personalEmail: 'sudeeshsnoop22@gmail.com', officialEmail: 'sudeesh@hatsoffmedia.in', role: 'associate_lead', team: 'Video Editing Team (Cut Masters)' },
  { sNo: 23, fullName: 'Vijay R', personalEmail: 'vijaytroz17@gmail.com', officialEmail: 'vijay@hatsoffmedia.in', role: 'associate_lead', team: 'Website Development & Deployment' },
  { sNo: 24, fullName: 'Vijay Raja', personalEmail: 'rvijayrvijay28@gmail.com', officialEmail: 'vijayraja@hatsoffmedia.in', role: 'employee', team: 'Graphic Design Team (Creative Clan)' }
];

console.log('========================================================================================');
console.log('                 HATSOFF MEDIA COMPLETE EMPLOYEE CREDENTIAL DIRECTORY                   ');
console.log('========================================================================================\n');

const tableData = fullRoster.map(e => {
  let defaultIdentity;
  try {
    defaultIdentity = employeeIdentity(e.fullName);
  } catch {
    defaultIdentity = { email: e.officialEmail, password: e.fullName.split(' ')[0] + '41@' };
  }
  return {
    'S.No': e.sNo,
    'Full Name': e.fullName,
    'Official Email': e.officialEmail,
    'Personal Email': e.personalEmail,
    'Role': e.role,
    'Team': e.team,
    'Initial Password': defaultIdentity.password
  };
});

console.table(tableData);

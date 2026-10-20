import {createContext,useContext} from 'react';
export const pageCatalog=[['dashboard','Dashboard'],['my-work','My Work'],['daily-desk','Daily Desk'],['my-team','My Team'],['team-pc','Team PC'],['task-assignments','Team Work'],['tasks','Tasks'],['qc','QC'],['qc-activity','QC Activity'],['planner','Planner'],['projects','Projects'],['clients','Clients'],['teams','Teams'],['employees','Employees'],['team-members','Team Members'],['performance','Performance'],['reports','Reports'],['sales','Sales'],['settings','Settings'],['timesheet','Timesheet'],['user-guide','User Guide']] as const;
export type AccessMember={id:string;name:string;role:string;team:string|null;active:boolean};
export type PageRule={profile_id:string;page:string;allowed:boolean};
export type AccessData={manager:boolean;members:AccessMember[];rules:PageRule[]};
export const Context=createContext<{data:AccessData;loading:boolean;error:string;reload:()=>Promise<void>;allowed:(path:string)=>boolean}>({data:{manager:false,members:[],rules:[]},loading:true,error:'',reload:async()=>{},allowed:()=>false});
export function usePageAccess(){return useContext(Context);}

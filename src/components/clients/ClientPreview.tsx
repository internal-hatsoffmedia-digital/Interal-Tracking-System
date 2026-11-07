import {X,ExternalLink,Edit3} from 'lucide-react';
import type {Client} from '../../types/client';
import {clientLeadSources,clientSocialFields,isClientLink} from '../../lib/clientLinks';
import WorkspaceDialog from '../layouts/WorkspaceDialog';
import {formatAssignmentTime} from '../../lib/assignmentTime';
export function ClientPreviewContent({client}:{client:Client}){
 const fields=[['Lead source',clientLeadSources.find(([key])=>key===client.lead_source)?.[1]||'Not set'],['Short name',client.short_name],['Contact person',client.contact_person],['Email',client.email],['Phone',client.phone],['Project coordinator',client.assigned_coordinator?.full_name],['Status',client.is_active?'Active':'Inactive'],['Created by',client.creator_name],['Created (IST)',formatAssignmentTime(client.created_at)],['Updated (IST)',formatAssignmentTime(client.updated_at)]];
 return <div className="space-y-5 p-6">
  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map(([label,value])=><div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value||'—'}</dd></div>)}</dl>
  <section><h3 className="mb-3 text-sm font-semibold">Social media links</h3><dl className="grid gap-3">{clientSocialFields.map(([field,label])=><div key={field}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 text-sm">{client[field]&&isClientLink(client[field])?<a href={client[field]} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all underline">{client[field]}<ExternalLink size={13} className="shrink-0"/></a>:'Not added'}</dd></div>)}</dl></section>
  {!!client.links?.length&&<section><h3 className="mb-2 text-sm font-semibold">Other client links</h3>{client.links.filter(isClientLink).map(link=><a key={link} href={link} target="_blank" rel="noreferrer" className="block break-all text-sm underline">{link}</a>)}</section>}
  <section><h3 className="mb-2 text-sm font-semibold">Notes</h3><p className="whitespace-pre-wrap break-words text-sm text-slate-700">{client.notes||'No notes added.'}</p></section>
 </div>;
}
export default function ClientPreview({client,onClose,onEdit}:{client:Client;onClose:()=>void;onEdit:()=>void}){
 return <WorkspaceDialog titleId="client-preview-title" onClose={onClose} compact>
  <header className="flex items-center justify-between gap-4 border-b p-5"><div><p className="text-xs font-semibold text-slate-500">Client preview</p><h2 id="client-preview-title" className="text-xl font-bold">{client.name}</h2></div><button type="button" onClick={onClose} aria-label="Close client preview" className="rounded-lg border p-2"><X size={18}/></button></header>
  <div className="workspace-dialog-body"><ClientPreviewContent client={client}/></div>
  <footer className="flex justify-end gap-3 border-t p-4"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Close</button><button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black"><Edit3 size={14}/>Edit client</button></footer>
 </WorkspaceDialog>;
}

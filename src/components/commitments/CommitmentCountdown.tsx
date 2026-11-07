import {commitmentClosed,commitmentCountdown,deadlineStage} from '../../lib/commitmentCountdown';
import {useCommitmentClock} from './useCommitmentClock';
export default function CommitmentCountdown({deadline,status,completedAt}:{deadline?:string|null;status?:string;completedAt?:string|null}){
 const now=useCommitmentClock();
 const closed=commitmentClosed(status,completedAt),stage=closed?null:deadlineStage(deadline,now);
 return <span className={'inline-block whitespace-nowrap text-sm font-semibold tabular-nums '+(stage==='ended'?'text-red-600':stage==='ten_minutes'?'text-orange-700':stage==='hour'?'text-amber-700':'text-slate-700')}
   aria-label={'Committed time: '+commitmentCountdown(deadline,now,status,completedAt)}>
   {commitmentCountdown(deadline,now,status,completedAt)}
 </span>;
}

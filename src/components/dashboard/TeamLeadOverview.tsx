import TeamDailyOverview from './TeamDailyOverview';
import {useAuth} from '../../context/AuthContext';
export default function TeamLeadOverview(){
 const {profile}=useAuth();
 if(!profile?.is_active||!['associate_lead','team_lead'].includes(profile.role))return null;
 return <TeamDailyOverview key={profile.id+':'+profile.team_id} userId={profile.id}/>;
}

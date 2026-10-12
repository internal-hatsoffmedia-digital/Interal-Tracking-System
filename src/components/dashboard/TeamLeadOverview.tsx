import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
export default function TeamLeadOverview(){
 const {profile}=useAuth();
 if(!profile?.is_active||!['associate_lead','team_lead'].includes(profile.role))return null;
 return <section className="studio-launchpad"><span className="future-eyebrow">TEAM OVERVIEW</span><h2>Your team's work</h2><p>Review your team members, assignments, delivery timing and recorded activity.</p><Link to="/my-team">Open My Team →</Link></section>;
}

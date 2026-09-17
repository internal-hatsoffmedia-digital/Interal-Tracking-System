import {Component,type ReactNode} from 'react';
export default class PageErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){if(this.state.failed)return <main className="min-h-screen flex items-center justify-center p-6"><section role="alert" className="max-w-md rounded-2xl border bg-white p-8"><h1 className="text-xl font-semibold">This page could not load</h1><p className="my-4 text-sm text-slate-600">Please reload the page. If you were editing, unsaved changes may need to be entered again.</p><button className="rounded-full bg-[#ffcc00] px-5 py-3 text-black" onClick={()=>window.location.reload()}>Reload page</button><a href="/dashboard" className="ml-4 underline">Go to dashboard</a></section></main>;return this.props.children;}
}

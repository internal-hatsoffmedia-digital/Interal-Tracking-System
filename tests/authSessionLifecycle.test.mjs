import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function harness(){
 let states=[],refs=[],dependencies=[],cleanup=[],effects=[],cursor=0,dirty=false,callback,inCallback=false,profileCalls=0,value;
 const initial=deferred(),profiles=[];
 const react={createContext:()=>({Provider:'provider'}),useContext:()=>value,useRef:init=>{const i=cursor++;return refs[i]??=( {current:init} );},useState:init=>{const i=cursor++;if(!(i in states))states[i]=init;return [states[i],next=>{const updated=typeof next==='function'?next(states[i]):next;if(updated!==states[i]){states[i]=updated;dirty=true;}}];},useEffect:(fn,deps)=>{const i=cursor++;if(!dependencies[i]||deps.some((v,k)=>v!==dependencies[i][k])){dependencies[i]=deps;effects.push(()=>{cleanup[i]?.();cleanup[i]=fn();});}}};
 const supabase={auth:{onAuthStateChange:fn=>{callback=fn;return {data:{subscription:{unsubscribe(){}}}};},getSession:()=>initial.promise}};
 const service={getCurrentProfile:()=>{assert.equal(inCallback,false,'profile API must run outside the Auth callback');profileCalls++;const next=deferred();profiles.push(next);return next.promise;},signOut:async()=>{callback('SIGNED_OUT',null);}};
 const source=readFileSync(new URL('../src/context/AuthContext.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,exports={};
 vm.runInNewContext(code,{exports,console:{error(){}},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:(_type,props)=>props}:name==='../lib/supabase'?{supabase}:name==='../services/auth/auth.service'?service:(()=>{throw Error(name)})()});
 function render(){do{dirty=false;cursor=0;value=exports.AuthProvider({children:null}).value;const queued=effects;effects=[];queued.forEach(fn=>fn());}while(dirty);return value;}
 return {initial,profiles,render,get calls(){return profileCalls;},event(session){inCallback=true;try{return callback(session?'SIGNED_IN':'SIGNED_OUT',session);}finally{inCallback=false;}},async settle(){await new Promise(r=>setImmediate(r));return render();}};
}
const session=id=>({user:{id},access_token:'fixture'});
test('successful sign-in returns from callback before profile API starts and exits loading',async()=>{const h=harness();h.render();assert.equal(h.event(session('one')),undefined);assert.equal(h.calls,0);h.render();assert.equal(h.calls,1);h.profiles[0].resolve({id:'one',is_active:true});const result=await h.settle();assert.equal(result.loading,false);assert.equal(result.profile.id,'one');});
test('late initial session cannot overwrite a newer sign-in',async()=>{const h=harness();h.render();h.event(session('one'));h.render();h.initial.resolve({data:{session:null},error:null});const result=await h.settle();assert.equal(result.user.id,'one');});
test('sign-out discards an in-flight profile response',async()=>{const h=harness();h.render();h.event(session('one'));h.render();h.event(null);h.render();h.profiles[0].resolve({id:'one'});const result=await h.settle();assert.equal(result.user,null);assert.equal(result.profile,null);assert.equal(result.loading,false);});
test('missing profile finishes loading so the recovery UI can be shown',async()=>{const h=harness();h.render();h.event(session('one'));h.render();h.profiles[0].resolve(null);const result=await h.settle();assert.equal(result.loading,false);assert.equal(result.profile,null);assert.equal(result.user.id,'one');});

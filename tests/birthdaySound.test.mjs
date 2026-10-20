import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpile(await readFile('src/components/dashboard/useBirthdaySound.ts','utf8'),{module:ts.ModuleKind.CommonJS});
function harness(blocked=false){
 const storage=new Map(),events=new Map();let effect,cleanup,notes=0,prompt=false;
 class Audio{
  state=blocked?'suspended':'running';currentTime=0;destination={};
  resume(){return blocked?new Promise(()=>{}):Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
  createOscillator(){return {frequency:{value:0},connect(){},start(){notes++;},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
 }
 const exports={};vm.runInNewContext(code,{exports,require:()=>({useState:()=>[false,value=>{prompt=value;}],useEffect:fn=>{effect=fn;}}),AudioContext:Audio,queueMicrotask,
  localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
  document:{hidden:false,addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:(key,fn)=>{if(events.get(key)===fn)events.delete(key);}},window:{setTimeout(){}}});
 return {mount(day='2026-10-20',birthday=true){exports.default(day,birthday,'member');cleanup=effect();},unmount(){cleanup?.();},async interact(){blocked=false;events.get('pointerdown')?.();await Promise.resolve();},get notes(){return notes;},get prompt(){return prompt;},events};
}
test('birthday chime plays once per member/day, never for upcoming-only birthdays',async()=>{
 const app=harness();app.mount(undefined,false);assert.equal(app.notes,0);
 app.mount();await Promise.resolve();assert.equal(app.notes,3);assert.equal(app.prompt,false);
 app.unmount();app.mount();assert.equal(app.notes,3);
 app.mount('2026-10-21');assert.equal(app.notes,6);app.unmount();
});
test('blocked autoplay waits for user interaction and removes listeners after playing',async()=>{
 const app=harness(true);app.mount();await Promise.resolve();assert.equal(app.notes,0);assert.equal(app.prompt,true);
 await app.interact();assert.equal(app.notes,3);assert.equal(app.prompt,false);assert.equal(app.events.has('pointerdown'),false);
 await app.interact();assert.equal(app.notes,3);app.unmount();assert.equal(app.events.size,0);
});

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dayStudyLoad, parseWeekPlan, type PersonalStudyBlock } from '../src/lib/week-plan.ts'
import { demoAssignments, demoClasses } from '../src/data/study-demo.ts'
const day='2026-11-11'
const block: PersonalStudyBlock={id:'one',week:'2026-11-09',day,taskId:'linear-equations',minutes:60,done:false}
test('day workload counts actual class minutes, pending deadlines and personal minutes independently',()=>{
 const result=dayStudyLoad(day,demoClasses,demoAssignments,[block])
 assert.equal(result.classMinutes,160)
 assert.equal(result.personalMinutes,60)
 assert.equal(result.deadlines,demoAssignments.filter(task=>task.dueAt.startsWith(day)&&task.status!=='submitted').length)
 assert.deepEqual(result.windows,[{start:'10:20',end:'10:30',minutes:10}].filter(window=>window.minutes>=30))
 assert.equal(dayStudyLoad(day,demoClasses,demoAssignments,[{...block,done:true}]).personalMinutes,0)
 assert.equal(dayStudyLoad(day,demoClasses,demoAssignments,[{...block,day:'2026-11-12'}]).personalMinutes,0)
})
test('overlapping classes are merged and only known internal gaps become windows',()=>{
 const base=demoClasses[0]
 const slots=[{...base,date:day,startsAt:'10:00',endsAt:'11:00'},{...base,date:day,startsAt:'10:30',endsAt:'12:00'},{...base,date:day,startsAt:'13:00',endsAt:'14:00'}]
 const result=dayStudyLoad(day,slots,[],[])
 assert.equal(result.classMinutes,180)
 assert.deepEqual(result.windows,[{start:'12:00',end:'13:00',minutes:60}])
 assert.deepEqual(dayStudyLoad(day,[],[],[]).windows,[])
})
test('high load is an explicit heuristic, with updates for personal completion and submission',()=>{
 assert.equal(dayStudyLoad(day,[],demoAssignments.slice(0,3).map(task=>({...task,status:'new',dueAt:`${day}T23:59:00+03:00`})),[]).overloaded,true)
 assert.equal(dayStudyLoad(day,[],demoAssignments.slice(0,3).map(task=>({...task,status:'submitted',dueAt:`${day}T23:59:00+03:00`})),[]).deadlines,0)
 const blocks=Array.from({length:6},(_,i)=>({...block,id:String(i)}))
 assert.equal(dayStudyLoad(day,[],[],blocks).overloaded,true)
 assert.equal(dayStudyLoad(day,[],[],blocks.map(b=>({...b,done:true}))).overloaded,false)
})
test('local plan roundtrips and rejects corrupt, duplicate and unsupported records',()=>{
 assert.deepEqual(parseWeekPlan(JSON.stringify({version:1,blocks:[block]})),[block])
 assert.deepEqual(parseWeekPlan(JSON.stringify({version:1,blocks:[block,block,{...block,id:'bad',minutes:-1},{...block,id:'date',day:'2026-99-99'}]})),[block])
 for(const raw of [null,'{','{}','{"version":2,"blocks":[]}'])assert.deepEqual(parseWeekPlan(raw),[])
})

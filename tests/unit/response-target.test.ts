import assert from "node:assert/strict";
import test from "node:test";
import { getResponseTarget } from "../../src/features/tickets/utils/response-target";
import { createSubmissionRequest } from "../../src/features/tickets/utils/submission-request";
const now = Date.parse("2026-09-07T12:00:00Z");
const ticket = {status:"open" as const, priority:"medium" as const, created_at:"2026-09-01T00:00:00Z",response_started_at:"2026-09-06T12:35:00Z"};
test("response target uses current waiting period and minute precision",()=>{
 assert.equal(getResponseTarget(ticket,now).label,"35분 남음");
 assert.equal(getResponseTarget({...ticket,response_started_at:"2026-09-06T09:50:00Z"},now).label,"2시간 10분 초과");
 assert.equal(getResponseTarget({...ticket,status:"resolved"},now).label,"응답 완료");
 assert.equal(getResponseTarget({...ticket,status:"closed"},now).label,"종료");
 assert.equal(getResponseTarget({...ticket,response_started_at:"2026-09-06T12:00:00Z"},now).tone,"breached");
 assert.equal(getResponseTarget({...ticket,priority:"urgent"},now).tone,"breached");
});
test("submission token survives retry and reload, changes with content, clears on success",async()=>{
 const values=new Map<string,string>();
 const previous=Object.getOwnPropertyDescriptor(globalThis,"localStorage");
 Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)}});
 try {
 const tracker=createSubmissionRequest("account:ticket:public");
 const id=await tracker.getId({content:"same"});
 assert.equal(await tracker.getId({content:"same"}),id);
 assert.equal(await createSubmissionRequest("account:ticket:public").getId({content:"same"}),id);
 assert.notEqual(await createSubmissionRequest("other:ticket:public").getId({content:"same"}),id);
 assert.notEqual(await tracker.getId({content:"changed"}),id);
 const final=await tracker.getId({content:"same"});tracker.clear(final);
 assert.notEqual(await tracker.getId({content:"same"}),final);
 } finally {if(previous)Object.defineProperty(globalThis,"localStorage",previous);else Reflect.deleteProperty(globalThis,"localStorage");}
});

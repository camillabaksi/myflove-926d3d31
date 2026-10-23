import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpaceRevision } from "@/lib/day-space";
const state=vi.hoisted(()=>({owner:"A",rows:[] as SpaceRevision[],write:vi.fn()}));
vi.mock("@/lib/account-scope",()=>({isActiveOwner:(id:string)=>id===state.owner}));
vi.mock("@/lib/cloud-storage",()=>({
  useCloudSyncedStorage:()=>[state.rows,(update:(rows:SpaceRevision[])=>SpaceRevision[])=>{state.write();state.rows=update(state.rows);}],
  useCloudSyncStatus:()=>"saved",hasUnsyncedCloudData:()=>false,syncKeyNow:vi.fn(),
}));
vi.mock("@/lib/secure-local",()=>({getSecureStatus:()=>"ready",hasUnpersistedSecureWrites:()=>false,SECURE_STATUS_EVENT:"secure"}));
import { useDaySpace } from "./use-day-space";
describe("daily space save guards",()=>{
  beforeEach(()=>{state.rows=[];state.owner="A";state.write.mockClear();});
  it("reads back a saved unclassified note on the same date",()=>{
    const {result,rerender}=renderHook(()=>useDaySpace("A","2026-10-21"));
    act(()=>{result.current.save("Mitt sammanhang",[],[]);});rerender();
    expect(result.current.heads[0]?.text).toBe("Mitt sammanhang");
  });
  it("persists an explicit empty revision to delete a saved note without erasing its private history",()=>{
    const {result,rerender}=renderHook(()=>useDaySpace("A","2026-10-21"));
    act(()=>{result.current.save("Omsorg och planering",["Omsorg"],[]);});
    rerender();
    const original=result.current.heads[0];
    expect(original.text).toBe("Omsorg och planering");
    act(()=>{result.current.save("",[],[original.id]);});
    rerender();
    expect(result.current.heads).toHaveLength(1);
    expect(result.current.heads[0].text).toBe("");
    expect(result.current.heads[0].parents).toEqual([original.id]);
    expect(state.rows).toHaveLength(2);
    expect(state.rows[0].text).toBe("Omsorg och planering");
  });
  it("does not delete another account's saved note through a stale callback",()=>{
    const {result,rerender}=renderHook(()=>useDaySpace("A","2026-10-21"));
    act(()=>{result.current.save("Privat",[],[]);});
    rerender();
    const original=result.current.heads[0];
    const staleSave=result.current.save;
    state.owner="B";
    expect(staleSave("",[],[original.id])).toBeNull();
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].text).toBe("Privat");
  });
  it("reports no save for first empty text",()=>{
    const {result}=renderHook(()=>useDaySpace("A","2026-10-21"));
    expect(result.current.save("   ",[],[])).toBeNull();expect(state.write).not.toHaveBeenCalled();
  });
  it("rejects a stale owner handler and hides prior account rows",()=>{
    const {result,rerender}=renderHook(()=>useDaySpace("A","2026-10-21"));
    act(()=>{result.current.save("Privat A",[],[]);});
    const save=result.current.save;state.owner="B";state.write.mockClear();
    expect(save("Sen text",[],[])).toBeNull();rerender();
    expect(state.write).not.toHaveBeenCalled();expect(result.current.heads).toEqual([]);
  });
});
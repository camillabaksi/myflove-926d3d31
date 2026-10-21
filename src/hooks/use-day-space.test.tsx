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
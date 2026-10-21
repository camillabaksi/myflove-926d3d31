import { beforeEach, describe, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({owner:"A",authCallback: undefined as undefined | ((event:string,session:{user:{id:string}}|null)=>void)}));
vi.mock("@/lib/account-scope",()=>({isActiveOwner:(id:string)=>id===state.owner}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{auth:{onAuthStateChange:(callback:typeof state.authCallback)=>{state.authCallback=callback;}}}}));
import { clearSpaceDraft, clearSpaceDrafts, readSpaceDraft, writeSpaceDraft } from "./day-space-drafts";
describe("daily space draft account boundaries",()=>{
  beforeEach(()=>{clearSpaceDrafts();state.owner="A";state.authCallback?.("SIGNED_IN",{user:{id:"A"}});});
  it("keeps unsaved text across editor remounts and date switches",()=>{
    writeSpaceDraft("A","2026-10-21",{text:"Mitt utkast",categories:[],parents:[]});
    expect(readSpaceDraft("A","2026-10-20")).toBeUndefined();
    expect(readSpaceDraft("A","2026-10-21")?.text).toBe("Mitt utkast");
  });
  it("rejects late writes and hides drafts under another account",()=>{
    writeSpaceDraft("A","2026-10-21",{text:"Privat A",categories:[],parents:[]});
    state.owner="B";
    writeSpaceDraft("A","2026-10-21",{text:"Sen skrivning",categories:[],parents:[]});
    expect(readSpaceDraft("A","2026-10-21")).toBeUndefined();
    expect(readSpaceDraft("B","2026-10-21")).toBeUndefined();
  });
  it("purges plaintext on logout",()=>{
    writeSpaceDraft("A","2026-10-21",{text:"Privat",categories:[],parents:[]});
    state.authCallback?.("SIGNED_OUT",null);
    expect(readSpaceDraft("A","2026-10-21")).toBeUndefined();
  });
  it("purges drafts on direct identity changes",()=>{
    writeSpaceDraft("A","2026-10-21",{text:"Privat",categories:[],parents:[]});
    state.authCallback?.("SIGNED_IN",{user:{id:"B"}});
    expect(readSpaceDraft("A","2026-10-21")).toBeUndefined();
  });
  it("clears only the saved date",()=>{
    for(const date of ["2026-10-20","2026-10-21"]) writeSpaceDraft("A",date,{text:date,categories:[],parents:[]});
    clearSpaceDraft("A","2026-10-21");
    expect(readSpaceDraft("A","2026-10-21")).toBeUndefined();
    expect(readSpaceDraft("A","2026-10-20")?.text).toBe("2026-10-20");
  });
});
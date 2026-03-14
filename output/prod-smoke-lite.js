const fs=require('fs');
const path=require('path');
const {createClient}=require('@supabase/supabase-js');

for (const line of fs.readFileSync('.env.local','utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const i=line.indexOf('='); if(i<0) continue;
  const k=line.slice(0,i).trim(); const v=line.slice(i+1).trim();
  if (!(k in process.env)) process.env[k]=v;
}

const BASE='https://keeptruckin-motive.vercel.app';
const SUPA_URL=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim();
const SUPA_KEY=(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim();
const COMPANY='11111111-1111-4111-8111-111111111111';
const PASS='Password123!';
const roles={owner:'owner.atlas@example.com',admin:'admin.atlas@example.com',dispatcher:'dispatcher.atlas@example.com',driver:'driver.atlas@example.com',viewer:'viewer.atlas@example.com'};
const out={authentication:[],rbac:[],api:[],playwright:[],deployment:[]};
const push=(k,n,s,d)=>out[k].push({name:n,status:s,details:d});

(async()=>{
  try{
    const r=await fetch(BASE+'/login'); push('authentication','login page','PASS',String(r.status));
  }catch(e){push('authentication','login page','FAIL',e.message)}
  try{
    const r=await fetch(BASE+'/dashboard',{redirect:'manual'});
    const loc=r.headers.get('location')||'';
    if((r.status===302||r.status===307) && loc.includes('/login')) push('deployment','protected redirect','PASS',`${r.status} ${loc}`);
    else push('deployment','protected redirect','FAIL',`${r.status} ${loc}`);
  }catch(e){push('deployment','protected redirect','FAIL',e.message)}

  if(!SUPA_URL||!SUPA_KEY){push('rbac','env','FAIL','missing supabase env');}
  else {
    for(const [role,email] of Object.entries(roles)){
      try{
        const sb=createClient(SUPA_URL,SUPA_KEY);
        const {error:se}=await sb.auth.signInWithPassword({email,password:PASS});
        if(se){push('rbac',`${role} login`,'FAIL',se.message);continue;}
        push('rbac',`${role} login`,'PASS','ok');
        if(role==='driver'||role==='viewer'){
          const {error}=await sb.from('drivers').insert({company_id:COMPANY,first_name:'No',last_name:'Write',license_number:`NO-${role}-${Date.now()}`});
          push('rbac',`${role} cannot write` , error?'PASS':'FAIL', error?error.message:'insert succeeded');
        }
        if(role==='owner'){
          const {error}=await sb.from('company_invitations').insert({company_id:COMPANY,email:`owner-smoke-${Date.now()}@example.com`,role:'viewer'});
          push('rbac','owner can invite','PASS', error?`unexpected:${error.message}`:'insert ok');
          const lic=`SMK-${Date.now()}`;
          const {data,error:derr}=await sb.from('drivers').insert({company_id:COMPANY,first_name:'Smoke',last_name:'Owner',license_number:lic}).select('id,license_number').single();
          if(derr){push('api','create driver','FAIL',derr.message);} else {push('api','create driver','PASS',JSON.stringify(data));}
        }
        if(role==='admin'){
          const {data:rows,error:q}=await sb.from('company_members').select('id,role').eq('company_id',COMPANY).limit(5);
          if(q||!rows?.length){push('rbac','admin cannot update company_members roles','FAIL',q?.message||'no rows');}
          else {
            const target=rows.find(r=>r.role==='viewer')||rows[0];
            const {error}=await sb.from('company_members').update({role:'driver'}).eq('id',target.id);
            push('rbac','admin cannot update company_members roles', error?'PASS':'FAIL', error?error.message:'update succeeded');
          }
          const {error:cerr}=await sb.from('companies').update({created_by:null}).eq('id',COMPANY);
          push('rbac','admin cannot change company ownership', cerr?'PASS':'FAIL', cerr?cerr.message:'update succeeded');
        }
      }catch(e){push('rbac',`${role} checks`,'FAIL',e.message||String(e));}
    }
  }

  try{
    require('child_process').execSync('pnpm exec playwright test tests/e2e/auth-smoke.spec.ts tests/e2e/dashboard-auth.spec.ts',{stdio:'pipe',timeout:180000});
    push('playwright','tests/e2e','PASS','ok');
  }catch(e){push('playwright','tests/e2e','FAIL',(e.stdout?.toString()||'')+(e.stderr?.toString()||''));}

  try{
    require('child_process').execSync('pnpm test',{stdio:'pipe',timeout:180000});
    push('playwright','pnpm test','PASS','ok');
  }catch(e){push('playwright','pnpm test','FAIL',(e.stdout?.toString()||'')+(e.stderr?.toString()||''));}

  fs.writeFileSync('output/prod-smoke-lite.json',JSON.stringify(out,null,2));
  console.log(JSON.stringify(out,null,2));
})();

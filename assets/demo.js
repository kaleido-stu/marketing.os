/* Offline presentation adapter. Synthetic data only; no server requests. */
(() => {
'use strict';
const seed=window.DEMO_SEED, KEY='kaleido-client-demo-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
let state; try { state=JSON.parse(localStorage.getItem(KEY)); } catch {}
if(!state) state={records:clone(seed.records),changes:[],notes:{},permissions:{},company:{},read:false};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={clients:'العملاء',leads:'العملاء المحتملون',projects:'المشاريع',tasks:'التاسكات',invoices:'الفواتير',quotations:'عروض السعر',expenses:'المصروفات',freelancers:'الفريلانسرز',departments:'الأقسام',resources:'المعدات',scheduling:'الحجوزات',users:'المستخدمون',roles:'الأدوار'};
const statuses={active:'نشط',archived:'مؤرشف',new:'جديد',contacted:'تم التواصل',proposal:'عرض سعر',negotiation:'تفاوض',won:'تم التعاقد',lost:'مفقود',in_progress:'جاري التنفيذ',review:'مراجعة',completed:'اكتمل',done:'اكتمل',draft:'مسودة',sent:'مُرسل',accepted:'مقبول',rejected:'مرفوض',due:'مستحقة',paid:'مدفوعة',partial:'مدفوعة جزئيًا',scheduled:'مجدول',cancelled:'ملغي',live:'جاري التصوير'};
const pathFor={clients:'/crm/clients',leads:'/crm/leads',projects:'/projects',tasks:'/tasks',invoices:'/invoices',quotations:'/finance/quotations',expenses:'/finance/expenses',freelancers:'/freelancers',departments:'/departments',resources:'/scheduling/resources',scheduling:'/scheduling',users:'/settings/users',roles:'/settings/roles'};
const current=decodeURIComponent(location.pathname.split('/').pop()||'index.html');
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{toast('التخزين المحلي غير متاح؛ التغييرات مستمرة حتى إغلاق الصفحة.')}}
function toast(message){if(typeof window.showToast==='function'&&document.getElementById('toast'))window.showToast(message);else{let box=document.getElementById('demo-toast');if(!box){box=document.createElement('div');box.id='demo-toast';box.setAttribute('role','status');document.body.append(box)}box.textContent=message;box.classList.add('visible');setTimeout(()=>box.classList.remove('visible'),3500)}}
function normalize(input){let raw=String(input?.url||input);try{raw=decodeURIComponent(new URL(raw,location.href).pathname)}catch{}const file=raw.split('/').find(x=>x.endsWith('.html'));if(file){const entry=Object.entries(seed.routes).find(([,f])=>f===file);if(entry)raw=entry[0]+raw.slice(raw.indexOf(file)+file.length)}return raw.replace(/\/$/,'')||'/'}
function pageFor(path){return seed.routes[path]||'index.html'}
function list(type){return state.records[type]||[]}
function get(type,id){return list(type).find(r=>String(r.id)===String(id)&&!r._deleted)}
function title(r){return r?.name||r?.title||r?.invoice_number||r?.quotation_number||r?.description||'سجل تجريبي'}
function recordLink(type,id){return seed.routes[pathFor[type]+'/'+id]||`demo-record.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`}
function add(type,body){const id=Math.max(1000,...list(type).map(r=>+r.id||0))+1;const row={id,...body,_new:true,created_at:new Date().toISOString()};list(type).push(row);mark(type,row,'إضافة');return row}
function mark(type,row,action){row._changed=true;state.changes.unshift({type,id:row.id,name:title(row),action,time:new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})});state.changes=state.changes.slice(0,100);save()}
function decode(body){if(body instanceof FormData||body instanceof URLSearchParams){const obj={};for(const[k,v]of body.entries()){if(k.endsWith('[]'))(obj[k.slice(0,-2)]??=[]).push(v);else obj[k]=v instanceof File?v.name:v}return obj}try{return JSON.parse(body||'{}')}catch{return {}}}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}})}
function conflictRows(body){return list('scheduling').filter(s=>!s._deleted&&String(s.id)!==String(body.except_id)&&new Date(s.start_at)<new Date(body.end_at)&&new Date(s.end_at)>new Date(body.start_at)&&(body.resources||[]).some(id=>(s.resources||[]).some(r=>String(r.id??r)===String(id)))).map(s=>({title:s.title,message:'المعدة محجوزة بالفعل في '+s.title,start_at:s.start_at,end_at:s.end_at,type:'resource',name:s.title}))}
function calendar(url){let filter;try{filter=new URL(String(url),location.href).searchParams.get('booking_type')}catch{}const resources=list('resources').filter(r=>!r._deleted);return {resources:resources.map(r=>({id:String(r.id),title:r.name})),events:list('scheduling').filter(s=>!s._deleted&&s.status!=='cancelled'&&(!filter||s.booking_type===filter)).map(s=>{const kind=s.booking_type||'shoot';return {id:String(s.id),title:s.title,start:String(s.start_at).slice(0,19),end:String(s.end_at).slice(0,19),resourceIds:(s.resources||[]).map(r=>String(r.id??r)),backgroundColor:{shoot:'#2563eb',equipment:'#7c3aed',studio:'#15803d'}[kind],extendedProps:{bookingType:kind,typeLabel:{shoot:'تصوير',equipment:'معدة',studio:'استوديو'}[kind],multiDay:String(s.start_at).slice(0,10)!==String(s.end_at).slice(0,10),recurring:s.is_recurring,status:statuses[s.status]||s.status,location:s.location,project:title(get('projects',s.project_id)),booker:'أحمد منصور',resources:(s.resources||[]).map(r=>r.name||get('resources',r)?.name||''),canEdit:true,canDelete:true,editUrl:seed.routes['/scheduling/'+s.id+'/edit']||recordLink('scheduling',s.id),deleteUrl:'http://demo.local/scheduling/'+s.id}}})}}
window.fetch=async(input,options={})=>{
 const path=normalize(input),method=(options.method||'GET').toUpperCase(),body=decode(options.body);
 if(path.includes('/notifications')){if(path.endsWith('read-all')){state.read=true;save()}return json({ok:true,unread:state.read?0:2,items:state.read?[]:[{id:1,title:'مهمة جاهزة للمراجعة: اعتماد السكريبت',body:'حملة رمضان 2026',time:'منذ 5 دقائق',unread:true,icon:'task',url:'tasks-3.html'},{id:2,title:'دفعة مستحقة للمتابعة',body:'راجع الفواتير المستحقة لهذا الأسبوع',time:'منذ ساعة',unread:true,icon:'completed',url:'invoices.html'}]})}
 if(path==='/scheduling/events')return json(calendar(input));
 if(path==='/scheduling/conflicts')return json({ok:true,conflicts:conflictRows(body)});
 if(path.includes('/client-projects/'))return json({ok:true,projects:list('projects').filter(p=>String(p.client_id)===path.split('/').pop())});
 if(path.includes('/project-tasks/'))return json({ok:true,tasks:list('tasks').filter(t=>String(t.project_id)===path.split('/').pop())});
 if(path.includes('/project-options'))return json({ok:true,projects:list('projects')});
 if(path.endsWith('/search')){
  const type=path.includes('leads')?'leads':'projects';let q='';try{q=new URL(String(input),location.href).searchParams.get('q')||''}catch{}
  if(type==='leads'){applyFilters();return new Response(document.getElementById('leads-body')?.innerHTML||'',{headers:{'Content-Type':'text/html'}})}
  return json({ok:true,projects:list(type).filter(r=>title(r).includes(q)),results:list(type).filter(r=>title(r).includes(q))});
 }
 if(path.includes('/account/')||path==='/logout')return json({ok:false,message:'أمان الحساب وتسجيل الدخول محاكاة عرض فقط؛ لا يتم تغيير أي حساب حقيقي.'},422);
 if(path==='/settings/permissions'){state.permissions={...state.permissions,...body};save();return json({ok:true,message:'تم حفظ صلاحيات العرض محليًا'})}
 if(/^\/tasks\/steps\/\d+/.test(path)){const stepId=path.split('/')[3];for(const task of list('tasks')){const step=task.steps?.find(s=>String(s.id)===stepId);if(step){if(method==='DELETE')task.steps=task.steps.filter(s=>s!==step);else step.done=!step.done;mark('tasks',task,'خطوة فرعية');return json({ok:true,done:step.done,message:'تم تحديث الخطوة محليًا'})}}return json({ok:false,message:'الخطوة غير موجودة'},404)}
 let type,id,action;
 for(const [key,prefix]of Object.entries(pathFor).sort((a,b)=>b[1].length-a[1].length))if(path===prefix||path.startsWith(prefix+'/')){type=key;const rest=path.slice(prefix.length).split('/').filter(Boolean);id=rest[0];action=rest[1];break}
 if(!type)return json({ok:false,message:'هذا الإجراء متاح في النظام المتصل فقط. استخدم شاشات الديمو للعرض.'},422);
 if(method==='GET')return json({ok:true,items:list(type).filter(r=>!r._deleted)});
 if(id==='bulk'){for(const row of list(type))if((body.ids||[]).map(String).includes(String(row.id))){if(body.action==='delete')row._deleted=true;else if(body.action==='archive')row.status='archived';mark(type,row,'إجراء جماعي')}return json({ok:true,message:'تم تحديث السجلات محليًا'})}
 let row=id?get(type,id):null,redirect=pageFor(pathFor[type]);
 if(id&&!row)return json({ok:false,message:'السجل غير موجود في نسخة العرض.'},404);
 if(action==='send')return json({ok:false,message:'نسخة عرض: لا يتم إرسال رسائل حقيقية. يمكنك طباعة عرض السعر وحفظه PDF.'},422);
 if(action==='password')return json({ok:false,message:'كلمات المرور والدعوات محاكاة عرض فقط.'},422);
 if(action==='steps'){const step={id:Date.now(),title:body.title,details:body.details,done:false};(row.steps??=[]).push(step);mark(type,row,'خطوة فرعية');return json({ok:true,id:step.id,step,message:'تمت إضافة الخطوة محليًا'})}
 if(action==='attachments'){(row.attachments??=[]).push({id:Date.now(),original_filename:body.file||body.files||'ملف تجريبي'});mark(type,row,'مرفق');return json({ok:true,message:'تم تسجيل اسم المرفق محليًا؛ لا يتم رفع ملفات إلى خادم في نسخة العرض.'})}
 if(action==='notes'){(state.notes[pathFor[type]+'/'+id]??=[]).unshift({note:body.note,name:'أحمد منصور',time:'الآن',initials:'أم'});mark(type,row,'ملاحظة');return json({ok:true,message:'تم حفظ الملاحظة محليًا',log:{note:body.note,name:'أحمد منصور',time:'الآن',initials:'أم'}})}
 if(action==='payments'){
  row.payments??=[];const paymentId=path.split('/')[4];
  if(method==='DELETE')row.payments=row.payments.filter(p=>String(p.id)!==paymentId);
  else {const balance=+row.amount-row.payments.reduce((s,p)=>s+(+p.amount),0);if(+body.amount<=0||+body.amount>balance)return json({ok:false,message:'قيمة الدفعة يجب أن تكون أكبر من صفر ولا تتجاوز الرصيد.'},422);row.payments.push({id:Date.now(),...body})}
  const paid=row.payments.reduce((s,p)=>s+(+p.amount),0);row.status=paid>=+row.amount?'paid':paid>0?'partial':'due';
 }else if(action==='accept'){
  if(row.status==='accepted')return json({ok:false,message:'تم قبول هذا العرض بالفعل.'},422);
  const project=add('projects',{name:body.project_name||row.title,client_id:row.client_id,budget:row.amount,status:'active',type:'مشروع'});
  const invoice=add('invoices',{invoice_number:'INV-DEMO-'+project.id,client_id:row.client_id,project_id:project.id,amount:row.amount,status:'draft',items:row.items,payments:[],due_date:'2026-11-30'});
  row.status='accepted';row.converted_project_id=project.id;row.converted_invoice_id=invoice.id;
 }else if(action==='reject'){row.status='rejected';row.rejected_reason=body.rejected_reason;
 }else if(action==='convert'){
  if(type==='leads'){const client=add('clients',{...body,name:row.name,industry:row.company,status:'active',contract_type:'project'});row.stage='won';row.converted_client_id=client.id;redirect=recordLink('clients',client.id)}
  else {const project=add('projects',{...body,client_id:row.id,status:'active'});redirect=recordLink('projects',project.id)}
 }else if(action==='archive')row.status='archived';
 else if(action==='reactivate')row.status='active';
 else if(action==='approve')row.status='due';
 else if(action==='paid'){row.payments=[{id:Date.now(),amount:row.amount,paid_at:'2026-11-09',method:'bank_transfer'}];row.status='paid'}
 else if(action==='toggle')row.is_active=!row.is_active;
 else if(action==='stage')Object.assign(row,body);
 else if(action==='status')Object.assign(row,body,{started_at:body.status==='in_progress'?new Date().toISOString():row.started_at});
 else if(action==='return')Object.assign(row,{status:'in_progress',review_note:body.review_note||body.note});
 else if(action==='deadline')Object.assign(row,body);
 else if(action==='comments'){(row.comments??=[]).push({id:Date.now(),body:body.body||body.comment,user:{name:'أحمد منصور'}})}
 else if(action==='members'||action==='freelancers'){row[action]=body[action]||[body.user_id||body.freelancer_id]}
 else if(method==='DELETE')row._deleted=true;
 else if(!id){row=add(type,{status:type==='clients'?'active':type==='leads'?'new':'draft',...body});if(type==='invoices')row.invoice_number='INV-DEMO-'+row.id;if(type==='quotations')row.quotation_number='QUO-DEMO-'+row.id;redirect=recordLink(type,row.id)}
 else Object.assign(row,body);
 if(body.items)row.amount=body.items.reduce((s,i)=>s+(i.amount!=null?+i.amount:(+i.quantity||0)*(+i.unit_price||0)),0);
 mark(type,row,method==='DELETE'?'حذف':'تحديث');
 setTimeout(refresh,50);
 return json({ok:true,id:row.id,message:'تم الحفظ في نسخة العرض محليًا ✓',redirect,status:row.status,stage:row.stage,can_still_view:true,conflicts:[],log:{note:body.note,name:'أحمد منصور',initials:'أم',time:'الآن'}});
};
window.Demo={state,get,list,save,recordLink,refresh,reset(){if(confirm('إعادة الديمو للبيانات الأصلية ومسح تغييرات العرض؟')){localStorage.removeItem(KEY);location.href='index.html'}},openRecord(type,id){showRecord(type,id)},toast};
function rowId(row,type){const check=row.querySelector('.bulk-item');if(check)return check.value;const link=row.querySelector(`a[href^="${type==='clients'?'crm-clients':type==='leads'?'crm-leads':type}-"]`);if(link)return link.getAttribute('href').match(/-(\d+)/)?.[1];const event=row.querySelector('[onclick]')?.getAttribute('onclick')||'';return event.match(/\((\d+)/)?.[1]}
function currentType(){const path=normalize(current);return Object.entries(pathFor).sort((a,b)=>b[1].length-a[1].length).find(([,p])=>path===p||path.startsWith(p+'/'))?.[0]}
function refresh(){
 const type=currentType();
 if(type){for(const tr of document.querySelectorAll('tbody tr')){const id=rowId(tr,type),row=get(type,id);if(!id)continue;if(!row){tr.hidden=true;tr.dataset.demoRemoved='1';continue}if(type==='clients'&&row.status==='archived'&&!current.includes('archived')){tr.hidden=true;tr.dataset.demoRemoved='1'}if(type==='clients'&&row.status==='active'&&current.includes('archived')){tr.hidden=true;tr.dataset.demoRemoved='1'}if(row._changed){const badge=tr.querySelector('.badge');if(badge&&statuses[row.status||row.stage])badge.textContent=statuses[row.status||row.stage];const select=tr.querySelector('select');if(select)select.value=row.stage||row.status;}}
 const panel=document.getElementById('demo-updates');if(panel){const changed=list(type).filter(r=>r._changed&&!r._deleted);panel.hidden=!changed.length;panel.innerHTML='<h3>تغييرات العرض المحفوظة</h3><p>السجلات التالية تعكس تجربتك المحلية. بيانات الشاشات الأساسية لقطة من النظام.</p><div class="demo-changed-list">'+changed.map(r=>`<button type="button" data-demo-record="${type}:${r.id}"><strong>${esc(title(r))}</strong><span>${esc(statuses[r.status||r.stage]||r.industry||'عرض التفاصيل')} ←</span></button>`).join('')+'</div>';}}
 const notesKey=normalize(current);if(state.notes[notesKey]){const host=document.getElementById('al-list');if(host){host.querySelectorAll('[data-demo-note]').forEach(n=>n.remove());for(const note of [...state.notes[notesKey]].reverse()){const item=document.createElement('div');item.className='activity-item';item.dataset.demoNote='1';item.innerHTML=`<span class="avatar-sm">أم</span><div><b>أحمد منصور</b><p>${esc(note.note)}</p><small>محفوظ محليًا</small></div>`;host.prepend(item)}document.getElementById('al-empty')?.remove()}}
 const taskMatch=current.match(/^tasks-(\d+)\.html$/);if(taskMatch){const row=get('tasks',taskMatch[1]);const control=document.getElementById('task-status-control');if(control&&row)control.value=row.status;}
 applyFilters();
}
function applyFilters(){
 const params=new URLSearchParams(location.search);let query=params.get('q')||params.get('search')||'';
 const search=document.querySelector('form[method="GET"] input[name="q"],form[method="get"] input[name="q"],#lf-q');if(search)query=search.value;
 const type=currentType();if(!type)return;
 const status=params.get('status')||params.get('stage')||'';
 let count=0;
 for(const tr of document.querySelectorAll('tbody tr')){if(!tr.querySelector('td')||tr.dataset.demoRemoved)continue;const record=get(type,rowId(tr,type));let visible=!query||tr.textContent.toLowerCase().includes(query.toLowerCase());if(status&&status!=='all'&&record)visible=visible&&(record.status===status||record.stage===status);for(const[k,v]of params)if(v&&record&&['project_id','client_id','department_id','contract_type','source','owner_id','company','type'].includes(k))visible=visible&&String(record[k]??'')===v;tr.hidden=!visible;if(visible)count++}
 document.querySelectorAll('.tf-count,#lf-count').forEach(n=>n.textContent=count+' نتيجة');
 document.querySelectorAll('.pill-tab').forEach(a=>{const p=new URL(a.href,location.href).searchParams.get('status');if(p)a.classList.toggle('active',(status||'all')===p)});
}
function showRecord(type,id){const row=get(type,id);if(!row){toast('تم حذف السجل من نسخة العرض');return}let modal=document.getElementById('demo-detail');if(!modal){modal=document.createElement('dialog');modal.id='demo-detail';document.body.append(modal)}
 const fields={name:'الاسم',title:'العنوان',industry:'القطاع',email:'البريد الإلكتروني',phone:'الهاتف',description:'الوصف',status:'الحالة',stage:'المرحلة',amount:'القيمة',budget:'الميزانية',due_date:'الاستحقاق',valid_until:'صالح حتى',start_at:'البداية',end_at:'النهاية',location:'الموقع',notes:'الملاحظات',rejected_reason:'سبب الرفض',review_note:'ملاحظات المراجعة',scope:'نطاق العمل',deliverables:'المخرجات'};
 modal.innerHTML=`<header><div><small>${esc(labels[type])} · بيانات عرض محلية</small><h2>${esc(title(row))}</h2></div><button class="btn btn-ghost" data-demo-close>×</button></header><dl>${Object.entries(fields).filter(([k])=>row[k]!=null&&row[k]!=='').map(([k,v])=>`<dt>${v}</dt><dd>${esc(statuses[row[k]]||row[k])}</dd>`).join('')}</dl>${row.items?'<h3>البنود</h3>'+row.items.map(i=>`<p>${esc(i.description)} · ${esc(i.quantity)} × ${esc(i.unit_price)} ج.م</p>`).join(''):''}${row.payments?'<h3>الدفعات</h3><p>'+row.payments.reduce((s,p)=>s+(+p.amount),0).toLocaleString('ar-EG')+' ج.م — إجمالي المحصل</p>':''}${row.converted_project_id?`<p><a class="btn btn-outline" href="${recordLink('projects',row.converted_project_id)}">المشروع الناتج</a> <a class="btn btn-outline" href="${recordLink('invoices',row.converted_invoice_id)}">الفاتورة الناتجة</a></p>`:''}<footer><button class="btn btn-primary" data-demo-close>إغلاق</button></footer>`;modal.showModal();}
function tour(){let modal=document.getElementById('demo-tour');if(!modal){modal=document.createElement('dialog');modal.id='demo-tour';document.body.append(modal)}modal.innerHTML=`<header><div><small>Kaleido O.S</small><h2>وكالتك، من أول تواصل لآخر تسليم.</h2></div><button class="btn btn-ghost" data-demo-close>×</button></header><p>اختار مرحلة لاستعراض دورة العمل الكاملة في النظام.</p><div class="demo-tour-grid">${[['crm-pipeline.html','01','من فرصة إلى عميل','مسار البيع، المتابعات، سجل التواصل والتحويل.'],['quotations.html','02','اتفاق واضح من البداية','عروض سعر ببنود تفصيلية، قبول وتحويل لمشروع وفاتورة.'],['projects-1.html','03','فريق واحد، شغل مترابط','مشاريع، أقسام، تاسكات، مراجعات وخطوات تنفيذ.'],['scheduling.html','04','كل الإنتاج في تقويم','حجوزات تصوير ومعدات واستوديوهات وكشف التعارض.'],['invoices.html','05','صورة مالية واضحة','فواتير ودفعات ومصروفات وتقارير ربحية.'],['settings-users.html','06','كل شخص بصلاحياته','إدارة الفريق والأدوار ونطاق الوصول وسجل النشاط.']].map(([url,num,h,p])=>`<a href="${url}"><span>${num}</span><div><h3>${h}</h3><p>${p}</p></div></a>`).join('')}</div><p class="demo-footnote">بيانات تجريبية فقط · التغييرات تُحفظ في هذا المتصفح · الإرسال والأمان محاكاة عرض</p>`;modal.showModal()}
document.addEventListener('click',event=>{
 const record=event.target.closest('[data-demo-record]');if(record){const[type,id]=record.dataset.demoRecord.split(':');showRecord(type,id);return}
 if(event.target.closest('[data-demo-close]')){event.target.closest('dialog').close();return}
 const a=event.target.closest('a');if(!a)return;const raw=a.getAttribute('href')||'';
 if(/^(mailto:|tel:|https?:\/\/wa.me)/.test(raw)){event.preventDefault();toast('بيانات اتصال تجريبية للعرض فقط');return}
 if(raw.includes('demo.local')){event.preventDefault();const path=normalize(raw);if(path.includes('/pdf')){const id=path.split('/')[3];location.href=`quotations-${id}-print.html`;toast('استخدم طباعة المتصفح ثم حفظ بصيغة PDF')}else if(path.includes('/logout'))location.href='login.html';else if(path.includes('/language/')){toast('النسخة المقدمة للعرض بالعربية')}else if(path.startsWith('/notifications/'))location.href='tasks.html';else if(seed.routes[path])location.href=seed.routes[path];else toast('هذا الإجراء محاكاة في نسخة العرض');return}
},true);
document.addEventListener('submit',event=>{
 const form=event.target, method=(form.getAttribute('method')||'GET').toUpperCase();
 if(form.id==='payment-form')return;
 event.preventDefault();event.stopImmediatePropagation();
 if(method==='GET'){const params=new URLSearchParams(new FormData(form));history.replaceState(null,'',current+'?'+params);applyFilters();return}
 const action=form.getAttribute('action')||normalize(current);
 if(action.includes('logout')){location.href='login.html';return}
 if(action.includes('login')){location.href='index.html';return}
 if(action.includes('company')){state.company=Object.fromEntries(new FormData(form));save();toast('تم حفظ بيانات الشركة محليًا');return}
 window.fetch(action,{method,body:new FormData(form)}).then(r=>r.json()).then(d=>{toast(d.message);if(d.ok){refresh();if(d.redirect)location.href=d.redirect}});
},true);
// Native form.submit() bypasses the submit event; route filters through the adapter.
HTMLFormElement.prototype.submit=function(){this.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))};
document.addEventListener('DOMContentLoaded',()=>{
 const bar=document.createElement('div');bar.className='demo-bar';bar.innerHTML='<span><i></i> نسخة عرض للعميل</span><div><button id="demo-tour-btn">جولة في النظام</button><button id="demo-reset-btn" title="مسح التغييرات التجريبية">إعادة ضبط</button></div>';document.body.prepend(bar);
 document.getElementById('demo-tour-btn').onclick=tour;document.getElementById('demo-reset-btn').onclick=()=>window.Demo.reset();
 const content=document.querySelector('.content')||document.querySelector('.main');if(content){const updates=document.createElement('section');updates.id='demo-updates';updates.hidden=true;content.prepend(updates)}
 document.querySelectorAll('form[method="GET"],form[method="get"]').forEach(form=>{const params=new URLSearchParams(location.search);for(const[k,v]of params){const el=form.elements.namedItem(k);if(el&&'value'in el)el.value=v}});
 document.querySelectorAll('input[type="search"],form[method="GET"] input[name="q"]').forEach(el=>el.addEventListener('input',applyFilters));
 if(current==='demo-record.html'){const params=new URLSearchParams(location.search);const type=params.get('type'),id=params.get('id');const row=get(type,id);const container=document.getElementById('demo-record-host');if(row)container.innerHTML=`<h2>${esc(title(row))}</h2><p>تم إنشاء هذا السجل أثناء العرض وحفظه في المتصفح.</p><button class="btn btn-primary" data-demo-record="${esc(type)}:${esc(id)}">عرض التفاصيل</button> <a class="btn btn-outline" href="${pageFor(pathFor[type])}">رجوع إلى ${esc(labels[type])}</a>`;}
 refresh();
 for(const key of ['invoiceToast','projectToast','scheduleToast','taskToast']){const message=sessionStorage.getItem(key);if(message){toast(message);sessionStorage.removeItem(key)}}
 if(current==='account-security.html')document.querySelectorAll('form').forEach(f=>{const p=document.createElement('p');p.className='demo-footnote';p.textContent='محاكاة واجهة الأمان — لا توجد حسابات حقيقية في الديمو.';f.prepend(p)});
 if(current==='settings-company.html')for(const[k,v]of Object.entries(state.company)){const el=document.querySelector(`[name="${CSS.escape(k)}"]`);if(el&&el.type!=='file'&&el.type!=='hidden')el.value=v}
});
})();

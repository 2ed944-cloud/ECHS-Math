const ECHSBank={
  catalog:null,
  storeKey:"echs_qbank_attempts_v20",
  async loadCatalog(){
    if(!this.catalog){
      const response=await fetch("data/catalog.json");
      if(!response.ok) throw new Error("Could not load question bank catalog");
      this.catalog=await response.json();
    }
    return this.catalog;
  },
  async loadBundle(source){
    const row=typeof source==="string"?{file:source}:source;
    const files=(row?.files||[row?.file]).filter(Boolean);
    if(!files.length) return [];
    const groups=await Promise.all(files.map(async file=>{
      const response=await fetch(file);
      if(!response.ok) throw new Error("Could not load "+file);
      const data=await response.json();
      return data.questions||data;
    }));
    const seen=new Set(),out=[];
    groups.flat().forEach(q=>{if(q&&q.id&&!seen.has(q.id)){seen.add(q.id);out.push(q);}});
    return out;
  },
  escape(value){return String(value??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));},
  shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},
  choiceOrder(q){const rows=(q.choices||[]).map((c,i)=>({...c,_sourceIndex:i}));return q.metadata?.shuffle_choices?this.shuffle(rows):rows;},
  params(){return new URLSearchParams(location.search);},
  getAttempts(){try{const value=JSON.parse(localStorage.getItem(this.storeKey)||"[]");return Array.isArray(value)?value:[];}catch{return[];}},
  saveAttempt(question,correct,response){
    const p=this.params(),attempts=this.getAttempts();
    attempts.push({
      id:question.id,bank_code:question.bank_code,type:question.type,correct:Boolean(correct),response:String(response??""),
      topic:question.classification?.ap_topic||p.get("topic")||null,
      unit:question.classification?.ap_unit||p.get("unit")||null,
      course:p.get("course")||((question.classification?.course_scope||"").toLowerCase().includes("calculus")?"ap-calculus":null),
      lesson:p.get("from")||null,section:question.source?.section||null,at:new Date().toISOString()
    });
    localStorage.setItem(this.storeKey,JSON.stringify(attempts.slice(-5000)));
  },
  normalizeAnswer(value){return String(value??"").trim().toLowerCase().replace(/\s+/g," ");},
  isAutoGradable(q){return ["mcq","true_false","fill_blank"].includes(q.type) && ((q.correct_choice_ids||[]).length||(q.accepted_answers||[]).length);},
  answerIsCorrect(q,response){
    if(["mcq","true_false"].includes(q.type)) return (q.correct_choice_ids||[]).includes(response);
    if(q.type==="fill_blank"){
      const actual=this.normalizeAnswer(response);
      return (q.accepted_answers||[]).some(a=>this.normalizeAnswer(a)===actual);
    }
    return null;
  },
  filterQuestions(qs,filters){
    return qs.filter(q=>{
      if(filters.bank&&filters.bank!=="all"&&q.bank_code!==filters.bank)return false;
      if(filters.type&&filters.type!=="all"&&q.type!==filters.type)return false;
      const d=q.metadata?.difficulty;
      if(filters.difficulty&&filters.difficulty!=="all"){
        if(filters.difficulty==="unrated"&&d!=null)return false;
        if(filters.difficulty!=="unrated"&&String(d)!==filters.difficulty)return false;
      }
      if(filters.section&&filters.section!=="all"&&String(q.source?.section||"unmapped")!==filters.section)return false;
      return true;
    });
  },
  labelType(type){return({mcq:"Multiple choice",true_false:"True / False",fill_blank:"Fill in the blank",essay:"Open response"})[type]||type;},
  bundleGroups(catalog){return[
    {key:"course_units",label:"Course and Unit"},
    {key:"course_all",label:"Full Course"},
    {key:"topics",label:"AP Calculus Unit 1 Topic"},
    {key:"ap_units",label:"AP Calculus Unit"},
    {key:"source_chapters",label:"Source Chapter"},
    {key:"scopes",label:"Scope / Readiness"}
  ].filter(g=>(catalog.bundles[g.key]||[]).length);},
  selectedBundleFromParams(catalog){
    const p=this.params(),course=p.get("course"),topic=p.get("topic"),unit=p.get("unit"),bundle=p.get("bundle");
    if(course&&unit){const row=(catalog.bundles.course_units||[]).find(x=>x.course_key===course&&String(x.unit)===String(unit));if(row)return{group:"course_units",row};}
    if(course){const row=(catalog.bundles.course_all||[]).find(x=>x.course_key===course);if(row)return{group:"course_all",row};}
    if(topic){const row=(catalog.bundles.topics||[]).find(x=>x.topic===topic);if(row)return{group:"topics",row};}
    if(unit){const row=(catalog.bundles.ap_units||[]).find(x=>String(x.unit)===String(unit));if(row)return{group:"ap_units",row};}
    if(bundle){for(const group of Object.keys(catalog.bundles)){const row=(catalog.bundles[group]||[]).find(x=>x.id===bundle);if(row)return{group,row};}}
    const row=(catalog.bundles.course_units||[])[0]||(catalog.bundles.topics||[])[0]||(catalog.bundles.ap_units||[])[0];
    return{group:row?.course_key?"course_units":row?.topic?"topics":"ap_units",row};
  },
  courseLabel(catalog,key){return (catalog.courses||[]).find(c=>c.key===key)?.label||key||"Course";}
};

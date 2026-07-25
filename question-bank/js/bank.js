const ECHSBank={
  catalog:null,
  storeKey:"echs_qbank_attempts_v20",
  mergeCounts(target={},source={}){
    Object.entries(source||{}).forEach(([key,value])=>target[key]=(target[key]||0)+(Number(value)||0));
    return target;
  },
  appendFiles(row,files){
    row.files=[...new Set([...(row.files||[row.file]).filter(Boolean),...(files||[])])];
  },
  mergeAddon(catalog,addon){
    if(!addon)return catalog;
    catalog.banks=catalog.banks||[];
    (addon.banks||[]).forEach(bank=>{
      const existing=catalog.banks.find(x=>x.code===bank.code);
      if(existing)Object.assign(existing,bank);
      else catalog.banks.push(bank);
    });
    catalog.bundles=catalog.bundles||{};
    Object.entries(addon.bundles||{}).forEach(([key,rows])=>{
      catalog.bundles[key]=catalog.bundles[key]||[];
      (rows||[]).forEach(row=>{
        if(!catalog.bundles[key].some(x=>x.id===row.id))catalog.bundles[key].push(row);
      });
    });
    (addon.courseUnitAugments||[]).forEach(augment=>{
      const row=(catalog.bundles.course_units||[]).find(x=>x.course_key===augment.course_key&&String(x.unit)===String(augment.unit));
      if(!row)return;
      this.appendFiles(row,augment.files);
      row.count=(row.count||0)+(augment.count||0);
      row.auto_gradable_count=(row.auto_gradable_count||0)+(augment.auto_gradable_count||0);
      row.bank_counts=this.mergeCounts(row.bank_counts||{},augment.bank_counts||{});
      row.type_counts=this.mergeCounts(row.type_counts||{},augment.type_counts||{});
      if(augment.questionFilter)row.questionFilter=augment.questionFilter;
    });
    (addon.courseAllAugments||[]).forEach(augment=>{
      const row=(catalog.bundles.course_all||[]).find(x=>x.course_key===augment.course_key);
      if(!row)return;
      this.appendFiles(row,augment.files);
      row.count=(row.count||0)+(augment.count||0);
      row.auto_gradable_count=(row.auto_gradable_count||0)+(augment.auto_gradable_count||0);
      row.bank_counts=this.mergeCounts(row.bank_counts||{},augment.bank_counts||{});
      row.type_counts=this.mergeCounts(row.type_counts||{},augment.type_counts||{});
    });
    return catalog;
  },
  async loadCatalog(){
    if(!this.catalog){
      const response=await fetch("data/catalog.json");
      if(!response.ok)throw new Error("Could not load question bank catalog");
      const catalog=await response.json();
      try{
        const addonResponse=await fetch("data/blackboard-addon.json");
        if(addonResponse.ok)this.mergeAddon(catalog,await addonResponse.json());
      }catch(error){
        console.warn("Optional publisher catalog addon was not loaded",error);
      }
      this.catalog=catalog;
    }
    return this.catalog;
  },
  pathValue(object,path){
    return String(path||"").split(".").reduce((value,key)=>value==null?undefined:value[key],object);
  },
  matchesQuestionFilter(question,filter){
    return Object.entries(filter||{}).every(([path,expected])=>{
      const actual=this.pathValue(question,path);
      return Array.isArray(expected)?expected.map(String).includes(String(actual)):String(actual)===String(expected);
    });
  },
  async loadBundle(source){
    const row=typeof source==="string"?{file:source}:source;
    const files=(row?.files||[row?.file]).filter(Boolean);
    if(!files.length)return[];
    const groups=await Promise.all(files.map(async file=>{
      const response=await fetch(file);
      if(!response.ok)throw new Error("Could not load "+file);
      const data=await response.json();
      return data.questions||data;
    }));
    const seen=new Set(),out=[];
    groups.flat().forEach(q=>{if(q&&q.id&&!seen.has(q.id)){seen.add(q.id);out.push(q);}});
    return row?.questionFilter?out.filter(q=>this.matchesQuestionFilter(q,row.questionFilter)):out;
  },
  escape(value){return String(value??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));},
  shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},
  choiceOrder(q){const rows=(q.choices||[]).map((c,i)=>({...c,_sourceIndex:i}));return q.metadata?.shuffle_choices?this.shuffle(rows):rows;},
  params(){return new URLSearchParams(location.search);},
  getAttempts(){try{const value=JSON.parse(localStorage.getItem(this.storeKey)||"[]");return Array.isArray(value)?value:[];}catch{return[];}},
  saveAttempt(question,correct,response){
    const p=this.params(),attempts=this.getAttempts();
    const scope=(question.classification?.course_scope||"").toLowerCase();
    const inferredCourse=scope.includes("precalculus")?"ap-precalculus":scope.includes("calculus")?"ap-calculus":null;
    attempts.push({
      id:question.id,bank_code:question.bank_code,type:question.type,correct:Boolean(correct),response:String(response??""),
      topic:question.classification?.ap_topic||p.get("topic")||null,
      unit:question.classification?.ap_unit||p.get("unit")||null,
      course:p.get("course")||inferredCourse,
      lesson:p.get("from")||null,section:question.source?.section||null,at:new Date().toISOString()
    });
    localStorage.setItem(this.storeKey,JSON.stringify(attempts.slice(-5000)));
  },
  normalizeAnswer(value){return String(value??"").trim().toLowerCase().replace(/\s+/g," ");},
  isAutoGradable(q){return ["mcq","true_false","fill_blank"].includes(q.type)&&((q.correct_choice_ids||[]).length||(q.accepted_answers||[]).length);},
  answerIsCorrect(q,response){
    if(["mcq","true_false"].includes(q.type))return(q.correct_choice_ids||[]).includes(response);
    if(q.type==="fill_blank"){
      const actual=this.normalizeAnswer(response);
      return(q.accepted_answers||[]).some(a=>this.normalizeAnswer(a)===actual);
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
  cleanStudentLabel(value){
    return String(value??"")
      .replace(/\s*·\s*(Initial Import|Pilot|Preview)\b/gi,"")
      .replace(/\b(Initial Import|Pilot|Preview)\b/gi,"")
      .replace(/\bBlackboard\b/gi,"Publisher")
      .replace(/\s{2,}/g," ")
      .replace(/\s*·\s*$/g,"")
      .trim();
  },
  bankLabel(code){
    const bank=(this.catalog?.banks||[]).find(x=>x.code===code);
    if(bank?.title)return this.cleanStudentLabel(bank.title);
    return({
      PCALRT5S:"Pearson Precalculus",
      CAF5S:"Pearson Precalculus Foundations",
      CALCT3BC:"Calculus: Early Transcendentals",
      ADAMS10:"Calculus: A Complete Course",
      PEARSON_CH0:"Pearson Calculus Foundations"
    })[code]||this.cleanStudentLabel(code);
  },
  bundleGroups(catalog){return[
    {key:"course_units",label:"Course and Unit"},
    {key:"course_all",label:"Full Course"},
    {key:"blackboard_banks",label:"Textbook Collection"},
    {key:"topics",label:"AP Calculus Unit 1 Topic"},
    {key:"ap_units",label:"AP Calculus Unit"},
    {key:"source_chapters",label:"Textbook Chapter"},
    {key:"scopes",label:"Coverage / Readiness"}
  ].filter(g=>(catalog.bundles[g.key]||[]).length);},
  selectedBundleFromParams(catalog){
    const p=this.params(),course=p.get("course"),topic=p.get("topic"),unit=p.get("unit"),bundle=p.get("bundle");
    if(course&&unit){const row=(catalog.bundles.course_units||[]).find(x=>x.course_key===course&&String(x.unit)===String(unit));if(row)return{group:"course_units",row};}
    if(course){const row=(catalog.bundles.course_all||[]).find(x=>x.course_key===course);if(row)return{group:"course_all",row};}
    if(topic){const row=(catalog.bundles.topics||[]).find(x=>x.topic===topic);if(row)return{group:"topics",row};}
    if(unit){const row=(catalog.bundles.ap_units||[]).find(x=>String(x.unit)===String(unit));if(row)return{group:"ap_units",row};}
    if(bundle){for(const group of Object.keys(catalog.bundles)){const row=(catalog.bundles[group]||[]).find(x=>x.id===bundle);if(row)return{group,row};}}
    const row=(catalog.bundles.course_units||[])[0]||(catalog.bundles.blackboard_banks||[])[0]||(catalog.bundles.topics||[])[0]||(catalog.bundles.ap_units||[])[0];
    return{group:row?.course_key?"course_units":row?.bank_code?"blackboard_banks":row?.topic?"topics":"ap_units",row};
  },
  courseLabel(catalog,key){return(catalog.courses||[]).find(c=>c.key===key)?.label||key||"Course";}
};
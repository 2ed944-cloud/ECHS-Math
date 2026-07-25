(async()=>{
  const $=id=>document.getElementById(id);
  const expected={PCALRT5S:4528,CAF5S:3101};
  const expectedTotal=expected.PCALRT5S+expected.CAF5S;
  try{
    const catalog=await ECHSBank.loadCatalog();
    const precalcRows=(catalog.bundles?.course_units||[]).filter(row=>row.course_key==='ap-precalculus');
    const unitSet=new Set(precalcRows.map(row=>String(row.unit)));
    const bankCodes=new Set();
    let total=0;
    for(const row of precalcRows){
      const questions=await ECHSBank.loadBundle(row);
      for(const question of questions){
        if(!question?.id)continue;
        total++;
        if(question.bank_code)bankCodes.add(question.bank_code);
      }
    }
    const addonBanks=(catalog.banks||[]).filter(bank=>Object.hasOwn(expected,bank.code));
    const publisherImported=addonBanks.reduce((sum,bank)=>sum+(Number(bank.question_count)||0),0);
    const complete=addonBanks.every(bank=>(Number(bank.question_count)||0)>=expected[bank.code])&&publisherImported>=expectedTotal;
    if($('precalcTotal'))$('precalcTotal').textContent=total.toLocaleString();
    if($('precalcBanks'))$('precalcBanks').textContent=bankCodes.size.toLocaleString();
    if($('precalcUnits'))$('precalcUnits').textContent=unitSet.size+'/4';
    if($('precalcStatus'))$('precalcStatus').textContent=complete?'Complete':'Incomplete';
    if($('precalcStatusCard')&&!complete)$('precalcStatusCard').classList.add('warning');
    window.ECHSPrecalculusAudit={complete,total,publisherImported,expectedTotal,bankCodes:[...bankCodes],units:[...unitSet]};
  }catch(error){
    if($('precalcStatus'))$('precalcStatus').textContent='Audit failed';
    if($('precalcStatusCard'))$('precalcStatusCard').classList.add('warning');
    console.error('AP Precalculus bank audit failed',error);
  }
})();

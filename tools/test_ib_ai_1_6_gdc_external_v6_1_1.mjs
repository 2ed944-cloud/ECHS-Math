import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const html=await readFile(new URL('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html',root),'utf8');
const js=await readFile(new URL('lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-gdc-external-tools.js',root),'utf8');
const css=await readFile(new URL('lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-technology-v6-gdc-external-tools.css',root),'utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(html.includes('lesson-1.6-technology-v6-gdc-external-tools.css?v=6.1.1'),'external-resource CSS link');
expect(html.includes('lesson-1.6-technology-v6-gdc-external-tools.js?v=6.1.1'),'external-resource JavaScript link');
expect(html.indexOf('lesson-1.6-technology-v6-gdc-lab.css')<html.indexOf('lesson-1.6-technology-v6-gdc-external-tools.css'),'external CSS follows GDC CSS');
expect(html.indexOf('lesson-1.6-technology-v6-gdc-lab.js')<html.indexOf('lesson-1.6-technology-v6-gdc-external-tools.js'),'external tool follows internal GDC');
expect(html.indexOf('lesson-1.6-technology-v6-gdc-external-tools.js')<html.indexOf('unit-1-v5-runtime.js'),'external tool loads before runtime');

const required=[
  'https://education.ti.com/en/software/search',
  'https://education.ti.com/en/products/online-calculators/ti-84ce-online-calc',
  'https://education.ti.com/html/webhelp/EG_TI84PlusCEOLC/EN/Content/Home_84CE_OLC.HTML',
  'https://ti84calc.com/ti84calc',
  'Third-party practice tool','not an official Texas Instruments product','Do not enter personal information',
  'data-src="${THIRD_PARTY_URL}"','src="about:blank"','loading="lazy"','sandbox="allow-scripts allow-same-origin',
  'referrerpolicy="strict-origin-when-cross-origin"','rel="noopener noreferrer"','target="_blank"',
  'Official TI Tools','Classroom Guidance','masteryPolicy','external iframe loads only after explicit learner action'
];
for(const marker of required)expect(js.includes(marker),`missing external-resource contract: ${marker}`);

expect(!js.includes(`src="https://ti84calc.com/ti84calc"`),'external iframe must not load eagerly');
expect((js.match(/data-external-tab=/g)||[]).length===3,'three external resource tabs');
expect((js.match(/data-external-pane=/g)||[]).length===3,'three external resource panes');
expect((js.match(/target="_blank"/g)||[]).length>=4,'external links open safely in new tabs');
expect((js.match(/rel="noopener noreferrer"/g)||[]).length>=4,'external links include noopener/noreferrer');

for(const marker of ['.gdc-external-dialog','.gdc-embed-stage','.gdc-third-party-notice','.gdc-official-grid','.gdc-guidance-grid','@media(max-width:720px)']){
  expect(css.includes(marker),`missing external-resource CSS: ${marker}`);
}
expect(!/\.katex[^\{]*\{[^}]*display\s*:/s.test(css),'external CSS must not alter KaTeX internals');

console.log('IB AI SL Lesson 1.6 connected calculator resources v6.1.1');
console.log(JSON.stringify({thirdPartyEmbed:'lazy',officialLinks:3,tabs:3,privacyNotice:true,newTabFallback:true},null,2));
console.log('Status: PASS');

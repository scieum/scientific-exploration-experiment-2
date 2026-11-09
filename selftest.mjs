// 판정·채점 로직 자체 점검: node selftest.mjs
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const code=html.match(/<script id="logic">([\s\S]*?)<\/script>/)[1];
const {evalWell,auditRun,scoreProcess,scoreRecord,scoreConclusion,caseFor,truthOf,SAMPLES}=
  new Function(code+';return{evalWell,auditRun,scoreProcess,scoreRecord,scoreConclusion,caseFor,truthOf,SAMPLES}')();

const T={neg:false,pos:true,p1:true,p2:false};
const seq=(rs,drops=2)=>rs.flatMap((r,t)=>Array.from({length:drops},()=>({r,t})));
const good=SAMPLES.map(s=>seq(['cap',s,'det','sub']));

// 교과서 절차: 양성 시료만 붉어진다
assert.deepEqual(good.map(w=>evalWell(w,T).level),[0,2,2,0]);
assert.deepEqual(auditRun(good),[]);

// 포획 항체를 빠뜨리면 위음성
assert.equal(evalWell(seq(['pos','det','sub']),T).level,0);
// 5분을 기다리지 않으면 결합하지 않는다
assert.equal(evalWell(['cap','pos','det','sub'].flatMap(r=>[{r,t:0},{r,t:0}]),T).level,0);
assert.ok(auditRun([['cap','neg','det','sub'].flatMap(r=>[{r,t:0},{r,t:0}]),good[1],good[2],good[3]]).length);
// 순서가 바뀌어도 결합하지 않는다
assert.equal(evalWell(seq(['cap','det','pos','sub']),T).level,0);
// 음성 홈에 양성 시료가 섞이면 위양성
assert.equal(evalWell(seq(['cap','neg','det','sub']).concat([{r:'pos',t:1},{r:'pos',t:1}]),T).level,2);
assert.ok(auditRun([seq(['cap','neg','det','sub']).concat([{r:'pos',t:1}]),good[1],good[2],good[3]]).includes('다른 홈의 시료를 넣음'));
// 양이 적으면 색이 연하다
assert.equal(evalWell(seq(['cap','pos','det','sub']).slice(1),T).level,1);
// 5분을 더 기다린 것은 오류가 아니다
assert.deepEqual(auditRun(SAMPLES.map(s=>[['cap',0],[s,2],['det',3],['sub',5]].flatMap(([r,t])=>[{r,t},{r,t}]))),[]);

// 채점표
assert.equal(scoreProcess(0),30);
assert.equal(scoreProcess(1),20);
assert.equal(scoreProcess(2),20);
assert.equal(scoreProcess(3),10);
for(const [rec,want] of [[[0,2,2,0],20],[[0,2,2,2],15],[[0,2,0,2],10],[[2,2,0,2],5],[[2,0,0,2],0]])
  assert.equal(scoreRecord(rec,[0,2,2,0]),want);
assert.equal(scoreRecord([null,null,null,null],[0,2,2,0]),0);
const lv=[0,2,2,0],J={p1:'감염',p2:'비감염'};
assert.equal(scoreConclusion(J,{p1:'pos',p2:'neg'},lv),20);
assert.equal(scoreConclusion(J,{p1:'none',p2:'neg'},lv),15);
assert.equal(scoreConclusion({p1:'비감염',p2:'비감염'},{p1:'pos',p2:'neg'},lv),10);

// 학번별 사례는 고정되고, 네 조합이 모두 나온다
assert.deepEqual(caseFor('30101'),caseFor(' 30101 '));
const combos=new Set(Array.from({length:40},(_,i)=>{const c=truthOf(caseFor(30101+i));return `${c.p1}${c.p2}`}));
assert.equal(combos.size,4);
console.log('ok');

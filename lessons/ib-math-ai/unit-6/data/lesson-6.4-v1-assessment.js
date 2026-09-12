(()=>{
window.LESSON_DATA.exam=[
{
 id:"6.4-E01",style:"IB mixed-response",total_marks:18,calculator:true,title:"Conference expansion plan",
 context:String.raw`A school conference begins with 200 participants. Attendance after \\(n\\) years is modelled by \\(A(n)=200(1.1)^n\\), while venue capacity is \\(C(n)=220+10n\\), for \\(n\ge0\\). A reserve fund receives QAR 6000 at the end of each year and earns 4% annually.`,
 parts:[
  {label:"a",prompt:String.raw`Calculate \\(A(2)\\) and \\(C(2)\\).`,marks:2,answer:String.raw`\\(A(2)=242\\), \\(C(2)=240\\).`,markscheme:["M1 substitutes n=2 into both models","A1 obtains both correct values"]},
  {label:"b",prompt:String.raw`Use a graphical or numerical method to solve \\(A(n)=C(n)\\), giving the positive solution to three decimal places.`,marks:3,answer:String.raw`\\(n=1.845\\)`,markscheme:["M1 sets or graphs 200(1.1)^n and 220+10n","M1 uses an intersection or valid numerical solver","A1 gives 1.845"]},
  {label:"c",prompt:String.raw`Determine the first whole year in which attendance exceeds capacity. Justify the discrete decision.`,marks:3,answer:"Year 2.",markscheme:["M1 identifies neighbouring whole years 1 and 2","A1 shows A(1)=220<C(1)=230 and A(2)=242>C(2)=240","R1 concludes year 2 in context"]},
  {label:"d",prompt:String.raw`Find the reserve-fund balance immediately after the fifth deposit. Give your answer to the nearest QAR.`,marks:4,answer:"QAR 32,498.",markscheme:["M1 constructs 6000(1+1.04+...+1.04^4) or equivalent recurrence","M1 uses the finite geometric-sum formula correctly","A1 obtains 32497.93536","A1 rounds to QAR 32,498"]},
  {label:"e",prompt:String.raw`An expansion at that time costs QAR 33,000. Find the funding shortfall.`,marks:2,answer:"Approximately QAR 502.06, or QAR 502 to the nearest QAR.",markscheme:["M1 calculates 33000-32497.93536","A1 obtains 502.06464 with appropriate rounding"]},
  {label:"f",prompt:String.raw`Evaluate the use of the two attendance/capacity models for long-term planning.`,marks:4,answer:"A balanced evaluation should discuss the usefulness of a simple growth comparison and limitations such as unstable growth rates, policy changes, capacity step-changes, and extrapolation.",markscheme:["R1 identifies one relevant strength","R1 explains one assumption of the exponential attendance model","R1 explains one limitation of linear capacity growth or long-run extrapolation","R1 reaches a contextual judgement"]}
 ]
},
{
 id:"6.4-E02",style:"IB mixed-response",total_marks:18,calculator:true,title:"Coastal response study",
 context:String.raw`Stations A and B are 12 km apart on an east–west line. A signal C is on bearing \\(035^\circ\\) from A and bearing \\(310^\circ\\) from B. Response time \\(T\\), in minutes, is modelled by \\(T\sim N(18,4^2)\\). Independently, a response day meets its target with probability 0.8.`,
 parts:[
  {label:"a",prompt:"Show that the interior angles at A and B are 55° and 40°, respectively, and find angle C.",marks:3,answer:"A=55°, B=40°, C=85°.",markscheme:["M1 converts the 035° bearing relative to east to 55°","M1 converts the 310° bearing relative to west to 40°","A1 uses the angle sum to obtain 85°"]},
  {label:"b",prompt:String.raw`Find \\(AC\\) and \\(BC\\), giving each distance to three significant figures.`,marks:4,answer:String.raw`\\(AC=7.74\\) km and \\(BC=9.87\\) km.`,markscheme:["M1 identifies AB=12 opposite 85°","M1 applies the sine rule for AC","M1 applies the sine rule for BC","A1 obtains both distances to 3 s.f."]},
  {label:"c",prompt:"Find the area of triangle ABC to three significant figures.",marks:2,answer:"38.1 km².",markscheme:["M1 uses 1/2 ab sin C with a valid pair of sides and included angle","A1 obtains 38.1 km²"]},
  {label:"d",prompt:String.raw`Calculate \\(P(14<T<22)\\).`,marks:3,answer:String.raw`\\(0.682689\ldots\\), approximately 0.683.`,markscheme:["M1 identifies the lower and upper bounds or z=-1 and z=1","M1 uses normalcdf or equivalent correctly","A1 gives 0.682689... or appropriate rounding"]},
  {label:"e",prompt:String.raw`For the next 10 response days, let \\(X\\) be the number meeting the target. Find \\(P(X\ge8)\\).`,marks:3,answer:String.raw`\\(0.6777995264\\), approximately 0.678.`,markscheme:["M1 defines X~B(10,0.8)","M1 evaluates 1-P(X<=7)","A1 gives the correct probability"]},
  {label:"f",prompt:"State three modelling assumptions or limitations relevant to the probability calculations.",marks:3,answer:"Examples: normal response times, stable mean/standard deviation, independent days, constant 0.8 success probability, and representative historical data.",markscheme:["R1 first relevant assumption or limitation","R1 second distinct assumption or limitation","R1 third distinct assumption or limitation"]}
 ]
},
{
 id:"6.4-E03",style:"IB mixed-response",total_marks:18,calculator:true,title:"Sustainable transport data",
 context:String.raw`Eight paired observations are recorded: \\(x=1,2,3,4,5,6,7,8\\) and \\(y=47,51,57,65,71,75,81,89\\). A linear model is considered.`,
 parts:[
  {label:"a",prompt:"Find the least-squares regression line of y on x.",marks:3,answer:String.raw`\\(\hat y=6x+40\\).`,markscheme:["M1 enters or processes paired data correctly","M1 carries out linear regression","A1 gives slope 6 and intercept 40"]},
  {label:"b",prompt:String.raw`State \\(r^2\\) and interpret it in context of the model fit.`,marks:3,answer:String.raw`\\(r^2=0.994736842\ldots\\); about 99.5% of the variation in y is explained by the linear model with x over these data.`,markscheme:["A1 states r² accurately","R1 refers to proportion of variation in y explained by the model","R1 restricts interpretation to the observed data/model and avoids causation"]},
  {label:"c",prompt:String.raw`Find and interpret the residual when \\(x=4\\).`,marks:2,answer:"Residual = 1; the observed value is one unit above the model prediction.",markscheme:["M1 calculates 65-(6(4)+40)=1","R1 interprets positive residual correctly"]},
  {label:"d",prompt:String.raw`Use the model to predict y when \\(x=6.5\\), and state whether this is interpolation or extrapolation.`,marks:2,answer:"79; interpolation.",markscheme:["A1 obtains 79","R1 identifies interpolation because 6.5 lies within 1 to 8"]},
  {label:"e",prompt:String.raw`Treating the model as a rate function, calculate \\(\int_2^7(6x+40)\,dx\\) and hence find its average value on \\([2,7]\\).`,marks:4,answer:"Accumulation = 335; average value = 67.",markscheme:["M1 writes or evaluates the definite integral","A1 obtains 335","M1 divides by interval length 5","A1 obtains average value 67"]},
  {label:"f",prompt:String.raw`The model predicts \\(\hat y=112\\) when \\(x=12\\). Evaluate this prediction.`,marks:4,answer:"The arithmetic is correct, but x=12 is outside the observed range 1 to 8. The prediction is extrapolation and depends on the linear relationship continuing; it should be used cautiously and supported by additional data.",markscheme:["R1 identifies extrapolation","R1 states the observed range","R1 explains why the linear pattern may not continue","R1 gives a defensible contextual judgement or recommends more data"]}
 ]
},
{
 id:"6.4-E04",style:"IB mixed-response",total_marks:18,calculator:true,title:"Solar microgrid reliability",
 context:String.raw`On a successful day, power output is modelled by \\(P(t)=100+24t-2t^2\\) kW for \\(0\le t\le8\\) hours. A day is successful with probability 0.8, independently from day to day.`,
 parts:[
  {label:"a",prompt:String.raw`Find \\(P'(t)\\) and interpret \\(P'(2)\\).`,marks:3,answer:String.raw`\\(P'(t)=24-4t\\); \\(P'(2)=16\\) kW h⁻¹, so power is increasing at 16 kW per hour.`,markscheme:["A1 obtains derivative 24-4t","A1 obtains 16","R1 interprets sign, rate and units"]},
  {label:"b",prompt:"Find the maximum power and the time at which it occurs.",marks:3,answer:"172 kW at t=6 h.",markscheme:["M1 solves P'(t)=0 or uses a valid maximum command","A1 obtains t=6 within the domain","A1 obtains P(6)=172 kW"]},
  {label:"c",prompt:String.raw`Find the first time at which \\(P(t)=150\\) kW.`,marks:3,answer:String.raw`\\(t=6-\sqrt{11}=2.683375\ldots\\) h.`,markscheme:["M1 forms and solves the quadratic equation","A1 obtains roots 6±sqrt(11)","R1 selects the first admissible root from the domain"]},
  {label:"d",prompt:"Find the total energy generated on a successful day.",marks:3,answer:String.raw`\\(\int_0^8P(t)dt=3680/3=1226.666\ldots\\) kWh.`,markscheme:["M1 sets up the definite integral with correct bounds","M1 evaluates it correctly","A1 gives 1226.666... kWh or appropriate rounding"]},
  {label:"e",prompt:String.raw`Find the probability that at least 8 of the next 10 days are successful.`,marks:3,answer:String.raw`\\(0.6777995264\\).`,markscheme:["M1 defines X~B(10,0.8)","M1 uses 1-P(X<=7)","A1 obtains 0.6777995264 or appropriate rounding"]},
  {label:"f",prompt:"Find the expected energy generated on successful days over the next 10 days.",marks:2,answer:String.raw`\\(8(3680/3)=29440/3=9813.333\ldots\\) kWh.`,markscheme:["M1 uses E(X)=10(0.8)=8 and multiplies by successful-day energy","A1 obtains 9813.333... kWh"]},
  {label:"g",prompt:"State one important limitation of this expected-energy model.",marks:1,answer:"For example, successful days may not be independent, success probability may change, or the power curve may vary from day to day.",markscheme:["R1 states one relevant limitation linked to an assumption"]}
 ]
}
];
const Q=(id,marks,calculator,command,prompt,choices,correct,answer,solution)=>({id,marks,calculator,command,prompt,choices,correct,answer,solution});
const N=(id,marks,calculator,command,prompt,value,tolerance,answer,solution)=>({id,marks,calculator,command,prompt,check:{mode:"number",value,tolerance},answer,solution});
window.LESSON_DATA.quiz=[
Q("6.4-Q01",2,false,"Identify",String.raw`Which step should occur before a TI-84 command in a mixed problem?`,["Round all data","Define the mathematical object and event","Delete the domain","Choose the largest window"],1,"Define the mathematical object and event.","Technology should execute a translated mathematical plan."),
N("6.4-Q02",2,false,"Calculate",String.raw`Find the 20th term of \\(18,21,24,\ldots\\).`,75,0,"75",String.raw`\\(18+19(3)=75\\).`),
N("6.4-Q03",2,true,"Calculate",String.raw`Find the fifth-deposit balance for QAR 6000 deposited annually at 4%, to the nearest QAR.`,32498,0,"32498",String.raw`\\(6000(1.04^5-1)/0.04=32497.93536\\).`),
Q("6.4-Q04",2,false,"State",String.raw`For \\(F(x)=-(x-5)^2+9\\), the maximum occurs at`,[String.raw`\\((2,0)\\)`,String.raw`\\((5,9)\\)`,String.raw`\\((8,0)\\)`,String.raw`\\((0,-16)\\)`],1,String.raw`\\((5,9)\\)`,`Vertex form gives the maximum directly.`),
N("6.4-Q05",2,true,"Calculate",String.raw`In the rescue triangle, calculate \\(12\sin40^\circ/\sin85^\circ\\) to 3 d.p.`,7.743,0.0005,"7.743",`This is AC by the sine rule.`),
Q("6.4-Q06",2,false,"Verify",String.raw`Which check is valid for triangle sides?`,["The longest side is opposite the smallest angle","All side lengths must be less than their opposite angles","The longest side is opposite the largest angle","Bearings always sum to 180°"],2,"The longest side is opposite the largest angle.","Side ordering and angle ordering agree."),
N("6.4-Q07",2,false,"Predict",String.raw`For \\(\hat y=6x+40\\), find \\(\hat y\\) when \\(x=6.5\\).`,79,0,"79",String.raw`\\(6(6.5)+40=79\\).`),
N("6.4-Q08",2,false,"Calculate",String.raw`Observed y is 75 and predicted y is 76. Find the residual.`, -1,0,"-1",`Residual is observed minus predicted.`),
N("6.4-Q09",2,true,"Calculate",String.raw`For \\(X\sim B(10,0.8)\\), find \\(P(X\ge8)\\) to 4 d.p.`,0.6778,0.00005,"0.6778",String.raw`\\(1-\operatorname{binomcdf}(10,0.8,7)=0.6777995\ldots\\).`),
N("6.4-Q10",2,true,"Calculate",String.raw`For \\(T\sim N(18,4^2)\\), find \\(P(14<T<22)\\) to 4 d.p.`,0.6827,0.00005,"0.6827",`The bounds are one standard deviation below and above the mean.`),
Q("6.4-Q11",2,false,"State",String.raw`If P is measured in kW and t in hours, \\(\int P(t)dt\\) is measured in`,["kW h⁻¹","kWh","kW²","hours per kW"],1,"kWh",`Power multiplied by time is energy.`),
N("6.4-Q12",2,false,"Calculate",String.raw`For \\(P(t)=100+24t-2t^2\\), find the time of maximum power.`,6,0,"6",String.raw`\\(P'(t)=24-4t=0\\) gives \\(t=6\\).`),
N("6.4-Q13",2,true,"Calculate",String.raw`Find \\(\int_0^8(100+24t-2t^2)dt\\) to the nearest whole number.`,1227,0,"1227",String.raw`The integral is \\(3680/3=1226.666\ldots\\).`),
Q("6.4-Q14",2,false,"Explain",String.raw`Why is a prediction at \\(x=12\\) from data observed only on \\([1,8]\\) less reliable?`,["It is interpolation","It is extrapolation beyond the observed range","The regression line cannot use integers","r² must equal zero"],1,"It is extrapolation beyond the observed range.","The fitted relationship may not continue outside the data interval."),
Q("6.4-Q15",2,false,"Evaluate",String.raw`Which conclusion is most defensible after a model calculation?`,["The calculator proves the assumptions","The output is exact because many digits are shown","The result is useful within stated assumptions and domain, but limitations should be considered","Units are optional when context is clear"],2,"The result is useful within stated assumptions and domain, but limitations should be considered.","A mathematical output inherits the assumptions and limits of its model.")
];
})();

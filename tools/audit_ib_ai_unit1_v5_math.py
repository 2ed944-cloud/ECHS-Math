#!/usr/bin/env python3
from __future__ import annotations
import json, math, sys
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
errors=[]
values={}

def near(name,actual,expected,tol=5e-7):
    values[name]=actual
    if not math.isfinite(actual) or abs(actual-expected)>tol:
        errors.append(f'{name}: expected {expected}, got {actual}')

def load_packs():
    p=ROOT/'lessons/ib-math-ai/unit-1/data/unit-1-v5-content-data.js'
    raw=p.read_text(encoding='utf-8')
    prefix='window.ECHS_UNIT1_V5_CONTENT='
    if not raw.startswith(prefix) or not raw.rstrip().endswith(';'):
        errors.append('Invalid Unit 1 v5 content wrapper')
        return {}
    try:return json.loads(raw[len(prefix):].rstrip()[:-1])
    except Exception as exc:
        errors.append(f'Cannot parse Unit 1 v5 content: {exc}')
        return {}

packs=load_packs()
serialized=json.dumps(packs,ensure_ascii=False)

def require(lesson,*markers):
    body=json.dumps(packs.get(lesson,{}),ensure_ascii=False)
    for marker in markers:
        if marker not in body:errors.append(f'{lesson}: missing displayed audited value {marker}')

def forbid(*markers):
    for marker in markers:
        if marker in serialized:errors.append(f'Stale incorrect value remains: {marker}')

# Arithmetic and geometric sequence checkpoints.
near('arithmetic_S27',27*(2*8+(27-1)*5)/2,1971,1e-12)
near('arithmetic_S28',28*(2*8+(28-1)*5)/2,2114,1e-12)
near('geometric_u8',500*(0.88**7),204.33779818496,1e-9)
near('geometric_u9',500*(0.88**8),179.817262402765,1e-9)

# Financial models.
compound=18000*(1.046**5)
near('compound_18000_5y',compound,22538.807158373568,1e-8)
near('compound_minus_simple',compound-22140,398.807158373568,1e-8)
near('quarterly_12000',12000*(1.0135**12),14095.0390170005,1e-8)
near('monthly_14000',14000*(1.006**24),16161.4220905893,1e-8)
near('depreciation_48000',48000*(0.83**4),22779.99408,1e-8)
near('balance_25000',25000*(1.042**6),31999.7306269106,1e-8)
near('depreciation_rate',1-(5/9)**(1/5),0.1109104638678,1e-12)

# Exponential equation.
near('log_threshold_time',math.log(3000/650)/math.log(1.14),11.6722543417153,1e-10)

# Bounds and percentage error.
near('bmi_min',65.45/(1.765**2),21.0097183991526,1e-10)
near('bmi_max',65.55/(1.755**2),21.2822947865683,1e-10)

# Annuities and loans.
near('annuity_400_120',400*((1.004**120)-1)/0.004,61452.7836041605,1e-7)
near('annuity_120_48',120*((1.003**48)-1)/0.003,6185.40712717337,1e-7)
def payment(P,annual,years,m=12):
    i=annual/m;n=years*m
    return P*i/(1-(1+i)**(-n))
near('loan_280000_payment',payment(280000,0.042,20),1726.39805917026,1e-7)
near('loan_85000_payment',payment(85000,0.052,6),1376.81882504116,1e-7)
pmt=payment(240000,0.039,25)
near('loan_240000_payment',pmt,1253.59433549647,1e-7)
i=0.039/12
balance=240000*(1+i)**12-pmt*((1+i)**12-1)/i
near('loan_240000_balance_after_12',balance,234214.17338472,1e-6)
near('loan_240000_total_interest',300*pmt-240000,136078.30064894,1e-6)

# Linear systems and parameter modelling.
det=3*(-1)-2*1
x=(19*(-1)-2*1)/det
y=(3*1-19*1)/det
near('system_x',x,4.2,1e-12);near('system_y',y,3.2,1e-12)
near('quadratic_P',2,2,0);near('quadratic_Q',3,3,0);near('quadratic_R',4,4,0)

require('1.2','S_{27}=1971','S_{28}=2114')
require('1.4','22538.81','398.81','14095.04','16161.42','22779.99','31999.73','11.09')
require('1.5','11.672')
require('1.6','21.010','21.282')
require('1.7','61452.78','6185.41','1726.40','1376.82','1253.59','234214.17','136078.30')
require('1.8','x=4.2','y=3.2','P=2,Q=3,R=4')
forbid('22535.41','395.41','14094.36','16157.05','22741.99','32002.52','11.15\\%','11.665','21.011','21.285','58843.95','6183.44','1726.48','1377.18','1253.60','236 577')

report={'release':'5.3.0','status':'PASS' if not errors else 'FAIL','checks':len(values),'values':values,'errors':errors}
out=ROOT/'lessons/ib-math-ai/unit-1/reports/math-audit-v5-3-0.json'
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)

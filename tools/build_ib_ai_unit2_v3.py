#!/usr/bin/env python3
"""Build the canonical 19-lesson ECHS IB Mathematics AI SL Unit 2 v3 release."""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT = ROOT / "lessons/ib-math-ai/unit-2"
DATA = UNIT / "data"
LESSONS = UNIT / "lessons"

TOPICS = [
    dict(n="2.1", slug="lines_coordinate_geometry", title="Lines and Coordinate Geometry", status="Core SL", visual="line",
         subtitle="Use gradient, distance, midpoint and line equations to describe position and change.",
         inquiry="How can a straight-line model connect a map, a rate and a defensible prediction?",
         objectives=["Calculate gradient, distance and midpoint from coordinates.","Construct and interpret equations of lines.","Use parallel and perpendicular gradient conditions.","Interpret intercepts and rates in context."],
         vocab=["gradient","slope","midpoint","distance","intercept","parallel","perpendicular","point-gradient form"],
         concepts=[("Coordinate change",r"m=\frac{y_2-y_1}{x_2-x_1}","Gradient records signed vertical change per horizontal unit."),("Distance and midpoint",r"d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}","Distance is non-negative; the midpoint averages corresponding coordinates."),("Equation of a line",r"y-y_1=m(x-x_1)","A point and a gradient determine a unique non-vertical line."),("Parallel and perpendicular lines",r"m_1=m_2,\quad m_1m_2=-1", "Gradient conditions encode direction."),("Linear interpretation",r"y=mx+c", "The gradient is a rate; the intercept is the value at input zero.")]),
    dict(n="2.2", slug="quadratic_functions", title="Quadratic Functions", status="Core SL", visual="quadratic",
         subtitle="Connect algebraic forms, roots, symmetry and vertices of parabolas.", inquiry="Which quadratic form reveals the feature needed for a modelling decision?",
         objectives=["Move among standard, factored and vertex forms.","Determine roots, intercepts, axis and vertex.","Interpret the discriminant and number of real roots.","Use technology to solve and validate quadratic problems."],
         vocab=["quadratic","parabola","vertex","axis of symmetry","roots","discriminant","factored form","vertex form"],
         concepts=[("Three useful forms",r"ax^2+bx+c=a(x-r_1)(x-r_2)=a(x-h)^2+k","Each form foregrounds different information."),("Axis and vertex",r"x=-\frac{b}{2a}","The axis passes through the turning point."),("Roots",r"x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}","Roots are x-intercepts when they are real."),("Discriminant",r"\Delta=b^2-4ac","Its sign determines the number of distinct real roots."),("Context and restriction",r"f(x)=a(x-h)^2+k","A mathematical domain must still be restricted by the situation.")]),
    dict(n="2.3", slug="functions_domain_range_graphs", title="Functions, Domain, Range and Graphs", status="Core SL", visual="function",
         subtitle="Coordinate mappings, notation, valid inputs, outputs and graphical behaviour.", inquiry="What evidence proves that a relation is a function, and which inputs are meaningful?",
         objectives=["Use function notation and evaluate images and preimages.","Distinguish functions from general relations.","State domain and range from formulas, graphs and contexts.","Interpret piecewise rules and endpoints accurately."],
         vocab=["relation","function","domain","range","image","preimage","vertical-line test","piecewise function"],
         concepts=[("Function rule",r"x\mapsto f(x)","Each permitted input has exactly one output."),("Domain",r"\mathrm{Dom}(f)=\{x:f(x)\text{ is defined}\}","Formula and context can impose different restrictions."),("Range",r"\mathrm{Ran}(f)=\{f(x):x\in\mathrm{Dom}(f)\}","The range is the set of achieved outputs."),("Graphical test",r"x=c","A vertical line may meet a function graph at most once."),("Piecewise models",r"f(x)=\begin{cases}f_1(x)&x\in D_1\\f_2(x)&x\in D_2\end{cases}","Endpoint symbols decide which rule owns a boundary.")]),
    dict(n="2.4", slug="informal_inverse_graphical_solutions", title="Informal Inverse Functions and Graphical Solutions", status="Core SL", visual="inverse",
         subtitle="Reverse input-output processes and solve equations through intersections.", inquiry="When can a process be reversed uniquely, and what does the inverse output mean?",
         objectives=["Interpret inverse notation as reversal, not reciprocal.","Read inverse values from tables and graphs.","Solve equations by graphical intersection.","Recognize when a domain restriction is required."],
         vocab=["inverse","one-to-one","reflection","line y=x","intersection","graphical solution","restricted domain","reverse process"],
         concepts=[("Reversing a mapping",r"f(a)=b\iff f^{-1}(b)=a","Inputs and outputs exchange roles."),("Reflection",r"y=f^{-1}(x)","Inverse graphs reflect in the line y=x."),("One-to-one condition",r"f(x_1)=f(x_2)\Rightarrow x_1=x_2","A unique inverse needs unique preimages."),("Graphical equations",r"f(x)=g(x)","Solutions are x-coordinates of intersections."),("Context",r"t=h^{-1}(d)","The inverse returns the input associated with a measured output.")]),
    dict(n="2.5", slug="exponential_functions", title="Exponential Functions", status="Core SL", visual="exponential",
         subtitle="Model repeated multiplicative change and interpret growth or decay factors.", inquiry="How does a constant percentage change differ from a constant additive change?",
         objectives=["Evaluate and graph exponential functions.","Interpret initial value and growth or decay factor.","Convert between percentage rate and multiplier.","Identify asymptotic behaviour and contextual domains."],
         vocab=["exponential","initial value","growth factor","decay factor","percentage rate","asymptote","doubling","half-life"],
         concepts=[("Exponential structure",r"f(x)=ab^x","Equal input steps multiply outputs by a constant factor."),("Growth and decay",r"b=1\pm r","Growth has b>1; decay has 0<b<1."),("Initial value",r"f(0)=a","The coefficient a is the output at input zero."),("Horizontal asymptote",r"y=0","Unshifted positive exponential graphs approach but do not cross zero."),("Discrete versus continuous",r"A_n=A_0b^n","Interpret non-integer time only when continuous change is defensible.")]),
    dict(n="2.6", slug="logarithms_exponential_equations", title="Logarithms and Exponential Equations", status="Core SL", visual="log",
         subtitle="Use logarithms to express exponents and solve multiplicative threshold problems.", inquiry="How can an unknown exponent be isolated and interpreted in context?",
         objectives=["Translate between exponential and logarithmic statements.","Evaluate common and natural logarithms.","Solve exponential equations using graphs or logarithms.","Check domain, units and rounding in threshold problems."],
         vocab=["logarithm","base","exponent","common logarithm","natural logarithm","inverse","threshold","logarithmic scale"],
         concepts=[("Definition",r"a^x=b\iff\log_a b=x","A logarithm answers an exponent question."),("Common and natural logs",r"\log x=\log_{10}x,\quad\ln x=\log_e x","Calculator keys use bases 10 and e."),("Unknown exponent",r"ab^t=N\Rightarrow t=\frac{\ln(N/a)}{\ln b}","Logarithms isolate a variable in an exponent."),("Domain",r"\log_a x\text{ requires }x>0","A logarithm cannot accept zero or a negative real input."),("Threshold interpretation",r"t\ge\frac{\ln(N/a)}{\ln b}","Discrete contexts may require rounding upward.")]),
    dict(n="2.7", slug="composition_functions", title="Composition of Functions", status="Extension · HL bridge", visual="composition",
         subtitle="Represent multi-stage processes with ordered function composition.", inquiry="Why does changing the order of two processes usually change the result?",
         objectives=["Evaluate composite functions numerically and algebraically.","Respect the order in function composition.","Determine domain restrictions of composites.","Interpret multi-stage models in context."],
         vocab=["composition","inner function","outer function","domain restriction","multi-stage process","fog","gof","mapping"],
         concepts=[("Definition",r"(f\circ g)(x)=f(g(x))","Apply the inner function first."),("Order",r"f\circ g\ne g\circ f","Composition is generally not commutative."),("Domain",r"x\in\mathrm{Dom}(g),\ g(x)\in\mathrm{Dom}(f)","Both stages must be valid."),("Algebra",r"f(g(x))","Use brackets before simplifying."),("Context",r"\text{final}=f(\text{intermediate})","Units from one stage must match the next input.")]),
    dict(n="2.8", slug="inverse_functions_algebraic", title="Inverse Functions Algebraically", status="Extension · HL bridge", visual="inverse-algebra",
         subtitle="Find, verify and restrict inverse functions using algebra.", inquiry="Which algebraic and graphical checks establish a valid inverse?",
         objectives=["Find inverses by exchanging variables and solving.","State inverse domains and ranges.","Restrict non-one-to-one functions when appropriate.","Verify inverse relationships by composition."],
         vocab=["inverse function","domain restriction","range","one-to-one","horizontal-line test","composition identity","principal branch","verification"],
         concepts=[("Algebraic method",r"y=f(x)\to x=f(y)\to y=f^{-1}(x)","Swap variables, then solve for the new output."),("Domain and range",r"\mathrm{Dom}(f^{-1})=\mathrm{Ran}(f)","Inverse domain and range exchange."),("Verification",r"f(f^{-1}(x))=x","Composition should return the input on the stated domain."),("Quadratic restriction",r"f(x)=(x-h)^2+k,\ x\ge h","Choose one monotonic branch before inversion."),("Graph",r"(a,b)\leftrightarrow(b,a)","Every point swaps coordinates.")]),
    dict(n="2.9", slug="transformations_functions", title="Transformations of Functions", status="Extension · HL bridge", visual="transform",
         subtitle="Predict translations, reflections and stretches from transformed equations.", inquiry="How can one transformed point reveal whether an equation was interpreted correctly?",
         objectives=["Identify horizontal and vertical transformations.","Map points under combined transformations.","Apply transformations in the correct order.","Explain effects on domain, range and key features."],
         vocab=["translation","reflection","stretch","compression","horizontal scale","vertical scale","invariant point","transformed graph"],
         concepts=[("General form",r"g(x)=af(b(x-h))+k","Inside changes act horizontally; outside changes act vertically."),("Translations",r"f(x-h)+k","The graph moves h right and k up."),("Reflections",r"-f(x),\ f(-x)","Outside reflects in the x-axis; inside reflects in the y-axis."),("Scaling",r"af(bx)","Vertical scale is a; horizontal scale factor is 1/|b|."),("Point mapping",r"(x,y)\mapsto(\frac{x}{b}+h,ay+k)","Mapping a known point prevents sign errors.")]),
    dict(n="2.10", slug="asymptotes_rational_behaviour", title="Asymptotes and Rational Behaviour", status="Extension · HL bridge", visual="rational",
         subtitle="Use excluded inputs and end behaviour to interpret rational models.", inquiry="What does a graph approach, and when does algebra reveal a hole instead of an asymptote?",
         objectives=["Identify vertical and horizontal asymptotes.","Distinguish asymptotes from removable discontinuities.","Analyze rational end behaviour.","Interpret excluded values and limitations contextually."],
         vocab=["asymptote","vertical asymptote","horizontal asymptote","rational function","excluded value","hole","end behaviour","limit behaviour"],
         concepts=[("Vertical asymptote",r"q(a)=0,\ p(a)\ne0\Rightarrow x=a","An uncancelled denominator zero creates unbounded behaviour."),("Removable hole",r"\frac{(x-a)r(x)}{(x-a)s(x)}","A cancelled factor leaves an excluded point."),("Horizontal asymptote",r"\deg p=\deg q\Rightarrow y=\frac{\text{leading }p}{\text{leading }q}","Leading terms control far-field behaviour."),("Domain",r"q(x)\ne0","All denominator zeros are excluded, even if factors cancel."),("Interpretation",r"f(x)=L+\frac{k}{x-a}","The model approaches L for large |x| and is undefined at a.")]),
    dict(n="2.11", slug="logarithms_any_base", title="Logarithms in Any Base", status="Extension · HL bridge", visual="log-base",
         subtitle="Apply logarithm laws and change of base with valid arguments.", inquiry="How do logarithm laws convert multiplicative structure into additive structure?",
         objectives=["Evaluate logarithms in arbitrary valid bases.","Apply product, quotient and power laws.","Use the change-of-base formula.","Solve logarithmic equations with domain checks."],
         vocab=["base","argument","change of base","product law","quotient law","power law","domain","extraneous solution"],
         concepts=[("Valid base and argument",r"a>0,\ a\ne1,\ x>0","Both base and argument conditions matter."),("Product law",r"\log_a(xy)=\log_a x+\log_a y","Multiplication becomes addition."),("Quotient law",r"\log_a(x/y)=\log_a x-\log_a y","Division becomes subtraction."),("Power law",r"\log_a(x^k)=k\log_a x","An exponent becomes a coefficient."),("Change of base",r"\log_a x=\frac{\ln x}{\ln a}","Any valid base can be evaluated with calculator logarithms.")]),
    dict(n="2.12", slug="exponential_equations_thresholds", title="Exponential Equations and Thresholds", status="Extension · HL bridge", visual="threshold",
         subtitle="Solve exact and approximate exponential equations and interpret first-passage times.", inquiry="When should a real-valued solution be rounded, and in which direction?",
         objectives=["Solve equations with a common exponential base.","Use logarithms for unlike bases.","Solve exponential inequalities and thresholds.","Validate solutions graphically and contextually."],
         vocab=["exponential equation","common base","logarithmic solution","threshold","first-passage time","inequality","rounding","validation"],
         concepts=[("Common base",r"a^{u}=a^{v}\Rightarrow u=v","Equal positive bases allow exponent comparison."),("Logarithmic method",r"b^x=c\Rightarrow x=\frac{\ln c}{\ln b}","Use logarithms when bases do not match."),("Shifted model",r"ab^t+k=N","Isolate the exponential term before taking logs."),("Inequality direction",r"0<b<1","A decreasing exponential reverses intuitive threshold direction."),("Discrete threshold",r"n=\lceil t\rceil","The first complete period meeting a target is rounded up.")]),
    dict(n="2.13", slug="linear_models_regression", title="Linear Models and Regression", status="Core SL", visual="regression",
         subtitle="Fit, interpret and evaluate linear models using residual evidence.", inquiry="When does a strong numerical fit still fail as a defensible model?",
         objectives=["Construct exact and regression linear models.","Interpret slope and intercept in context.","Calculate and interpret residuals.","Distinguish interpolation from extrapolation."],
         vocab=["linear model","regression","least squares","slope","intercept","residual","interpolation","extrapolation"],
         concepts=[("Exact line",r"y-y_1=m(x-x_1)","Two exact points determine a line."),("Regression line",r"\hat y=ax+b","Least squares minimizes the sum of squared vertical residuals."),("Residual",r"e=y-\hat y","Positive residuals lie above the fitted line."),("Parameter meaning",r"a=\frac{\Delta y}{\Delta x}","Slope must be stated with units and context."),("Model validity",r"\text{data}\to\text{fit}\to\text{residuals}\to\text{decision}","A coefficient alone does not validate a model.")]),
    dict(n="2.14", slug="quadratic_cubic_models", title="Quadratic and Cubic Models", status="Core SL", visual="polynomial",
         subtitle="Select and interpret polynomial models from shape, differences and residuals.", inquiry="Which features distinguish a quadratic trend from a cubic trend?",
         objectives=["Recognize quadratic and cubic behaviour.","Fit polynomial models with technology.","Interpret roots and turning points contextually.","Evaluate model domain and extrapolation risk."],
         vocab=["polynomial","degree","quadratic model","cubic model","turning point","root","finite difference","regression"],
         concepts=[("Degree and shape",r"P(x)=a_nx^n+\cdots+a_0","Degree constrains end behaviour and turning points."),("Quadratic differences",r"\Delta^2y=\text{constant}","Equal input steps give constant second differences."),("Cubic behaviour",r"\Delta^3y=\text{constant}","A cubic can show two turning points and an inflection pattern."),("Roots and turning points",r"P(x)=0,\quad P'(x)=0","Technology locates model features that need contextual interpretation."),("Validation",r"e=y-\hat y","Compare residual structure and simplicity, not only visual appeal.")]),
    dict(n="2.15", slug="power_direct_inverse_variation", title="Power Functions, Direct and Inverse Variation", status="Core SL", visual="power",
         subtitle="Use proportional structure and power exponents to model scaling.", inquiry="How can a scaling experiment reveal the exponent in a power law?",
         objectives=["Recognize direct and inverse variation.","Determine constants of proportionality.","Interpret power-law exponents.","Use units and domain restrictions to assess models."],
         vocab=["power function","direct variation","inverse variation","constant of proportionality","exponent","scaling","proportional","inverse-square"],
         concepts=[("Power model",r"y=ax^n","The exponent controls how output responds to scaling input."),("Direct variation",r"y=kx","The ratio y/x is constant."),("Inverse variation",r"y=\frac{k}{x}","The product xy is constant."),("General variation",r"y=kx^n","One observation can determine k when n is known."),("Scaling",r"x\to cx\Rightarrow y\to c^ny","Scaling factors reveal the exponent.")]),
    dict(n="2.16", slug="exponential_models_growth_decay", title="Exponential Models, Growth, Decay and Half-Life", status="Core SL", visual="decay",
         subtitle="Build and evaluate repeated-change models with characteristic times.", inquiry="Which assumptions make a growth or half-life model trustworthy?",
         objectives=["Construct exponential models from rates or data.","Interpret growth and decay parameters.","Calculate doubling time and half-life.","Evaluate interpolation, extrapolation and asymptotes."],
         vocab=["exponential model","growth rate","decay rate","doubling time","half-life","multiplier","continuous time","asymptote"],
         concepts=[("Repeated change",r"A(t)=A_0b^t","Equal time intervals use the same multiplier."),("Percentage model",r"b=1\pm r","Convert the rate to a decimal before forming b."),("Characteristic time",r"T_d=\frac{\ln2}{\ln b}","Doubling time is constant for an ideal exponential model."),("Half-life",r"T_{1/2}=\frac{\ln(1/2)}{\ln b}","Every half-life multiplies the amount by one half."),("Shifted asymptote",r"A(t)=L+ab^t","The limiting value L changes the interpretation.")]),
    dict(n="2.17", slug="sinusoidal_models", title="Sinusoidal Models", status="Core SL", visual="sinusoidal",
         subtitle="Model periodic behaviour through amplitude, period, phase and midline.", inquiry="How do maximum and minimum observations determine a periodic model?",
         objectives=["Identify amplitude, midline and period.","Construct sine and cosine models.","Interpret phase shifts in context.","Use technology to solve periodic threshold problems."],
         vocab=["sinusoidal","amplitude","period","midline","phase shift","maximum","minimum","angular frequency"],
         concepts=[("General model",r"y=a\sin(b(x-c))+d","Parameters control amplitude, period, phase and midline."),("Amplitude and midline",r"|a|=\frac{M-m}{2},\ d=\frac{M+m}{2}","Maximum and minimum determine vertical features."),("Period",r"T=\frac{2\pi}{|b|}","The graph repeats after one period."),("Cosine start",r"y=a\cos(b(x-c))+d","Cosine is convenient when a cycle begins at an extremum."),("Thresholds",r"a\sin(b(x-c))+d=k","Report all solutions within the contextual interval.")]),
    dict(n="2.18", slug="voronoi_diagrams", title="Voronoi Diagrams", status="Core SL", visual="voronoi",
         subtitle="Partition a region by nearest-site distance using perpendicular bisectors.", inquiry="How can a nearest-service region be justified geometrically rather than estimated by eye?",
         objectives=["Construct perpendicular bisectors between sites.","Interpret Voronoi cells, edges and vertices.","Determine nearest sites and boundary points.","Evaluate Euclidean-distance assumptions in context."],
         vocab=["Voronoi diagram","site","cell","edge","vertex","perpendicular bisector","nearest neighbour","equidistant"],
         concepts=[("Nearest-site rule",r"V_i=\{P:d(P,S_i)\le d(P,S_j)\}","Each cell contains points closest to one site."),("Two-site boundary",r"d(P,A)=d(P,B)","The boundary is the perpendicular bisector of AB."),("Edges and vertices",r"d(P,A)=d(P,B)=d(P,C)","A vertex is typically equidistant from three sites."),("Construction",r"\text{bisect}\to\text{clip}\to\text{test}","Only boundary segments satisfying all nearest-site inequalities remain."),("Limitations",r"d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}","Road networks, barriers and travel time may violate Euclidean distance.")]),
    dict(n="2.19", slug="percentage_financial_applications", title="Percentage Change and Financial Applications", status="Core SL", visual="finance",
         subtitle="Model compound growth, depreciation, inflation, annuities and loans.", inquiry="How do timing, compounding frequency and fees change a financial conclusion?",
         objectives=["Calculate successive percentage change.","Use compound interest and depreciation models.","Interpret annuity and loan calculations with technology.","Distinguish nominal, real and effective values."],
         vocab=["percentage change","compound interest","depreciation","inflation","annuity","loan","effective rate","present value"],
         concepts=[("Percentage multiplier",r"\text{new}=\text{old}(1\pm r)","Successive changes multiply; they do not simply cancel."),("Compound interest",r"A=P(1+\frac rn)^{nt}","Compounding frequency changes the periodic rate and count."),("Depreciation",r"V=P(1-r)^t","Reducing-balance depreciation is exponential."),("Regular payments",r"FV=R\frac{(1+i)^N-1}{i}","Payment timing must match the annuity formula or finance solver."),("Real value",r"\text{real growth factor}=\frac{1+r}{1+i}","Inflation changes purchasing power, not only the nominal balance.")]),
]


def svg_visual(topic: dict, index: int = 0) -> str:
    n = int(topic["n"].split(".")[1])
    colour = ["#7a1733", "#177e89", "#d4a72c", "#17324d"][n % 4]
    label = topic["title"].replace("&", "and")
    if topic["visual"] == "sinusoidal":
        art = '<path d="M35 135 C75 45 115 45 155 135 S235 225 275 135 S355 45 395 135 S475 225 515 135" fill="none" stroke="#7a1733" stroke-width="6"/>'
    elif topic["visual"] == "voronoi":
        art = '<path d="M190 20 L205 108 L145 270 M205 108 L350 90 L420 20 M205 108 L315 220 L350 270 M350 90 L315 220 L520 205" fill="none" stroke="#17324d" stroke-width="4"/><g fill="#7a1733"><circle cx="95" cy="85" r="8"/><circle cx="275" cy="55" r="8"/><circle cx="445" cy="120" r="8"/><circle cx="210" cy="220" r="8"/></g>'
    elif topic["visual"] == "finance":
        art = ''.join(f'<rect x="{65+i*62}" y="{220-(i+2)**1.45*8}" width="38" height="{(i+2)**1.45*8}" rx="5" fill="{colour}" opacity="{0.5+i/12}"/>' for i in range(7))
    elif topic["visual"] in {"quadratic", "polynomial"}:
        art = '<path d="M45 220 Q145 25 265 175 T515 65" fill="none" stroke="#7a1733" stroke-width="6"/>' if topic["visual"] == "polynomial" else '<path d="M50 55 Q280 395 510 55" fill="none" stroke="#7a1733" stroke-width="6"/>'
    elif topic["visual"] in {"exponential", "decay", "threshold"}:
        art = '<path d="M45 220 C190 215 340 180 510 45" fill="none" stroke="#7a1733" stroke-width="6"/><line x1="35" y1="225" x2="525" y2="225" stroke="#d4a72c" stroke-width="3" stroke-dasharray="8 7"/>'
    elif topic["visual"] in {"log", "log-base"}:
        art = '<path d="M95 245 C105 120 185 80 510 50" fill="none" stroke="#177e89" stroke-width="6"/><line x1="88" y1="20" x2="88" y2="255" stroke="#d4a72c" stroke-width="3" stroke-dasharray="8 7"/>'
    elif topic["visual"] in {"inverse", "inverse-algebra"}:
        art = '<line x1="45" y1="230" x2="510" y2="25" stroke="#d4a72c" stroke-width="3" stroke-dasharray="9 7"/><path d="M55 215 C145 200 190 155 260 95 S390 45 505 35" fill="none" stroke="#7a1733" stroke-width="6"/><path d="M70 235 C90 135 145 85 250 55 S420 38 505 30" fill="none" stroke="#177e89" stroke-width="5"/>'
    elif topic["visual"] == "rational":
        art = '<line x1="280" y1="20" x2="280" y2="255" stroke="#d4a72c" stroke-width="3" stroke-dasharray="8 7"/><path d="M45 205 C150 200 220 175 268 35 M292 245 C330 95 420 70 520 66" fill="none" stroke="#7a1733" stroke-width="6"/>'
    elif topic["visual"] == "regression":
        art = '<path d="M50 225 L510 45" stroke="#7a1733" stroke-width="5"/>' + ''.join(f'<circle cx="{70+i*70}" cy="{215-i*25+(-1)**i*18}" r="7" fill="#177e89"/>' for i in range(7))
    elif topic["visual"] == "transform":
        art = '<path d="M45 220 Q145 20 245 220" fill="none" stroke="#7a1733" stroke-width="5"/><path d="M245 220 Q365 70 505 220" fill="none" stroke="#177e89" stroke-width="5"/>'
    elif topic["visual"] == "power":
        art = '<path d="M55 230 C110 225 190 190 275 125 S425 45 510 25" fill="none" stroke="#7a1733" stroke-width="6"/><path d="M95 25 C110 125 155 190 510 225" fill="none" stroke="#177e89" stroke-width="5"/>'
    elif topic["visual"] == "composition":
        art = '<g fill="none" stroke-width="5"><circle cx="115" cy="135" r="58" stroke="#7a1733"/><circle cx="280" cy="135" r="58" stroke="#177e89"/><circle cx="445" cy="135" r="58" stroke="#d4a72c"/><path d="M175 135 H215 M340 135 H380" stroke="#17324d"/></g><text x="115" y="144" text-anchor="middle">input</text><text x="280" y="144" text-anchor="middle">g</text><text x="445" y="144" text-anchor="middle">f</text>'
    else:
        art = f'<path d="M45 225 L510 {55+n%5*18}" fill="none" stroke="{colour}" stroke-width="6"/><circle cx="185" cy="{170-n%3*22}" r="8" fill="#177e89"/><circle cx="395" cy="{95+n%4*12}" r="8" fill="#d4a72c"/>'
    return f'''<svg class="concept-visual" viewBox="0 0 560 280" role="img" aria-label="{label} concept visual"><rect width="560" height="280" rx="24" fill="#f4efe8"/><g stroke="#ded8cf">{''.join(f'<line x1="{40+i*40}" y1="20" x2="{40+i*40}" y2="250"/>' for i in range(13))}{''.join(f'<line x1="30" y1="{30+i*32}" x2="530" y2="{30+i*32}"/>' for i in range(8))}</g>{art}<text x="280" y="268" text-anchor="middle" fill="#5d6a75">{label}</text></svg>'''


def problem(topic: dict, i: int, quiz: bool = False) -> dict:
    n = int(topic["n"].split(".")[1]); k = i + (41 if quiz else 1); mode = i % 4
    a = 2 + k % 5; b = 1 + (k * 2) % 7; c = 3 + (k * 3) % 9; x = 1 + k % 6
    key = topic["n"]
    prompt=""; target=0.0; solution=""
    if key == "2.1":
        if mode==0: target=a; prompt=f"A line passes through ({x},{b}) and ({x+3},{b+3*a}). Find its gradient."; solution=f"m=({b+3*a}-{b})/3={a}."
        elif mode==1: target=x+2; prompt=f"Find the x-coordinate of the midpoint joining ({x},{b}) and ({x+4},{c})."; solution=f"Average the x-coordinates: ({x}+{x+4})/2={x+2}."
        elif mode==2: target=5; prompt=f"Find the distance between ({x},{b}) and ({x+3},{b+4})."; solution="The displacement is (3,4), so the distance is √(3²+4²)=5."
        else: target=a*x+b; prompt=f"For y={a}x+{b}, calculate y when x={x}."; solution=f"y={a}({x})+{b}={target}."
    elif key == "2.2":
        if mode==0: target=a*(x-b)**2+c; prompt=f"For f(x)={a}(x-{b})²+{c}, calculate f({x})."; solution=f"Substitution gives {target}."
        elif mode==1: target=b; prompt=f"State the x-coordinate of the vertex of y={a}(x-{b})²+{c}."; solution=f"Vertex form gives x={b}."
        elif mode==2: target=(a+b)**2; prompt=f"Calculate the discriminant of x²-{a+b}x+{a*b}=0."; solution=f"Δ=({-(a+b)})²-4({a*b})={(a-b)**2}."; target=(a-b)**2
        else: target=max(a,b); prompt=f"The roots of (x-{a})(x-{b})=0 are required. Give the larger root."; solution=f"The roots are {a} and {b}; larger={target}."
    elif key == "2.3":
        if mode==0: target=a*x+b; prompt=f"If f(x)={a}x+{b}, find f({x})."; solution=f"f({x})={a}({x})+{b}={target}."
        elif mode==1: target=c; prompt=f"The function f(x)=√({c}-x) has domain x≤d. Find d."; solution=f"Require {c}-x≥0, so x≤{c}."
        elif mode==2: target=b; prompt=f"For f(x)=(x-{a})²+{b}, find the minimum value of f."; solution=f"The squared term is at least 0, so the minimum is {b}."
        else: target=a+b; prompt=f"A piecewise rule uses f(x)=x+{b} for x≤{a}. Find f({a})."; solution=f"The endpoint belongs to this branch: {a}+{b}={target}."
    elif key == "2.4":
        if mode==0: target=(c-b)/a; prompt=f"For f(x)={a}x+{b}, find f⁻¹({c})."; solution=f"Solve {a}x+{b}={c}; x={target:g}."
        elif mode==1: target=(c-b)/(a-1); prompt=f"Find the x-coordinate where y={a}x+{b} meets y=x+{c}."; solution=f"({a}-1)x={c-b}, so x={target:g}."
        elif mode==2: target=c-x; prompt=f"The function f(x)={c}-x is self-inverse. Find f⁻¹({x})."; solution=f"f⁻¹({x})={c}-{x}={target}."
        else: target=x; prompt=f"A table contains the pair ({x},{c}). What is f⁻¹({c})?"; solution=f"Inverse mappings swap coordinates, so the value is {x}."
    elif key == "2.5":
        if mode==0: target=a*(2**x); prompt=f"For f(t)={a}·2^t, calculate f({x})."; solution=f"{a}·2^{x}={target}."
        elif mode==1: target=b; prompt=f"A quantity grows by {b}% each year. Enter the percentage growth rate."; solution=f"The requested rate is {b}%."
        elif mode==2: target=a*4; prompt=f"A population starts at {a} and doubles each period. Find it after 2 periods."; solution=f"{a}·2²={target}."
        else: target=0; prompt=f"State the horizontal asymptote y=L of f(x)={a}({b/10:.1f})^x."; solution="An unshifted exponential has horizontal asymptote y=0."
    elif key in {"2.6","2.11"}:
        base=2+(k%3); p=2+(k%4); value=base**p
        if mode==0: target=p; prompt=f"Evaluate log base {base} of {value}."; solution=f"Because {base}^{p}={value}, the logarithm is {p}."
        elif mode==1: target=value; prompt=f"If log base {base} of x equals {p}, find x."; solution=f"x={base}^{p}={value}."
        elif mode==2: target=p; prompt=f"Solve {base}^x={value}."; solution=f"Matching powers gives x={p}."
        else: target=1; prompt=f"Evaluate log base {base} of {base}."; solution="Every valid base to the first power equals itself."
    elif key == "2.7":
        if mode==0: target=a*(x+b)+c; prompt=f"Let g(x)=x+{b} and f(x)={a}x+{c}. Find (f∘g)({x})."; solution=f"g({x})={x+b}; f({x+b})={target}."
        elif mode==1: target=a*x+b+c; prompt=f"Let f(x)={a}x+{b} and g(x)=x+{c}. Find (g∘f)({x})."; solution=f"f({x})={a*x+b}; add {c} to get {target}."
        elif mode==2: target=(x+b)**2; prompt=f"Let g(x)=x+{b} and f(x)=x². Find f(g({x}))."; solution=f"({x}+{b})²={target}."
        else: target=a*(a*x+b)+b; prompt=f"For f(x)={a}x+{b}, find f(f({x}))."; solution=f"f({x})={a*x+b}; applying f again gives {target}."
    elif key == "2.8":
        if mode==0: target=(c-b)/a; prompt=f"For f(x)={a}x+{b}, calculate f⁻¹({c})."; solution=f"Solve {a}x+{b}={c}: x={target:g}."
        elif mode==1: target=math.sqrt((x+b)**2); prompt=f"For f(x)=x² restricted to x≥0, find f⁻¹({(x+b)**2})."; solution=f"Use the principal square root: {target}."
        elif mode==2: target=a*x+b; prompt=f"For f(x)=(x-{b})/{a}, find f⁻¹({x})."; solution=f"The inverse is {a}x+{b}; value={target}."
        else: target=x; prompt=f"If f and g are inverses, evaluate f(g({x}))."; solution="Inverse compositions return the input."
    elif key == "2.9":
        if mode==0: target=x+b; prompt=f"The graph y=f(x) is translated {b} units right. A point has x-coordinate {x}. Find its new x-coordinate."; solution=f"{x}+{b}={target}."
        elif mode==1: target=-c; prompt=f"A point has y-coordinate {c}. Reflect the graph in the x-axis; give the new y-coordinate."; solution=f"Reflection changes y to -y: {-c}."
        elif mode==2: target=a*c; prompt=f"A vertical stretch by factor {a} acts on a point with y={c}. Find the new y-coordinate."; solution=f"{a}·{c}={target}."
        else: target=x/a; prompt=f"Under y=f({a}x), a point originally at x={x} maps to which x-coordinate?"; solution=f"Horizontal coordinates divide by {a}: {target:g}."
    elif key == "2.10":
        if mode==0: target=b; prompt=f"For f(x)=({a}x+1)/(x-{b}), enter the x-value of the vertical asymptote."; solution=f"The denominator is zero at x={b}."
        elif mode==1: target=a; prompt=f"For f(x)=({a}x+{b})/(x+{c}), enter the y-value of the horizontal asymptote."; solution=f"The ratio of leading coefficients is {a}."
        elif mode==2: target=b; prompt=f"The expression (x-{b})(x+1)/((x-{b})(x+{c})) has a removable hole at x=h. Find h."; solution=f"The cancelled factor gives h={b}."
        else: target=-c; prompt=f"For f(x)=1/(x+{c}), which x-value is excluded from the domain?"; solution=f"x+{c}=0, so x={-c}."
    elif key == "2.12":
        base=2+(k%3); p=2+(k%4); value=base**p
        if mode==0: target=p; prompt=f"Solve {base}^x={value}."; solution=f"x={p}."
        elif mode==1: target=p; prompt=f"Solve {a}·{base}^x={a*value}."; solution=f"Divide by {a}, then x={p}."
        elif mode==2: target=p+1; prompt=f"A discrete process has amount {a}·{base}^n. Find the first integer n for which the amount is at least {a*base**(p+1)}."; solution=f"The threshold is first reached at n={p+1}."
        else: target=p; prompt=f"Solve {base}^(x+{b})={base**(p+b)}."; solution=f"Equate exponents: x+{b}={p+b}, so x={p}."
    elif key == "2.13":
        if mode==0: target=a; prompt=f"Data points ({x},{b}) and ({x+4},{b+4*a}) lie on a line. Find the slope."; solution=f"m=({b+4*a}-{b})/4={a}."
        elif mode==1: target=a*x+b; prompt=f"A regression model is ŷ={a}x+{b}. Predict y at x={x}."; solution=f"ŷ={target}."
        elif mode==2: pred=a*x+b; actual=pred+c; target=c; prompt=f"A model predicts {pred} and the observed value is {actual}. Calculate residual observed−predicted."; solution=f"Residual={actual}-{pred}={c}."
        else: target=1 if x<=6 else 0; prompt=f"A model was validated for 1≤x≤6. Enter 1 if prediction at x={x} is interpolation, otherwise enter 0."; solution=f"x={x} {'is' if target else 'is not'} inside the validated interval."
    elif key == "2.14":
        if mode==0: target=a*x*x+b*x+c; prompt=f"For P(x)={a}x²+{b}x+{c}, calculate P({x})."; solution=f"Substitution gives {target}."
        elif mode==1: target=2*a; prompt=f"For y={a}x², equal-step second differences are constant. Find that constant."; solution=f"For step 1, Δ²y=2a={2*a}."
        elif mode==2: target=max(a,b,c); prompt=f"A cubic model has roots {a}, {b} and {c}. Enter the largest root."; solution=f"The largest is {target}."
        else: target=x**3; prompt=f"For C(x)=x³, calculate C({x})."; solution=f"{x}³={target}."
    elif key == "2.15":
        if mode==0: target=a*x; prompt=f"For direct variation y={a}x, calculate y when x={x}."; solution=f"y={a}({x})={target}."
        elif mode==1: target=a*b; prompt=f"In inverse variation y=k/x, y={a} when x={b}. Find k."; solution=f"k=xy={a*b}."
        elif mode==2: target=a*x*x; prompt=f"For power model y={a}x², calculate y at x={x}."; solution=f"y={a}({x})²={target}."
        else: target=2**a; prompt=f"If y∝x^{a}, by what factor does y change when x doubles?"; solution=f"The factor is 2^{a}={target}."
    elif key == "2.16":
        if mode==0: target=a*(2**x); prompt=f"A(t)={a}·2^t. Calculate A({x})."; solution=f"A={target}."
        elif mode==1: target=a*(0.5**2); prompt=f"A sample begins at {a} units and has a half-life of one period. Find the amount after 2 periods."; solution=f"{a}(1/2)²={target:g}."
        elif mode==2: target=100+b; prompt=f"A growth rate is {b}%. Find the multiplier as a percentage."; solution=f"100%+{b}%={target}%."
        else: target=3; prompt=f"A quantity doubles every period. How many periods are needed to multiply it by 8?"; solution="8=2³, so 3 periods."
    elif key == "2.17":
        maximum=max(b,c); minimum=min(b,c)
        if mode==0: target=(maximum-minimum)/2; prompt=f"A sinusoidal quantity has maximum {maximum} and minimum {minimum}. Find its amplitude."; solution=f"Amplitude=({maximum}-{minimum})/2={target:g}."
        elif mode==1: target=(maximum+minimum)/2; prompt=f"A sinusoidal quantity has maximum {maximum} and minimum {minimum}. Find its midline."; solution=f"Midline=({maximum}+{minimum})/2={target:g}."
        elif mode==2: target=2*math.pi/a; prompt=f"For y=sin({a}x), calculate the period. Give a decimal."; solution=f"T=2π/{a}≈{target:.6g}."
        else: target=c+a; prompt=f"For y={a}cos(x)+{c}, find the maximum value."; solution=f"Maximum={c}+|{a}|={target}."
    elif key == "2.18":
        if mode==0: target=x+2; prompt=f"Sites A({x},{b}) and B({x+4},{b}) have a vertical Voronoi boundary x=h. Find h."; solution=f"The perpendicular bisector passes through midpoint x={x+2}."
        elif mode==1: target=b+2; prompt=f"Sites A({x},{b}) and B({x},{b+4}) have a horizontal Voronoi boundary y=k. Find k."; solution=f"Midpoint y={b+2}."
        elif mode==2: target=5; prompt=f"Find the Euclidean distance from P({x},{b}) to site S({x+3},{b+4})."; solution="Distance=√(3²+4²)=5."
        else: target=1; prompt=f"Point P is equidistant from two sites on a Voronoi edge. Enter 1 if this statement is true."; solution="By definition, points on the edge are equidistant from the two generating sites."
    else:  # 2.19
        if mode==0: target=a*100*(1+b/100); prompt=f"An account contains {a*100} QAR and grows by {b}%. Find the new balance."; solution=f"Multiply by 1+{b}/100 to get {target:g} QAR."
        elif mode==1: target=a*100*(1-b/100); prompt=f"Equipment worth {a*100} QAR depreciates by {b}%. Find its value after one year."; solution=f"Multiply by 1-{b}/100 to get {target:g} QAR."
        elif mode==2 and i%8==2: target=a*100*(1+b/100)**2; prompt=f"Invest {a*100} QAR at {b}% compound interest annually for 2 years. Find the balance."; solution=f"A={a*100}(1+{b}/100)²={target:g}."
        elif mode==2: target=a*100*(1+b/100); prompt=f"A loan balance is {a*100} QAR. Interest of {b}% is added before the next payment. Find the balance immediately before that payment."; solution=f"Balance={a*100}(1+{b}/100)={target:g} QAR."
        elif i%8==3: target=(1+a/100)/(1+b/100); prompt=f"A nominal balance grows by {a}% while prices rise by {b}%. Find the real growth factor."; solution=f"Real factor=(1+{a}/100)/(1+{b}/100)={target:.6g}."
        else: rate=b/100; periods=x; payment=a*100; target=payment*((1+rate)**periods-1)/rate; prompt=f"A saver deposits {payment} QAR at the end of each year for {periods} years into an account earning {b}% annually. Find the future value immediately after the final deposit."; solution=f"FV={payment}((1+{rate})^{periods}-1)/{rate}={target:.6g} QAR."

    contexts = ["Doha Metro","Education City tram","ECHS solar study","Qatar rainfall study","school transport","sports-science lab","water-security study","student enterprise","campus garden","library survey","coastal monitoring","energy audit","robotics club","health campaign","stadium operations","museum attendance","air-quality study","recycling programme","marine research","traffic study","date-farm trial","cooling-system test","scholarship fund","school canteen","architecture studio","drone survey","desert ecology study","telecommunications study","classroom experiment","community clinic","event planning","research internship"]
    context = contexts[i % len(contexts)]
    prefix = f"{topic['title']} independent checkpoint {i+1}" if quiz else f"{topic['title']} - {context} application"
    prompt = f"{prefix}: {prompt}"
    level = "Quiz" if quiz else ["Foundation","Application","Reasoning","Challenge"][i // 8]
    ident = f"IBAI-U2-{topic['n']}-{'QZ' if quiz else 'P'}-{i+1:02d}"
    return {"id":ident,"level":level,"prompt":prompt,"answer":f"{target:.10g}","solution":solution,
            "marks":2 if level in {"Foundation","Quiz"} else 3,"calculator":"GDC allowed" if i%3==0 else "No GDC required",
            "command":"Calculate","hint":"Identify the relevant model and substitute with units.","tags":[topic["visual"],level.lower()],
            "check":{"mode":"number","value":round(float(target),10),"tolerance":1e-5}}


def slide_set(topic: dict, practice: list[dict]) -> list[dict]:
    slides = [
        {"section":"Launch","title":topic["title"],"kind":"cover","eyebrow":"Unit 2 · Functions and mathematical modelling","html":f'<div class="cover-grid"><div><div class="cover-kicker">IB Mathematics: Applications and Interpretation SL</div><div class="cover-number">{topic["n"]}</div><h1>{topic["title"]}</h1><p class="cover-subtitle">{topic["subtitle"]}</p><div class="pill-row"><span>{topic["status"]}</span><span>Inquiry</span><span>Technology</span><span>Interpretation</span></div><button class="primary-btn route-jump" data-go="practice">Open Practice Studio</button></div><div>{svg_visual(topic)}</div></div>'},
        {"section":"Launch","title":"Inquiry launch","kind":"content","eyebrow":"Think before calculating","html":f'<div class="launch-panel"><h2>A modelling decision</h2><p>{topic["inquiry"]}</p><textarea class="student-note" data-note="inquiry" placeholder="Record an initial model, assumption or question."></textarea></div>'},
        {"section":"Launch","title":"Learning outcomes","kind":"content","eyebrow":"By the end","html":'<div class="check-list">'+''.join(f'<label><input type="checkbox" data-reflect="obj-{topic["n"]}-{j}"><span>{o}</span></label>' for j,o in enumerate(topic["objectives"]))+'</div>'},
        {"section":"Launch","title":"Diagnostic checkpoint","kind":"content","eyebrow":"Activate prior learning","html":f'<div class="two-col"><article class="focus-card"><h2>Recall</h2><p>Coordinate graphs, algebraic substitution, equation solving, units and sensible rounding.</p></article><article class="focus-card"><h2>Predict</h2><p>{topic["concepts"][0][2]}</p></article></div><textarea class="student-note" data-note="diagnostic" placeholder="What do you already know, and what needs checking?"></textarea>'},
        {"section":"Launch","title":"Vocabulary and notation","kind":"content","eyebrow":"Language for precise reasoning","html":'<div class="vocab-grid">'+''.join(f'<article><b>{v}</b><span>Use this term explicitly in explanations and model evaluation.</span></article>' for v in topic["vocab"])+'</div>'},
        {"section":"Launch","title":"Interactive technology laboratory","kind":"lab","eyebrow":"Predict · vary · explain","html":f'<div class="lab-shell"><h2>{topic["title"]} laboratory</h2><p>Change the parameters, predict the graphical effect, then explain the feature that remains invariant.</p><div id="lesson-lab" data-lab="{topic["n"]}"></div></div>'},
    ]
    for j,(name,formula,meaning) in enumerate(topic["concepts"]):
        q1=practice[j*2]; q2=practice[j*2+1]
        section=f"Concept cycle {j+1}"
        slides.extend([
            {"section":section,"title":name,"kind":"content","eyebrow":"Concept snapshot","html":f'<div class="concept-grid"><article class="formula-card"><h2>{name}</h2><p>\\[{formula}\\]</p></article><article class="focus-card"><h2>Meaning</h2><p>{meaning}</p></article></div>'},
            {"section":section,"title":f"Worked example · {name}","kind":"content","eyebrow":"Method with verification","html":f'<article class="worked"><h2>{q1["prompt"]}</h2><ol><li>Identify the structure and valid domain.</li><li>{q1["solution"]}</li><li>Check sign, size, units and contextual meaning.</li></ol><div class="answer-callout"><b>Answer:</b> {q1["answer"]}</div></article>'},
            {"section":section,"title":"Student turn","kind":"content","eyebrow":"Attempt before reveal","html":f'<article class="student-turn"><h2>{q2["prompt"]}</h2><textarea class="student-note" data-note="turn-{j}" placeholder="Show your method and interpretation."></textarea><details><summary>Reveal solution</summary><p>{q2["solution"]}</p><p><b>Answer:</b> {q2["answer"]}</p></details></article>'},
            {"section":section,"title":"Technology with purpose","kind":"content","eyebrow":"Transparent GDC use","html":f'<div class="two-col"><article class="focus-card"><h2>Procedure</h2><p>Enter the model with a stated viewing domain. Use table, graph, solve or intersection tools as appropriate, and record the command or window.</p></article><article class="focus-card"><h2>Evidence</h2><p>Confirm the numerical result against {name.lower()} and explain why it is reasonable.</p></article></div>'},
            {"section":section,"title":"Representation bridge","kind":"content","eyebrow":"Symbolic · graphical · numerical · contextual","html":f'<div class="concept-grid"><div>{svg_visual(topic,j+1)}</div><article class="focus-card"><h2>Translate the feature</h2><p>Connect \\({formula}\\) to a graph feature, a table pattern and one sentence in context.</p><textarea class="student-note" data-note="representation-{j}" placeholder="Write the four-way connection."></textarea></article></div>'},
            {"section":section,"title":"Checkpoint and misconception","kind":"content","eyebrow":"Reason, do not guess","html":f'<div class="two-col"><article class="warning-card"><h2>Common error</h2><p>Treating a calculator display as proof, ignoring the domain, or reporting a value without units and interpretation.</p></article><article class="focus-card"><h2>Corrective question</h2><p>{meaning} What evidence in the equation, table or graph supports this?</p></article></div>'},
        ])
    assert len(slides)==36
    return slides


def exam_tasks(topic: dict, practice: list[dict]) -> list[dict]:
    tasks=[]
    contexts=["Education City planning team","Qatar environmental monitoring study","ECHS student enterprise"]
    for i,ctx in enumerate(contexts):
        q=practice[12+i*3]
        tasks.append({"id":f"IBAI-U2-{topic['n']}-TASK-{i+1}","style":"IB Paper 2 · modelling" if i<2 else "IB investigation · communication","title":f"{topic['title']} · {ctx}","calculator":"GDC expected","total_marks":12,
          "context":f"The {ctx} uses a {topic['title'].lower()} model. The analysis must state assumptions, show technology transparently and interpret results in context.",
          "parts":[
            {"label":"a","prompt":q["prompt"],"marks":3,"answer":q["answer"],"markscheme":f"M1 appropriate method; A1 accurate value; A1 units or exact form. {q['solution']}"},
            {"label":"b","prompt":f"Explain the meaning of one parameter or defining feature in this {topic['title'].lower()} model.","marks":3,"answer":topic["concepts"][i%5][2],"markscheme":"A1 identifies the feature; R1 contextual meaning; R1 units/direction where relevant."},
            {"label":"c","prompt":"Describe one technology check or alternative representation that would validate the result.","marks":3,"answer":"Use an independently entered graph, table, intersection, regression diagnostic or substitution check on the stated domain.","markscheme":"M1 valid check; A1 correct expected evidence; R1 connection to validity."},
            {"label":"d","prompt":"State one realistic limitation or assumption and explain its likely effect on a prediction.","marks":3,"answer":"A valid answer identifies a specific assumption, explains why it may fail, and states the direction or nature of the effect.","markscheme":"R1 specific assumption; R1 effect; R1 judgement about model use."},
          ]})
    return tasks


HTML = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Interactive IB Mathematics Applications and Interpretation SL Unit 2 lesson."><meta name="theme-color" content="#78183f"><title>{number} {title} | ECHS Mathematics</title><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../assets/css/katex.css"><link rel="stylesheet" href="../assets/css/theme.css?v=3.0.0"><script defer src="../data/lesson-{number}.js?v=3.0.0"></script><script defer src="../assets/js/katex-global.js"></script><script defer src="../assets/js/engine.js?v=3.0.0"></script></head><body data-rendered="0"><header class="topbar"><div class="brand-block"><div class="brand-mark">ECHS</div><div class="brand-text"><b>ECHS MATHEMATICS</b><span>IB Diploma Programme</span></div></div><div class="header-title"><strong id="header-lesson-title">{number} · {title}</strong><small id="header-unit-title">IB Mathematics: Applications and Interpretation SL · Unit 2</small></div><div class="header-actions"><button class="icon-btn" id="lesson-home" title="Unit home"><span class="icon-label">Unit home</span></button></div></header><nav class="routebar" aria-label="Lesson routes"><button class="route-btn active" data-route="learn">Learn</button><button class="route-btn" data-route="practice">Practice Studio</button><button class="route-btn" data-route="exam">IB Tasks</button><button class="route-btn" data-route="quiz">Timed Quiz</button><button class="route-btn" data-route="review">Mastery</button></nav><main id="app" class="app-shell"><div class="empty-state">Loading lesson…</div></main><footer class="footer" id="lesson-footer"><div class="footer-left"><button class="icon-btn" id="open-map">Slide map</button><button class="nav-btn" id="prev-slide">Back</button></div><div class="progress-wrap"><div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div><span class="progress-label" id="progress-label"></span></div><div class="footer-right"><button class="nav-btn" id="next-slide">Next</button></div></footer><div class="backdrop" id="drawer-backdrop"></div><aside class="drawer" id="slide-drawer" aria-hidden="true"><div class="drawer-head"><div><b>Lesson map</b><small>Jump to any slide</small></div><button class="icon-btn" id="close-map">Close</button></div><div class="drawer-list" id="drawer-list"></div></aside><noscript><p style="padding:30px">JavaScript is required for this interactive lesson.</p></noscript></body></html>'''


def build() -> None:
    DATA.mkdir(parents=True,exist_ok=True); LESSONS.mkdir(parents=True,exist_ok=True)
    for path in DATA.glob("lesson-*.js"): path.unlink()
    for path in LESSONS.glob("IB_AI_SL_*.html"): path.unlink()
    catalog=[]
    for topic in TOPICS:
        practice=[problem(topic,i) for i in range(32)]
        quiz=[problem(topic,i,True) for i in range(10)]
        slides=slide_set(topic,practice)
        exam=exam_tasks(topic,practice)
        payload={"schemaVersion":"3.0.0","version":"3.0.0","buildDate":"2026-08-03","course":"IB Mathematics: Applications and Interpretation SL","unit":{"number":2,"title":"Functions and Mathematical Modelling"},
          "lesson":{"number":topic["n"],"slug":topic["slug"],"title":topic["title"],"subtitle":topic["subtitle"],"status":topic["status"],"syllabus_focus":topic["title"],"skill_keys":[f"IBAI.U2.{topic['n'].replace('.','_')}","IBAI.U2.MODEL"],"objectives":topic["objectives"],"vocab":topic["vocab"],"technology":"Use graph, table, solve, regression or finance tools transparently; record settings and validate the result.","inquiry":topic["inquiry"]},
          "lab":{"kind":topic["visual"],"title":topic["title"]},"slides":slides,"practice":practice,"quiz":quiz,"exam":exam,"counts":{"slides":36,"practice":32,"quiz":10,"exam":3},
          "rights":{"student_content":"Original ECHS-authored instructional and assessment content","reference_policy":"References informed scope, sequencing and terminology; no textbook pages or source questions are embedded."}}
        (DATA/f"lesson-{topic['n']}.js").write_text("window.LESSON_DATA = "+json.dumps(payload,separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")
        filename=f"IB_AI_SL_{topic['n']}_{topic['slug']}_ECHS.html"
        (LESSONS/filename).write_text(HTML.format(number=topic["n"],title=topic["title"]),encoding="utf-8")
        catalog.append({"number":topic["n"],"title":topic["title"],"file":filename,"data":f"lesson-{topic['n']}.js","status":topic["status"],"summary":topic["subtitle"],"outcomes":topic["objectives"],"counts":{"slides":36,"practice":32,"quiz":10,"examTasks":3}})
    (ROOT/"data/ib-math-ai-unit-2-delivery-catalog.json").write_text(json.dumps({"schemaVersion":"1.0.0","unit":2,"release":"3.0.0","lessons":catalog},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    compact=json.dumps(catalog,separators=(",",":"),ensure_ascii=False)
    registration=f'''(function(){{"use strict";const rows={compact};const base="lessons/ib-math-ai/unit-2/lessons/";const lessons=rows.map(row=>{{const url=base+row.file;return{{number:row.number,title:row.title,summary:row.summary,outcomes:row.outcomes,url,status:"ready",new:true,kind:"lesson",skill_keys:[`IBAI.U2.${{row.number.replace(".","_")}}`],lesson_key:`u2-${{row.number.replace(".","-")}}`,resources:[{{label:"Complete interactive lesson",url,type:"resource"}},{{label:"Practice Studio",url:url+"#practice",type:"practice"}},{{label:"IB-style assessment tasks",url:url+"#exam",type:"assessment"}}],keywords:["ib","mathematics","applications","interpretation","functions",row.number,row.title.toLowerCase()]}}}});const unit={{title:"Unit 2: Functions and Mathematical Modelling",description:"Nineteen focused interactive IB Mathematics AI lessons with original visuals, technology laboratories, four-level practice, extended tasks and independent timed quizzes.",portalSummary:"19 lessons · 684 learn screens · 608 practice questions · 190 quiz questions · 57 extended tasks",essential_questions:["How do representations reveal function structure and restrictions?","How should technology support transparent mathematical reasoning?","How do assumptions, residuals and context determine whether a model is defensible?"],lessons,refreshed:true,release:"ECHS Unit 2 v3.0.0"}};window.ECHS_IB_MATH_AI_UNIT_2=unit;if(!Array.isArray(window.ECHS_COURSES))return;const normalise=value=>String(value||"").toLowerCase().replace(/[–—−]/g,"-").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");const isIB=course=>course&&[course.id,course.course,course.title,course.shortTitle].map(normalise).some(value=>value==="g11-ib-ai"||value==="ib-math-ai"||value.includes("ib-mathematics-applications-and-interpretation"));let index=window.ECHS_COURSES.findIndex(course=>normalise(course?.id)==="g11-ib-ai");if(index<0)index=window.ECHS_COURSES.findIndex(isIB);if(index<0){{console.error("Canonical G11 IB Mathematics AI course was not found");return}}const course=window.ECHS_COURSES[index];window.ECHS_COURSES=window.ECHS_COURSES.filter((candidate,i)=>i===index||!isIB(candidate));course.id="g11-ib-ai";course.grade="G11";course.title="G11 IB Mathematics: Applications and Interpretation";course.shortTitle="IB Math AI";course.course=course.title;if(!Array.isArray(course.units))course.units=[];const unitIndex=course.units.findIndex(value=>/^unit\\s*2(?:\\s*:|\\b)/i.test(String(value?.title||"")));if(unitIndex>=0)course.units[unitIndex]=unit;else{{const u1=course.units.findIndex(value=>/^unit\\s*1(?:\\s*:|\\b)/i.test(String(value?.title||"")));course.units.splice(u1>=0?u1+1:Math.min(1,course.units.length),0,unit)}}course.unitCount=course.units.length;course.lessonCount=course.units.reduce((sum,value)=>sum+(Array.isArray(value?.lessons)?value.lessons.length:0),0);course.status="Started";course.updatedUnits=`Units 1–2 · ${{lessons.length}} complete Unit 2 lessons`;window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{{detail:{{courseId:course.id,unit:2,lessons:lessons.length}}}}))}})();\n'''
    (ROOT/"data/ib-math-ai-unit-2-update.js").write_text(registration,encoding="utf-8")
    cards=''.join(f'''<a class="lesson-card" href="lessons/{r['file']}"><span class="num">{r['number']}</span><h2>{r['title']}</h2><p>{r['summary']}</p><div class="card-meta"><span>{r['status']}</span><span>36 Learn screens</span><span>32 Practice questions</span><span>10-question quiz</span><span>3 IB tasks</span></div></a>''' for r in catalog)
    home=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Complete interactive IB Mathematics Applications and Interpretation SL Unit 2."><meta name="theme-color" content="#78183f"><title>IB Mathematics AI SL · Unit 2 | ECHS Mathematics</title><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/css/theme.css?v=3.0.0"></head><body><main class="unit-home"><section class="unit-hero"><div class="cover-kicker">ECHS Mathematics · IB Diploma Programme</div><h1>Functions and Mathematical Modelling</h1><p>A complete reference-aligned Unit 2 with focused theory, modelling, transparent technology, original assessment and different visual laboratories for every topic.</p><div class="hero-stats"><div><b>19</b><span>complete lessons</span></div><div><b>684</b><span>Learn screens</span></div><div><b>608</b><span>Practice questions</span></div><div><b>247</b><span>quiz questions + IB tasks</span></div></div><a class="button-link" href="../../../index.html#courses">Back to my learning path</a></section><section class="transition-note"><b>Course alignment.</b> Lessons 2.1–2.6 and 2.13–2.19 form the SL core pathway. Lessons 2.7–2.12 are explicitly labelled Extension · HL bridge and do not replace SL requirements.</section><section class="lesson-grid">{cards}</section></main></body></html>'''
    (UNIT/"index.html").write_text(home,encoding="utf-8");(UNIT/"START_HERE.html").write_text(home,encoding="utf-8")
    print("Built Unit 2 v3: 19 lessons, 684 slides, 608 practice, 190 quiz, 57 extended tasks")


if __name__ == "__main__": build()

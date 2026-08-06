(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1')return;

const workflows={
  'ee-operation':{
    code:'A1',group:'Scientific notation',title:'EE entry · operate, normalize and report',
    prompt:'Evaluate ((6.4×10⁷)(3.5×10⁻⁴))/(2.8×10²) and report the answer to 2 significant figures.',
    math:'\\frac{(6.4\\times10^7)(3.5\\times10^{-4})}{2.8\\times10^2}',
    manualSteps:[
      'Estimate the scale first: (6×4÷3)×10^(7−4−2) is about 8×10¹, so an answer near 80 is reasonable.',
      'Combine coefficients and exponents separately: (6.4×3.5÷2.8)×10^(7−4−2).',
      'The coefficient is 8 and the exponent is 1. Preserve two significant figures in the report.',
      'Write the final mathematical answer as 8.0×10¹, not 8E1 and not an unqualified 80.'
    ],
    tiSteps:[
      {keys:['6','.','4','2nd','EE','7'],label:'Enter 6.4×10⁷',detail:'EE is an entry shortcut for ×10 to a power; do not type ×10^ manually.'},
      {keys:['×','3','.','5','2nd','EE','(−)','4'],label:'Multiply by 3.5×10⁻⁴',detail:'Use the dedicated (−) key for a negative exponent, not the subtraction key.'},
      {keys:['÷','(','2','.','8','2nd','EE','2',')'],label:'Divide by 2.8×10²',detail:'Parentheses make the denominator unambiguous.'},
      {keys:['ENTER'],label:'Calculate with full internal precision',detail:'The home screen displays 80 in NORM mode.'},
      {keys:['write'],label:'Translate the output',detail:'Record 8.0×10¹ to 2 significant figures in the written solution.'}
    ],
    entry:'(6.4\\operatorname{E}7)(3.5\\operatorname{E}{-4})\\div(2.8\\operatorname{E}2)',
    output:'80=8.0\\times10^1\\quad\\text{to 2 s.f.}',
    verification:'The exponent estimate predicts order 10¹, and 80 lies at that scale. Reversing the operations reproduces the original ratio.',
    ibStatement:'Using EE entry gives 80. Since the inputs are given to 2 significant figures, the justified report is 8.0×10¹. This agrees with the order-of-magnitude estimate.',
    handheldAlternative:'On a physical TI‑84 Plus CE, EE is above the comma key: 2nd → comma. The embedded simulator uses the corresponding EE key.'
  },
  'sci-display':{
    code:'B1',group:'Display modes',title:'SCI/NORM · read an E display correctly',
    prompt:'Display 0.00000472891 in SCI mode, then report it to 3 significant figures.',
    math:'0.00000472891',
    manualSteps:[
      'Locate the first non-zero digit: moving the decimal six places right gives coefficient 4.72891.',
      'Therefore the exact entered decimal is 4.72891×10⁻⁶.',
      'For 3 significant figures, retain 4, 7 and 2; the next digit is 8, so round to 4.73.',
      'The final report is 4.73×10⁻⁶. SCI mode changes only the display, not the stored value.'
    ],
    tiSteps:[
      {keys:['MODE'],label:'Open mode settings',detail:'Find the notation row containing NORMAL, SCI and ENG.'},
      {keys:['→','SCI','ENTER'],label:'Select SCI',detail:'Highlight SCI and confirm with ENTER.'},
      {keys:['2nd','MODE'],label:'Return to the home screen',detail:'2nd → MODE is QUIT.'},
      {keys:['0','.','0','0','0','0','0','4','7','2','8','9','1','ENTER'],label:'Enter the decimal',detail:'The display reads 4.72891E−6.'},
      {keys:['round','3 s.f.'],label:'Report, do not copy',detail:'Write 4.73×10⁻⁶, not 4.73E−6.'},
      {keys:['MODE','NORM','ENTER','2nd','MODE'],label:'Restore NORM',detail:'Return the classroom calculator to its normal display setting.'}
    ],
    entry:'0.00000472891\\quad\\xrightarrow{\\mathrm{SCI}}\\quad4.72891\\operatorname{E}{-6}',
    output:'4.73\\times10^{-6}\\quad\\text{to 3 s.f.}',
    verification:'Moving the decimal in 4.73×10⁻⁶ six places left gives 0.00000473, which is the correctly rounded value.',
    ibStatement:'SCI mode displays 4.72891E−6. Translating the display and rounding once at the end gives 4.73×10⁻⁶ to 3 significant figures.',
    handheldAlternative:'NORM, SCI and ENG control answer display only. Restore NORM after the demonstration so later outputs are not misread.'
  },
  'guard-digits':{
    code:'C1',group:'Accuracy',title:'Guard digits · calculate first, round once',
    prompt:'Light travels at 3.00×10⁸ m s⁻¹. Estimate and then calculate the time for 1.496×10¹¹ m, reporting 3 significant figures.',
    math:'t=\\frac{1.496\\times10^{11}}{3.00\\times10^8}',
    manualSteps:[
      'Estimate: (1.5÷3)×10^(11−8)=0.5×10³=5×10² seconds.',
      'Use the original values, not the one-significant-figure estimate, in the calculator.',
      'The full output is 498.666… seconds. Keep guard digits until the reporting step.',
      'To 3 significant figures, 498.666… becomes 499 seconds, written as 4.99×10² s when scale and precision should be explicit.'
    ],
    tiSteps:[
      {keys:['1','.','4','9','6','2nd','EE','1','1'],label:'Enter the distance',detail:'This represents 1.496×10¹¹.'},
      {keys:['÷','(','3','.','0','0','2nd','EE','8',')'],label:'Divide by the speed',detail:'Retain the two trailing zeros because 3.00 has three significant figures.'},
      {keys:['ENTER'],label:'Read guard digits',detail:'The output is approximately 498.6666667.'},
      {keys:['round','3 s.f.'],label:'Round once at the end',detail:'The fourth significant digit is 6, so 498 rounds to 499.'},
      {keys:['compare','estimate'],label:'Validate the scale',detail:'499 s is close to the prior estimate of 500 s.'}
    ],
    entry:'1.496\\operatorname{E}11\\div(3.00\\operatorname{E}8)',
    output:'498.666\\ldots\\text{ s}\\approx4.99\\times10^2\\text{ s}',
    verification:'4.99×10² s equals 499 s, close to 5×10² s. Multiplying 498.666… by 3.00×10⁸ returns 1.496×10¹¹ to the displayed precision.',
    ibStatement:'The TI‑84 gives t≈498.6667 s. Retaining guard digits and rounding only the final value gives t=4.99×10² s to 3 significant figures, consistent with the estimate 5×10² s.',
    handheldAlternative:'Do not use FIX 3 to mean “3 significant figures”; FIX controls decimal places. Perform the calculation in FLOAT and round the final answer yourself.'
  }
};

window.ECHS_TI84_CLASSROOM_WORKFLOWS=workflows;
data.ti84Classroom={
  release:'6.2.0',simulator:'https://ti84calc.com/ti84calc',workflowCount:Object.keys(workflows).length,
  modes:['teacher','follow','drill'],pairedMethod:'estimate → enter → retain guard digits → report → verify',
  mappedSlides:['Calculator fluency','The anatomy of normalized standard form','Premature rounding and guard digits'],
  thirdPartySimulator:true,physicalCalculatorPractice:true,
  officialBasis:['TI-84 Plus CE EE entry guidance','TI-84 notation-mode guidance','IB mathematical-notation requirement']
};
})();

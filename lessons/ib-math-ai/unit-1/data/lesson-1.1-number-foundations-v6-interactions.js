(() => {
  'use strict';

  const app = document.getElementById('app');
  const katex = window.katex;
  if (!app || !katex) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function renderTex(node, tex, displayMode = false) {
    if (!node) return;
    try {
      node.innerHTML = katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        strict: 'ignore',
        trust: false
      });
    } catch {
      node.textContent = tex;
    }
  }

  function formatNumber(value, maximum = 12) {
    if (!Number.isFinite(value)) return '';
    const abs = Math.abs(value);
    if (abs !== 0 && (abs < 1e-5 || abs >= 1e8)) {
      return value.toExponential(Math.min(6, maximum)).replace(/\.?0+(?=e)/, '');
    }
    return Number(value.toFixed(maximum)).toString();
  }

  function parseNumeric(raw) {
    const text = String(raw ?? '').trim().replace(/,/g, '').replace(/[−–—]/g, '-');
    const sci = text.match(/^([-+]?\d*\.?\d+)\s*(?:x|×|\*)\s*10\s*\^?\s*\{?\s*([-+]?\d+)\s*\}?$/i);
    if (sci) return Number(sci[1]) * 10 ** Number(sci[2]);
    const value = Number(text.replace(/\s+/g, ''));
    return Number.isFinite(value) ? value : NaN;
  }

  function nearlyEqual(a, b, tolerance = 1e-9) {
    return Number.isFinite(a) && Number.isFinite(b) &&
      Math.abs(a - b) <= Math.max(tolerance, Math.abs(b) * 1e-9);
  }

  function countSignificantFigures(raw) {
    let text = String(raw ?? '').trim().toLowerCase().replace(/,/g, '').replace(/[−+]/g, '');
    if (!text) return 0;
    text = text.split(/[e×x*]/)[0].replace(/\s+/g, '');
    if (!/^\d*\.?\d+$/.test(text)) return 0;
    if (text.includes('.')) {
      const digits = text.replace('.', '').replace(/^0+/, '');
      return digits.length;
    }
    const digits = text.replace(/^0+/, '');
    return digits.replace(/0+$/, '').length;
  }

  function initNumberSetExplorer(root) {
    root.querySelectorAll('[data-number-set-explorer]').forEach(explorer => {
      if (explorer.dataset.enhanced === '1') return;
      explorer.dataset.enhanced = '1';
      const next = explorer.querySelector('[data-set-next]');
      const reset = explorer.querySelector('[data-set-reset]');
      const progress = explorer.querySelector('[data-set-progress]');
      const explanation = explorer.querySelector('[data-set-explanation]');
      const levelNodes = [...explorer.querySelectorAll('[data-set-level]')];
      const explanations = [
        '<b>ℕ · Natural numbers:</b> positive counting numbers. This lesson uses ℕ = {1, 2, 3, …}.',
        '<b>ℤ · Integers:</b> natural numbers together with zero and negative whole numbers.',
        '<b>ℚ · Rational numbers:</b> fractions of integers; decimals terminate or eventually repeat.',
        '<b>ℝ · Real numbers:</b> rational and irrational numbers. Irrationals occupy the region outside ℚ.',
        '<b>ℂ · Complex numbers:</b> numbers a + bi. Every real number is complex, but numbers with non-zero imaginary part are not real.'
      ];

      const render = () => {
        const stage = Math.max(1, Math.min(5, Number(explorer.dataset.setStage || 1)));
        levelNodes.forEach(node => node.classList.toggle('is-revealed', Number(node.dataset.setLevel) <= stage));
        if (explanation) explanation.innerHTML = explanations[stage - 1];
        if (progress) progress.textContent = `${stage} of 5 sets revealed`;
        if (next) {
          next.disabled = stage >= 5;
          next.textContent = stage >= 5 ? 'Full hierarchy revealed' : 'Reveal next set';
        }
      };

      next?.addEventListener('click', () => {
        explorer.dataset.setStage = String(Math.min(5, Number(explorer.dataset.setStage || 1) + 1));
        render();
      });
      reset?.addEventListener('click', () => {
        explorer.dataset.setStage = '1';
        render();
      });
      render();
    });
  }

  function initBoundExplorer(root) {
    root.querySelectorAll('[data-bound-explorer]').forEach(explorer => {
      if (explorer.dataset.enhanced === '1') return;
      explorer.dataset.enhanced = '1';
      const valueInput = explorer.querySelector('[data-bound-value]');
      const unitInput = explorer.querySelector('[data-bound-unit]');
      const button = explorer.querySelector('[data-bound-update]');
      const equation = explorer.querySelector('[data-bound-equation]');
      const lowerNode = explorer.querySelector('[data-bound-lower]');
      const centerNode = explorer.querySelector('[data-bound-center]');
      const upperNode = explorer.querySelector('[data-bound-upper]');
      const meaning = explorer.querySelector('[data-bound-meaning]');

      const update = () => {
        const value = Number(valueInput?.value);
        const unit = Number(unitInput?.value);
        if (!Number.isFinite(value) || !Number.isFinite(unit) || unit <= 0) return;
        const lower = value - unit / 2;
        const upper = value + unit / 2;
        renderTex(equation, `${formatNumber(lower)}\\le x<${formatNumber(upper)}`, true);
        if (lowerNode) lowerNode.textContent = formatNumber(lower);
        if (centerNode) centerNode.textContent = formatNumber(value);
        if (upperNode) upperNode.textContent = formatNumber(upper);
        if (meaning) meaning.textContent = `Every exact value from ${formatNumber(lower)} up to, but not including, ${formatNumber(upper)} rounds to ${formatNumber(value)} at this unit.`;
      };

      button?.addEventListener('click', update);
      valueInput?.addEventListener('change', update);
      unitInput?.addEventListener('change', update);
      update();
    });
  }

  const setBank = [
    { tex:'-17', answer:'z', aliases:['z','integer','integers','ℤ'], solution:'−17 is an integer; ℤ is the smallest standard set containing it.' },
    { tex:'0.375', answer:'q', aliases:['q','rational','rationals','ℚ'], solution:'0.375 = 3/8, so it is rational but not an integer.' },
    { tex:'\\sqrt{144}', answer:'n', aliases:['n','natural','natural number','ℕ'], solution:'√144 = 12, a natural number.' },
    { tex:'\\sqrt{10}', answer:'irrational', aliases:['irrational','r\\q','r-q','ℝ\\ℚ'], solution:'10 is not a perfect square, so √10 is irrational.' },
    { tex:'0.\\overline{63}', answer:'q', aliases:['q','rational','rationals','ℚ'], solution:'Every recurring decimal is rational.' },
    { tex:'-2.75', answer:'q', aliases:['q','rational','rationals','ℚ'], solution:'−2.75 = −11/4, so it is rational.' },
    { tex:'5-3i', answer:'c', aliases:['c','complex','complex number','ℂ'], solution:'The imaginary part is non-zero, so the number is complex but not real.' },
    { tex:'\\pi', answer:'irrational', aliases:['irrational','r\\q','r-q','ℝ\\ℚ'], solution:'π is irrational and real.' }
  ];

  const roundingValues = [
    '37.8462','0.006953','58492','9.9951','0.00081476','63.9847',
    '-12.499','98.9951','0.030407','4506.78','7.9994e6','0.00040986'
  ];

  function precisionTex(value, sf) {
    const raw = Number(value).toPrecision(sf);
    if (!raw.includes('e')) return raw;
    const [coefficient, exponent] = raw.split('e');
    return `${coefficient}\\times10^{${Number(exponent)}}`;
  }

  function generateRounding() {
    const raw = roundingValues[Math.floor(Math.random() * roundingValues.length)];
    const useSf = Math.random() < 0.58;
    if (useSf) {
      const sf = 2 + Math.floor(Math.random() * 3);
      const value = Number(raw);
      const precision = value.toPrecision(sf);
      return {
        mode:'rounding',
        prompt:`Round ${raw} to ${sf} significant figures. Preserve any trailing zeros required to communicate the precision.`,
        expectedValue:Number(precision),
        expectedSf:sf,
        answerTex:precisionTex(value, sf),
        solution:`The target is the ${sf}${sf===1?'st':sf===2?'nd':sf===3?'rd':'th'} significant digit. Inspect the next digit, round once, and preserve the displayed precision.`
      };
    }
    const dp = 1 + Math.floor(Math.random() * 4);
    const value = Number(raw);
    const answer = value.toFixed(dp);
    return {
      mode:'rounding',
      prompt:`Round ${raw} to ${dp} decimal place${dp===1?'':'s'}.`,
      expectedValue:Number(answer),
      expectedText:answer,
      answerTex:answer,
      solution:`Locate the ${dp}${dp===1?'st':dp===2?'nd':dp===3?'rd':'th'} digit after the decimal point and use the next digit as the guard digit.`
    };
  }

  function generateBounds() {
    const units = [100, 10, 1, 0.1, 0.01, 0.001];
    const unit = units[Math.floor(Math.random() * units.length)];
    const multiplier = 12 + Math.floor(Math.random() * 850);
    const value = Number((multiplier * unit).toPrecision(12));
    const lower = value - unit / 2;
    const upper = value + unit / 2;
    return {
      mode:'bounds',
      prompt:`A measurement is reported as ${formatNumber(value)} to the nearest ${formatNumber(unit)}. Enter the lower and upper endpoints, separated by a comma.`,
      lower, upper,
      answerTex:`${formatNumber(lower)}\\le x<${formatNumber(upper)}`,
      solution:`The maximum rounding error is half the unit: ${formatNumber(unit / 2)}. Subtract and add this amount; include the lower endpoint and exclude the upper endpoint.`
    };
  }

  function generateError() {
    const exact = 120 + Math.floor(Math.random() * 881);
    let delta = 2 + Math.floor(Math.random() * 58);
    if (Math.random() < 0.5) delta *= -1;
    const approximate = exact + delta;
    const percentage = Math.abs(delta) / exact * 100;
    return {
      mode:'error',
      prompt:`The accepted value is ${exact} and the approximation is ${approximate}. Find the percentage error to 2 decimal places.`,
      expectedValue:Number(percentage.toFixed(2)),
      tolerance:0.011,
      answerTex:`${percentage.toFixed(2)}\\%`,
      solution:`Absolute error = |${approximate}−${exact}| = ${Math.abs(delta)}. Divide by the accepted value ${exact}, multiply by 100%, then round to 2 decimal places.`
    };
  }

  function generateSet() {
    const item = setBank[Math.floor(Math.random() * setBank.length)];
    return {
      mode:'sets',
      prompt:'State the smallest appropriate set among ℕ, ℤ, ℚ, ℝ and ℂ. Use “irrational” when the number is real but not rational.',
      tex:item.tex,
      aliases:item.aliases.map(x => x.toLowerCase()),
      answerTex:item.answer === 'irrational' ? '\\mathbb R\\setminus\\mathbb Q' : `\\mathbb ${item.answer.toUpperCase()}`,
      solution:item.solution
    };
  }

  function initGenerator(root) {
    root.querySelectorAll('[data-nf-generator]').forEach(generator => {
      if (generator.dataset.enhanced === '1') return;
      generator.dataset.enhanced = '1';
      const modeButtons = [...generator.querySelectorAll('[data-gen-mode]')];
      const topic = generator.querySelector('[data-gen-topic]');
      const counter = generator.querySelector('[data-gen-counter]');
      const question = generator.querySelector('[data-gen-question]');
      const answer = generator.querySelector('[data-gen-answer]');
      const check = generator.querySelector('[data-gen-check]');
      const fresh = generator.querySelector('[data-gen-new]');
      const reasoning = generator.querySelector('[data-gen-reasoning]');
      const feedback = generator.querySelector('[data-gen-feedback]');
      const solution = generator.querySelector('[data-gen-solution]');
      let mode = 'sets';
      let current = null;
      let questionNumber = 0;

      const titles = {
        sets:'Number sets',
        rounding:'Rounding',
        bounds:'Bounds',
        error:'Percentage error'
      };

      function makeQuestion() {
        current = mode === 'sets' ? generateSet() :
          mode === 'rounding' ? generateRounding() :
          mode === 'bounds' ? generateBounds() : generateError();
        questionNumber += 1;
        if (topic) topic.textContent = titles[mode];
        if (counter) counter.textContent = `Question ${questionNumber}`;
        if (question) {
          question.innerHTML = `<p>${escapeHtml(current.prompt)}</p>`;
          if (current.tex) {
            const math = document.createElement('div');
            math.className = 'nf-generator-math';
            question.append(math);
            renderTex(math, current.tex, true);
          }
        }
        if (answer) {
          answer.value = '';
          answer.placeholder = mode === 'bounds' ? 'Example: 8.35, 8.45' :
            mode === 'sets' ? 'Example: Z or irrational' :
            mode === 'error' ? 'Enter the percentage' : 'Enter the rounded value';
          answer.focus({preventScroll:true});
        }
        if (feedback) {
          feedback.className = 'nf-generator-feedback';
          feedback.textContent = '';
        }
        if (solution) {
          solution.hidden = true;
          solution.innerHTML = '';
        }
        if (reasoning) reasoning.textContent = 'Show reasoning';
      }

      function checkAnswer() {
        if (!current || !answer || !feedback) return;
        const raw = answer.value.trim();
        if (!raw) {
          feedback.className = 'nf-generator-feedback is-warn';
          feedback.textContent = 'Enter a response before checking.';
          return;
        }
        let correct = false;
        let precisionIssue = false;

        if (current.mode === 'sets') {
          const normalized = raw.toLowerCase().replace(/\s+/g, '').replace(/[{}()]/g, '');
          correct = current.aliases.some(alias => normalized === alias.replace(/\s+/g, '').toLowerCase());
        } else if (current.mode === 'bounds') {
          const values = raw.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
          correct = values.length >= 2 && nearlyEqual(values[0], current.lower, 1e-8) && nearlyEqual(values[1], current.upper, 1e-8);
        } else {
          const value = parseNumeric(raw.replace(/%/g, ''));
          correct = nearlyEqual(value, current.expectedValue, current.tolerance || 1e-9);
          if (correct && current.expectedSf) {
            const sfCount = countSignificantFigures(raw);
            precisionIssue = sfCount !== current.expectedSf;
            correct = !precisionIssue;
          }
          if (correct && current.expectedText && current.expectedText.includes('.') && raw.includes('.') === false) {
            precisionIssue = true;
          }
        }

        if (correct) {
          feedback.className = 'nf-generator-feedback is-correct';
          feedback.textContent = 'Correct. The value and reporting precision are consistent.';
        } else if (precisionIssue) {
          feedback.className = 'nf-generator-feedback is-warn';
          feedback.textContent = 'The numerical value is correct, but the written answer does not communicate the requested precision.';
        } else {
          feedback.className = 'nf-generator-feedback is-incorrect';
          feedback.textContent = 'Not yet. Recheck the target place, endpoint choice, set definition or reference value.';
        }
      }

      function toggleReasoning() {
        if (!current || !solution || !reasoning) return;
        const opening = solution.hidden;
        solution.hidden = !opening;
        if (opening) {
          solution.innerHTML = '<b>Answer</b><div class="nf-generator-answer"></div><p></p>';
          renderTex(solution.querySelector('.nf-generator-answer'), current.answerTex, true);
          solution.querySelector('p').textContent = current.solution;
        }
        reasoning.textContent = opening ? 'Hide reasoning' : 'Show reasoning';
      }

      modeButtons.forEach(button => button.addEventListener('click', () => {
        mode = button.dataset.genMode;
        modeButtons.forEach(node => node.setAttribute('aria-selected', node === button ? 'true' : 'false'));
        makeQuestion();
      }));
      fresh?.addEventListener('click', makeQuestion);
      check?.addEventListener('click', checkAnswer);
      reasoning?.addEventListener('click', toggleReasoning);
      answer?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          checkAnswer();
        }
      });
      makeQuestion();
    });
  }

  function initialize(root = app) {
    initNumberSetExplorer(root);
    initBoundExplorer(root);
    initGenerator(root);
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      initialize(app);
    });
  };

  new MutationObserver(schedule).observe(app, { childList:true, subtree:true });
  addEventListener('hashchange', schedule);
  schedule();
})();

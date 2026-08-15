(function () {
  'use strict';

  var API_URL = 'http://127.0.0.1:8000/predict';

  var form = document.getElementById('predict-form');
  var submitBtn = document.getElementById('submit-btn');
  var retryBtn = document.getElementById('retry-btn');

  var states = {
    empty: document.getElementById('state-empty'),
    loading: document.getElementById('state-loading'),
    success: document.getElementById('state-success'),
    error: document.getElementById('state-error')
  };

  var NUMERIC_FIELDS = [
    'Age', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks',
    'Study_Hours', 'Physical_Activity_Hours', 'Sleep_Hours_Per_Night'
  ];

  var FIELD_LABELS = {
    Age: 'Age',
    Gender: 'Gender',
    Country: 'Country',
    Academic_Level: 'Academic level',
    Most_Used_Platform: 'Most used platform',
    Purpose_Of_Use: 'Purpose of use',
    Avg_Daily_Usage_Hours: 'Average daily usage',
    Daily_Unlocks: 'Phone unlocks per day',
    Study_Hours: 'Study hours',
    Physical_Activity_Hours: 'Physical activity',
    Sleep_Hours_Per_Night: 'Sleep',
    Stress_Level: 'Stress level'
  };

  function showState(name) {
    Object.keys(states).forEach(function (key) {
      states[key].hidden = key !== name;
    });
  }

  function clearFieldErrors() {
    var errorSpans = form.querySelectorAll('.field-error');
    errorSpans.forEach(function (span) { span.textContent = ''; });
    var fields = form.querySelectorAll('.field.has-error');
    fields.forEach(function (field) { field.classList.remove('has-error'); });
  }

  function setFieldError(name, message) {
    var span = document.getElementById('err-' + name);
    var input = document.getElementById(name);
    if (span) span.textContent = message;
    if (input) {
      var field = input.closest('.field');
      if (field) field.classList.add('has-error');
    }
  }

  function validate(formData) {
    var errors = {};

    if (formData.Age === null || formData.Age < 10 || formData.Age > 100) {
      errors.Age = 'Enter an age between 10 and 100.';
    }
    if (!formData.Gender) errors.Gender = 'Select a gender.';
    if (!formData.Country || !formData.Country.trim()) errors.Country = 'Enter a country.';
    if (!formData.Academic_Level) errors.Academic_Level = 'Select an academic level.';
    if (!formData.Most_Used_Platform) errors.Most_Used_Platform = 'Select a platform.';
    if (!formData.Purpose_Of_Use) errors.Purpose_Of_Use = 'Select a purpose.';
    if (formData.Avg_Daily_Usage_Hours === null || formData.Avg_Daily_Usage_Hours < 0 || formData.Avg_Daily_Usage_Hours > 24) {
      errors.Avg_Daily_Usage_Hours = '0 to 24 hours.';
    }
    if (formData.Daily_Unlocks === null || formData.Daily_Unlocks < 0) {
      errors.Daily_Unlocks = 'Enter a number of 0 or more.';
    }
    if (formData.Study_Hours === null || formData.Study_Hours < 0 || formData.Study_Hours > 24) {
      errors.Study_Hours = '0 to 24 hours.';
    }
    if (formData.Physical_Activity_Hours === null || formData.Physical_Activity_Hours < 0 || formData.Physical_Activity_Hours > 24) {
      errors.Physical_Activity_Hours = '0 to 24 hours.';
    }
    if (formData.Sleep_Hours_Per_Night === null || formData.Sleep_Hours_Per_Night < 0 || formData.Sleep_Hours_Per_Night > 24) {
      errors.Sleep_Hours_Per_Night = '0 to 24 hours.';
    }
    if (!formData.Stress_Level) errors.Stress_Level = 'Select a stress level.';

    return errors;
  }

  function collectFormData() {
    var data = {
      Age: parseIntOrNull(form.Age.value),
      Gender: form.Gender.value || '',
      Country: form.Country.value || '',
      Academic_Level: form.Academic_Level.value || '',
      Most_Used_Platform: form.Most_Used_Platform.value || '',
      Purpose_Of_Use: form.Purpose_Of_Use.value || '',
      Avg_Daily_Usage_Hours: parseIntOrNull(form.Avg_Daily_Usage_Hours.value),
      Daily_Unlocks: parseIntOrNull(form.Daily_Unlocks.value),
      Study_Hours: parseIntOrNull(form.Study_Hours.value),
      Physical_Activity_Hours: parseIntOrNull(form.Physical_Activity_Hours.value),
      Sleep_Hours_Per_Night: parseIntOrNull(form.Sleep_Hours_Per_Night.value),
      Stress_Level: form.Stress_Level.value || ''
    };
    data.Country = data.Country.trim();
    return data;
  }

  function parseIntOrNull(value) {
    if (value === '' || value === null || value === undefined) return null;
    var n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }

  /* ---------- Gauge ---------- */

  var CX = 100, CY = 100, R_OUTER = 80, R_TICK_IN = 68;

  function angleForPct(pct) {
    return 180 * (1 - pct);
  }

  function buildTicks() {
    var g = document.getElementById('dial-ticks');
    if (!g) return;
    g.innerHTML = '';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (pct) {
      var rad = angleForPct(pct) * Math.PI / 180;
      var x1 = CX + R_OUTER * Math.cos(rad);
      var y1 = CY - R_OUTER * Math.sin(rad);
      var x2 = CX + R_TICK_IN * Math.cos(rad);
      var y2 = CY - R_TICK_IN * Math.sin(rad);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      g.appendChild(line);
    });
  }

  function setNeedle(pct) {
    var needle = document.getElementById('dial-needle');
    if (!needle) return;
    var deg = -90 + 180 * pct;
    needle.style.transform = 'rotate(' + deg + 'deg)';
  }

  function animateValue(el, target, duration) {
    var start = 0;
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (target - start) * eased;
      el.textContent = current.toFixed(2);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(2);
    }
    requestAnimationFrame(step);
  }

  function renderScore(score) {
    var scaleMax = score <= 10 ? 10 : 100;
    var pct = Math.max(0, Math.min(1, score / scaleMax));

    document.getElementById('score-scale').textContent = '/ ' + scaleMax;
    setNeedle(pct);
    animateValue(document.getElementById('score-value'), score, 900);

    var caption;
    if (pct < 0.34) {
      caption = 'That sits on the lower end of the scale, based on the habits you shared.';
    } else if (pct < 0.67) {
      caption = 'That sits around the middle of the scale, based on the habits you shared.';
    } else {
      caption = 'That sits on the higher end of the scale, based on the habits you shared.';
    }
    document.getElementById('score-caption').textContent = caption;
  }

  /* ---------- Submit ---------- */

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearFieldErrors();

    var payload = collectFormData();
    var clientErrors = validate(payload);

    if (Object.keys(clientErrors).length > 0) {
      Object.keys(clientErrors).forEach(function (name) {
        setFieldError(name, clientErrors[name]);
      });
      var firstField = document.getElementById(Object.keys(clientErrors)[0]);
      if (firstField) firstField.focus();
      return;
    }

    showState('loading');
    setLoading(true);

    try {
      var response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 422) {
        var errBody = await response.json();
        applyServerValidationErrors(errBody);
        showState('empty');
        return;
      }

      if (!response.ok) {
        var text = await response.text();
        throw new Error('The server responded with status ' + response.status + '. ' + text);
      }

      var result = await response.json();
      showState('success');
      renderScore(result.predicted_mental_health_score);

    } catch (err) {
      showError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  function applyServerValidationErrors(errBody) {
    if (!errBody || !Array.isArray(errBody.detail)) {
      showError('The server rejected the submitted data.');
      return;
    }
    errBody.detail.forEach(function (item) {
      var field = item.loc && item.loc[item.loc.length - 1];
      if (field && FIELD_LABELS[field]) {
        setFieldError(field, item.msg || 'Check this value.');
      }
    });
  }

  function describeError(err) {
    if (err instanceof TypeError) {
      return 'Could not reach the API at 127.0.0.1:8000. Make sure the FastAPI server is running and CORS is enabled.';
    }
    return err && err.message ? err.message : 'An unexpected error occurred.';
  }

  function showError(message) {
    document.getElementById('error-message').textContent = message;
    showState('error');
  }

  form.addEventListener('submit', handleSubmit);
  retryBtn.addEventListener('click', function () {
    showState('empty');
  });

  buildTicks();
  showState('empty');
})();

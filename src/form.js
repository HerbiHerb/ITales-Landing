import { services } from './config/services.js';
import { track } from './analytics.js';

export function initForm() {
  const form = document.getElementById('interest-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const button = form.querySelector('[type="submit"]');
  const nothingReasonField = document.getElementById('nothing-reason-field');
  const nothingReason = form.elements.nothing_reason;
  const sourceParam = new URLSearchParams(location.search).get('source');
  const source = ['home', 'game', 'editor'].includes(sourceParam) ? sourceParam : 'direct';
  form.elements.source.value = source;
  let submitting = false;
  let started = false;

  function clearErrors() {
    form.querySelectorAll('[data-error]').forEach((element) => { element.hidden = true; element.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
    status.hidden = true;
  }

  function fieldError(name, message) {
    const error = form.querySelector(`[data-error="${name}"]`);
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
    form.querySelectorAll(`[name="${name}"]`).forEach((input) => input.setAttribute('aria-invalid', 'true'));
  }

  function showStatus(message) { status.textContent = message; status.hidden = false; }

  if (!services.formEndpoint) {
    button.disabled = true;
    showStatus('Feedback will open soon. In the meantime, you can explore the Game and Editor previews.');
    return;
  }

  function syncNothingReason() {
    const selected = form.elements.interest_area.value === 'nothing';
    nothingReasonField.hidden = !selected;
    nothingReason.required = selected;
    if (!selected) {
      nothingReason.value = '';
      nothingReason.removeAttribute('aria-invalid');
      const error = form.querySelector('[data-error="nothing_reason"]');
      error.hidden = true;
      error.textContent = '';
    }
  }

  form.addEventListener('change', (event) => {
    if (event.target.name === 'interest_area') syncNothingReason();
  });
  window.addEventListener('pageshow', syncNothingReason);
  syncNothingReason();

  form.addEventListener('input', (event) => {
    if (event.target.type === 'hidden' || started) return;
    started = true;
    track('interest_form_start', { source_page: source });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    clearErrors();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const interestArea = data.get('interest_area');
    const reason = String(data.get('nothing_reason') || '').trim();
    const missingFeatures = String(data.get('missing_features') || '').trim();
    form.elements.email.value = email;
    let valid = true;
    if (!interestArea) { fieldError('interest_area', 'Please choose what interests you most.'); valid = false; }
    if (interestArea === 'nothing' && !reason) { fieldError('nothing_reason', 'Please briefly tell us why neither option interests you.'); valid = false; }
    if (!data.get('interest_rating')) { fieldError('interest_rating', 'Please choose an interest level from 1 to 5.'); valid = false; }
    if (email && !form.elements.email.validity.valid) { fieldError('email', 'Please enter a valid email address.'); valid = false; }
    if (email && !form.elements.notify_launch.checked) { fieldError('notify_launch', 'To leave your email, please agree to a launch notification, or remove your email.'); valid = false; }
    if (!email && form.elements.notify_launch.checked) { fieldError('email', 'Please enter your email to receive a launch notification, or uncheck the option.'); valid = false; }
    if (!valid) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

    // Explicitly enumerate submitted values; no browser identifiers or analytics data.
    const payload = {
      interest_area: interestArea, interest_rating: Number(data.get('interest_rating')),
      ...(interestArea === 'nothing' ? { nothing_reason: reason } : {}),
      ...(missingFeatures ? { missing_features: missingFeatures } : {}),
      feedback: String(data.get('feedback') || '').trim(), source,
      ...(email ? { email, notify_launch: true } : { notify_launch: false }),
    };
    submitting = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(services.formEndpoint, {
        method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        if (Array.isArray(result?.errors)) {
          result.errors.forEach((error) => {
            if (['interest_area', 'nothing_reason', 'interest_rating', 'email', 'notify_launch'].includes(error.field)) {
              fieldError(error.field, error.field === 'email' ? 'Please check your email address.' : 'Please check this answer and try again.');
            }
          });
        }
        showStatus(response.status === 429
          ? 'Feedback is temporarily unavailable. Your answers are still here; please try again later.'
          : 'Your feedback could not be confirmed. Your answers are still here; please try again.');
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      track('interest_submit_success', { source_page: source });
      form.hidden = true;
      const success = document.getElementById('form-success');
      success.hidden = false;
      success.focus();
    } catch (error) {
      showStatus(error.name === 'AbortError'
        ? 'The request timed out, so we could not confirm receipt. Your answers are still here. Please try again later.'
        : 'We could not connect. Your answers are still here; check your connection and try again.');
    } finally {
      window.clearTimeout(timer);
      form.removeAttribute('aria-busy');
      submitting = false;
      button.disabled = false;
      button.innerHTML = 'Send feedback <span aria-hidden="true">↗</span>';
    }
  });
}

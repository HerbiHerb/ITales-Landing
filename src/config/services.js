// Public ITales service identifiers; environment variables can override them.
const defaultFormId = 'xvkgdppk';
const defaultMeasurementId = 'G-8W3LYVD7NH';

export function serviceConfig(env) {
  const formId = (env.VITE_FORMSPREE_FORM_ID || defaultFormId).trim();
  const measurementId = (env.VITE_GA_MEASUREMENT_ID || defaultMeasurementId).trim();
  return {
    formEndpoint: /^[a-zA-Z0-9]{6,64}$/.test(formId) ? `https://formspree.io/f/${formId}` : '',
    measurementId: /^G-[A-Z0-9]{4,20}$/.test(measurementId) ? measurementId : '',
  };
}

export const services = serviceConfig(import.meta.env || {});

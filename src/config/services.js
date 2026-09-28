export function serviceConfig(env) {
  const formId = (env.VITE_FORMSPREE_FORM_ID || '').trim();
  const measurementId = (env.VITE_GA_MEASUREMENT_ID || '').trim();
  return {
    formEndpoint: /^[a-zA-Z0-9]{6,64}$/.test(formId) ? `https://formspree.io/f/${formId}` : '',
    measurementId: /^G-[A-Z0-9]{4,20}$/.test(measurementId) ? measurementId : '',
  };
}

export const services = serviceConfig(import.meta.env || {});

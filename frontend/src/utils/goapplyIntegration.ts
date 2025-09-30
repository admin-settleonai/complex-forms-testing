// GoApply Integration Helper
// This ensures form fields are properly discovered by GoApply's instrumentation

export function initializeGoApplyDiscovery() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGoApplyDiscovery);
    return;
  }

  console.log('[GoApply Integration] Initializing field discovery...');

  // Find all form inputs that need to be discovered
  const fields = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
    'textarea, ' +
    'select, ' +
    'button[aria-haspopup], ' +
    '[role="combobox"], ' +
    '[data-automation-id]'
  );

  console.log(`[GoApply Integration] Found ${fields.length} fields to register`);

  // Fire focusin event on each field to trigger GoApply's discovery
  fields.forEach((field, index) => {
    setTimeout(() => {
      // Create and dispatch a focusin event
      const focusEvent = new FocusEvent('focusin', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      field.dispatchEvent(focusEvent);
      
      // Also fire a click event for good measure
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      field.dispatchEvent(clickEvent);
      
      console.log(`[GoApply Integration] Registered field ${index + 1}:`, {
        tag: field.tagName,
        name: field.getAttribute('name'),
        id: field.getAttribute('id'),
        automationId: field.getAttribute('data-automation-id')
      });
    }, index * 50); // Stagger events to avoid overwhelming the system
  });

  // After all fields are registered, dispatch a custom event to signal completion
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('goapply-fields-ready', {
      detail: { fieldCount: fields.length }
    }));
    console.log('[GoApply Integration] Field discovery complete');
  }, fields.length * 50 + 500);
}

// Auto-initialize if GoApply is detected
if (typeof window !== 'undefined') {
  // Check for GoApply presence
  const checkGoApply = () => {
    if (window.__goapplySessionId || window.__goapplyOwnerKey || window.__goapplyPublishMirrorEvent) {
      console.log('[GoApply Integration] GoApply detected, initializing...');
      initializeGoApplyDiscovery();
    }
  };

  // Check immediately
  checkGoApply();
  
  // Also check after a short delay in case GoApply loads later
  setTimeout(checkGoApply, 1000);
  setTimeout(checkGoApply, 3000);
}

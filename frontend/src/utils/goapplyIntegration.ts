// GoApply Integration Helper
// This ensures form fields are properly discovered by GoApply's instrumentation

// Extend Window interface for GoApply properties
declare global {
  interface Window {
    __goapplySessionId?: string;
    __goapplyOwnerKey?: string;
    __goapplyPublishMirrorEvent?: Function;
  }
}

/**
 * Why Real Workday/Greenhouse Forms Work Without This:
 * 
 * 1. USER INTERACTION TIMING:
 *    - Real forms: Users click/focus fields BEFORE prefill happens
 *    - Test app: GoApply tries to prefill IMMEDIATELY on load
 * 
 * 2. NATURAL EVENT FLOW in Real Apps:
 *    - User clicks "Apply" button → navigates to form
 *    - User clicks first field to start filling
 *    - Each interaction fires focusin/click events
 *    - GoApply discovers fields through these events
 *    - Prefill happens AFTER fields are already discovered
 * 
 * 3. WORKDAY'S OWN INITIALIZATION:
 *    - Workday forms often auto-focus the first field
 *    - They have field initialization that naturally fires events
 *    - Many fields load dynamically after user interaction
 * 
 * 4. TEST APP PROBLEM:
 *    - Form loads → GoApply tries prefill immediately
 *    - No user interaction yet = No events fired
 *    - No events = No field discovery = Prefill fails
 * 
 * This helper simulates the user interactions that would
 * normally happen in real form usage.
 */
export function initializeGoApplyDiscovery() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGoApplyDiscovery);
    return;
  }

  console.log('[GoApply Integration] Initializing field discovery...');
  console.log('[GoApply Integration] Note: Real Workday forms don\'t need this because users interact with fields before prefill');

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

  // Simulate user interactions that would normally happen
  fields.forEach((field, index) => {
    setTimeout(() => {
      // Simulate user focusing on field (like clicking or tabbing to it)
      const focusEvent = new FocusEvent('focusin', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      field.dispatchEvent(focusEvent);
      
      // Simulate user clicking on field
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      field.dispatchEvent(clickEvent);
      
      console.log(`[GoApply Integration] Simulated user interaction for field ${index + 1}:`, {
        tag: field.tagName,
        name: field.getAttribute('name'),
        id: field.getAttribute('id'),
        automationId: field.getAttribute('data-automation-id')
      });
    }, index * 50); // Stagger to mimic natural user behavior
  });

  // After all fields are "interacted with", signal completion
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('goapply-fields-ready', {
      detail: { fieldCount: fields.length }
    }));
    console.log('[GoApply Integration] Field discovery complete - GoApply can now prefill');
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

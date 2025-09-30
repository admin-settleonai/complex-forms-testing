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
 * Make Test App Discovery Work Like Real Workday
 * 
 * How Workday ACTUALLY works:
 * 1. Form loads with data-automation-id attributes on all fields
 * 2. Workday auto-focuses the first text input on page load
 * 3. Fields are already in the DOM with proper attributes
 * 4. GoApply's instrumentation catches the initial focus event
 * 5. Subsequent fields get discovered as user tabs/clicks through
 * 
 * The key: Workday doesn't fire events on ALL fields - just the first one!
 * The rest get discovered naturally as the user progresses.
 */
export function initializeGoApplyDiscovery() {
  // Wait for DOM to be fully loaded, just like Workday
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGoApplyDiscovery);
    return;
  }

  console.log('[Test App] Initializing Workday-style form behavior...');

  // Step 1: Ensure all fields have proper data-automation-id (like Workday)
  const ensureAutomationIds = () => {
    const fields = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
      'textarea, select, button[aria-haspopup]'
    );

    fields.forEach((field) => {
      // Workday always has data-automation-id
      if (!field.getAttribute('data-automation-id')) {
        const name = field.getAttribute('name') || field.getAttribute('id') || '';
        if (name) {
          field.setAttribute('data-automation-id', name);
        }
      }
    });
  };

  // Step 2: Auto-focus first field (exactly what Workday does)
  const autoFocusFirstField = () => {
    // Find the first visible text input, just like Workday
    const firstField = document.querySelector(
      'input[type="text"]:not([disabled]):not([readonly]), ' +
      'input[type="email"]:not([disabled]):not([readonly]), ' +
      'input:not([type]):not([disabled]):not([readonly])'
    ) as HTMLInputElement;

    if (firstField) {
      console.log('[Test App] Auto-focusing first field (Workday behavior):', {
        name: firstField.name,
        id: firstField.id,
        automationId: firstField.getAttribute('data-automation-id')
      });

      // Use setTimeout to ensure it happens after all initialization
      setTimeout(() => {
        firstField.focus();
        
        // Workday also fires a click event on the focused field
        firstField.click();
      }, 100);
    }
  };

  // Step 3: Set up MutationObserver for dynamic fields (Workday has this)
  const observeDynamicFields = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (node as Element).matches) {
              const el = node as Element;
              // Check if it's a form field
              if (el.matches('input, select, textarea, button[aria-haspopup]')) {
                // Ensure it has automation ID
                if (!el.getAttribute('data-automation-id')) {
                  const name = el.getAttribute('name') || el.getAttribute('id') || '';
                  if (name) {
                    el.setAttribute('data-automation-id', name);
                  }
                }
              }
            }
          });
        }
      });
    });

    // Observe the entire form for changes
    const form = document.querySelector('form');
    if (form) {
      observer.observe(form, { 
        childList: true, 
        subtree: true 
      });
    }
  };

  // Execute Workday-style initialization
  ensureAutomationIds();
  autoFocusFirstField();
  observeDynamicFields();

  console.log('[Test App] Workday-style initialization complete');
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

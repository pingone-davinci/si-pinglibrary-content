/**
 * Description: This class contains common utility functions used when developing 
 * PingOne DaVinci orchestration flows. It provides methods to enhance form handling 
 * by adding required field indicators, creating password toggle buttons, setting field focus, 
 * and observing DOM changes to trigger custom handlers.
 * 
 * @docs https://library.pingidentity.com/page/davinci-form-utils
 *
 * @version 0.1.0
 * @date 2024-07-05
 *
 * @author Ping Identity (pingidentity.com)
 *
 * Copyright © 2024 Ping Identity Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @example
 * // Example of how to use the DaVinciFormUtils class in your code
 * document.addEventListener("DOMContentLoaded", () => {
 *   DaVinciFormUtils.addRequiredFieldIndicators();
 *   DaVinciFormUtils.makePasswordToggle("passwordContainer");
 *   DaVinciFormUtils.setFieldFocus("firstField");
 *   DaVinciFormUtils.createChangeObserver("observedElement", () => {
 *     console.log("Change observed!");
 *   });
 *   DaVinciFormUtils.activatePasswordValidation({
 *     passwordContainerId: 'passwordContainer',
 *     verifyPasswordContainerId: 'verifyPasswordContainer',
 *     policy: {
 *       length: { min: 8, max: 20 },
 *       minCharacters: {
 *         '0123456789': 1,
 *         'ABCDEFGHIJKLMNOPQRSTUVWXYZ': 1,
 *         'abcdefghijklmnopqrstuvwxyz': 1,
 *         '~!@#$%^&*()-_=+[]{}|;:,.<>/?': 1
 *       }
 *     },
 *     title: 'Password Must Contain',
 *     defaultStyles: true,
 *     enablePasswordToggle: true,
 *     onPasswordValid: (isValid) => { console.log('Password is valid:', isValid); },
 *     onPasswordsMatch: (doMatch) => { console.log('Passwords match:', doMatch); },
 *     onValidationSuccess: () => { console.log('Validation successful!'); }
 *   });
 * });
 */

class DaVinciFormUtils {
  /**
 * Adds a red asterisk (*) to the labels of required input, textarea, and select fields.
 * If a form ID is provided, only fields within that form will be processed.
 * If no form ID is provided, all required fields on the page will be processed.
 *
 * @param {string} [formId=null] - The ID of the form to process. If not provided, all forms are processed.
 */
  /**
   * Adds a red asterisk (*) to the labels of required input, textarea, and select fields.
   * If a form ID is provided, only fields within that form will be processed.
   * If no form ID is provided, all required fields on the page will be processed.
   *
   * @param {string} [formId=null] - The ID of the form to process. If not provided, all forms are processed.
   */
  static addRequiredFieldIndicators(formId = null) {
    let requiredFields;

    // If a form ID is provided, find the form and select required fields within it
    if (formId) {
      const form = document.getElementById(formId);
      if (form) {
        requiredFields = form.querySelectorAll("input[required], textarea[required], select[required]");
      } else {
        console.warn(`Form with ID '${formId}' not found.`);
        return;
      }
    } else {
      // If no form ID is provided, select all required fields on the page
      requiredFields = document.querySelectorAll("input[required], textarea[required], select[required]");
    }

    // Iterate over the required fields and add an asterisk to their labels if not already present
    requiredFields.forEach((field) => {
      // Get the associated label for the current field
      const label = field.labels ? field.labels[0] : null;

      // If the label exists and does not already have a red asterisk, add one
      if (label && !label.querySelector(".text-danger")) {
        const asterisk = document.createElement("span");
        asterisk.textContent = " *";
        asterisk.classList.add("text-danger");
        label.appendChild(asterisk);
      }
    });
  }



  /**
 * Creates a toggle button to show or hide the password input field.
 * This function assumes there's an input field within the specified container.
 * 
 * @param {string} id - The ID of the container element that includes the password input.
 */
  static makePasswordToggle(id) {
    // Get the container element by ID
    const container = document.getElementById(id);
    if (!container) {
      console.warn(`Container with ID '${id}' not found.`);
      return;
    }

    // Find the password input field within the container
    const passwordInput = container.querySelector("input[type='password']");
    if (!passwordInput) {
      console.warn(`Password input field not found within container with ID '${id}'.`);
      return;
    }

    // Create the toggle button
    const toggler = document.createElement("button");
    toggler.setAttribute("type", "button");
    toggler.setAttribute("aria-label", "Show/Hide Password");
    toggler.className = "btn mdi mdi-eye-off-outline position-absolute end-0 top-50 translate-middle-y";
    container.appendChild(toggler);

    /**
     * Toggles the visibility of the password input field between 'text' and 'password' types,
     * updates the toggler button's icon, and refocuses on the password field.
     */
    const showHidePassword = () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggler.classList.toggle("mdi-eye-outline", isPassword);
      toggler.classList.toggle("mdi-eye-off-outline", !isPassword);
      passwordInput.focus();
    };

    // Add click event listener to the toggler button
    toggler.addEventListener("click", showHidePassword);
  }


  /**
  * Sets the focus to an element with the given ID.
  * If the element is not found or is not focusable, a warning is logged.
  * 
  * @param {string} id - The ID of the element to focus on. Must be a non-empty string.
  */
  static setFieldFocus(id) {
    // Validate the parameter to ensure it is a non-empty string
    if (typeof id !== 'string' || id.trim() === '') {
      console.warn('Invalid ID provided. ID must be a non-empty string.');
      return;
    }

    // Get the element by ID
    const element = document.getElementById(id);

    // Check if the element exists and is focusable
    if (element) {
      if (typeof element.focus === 'function') {
        element.focus();
      } else {
        console.warn(`Element with ID ${id} is not focusable.`);
      }
    } else {
      console.warn(`Element with ID ${id} not found.`);
    }
  }


  /**
   * Creates a MutationObserver to observe changes to a specified element.
   * 
   * @param {string} id - The ID of the element to observe.
   * @param {Function} handler - The handler function to call when a change is observed.
   * @param {Object} [options] - Optional observer options (default: { childList: true, characterData: true, subtree: true }).
   * 
   * @returns {Function} A function to stop observing changes.
   */
  static createChangeObserver(id, handler, options = { childList: true, characterData: true, subtree: true }) {
    // Get the target element by ID
    const targetNode = document.getElementById(id);

    if (!targetNode) {
      console.warn(`Element with ID '${id}' not found.`);
      return () => { }; // Return a no-op function if the target element is not found
    }

    // Define the callback function for the MutationObserver
    const callback = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'characterData' || (mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
          handler(mutation);
        }
      }
    };

    // Create a new MutationObserver instance with the callback
    const observer = new MutationObserver(callback);

    // Start observing the target node with the specified options
    observer.observe(targetNode, options);

    // Return a function to stop observing changes
    return () => observer.disconnect();
  }


  /**
   * Activates password validation for specified containers and policy.
   * 
   * @param {Object} props - The properties for initializing password validation.
   * @param {string} props.passwordContainerId - The ID of the container element for the password input.
   * @param {string} props.verifyPasswordContainerId - The ID of the container element for the verify password input.
   * @param {Object|string} props.policy - The password policy to use for validation, either as an object or a JSON string.
   * @param {string} [props.title='Password Requirements'] - The title to display for the password validation popup.
   * @param {boolean} [props.defaultStyles=true] - Whether to use default styles.
   * @param {boolean} [props.enablePasswordToggle=true] - Whether to enable the password toggle feature.
   * @param {Function} props.onPasswordValid - A callback function to be called once the password is validated.
   * @param {Function} props.onPasswordsMatch - A callback function to be called once the passwords match.
   * @param {Function} props.onValidationSuccess - A callback function to be called when the password is valid and passwords match.
   */
  static activatePasswordValidation({
    passwordContainerId,
    verifyPasswordContainerId,
    policy = {},
    title = 'Password Requirements',
    defaultStyles = true,
    enablePasswordToggle = true,
    onPasswordValid,
    onPasswordsMatch,
    onValidationSuccess,
  }) {
    // Validate required parameters
    if (typeof passwordContainerId !== 'string' || typeof verifyPasswordContainerId !== 'string') {
      console.error('Invalid container IDs provided.');
      return;
    }

    // Parse policy if it's a string
    if (typeof policy === 'string') {
      try {
        policy = JSON.parse(policy);
      } catch (error) {
        console.error('Failed to parse policy string as JSON:', error);
        return;
      }
    }

    if (typeof policy !== 'object' || policy === null) {
      console.error('Invalid policy object provided.');
      return;
    }

    const passwordContainer = document.getElementById(passwordContainerId);
    const verifyPasswordContainer = document.getElementById(verifyPasswordContainerId);

    // Check if the container elements exist
    if (!passwordContainer) {
      console.error(`Container with ID "${passwordContainerId}" not found.`);
      return;
    }
    if (!verifyPasswordContainer) {
      console.error(`Container with ID "${verifyPasswordContainerId}" not found.`);
      return;
    }

    // Enable password toggle if required
    if (enablePasswordToggle) {
      DaVinciFormUtils.makePasswordToggle(passwordContainerId);
      DaVinciFormUtils.makePasswordToggle(verifyPasswordContainerId);
    }

    /**
     * Inject default styles for the password popup.
     */
    function injectDefaultStyles() {
      if (!document.getElementById('default-password-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'default-password-styles';
        styleElement.innerHTML = `
        .password-popup {
          position: absolute;
          top: -50px;
          right: -300px;
          width: 290px;
          opacity: 0;
          transform: translateY(-10px);
          z-index: 1000;
          background-color: #fff !important;
          border: 1px solid #ccc !important;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          padding: 5px !important;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .password-popup.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .password-popup ul {
          padding-left: 20px !important;
          list-style-type: none !important;
        }
        .password-popup li {
          list-style: none !important;
          margin-bottom: 8px !important;
        }
      `;
        document.head.appendChild(styleElement);
      }
    }

    /**
     * Handle input event for the password field.
     * 
     * @param {Event} event - The input event.
     * @param {Object} policy - The password policy.
     * @param {Function} callback - The callback function for validation result.
     */
    function handlePasswordInput(event, policy, callback) {
      const password = event.target.value;
      validatePassword(password, policy, callback);
      if (password) {
        showPasswordPopup();
      } else {
        hidePasswordPopup();
      }
    }

    /**
     * Handle focus event for the password field.
     * 
     * @param {Event} event - The focus event.
     */
    function handlePasswordFocus(event) {
      const password = event.target.value;
      if (password) {
        showPasswordPopup();
      }
    }

    /**
     * Handle input event for the verify password field.
     * 
     * @param {Event} event - The input event.
     * @param {Function} callback - The callback function for match result.
     */
    function handleVerifyPasswordInput(event, callback) {
      const verifyPassword = event.target.value;
      const password = event.target.closest('form').querySelector('input[type="password"]').value;
      checkPasswordsMatch(password, verifyPassword, callback);
    }

    /**
     * Validate the password based on the policy.
     * 
     * @param {string} password - The password to validate.
     * @param {Object} policy - The password policy.
     * @param {Function} callback - The callback function for validation result.
     */
    function validatePassword(password, policy, callback) {
      const minLength = policy.length?.min;
      const maxLength = policy.length?.max;
      const minCharacters = policy.minCharacters || {};

      let validationResults = [];
      let isValid = true;

      // Validate length if minLength and maxLength are defined
      if (minLength !== undefined && maxLength !== undefined) {
        if (password.length < minLength || password.length > maxLength) {
          validationResults.push({ msg: `Between ${minLength} and ${maxLength} characters`, valid: false });
          isValid = false;
        } else {
          validationResults.push({ msg: `Between ${minLength} and ${maxLength} characters`, valid: true });
        }
      }

      // Validate character sets
      const characterSets = {};
      for (const chars of Object.keys(minCharacters)) {
        characterSets[chars] = 0;
      }

      for (const char of password) {
        for (const chars of Object.keys(characterSets)) {
          if (chars.includes(char)) {
            characterSets[chars]++;
          }
        }
      }

      for (const [chars, count] of Object.entries(minCharacters)) {
        const placeholder = getPlaceholderText(chars, count);
        if (characterSets[chars] < count) {
          validationResults.push({ msg: `${placeholder}`, valid: false });
          isValid = false;
        } else {
          validationResults.push({ msg: `${placeholder}`, valid: true });
        }
      }

      updatePasswordPopup(validationResults, title);

      // Call the callback function with the validation result
      if (typeof callback === 'function') {
        callback(isValid);
      }
    }

    /**
     * Get placeholder text for the validation message.
     * 
     * @param {string} chars - The character set.
     * @param {number} count - The minimum count required.
     * @returns {string} The placeholder text.
     */
    function getPlaceholderText(chars, count) {
      const pluralize = (word, count) => count === 1 ? word : `${word}s`;
      if (chars === "0123456789") return `${count} ${pluralize('number', count)}`;
      if (chars === "ABCDEFGHIJKLMNOPQRSTUVWXYZ") return `${count} ${pluralize('uppercase character', count)}`;
      if (chars === "abcdefghijklmnopqrstuvwxyz") return `${count} ${pluralize('lowercase character', count)}`;
      if (chars === "~!@#$%^&*()-_=+[]{}|;:,.<>/?") return `${count} ${pluralize('special character', count)}`;
      return `${count} ${pluralize('character from the set', count)}: "${chars}"`;
    }

    /**
     * Check if the passwords match.
     * 
     * @param {string} password - The password.
     * @param {string} verifyPassword - The verify password.
     * @param {Function} callback - The callback function for match result.
     */
    function checkPasswordsMatch(password, verifyPassword, callback) {
      const doMatch = password === verifyPassword;

      if (typeof callback === 'function') {
        callback(doMatch);
      }
    }

    /**
     * Show the password popup.
     */
    function showPasswordPopup() {
      const popup = document.getElementById("passwordPopup");
      popup.classList.add('visible');
      popup.style.display = 'block';
    }

    /**
     * Hide the password popup.
     */
    function hidePasswordPopup() {
      const popup = document.getElementById("passwordPopup");
      popup.classList.remove('visible');
      setTimeout(() => {
        popup.style.display = 'none';
      }, 300);
    }

    /**
     * Update the password popup with validation results.
     * 
     * @param {Array} validationResults - The validation results.
     */
    function updatePasswordPopup(validationResults, title) {
      const popup = document.getElementById("passwordPopup");
      popup.innerHTML = `
      <p class="text-center fw-bold mt-3">${title}</p>
      <ul class="list-unstyled">
        ${validationResults.map(result => `
          <li class="${result.valid ? 'text-muted' : 'text-danger'}">
            <i class="${result.valid ? 'text-success mdi mdi-check-circle' : 'text-danger mdi mdi-alert-circle'}"></i>
            ${result.msg}
          </li>
        `).join('')}
      </ul>`;
    }

    let isPasswordValid = false;
    let doPasswordsMatch = false;

    /**
     * Validate both password and verify password.
     * Call the success callback if both are valid.
     */
    const validateBoth = () => {
      if (isPasswordValid && doPasswordsMatch) {
        if (typeof onValidationSuccess === 'function') {
          onValidationSuccess();
        }
      }
    };

    // Proceed with initialization if policy is not empty
    if (Object.keys(policy).length === 0) {
      console.log("Policy details are empty, unable to validate requirements");
    } else {
      // Inject default styles if required
      if (defaultStyles) {
        injectDefaultStyles();
      }

      // Create the popup div
      const popupDiv = document.createElement('div');
      popupDiv.id = 'passwordPopup';
      popupDiv.className = 'password-popup card p-2 bg-light border border-secondary';
      passwordContainer.appendChild(popupDiv);

      // Query for password fields within the containers
      const passwordField = passwordContainer.querySelector('input[type="password"]');
      const verifyPasswordField = verifyPasswordContainer.querySelector('input[type="password"]');

      // Add event listeners
      passwordField.addEventListener("input", (event) => {
        handlePasswordInput(event, policy, (isValid) => {
          isPasswordValid = isValid;
          if (typeof onPasswordValid === 'function') {
            onPasswordValid(isValid);
          }
          validateBoth();
        });
      });

      verifyPasswordField.addEventListener("input", (event) => {
        handleVerifyPasswordInput(event, (doMatch) => {
          doPasswordsMatch = doMatch;
          if (typeof onPasswordsMatch === 'function') {
            onPasswordsMatch(doMatch);
          }
          validateBoth();
        });
      });

      passwordField.addEventListener("focus", handlePasswordFocus);
      passwordField.addEventListener("blur", hidePasswordPopup);
    }
  }
}

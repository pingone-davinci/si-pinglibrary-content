/**
 * Description: This class contains common utility functions used when developing 
 * PingOne DaVinci orchestration flows. It provides methods to enhance form handling 
 * by adding required field indicators, creating password toggle buttons, setting field focus, 
 * and observing DOM changes to trigger custom handlers.
 *
 * @version 1.0.2
 * @date 2024-07-02
 *
 * @version 1.1.0
 * @date 2024-07-04
 * Added initializePasswordValidation function.
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
 *   DaVinciFormUtils.initializePasswordValidation({
 *     passwordContainerId: 'passwordContainer',
 *     verifyPasswordContainerId: 'verifyPasswordContainer',
 *     policy,
 *     defaultStyles: true,
 *     enablePasswordToggle: true,
 *     onPasswordValid: (isValid) => {
 *       console.log('Password validation result:', isValid);
 *     },
 *     onPasswordsMatch: (doMatch) => {
 *       console.log('Passwords match result:', doMatch);
 *     }
 *   });
 * });
 */

class DaVinciFormUtils {
  /**
   * Adds a red asterisk to required fields' labels to indicate they are mandatory.
   */
  static addRequiredFieldIndicators() {
    const requiredFields = document.querySelectorAll("input[required], textarea[required], select[required]");
    requiredFields.forEach((field) => {
      const label = field.labels ? field.labels[0] : null; // Get the associated label
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
    const container = document.getElementById(id);
    if (container) {
      const password = container.querySelector("input[type='password']");
      if (password) {
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
          if (password.type === "password") {
            password.type = "text";
            toggler.classList.add("mdi-eye-outline");
            toggler.classList.remove("mdi-eye-off-outline");
          } else {
            password.type = "password";
            toggler.classList.add("mdi-eye-off-outline");
            toggler.classList.remove("mdi-eye-outline");
          }
          password.focus();
        };

        toggler.addEventListener("click", showHidePassword);
      }
    }
  }

  /**
   * Sets the focus to an element with the given ID.
   * @param {string} id - The ID of the element to focus on.
   */
  static setFieldFocus(id) {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    } else {
      console.warn(`Element with ID ${id} not found.`);
    }
  }

  /**
   * Creates a MutationObserver to observe changes to a specified element.
   * @param {string} id - The ID of the element to observe.
   * @param {Function} handler - The handler function to call when a change is observed.
   */
  static createChangeObserver(id, handler) {
    const targetNode = document.getElementById(id);

    if (targetNode) {
      // Observer options
      const config = { childList: true, characterData: true, subtree: true };

      const callback = (mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'characterData' || (mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
            handler();
          }
        }
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);
    }
  }

  /**
   * Initializes password validation for specified containers and policy.
   * 
   * @param {Object} props - The properties for initializing password validation.
   * @param {string} props.passwordContainerId - The ID of the container element for the password input.
   * @param {string} props.verifyPasswordContainerId - The ID of the container element for the verify password input.
   * @param {Object} props.policy - The password policy to use for validation.
   * @param {boolean} [props.defaultStyles=true] - Whether to use default styles.
   * @param {boolean} [props.enablePasswordToggle=true] - Whether to enable the password toggle feature.
   * @param {Function} props.onPasswordValid - A callback function to be called once the password is validated.
   * @param {Function} props.onPasswordsMatch - A callback function to be called once the passwords match.
   */
  static initializePasswordValidation({
    passwordContainerId,
    verifyPasswordContainerId,
    policy = {},
    defaultStyles = true,
    enablePasswordToggle = true,
    onPasswordValid,
    onPasswordsMatch,
  }) {
    const passwordContainer = document.getElementById(passwordContainerId);
    const verifyPasswordContainer = document.getElementById(verifyPasswordContainerId);
    if (!passwordContainer) {
      console.error(`Container with ID "${passwordContainerId}" not found.`);
      return;
    }
    if (!verifyPasswordContainer) {
      console.error(`Container with ID "${verifyPasswordContainerId}" not found.`);
      return;
    }

    if (passwordContainer && enablePasswordToggle) {
      DaVinciFormUtils.makePasswordToggle(passwordContainerId);
    }

    if (verifyPasswordContainer && enablePasswordToggle) {
      DaVinciFormUtils.makePasswordToggle(verifyPasswordContainerId);
    }

    function injectDefaultStyles() {
      if (!document.getElementById('default-password-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'default-password-styles';
        styleElement.innerHTML = `
          .password-popup {
              position: absolute;
              top: -50px;
              right: -300px;
              width: 280px;
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

    function handlePasswordInput(event, policy, onPasswordValid) {
      const password = event.target.value;
      validatePassword(password, policy, onPasswordValid);
      if (password) {
        showPasswordPopup();
      } else {
        hidePasswordPopup();
      }
    }

    function handlePasswordFocus(event) {
      const password = event.target.value;
      if (password) {
        showPasswordPopup();
      }
    }

    function handleVerifyPasswordInput(event, onPasswordsMatch) {
      const verifyPassword = event.target.value;
      const password = event.target.closest('form').querySelector('input[type="password"]').value;
      checkPasswordsMatch(password, verifyPassword, onPasswordsMatch);
    }

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

      updatePasswordPopup(validationResults);

      // Call the callback function with the validation result
      if (typeof callback === 'function') {
        callback(isValid);
      }
    }

    function getPlaceholderText(chars, count) {
      const pluralize = (word, count) => count === 1 ? word : `${word}s`;
      if (chars === "0123456789") return `${count} ${pluralize('number', count)}`;
      if (chars === "ABCDEFGHIJKLMNOPQRSTUVWXYZ") return `${count} ${pluralize('uppercase character', count)}`;
      if (chars === "abcdefghijklmnopqrstuvwxyz") return `${count} ${pluralize('lowercase character', count)}`;
      if (chars === "~!@#$%^&*()-_=+[]{}|;:,.<>/?") return `${count} ${pluralize('special character', count)}`;
      return `${count} ${pluralize('character from the set', count)}: ${chars}`;
    }

    function checkPasswordsMatch(password, verifyPassword, callback) {
      const doMatch = password === verifyPassword;

      if (typeof callback === 'function') {
        callback(doMatch);
      }
    }

    function showPasswordPopup() {
      const popup = document.getElementById("passwordPopup");
      popup.classList.add('visible');
      popup.style.display = 'block';
    }

    function hidePasswordPopup() {
      const popup = document.getElementById("passwordPopup");
      popup.classList.remove('visible');
      setTimeout(() => {
        popup.style.display = 'none';
      }, 300);
    }

    function updatePasswordPopup(validationResults) {
      const popup = document.getElementById("passwordPopup");
      popup.innerHTML = `
        <p class="text-center fw-bold mt-3">Password Requirements</p>
        <ul class="list-unstyled">
            ${validationResults.map(result =>
        `<li class="${result.valid ? 'text-muted' : 'text-danger'}">
                    <i class="${result.valid ? 'text-success mdi mdi-check-circle' : 'text-danger mdi mdi-alert-circle'}"></i>
                    ${result.msg}
                </li>`
      ).join('')}
        </ul>`;
    }

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
      passwordField.addEventListener("input", (event) => handlePasswordInput(event, policy, onPasswordValid));
      verifyPasswordField.addEventListener("input", (event) => handleVerifyPasswordInput(event, onPasswordsMatch));
      passwordField.addEventListener("focus", handlePasswordFocus);
      passwordField.addEventListener("blur", hidePasswordPopup);
    }
  }
}

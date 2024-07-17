/**
 * Description: This class contains common utility functions used when developing 
 * PingOne DaVinci orchestration flows. It provides methods to enhance form handling 
 * by adding required field indicators, creating password toggle buttons, setting field focus, 
 * and observing DOM changes to trigger custom handlers.
 * 
 * @docs https://library.pingidentity.com/page/davinci-form-utils
 *
 * @version 0.4.1
 * @date 2024-07-17
 *
 * @autor Ping Identity (pingidentity.com)
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
 */

const DEFAULT_PASSWORD_POPUP_TITLE = "Password Requirements";
const PASSWORD_ERROR_MESSAGE = "Password does not meet requirements";
const FORM_TYPE_UPDATE_PASSWORD = "UPDATE_PASSWORD";
const VALID_TAGS = ['INPUT', 'SELECT', 'TEXTAREA'];
const VALID_TYPES = ['text', 'email', 'password', 'number', 'checkbox', 'radio'];

class DaVinciFormUtils {
  /**
   * Creates a toggle button to show or hide the password input field.
   * This function assumes there's an input field within the specified container.
   *
   * @param {string|HTMLElement} containerOrId - The ID of the container element or the element itself that includes the password input.
   */
  static makePasswordToggle(containerOrId) {
    let container;

    if (typeof containerOrId === "string") {
      container = document.getElementById(containerOrId);
      if (!container) {
        console.warn(`Container with ID '${containerOrId}' not found.`);
        return;
      }
    } else if (containerOrId instanceof HTMLElement) {
      container = containerOrId;
      if (!container) {
        console.warn("Provided element is null or undefined.");
        return;
      }
    } else {
      console.warn("Invalid parameter. Expected a string ID or an HTMLElement.");
      return;
    }

    const passwordInput = container.querySelector("input[type='password']");
    if (!passwordInput) {
      console.warn("Password input field not found within container.");
      return;
    }

    const toggler = document.createElement("button");
    toggler.setAttribute("type", "button");
    toggler.setAttribute("aria-label", "Show/Hide Password");
    toggler.className = "mdi mdi-eye-off-outline";
    Object.assign(toggler.style, {
      position: "absolute",
      right: "10px",
      zIndex: "2",
      background: "transparent",
      border: "none",
      outline: "none",
    });

    // Ensure the container has relative positioning
    container.style.position = "relative";

    // Insert the toggler button into the container
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

    toggler.addEventListener("click", showHidePassword);

    const adjustTogglerPosition = () => {
      const passwordRect = passwordInput.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = (passwordRect.height - toggler.offsetHeight) / 2;
      toggler.style.top = `${passwordRect.top - containerRect.top + offset + 2}px`;
    };

    // Initial adjustment
    adjustTogglerPosition();

    const observer = new MutationObserver(() => {
      adjustTogglerPosition();
    });

    observer.observe(passwordInput, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    window.addEventListener("resize", adjustTogglerPosition);
  }


  /**
   * Adds a red asterisk to the labels of required form fields.
   *
   * If a form ID is provided, the function targets required fields within that specific form.
   * If no form ID is provided, it targets all required fields on the page.
   *
   * @param {string|null} [formId=null] - The ID of the form to target. If null, all required fields on the page are targeted.
   * @returns {void}
   */
  static addRequiredFieldIndicators(formId = null) {
    let requiredFields;

    if (formId) {
      const form = document.getElementById(formId);
      if (form) {
        requiredFields = form.querySelectorAll(
          "input[required], textarea[required], select[required]"
        );
      } else {
        console.warn(`Form with ID '${formId}' not found.`);
        return;
      }
    } else {
      requiredFields = document.querySelectorAll("input[required], textarea[required], select[required]");
    }

    requiredFields.forEach((field) => {
      const label = field.labels ? field.labels[0] : null;
      if (label && !label.querySelector(".text-danger")) {
        const asterisk = document.createElement("span");
        asterisk.textContent = " *";
        asterisk.classList.add("text-danger");
        label.appendChild(asterisk);
      }
    });
  }

  /**
   * Adds custom validation to a form, including password validation, field validation messages,
   * and optional features like required field indicators, password toggle, and password policy popup.
   *
   * @param {object} options - The configuration options for custom validation.
   * @param {string} options.formId - The ID of the form to apply validation to.
   * @param {string} [options.passwordFieldContainerId] - The ID of the container holding the password field. (Optional).
   * @param {string} [options.confirmPasswordFieldContainerId] - The ID of the container holding the confirm password field. (Optional).
   * @param {object|string|null} [options.passwordPolicy=null] - The password policy to validate against. Can be an object or a JSON string. (Optional).
   * @param {function|null} [options.validationSuccessClickHandler=null] - A custom handler to call when the form is successfully validated. (Optional).
   * @param {string} [options.invalidFieldBorderColor=null] - The border color to apply to invalid fields. (Optional).
   * @param {string} [options.passwordErrorMessage=PASSWORD_ERROR_MESSAGE] - The message to display when the password does not meet the policy requirements. (Optional).
   * @param {boolean} [options.addRequiredFieldIndicators=true] - Whether to add indicators for required fields. (Optional).
   * @param {boolean} [options.setFocusOnFirstField=true] - Whether to set focus on the first field in the form. (Optional).
   * @param {boolean} [options.setFocusOnFirstError=true] - Whether to set focus on the first error field in the form on submit. (Optional).
   * @param {boolean} [options.enablePasswordToggle=true] - Whether to enable password visibility toggle. (Optional).
   * @param {boolean} [options.useDefaultStyles=true] - Use the built-in CSS for the Password Validator Popup. (Optional).
   * @param {boolean} [options.overrideDaVinciSubmit=true] - Override the default form-submit button to perform validation before submitting form. (Optional).
   * @param {string} [options.passwordPopupTitle=DEFAULT_PASSWORD_POPUP_TITLE] - The title for the password policy popup. (Optional).
   * @param {string} [options.formType=FORM_TYPE_UPDATE_PASSWORD] - The type of form, used to determine specific behaviors (e.g., "UPDATE_PASSWORD" or "STANDARD"). (Optional).
   * @param {boolean} [options.delayValidationUntilSubmit=false] - Whether to delay validation until the submit button is clicked. (Optional).
   * @param {boolean} [options.disableSubmitButtonUntilValid=false] - Whether to disable the submit button until valid. Only works when overrideDaVinciSubmit is enabled (Optional).
   * @returns {void}
   */
  static addDaVinciFormValidation({
    formId,
    passwordFieldContainerId,
    confirmPasswordFieldContainerId,
    passwordPolicy = null,
    validationSuccessClickHandler = null,
    invalidFieldBorderColor = null,
    passwordErrorMessage = PASSWORD_ERROR_MESSAGE,
    addRequiredFieldIndicators = true,
    setFocusOnFirstField = true,
    setFocusOnFirstError = true,
    enablePasswordToggle = true,
    useDefaultStyles = true,
    overrideDaVinciSubmit = true,
    passwordPopupTitle = DEFAULT_PASSWORD_POPUP_TITLE,
    formType = FORM_TYPE_UPDATE_PASSWORD,
    delayValidationUntilSubmit = false,
    disableSubmitButtonUntilValid = false
  }) {
    const form = document.getElementById(formId);
    let existingSubmitButton;
    let validationSubmitButton;
    let realTimeValidationActive = !delayValidationUntilSubmit;

    if (!form) {
      console.error(`Form with ID "${formId}" not found.`);
      return;
    }

    if (overrideDaVinciSubmit) {
      existingSubmitButton = document.querySelector('button[data-skbuttontype="form-submit"][type="submit"]');
      if (!existingSubmitButton) {
        console.error("Existing submit button not found.");
        return;
      } else if (!document.getElementById("validationSubmitButton")) {
        existingSubmitButton.classList.add("d-none");

        validationSubmitButton = document.createElement("button");
        validationSubmitButton.id = "validationSubmitButton";
        validationSubmitButton.textContent = existingSubmitButton.textContent;
        if (disableSubmitButtonUntilValid) {
          validationSubmitButton.disabled = true;
        }

        existingSubmitButton.classList.forEach((className) => {
          if (className !== "d-none") {
            validationSubmitButton.classList.add(className);
          }
        });

        validationSubmitButton.type = existingSubmitButton.type;
        existingSubmitButton.insertAdjacentElement("afterend", validationSubmitButton);
      }
    }

    form.setAttribute("novalidate", "novalidate");

    let passwordContainer;
    let passwordField;
    let confirmPasswordContainer;
    let confirmPasswordField;

    if (formType === FORM_TYPE_UPDATE_PASSWORD) {
      passwordContainer = document.getElementById(passwordFieldContainerId);
      passwordField = passwordContainer.querySelector('input[type="password"]');

      confirmPasswordContainer = document.getElementById(confirmPasswordFieldContainerId);
      confirmPasswordField = confirmPasswordContainer.querySelector('input[type="password"]');

      if (!passwordField || !confirmPasswordField) {
        console.error("Password or confirm password field not found.");
        return;
      }

      if (!passwordPolicy) {
        console.error("Password policy is required for update password forms.");
        return;
      }
    } else if (formType !== FORM_TYPE_UPDATE_PASSWORD && passwordFieldContainerId) {
      passwordContainer = document.getElementById(passwordFieldContainerId);
      passwordField = passwordContainer.querySelector('input[type="password"]');
    }

    if (formType === FORM_TYPE_UPDATE_PASSWORD) {
      if (!passwordContainer) {
        console.error(`Password container with ID "${passwordFieldContainerId}" not found.`);
        return;
      }
      if (!confirmPasswordContainer) {
        console.error(`Confirm password container with ID "${confirmPasswordFieldContainerId}" not found.`);
        return;
      }

      if (passwordPolicy) {
        if (typeof passwordPolicy === "string") {
          try {
            passwordPolicy = JSON.parse(passwordPolicy);
          } catch (error) {
            console.error("Invalid JSON string provided for passwordPolicy.");
            passwordPolicy = null;
          }
        }
      }
    }

    if (addRequiredFieldIndicators) {
      DaVinciFormUtils.addRequiredFieldIndicators(formId);
    }

    if (setFocusOnFirstField) {
      const firstField = form.querySelector("input, select, textarea");
      if (firstField) {
        firstField.focus();
      }
    }

    if (enablePasswordToggle) {
      if (passwordContainer) {
        DaVinciFormUtils.makePasswordToggle(passwordContainer);
      }
      if (confirmPasswordContainer) {
        DaVinciFormUtils.makePasswordToggle(confirmPasswordContainer);
      }
    }

    const getPlaceholderText = (chars, count) => {
      const pluralize = (word, count) => (count === 1 ? word : `${word}s`);
      if (chars === "0123456789") return `${count} ${pluralize("number", count)}`;
      if (chars === "ABCDEFGHIJKLMNOPQRSTUVWXYZ") return `${count} ${pluralize("uppercase character", count)}`;
      if (chars === "abcdefghijklmnopqrstuvwxyz") return `${count} ${pluralize("lowercase character", count)}`;
      if (chars === "~!@#$%^&*()-_=+[]{}|;:,.<>/?") return `${count} ${pluralize("special character", count)}`;
      return `${count} ${pluralize("character", count)} from the set: "${chars}"`;
    };

    const createPasswordPolicyPopup = (title) => {
      const popup = document.createElement("div");
      popup.id = "passwordPopup";
      popup.classList.add("password-popup", "text-muted");

      let popupContent = `<p class="text-center fw-bold mt-3">${title}</p><ul class="list-unstyled">`;
      const hasLengthPolicy = passwordPolicy.length && typeof passwordPolicy.length.min !== "undefined" && typeof passwordPolicy.length.max !== "undefined";

      if (hasLengthPolicy) {
        popupContent += `<li id="policy-length"><i class="mdi mdi-alert-circle me-2"></i> Be between ${passwordPolicy.length.min} and ${passwordPolicy.length.max} characters</li>`;
      }

      if (passwordPolicy.minUniqueCharacters) {
        popupContent += `<li id="policy-unique"><i class="mdi mdi-alert-circle me-2"></i> Have at least ${passwordPolicy.minUniqueCharacters} unique characters</li>`;
      }

      if (passwordPolicy.maxRepeatedCharacters) {
        popupContent += `<li id="policy-repeat"><i class="mdi mdi-alert-circle me-2"></i> No more than ${passwordPolicy.maxRepeatedCharacters} repeated characters</li>`;
      }

      for (const [characterSet, minCount] of Object.entries(passwordPolicy.minCharacters)) {
        const placeholderText = getPlaceholderText(characterSet, minCount);
        popupContent += `<li id="policy-${characterSet}"><i class="mdi mdi-alert-circle me-2"></i> ${placeholderText}</li>`;
      }

      popupContent += "</ul>";
      popup.innerHTML = popupContent;
      document.body.appendChild(popup);
    };

    const showPasswordPopup = (element) => {
      const popup = document.getElementById("passwordPopup");
      const rect = element.getBoundingClientRect();
      popup.style.top = `${rect.top + window.scrollY - 50}px`;
      popup.style.left = `${rect.right + window.scrollX + 15}px`;
      popup.classList.add("visible");
      popup.style.display = "block";
    };

    const hidePasswordPopup = () => {
      const popup = document.getElementById("passwordPopup");
      popup.classList.remove("visible");
      setTimeout(() => {
        popup.style.display = "none";
      }, 300);
    };

    const updatePasswordPolicyPopup = (password) => {
      const hasLengthPolicy = passwordPolicy.length && typeof passwordPolicy.length.min !== "undefined" && typeof passwordPolicy.length.max !== "undefined";

      if (hasLengthPolicy) {
        const lengthValid = password.length >= passwordPolicy.length.min && password.length <= passwordPolicy.length.max;
        const lengthIcon = document.getElementById("policy-length").querySelector("i");
        lengthIcon.classList.toggle("mdi-check-circle", lengthValid);
        lengthIcon.classList.toggle("mdi-alert-circle", !lengthValid);
        document.getElementById("policy-length").classList.toggle("text-success", lengthValid);
        document.getElementById("policy-length").classList.toggle("text-danger", !lengthValid);
      }

      for (const [characterSet, minCount] of Object.entries(passwordPolicy.minCharacters)) {
        const escapedCharacterSet = characterSet.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`[${escapedCharacterSet}]`, "g");
        const match = password.match(regex) || [];
        const valid = match.length >= minCount;
        const icon = document.getElementById(`policy-${characterSet}`).querySelector("i");
        icon.classList.toggle("mdi-check-circle", valid);
        icon.classList.toggle("mdi-alert-circle", !valid);
        document.getElementById(`policy-${characterSet}`).classList.toggle("text-success", valid);
        document.getElementById(`policy-${characterSet}`).classList.toggle("text-danger", !valid);
      }

      if (passwordPolicy.minUniqueCharacters) {
        const uniqueCharacters = new Set(password).size;
        const uniqueValid = uniqueCharacters >= passwordPolicy.minUniqueCharacters;
        const uniqueIcon = document.getElementById("policy-unique").querySelector("i");
        uniqueIcon.classList.toggle("mdi-check-circle", uniqueValid);
        uniqueIcon.classList.toggle("mdi-alert-circle", !uniqueValid);
        document.getElementById("policy-unique").classList.toggle("text-success", uniqueValid);
        document.getElementById("policy-unique").classList.toggle("text-danger", !uniqueValid);
      }

      if (passwordPolicy.maxRepeatedCharacters) {
        const consecutiveRepeats = password.match(/(.)\1*/g) || [];
        const maxConsecutiveRepeat = Math.max(...consecutiveRepeats.map((group) => group.length));
        const repeatValid = maxConsecutiveRepeat <= passwordPolicy.maxRepeatedCharacters;
        const repeatIcon = document.getElementById("policy-repeat").querySelector("i");
        repeatIcon.classList.toggle("mdi-check-circle", repeatValid);
        repeatIcon.classList.toggle("mdi-alert-circle", !repeatValid);
        document.getElementById("policy-repeat").classList.toggle("text-success", repeatValid);
        document.getElementById("policy-repeat").classList.toggle("text-danger", !repeatValid);
      }
    };

    function injectDefaultStyles() {
      if (!document.getElementById("default-password-styles")) {
        const styleElement = document.createElement("style");
        styleElement.id = "default-password-styles";

        styleElement.innerHTML = `
      .password-popup {
        position: absolute;
        width: 300px;
        opacity: 0;
        z-index: 1000;
        background-color: #FFFFFF !important;
        border: 1px solid #CCCCCC !important;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        padding: 5px !important;
        border-radius: 4px;
        font-size: 0.875rem;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .password-popup.visible {
        opacity: 1;
      }

      .password-popup ul {
        padding-left: 15px !important;
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

    if (formType === FORM_TYPE_UPDATE_PASSWORD) {
      createPasswordPolicyPopup(passwordPopupTitle);
      if (useDefaultStyles) {
        injectDefaultStyles();
      }
    }

    const setValidationMessage = (element, alwaysValidate = false) => {
      let message = "";
      if (element === passwordField && passwordPolicy) {
        const password = element.value;
        const validationResult = DaVinciFormUtils.validatePasswordAgainstPolicy(password, passwordPolicy, passwordErrorMessage);
        updatePasswordPolicyPopup(password);
        if (!validationResult.isValid) {
          message = validationResult.message;
        }
      } else if (element === confirmPasswordField) {
        const validationResult = DaVinciFormUtils.verifyPasswordsMatch(passwordField.value, element.value);
        if (!validationResult.isValid) {
          message = validationResult.message;
        }
      } else {
        if (element.validity.valueMissing) {
          message = element.getAttribute("data-required-message") || "This field is required.";
        } else if (element.validity.typeMismatch) {
          message = element.getAttribute("data-type-mismatch-message") || "Please enter a valid value.";
        } else if (element.validity.patternMismatch) {
          message = element.getAttribute("data-pattern-mismatch-message") || "Please follow the required pattern.";
        } else if (element.validity.tooShort) {
          message = element.getAttribute("data-too-short-message") || `Minimum length is ${element.minLength} characters.`;
        } else if (element.validity.tooLong) {
          message = element.getAttribute("data-too-long-message") || `Maximum length is ${element.maxLength} characters.`;
        } else if (element.type === "email" && !/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(element.value)) {
          message = element.getAttribute("data-email-invalid-message") || "Please enter a valid email address.";
        } else {
          message = "";
        }
      }

      if (!alwaysValidate && element !== confirmPasswordField && !element.hasAttribute("data-has-been-blurred")) {
        element.setCustomValidity("");
        return;
      }

      element.setCustomValidity(message);

      const parent = element.parentNode;
      let feedbackElement = parent.querySelector(".custom-invalid-feedback");

      if (!feedbackElement) {
        feedbackElement = document.createElement("div");
        feedbackElement.classList.add("custom-invalid-feedback", "text-danger", "mt-1");
        feedbackElement.setAttribute("aria-live", "assertive");
        parent.appendChild(feedbackElement);
      }

      feedbackElement.textContent = message;
      feedbackElement.classList.toggle("show", !!message);

      if (invalidFieldBorderColor && !element.checkValidity()) {
        element.style.borderColor = invalidFieldBorderColor;
      } else {
        element.style.borderColor = "";
      }
    };

    const validateOnChangeAndBlur = (element) => {
      let wasInvalid = false;

      element.addEventListener("input", () => {
        if (realTimeValidationActive || (formType === FORM_TYPE_UPDATE_PASSWORD && (element === passwordField || element === confirmPasswordField))) {
          if (element === passwordField && formType === FORM_TYPE_UPDATE_PASSWORD && passwordPolicy) {
            showPasswordPopup(element);
          }
          setValidationMessage(element);
          if (wasInvalid) {
            setValidationMessage(element, true);
            if (element.checkValidity()) {
              element.classList.remove("custom-invalid");
              wasInvalid = false;
            } else {
              element.classList.add("custom-invalid");
              wasInvalid = true;
            }
          }

          if (element === passwordField && confirmPasswordField && confirmPasswordField.value) {
            setValidationMessage(confirmPasswordField, true);
          }
        }

        // Enable/disable submit button based on form validity
        if (disableSubmitButtonUntilValid && validationSubmitButton) {
          validationSubmitButton.disabled = !form.checkValidity();
        }
      });

      element.addEventListener("blur", () => {
        element.setAttribute("data-has-been-blurred", "true");
        if (realTimeValidationActive || (formType === FORM_TYPE_UPDATE_PASSWORD && (element === passwordField || element === confirmPasswordField))) {
          setValidationMessage(element, true);
          if (element.checkValidity()) {
            element.classList.remove("custom-invalid");
            wasInvalid = false;
          } else {
            element.classList.add("custom-invalid");
            wasInvalid = true;
          }
          if (element === passwordField && formType === FORM_TYPE_UPDATE_PASSWORD && passwordPolicy) {
            hidePasswordPopup();
          }
        }

        // Enable/disable submit button based on form validity
        if (disableSubmitButtonUntilValid && validationSubmitButton) {
          validationSubmitButton.disabled = !form.checkValidity();
        }
      });

      if (formType === FORM_TYPE_UPDATE_PASSWORD && passwordPolicy) {
        element.addEventListener("focus", () => {
          if (element === passwordField) {
            showPasswordPopup(element);
          }
        });
      }
    };

    const isValidFormControl = (element) => {
      return VALID_TAGS.includes(element.tagName) && (element.tagName !== "INPUT" || VALID_TYPES.includes(element.type));
    };

    Array.from(form.elements).forEach((element) => {
      if (isValidFormControl(element)) {
        if (element.willValidate) {
          validateOnChangeAndBlur(element);
        }
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let allValid = true;
      let invalidElements = [];

      Array.from(form.elements).forEach((element) => {
        if (isValidFormControl(element)) {
          element.setAttribute("data-has-been-blurred", "true");
          setValidationMessage(element, true);
          if (element.checkValidity()) {
            element.classList.remove("custom-invalid");
          } else {
            element.classList.add("custom-invalid");
            invalidElements.push(element);
            allValid = false;
          }
        }
      });

      if (allValid) {
        if (existingSubmitButton) {
          existingSubmitButton.click();
        }
        if (validationSuccessClickHandler && typeof validationSuccessClickHandler === "function") {
          validationSuccessClickHandler("success");
        }

      } else {
        if (invalidElements.length > 0 && setFocusOnFirstError) {
          invalidElements[0].focus();
        }
      }

      realTimeValidationActive = true;
    });

    if (delayValidationUntilSubmit) {
      validationSubmitButton.addEventListener("click", () => {
        form.dispatchEvent(new Event("submit"));
      });
    }
  }


  /**
   * Validates a password against the given policy.
   *
   * @param {string} password - The password to validate.
   * @param {object} policy - The policy containing the validation requirements.
   * @param {string} [passwordValidationMessage=PASSWORD_ERROR_MESSAGE] - The message to return when the password does not meet the policy requirements. (Optional).
   * @returns {object} - An object with isValid (boolean) and message (string) properties.
   */
  static validatePasswordAgainstPolicy(password, policy, passwordValidationMessage = PASSWORD_ERROR_MESSAGE) {
    if (!password) {
      return { isValid: false, message: "Password is not provided" };
    }
    if (!policy) {
      return { isValid: false, message: "Policy is not provided" };
    }

    const lengthValid = password.length >= policy.length.min && password.length <= policy.length.max;
    if (!lengthValid) {
      return { isValid: false, message: passwordValidationMessage };
    }

    for (const [characterSet, minCount] of Object.entries(policy.minCharacters)) {
      const escapedCharacterSet = characterSet.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`[${escapedCharacterSet}]`, "g");
      const match = password.match(regex) || [];
      if (match.length < minCount) {
        return { isValid: false, message: passwordValidationMessage };
      }
    }

    if (policy.minUniqueCharacters) {
      const uniqueCharacters = new Set(password).size;
      if (uniqueCharacters < policy.minUniqueCharacters) {
        return { isValid: false, message: passwordValidationMessage };
      }
    }

    if (policy.maxRepeatedCharacters) {
      const consecutiveRepeats = password.match(/(.)\1*/g) || [];
      const maxConsecutiveRepeat = Math.max(...consecutiveRepeats.map((group) => group.length));
      if (maxConsecutiveRepeat > policy.maxRepeatedCharacters) {
        return { isValid: false, message: passwordValidationMessage };
      }
    }

    return { isValid: true, message: "" };
  }

  /**
   * Verifies that the password and confirm password match.
   *
   * @param {string} password - The password to verify.
   * @param {string} confirmPassword - The confirmation password to verify.
   * @returns {object} - An object with isValid (boolean) and message (string) properties.
   */
  static verifyPasswordsMatch(password, confirmPassword) {
    if (!password) {
      return { isValid: false, message: "Password is not provided" };
    }
    if (!confirmPassword) {
      return { isValid: false, message: "Confirm password is not provided" };
    }

    if (password !== confirmPassword) {
      return { isValid: false, message: "Passwords do not match" };
    }

    return { isValid: true, message: "" };
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
    const targetNode = document.getElementById(id);

    if (!targetNode) {
      console.warn(`Element with ID '${id}' not found.`);
      return () => { };
    }

    const callback = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "characterData" || (mutation.type === "childList" && mutation.addedNodes.length > 0)) {
          handler(mutation);
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, options);
    return () => observer.disconnect();
  }

  /**
   * Converts a text representation of "true" or "false" into a boolean value.
   *
   * @param {string} text - The text to convert. Should be "true" or "false" (case insensitive).
   * @returns {boolean} - Returns `true` if the text is "true" (case insensitive), `false` if the text is "false" (case insensitive).
   *                      Returns `false` for any other input.
   */
  static textToBoolean(text) {
    if (typeof text === "boolean") {
      return text;
    }
    if (typeof text === "string") {
      const lowerCaseText = text.toLowerCase();
      if (lowerCaseText === "true") {
        return true;
      } else if (lowerCaseText === "false") {
        return false;
      }
    }
    return false;
  }
}

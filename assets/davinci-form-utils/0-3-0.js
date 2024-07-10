/**
 * Description: This class contains common utility functions used when developing 
 * PingOne DaVinci orchestration flows. It provides methods to enhance form handling 
 * by adding required field indicators, creating password toggle buttons, setting field focus, 
 * and observing DOM changes to trigger custom handlers.
 * 
 * @docs https://library.pingidentity.com/page/davinci-form-utils
 *
 * @version 0.2.0
 * @date 2024-07-09
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
      // Get the container element by ID
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

    // Find the password input field within the container
    const passwordInput = container.querySelector("input[type='password']");
    if (!passwordInput) {
      console.warn(`Password input field not found within container.`);
      return;
    }

    // Create the toggle button
    const toggler = document.createElement("button");
    toggler.setAttribute("type", "button");
    toggler.setAttribute("aria-label", "Show/Hide Password");
    toggler.className =
      "btn mdi mdi-eye-off-outline position-absolute end-0 top-50 translate-middle-y";
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

    // If a form ID is provided, find the form and select required fields within it
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
   * Adds custom validation to a form, including password validation, field validation messages,
   * and optional features like required field indicators, password toggle, and password policy popup.
   *
   * @param {object} options - The configuration options for custom validation.
   * @param {string} options.formId - The ID of the form to apply validation to.
   * @param {string} [options.passwordFieldContainerId] - The ID of the container holding the password field. (Optional).
   * @param {string} [options.confirmPasswordFieldContainerId] - The ID of the container holding the confirm password field. (Optional).
   * @param {string} [options.invalidFieldBorderColor=null] - The border color to apply to invalid fields. (Optional).
   * @param {object|string|null} [options.passwordPolicy=null] - The password policy to validate against. Can be an object or a JSON string. (Optional).
   * @param {boolean} [options.addRequiredFieldIndicators=true] - Whether to add indicators for required fields. (Optional).
   * @param {boolean} [options.setFocusOnFirstField=true] - Whether to set focus on the first field in the form. (Optional).
   * @param {boolean} [options.enablePasswordToggle=true] - Whether to enable password visibility toggle. (Optional).
   * @param {boolean} [options.useDefaultStyles=true] - Use the built in CSS for the Passwordword Validator Popup (optional)
   * @param {boolean} [options.overrideDaVinciSubmit=true] - Override the default form-submit button to perform validation before submitting form. (Optional).
   * @param {string} [options.passwordPopupTitle=DEFAULT_PASSWORD_POPUP_TITLE] - The title for the password policy popup. (Optional).
   * @param {string} [options.formType=FORM_TYPE_UPDATE_PASSWORD] - The type of form, used to determine specific behaviors (e.g., "UPDATE_PASSWORD" or "STANDARD"). (Optional).
   * @param {function|null} [options.validationSuccessClickHandler=null] - A custom handler to call when the form is successfully validated. (Optional).
   * @returns {void}
   */
  static addCustomValidation({
    formId,
    passwordFieldContainerId,
    confirmPasswordFieldContainerId,
    invalidFieldBorderColor = null,
    passwordPolicy = null,
    passwordErrorMessage = PASSWORD_ERROR_MESSAGE,
    addRequiredFieldIndicators = true,
    setFocusOnFirstField = true,
    setFocusOnFirstError = true,
    enablePasswordToggle = true,
    useDefaultStyles = true,
    overrideDaVinciSubmit = true,
    passwordPopupTitle = DEFAULT_PASSWORD_POPUP_TITLE,
    formType = FORM_TYPE_UPDATE_PASSWORD,
    validationSuccessClickHandler = null,
  }) {
    const form = document.getElementById(formId);
    let existingSubmitButton;
    let validationSubmitButton;

    if (!form) {
      console.error(`Form with ID "${formId}" not found.`);
      return;
    }

    /* 
    * Hide the existing button an create a new button used for form validation.
    * This is to prevent the form from being submitted before validation.
    */
    if (overrideDaVinciSubmit) {
      existingSubmitButton = document.querySelector('button[data-skbuttontype="form-submit"][type="submit"]');

      if (!existingSubmitButton) {
        console.error("Existing submit button not found.");
        return;
      } else {
        if (btnSignIn) {
          // Add the Bootstrap 'd-none' class to hide the original button
          existingSubmitButton.classList.add('d-none');

          // Create a new button element
          validationSubmitButton = document.createElement('button');

          // Copy the properties of the original button to the new button
          validationSubmitButton.textContent = existingSubmitButton.textContent;

          // Copy all CSS classes except for 'd-none' from the original button to the new button
          existingSubmitButton.classList.forEach(className => {
            if (className !== 'd-none') {
              validationSubmitButton.classList.add(className);
            }
          });

          // Set the same type attribute for the new button
          validationSubmitButton.type = existingSubmitButton.type;

          // Insert the new button directly after the original button
          existingSubmitButton.insertAdjacentElement('afterend', validationSubmitButton);
        }
      }
    }

    // Disable HTML5 Form Validation
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
      // If a password field passed in, retrieve the element for password toggle
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

      // Prepare the password policy
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
    // Add indicators for required fields if specified
    if (addRequiredFieldIndicators) {
      DaVinciFormUtils.addRequiredFieldIndicators(formId);
    }

    // Set focus on the first form field if specified
    if (setFocusOnFirstField) {
      const firstField = form.querySelector("input, select, textarea");
      if (firstField) {
        firstField.focus();
      }
    }

    // Enable password toggle if specified
    if (enablePasswordToggle) {
      if (passwordContainer) {
        DaVinciFormUtils.makePasswordToggle(passwordContainer);
      }
      if (confirmPasswordContainer) {
        DaVinciFormUtils.makePasswordToggle(confirmPasswordContainer);
      }
    }

    // Generates a placeholder text describing the required characters and their count.
    const getPlaceholderText = (chars, count) => {
      // Helper function to pluralize a word based on the count
      const pluralize = (word, count) => (count === 1 ? word : `${word}s`);

      // Check the character set and return the appropriate placeholder text
      if (chars === "0123456789")
        return `${count} ${pluralize("number", count)}`;
      if (chars === "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        return `${count} ${pluralize("uppercase character", count)}`;
      if (chars === "abcdefghijklmnopqrstuvwxyz")
        return `${count} ${pluralize("lowercase character", count)}`;
      if (chars === "~!@#$%^&*()-_=+[]{}|;:,.<>/?")
        return `${count} ${pluralize("special character", count)}`;

      // Default case for custom character sets
      return `${count} ${pluralize("character", count)} from the set: "${chars}"`;
    };

    // Create password policy popup for update password form
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

      for (const [characterSet, minCount] of Object.entries(
        passwordPolicy.minCharacters
      )) {
        const placeholderText = getPlaceholderText(characterSet, minCount);
        popupContent += `<li id="policy-${characterSet}"><i class="mdi mdi-alert-circle me-2"></i> ${placeholderText}</li>`;
      }

      popupContent += "</ul>";

      popup.innerHTML = popupContent;
      document.body.appendChild(popup);
    };

    // Show password Popup element
    const showPasswordPopup = (element) => {
      const popup = document.getElementById("passwordPopup");


      const rect = element.getBoundingClientRect();
      popup.style.top = `${rect.top + window.scrollY - 50}px`;
      popup.style.left = `${rect.right + window.scrollX + 15}px`;
      popup.classList.add("visible");
      popup.style.display = "block";

    };


    // Hide password Popup element
    const hidePasswordPopup = () => {
      const popup = document.getElementById("passwordPopup");
      popup.classList.remove("visible");
      setTimeout(() => {
        popup.style.display = "none";
      }, 300);
    };

    // Update password policy popup with validation results
    const updatePasswordPolicyPopup = (password) => {
      // Check if length constraints exist in the policy
      const hasLengthPolicy = passwordPolicy.length && typeof passwordPolicy.length.min !== "undefined" && typeof passwordPolicy.length.max !== "undefined";

      if (hasLengthPolicy) {
        const lengthValid = password.length >= passwordPolicy.length.min && password.length <= passwordPolicy.length.max;
        const lengthIcon = document.getElementById("policy-length").querySelector("i");
        lengthIcon.classList.toggle("mdi-check-circle", lengthValid);
        lengthIcon.classList.toggle("mdi-alert-circle", !lengthValid);
        document.getElementById("policy-length").classList.toggle("text-success", lengthValid);
        document.getElementById("policy-length").classList.toggle("text-danger", !lengthValid);
      }

      // Iterate over character set requirements in the policy
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

      // Validate minimum unique characters
      if (passwordPolicy.minUniqueCharacters) {
        const uniqueCharacters = new Set(password).size;
        const uniqueValid = uniqueCharacters >= passwordPolicy.minUniqueCharacters;
        const uniqueIcon = document.getElementById("policy-unique").querySelector("i");
        uniqueIcon.classList.toggle("mdi-check-circle", uniqueValid);
        uniqueIcon.classList.toggle("mdi-alert-circle", !uniqueValid);
        document.getElementById("policy-unique").classList.toggle("text-success", uniqueValid);
        document.getElementById("policy-unique").classList.toggle("text-danger", !uniqueValid);
      }

      // Validate maximum consecutive repeated characters
      if (passwordPolicy.maxRepeatedCharacters) {
        const consecutiveRepeats = password.match(/(.)\1*/g) || [];
        const maxConsecutiveRepeat = Math.max(...consecutiveRepeats.map(group => group.length));
        const repeatValid = maxConsecutiveRepeat <= passwordPolicy.maxRepeatedCharacters;
        const repeatIcon = document.getElementById("policy-repeat").querySelector("i");
        repeatIcon.classList.toggle("mdi-check-circle", repeatValid);
        repeatIcon.classList.toggle("mdi-alert-circle", !repeatValid);
        document.getElementById("policy-repeat").classList.toggle("text-success", repeatValid);
        document.getElementById("policy-repeat").classList.toggle("text-danger", !repeatValid);
      }
    };

    /**
    * Inject default styles for the password popup.
    */
    function injectDefaultStyles() {
      if (!document.getElementById('default-password-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'default-password-styles';

        styleElement.innerHTML = ` .password-popup {
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

    // Create password policy popup for update password form
    if (formType === FORM_TYPE_UPDATE_PASSWORD) {
      createPasswordPolicyPopup(passwordPopupTitle);
      // Write needed CSS to document to render popup if provided
      if (useDefaultStyles) {
        injectDefaultStyles()
      }
    }

    // Set validation message for the given element
    const setValidationMessage = (element, alwaysValidate = false) => {
      let message = "";
      // If password field, validate against password policy
      if (element === passwordField && passwordPolicy) {
        const password = element.value;
        const validationResult = DaVinciFormUtils.validatePasswordAgainstPolicy(password, passwordPolicy, passwordErrorMessage);
        updatePasswordPolicyPopup(password);
        if (!validationResult.isValid) {
          message = validationResult.message;
        }
        // If Confirm Password field, validate against password field
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

      // Set message for the element
      element.setCustomValidity(message);

      const parent = element.parentNode;
      let feedbackElement = parent.querySelector(".custom-invalid-feedback");

      // Create feedback element if it doesn't exist
      if (!feedbackElement) {
        feedbackElement = document.createElement("div");
        feedbackElement.classList.add("custom-invalid-feedback", "text-danger", "mt-1");
        parent.appendChild(feedbackElement);
      }

      feedbackElement.textContent = message;

      feedbackElement.classList.toggle("show", !!message);

      // Change field border color if specified
      if (invalidFieldBorderColor && !element.checkValidity()) {
        element.style.borderColor = invalidFieldBorderColor;
      } else {
        element.style.borderColor = "";
      }
    };

    // Validate the element on input and blur events
    const validateOnChangeAndBlur = (element) => {
      let wasInvalid = false;

      element.addEventListener("input", () => {
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

        // If the password field changes and confirm password has text, validate confirm password
        if (element === passwordField && confirmPasswordField && confirmPasswordField.value) {
          setValidationMessage(confirmPasswordField, true);
        }
      });

      // Set blurred attribute on blur event
      element.addEventListener("blur", () => {
        element.setAttribute("data-has-been-blurred", "true");
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
      });

      // Show the password policy popup for update password form
      if (formType === FORM_TYPE_UPDATE_PASSWORD && passwordPolicy) {
        element.addEventListener("focus", () => {
          if (element === passwordField) {
            showPasswordPopup(element);
          }
        });
      }
    };

    // Utility function to check if an element is a valid form control for validation
    const isValidFormControl = (element) => {
      return VALID_TAGS.includes(element.tagName) && (element.tagName !== 'INPUT' || VALID_TYPES.includes(element.type));
    };

    Array.from(form.elements).forEach((element) => {
      if (isValidFormControl(element)) {
        // will validite required elements
        if (element.willValidate) {
          validateOnChangeAndBlur(element);
        }
      }
    });

    // Form submit event listener
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let allValid = true;
      let invalidElements = [];

      Array.from(form.elements).forEach((element) => {
        if (isValidFormControl(element)) {
          // When submit button is pressed, enable live validation on fields
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
          validationSuccessClickHandler('success');
        }
      } else {
        if (invalidElements.length > 0) {
          // Focus on first error if provided
          if (setFocusOnFirstError) {
            invalidElements[0].focus();
          }
        }
      }
    });
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
    // Ensure both password and policy are provided
    if (!password) {
      return { isValid: false, message: "Password is not provided" };
    }
    if (!policy) {
      return { isValid: false, message: "Policy is not provided" };
    }

    // Validate password length
    const lengthValid = password.length >= policy.length.min && password.length <= policy.length.max;
    if (!lengthValid) {
      return { isValid: false, message: passwordValidationMessage };
    }

    // Validate password character sets
    for (const [characterSet, minCount] of Object.entries(policy.minCharacters)) {
      const escapedCharacterSet = characterSet.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`[${escapedCharacterSet}]`, "g");
      const match = password.match(regex) || [];
      if (match.length < minCount) {
        return { isValid: false, message: passwordValidationMessage };
      }
    }

    // Validate minimum unique characters
    if (policy.minUniqueCharacters) {
      const uniqueCharacters = new Set(password).size;
      if (uniqueCharacters < policy.minUniqueCharacters) {
        return { isValid: false, message: passwordValidationMessage };
      }
    }

    // Validate maximum consecutive repeated characters
    if (policy.maxRepeatedCharacters) {
      const consecutiveRepeats = password.match(/(.)\1*/g) || [];
      const maxConsecutiveRepeat = Math.max(...consecutiveRepeats.map(group => group.length));
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
    // Ensure both password and confirm password are provided
    if (!password) {
      return { isValid: false, message: "Password is not provided" };
    }
    if (!confirmPassword) {
      return { isValid: false, message: "Confirm password is not provided" };
    }

    // Check if the passwords match
    if (password !== confirmPassword) {
      return { isValid: false, message: "Passwords do not match" };
    }

    return { isValid: true, message: "" };
  }
}

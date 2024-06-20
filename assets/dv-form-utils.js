/**
 * @fileoverview Custom Form Validation and UI Enhancements
 *
 * This file contains functions to enhance form validation, add visual indicators for required fields,
 * toggle password visibility, and set focus on specific fields.
 *
 * @version 1.0.0
 * @date 2024-06-19
 *
 * @license MIT
 *
 * @author Glen Morgan (gmorgan@pingidentity.com)
 *
 * @see Ping Identity
 *
 * @requires PingOne DaVinci
 *
 * @example
 * // Example of how to use the FormUtils class in your code
 * document.addEventListener("DOMContentLoaded", () => {
 *   DaVinciFormUtils.addCustomValidation();
 *   DaVinciFormUtils.addRequiredFieldIndicators();
 *   DaVinciFormUtils.makePasswordToggle("passwordContainer");
 *   DaVinciFormUtils.setFieldFocus("firstField");
 * });
 */

class DaVinciFormUtils {
  /**
   * Adds custom validation messages and handles form submission.
   */
  static addCustomValidation() {
    const form = document.querySelector("form.needs-validation");
    const submitButton = form.querySelector('[data-skbuttontype="form-submit"]');

    const setValidationMessage = (element) => {
      let message = "";
      if (element.validity.valueMissing) {
        message = element.getAttribute("data-required-message") || "This field is required.";
      } else if (element.validity.typeMismatch) {
        message = element.getAttribute("data-type-mismatch-message") || "Please enter a valid value.";
      } else if (element.validity.patternMismatch) {
        message = element.getAttribute("data-pattern-mismatch-message") || "Please follow the required pattern.";
      } else if (element.validity.tooShort) {
        message = element.getAttribute("data-too-short-message") || `Value is too short. Minimum length is ${element.minLength} characters.`;
      } else if (element.validity.tooLong) {
        message = element.getAttribute("data-too-long-message") || `Value is too long. Maximum length is ${element.maxLength} characters.`;
      } else {
        message = "";
      }
      element.setCustomValidity(message);

      // Update custom-invalid-feedback div with the custom message
      let feedbackElement = element.nextElementSibling;
      while (feedbackElement && !feedbackElement.classList.contains("custom-invalid-feedback")) {
        feedbackElement = feedbackElement.nextElementSibling;
      }

      if (feedbackElement && feedbackElement.classList.contains("custom-invalid-feedback")) {
        feedbackElement.textContent = message;
        feedbackElement.style.display = message ? "block" : "none";
      } else {
        console.log("Unable to locate element for", element);
      }
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let allValid = true;
      let invalidElements = [];

      // Loop through each form control
      Array.from(form.elements).forEach((element) => {
        if (element.willValidate) {
          setValidationMessage(element);
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
        // Submit the form if all fields are valid
        submitButton.click();
      } else {
        // Focus on the first invalid field
        if (invalidElements.length > 0) {
          invalidElements[0].focus();
        }
      }
    });
  }

  /**
   * Adds a red asterisk to required fields' labels to indicate they are mandatory.
   */
  static addRequiredFieldIndicators() {
    const requiredFields = document.querySelectorAll("input[required], textarea[required], select[required]");
    requiredFields.forEach((field) => {
      const label = field.labels[0]; // Get the associated label
      if (label) {
        const asterisk = document.createElement("span");
        asterisk.textContent = " *";
        asterisk.classList.add("text-danger");
        label.appendChild(asterisk);
      }
    });
  }

  /**
   * Adds a password toggle button to the input field container.
   * @param {string} id - The ID of the container element holding the password input field.
   */
  static makePasswordToggle(id) {
    let container = document.getElementById(id);

    if (container) {
      let password = container.getElementsByTagName("input")[0];
      let toggler = document.createElement("button");

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

      function showHidePassword() {
        if (password.type === "password") {
          password.setAttribute("type", "text");
          toggler.classList.add("mdi-eye-outline");
          toggler.classList.remove("mdi-eye-off-outline");
        } else {
          toggler.classList.add("mdi-eye-off-outline");
          toggler.classList.remove("mdi-eye-outline");
          password.setAttribute("type", "password");
        }
        password.focus();
      }

      toggler.addEventListener("click", showHidePassword);

      const adjustTogglerPosition = () => {
        const passwordRect = password.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = (passwordRect.height - toggler.offsetHeight) / 2;
        toggler.style.top = `${passwordRect.top - containerRect.top + offset + 2}px`;
      };

      // Initial adjustment
      adjustTogglerPosition();

      const observer = new MutationObserver(() => {
        adjustTogglerPosition();
      });

      observer.observe(password, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      window.addEventListener("resize", adjustTogglerPosition);
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
    }
  }

  /**
   * Adds custom validation messages and handles form submission.
   * V2 version will add onChange listener to re-validate on input change
   */
  static addCustomValidationV2() {
    const form = document.querySelector("form.needs-validation");
    const submitButton = form.querySelector('[data-skbuttontype="form-submit"]');

    const setValidationMessage = (element) => {
      let message = "";
      if (element.validity.valueMissing) {
        message = element.getAttribute("data-required-message") || "This field is required.";
      } else if (element.validity.typeMismatch) {
        message = element.getAttribute("data-type-mismatch-message") || "Please enter a valid value.";
      } else if (element.validity.patternMismatch) {
        message = element.getAttribute("data-pattern-mismatch-message") || "Please follow the required pattern.";
      } else if (element.validity.tooShort) {
        message = element.getAttribute("data-too-short-message") || `Value is too short. Minimum length is ${element.minLength} characters.`;
      } else if (element.validity.tooLong) {
        message = element.getAttribute("data-too-long-message") || `Value is too long. Maximum length is ${element.maxLength} characters.`;
      } else if (element.type === "email" && !/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(element.value)) {
        message = element.getAttribute("data-email-invalid-message") || "Please enter a valid email address.";
      } else {
        message = "";
      }
      element.setCustomValidity(message);

      // Update custom-invalid-feedback div with the custom message
      let feedbackElement = element.nextElementSibling;
      while (feedbackElement && !feedbackElement.classList.contains("custom-invalid-feedback")) {
        feedbackElement = feedbackElement.nextElementSibling;
      }

      if (feedbackElement && feedbackElement.classList.contains("custom-invalid-feedback")) {
        feedbackElement.textContent = message;
        feedbackElement.style.display = message ? "block" : "none";
      } else {
        console.log("Unable to locate element for", element);
      }
    };

    const validateOnChange = (element) => {
      element.addEventListener("input", () => {
        setValidationMessage(element);
        if (element.checkValidity()) {
          element.classList.remove("custom-invalid");
        } else {
          element.classList.add("custom-invalid");
        }
      });
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let allValid = true;
      let invalidElements = [];

      // Loop through each form control
      Array.from(form.elements).forEach((element) => {
        if (element.willValidate) {
          setValidationMessage(element);
          if (element.checkValidity()) {
            element.classList.remove("custom-invalid");
          } else {
            element.classList.add("custom-invalid");
            invalidElements.push(element);
            allValid = false;

            // Add onchange event listener to validate on input
            validateOnChange(element);
          }
        }
      });

      if (allValid) {
        // Submit the form if all fields are valid
        submitButton.click();
      } else {
        // Focus on the first invalid field
        if (invalidElements.length > 0) {
          invalidElements[0].focus();
        }
      }
    });
  }
}


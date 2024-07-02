/**
 * Description: This class contains common utility functions used when developing 
 * PingOne DaVinci orchestration flows. It provides methods to enhance form handling 
 * by adding required field indicators, creating password toggle buttons, setting field focus, 
 * and observing DOM changes to trigger custom handlers.
 *
 * @version 1.0.2
 * @date 2024-07-02
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
 * });
 */

class DaVinciFormUtils {
  /**
   * Adds a red asterisk to required fields' labels to indicate they are mandatory.
   */
  static addRequiredFieldIndicators(): void {
    const requiredFields = document.querySelectorAll("input[required], textarea[required], select[required]");
    requiredFields.forEach((field) => {
      const formField = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const label = formField.labels ? formField.labels[0] : null; // Get the associated label
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
   * @param id - The ID of the container element that includes the password input.
   */
  static makePasswordToggle(id: string): void {
    const container = document.getElementById(id);
    if (container) {
      const password = container.querySelector("input") as HTMLInputElement;
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
        const showHidePassword = (): void => {
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
   * @param id - The ID of the element to focus on.
   */
  static setFieldFocus(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    } else {
      console.warn(`Element with ID ${id} not found.`);
    }
  }

  /**
   * Creates a MutationObserver to observe changes to a specified element.
   * @param id - The ID of the element to observe.
   * @param handler - The handler function to call when a change is observed.
   */
  static createChangeObserver(id: string, handler: () => void): void {
    const targetNode = document.getElementById(id);

    if (targetNode) {
      // Observer options
      const config: MutationObserverInit = { childList: true, characterData: true, subtree: true };

      const callback = (mutationsList: MutationRecord[], observer: MutationObserver) => {
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
}

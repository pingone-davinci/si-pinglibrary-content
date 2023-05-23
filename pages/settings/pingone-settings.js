


const hideAllDivs = async function () {
  hideElement("settings");
  hideElement("pingoneServiceIcons");
  hideElement("pingoneServices");
}

const saveEnvironment = async function () {
  console.log("In saveEnvironment()...");
  fieldsetValues = saveFieldsetToLocalStorageArray("envNickname");
  refreshPingOneTable();
  showEnvironment(fieldsetValues.envNickname);
}

const clearAndSetRows = function (id, enableCheck) {
  const updateCheckbox = function (element, mode = "CHECK") {
    if (!element) {
      return;
    }

    element.classList.remove(mode === "CHECK" ? "fa-square-o" : "fa-check-square");
    element.classList.add(mode === "CHECK" ? "fa-check-square" : "fa-square-o")
  }

  const formTable = document.getElementById("form-table");
  if (formTable) {
    for (const e of formTable.getElementsByTagName("tr")) {
      e.classList.remove("selected");
      updateCheckbox(e.querySelector('i'), "UNCHECK")
    }

    if (id) {
      const row = document.getElementById(`nickname-${id}`);
      row.classList.add("selected");

      enableCheck && updateCheckbox(row.querySelector('i'), "CHECK")
    }
  }
}

const showEnvironment = async function (nickname) {
  nickname = unescape(nickname);
  hideAllDivs();
  PingOne.clear();
  const environment = app.SETTINGS.getProperty("pingone").find((d) => d.envNickname === nickname);

  try {
    clearAndSetRows(nickname, false);

    pingone = await PingOne.createAsync(environment);

    refreshPingOneServices();
    refreshPingOneTable();
    clearAndSetRows(nickname, true);
  } catch (err) {
    console.log("Error during showEnvironment ", err);
    redAlert(`Unable to authenticate with provided crendentials.`)
    editEnvironment(environment.envNickname);
  } finally {
  }
}

const selectEnvironment = function (event) {
  const id = event.target.value;

  const environment = pingone.getEnvironment(id);
  pingone.activeEnv = environment;
  if (pingone.activeDavinciEnv) {
    pingone.activeDavinciEnv.selectedCompany = environment.id;
    pingone.activeDavinciEnv.selectedCompanyName = environment.name;
  }
  console.log("After set...")
  console.dir(pingone);
  refreshPingOneTable();
  clearAndSetRows(pingone?.envNickname, true);
  refreshPingOneServices();
}

const addEnvironment = function () {
  PingOne.clear();
  hideAllDivs();
  clearAndSetRows(undefined, false);
  clearFieldsetItems();
  showElement("settings");
  hideElement("delete-environment")
}

const editEnvironment = function (id) {
  id = unescape(id);
  PingOne.clear();
  hideAllDivs();
  clearAndSetRows(id, false);
  populateFieldsetFromLocalStorageArray("envNickname", id);
  showElement("settings");
  showElement("delete-environment")
}

const deleteEnvironment = function () {
  console.log("In deleteEnvironment()...");

  const envSettings = app.SETTINGS.getProperty("pingone");

  const index = envSettings.findIndex(function (item) {
    return item["envNickname"] === getElementValue("envNickname");
  });

  if (index != -1) {
    envSettings.splice(index, 1);
  }

  // console.log(envSettings);
  app.SETTINGS.saveProperty(envSettings, "pingone");

  clearFieldsetItems();
  hideAllDivs();
  refreshPingOneTable();
}

const refreshPingOneServices = function () {
  clearAlert();
  clearElementHTML("pingoneServices");
  clearElementHTML("pingoneServiceIcons");
  const pingoneServices = document.getElementById("pingoneServices");
  const pingoneServiceIcons = document.getElementById("pingoneServiceIcons");

  if (pingone) {
    const envDetail = pingone.api.environments.find((e) =>
      e.id === (pingone.activeEnv?.id || pingone.envId));

    if (envDetail) {
      const products = envDetail.bom.products.sort((a, b) => {
        if (a.type === "PING_ONE_DAVINCI") {
          return -1;
        } else if (b.type === "PING_ONE_DAVINCI") {
          return 1;
        } else {
          return a.type.localeCompare(b.type); // sort alphabetically
        }
      });

      for (const p of products) {
        if (p.type !== "PING_ONE_BASE" && p.type !== "PING_ONE_DAVINCI") {
          try {
            const service = new PingOneService(p.type);
            pingoneServiceIcons.appendChild(createElement("img", "service-icon", `${service.info.icon}`));
            pingoneServiceIcons.title = service.info.name;
          }
          catch (err) {
            redAlert(`No PingOne Service card found for '${p.type}'`)
          }
        }
      }


      const service = new PingOneService("PING_ONE_BASE");
      const card = service.getCard();
      if (card) {
        pingoneServices.appendChild(card);
      }

      if (pingone.activeEnv) {
        products.forEach((p) => {
          try {
            if (p.type === "PING_ONE_DAVINCI") {
              const svc = new PingOneService(p.type);
              const card = svc.getCard();
              if (card) {
                pingoneServices.appendChild(card);
              }
            }
          } catch (err) {
            redAlert(`No PingOne Service card found for '${p.type}'`)
          }
        });
      }
    }

    const pingoneBaseSelectEnv = document.getElementById("pingoneEnvId");
    if (pingoneBaseSelectEnv) {
      pingoneBaseSelectEnv.addEventListener("change", selectEnvironment);
    }

    showElement("pingoneServiceIcons")
    showElement("pingoneServices")
  }
}

function refreshPingOneTable() {
  const admEnvs = app.SETTINGS.getProperty("pingone");
  // If number of enviroments == 0 or missing, replace with a message to add environments
  if (!admEnvs || admEnvs.length === 0) {
    setElementHTML("environment-table", "");
    return;
  }

  let table = `
    <table id="form-table" style="table-layout: auto;">
      <tr>
        <th width="1%"></th>
        <th width="1%"></th>
        <th></th>
      </tr>`;

  for (const e in admEnvs) {
    const admEnv = admEnvs[e];
    table += `
      <tr id = "nickname-${admEnv.envNickname}" >
        <td style="border: 0px;" >
          <span class="fa-stack" onclick="showEnvironment('${escape(admEnv.envNickname)}');">
            <i class="fa fa-square-o fa-stack-2x fa-inverse" style="color: #f5f5f5;"></i>
            <!-- <i class="fa fa-check fa-stack-1x fa-inverse" style="color: #white;"></i> -->
          </span>
        </td>
        <td style="border: 0px;" >
          <span class="fa-stack" onclick="editEnvironment('${escape(admEnv.envNickname)}');">
            <i class="fa fa-square fa-stack-2x fa-inverse" style="color: #4287f5;"></i>
            <i class="fa fa-pencil fa-stack-1x fa-inverse" style="color: white;"></i>
          </span>
        </td>
        <td>${admEnv.envNickname}</td>
      </tr>
    `;
  }

  table += `
    </table >`;

  setElementHTML("environment-table", table)
}


const validateUUIDv4 = function (event) {
  if (!event.target.value.isValidUUIDv4()) {
    redAlert(`'${event.target.parentNode.innerText}' must be a valid UUID"`);
  } else {
    clearAlert();
  }
}

const validateLength = function (event, len) {
  if (!(event.target.value?.length == len)) {
    redAlert(`'${event.target.parentNode.innerText}' is invalid length`);
  } else {
    clearAlert();
  }
}


async function pingone_init() {
  // Whatever
  console.log("pagescript - pingone_init()")

  const addEnvButton = document.getElementById("add-environment");
  addEnvButton.onclick = addEnvironment;

  pingone = await PingOne.getAsync();
  refreshPingOneServices();
  refreshPingOneTable();
  clearAndSetRows(pingone?.envNickname, true);
}
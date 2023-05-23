// let davinciSettingsPingOne;

// const fillPingoneEnvIdOptions = function () {
//   const select = document.getElementById("pingoneEnvId");

//   const pingoneEnvs = app.SETTINGS.getProperty("pingone");

//   console.table(pingoneEnvs);

//   let html = "<option value='' disabled>PingOne Environment</option>";
//   pingoneEnvs.forEach((e) => {
//     html += `<option value="${e.envNickname}">${e.envNickname}</option>`
//   });

//   select.innerHTML = html;
// }

// const saveTenant = function () {
//   console.log("In saveTenant()...");
//   saveFieldsetToLocalStorageArray("tenantNickname");
//   refreshTenantTable();
// }

// const addTenant = function () {
//   console.log("In addTenant()...");
//   fillPingoneEnvIdOptions();
//   showElement("settings");
//   clearFieldsetItems();

//   const saveButton = document.getElementById("save-tenant");
//   hideElement("delete-tenant")
// }

// const editTenant = function (id) {
//   console.log("In editTenant()...");
//   fillPingoneEnvIdOptions();
//   populateFieldsetFromLocalStorageArray("tenantNickname", id);
//   const formTable = document.getElementById("form-table");
//   // console.log(formTable);
//   const rows = formTable.getElementsByTagName("tr");
//   // console.log(rows);

//   for (const e of rows) {
//     e.classList.remove("selected");
//   }

//   const row = document.getElementById(`nickname-${id}`);
//   // console.log(row);
//   row.classList.add("selected");
//   showElement("settings");
//   showElement("delete-tenant")
//   // console.log(id);
// }

// const deleteTenant = function () {
//   console.log("In deleteTenant()...");
//   const tenantNickname = document.getElementById("tenantNickname");

//   const envSettings = app.SETTINGS.getProperty("davinci");

//   const index = envSettings.findIndex(function (item) {
//     return item["tenantNickname"] === tenantNickname.value;
//   });

//   if (index != -1) {
//     envSettings.splice(index, 1);
//   }

//   console.log(envSettings);
//   app.SETTINGS.saveProperty(envSettings, "davinci");

//   clearFieldsetItems();
//   hideElement("settings");
//   refreshTenantTable();
// }

// String.prototype.mask = function (start = 3, end = 3, mask = "*") {
//   if (start + end > this.length) return this;
//   return this.substring(0, start)
//     + mask.repeat(this.length - start - end)
//     + this.substring(this.length - end);
// }

// function refreshTenantTable() {
//   let formTableHTML = `
//   <table id="form-table" width="95%" align="center">
//     <tr>
//       <th>Nickname</th>
//       <th>PingOne Env</th>
//       <th>Company ID</th>
//     </tr>`;

//   const envTable = document.getElementById("tenant-table");

//   const tenants = app.SETTINGS.getProperty("davinci");

//   // If number of enviroments == 0 or missing, replace with a message to add tenants
//   if (!tenants || tenants.length === 0) {
//     envTable.innerHTML = "Press the <strong>Add Tenant</strong> button to add settings for a DaVinci Tenant"
//     return;
//   }

//   for (const e in tenants) {
//     const tenant = tenants[e];
//     const id = tenant?.pingoneEnvId;

//     // console.table(tenant);
//     const pingoneEnvId = app.SETTINGS.getProperty("pingone").find((d) => d.envNickname === id)
//       ? id
//       : `<span class="red">*** ${id} *** (Unknown)</span>`;
//     formTableHTML += `
//       <tr id="nickname-${tenant?.tenantNickname}"onclick="editTenant('${tenant?.tenantNickname}');">
//         <td>${tenant?.tenantNickname}</td>
//         <td>${pingoneEnvId}</td>
//         <td>${tenant?.companyId?.mask(4, 4) || ""}</td>
//       </tr>
//     `;
//   }

//   formTableHTML += `
//   </table>
//   `
//   envTable.innerHTML = formTableHTML;
// }

const clearDivs = function () {
  clearElementHTML("pingOne");
  clearElementHTML("davinciLogin");
}

const buildPingOneDiv = function () {
  clearDivs();
  let html;

  if (!pingone?.envNickname) {
    html = `You must first add or select your PingOne Environment in
    <a href="/page/pingonesettings">PingOne Settings</a>`;
    setElementHTML("pingOne", html);
    return;
  }

  html = TextField.create("pingoneEnv", `Selected PingOne Environment`, pingone.envNickname, false).render();

  const davinciEnvs = pingone.getEnvironmentsByProd("PING_ONE_DAVINCI");
  const davinciCompanies = {}

  setElementHTML("pingOne", html);

  console.log(pingone)
  if (pingone?.activeDavinciEnv) {
    html = TextField.create("selectedCompanyName", `Selected DaVinci Company`, pingone.activeDavinciEnv.selectedCompanyName, false).render();
    html += HiddenField.create("selectedCompany", pingone.activeDavinciEnv.selectedCompany).render();

    html += `
    <div class="centered"></div>
      <button id="change-davinci" onclick="changeDavinciCompany();" class="action-button blue">Change DaVinci Company</button>
    </div>`;
  } else {
    davinciEnvs.forEach((e) => {
      davinciCompanies[e.id] = e.name;
    })
    html = TextField.create("davinciUsername", `PingOne Admin Username`, undefined, true).render();
    html += PasswordField.create("davinciPassword", `PingOne Admin Password`, undefined, true).render();

    html += `<h3>Select DaVinci Company</h3>`
    html += SelectField.create("davinciEnvId", `DaVinci Company`, "", davinciCompanies, true, "Please select DaVinci Company").render();

    html += `
    <div class="centered"></div>
      <button id="login-davinci" onclick="loginDavinci();" class="action-button blue">Login to DaVinci Company</button>
    </div>
  `;
  }

  setElementHTML("davinciLogin", html);
}

const changeDavinciCompany = function () {
  pingone.activeDavinciEnv = undefined;
  buildPingOneDiv();
}

const loginDavinci = async function (pingOne) {
  const davinciEnvId = getElementValue("davinciEnvId");
  const username = getElementValue("davinciUsername");
  const password = getElementValue("davinciPassword");
  console.log(pingone);

  if (!davinciEnvId) {
    redAlert("DaVinci Tenent not selected")
    return;
  }

  if (!username || !password) {
    redAlert("Username/Password not provided")
    return;
  }

  clearAlert();

  loadingSpinner("Authentiating to PingOne/DaVinci...");
  try {
    await pingone.dvlogin(davinciEnvId, username, password);
    console.log(pingone);
    buildPingOneDiv();
  } catch (err) {
    redAlert("Unable to login")
  } finally {
    removeSpinner();
  }
}

async function davinci_init() {
  // Whatever
  console.log("pagescript - davinci_init()")


  loadingSpinner("Loading PingOne/DaVinci Details...");
  try {

    pingone = await PingOne.getAsync();

    buildPingOneDiv();
  } finally {
    removeSpinner();
  }
}
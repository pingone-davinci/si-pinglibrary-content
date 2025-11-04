#!/bin/sh
###################################################################
#
# This scripts helps to export the PingFederate configuration
# and signing keys from the PingFederate Admin API for use with the
# Ping Library Cloud Migration tool.
#
#   https://library.pingidentity.com/page/cloud-migration
#
# The script will prompt for the following information:
#  1. Host of the PingFederate Admin API (Example: localhost)
#  2. Port of the PingFederate Admin API (Example: 443)
#  3. API Username (Example: api-admin)
#  4. API Password
#  5. Cloud Migration Key to encrypt signing certificates
#
# Copyright © 2024 Ping Identity Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###################################################################
TMP_DIR=$(mktemp -d) &&
    SCRIPT_VERSION="1.4.3" &&
    DATE=$(date +"%y%m%d-%H%M%S") &&
    PRODUCT="pingfederate" &&
    SCRIPT="$0" &&
    CURL_ERROR_FILE="${TMP_DIR}/curl-error" && touch "${CURL_ERROR_FILE}" &&
    EXPORT_DIR="${TMP_DIR}/export/${PRODUCT}" && mkdir -p "${EXPORT_DIR}" &&
    KEYS_DIR="${EXPORT_DIR}/signingKeys" && mkdir -p "${KEYS_DIR}" &&
    ZIP_FILE="${PRODUCT}-${DATE}.zip" &&
    SUMMARY_JSON="${EXPORT_DIR}/../summary.json" && touch "${SUMMARY_JSON}"

MIN_PF_VERSION="10.3"

cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT
error() {
    echo
    echo "ERROR: ${1}"
    echo
    cat "${CURL_ERROR_FILE}"
    exit 1
}
check_command() {
    command -v "$1" 1> /dev/null 2> /dev/null
    if [ $? -ne 0 ]; then
        error "$1 command not found. Please install '$1'."
    fi
}

# Check for required commands
if [[ "$(uname)" == "Darwin" ]]; then
    check_command shasum
    SHASUM="shasum -a 256"
else
    check_command sha256sum
    SHASUM="sha256sum"
fi

check_command jq
check_command curl
check_command tr
check_command fold
check_command head
check_command grep
check_command sed
check_command sort
check_command printf
check_command cat
check_command zip
check_command mktemp
check_command uname

# OWASP safe special characters (minus any characters that make it difficult
# to use in a /bin/sh or /bin/bash command)
OWASP='!%*+,-.:=?@^_~.'

# Function to generate a random alphanumeric string of length 32
generate_key() {
    pw=""

    while true; do
        pw=$(LC_ALL=C tr -dc "a-zA-Z0-9${OWASP}" < /dev/urandom | fold -w 32 | head -n 1)

        case "$pw" in
            *[A-Z]*) : ;;
            *) continue ;;
        esac
        case "$pw" in
            *[a-z]*) : ;;
            *) continue ;;
        esac
        case "$pw" in
            *[0-9]*) : ;;
            *) continue ;;
        esac
        case "$pw" in
            *["$OWASP"]*) : ;;
            *) continue ;;
        esac
        # If we get here, all checks passed
        break
    done

    echo "$pw"
}

# Function to execute curl commands and handle errors
curl_cmd() {
    _method=${1}
    _path=${2}
    _auth=${3}
    _outfile=${4}
    _printCurl=${5:-false}

    printf "."
    url="${pfUrl}${_path}"
    _tmpJson="_tmp.json"

    curl -sS -X "${_method}" "${url}" \
        --connect-timeout 5 --max-time 20 \
        -H "Content-Type: application/json" \
        -H "X-XSRF-Header: pingfederate" \
        -d "${_auth}" \
        -u "${apiUsername}:${apiPassword}" 1> "${_tmpJson}" 2> "${CURL_ERROR_FILE}"

    if [ $? -ne 0 ]; then
        error "Failed to extract ${url}
    Possible issues:
      - Invalid HOST:PORT
      - Invalid API Username or Password
      - PingFederate Admin API is not enabled
      - Network connectivity issues (i.e. vpn)
      - Certificate issues (use ~/.curlrc with 'insecure' option)

    To debug issue, you may use the following curl command, entering your password
    when prompted.  You should see a JSON version response or an error message.

############################# cut/paste ############################

curl -v -sS -X \"${_method}\" \"${url}\" \\
    -H \"Content-Type: application/json\" \\
    -H \"X-XSRF-Header: pingfederate\" \\
    -u \"${apiUsername}\"

####################################################################"
    fi

    case "${_outfile}" in
        *.json)
            jq . "${_tmpJson}" > /dev/null 2>&1
            if [ $? -ne 0 ]; then
                error "Failed to extract ${url}
    Possible JSON issues:
        - Authentication is redirected to a login page (i.e. PingOne AS)"
            fi

            # If the output is a JSON file, we can redact sensitive information
            jq -c '
walk(
  if type == "object" then
    with_entries(
      if .key == "encryptedPassword" then
        .value = "********" | .
      elif (.value | type == "string") and (.value | startswith("OBJ:JWE:")) then
        .value = "OBF:JWE:********" | .
      else
        .
      end
    )
  elif type == "string" and startswith("OBJ:JWE:") then
    "OBF:JWE:********"
  else
    .
  end
)' "${_tmpJson}" > "${_outfile}"
            # jq -c 'walk(if type == "object" and has("encryptedPassword") then .encryptedPassword = "********" | . else . end)' "${_outfile}" > "${_outfile}"
            rm -f "${_tmpJson}"
            ;;
        *)
            mv "${_tmpJson}" "${_outfile}" 2> /dev/null
            ;;
    esac

}

# Validate the PingFederate version, erroring out if it does not meet the minimum required version
validateVersion() {
    curl_cmd GET "/version" "" "${EXPORT_DIR}/version.json"

    pfVersion=$(grep -o '"version":"[^"]*"' "${EXPORT_DIR}/version.json" | sed 's/"version":"\([^"]*\)"/\1/')

    printf "%s\n%s\n" "$MIN_PF_VERSION" "$pfVersion" > "$TMP_DIR/versions"
    if [ "$(sort -V "${TMP_DIR}/versions" | head -n1)" = "$pfVersion" ]; then
        error "PingFederate version must be ${MIN_PF_VERSION} or higher.  Current Version: $pfVersion"
    else
        printf "\r    Version: %s\n" "${pfVersion}"
    fi
}

echo "
###################################################################
#                Cloud Migration Tool (v ${SCRIPT_VERSION})                   #
#     https://library.pingidentity.com/page/cloud-migration       #
#                                                                 #
#       Extract PingFederate Configuration & Signing Certs        #
#                                                                 #
# This script exports a PingFederate configuration and signing    #
# keys from the PingFederate Admin API.                           #
#                                                                 #
# You will be prompted for the following information:             #
#                                                                 #
# 1. Host of the PingFederate Admin API (Example: localhost)      #
# 2. Port of the PingFederate Admin API (Example: 443)            #
# 3. API Username (Example: api-admin)                            #
# 4. API Password                                                 #
# 5. Cloud Migration Key to encrypt configuration                 #
#                                                                 #
# The script will then extract the configuration and signing keys #
# and save them to a zip file in the current directory.           #
###################################################################
"

# Prompt for PingFederate Admin API information
read -r -p "        What is your PingFederate Host? " pfHost && echo
read -r -p " What is your PingFederate Port [443] ? " pfPort && echo
read -r -p "             What is your api username? " apiUsername && echo
read -r -sp "             What is your api password? " apiPassword && echo

if [ -z "${pfHost}" ] || [ -z "${apiUsername}" ] || [ -z "${apiPassword}" ]; then
    error "Missing required input"
fi

if [ "${pfPort}" = "" ]; then
    pfPort="443"
fi

pfUrl="https://${pfHost}:${pfPort}/pf-admin-api/v1"

printf "\nValidating Connectivity/Version...\n    PingFederate Admin API: %s\n" "${pfUrl}"
validateVersion

echo "
###################################################################
# Protection of your configuration is IMPORTANT. This includes    #
#   - PingFederate configuration                                  #
#   - Signing Certificates                                        #
#                                                                 #
# A Cloud Migration Key will be required to protect and           #
# validate the .zip file created by this script.                  #
#                                                                 #
# A key will be generated or you can enter one as long            #
# as it meets the following policy.  To accept generated key      #
# simply press enter.  The key entered below will be              #
# displayed in summary so they can be copied for later use.       #
#                                                                 #
# KEY POLICY: Must contain:                                       #
#   - at least 10 characters                                      #
#   - at least one uppercase letter                               #
#   - at least one lowercase letter                               #
#   - at least one numeric character                              #
#   - may contain special characters                              #
#      incl: ${OWASP}                                      #
#                                                                 #
# IMPORTANT: You will be later prompted for this key:             #
#               - To upload the .zip file created by this tool    #
#               - Import of any signing certificates              #
#                 created in PingOne.                             #
#                                                                 #
#            Make note of this key as it will NOT be saved.       #
###################################################################
"

generatedKey=$(generate_key)
migKey="${generatedKey}"

# Prompt for Cloud Migration Key
while true; do
    read -r -p "Enter a Cloud Migration Key [${migKey}] ? " migKey
    echo # For newline after the key input

    if [ "${migKey}" = "" ]; then
        migKey="${generatedKey}"
    else
        generatedKey="${migKey}"
    fi

    VALID_SET="a-zA-Z0-9${OWASP}"
    if echo "$migKey" | grep -qv "^[${VALID_SET}]*$"; then
        echo "Key contains invalid characters. Allowed: a-z, A-Z, 0-9, special chars ${OWASP}"
        continue
    fi

    if ! echo "$migKey" | grep -q '[a-z]'; then
        echo "Key must contain at least one lowercase letter."
    elif ! echo "$migKey" | grep -q '[A-Z]'; then
        echo "Key must contain at least one uppercase letter."
    elif ! echo "$migKey" | grep -q '[0-9]'; then
        echo "Key must contain at least one digit."
    # elif ! echo "$migKey" | grep -q "[${OWASP}]"; then
    #     echo "Key must contain at least one special character: ${OWASP}."
    elif [ ${#migKey} -lt 10 ]; then
        echo "Key must be at least 10 characters long."
    else
        break
    fi
done

curl_cmd GET "/oauth/clients" "" "${EXPORT_DIR}/oauth-clients.json"
curl_cmd GET "/oauth/openIdConnect/policies" "" "${EXPORT_DIR}/oauth-openidconnect-policies.json"
curl_cmd GET "/oauth/accessTokenManagers" "" "${EXPORT_DIR}/oauth-accesstokenmanagers.json"
curl_cmd GET "/oauth/authServerSettings/scopes/commonScopes" "" "${EXPORT_DIR}/commonScopes.json"
curl_cmd GET "/idp/spConnections" "" "${EXPORT_DIR}/idp-spConnections.json"
curl_cmd GET "/idp/adapters" "" "${EXPORT_DIR}/idp-adapters.json"
curl_cmd GET "/idp/adapters/descriptors" "" "${EXPORT_DIR}/idp-adapters-descriptors.json"
curl_cmd GET "/authenticationPolicies/default" "" "${EXPORT_DIR}/auth-policies-default.json"
curl_cmd GET "/passwordCredentialValidators" "" "${EXPORT_DIR}/password-credential-validators.json"
curl_cmd GET "/passwordCredentialValidators/descriptors" "" "${EXPORT_DIR}/password-credential-validators-descriptors.json"
curl_cmd GET "/sp/idpConnections" "" "${EXPORT_DIR}/sp-idpConnections.json"
curl_cmd GET "/sp/adapters" "" "${EXPORT_DIR}/sp-adapters.json"
curl_cmd GET "/dataStores" "" "${EXPORT_DIR}/data-stores.json"
curl_cmd GET "/dataStores/descriptors" "" "${EXPORT_DIR}/data-stores-descriptors.json"

curl_cmd GET "/keyPairs/signing" "" "${EXPORT_DIR}/signingKeys.json"

for id in $(jq -r .items[].id "${EXPORT_DIR}/signingKeys.json"); do
    certStatus=$(jq -r ".items[] | select(.id == \"$id\") | .status" "${EXPORT_DIR}/signingKeys.json")

    if [ "${certStatus}" != "VALID" ]; then
        continue
    fi

    curl_cmd POST "/keyPairs/signing/$id/pkcs12" "{\"password\":\"${migKey}\"}" "${KEYS_DIR}/$id.p12"

    grep -q "validation_error" "${KEYS_DIR}/$id.p12" || continue

    subjectDN=$(jq -r ".items[] | select(.id == \"$id\") | .subjectDN" "${EXPORT_DIR}/signingKeys.json")
    echo "Key doesn't meet policy for ${subjectDN}.  Unable to export certificate."
    echo
done

echo
echo "
###################################################################
#                  Cloud Migration Tool Summary
#"
printf "#    Configuration File: %-40s\n" "${ZIP_FILE}"
printf "#   Cloud Migration Key: %s\n" "${migKey}"
echo "###################################################################"

SCRIPT_SHA=$($SHASUM "$0" | sed 's/ .*//')
MIG_KEY_SHA=$(printf "%s" "${migKey}" | $SHASUM | sed 's/ .*//')

cat << EOSUMMARY > "${SUMMARY_JSON}"
{
    "script": {
        "file": "${SCRIPT}",
        "version": "${SCRIPT_VERSION}",
        "uname": "$(uname -v)",
        "minVersion": "${MIN_PF_VERSION}",
        "sha": "${SCRIPT_SHA}"
    },
    "migKeySHA": "${MIG_KEY_SHA}",
    "zipFile": "${ZIP_FILE}",
    "pingfederate": {
        "uri": "${pfUrl}",
        "apiUsername": "${apiUsername}",
        "version": "${pfVersion}"
    }
}
EOSUMMARY

(cd "${EXPORT_DIR}/.." && zip -rq "${ZIP_FILE}" .)
cp "${EXPORT_DIR}/../${ZIP_FILE}" .

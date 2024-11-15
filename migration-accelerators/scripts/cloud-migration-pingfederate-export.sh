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
#  1. URI of the PingFederate Admin API
#  2. API Username (Example: api-admin)
#  3. API Password
#  4. Password to encrypt signing certificates
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
    DATE=$(date +"%y%m%d-%H%M%S") &&
    PRODUCT="pingfederate" &&
    SCRIPT="$0" &&
    SCRIPT_VERSION="1.0.0" &&
    CURL_ERROR_FILE="${TMP_DIR}/curl-error" && touch "${CURL_ERROR_FILE}" &&
    EXPORT_DIR="${TMP_DIR}/export/${PRODUCT}" && mkdir -p "${EXPORT_DIR}" &&
    KEYS_DIR="${EXPORT_DIR}/signingKeys" && mkdir -p "${KEYS_DIR}" &&
    ZIP_FILE="${PRODUCT}-${DATE}.zip" &&
    SUMMARY_JSON="${EXPORT_DIR}/../summary.json" && touch "${SUMMARY_JSON}"

MIN_PF_VERSION="11.3"

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
check_command shasum

# Function to generate a random alphanumeric string of length 12
generate_password() {
    pw=""

    while true; do
        pw=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 12 | head -n 1)

        if echo "$pw" | grep -q '[A-Z]' && echo "$pw" | grep -q '[a-z]' && echo "$pw" | grep -q '[0-9]'; then
            break
        fi
    done

    echo "$pw"
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
# 1. URI of the PingFederate Admin API                            #
# 2. API Username (Example: api-admin)                            #
# 3. API Password                                                 #
# 4. Password to encrypt signing certificates                     #
#                                                                 #
# The script will then extract the configuration and signing keys #
# and save them to a zip file in the current directory.           #
# To protect the security of encrypted signing certs, a password  #
# will be generated or you can enter one for each cert.           #
###################################################################
"

read -r -p "          What is your URI? " uri && echo
read -r -p " What is your api username? " apiUsername && echo
read -r -sp " What is your api password? " apiPassword && echo

if [ -z "${uri}" ] || [ -z "${apiUsername}" ] || [ -z "${apiPassword}" ]; then
    error "Missing required input"
fi

echo "
###################################################################
# Protection of your configuration is IMPORTANT. This includes    #
#   - PingFederate configuration                                  #
#   - Signing Certificates                                        #
#                                                                 #
# A Migration Password will be required to protect and           #
# validate the .zip file created by this script.                  #
#                                                                 #
# A password will be generated or you can enter one as long       #
# as it meets the following policy.  To accept generated password #
# simply press enter.  The password entered below will be         #
# displayed in summary so they can be copied for later use.       #
#                                                                 #
# PASSWORD POLICY: Must contain:                                  #
#   - at least 8 characters                                       #
#   - at least one uppercase letter                               #
#   - at least one lowercase letter                               #
#   - at least one numeric character                              #
#                                                                 #
# IMPORTANT: You will be later prompted for this password:        #
#               - To upload the .zip file created by this tool    #
#               - Import of any signing certificates              #
#                 created in PingOne.                             #
#                                                                 #
#            Make note of this password as it will NOT be saved.  #
###################################################################
"

generatedPassword=$(generate_password)
migPassword="${generatedPassword}"

while true; do
    read -r -p "Enter a Migration password [${migPassword}] ? " migPassword
    echo # For newline after the password input

    if [ "${migPassword}" = "" ]; then
        migPassword="${generatedPassword}"
    else
        generatedPassword="${migPassword}"
    fi

    if ! echo "$migPassword" | grep -q '[a-z]'; then
        echo "Password must contain at least one lowercase letter."
    elif ! echo "$migPassword" | grep -q '[A-Z]'; then
        echo "Password must contain at least one uppercase letter."
    elif ! echo "$migPassword" | grep -q '[0-9]'; then
        echo "Password must contain at least one digit."
    elif [[ ${#migPassword} -lt 8 ]]; then
        echo "Password must be at least 8 characters long."
    else
        break
    fi
done

curl_cmd() {
    printf "."
    #echo "     extracting: ${2}..."
    url="${uri}/pf-admin-api/v1${2}"
    curl -sS -X $1 "${url}" \
        --connect-timeout 5 --max-time 20 \
        -H "Content-Type: application/json" \
        -H "X-XSRF-Header: pingfederate" \
        -d "$3" \
        -u "${apiUsername}:${apiPassword}" 1> "${4}" 2> "${CURL_ERROR_FILE}"

    if [ $? -ne 0 ]; then
        error "Failed to extract ${url}
    Possble issues:
      - Invalid URI
      - Invalid API Username or Password
      - PingFederate Admin API is not enabled
      - Network connectivity issues (i.e. vpn)
      - Certificate issues (use ~/.curlrc with insecure option)"
    fi
}

isValidVersion() {
    version=$1

    printf "%s\n%s\n" "$MIN_PF_VERSION" "$version" > "$TMP_DIR/versions"
    if [ "$(sort -V "$TMP_DIR/versions" | head -n1)" = "$MIN_PF_VERSION" ]; then
        return 0 # Version is greater than or equal to min_version
    else
        return 1 # Version is less than min_version
    fi
}

echo
echo "Exporting configuration..."
echo "      URL: ${uri}"
curl_cmd GET "/version" "" "${EXPORT_DIR}/version.json"

pfVersion=$(grep -o '"version":"[^"]*"' "${EXPORT_DIR}/version.json" | sed 's/"version":"\([^"]*\)"/\1/')

if ! isValidVersion "${pfVersion}"; then
    error "PingFederate version must be ${MIN_PF_VERSION} or higher.  Current Version: $pfVersion"
else
    printf "\r  Version: %s\n" "${pfVersion}"
fi

curl_cmd GET "/oauth/clients" "" "${EXPORT_DIR}/oauth-clients.json"
curl_cmd GET "/idp/spConnections" "" "${EXPORT_DIR}/idp-spConnections.json"
curl_cmd GET "/configStore/cors-configuration" "" "${EXPORT_DIR}/cors-configuration.json"

curl_cmd GET "/keyPairs/signing" "" "${EXPORT_DIR}/signingKeys.json"

for id in $(jq -r .items[].id "${EXPORT_DIR}/signingKeys.json"); do
    subjectDN=$(jq -r ".items[] | select(.id == \"$id\") | .subjectDN" "${EXPORT_DIR}/signingKeys.json")
    certStatus=$(jq -r ".items[] | select(.id == \"$id\") | .status" "${EXPORT_DIR}/signingKeys.json")

    if [ "${certStatus}" != "VALID" ]; then
        continue
    fi

    curl_cmd POST "/keyPairs/signing/$id/pkcs12" "{\"password\":\"${migPassword}\"}" "${KEYS_DIR}/$id.p12"

    grep -q "validation_error" "${KEYS_DIR}/$id.p12" || continue

    echo "Password doesn't meet policy for ${subjectDN}.  Unable to export certificate."
    echo
done

echo
echo "
###################################################################
#                  Cloud Migration Tool Summary
#"
printf "#    Configuration File: %-40s\n" "${ZIP_FILE}"
printf "#    Migration Password: %s\n" "${migPassword}"
echo "###################################################################"

SCRIPT_SHA=$(shasum -U -a 256 "$0" | sed 's/ .*//')
MIG_PW_SHA=$(printf "%s" "${migPassword}" | shasum -U -a 256 | sed 's/ .*//')

cat << EOSUMMARY > "${SUMMARY_JSON}"
{
    "script": {
        "file": "${SCRIPT}",
        "version": "${SCRIPT_VERSION}",
        "uname": "$(uname -v)",
        "minVersion": "${MIN_PF_VERSION}",
        "sha": "${SCRIPT_SHA}"
    },
    "migPWSHA": "${MIG_PW_SHA}",
    "zipFile": "${ZIP_FILE}",
    "pingfederate": {
        "uri": "${uri}",
        "apiUsername": "${apiUsername}"
    }
}
EOSUMMARY

(cd "${EXPORT_DIR}/.." && zip -rq "${ZIP_FILE}" .)
cp "${EXPORT_DIR}/../${ZIP_FILE}" .

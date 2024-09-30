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
    PRODUCT="pingfederate" &&
    EXPORT_DIR="${TMP_DIR}/${PRODUCT}" && mkdir -p "${EXPORT_DIR}" &&
    KEYS_DIR="${EXPORT_DIR}/signingKeys" && mkdir -p "${KEYS_DIR}" &&
    ZIP_FILE="${PRODUCT}-$(date +"%y%m%d-%H%M%S").zip"

MIN_PF_VERSION="11.3"

cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT
error() {
    echo
    echo "ERROR: ${1}"
    echo
    exit 1
}

echo "
###################################################################
#                    Cloud Migration Tool                         #
#     https://library.pingidentity.com/page/cloud-migration       #
#                                                                 #
#       Extract PingFederate Configuration & Signing Keys         #
#                                                                 #
# This script exports a PingFederate configuration and signing    #
# keys from the PingFederate Admin API.                           #
#                                                                 #
# You will be prompted for the following information:             #
#                                                                 #
# 1. URI of the PingFederate Admin API                            #
# 2. API Username (Example: api-admin)                            #
# 3. API Password                                                 #
#                                                                 #
# The script will then extract the configuration and signing keys #
# and save them to a zip file in the current directory.           #
###################################################################
"

read -r -p "          What is your URI? " uri && echo
read -r -p " What is your api username? " apiUsername && echo
read -r -sp " What is your api password? " apiPassword && echo

if [ -z "${uri}" ] || [ -z "${apiUsername}" ] || [ -z "${apiPassword}" ]; then
    error "Missing required input"
fi

uri="https://pingfederate-admin-facile-migration-assistant.ping-devops.com"
apiUsername="api-admin"
apiPassword="2FederateM0re"

curl_cmd() {
    echo "     extracting: ${2}..."
    url="${uri}/pf-admin-api/v1${2}"
    curl -X $1 "${url}" \
        --connect-timeout 5 --max-time 20 \
        -H "Content-Type: application/json" \
        -H "X-XSRF-Header: pingfederate" \
        -d "$3" \
        -u ${apiUsername}:${apiPassword} 1> "${4}" 2> /dev/null

    if [ $? -ne 0 ]; then
        error "Failed to extract ${url}"
    fi
}

isValidVersion() {
    version=$1

    printf "%s\n%s\n" "$MIN_PF_VERSION" "$version" > $TMP_DIR/versions
    if [ "$(cat $TMP_DIR/versions | sort -V | head -n1)" = "$MIN_PF_VERSION" ]; then
        return 0 # Version is greater than or equal to min_version
    else
        return 1 # Version is less than min_version
    fi
}

echo
echo "Exporting configuration..."
echo "  connecting to: ${uri}"
curl_cmd GET "/version" "" "${EXPORT_DIR}/version.json"

pfVersion=$(cat "${EXPORT_DIR}/version.json" | grep -o '"version":"[^"]*"' | sed 's/"version":"\([^"]*\)"/\1/')
echo "pfVersion = ${pfVersion}"
if ! isValidVersion "${pfVersion}"; then
    error "PingFederate version must be ${MIN_PF_VERSION} or higher.  Current Version: $pfVersion"
fi

curl_cmd GET "/bulk/export" "" "${EXPORT_DIR}/bulk-export.json"
curl_cmd GET "/oauth/clients" "" "${EXPORT_DIR}/oauth-clients.json"
curl_cmd GET "/idp/spConnections" "" "${EXPORT_DIR}/idp-spConnections.json"
curl_cmd GET "/configStore/cors-configuration" "" "${EXPORT_DIR}/cors-configuration.json"

curl_cmd GET "/keyPairs/signing" "" "${EXPORT_DIR}/signingKeys.json"

for id in $(cat "${EXPORT_DIR}/signingKeys.json" | jq -r .items[].id); do
    curl_cmd POST "/keyPairs/signing/$id/pkcs12" "{\"password\":\"${apiPassword}\"}" "${KEYS_DIR}/$id.p12"
done

(cd "${EXPORT_DIR}/.." && zip -rq "${ZIP_FILE}" "${PRODUCT}")
cp "${EXPORT_DIR}/../${ZIP_FILE}" .
echo
echo "Save configration to: ${ZIP_FILE}"
echo
echo "You can now upload this to the Ping Library Cloud Migration tool"


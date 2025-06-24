#!/bin/sh
###################################################################
#
# This script helps to manage the deployment of resources into a
# a destination (i.e. PingOne or Ping AIC).
#
#   https://library.pingidentity.com/page/cloud-migration
#
# The script is bundled with a set of terraform plans that can be
# used to deploy resources into a PingOne instance.
#
# Copyright © 2025 Ping Identity Corporation
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
    SCRIPT_VERSION="0.9.0" &&
    FRODO_DIR="frodo" &&
    FRODO="frodo"

cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT
error() {
    echo
    echo "ERROR: ${1}"
    echo
    exit 1
}
check_command() {
    command -v "$1" 1> /dev/null 2> /dev/null
    if [ $? -ne 0 ]; then
        error "$1 command not found. Please install '$1'."
    fi
}

check_command frodo
check_command jq
check_command tr
check_command printf
check_command cat
check_command mktemp

# Function to Display Terraform Details
display_frodo_details() {
    echo "###########################################"
    echo "#  Frodo Connections                      #"
    echo "###########################################"

    frodo connections list
}

DISPLAY_FRODO_CONNECTIONS="frodo conn list"
DESCRIBE_CURRENT_CONNECTION="frodo conn describe ${FRODO_HOST}"
DISPLAY_OAUTH_CLIENTS="frodo oauth client list"
IMPORT_OAUTH_CLIENTS="frodo oauth client import --all --file ${FRODO_DIR}/application.json"

# Function to display the top menu
top_menu() {
    clear
    echo "##############################################################"
    echo "#  Cloud Migration Tool (v ${SCRIPT_VERSION})                            #"
    echo "#                                                            #"
    printf "#   FRODO_HOST: %s\n" "${FRODO_HOST}"
    printf "#  FRODO_REALM: %s\n" "${FRODO_REALM}"
    echo "##############################################################"
    echo "#  1. Display Frodo Connections          > ${DISPLAY_FRODO_CONNECTIONS}"
    echo "#  2. Describe Current Connection        > ${DESCRIBE_CURRENT_CONNECTION}"
    echo "#                                                            #"
    echo "##############################################################"
    echo "#  OAuth Client                                              #"
    echo "##############################################################"
    echo "#  10. Display Current OAuth Clients     > ${DISPLAY_OAUTH_CLIENTS}"
    echo "#  11. Migratable OAuth Clients"
    echo "#  12. Import OAuth Clients              > ${IMPORT_OAUTH_CLIENTS}"
    echo "#                                                            #"
    echo "#  Q: Quit                                                   #"
    echo "##############################################################"
}

header() {
    echo "##############################################################"
    printf "# %s\n" "${1}"
    echo "##############################################################"
    echo ""
}
# Function to execute the command based on top menu
execute_choice() {
    case $1 in
        1)
            header "Frodo Connections"
            ${DISPLAY_FRODO_CONNECTIONS}
            ;;
        2)
            header "Current Connection"
            ${DESCRIBE_CURRENT_CONNECTION}
            ;;
        10)
            header "Current OAuth Clients"
            ${DISPLAY_OAUTH_CLIENTS}
            ;;
        11)
            header "Migratable OAuth Clients"
            jq -r '.application | to_entries | map(select(.value._provider._type._id == "oauth-oidc")) | map(.key) | .[]' < "${FRODO_DIR}/application.json"
            ;;
        12)
            header "Importing OAuth Clients"
            ${IMPORT_OAUTH_CLIENTS}
            ;;
        Q | q)
            exit
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
}

# cd ${TERRAFORM_DIR}
${TERRAFORM} init > /dev/null

# Main Loop
while true; do
    top_menu
    printf "\nEnter your choice: "
    read choice
    echo ""
    execute_choice $choice
    echo ""
    printf "Press Enter to continue..."
    read _dummy
    clear
done
